// Loads every story of a running Storybook in headless Chromium and reports the stories that render no SVG, the
// uncaught errors, the console errors and the failed requests. Exits 1 when anything is reported, 2 when the check
// cannot run.
// Usage: node check-stories.mjs <storybook base url>
import { chromium } from 'playwright-core';

const [baseUrl] = process.argv.slice(2);
const storyRenderTimeoutInMs = 5000;
const managerRenderTimeoutInMs = 30000;

const exitWithSetupError = (message) => {
  console.log(message);
  process.exit(2);
};

// The local Google Chrome needs no download and Playwright finds it on Linux, macOS and Windows. The Chromium of
// Playwright is the fallback, when it was already downloaded.
const launchBrowser = async () => {
  const candidates = process.env.CHROMIUM_PATH
    ? [
        {
          label: `CHROMIUM_PATH ${process.env.CHROMIUM_PATH}`,
          options: { executablePath: process.env.CHROMIUM_PATH },
        },
      ]
    : [
        { label: 'local Google Chrome', options: { channel: 'chrome' } },
        { label: 'Playwright Chromium', options: {} },
      ];
  for (const candidate of candidates) {
    try {
      const browser = await chromium.launch(candidate.options);
      console.log(`browser: ${candidate.label} ${browser.version()}`);
      return browser;
    } catch {
      // try the next candidate
    }
  }
  exitWithSetupError(
    'No browser found: install Google Chrome, set CHROMIUM_PATH, or run "npx playwright-core install --only-shell chromium" outside the repository'
  );
};

const indexResponse = await fetch(`${baseUrl}/index.json`).catch((error) => error);
if (!indexResponse.ok) {
  exitWithSetupError(
    `cannot read ${baseUrl}/index.json: ${indexResponse.status ?? indexResponse.message}`
  );
}
const storyIds = Object.values((await indexResponse.json()).entries)
  .filter((entry) => entry.type === 'story')
  .map((entry) => entry.id);

const browser = await launchBrowser();
const problems = [];

// One browser context per page, so that the cache of a previous story never hides a failed request
const openPage = async (label) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', (error) =>
    problems.push(`${label} uncaught error: ${error.message}`)
  );
  page.on('console', (message) => {
    // Failed requests are reported by the listeners below with their URL, the console message does not carry it.
    if (
      message.type() === 'error' &&
      !message.text().startsWith('Failed to load resource')
    ) {
      problems.push(`${label} console error: ${message.text()}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      problems.push(
        `${label} HTTP ${response.status()}: ${response.url().replace(baseUrl, '')}`
      );
    }
  });
  page.on('requestfailed', (request) => {
    // Aborted requests are the ones cut by a navigation or by closing the page, not failures of the story
    const errorText = request.failure()?.errorText ?? '';
    if (!errorText.includes('ERR_ABORTED')) {
      problems.push(
        `${label} request failed: ${request.url().replace(baseUrl, '')} ${errorText}`
      );
    }
  });
  return page;
};

const rendersSvg = (locator, timeout) =>
  locator
    .first()
    .waitFor({ timeout })
    .then(
      () => true,
      () => false
    );

// Returns whether the page rendered an SVG, a navigation error being reported as a problem of the page
const checkPage = async (label, url, svgLocatorOf, timeout) => {
  const page = await openPage(label);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    return await rendersSvg(svgLocatorOf(page), timeout);
  } catch (error) {
    problems.push(`${label} navigation error: ${error.message.split('\n')[0]}`);
    return false;
  } finally {
    await page.context().close();
  }
};

const managerRendersSvg = await checkPage(
  'manager',
  `${baseUrl}/?path=/story/${storyIds[0]}`,
  (page) => page.frameLocator('#storybook-preview-iframe').locator('#storybook-root svg'),
  managerRenderTimeoutInMs
);
if (!managerRendersSvg) problems.push('manager: the preview iframe renders no SVG');

const storiesWithoutSvg = [];
for (const storyId of storyIds) {
  const storyRendersSvg = await checkPage(
    storyId,
    `${baseUrl}/iframe.html?id=${storyId}&viewMode=story`,
    (page) => page.locator('#storybook-root svg'),
    storyRenderTimeoutInMs
  );
  if (!storyRendersSvg) storiesWithoutSvg.push(storyId);
}
await browser.close();

console.log(`stories checked: ${storyIds.length}`);
console.log(`stories without SVG: ${storiesWithoutSvg.length}`);
for (const storyId of storiesWithoutSvg) console.log(`  ${storyId}`);
console.log(`problems: ${problems.length}`);
for (const problem of problems) console.log(`  ${problem}`);
process.exit(storiesWithoutSvg.length + problems.length > 0 ? 1 : 0);
