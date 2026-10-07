# Prototypes and measurements

Material behind the size figures of `../explore.md`, kept so that the experiments can be understood and replayed, in
particular for the issue about the direct `eval` in `doEval`. The experiments ran on 2026-10-07 in a scratch directory;
only the scripts are kept here, not the builds. All sizes are raw minified bytes.

The scripts expect to be run from a working directory of your choice (they write their outputs there). The
`toy-bundlers` scripts reuse the bundlers installed in the maxGraph repository: they locate it relative to their own
location, or from the `MAXGRAPH_REPO` environment variable.

## Versions

- Node 24.19.0 (`.nvmrc`), TypeScript 5.9.3.
- maxGraph core: commit `b94f5137a9d5773b0a09b30c579eb3eca536208b` (0.25.0).
- Integration examples: https://github.com/maxGraph/maxgraph-integration-examples at
  `1c60ebf734fdf6283923e8072f0a0f0fa3cf6e1f`, projects `rollup-ts` and `vitejs-ts`.
- rollup-ts: rollup 4.62.4, @rollup/plugin-terser 1.0.0 (terser 5.49.2), @rollup/plugin-node-resolve 16.0.3,
  @rollup/plugin-typescript 12.3.0.
- vitejs-ts: vite 8.2.1, rolldown 1.2.3, default minifier (oxc).
- webpack: `packages/js-example-without-defaults` of this repository, webpack 5.109.2, terser-webpack-plugin 5.3.16
  (terser 5.39.0), `webpack --mode=production`.

## 1. Real library: BASELINE vs PROTO (`event-names-proto/`)

1. **BASELINE core:** `git archive b94f5137a` of `packages/core` into a scratch directory, `node_modules` symlinked to
   the repository's, ESM build only (`tsc`, the `build:esm` script), then `npm pack --ignore-scripts`.
2. **PROTO core:** same extraction, then `node event-names-proto/transform.mjs <core>/src`, which:
   - creates `view/event/EventNames.ts` with the 96 names, `export const EventNames = {...} as const`;
   - removes the "Event names" section from `InternalEvent` (keeps the 4 `*_HANDLE`, `PINCH_THRESHOLD`, the methods);
   - rewrites the 338 `InternalEvent.X` references in 60 files, adds the `EventNames` imports and removes 23
     `InternalEvent` imports that became unused;
   - adds `export { EventNames } from './view/event/EventNames.js';` to `index.ts`, no deprecated aliases.

   One manual edit: `(evtName as string)` in `EventsMixin.ts`, at the dead `MOUSE_UP` check, which `as const` turns into
   a TS2367 error (see `../explore.md`). Then ESM build and `npm pack --ignore-scripts`.
3. **Consumers:** copies of `rollup-ts` and `vitejs-ts` (with the `_shared` workspace and the original lockfile) and of
   `js-example-without-defaults`. Each tarball is installed in turn, then the project's own production build runs:
   `npm run build` (rollup-ts), `tsc && vite build --base ./` (vitejs-ts), `webpack --mode=production` (webpack). None of
   them uses event-name constants (they only call `InternalEvent.disableContextMenu`), so no consumer code was changed.
   The webpack copy passes `isDevMode: true` to the budget wrapper only, to switch off its `hints: 'error'`; the
   production build is unchanged.
4. **Measure:** `node event-names-proto/measure.mjs <PROTO EventNames.ts> base=<dist> proto=<dist> ...` prints the size
   of the largest JS file, the number of the 96 event-name values present in the bundle, and the values present in one
   bundle and not the other. Counting by string can be inflated by unrelated uses of `'click'`, `'reset'` and the like,
   which is why the diff list matters more than the count.

### Variant: indirect eval

The installed `lib/esm/internal/utils.js` of `@maxgraph/core`, in each consumer copy, is patched temporarily:

```diff
-    return eval(expression);
+    return (0, eval)(expression);
```

then the consumer is rebuilt (rollup to `out-noeval/`, vite to `dist-noeval/`, webpack to `dist-noeval/`) and the patch
reverted. This only measures the bundler effect; the semantics of an indirect eval for the 6 callers of `doEval` are not
verified.

### Variant: rollup without try/catch deoptimization

