// Loads every story of a running Storybook in headless Chromium and reports the stories that render no SVG, the
// uncaught errors, the console errors and the failed requests. Exits 1 when anything is reported.
// Usage: node check-stories.mjs <storybook base url> <chromium executable>
import { chromium } from 'playwright-core';

const [baseUrl, executablePath] = process.argv.slice(2);
const storyRenderTimeoutInMs = 5000;
const managerRenderTimeoutInMs = 30000;

const index = await (await fetch(`${baseUrl}/index.json`)).json();
const storyIds = Object.values(index.entries)
  .filter((entry) => entry.type === 'story')
  .map((entry) => entry.id);

const browser = await chromium.launch({ executablePath });
const problems = [];

// One browser context per page, so that the cache of a previous story never hides a failed request
const openPage = async (label) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`${label} uncaught error: ${error.message}`));
  page.on('console', (message) => {
    // A failed request is reported by the response listener with its URL, the console message does not carry it.
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
      problems.push(`${label} console error: ${message.text()}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) {
      problems.push(`${label} HTTP ${response.status()}: ${response.url().replace(baseUrl, '')}`);
    }
  });
  return page;
};

const waitForSvg = (locator, timeout) =>
  locator
    .first()
    .waitFor({ timeout })
    .then(
      () => true,
      () => false
    );

const managerPage = await openPage('manager');
await managerPage.goto(`${baseUrl}/?path=/story/${storyIds[0]}`, { waitUntil: 'networkidle' });
const managerLocator = managerPage.frameLocator('#storybook-preview-iframe').locator('#storybook-root svg');
if (!(await waitForSvg(managerLocator, managerRenderTimeoutInMs))) {
  problems.push('manager: the preview iframe renders no SVG');
}
await managerPage.context().close();

const storiesWithoutSvg = [];
for (const storyId of storyIds) {
  const page = await openPage(storyId);
  await page.goto(`${baseUrl}/iframe.html?id=${storyId}&viewMode=story`, { waitUntil: 'networkidle' });
  if (!(await waitForSvg(page.locator('#storybook-root svg'), storyRenderTimeoutInMs))) {
    storiesWithoutSvg.push(storyId);
  }
  await page.context().close();
}
await browser.close();

console.log(`stories checked: ${storyIds.length}`);
console.log(`stories without SVG: ${storiesWithoutSvg.length}`);
for (const storyId of storiesWithoutSvg) console.log(`  ${storyId}`);
console.log(`problems: ${problems.length}`);
for (const problem of problems) console.log(`  ${problem}`);
process.exit(storiesWithoutSvg.length + problems.length > 0 ? 1 : 0);
