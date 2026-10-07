import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
// Root of the maxGraph repository, whose installed bundlers are reused. Defaults to the repository holding this script
// (.claude/tasks/<task>/prototypes/toy-bundlers), override it with the MAXGRAPH_REPO environment variable.
const REPO = process.env.MAXGRAPH_REPO ?? fileURLToPath(new URL('../../../../../', import.meta.url));
const req = createRequire(REPO + '/package.json');
const webpack = req('webpack'); const TerserPlugin = req('terser-webpack-plugin');
const run = (entry, optimization) => new Promise((res, rej) => webpack({ mode: 'production', context: process.cwd(), entry,
  output: { path: process.cwd() + '/out/extra', clean: true }, optimization }, (e, s) => e || s.hasErrors() ? rej(e ?? s.toString()) : res()));
const scan = () => { const t = fs.readdirSync('out/extra').filter(f => f.endsWith('.js')).map(f => fs.readFileSync('out/extra/' + f, 'utf8')).join('');
  return `${(t.match(/zzUNUSED_\w+/g) ?? []).length} unused strings, used kept: ${t.includes('zzUSED_click')}`; };
const cases = {
  'v2 hoist_props:false': ['./entries/v2-direct.js', { minimizer: [new TerserPlugin({ terserOptions: { compress: { hoist_props: false } } })] }],
  'v4 hoist_props:false': ['./entries/v4-direct.js', { minimizer: [new TerserPlugin({ terserOptions: { compress: { hoist_props: false } } })] }],
  'v2 splitChunks all': ['./entries/v2-direct.js', { splitChunks: { chunks: 'all', minSize: 0 } }],
  'v4 splitChunks all': ['./entries/v4-direct.js', { splitChunks: { chunks: 'all', minSize: 0 } }],
  'big (121 props) default': ['./entries-extra-big.js', undefined],
};
for (const [n, [e, o]] of Object.entries(cases)) { await run(e, o); console.log(n.padEnd(28), scan()); }
