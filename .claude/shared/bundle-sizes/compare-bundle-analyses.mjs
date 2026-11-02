#!/usr/bin/env node
/*
Copyright 2026-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Compares two 'dist/bundle-analysis.json' files of the same example, written by a build with ANALYZE=json, and prints
// in markdown what changed: the size of each output file, the modules added, removed or resized, and for each added
// module the chain of imports that pulled it in. Used by the bundle-impact-analyst agent.
//
// Usage: node compare-bundle-analyses.mjs <reference json> <head json> [<max rows>]
//
// The two formats differ, see scripts/webpack/bundle-analysis.cjs and scripts/vite/bundle-analysis.mjs:
// - webpack, '{ assets, modules }': each module has its size before minification and its importers;
// - Vite, an array of output files: the modules of a chunk are the leaves of its 'source' tree, each with its size in
//   the minified chunk, 'parsedSize', attributed through the source map. A file's 'parsedSize' is the sum of its
//   modules', so the few bytes mapped to no module, such as the glue between modules, are counted nowhere: up to a few
//   hundred bytes per chunk. Their 'importedBy' field lists, despite its name, the modules they import, so the
//   importers are found by inverting it. An import of '@maxgraph/core' points at its entry point, which is not a module
//   of the bundle, so a module the example imports from it has no importer: the chain ends at the example's module.

import { readFileSync } from 'node:fs';
import process from 'node:process';

const [referencePath, headPath, maxRowsArgument] = process.argv.slice(2);
if (!referencePath || !headPath) {
  console.error(
    'Usage: node compare-bundle-analyses.mjs <reference json> <head json> [<max rows>]'
  );
  process.exit(1);
}
const maxRows = Number(maxRowsArgument ?? 30);

// Module names differ by their prefix between the bundlers, '../core/lib/esm/x.js' or 'core/lib/esm/x.js'
const normalizeName = (name) => name.replace(/^(\.\.\/)+/, '').replace(/^\.\//, '');

const readWebpack = (json) => {
  const modules = new Map();
  for (const module of json.modules) {
    const name = normalizeName(module.name);
    const known = modules.get(name);
    // A module can appear twice, once in a concatenated module and once on its own: keep the importers of both
    modules.set(name, {
      size: Math.max(known?.size ?? 0, module.size),
      importers: new Set([
        ...(known?.importers ?? []),
        ...module.importers.map(normalizeName),
      ]),
    });
  }
  // 'main.<contenthash>.js' changes name with its content, so it is matched without the hash. Images named by their
  // hash alone have no name left without it: they keep theirs, and a changed image shows up as removed and added.
  const files = json.assets.map(({ name, size }) => ({
    name: name.replace(/(.)\.[\da-f]{16,}(\.\w+)$/, '$1$2'),
    size,
  }));
  return {
    bundler: 'webpack',
    sizeUnit: 'bytes before minification',
    modules,
    files,
    entryPointImporters: [],
  };
};

const readVite = (json) => {
  const modules = new Map();
  const imports = new Map();
  const collectLeaves = (nodes) => {
    for (const node of nodes) {
      if (node.groups?.length) {
        collectLeaves(node.groups);
        continue;
      }
      const name = normalizeName(node.filename);
      modules.set(name, {
        size: (modules.get(name)?.size ?? 0) + node.parsedSize,
        importers: new Set(),
      });
      // A module found in several output files keeps the imports of all of them, any of which may explain its chain
      imports.set(name, [
        ...(imports.get(name) ?? []),
        ...(node.importedBy ?? []).map(({ id }) => normalizeName(id)),
      ]);
    }
  };
  for (const file of json) {
    collectLeaves(file.source ?? []);
  }
  const entryPointImporters = [];
  for (const [name, importedNames] of imports) {
    for (const importedName of importedNames) {
      modules.get(importedName)?.importers.add(name);
    }
    if (importedNames.includes('@maxgraph/core')) {
      entryPointImporters.push(name);
    }
  }
  // Content hashes change with the content, so the files are named without them to be matched across the two builds
  const files = json.map(({ filename, parsedSize }) => ({
    name: filename.replace(/-[\w-]{8}(\.\w+)$/, '$1'),
    size: parsedSize,
  }));
  return {
    bundler: 'vite',
    sizeUnit:
      'bytes of the minified chunk, attributed to each module through the source map',
    modules,
    files,
    entryPointImporters,
  };
};

const read = (path) => {
  const json = JSON.parse(readFileSync(path, 'utf8'));
  return Array.isArray(json) ? readVite(json) : readWebpack(json);
};

const reference = read(referencePath);
const head = read(headPath);
if (reference.bundler !== head.bundler) {
  console.error(
    `The two files come from different bundlers: ${reference.bundler} and ${head.bundler}`
  );
  process.exit(1);
}

const kB = (bytes) => (bytes / 1000).toFixed(2);
const signedKB = (bytes) => `${bytes > 0 ? '+' : ''}${kB(bytes)}`;

// The shortest chain of imports from a module of the example down to the given module, each importing the next. A chain
// starting at a module of @maxgraph/core that nothing in the bundle imports says so, rather than looking complete. Such
// a chain is only the fallback: another path may still reach a module of the example, so the search goes on.
const importChain = (name) => {
  const previous = new Map([[name, null]]);
  const queue = [name];
  let importerFreeChain;
  const chainTo = (last) => {
    const chain = [];
    for (let step = last; step !== null; step = previous.get(step)) {
      chain.push(step);
    }
    return chain;
  };
  while (queue.length > 0) {
    const current = queue.shift();
    const importers = head.modules.get(current)?.importers ?? new Set();
    if (!current.includes('core/lib/')) {
      return chainTo(current);
    }
    if (importers.size === 0) {
      const origin =
        head.entryPointImporters.length > 0
          ? `${head.entryPointImporters.join(', ')} (through the @maxgraph/core entry point)`
          : '(no importer in the bundle)';
      importerFreeChain ??= [origin, ...chainTo(current)];
      continue;
    }
    for (const importer of importers) {
      if (!previous.has(importer)) {
        previous.set(importer, current);
        queue.push(importer);
      }
    }
  }
  return importerFreeChain ?? ['(no importer in the bundle)', name];
};

console.log(`Bundler: ${head.bundler}. Module sizes are ${head.sizeUnit}.\n`);

console.log('## Output files\n');
console.log('| File | Reference (kB) | Head (kB) | Δ kB |');
console.log('|---|---|---|---|');
const fileNames = [
  ...new Set([...reference.files, ...head.files].map(({ name }) => name)),
].sort();
for (const fileName of fileNames) {
  const referenceSize = reference.files.find(({ name }) => name === fileName)?.size;
  const headSize = head.files.find(({ name }) => name === fileName)?.size;
  const delta =
    referenceSize !== undefined && headSize !== undefined
      ? signedKB(headSize - referenceSize)
      : 'N/A';
  console.log(
    `| ${fileName} | ${referenceSize === undefined ? 'N/A' : kB(referenceSize)} | ${headSize === undefined ? 'N/A' : kB(headSize)} | ${delta} |`
  );
}

const changes = [];
for (const name of new Set([...reference.modules.keys(), ...head.modules.keys()])) {
  const referenceSize = reference.modules.get(name)?.size ?? 0;
  const headSize = head.modules.get(name)?.size ?? 0;
  if (referenceSize !== headSize) {
    const status = !reference.modules.has(name)
      ? 'added'
      : !head.modules.has(name)
        ? 'removed'
        : 'resized';
    changes.push({ name, status, delta: headSize - referenceSize });
  }
}
changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

const total = (status) => changes.filter((change) => change.status === status);
console.log('\n## Modules\n');
for (const status of ['added', 'removed', 'resized']) {
  const ofStatus = total(status);
  console.log(
    `- ${status}: ${ofStatus.length}, ${signedKB(ofStatus.reduce((sum, { delta }) => sum + delta, 0))} kB`
  );
}

console.log(`\n| Module | Status | Δ bytes |`);
console.log('|---|---|---|');
for (const { name, status, delta } of changes.slice(0, maxRows)) {
  console.log(`| ${name} | ${status} | ${delta > 0 ? '+' : ''}${delta} |`);
}
if (changes.length > maxRows) {
  console.log(
    `\n${changes.length - maxRows} more changes not shown, pass a larger <max rows> to see them.`
  );
}

const added = total('added');
if (added.length > 0) {
  console.log('\n## Why each added module is in the bundle\n');
  for (const { name } of added.slice(0, maxRows)) {
    console.log(`- ${importChain(name).join(' -> ')}`);
  }
}
