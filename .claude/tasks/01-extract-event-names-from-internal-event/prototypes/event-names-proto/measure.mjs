// Usage: node measure.mjs <EventNames.ts> <label>=<dir with js files> ...
import fs from 'node:fs';
import path from 'node:path';

const eventNamesSource = fs.readFileSync(process.argv[2], 'utf8');
const eventValues = [...eventNamesSource.matchAll(/^\s+[A-Z_]+: '([^']+)',$/gm)].map((match) => match[1]);

const listJsFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJsFiles(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });

const results = {};
for (const argument of process.argv.slice(3)) {
  const [label, directory] = argument.split('=');
  const files = listJsFiles(directory).map((file) => ({ file, size: fs.statSync(file).size }));
  files.sort((first, second) => second.size - first.size);
  const allContent = files.map(({ file }) => fs.readFileSync(file, 'utf8')).join('\n');
  const presentValues = eventValues.filter((value) => allContent.includes(`"${value}"`) || allContent.includes(`'${value}'`) || allContent.includes('`' + value + '`'));
  results[label] = {
    largest: `${path.relative(directory, files[0].file)} ${files[0].size}`,
    totalJs: files.reduce((sum, { size }) => sum + size, 0),
    fileCount: files.length,
    eventValuesPresent: presentValues.length,
    presentValues,
  };
}
for (const [label, result] of Object.entries(results)) {
  console.log(label, result.largest, 'total', result.totalJs, 'files', result.fileCount, 'eventValues', result.eventValuesPresent, '/', eventValues.length);
}
const labels = Object.keys(results);
for (let index = 0; index + 1 < labels.length; index += 2) {
  const [baseline, proto] = [results[labels[index]], results[labels[index + 1]]];
  console.log(`${labels[index]} -> ${labels[index + 1]}: largest diff`, Number(proto.largest.split(' ')[1]) - Number(baseline.largest.split(' ')[1]), 'total diff', proto.totalJs - baseline.totalJs);
  console.log('  absent in proto:', baseline.presentValues.filter((value) => !proto.presentValues.includes(value)).join(' '));
  console.log('  present in proto only:', proto.presentValues.filter((value) => !baseline.presentValues.includes(value)).join(' '));
}