`rollup.config.js` of rollup-ts with `treeshake: { tryCatchDeoptimization: false }` added, output to `out-notry/`.

### Results

| Project | Core | Direct eval (today) | Indirect eval | Eval effect |
|---|---|---|---|---|
| rollup-ts | BASELINE | 367 072 | 342 063 | -25 009 (-6.8%) |
| | PROTO | 365 249 | 339 321 | -25 928 |
| | PROTO effect | -1 823 | -2 742 | |
| vitejs-ts | BASELINE | 363 400 | 341 260 | -22 140 (-6.1%) |
| | PROTO | 361 613 | 341 066 | -20 547 |
| | PROTO effect | -1 787 | -194 | |
| js-example-without-defaults | BASELINE | 239 107 | 210 241 | -28 866 (-12.1%) |
| | PROTO | 236 742 | 207 643 | -29 099 |
| | PROTO effect | -2 365 | -2 598 | |

rollup-ts with `tryCatchDeoptimization: false`, direct eval: BASELINE 367 072, PROTO 364 620 (-2 452).

Event-name values left in the PROTO bundle: 96 in every direct-eval build and in vite with the indirect eval; 66 with
rollup and the indirect eval (or without try/catch deoptimization); 59 with webpack and the indirect eval.

Why the eval matters: a direct `eval` can read any variable of the enclosing scopes, so minifiers stop renaming
variables in those scopes. Once the bundler has hoisted all modules into one scope, that is the whole bundle: the
baseline webpack bundle still contains `InternalMouseEvent` 26 times, 0 times with the indirect eval. Rolldown prints
the warning "Use of direct `eval`" with a pointer to https://rolldown.rs/guide/troubleshooting#avoiding-direct-eval.

### Other bundlers of the integration examples

Same tarballs, same procedure (copy of the project, `_shared` and the root lockfile, project's own `npm run build`,
eval patch applied then reverted), same commit of the integration examples.

| Project (bundler, minifier) | Core | Direct eval (today) | Indirect eval | Eval effect |
|---|---|---|---|---|
| parcel-ts (Parcel 2.16.4, SWC) | BASELINE | 504 986 | 360 843 | -144 143 (-28.5%) |
| | PROTO | 501 184 | 357 110 | -144 074 |
| | PROTO effect | -3 802 | -3 733 | |
| lit-ts (Vite 8.2.1, rolldown 1.2.3, oxc) | BASELINE | 379 198 | 355 993 | -23 205 (-6.1%) |
| | PROTO | 377 411 | 355 795 | -21 616 |
| | PROTO effect | -1 787 | -198 | |
| sveltekit-ts (same Vite), maxGraph chunk `nodes/2.*.js` | BASELINE | 362 175 | 340 049 | -22 126 (-6.1%) |
| | PROTO | 360 388 | 339 834 | -20 554 |
| | PROTO effect | -1 787 | -215 | |
| rsbuild-ts (Rsbuild 2.1.10, Rspack 2.1.8, SWC) | BASELINE | 347 518 | 346 802 | -716 (-0.2%) |
| | PROTO | 347 442 | 346 718 | -724 |
| | PROTO effect | -76 | -84 | |
| farm-ts (Farm 1.7.11, SWC minifier) | BASELINE | 397 797 | 397 522 | -275 (-0.07%) |
| | PROTO | 398 802 | 398 527 | -275 |
| | PROTO effect | **+1 005** | **+1 005** | |

Sizes are the file holding maxGraph. Rsbuild and Farm emit a second, app-only JS file (3 707 B and 3 931 B, identical
in every build); SvelteKit emits 9 more files of about 72 kB that change by at most 4 B.

Observations:
- **Parcel** keeps its module runtime and long scope-hoisted names (`$2051fd5f8fd06bc7$var$InternalMouseEvent`) with the
  direct eval, and prints no warning. With the indirect eval everything is renamed and the runtime disappears. It is
  also the only bundler that drops event names with the direct eval: 71 of 96 left in PROTO, 66 with the indirect eval.
- **Lit and SvelteKit** behave exactly like `vitejs-ts`: rolldown warns `[EVAL] Use of direct eval`, names are not
  renamed (`InternalMouseEvent` 25 times, 0 with the indirect eval), all 96 event names are kept.
