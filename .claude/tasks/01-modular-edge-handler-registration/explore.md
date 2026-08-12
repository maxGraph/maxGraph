# Task: Make EdgeHandler registration in SelectionCellsHandler optional and modular (issue #890)

Branch: `feat/890-edgehandler_only_default_in_basegraph` (clean, no commit yet, `git log main..HEAD` empty).

Goal of this PR: `SelectionCellsHandler` ships only the `'default'` edge handler factory. `Graph` keeps the three
built-in kinds by passing them through a new `edgeHandlerFactories` construction option. `BaseGraph` users opt in,
which lets a bundler drop `ElbowEdgeHandler` and `EdgeSegmentHandler`.

---

## Codebase Context

### The coupling to break

`packages/core/src/view/plugin/SelectionCellsHandler.ts:38-39` (static imports) and `:67-74` (eager field
initializer) are the whole problem:

```ts
private readonly edgeHandlerFactories = new Map<EdgeStyleHandlerKind, EdgeHandlerFactory>([
  ['default', (state) => new EdgeHandler(state)],
  ['elbow', (state) => new ElbowEdgeHandler(state)],
  ['segment', (state) => new EdgeSegmentHandler(state)],
]);
```

As long as this initializer exists, no bundler can drop the two subclasses from any app registering the plugin,
whatever edge styles that app registers.

Notable properties of the field:
- `private readonly` — the reference cannot be reassigned, only mutated through `.set()` / `.clear()`. Forwarding must
  therefore iterate the option and call `setEdgeHandlerFactory(kind, factory)` per entry, which also preserves the
  documented semantics for free.
- It is a class field initializer, so every plugin instance owns its own `Map` (no shared state between graphs).

Resolution logic, `SelectionCellsHandler.ts:269-276`: `EdgeStyleRegistry.getHandlerKind(edgeStyle)` then lookup, with
a hard fallback `this.edgeHandlerFactories.get('default')!(state)`. The invariant "there is always an entry for
`'default'`" is load-bearing and must survive this change.

