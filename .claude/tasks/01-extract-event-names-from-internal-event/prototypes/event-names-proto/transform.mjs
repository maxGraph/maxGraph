// Usage: node transform.mjs <core src dir>
import fs from 'node:fs';
import path from 'node:path';

const srcDir = process.argv[2];
const internalEventPath = path.join(srcDir, 'view/event/InternalEvent.ts');
const eventNamesPath = path.join(srcDir, 'view/event/EventNames.ts');

const internalEventSource = fs.readFileSync(internalEventPath, 'utf8');
const lines = internalEventSource.split('\n');

const sectionStart = lines.findIndex((line) => line.trim() === '// Event names') - 1;
const resetLine = lines.findIndex((line) => line.trim() === "static RESET = 'reset';");
if (sectionStart < 0 || resetLine < 0) throw new Error('markers not found');

const eventEntries = [];
for (let index = sectionStart; index <= resetLine; index++) {
  const match = lines[index].match(/^\s*static ([A-Z_]+) = '([^']+)';$/);
  if (match) eventEntries.push([match[1], match[2]]);
}
console.log('event names found:', eventEntries.length);

// remove the section (comment header, jsdoc, statics) and the blank line after RESET
lines.splice(sectionStart, resetLine - sectionStart + 2);
fs.writeFileSync(internalEventPath, lines.join('\n'));

const eventNamesSource =
  '/**\n * Names of the events fired by maxGraph.\n */\nexport const EventNames = {\n' +
  eventEntries.map(([name, value]) => `  ${name}: '${value}',`).join('\n') +
  '\n} as const;\n';
fs.writeFileSync(eventNamesPath, eventNamesSource);

const names = eventEntries.map(([name]) => name);
const usageRegex = new RegExp(`\\bInternalEvent\\.(${names.join('|')})\\b`, 'g');
const importLineRegex = /^import\s+InternalEvent\s+from\s+'([^']+)';\s*$/m;

const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : fullPath.endsWith('.ts') ? [fullPath] : [];
  });

let modifiedFiles = 0;
let replacements = 0;
let removedImports = 0;
for (const filePath of walk(srcDir)) {
  if (filePath === eventNamesPath) continue;
  const original = fs.readFileSync(filePath, 'utf8');
  let replacedCount = 0;
  let updated = original.replace(usageRegex, (_all, name) => {
    replacedCount++;
    return `EventNames.${name}`;
  });
  if (replacedCount === 0) continue;
  replacements += replacedCount;
  modifiedFiles++;

  const relativeImport =
    './' +
    path
      .relative(path.dirname(filePath), eventNamesPath)
      .replace(/\\/g, '/')
      .replace(/\.ts$/, '.js');
  const eventNamesImport = `import { EventNames } from '${relativeImport.replace(/^\.\/\.\.\//, '../')}';`;

  const importMatch = updated.match(importLineRegex);
  const isInternalEventFile = filePath === internalEventPath;
  if (importMatch) {
    const withoutImport = updated.replace(importLineRegex, '');
    const stillUsesInternalEvent = /\bInternalEvent\b/.test(
      withoutImport.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    );
    if (stillUsesInternalEvent) {
      updated = updated.replace(importLineRegex, (line) => `${line}\n${eventNamesImport}`);
    } else {
      updated = updated.replace(importLineRegex, eventNamesImport);
      removedImports++;
    }
  } else {
    // no default import of InternalEvent (e.g. InternalEvent.ts itself): add after the last import
    const importLines = [...updated.matchAll(/^import [^;]+;$/gm)];
    if (importLines.length > 0) {
      const last = importLines[importLines.length - 1];
      const insertAt = last.index + last[0].length;
      updated = updated.slice(0, insertAt) + '\n' + eventNamesImport + updated.slice(insertAt);
    } else {
      updated = eventNamesImport + '\n' + updated;
    }
    if (!isInternalEventFile) console.log('no InternalEvent import in', filePath);
  }
  fs.writeFileSync(filePath, updated);
}
console.log({ modifiedFiles, replacements, removedImports });

const indexPath = path.join(srcDir, 'index.ts');
const indexSource = fs.readFileSync(indexPath, 'utf8');
const internalEventExport = "export { default as InternalEvent } from './view/event/InternalEvent.js';";
if (!indexSource.includes(internalEventExport)) throw new Error('index export not found');
fs.writeFileSync(
  indexPath,
  indexSource.replace(
    internalEventExport,
    `${internalEventExport}\nexport { EventNames } from './view/event/EventNames.js';`
  )
);