- **Rsbuild and Farm** keep each module in its own function wrapper, so the direct eval only deoptimizes the `utils`
  module: identifiers are renamed in both variants and the eval effect is small. They keep all 96 event names.
- **Farm grows with PROTO**: it does not rename the `EventNames` export in cross-module property accesses
  (`g.EventNames.MOUSE_DOWN`, 165 occurrences) where BASELINE had `t.f(r).MOUSE_DOWN`.
- **Farm cache trap:** Farm's persistent cache (`node_modules/.farm`) did not notice the change of core content (same
  version 0.25.0 in both tarballs, and the eval patch changes no version), so the first run produced identical bundles.
  Clear it before every build when replaying.

### Vite 8 with terser instead of oxc

Same `vitejs-ts` copies, built with `vite build --base ./ --minify terser --outDir <dir>` (the `vite` binary called
directly: `npx vite` inside the npm workspace is misread as a script name), terser 5.49.2. Measured on 2026-10-07.

| Core | oxc, direct eval | terser, direct eval | oxc, indirect eval | terser, indirect eval |
|---|---|---|---|---|
| BASELINE | 363 400 | 367 320 | 341 260 | 344 712 |
| PROTO | 361 613 | 365 533 | 341 066 | 342 087 |
| PROTO effect | -1 787 | -1 787 | -194 | -2 625 |

- With the direct eval, terser keeps all 96 names and does not rename either (`InternalMouseEvent` 25 times, 0 with the
  indirect eval), like oxc.
- With the indirect eval, terser drops the same 30 unused names as rollup + terser, so the extraction gains 2.6 kB
  instead of 0.2 kB with oxc.
- terser still produces larger bundles than oxc in every case (+1 to +3.9 kB): switching a Vite application to terser
  is not worth it for maxGraph, even after the extraction and the eval fix.

## 2. Rollup try/catch deoptimization (`try-catch-repro/`)

Minimal repro of why rollup kept every property by default. `names.js` exports `N = { A, B, C }`; `t16.js` reads `N.A`
inside a `try/finally`, `t17.js` inside a `try/catch`. Bundling with rollup keeps `B` and `C` unless the config sets
`treeshake: { tryCatchDeoptimization: false }`. In the real core, the bisect pointed at `GraphDataModel.endUpdate`.

## 3. Toy libraries, all bundlers (`toy-bundlers/`)

The first experiment, before the real-library one: `gen.mjs` generates small libraries (`sideEffects: false`, barrel
`index.js`) for 7 variants (class statics, plain object, object plus deprecated class aliases, object used inside a
library function, consumer adding a property, `as const satisfies`, dynamic access), `run.mjs` bundles each with webpack
(with and without module concatenation), vite 8 and rolldown (with and without minify) and reports which unused strings
remain, `extra.mjs` runs the extra webpack cases (`hoist_props` off, `splitChunks`, 121 properties).

Unused strings left in the output (`a,b,c` all kept, `-` none kept); direct and barrel imports gave identical results:

| Variant | webpack prod | webpack, concatenation off | vite build | rolldown | rolldown minify |
|---|---|---|---|---|---|
| V1 class statics (current shape) | a,b,c | a,b,c | a,b,c | a,b,c | a,b,c |
| V2 plain object | - | a,b,c | a,b,c | a,b,c | a,b,c |
| V3 object + deprecated class aliases | a,b,c | a,b,c | a,b,c | a,b,c | a,b,c |
| V4 object used only inside a library function | - | a,b,c | a,b,c | a,b,c | a,b,c |
| V5 consumer adds a property | - | a,b,c | a,b,c | a,b,c | a,b,c |
| V6 `as const satisfies` (same JS as V2) | - | a,b,c | a,b,c | a,b,c | a,b,c |
| V7 reachable dynamic access `EventNames[name]` | a,b,c | a,b,c | a,b,c | a,b,c | a,b,c |

Extra webpack cases: V4 with terser `hoist_props: false` keeps all; V2 with `splitChunks` (object and reader in
different chunks) keeps all; an object of 121 properties with 1 read drops the 120 others.

The toy libraries contain no `eval`, which is why terser could drop properties here and not on the real library.
