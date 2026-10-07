import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
// Root of the maxGraph repository, whose installed bundlers are reused. Defaults to the repository holding this script
// (.claude/tasks/<task>/prototypes/toy-bundlers), override it with the MAXGRAPH_REPO environment variable.
const REPO = process.env.MAXGRAPH_REPO ?? fileURLToPath(new URL('../../../../../', import.meta.url));
const req = createRequire(REPO + '/package.json');
const webpack = req('webpack');
const { rolldown, VERSION: rdVersion } = await import(REPO + '/node_modules/rolldown/dist/index.mjs');
const vite = await import(REPO + '/packages/ts-example/node_modules/vite/dist/node/index.js');
const HERE = process.cwd();
const entries = fs.readdirSync('entries').map(f => f.replace('.js', '')).sort();
const outText = dir => fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const summarize = txt => {
  const unused = [...new Set(txt.match(/zzUNUSED_\w+/g) ?? [])].map(s => s.replace('zzUNUSED_', '')).sort();
  const used = /zzUSED_click/.test(txt) ? '' : ' [USED MISSING!]';
  return (unused.length ? unused.join(',') : '-') + used;
};
const runWebpack = (entry, outDir, concatenateModules) => new Promise((res, rej) => webpack({
  mode: 'production', context: HERE, entry: `./entries/${entry}.js`,
  output: { path: outDir, filename: 'main.js', clean: true },
  ...(concatenateModules === false ? { optimization: { concatenateModules: false } } : {}),
}, (err, stats) => err || stats.hasErrors() ? rej(err ?? stats.toString('errors-only')) : res()));
const runRolldown = async (entry, outDir, minify) => {
  const b = await rolldown({ input: `entries/${entry}.js`, cwd: HERE, logLevel: 'silent' });
  await b.write({ dir: outDir, format: 'esm', minify }); await b.close();
};
let resolvedMinify;
const runVite = async (entry, outDir) => {
  await vite.build({ configFile: false, root: HERE, mode: 'production', logLevel: 'silent',
    plugins: [{ name: 'spy', configResolved(c) { resolvedMinify = c.build.minify; } }],
    build: { outDir, emptyOutDir: true, rolldownOptions: { input: `entries/${entry}.js` } } });
};
const bundlers = {
  'webpack': (e, o) => runWebpack(e, o, true),
  'webpack noConcat': (e, o) => runWebpack(e, o, false),
  'vite build': runVite,
  'rolldown': (e, o) => runRolldown(e, o, false),
  'rolldown minify': (e, o) => runRolldown(e, o, true),
};
const rows = [];
for (const e of entries) {
  const row = { entry: e };
  for (const [name, fn] of Object.entries(bundlers)) {
    const o = path.join(HERE, 'out', name.replace(' ', '-'), e);
    await fn(e, o); row[name] = summarize(outText(o));
  }
  rows.push(row);
}
console.log(`webpack ${webpack.version}, terser-webpack-plugin ${req('terser-webpack-plugin/package.json').version}, terser ${req('terser/package.json').version}, rolldown ${rdVersion}, vite ${vite.version} (build.minify resolved: ${resolvedMinify}, vite's rolldown ${vite.rolldownVersion ?? '?'})`);
console.table(rows);