Public factory API already in place (added by #823, all `@since 0.25.0`):
- `setVertexHandlerFactory(factory)` — `:278-294`
- `setEdgeHandlerFactory(handlerKind, factory)` — `:296-321`
- `setEdgeHandlerFactoryForAllKinds(factory)` — `:323-348` (clears the map, then sets only `'default'`)

### Where the option plugs in

`packages/core/src/view/AbstractGraph.ts:434-459`, the full constructor:

```
436  this.registerDefaults();
438  this.container = options?.container ?? document.createElement('div');
441  this.initializeCollaborators(options);
443-448 model change listener
450  this.view.init();
453  this.sizeDidChange();
456  options?.plugins?.forEach((p) => this.plugins.set(p.pluginId, new p(this)));
458  this.view.revalidate();
```

- Line 456 is the only plugin instantiation, and only `view.revalidate()` follows it. **Insertion point: between 456
  and 458.**
- There is **no existing post-plugin hook** (`registerDefaults()` at `:419` and the abstract
  `initializeCollaborators()` at `:432` both run before plugins exist). This PR introduces the first such step, which
  is exactly what the follow-up `onConfigure(options)` hook will generalize.
- `getPlugin` (`:462-463`) is an instance arrow-function property, so it is already assigned when line 456 runs and is
  callable at 457. It returns `T | undefined` through an unchecked cast, so the forwarding must use `?.`, mirroring
  `setTooltips` at `:495`.

### BaseGraph needs no change at all

`packages/core/src/view/BaseGraph.ts` is 45 lines and declares **only** `initializeCollaborators`. It has **no
constructor** and there is **no `BaseGraphOptions` type**: it inherits `AbstractGraph(options?: GraphOptions)`
verbatim. Adding `edgeHandlerFactories` to `GraphOptions` makes it available on `BaseGraph` for free.

### Graph can pass the defaults without touching its positional signature

`packages/core/src/view/Graph.ts:88-95`:

```ts
constructor(container?, model?, plugins = getDefaultPlugins(), stylesheet?) {
  super({ container, model, plugins, stylesheet: stylesheet ?? undefined });
}
```

`Graph` already adapts its legacy positional form to the object form. Adding
`edgeHandlerFactories: getDefaultEdgeHandlerFactories()` to that `super()` literal is a one-line change and does not
require a 5th positional parameter. `Graph` users who want to customize keep using the plugin setters, as documented
today.

### Types

All in `packages/core/src/types.ts`:

| Type | Lines | Note |
|---|---|---|
| `GraphOptions` | 1556-1565 | `{container?, plugins?} & GraphCollaboratorsOptions` — **the option goes in this literal, next to `plugins`** |
| `GraphCollaboratorsOptions` | 1567-1579 | must NOT host the option: consumed by `initializeCollaborators`, which runs before plugins exist |
| `EdgeStyleHandlerKind` | 1620-1631 | `'default' \| 'elbow' \| 'segment' \| (string & Record<never, never>)` — open union, so a full `Record<EdgeStyleHandlerKind, …>` is not writable by hand; `Partial<Record<…>>` is the realistic shape |
| `EdgeHandlerFactory` | 1787 | `(state: CellState) => EdgeHandler` |
| `VertexHandlerFactory` | 1776 | |
| `CellHandler` | 1765 | |
| `GraphPlugin` | 1257-1260 | only `onDestroy` — the future `onConfigure` hook extends this |
| `BuiltinPluginId` / `PluginId` | 1227-1249 | |

Note for the Code phase: because `EdgeStyleHandlerKind` includes `(string & Record<never, never>)`, a non-partial
`Record<EdgeStyleHandlerKind, EdgeHandlerFactory>` would be unsatisfiable in practice. `Partial<Record<…>>` is both
required by the type and by the stated UX ("pass only `{ elbow: ... }`").

---

## Tree-shaking and module placement

- `packages/core` is **not bundled**: `build:esm` is plain `tsc`, one `.js` per source file, module structure fully
  preserved. Only the static import graph seen by the consumer's bundler matters.
- `packages/core/package.json:7-9` declares `"sideEffects": ["**/*.css"]`, so all JS is side-effect free.
- `packages/core/src/view/handler/` has **no `index.ts`**. There is no existing barrel to put the helper in, and
  creating one would itself create the static edge to the three handler classes we are trying to avoid.
- Precedent, commit `b3c49e327` (`registerDefaultStyleElements`), whose message states the rule verbatim: a helper
  that pulls in defaults lives in its own module because "bundlers drop it thanks to the side-effect-free package
  declaration, but the granularity varies between bundlers, so the edge is better avoided entirely".

**Conclusion (question C): dedicated module confirmed**, e.g.
`packages/core/src/view/handler/default-edge-handler-factories.ts`, re-exported from `packages/core/src/index.ts`
(the only public entry; `exports` has no subpath for source modules).

No cycle risk: `ElbowEdgeHandler` / `EdgeSegmentHandler` never import from `view/plugin/*`; only `EdgeHandler.ts:68`
has a type-only import of `SelectionHandler`.

`check:circular-dependencies` is `madge --circular --extensions js lib`; `check:npm-package` is `attw --pack`. Neither
constrains a new source file beyond "no cycle" and "exported through `src/index.ts`".

---

## Test context

- Framework: **Jest** (`packages/core/jest.config.cjs`), `jsdom`, `@swc/jest`. Explicit imports from
  `@jest/globals`, `test` (not `it`), `test.each` for data-driven cases, imports from `'../../src'` without `.js`.
- No DOM container needed: `AbstractGraph.ts:438` falls back to `document.createElement('div')`.

Key files:

| File | Content |
|---|---|
| `packages/core/__tests__/view/plugin/SelectionCellsHandler.test.ts` | 638 lines, full factory API, **zero casts** — everything asserted behaviorally via `toBeInstanceOf` after a real selection |
| `packages/core/__tests__/view/BaseGraph.test.ts` | construction, `destroy` calling `onDestroy` on registered plugins (`:111-127`) |
| `packages/core/__tests__/view/Graph.test.ts` | 28 lines |
| `packages/core/__tests__/view/no-global-state-for-mixin-properties.ts` | shared suite created by HEAD commit `34a0d3c7a` |
| `packages/core/__tests__/view/plugin/index.test.ts` | `expect(plugins).toHaveLength(9)` — untouched by this change |
| `packages/core/__tests__/view/plugin/ImageBundlePlugin.test.ts:29-32` | the private-state escape hatch pattern |
| `packages/core/__tests__/utils.ts:30` | `createGraphWithoutPlugins = () => new Graph(undefined, undefined, [])` |

Idioms to reuse, from `SelectionCellsHandler.test.ts:430-519`:

```ts
const createNewGraph = () => new BaseGraph({ plugins: [SelectionCellsHandler] });
const getPlugin = (graph: BaseGraph) => graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
```

Private-state access, the single established pattern (`ImageBundlePlugin.test.ts:29-32`), used only when behavior
cannot express the assertion:

```ts
// Test-only escape hatch to inspect the private `imageBundles` field. Kept here (not in src) so
// the property stays hidden from production code, stories, and downstream consumers.
const internals = (plugin: ImageBundlePlugin) => plugin as unknown as { imageBundles: ImageBundle[] };
```

`@ts-expect-error` / `@ts-ignore` are never used in the test suite. Adding a getter to `src/` purely for testability
was explicitly rejected (see `9e573d426`).

Consequence for item 1 and 5 of the scope: the characterization tests should assert **behavior** (select an edge
styled with an elbow/segment style, expect the right handler class), and use the `internals()` hatch only if we want
to pin *which kinds* are populated in the map.

Existing test worth revisiting: `SelectionCellsHandler.test.ts:536-550`, `'Only affect the handlers created after the
factory is set'` — the construction option changes exactly this timing guarantee, which deserves its own test.

---

## Examples and bundle measurement (question A and D)

### chunkSizeWarningLimit is a WARN-only tripwire

Three occurrences, all Vite examples, line 49 of each `vite.config.js`:

| Example | limit | matching #823 measurement |
|---|---|---|
| `ts-example` | 429 | 428.65 kB |
| `ts-example-selected-features` | 362 | 361.52 kB |
| `ts-example-without-defaults` | 221 | 220.87 kB |

Vite maps it to the reporter plugin's `chunkLimit` and **emits a console warning only**; the build exits 0. There is
no `--logLevel`, no `onwarn`, nothing parsing build output. `scripts/build-all-examples.bash` runs under
`set -euo pipefail`, so it fails on a non-zero exit, which a chunk-size warning never produces. The convention is to
pin the limit just above the current size (221 for 220.87). It makes a regression visible in the CI log, it does not
break the build. Do not oversell it as a guard in the PR description.

The webpack examples (`js-example*`) have no size guard at all (no `performance` budget).

### Making the size guard blocking (verified on this repo)

Vite has **no built-in option** to turn the chunk-size warning into an error: `chunkSizeWarningLimit` is passed as
`chunkLimit` to the native `viteReporterPlugin`
(`packages/ts-example/node_modules/vite/dist/node/chunks/node.js:3312-3328`), which only calls `logger.warn`. The
feature request is [vitejs/vite#18496](https://github.com/vitejs/vite/issues/18496), still open.

A JS plugin calling `this.error()` from `generateBundle` **does** fail the build. Verified on
`ts-example-without-defaults` with the installed toolchain (vite 8.2.1, rolldown):

- limit 10 kB → `✗ Build failed`, `RolldownError: Chunk "assets/maxgraph-CCCg2q_k.js" is 220.87 kB, above the 10 kB
  limit.`, exit code **1**
- limit 221 kB → `✓ built`, exit code **0**

Important detail: `Buffer.byteLength(output.code) / 1000` inside `generateBundle` returned **220.87 kB**, byte-for-byte
the on-disk size (`220871` bytes) and exactly the number reported by `scripts/build-all-examples.bash` and by #823. So
a blocking check can reuse the existing limit values unchanged, with no recalibration.

Sketch (to place in a shared module, since three configs need it; duplicating it three times would violate the
no-duplication rule):

```js
// scripts/vite-fail-on-oversized-chunk.js (new shared file)
export const failOnOversizedChunk = (limitInKb) => ({
  name: 'fail-on-oversized-chunk',
  generateBundle(_options, bundle) {
    for (const [fileName, output] of Object.entries(bundle)) {
      if (output.type !== 'chunk') continue;
      const sizeInKb = Buffer.byteLength(output.code) / 1000;
      if (sizeInKb > limitInKb) {
        this.error(`Chunk "${fileName}" is ${sizeInKb.toFixed(2)} kB, above the ${limitInKb} kB limit.`);
      }
    }
  },
});
```

Each `vite.config.js` then declares the limit once and feeds both the Vite warning and the blocking check:

```js
const maxChunkSizeInKb = 221;
// build: { chunkSizeWarningLimit: maxChunkSizeInKb, ... }
// plugins: [failOnOversizedChunk(maxChunkSizeInKb)]
```

All three current limits already pass (429 vs 428.65, 362 vs 361.52, 221 vs 220.87), so enabling the check does not
break CI today.

Trade-off to accept explicitly: any legitimate size increase now fails CI until the number is bumped in the same PR.
That is the point (it forces the size delta to be acknowledged in review), but it is a change of contract for every
contributor, not only for this feature.

For the two webpack examples, the symmetric native mechanism is `performance: { hints: 'error', maxAssetSize }`, which
webpack turns into a build error. Not verified in this exploration.

### Baselines (corrected in the issue on 2026-08-12)

From PR #823, measured with `./scripts/build-all-examples.bash`:

| Example | before #823 | after #823 |
|---|---|---|
| `js-example` | 468.70 | 468.90 |
| `js-example-selected-features` | 386.38 | 386.54 |
| `js-example-without-defaults` | 320.97 | **240.03** |
| `ts-example` | 428.51 | 428.65 |
| `ts-example-selected-features` | 361.38 | 361.52 |
| `ts-example-without-defaults` | 299.46 | **220.87** |

The figures previously written in issue #890 (434.59 / 366.39 / 224.33) were stale estimates and have been replaced.

### handlerKind of every builtin edge style (`packages/core/src/view/style/register.ts`)

| register function | handlerKind |
|---|---|
| `registerElbowEdgeStyle`, `registerLoopEdgeStyle`, `registerSideToSideEdgeStyle`, `registerTopToBottomEdgeStyle` | `'elbow'` |
| `registerManhattanEdgeStyle`, `registerOrthogonalEdgeStyle`, `registerSegmentEdgeStyle` | `'segment'` |
| `registerEntityRelationEdgeStyle` | **none, resolves to `'default'`** |

`EdgeStyleRegistry.getHandlerKind()` returns `'default'` for unregistered styles
(`packages/core/src/view/style/edge/EdgeStyleRegistry.ts:38-40`). So the only ways to be `'default'`-only are:
`entityRelationEdgeStyle`, or no `edgeStyle` at all (straight edges).

### Current state of each candidate example

| Package | Graph class | SelectionCellsHandler | edge styles registered | bundler | size guard |
|---|---|---|---|---|---|
| `ts-example` | `Graph` | yes (defaults) | all builtins | Vite | 429 |
| `ts-example-selected-features` | `BaseGraph` subclass | **yes** (`main.ts:69`) | `registerOrthogonalEdgeStyle()` → `'segment'` (`main.ts:50`) | Vite | 362 |
| `ts-example-without-defaults` | `BaseGraph` | **no plugin at all** | none | Vite | 221 |
| `js-example-selected-features` | `BaseGraph` subclass | **yes** | **none** → all `'default'` | webpack | none |
| `js-example-without-defaults` | `BaseGraph` | no | none | webpack | none |

No package today combines Vite + `SelectionCellsHandler` + `'default'`-only edge styles. `js-example-selected-features`
is functionally the target but has no size guard.

### Cost of a new example package

Tooling cost is near zero, everything is glob-based:
- `scripts/build-all-examples.bash:28,42,48` globs `packages/ts-example*` / `packages/js-example*`.
- `.github/workflows/_reusable_build_examples.yml:39-41` uploads `packages/{js,ts}-example*/dist/`.
- Root `package.json` workspaces is `./packages/*`; root `tsconfig.json` includes `packages/*/src`; eslint ignores are
  globs.
- CI cost: one extra `npm run build` inside the existing `build_examples` job, on 3 runners. No new job or matrix
  entry. `package-lock.json` install cache invalidated once.

Manual sync cost is the real one, 6 places:
1. `README.md:143-163` (the "## Examples" block, copied into the website)
2. `packages/website/docs/demo-and-examples.md:6-42` (the mirrored copy, kept in sync by hand)
3. `packages/website/docs/usage/graph.md:333-337`
4. `.github/workflows/create-github-release.yml:140-149` — **hardcoded 6-row bundle-size table** in the release-notes
   template
5. the "keep in sync with …" notes in the example READMEs
6. `CLAUDE.md:62` and `AGENTS.md:44,50,57`

Plus the sibling files a Vite example needs: `index.html`, `favicon.svg`, `src/style.css`, `src/vite-env.d.ts`,
`tsconfig.json`, `README.md`, `vite.config.js`, `package.json` (naming convention
`@maxgraph/ts-example-vite-<suffix>`, `private: true`, devDep `vite ~8.2.1`, no `@maxgraph/core` dependency declared).

---

## Documentation context

`packages/website/docs/usage/cell-handlers.md` (251 lines, created by #823):

- `## Choosing the handler of an edge` (:137) with the `handlerKind` table (:144-148) and the fallback rule (:150-151)
- `## Configuring the handler factories` (:160) — where `setEdgeHandlerFactory` (:179-184),
  the custom-kind example (:186-191) and `setEdgeHandlerFactoryForAllKinds` (:196-203) live
- `:::info[Changed in 0.25.0]` block at :210-216

Insertion point for the new content: after the `setEdgeHandlerFactoryForAllKinds` warning (:208) and before the
`:::info[Changed in 0.25.0]` block (:210). All code fences on this page use ```typescript; imports are shown only in
the first sample of a section.

`packages/website/docs/usage/plugins.md:64-90` shows the idiom to mirror for wording and shape: spread the defaults,
then extend (`[...getDefaultPlugins(), RubberBandHandler]`), plus a `BaseGraph` variant. `getDefaultPlugins()` is
documented in prose, not under its own heading.

Both must also cover the two cases required by the scope: adding a missing kind, and overriding `'default'`.

## CHANGELOG

`CHANGELOG.md` has an `## Unreleased` section (:8) whose `**Breaking Changes**:` bullets already describe the #823
handler migration. Format: `-` bullets, indented sub-bullets, indented ```typescript fences, wording
"For example, migrate: … to: …". The new breaking change is a bullet in that same section.

## JSDoc conventions for the new helper

Mirror `getDefaultPlugins` (`packages/core/src/view/plugin/index.ts:40-58`) and `registerDefaultStyleElements`
(`packages/core/src/view/register-style-elements.ts`):
- `export const` arrow function, explicit return type
- `{@link}` cross references
- an explicit "returns a new object each time it is called" sentence
- a tree-shaking caveat paragraph (mandatory here: the helper is precisely what defeats tree-shaking when used)
- `@category` (pick from `packages/core/tsconfig.json:21-45`; `Plugin` and/or `Configuration`) and `@since 0.25.0`
- new file header starts `Copyright 2026-present The maxGraph project Contributors`

---

## Key Files

| Path | Why |
|---|---|
| `packages/core/src/view/plugin/SelectionCellsHandler.ts:38-39,67-74,269-276,296-321` | the coupling, the resolution, the setters |
| `packages/core/src/view/AbstractGraph.ts:434-459` | constructor, plugin loop at :456, insertion point at :457 |
| `packages/core/src/view/AbstractGraph.ts:462-463,495` | `getPlugin` and the `?.` precedent |
| `packages/core/src/view/Graph.ts:88-95` | `super()` object literal where the defaults are passed |
| `packages/core/src/view/BaseGraph.ts` | no change needed |
| `packages/core/src/types.ts:1556-1565` | `GraphOptions`, where the option is declared |
| `packages/core/src/view/handler/default-edge-handler-factories.ts` | **new file** |
| `packages/core/src/index.ts` | +1 re-export line |
| `packages/core/__tests__/view/plugin/SelectionCellsHandler.test.ts` | characterization + new tests |
| `packages/core/__tests__/view/BaseGraph.test.ts`, `Graph.test.ts` | construction-level tests |
| `packages/website/docs/usage/cell-handlers.md:160-216` | documentation |
| `CHANGELOG.md:8` | breaking change bullet |
| `packages/*/vite.config.js:49` | `chunkSizeWarningLimit` |

## Patterns to Follow

- `isNullish` from `internal/utils.js` instead of `!x` / `=== null` (`.claude/rules/architecture/coding-practices.md`)
- `.js` extensions in `src/` imports (not in tests), `import type` for type-only imports
- explicit return types on every exported function and class method
- `log()` from `internal/utils.js` for any warning, never `console`
- object form of `insertVertex` / `insertEdge` in tests and examples
- commit message: no issue reference in subject or body, `BREAKING CHANGE:` footer with one bullet per break

## Dependencies

- #823 is merged (`adcb78e8b`) and provides the whole setter API this PR builds on.
- Nothing else is in flight on these files (`git log main..HEAD` empty).
- The follow-up `onConfigure(options)` plugin hook is deliberately out of scope; the forwarding code added at
  `AbstractGraph.ts:457` is what it will later replace, so keep it isolated in a single small block.

---

## Decisions taken

**A. No example is modified or added (decided 2026-08-12).** Changing an existing example breaks the continuity of
its recorded size history, and a new example was judged not worth its maintenance cost (6 manual sync points, the
hardcoded release-notes table, one more build on 3 CI runners).

Consequence: **item 7 leaves the PR scope**. No example source, no `vite.config.js` and no `chunkSizeWarningLimit` is
touched. The gain is demonstrated by a throwaway local measurement, reported in the PR description only.

Measurement protocol (all on `ts-example-without-defaults`, which registers no edge style, so every edge resolves to
`'default'`; the local patch adds `plugins: [SelectionCellsHandler]` to its `new BaseGraph(...)` call and is reverted
afterwards):

| # | State | Expected |
|---|---|---|
| 1 | `main` + local patch | baseline: the three handlers bundled |
| 2 | feature branch + local patch | only `EdgeHandler` bundled, ~7-8 kB below #1 |
| 3 | feature branch + local patch + `edgeHandlerFactories: getDefaultEdgeHandlerFactories()` | back to #1, proving `Graph` users pay exactly what they pay today |

Optional 4th data point, to feed the issue's estimate table: only `{ elbow }` passed, expected ~5 kB below #1.

Build with `node ./node_modules/vite/bin/vite.js build --base ./` after `npm run build -w packages/core`; read the
`assets/maxgraph-*.js` size, which matches `Buffer.byteLength` and `scripts/build-all-examples.bash` to the byte.

Open point: issue #890's acceptance criteria still require an example that does not bundle the two subclasses and a
`chunkSizeWarningLimit` pinning the win. They must be updated to match this decision, or explicitly deferred to a
follow-up.

## Open decisions for the Plan phase

**B. Option shape**: `Partial<Record<EdgeStyleHandlerKind, EdgeHandlerFactory>>` is the only workable type (open
union + the "pass only `{ elbow: … }`" requirement). Confirm in the Code phase.

**C. Silent no-op**: passing `edgeHandlerFactories` without registering `SelectionCellsHandler` in `plugins` does
nothing. Decide whether that warrants a `log().warn(...)`.

**D. Expected gain**: ~7-8 kB when both subclasses are dropped (per #823's own estimate). To be measured, then used to
set the new `chunkSizeWarningLimit`.

**E. Blocking size guard**: verified feasible (see above). Decide whether it lands in this PR or in a dedicated one
before it. Recommendation: a dedicated PR first, so the guard is already in place and the #890 PR then shows the drop
against a real gate rather than a warning. It is independent of #890 and touches three example configs plus one new
shared file.
