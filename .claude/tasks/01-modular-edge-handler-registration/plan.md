# Implementation Plan: modular edge handler registration

Companion of `explore.md` in the same folder, which holds the verified context this plan relies on. Read it first.

## Overview

`SelectionCellsHandler` keeps only the `'default'` edge handler factory. The three built-in kinds become an opt-in,
passed through a new `edgeHandlerFactories` graph option that `Graph` fills with a new exported helper. Applications
built on `BaseGraph` that do not opt in stop bundling `ElbowEdgeHandler` and `EdgeSegmentHandler`.

Working mode: **strict TDD**. Each cycle is RED (write the test, run it, watch it fail for the stated reason), GREEN
(minimal production code, run the suite), COMMIT, then REFACTOR (clean up, re-run, commit again only if something
changed).

The cycles are ordered so that every one of them has a genuine failing test, and so that the single breaking change is
isolated in one atomic commit. Cycle 0 is the exception and says so explicitly.

## Decisions

**D1. Option type: `Partial<Record<EdgeStyleHandlerKind, EdgeHandlerFactory>>`.** Not a debate: `EdgeStyleHandlerKind`
is an open union (`types.ts:1620-1631`), so a non-partial `Record` is unsatisfiable. `Partial` is also what the stated
UX requires, passing `{ elbow: … }` alone. Consequence for the implementation: iterating the record yields
`EdgeHandlerFactory | undefined` values, so entries whose value is nullish must be skipped with `isNullish`.

**D2. A silent no-op when the plugin is absent.** Passing `edgeHandlerFactories` without registering
`SelectionCellsHandler` does nothing and emits nothing. Two reasons, the second being the decisive one:

- the existing precedent in the same class is silent: `setTooltips` (`AbstractGraph.ts:495`) no-ops through `?.` when
  `TooltipHandler` is absent;
- the follow-up `onConfigure(options)` hook inverts the direction: iteration starts from the plugins that were
  actually loaded, and each pulls its own configuration. From that side, a missing plugin is undetectable by
  construction. Detecting it would require a mapping from configuration property to owning plugin, which cannot exist
  for a custom plugin whose npm dependency is not even installed. Warning here would create an inconsistency that the
  generalization then has to remove.

The documentation states that the option requires the plugin.

**D3. The characterization tests are rewritten, not deleted.** Two existing `test.each` blocks in
`SelectionCellsHandler.test.ts` (`:225-238` for elbow, `:240-252` for segment) assert today's behavior on a
`BaseGraph`. They are the characterization of the old behavior and they are the tests that go red at cycle 3. They are
rewritten to cover the two branches that then exist: not configured, so the fallback applies; configured through the
option, so the dedicated handler applies. The `Graph`-level coverage added at cycle 0 is a permanent regression guard
and is never removed.

**D4. `AbstractGraph` iterates and calls the existing `setEdgeHandlerFactory`.** No new public API on the plugin. The
internal map is `private readonly`, so it can only be mutated, and going through the setter preserves the
"there is always an entry for `'default'`" invariant that `createEdgeHandler` relies on
(`SelectionCellsHandler.ts:269-276`). A public bulk setter would be public surface to document, test and support,
while the follow-up hook makes that loop internal to the plugin anyway.

**D5. The helper returns the three kinds, `'default'` included.** Even though the plugin already seeds `'default'`
itself, so re-setting it changes nothing observable:

- otherwise the name lies. The function claims the complete set of built-in factories, exactly like `getDefaultPlugins`
  returns the complete plugin list and not "the ones `BaseGraph` is missing";
- it decouples the helper from an implementation detail of the plugin. What the plugin happens to seed is precisely
  what this PR is changing, and nothing says the `'default'` entry itself will not become opt-in later. With the three
  entries, the helper stays correct whatever the plugin does;
- the documented idiom only reads correctly with it. The page will show spread-then-override,
  `{ ...getDefaultEdgeHandlerFactories(), default: … }`, mirroring how `plugins.md` presents `getDefaultPlugins()`. If
  `'default'` is absent from the record, the object no longer describes the full set of available keys, and overriding
  the default looks like adding an out-of-scope key rather than replacing one;
- the cost is nil. Re-setting `'default'` overwrites the plugin's entry with an equivalent factory and adds no import:
  `EdgeHandler` is the base class of both subclasses, so it is in the import graph either way. No bundle impact for
  `Graph` or for `BaseGraph`.

The one real cost, to document: someone subclassing `SelectionCellsHandler` to change `'default'` in their own field
initializer sees that override replaced when the helper is passed. This is already true for `'elbow'` and `'segment'`,
so excluding `'default'` would create an asymmetry with no explanation. The documented remedy is the same in both
cases: call the setters after construction, or pass an explicit record.

## Dependencies and ordering

Order is driven by the need for a real RED at each step:

| Cycle | Why it must come here |
|---|---|
| 0. Regression guard | Must exist before anything moves, it is what proves `Graph` behavior is preserved at cycle 3 |
| 1. The helper module | `Graph` cannot pass the defaults before the helper exists |
| 2. The option and its forwarding | Must land before the flip, otherwise `Graph` has no way to restore the kinds |
| 3. The flip, breaking change | Only now can the plugin drop the two entries without regressing `Graph` |
| 4. Documentation and CHANGELOG | Describes the final state, so it comes after it |
| 5. Measurement and CI | Verification, produces no commit except the CI fixes it may reveal |

---

## Cycle 0 — regression guard on the handler kinds per graph class

**Honest note: this cycle has no RED.** It pins behavior that is correct today, so the test passes on the first run.
Its value is entirely in cycle 3, where it is the tripwire that catches a regression on `Graph`. Do not fabricate a
failure to make it look like TDD: run it, state that it passes, and move on.

**Test file**: `packages/core/__tests__/view/plugin/SelectionCellsHandler.test.ts`, a new top-level `describe` named
`Edge handler kinds available per graph class`, placed after the `Handler lifecycle on selection` describe.

Tests, all going through the real selection path (insert an edge with the style, select it, assert on
`plugin.getHandler(edge)`), reusing the `insertEdge` and `getPlugin` helpers of the neighbouring describe:

- `Graph provides the elbow handler`, `Graph provides the segment handler`, `Graph provides the default handler`
- `BaseGraph provides the elbow handler`, `BaseGraph provides the segment handler`,
  `BaseGraph provides the default handler`

The three `BaseGraph` ones will be rewritten at cycle 3. The three `Graph` ones must stay green from now to the end of
the PR.

**Trap to handle in this cycle, not later**: instantiating `Graph` calls `registerDefaultStyleElements()`, which
populates the **global** shape, perimeter, marker and edge style registries. The rest of this test file contains cases
titled `Default builtin styles NOT registered - …` that assume empty registries. Without cleanup they turn flaky
depending on execution order. Add an `afterEach` on the new describe that unregisters all four registries, mirroring
the `unregisterAll` helper of `packages/core/__tests__/view/register-style-elements.test.ts:29-33`, rather than the
edge-style-only `unregisterAllEdgeStyles()` used elsewhere in the file.

- **RED**: none, see above. Run the file and confirm the six tests pass.
- **GREEN**: no production code.
- **COMMIT**: `test: pin the edge handler kinds provided by Graph and BaseGraph`
- **REFACTOR**: factor the shared `insertEdge` / `getPlugin` helpers if the new describe duplicates them; the file
  already declares them twice, so extract to the module scope only if it stays readable.

---

## Cycle 1 — `getDefaultEdgeHandlerFactories()`

**Test file**: `packages/core/__tests__/view/handler/default-edge-handler-factories.test.ts` (new, the directory
already exists). Header `Copyright 2026-present The maxGraph project Contributors`.

Tests, in a `describe('getDefaultEdgeHandlerFactories')`:

- `returns a factory for the three builtin handler kinds` — assert the keys are exactly `default`, `elbow`, `segment`
- `returns a new object each time it is called` — mirrors the wording of the `getDefaultPlugins` JSDoc; assert the two
  returned objects are not the same reference
- a `test.each` over the three kinds, `creates a %s handler` — call each factory with a `CellState` and assert the
  produced class. For `'default'`, assert it is exactly an `EdgeHandler` and not one of the two subclasses, reusing
  the shape of `expectExactInstanceOfEdgeHandler` (`SelectionCellsHandler.test.ts:125-129`). Build the `CellState`
  like `createCellState` does (`:104-112`): a `BaseGraph`, a `Cell` marked as edge, absolute points and a shape.

- **RED**: `TypeError: (0 , _src.getDefaultEdgeHandlerFactories) is not a function` — the export does not exist, so
  the imported binding is `undefined`. `npm run test-check -w packages/core` fails in addition with TS2305,
  `Module '"../../../src"' has no exported member 'getDefaultEdgeHandlerFactories'`.
- **GREEN**:
  - create `packages/core/src/view/handler/default-edge-handler-factories.ts`, exporting a const arrow function with
    an explicit return type, importing the three handler classes and `EdgeHandlerFactory` /`EdgeStyleHandlerKind` as
    types. JSDoc mirroring `getDefaultPlugins` (`view/plugin/index.ts:40-58`) and `registerDefaultStyleElements`
    (`view/register-style-elements.ts`): `{@link}` cross references, the explicit "returns a new object each time it
    is called" sentence, a tree-shaking caveat paragraph saying that using it is exactly what pulls the two
    subclasses into the bundle, `@category Plugin` plus `@category Configuration`, and `@since 0.25.0`.
  - add `export * from './view/handler/default-edge-handler-factories.js';` to `packages/core/src/index.ts`, right
    after `export * from './view/handler/config.js';` (`:61`).
- **COMMIT**: `feat: add getDefaultEdgeHandlerFactories to expose the builtin factories`
- **REFACTOR**: nothing expected. If the `CellState` construction is duplicated between this new file and
  `SelectionCellsHandler.test.ts`, leave it: the shared-helper move belongs to a separate cleanup, not to this PR.

---

## Cycle 2 — the `edgeHandlerFactories` option and its forwarding

**Test file**: `packages/core/__tests__/view/plugin/SelectionCellsHandler.test.ts`, new describe
`edgeHandlerFactories option`.

Tests:

- `Use the factory passed for a custom handler kind` — declare a local `class CustomElbowEdgeHandler extends
  ElbowEdgeHandler {}`, build `new BaseGraph({ plugins: [SelectionCellsHandler], edgeHandlerFactories: { elbow: … } })`
  after `registerDefaultEdgeStyles()`, insert an edge styled `elbowEdgeStyle`, select it, expect the custom class.
  **This is the red driver.**
- `Apply the factories before the first selection` — the option is applied at construction, so unlike
  `setEdgeHandlerFactory` (see the existing `Only affect the handlers created after the factory is set`, `:536-550`),
  no handler can pre-exist. Select immediately after construction and assert the configured class.
- `Ignore the option when the plugin is not registered` — construct a `BaseGraph` with the option but an empty
  `plugins`, assert no throw. Green before and after; it guards the `?.` path and the D2 decision.
- `Ignore an entry whose factory is nullish` — pass `{ elbow: undefined }`, assert the built-in elbow handler is still
  used. Guards the `isNullish` skip.

- **RED**: `expect(received).toBeInstanceOf(expected)`, `Expected constructor: CustomElbowEdgeHandler`,
  `Received constructor: ElbowEdgeHandler` — the option is ignored today and the plugin's own `'elbow'` entry answers.
  `test-check` also fails: `Object literal may only specify known properties, and 'edgeHandlerFactories' does not
  exist in type 'GraphOptions'`.
- **GREEN**:
  - `packages/core/src/types.ts`: add `edgeHandlerFactories?: Partial<Record<EdgeStyleHandlerKind,
    EdgeHandlerFactory>>` to the `GraphOptions` literal (`:1556-1565`), next to `plugins`. Not in
    `GraphCollaboratorsOptions`, which is consumed by `initializeCollaborators` before any plugin exists. JSDoc: what
    it does, that it requires the `SelectionCellsHandler` plugin, a pointer to `getDefaultEdgeHandlerFactories`, and
    `@since 0.25.0`.
  - `packages/core/src/view/AbstractGraph.ts`: between the plugin loop (`:456`) and `view.revalidate()` (`:458`),
    retrieve the plugin with `getPlugin` and, for each entry of the option, call `setEdgeHandlerFactory(kind, factory)`
    through `?.`, skipping nullish factories with `isNullish`. Keep it as one small isolated block: the follow-up
    `onConfigure` hook replaces exactly this block, so it must be easy to lift out. Add a short comment saying so.
- **COMMIT**: `feat: add the edgeHandlerFactories graph option`
- **REFACTOR**: consider extracting the block into a private method of `AbstractGraph` if the constructor becomes hard
  to read. Judgement call at that moment; a three-line block inline is fine.

---

## Cycle 3 — the flip: only `'default'` in the plugin, `Graph` restores the rest

This is the breaking change and it is atomic on purpose: the plugin cannot drop the entries without `Graph` passing
them back in the same commit, or the cycle-0 guard goes red.

**Test files**: `SelectionCellsHandler.test.ts` for the new expectations and the rewrite of the two characterization
blocks.

New tests, in the `edgeHandlerFactories option` describe or a sibling one:

- `Fall back to EdgeHandler for the elbow kind when not configured` and the same for `segment` — a `BaseGraph` with
  only the plugin, an edge styled `elbowEdgeStyle` / `segmentEdgeStyle`, expecting exactly an `EdgeHandler` through
  the `expectExactInstanceOfEdgeHandler` assertion. **Red driver.**
- `Restore the three builtin kinds with getDefaultEdgeHandlerFactories` — a `BaseGraph` configured with the helper,
  asserting elbow and segment edges get their dedicated handlers. Passes trivially before the flip, becomes the proof
  of the opt-in path after it.

Rewrites in the same commit:

- `:225-238`, `Expect ElbowEdgeHandler for edgeStyle: %s`, and `:240-252`, `Expect EdgeSegmentHandler for edgeStyle:
  %s`: both build a plain `BaseGraph` and go red on the flip. Rewrite them so the graph opts in through the new
  option, and keep the block name explicit about it.
- Verified as staying green, do not touch them: the `setEdgeHandlerFactoryForAllKinds` describe (`:312-394`, it clears
  the map and relies on the `'default'` fallback), `Register custom edge handler` (`:289-310`, sets each kind
  explicitly), `Use the factory matching the handler kind of the edge style` (`:521-534`, sets `'elbow'` explicitly),
  and every `Default builtin styles NOT registered` block.
- The three `BaseGraph provides the … handler` tests from cycle 0: rewrite to the new contract, `BaseGraph provides
  only the default handler`. The three `Graph provides …` ones must remain untouched and green.

- **RED**: `expect(received).not.toBeInstanceOf(expected)` on the fallback tests, received constructor
  `ElbowEdgeHandler` where a plain `EdgeHandler` is expected.
- **GREEN**:
  - `packages/core/src/view/plugin/SelectionCellsHandler.ts`: remove the `'elbow'` and `'segment'` entries from the
    field initializer (`:67-74`) and the two now-unused imports (`:38-39`). Add a comment on the field explaining that
    it must keep referencing `EdgeHandler` only, and must never import the new helper module, since that would restore
    the static edge to both subclasses and cancel the whole point of the change.
  - `packages/core/src/view/Graph.ts`: import the helper and add `edgeHandlerFactories:
    getDefaultEdgeHandlerFactories()` to the object literal passed to `super()` (`:88-95`). No new positional
    parameter.
- **COMMIT**: `feat!: register only the default edge handler in SelectionCellsHandler`, with a `BREAKING CHANGE:`
  footer listing what `BaseGraph` consumers must now do. Body explains the why (bundle size) and the how (opt-in
  through the option, or the helper for the previous behavior). No issue reference anywhere in the message.
  The `CHANGELOG.md` entry lands in this same commit, as a bullet under `**Breaking Changes**:` of `## Unreleased`
  (`:8`), mirroring the format of the existing #823 bullets: prose, indented sub-bullets, and an indented
  ```typescript fence with the "For example, migrate: … to: …" wording.
- **REFACTOR**: re-read the two touched source files for leftovers, in particular unused imports and JSDoc on
  `setEdgeHandlerFactory` that may now need to mention the option.

---

## Cycle 4 — documentation

**File**: `packages/website/docs/usage/cell-handlers.md`. Insertion point: after the `setEdgeHandlerFactoryForAllKinds`
warning (`:205-208`) and before the `:::info[Changed in 0.25.0]` block (`:210`).

Content to add, as a `###` subsection inside `## Configuring the handler factories`:

- state the new default: the plugin ships only the `'default'` factory, so an application that selects an edge styled
  with an elbow or segment kind gets the base `EdgeHandler` unless it opts in;
- the construction option, with a `typescript` fence showing `BaseGraph` receiving `edgeHandlerFactories`; the page
  shows imports only in the first sample of a section, follow that;
- **adding a missing kind**, the `{ elbow: … }` case;
- **overriding the `'default'` one**, which is the second case required by the scope;
- `getDefaultEdgeHandlerFactories()` documented in prose, not under its own heading, mirroring how `plugins.md:64-90`
  treats `getDefaultPlugins()`, including the spread-then-override idiom;
- a sentence on ordering: the option is applied at construction, so a later
  `setEdgeHandlerFactoryForAllKinds` call discards it;
- a sentence on the requirement: the option is ignored when the `SelectionCellsHandler` plugin is not registered;
- update the `handlerKind` table area (`:144-151`) or its surrounding prose if it now reads as if the three handlers
  were always available;
- mark the new content `(since 0.25.0)` in the style already used on the page.

- **RED**: not applicable, documentation. The verification is `npm run build -w packages/website` if the CI list
  covers it, plus a manual re-read.
- **COMMIT**: `docs: document the edge handler factories graph option`
- **REFACTOR**: check the `edge-styles.md` and `plugins.md` cross links added by #823 still describe reality.

---

## Cycle 5 — verification, no feature commit

1. **Full CI list** from `CLAUDE.md`, in order: build core, `test-check`, tests with coverage, `ts-support` tests,
   `./scripts/build-all-examples.bash`, build `packages/html`, `check:circular-dependencies`, `lint`,
   `check:npm-package`. The circular-dependency check runs on `lib`, so the core build must precede it.
2. **Manual bundle measurement**, not committed. On `packages/ts-example-without-defaults`, which registers no edge
   style so every edge resolves to `'default'`, apply a throwaway patch adding `plugins: [SelectionCellsHandler]` to
   its `new BaseGraph(...)` call. Build with `npm run build -w packages/core`, then from the example directory
   `node ./node_modules/vite/bin/vite.js build --base ./`, and read the size of `dist/assets/maxgraph-*.js`. Three
   states:

   | # | State | Expected |
   |---|---|---|
   | 1 | `main` + patch | baseline, the three handlers bundled |
   | 2 | this branch + patch | only `EdgeHandler`, about 7 to 8 kB below #1 |
   | 3 | #2 plus `edgeHandlerFactories: getDefaultEdgeHandlerFactories()` | equal to #1 |

   Optional fourth point, `{ elbow: … }` alone, expected about 5 kB below #1, which would confirm the estimate table
   in the issue. Revert the patch afterwards and confirm `git status` is clean. The numbers go in the PR description,
   nowhere else.
3. If #3 does not come back to #1, the forwarding is broken or the helper does not cover the three kinds: stop and
   fix before opening the PR, this is the non-regression proof for `Graph` users.

---

## File changes, summary

### `packages/core/src/types.ts`
- Add `edgeHandlerFactories?: Partial<Record<EdgeStyleHandlerKind, EdgeHandlerFactory>>` to the `GraphOptions` literal
  (`:1556-1565`), with JSDoc and `@since 0.25.0`. Both referenced types are already declared in this file.

### `packages/core/src/view/AbstractGraph.ts`
- Between `:456` and `:458`, forward the option to the `SelectionCellsHandler` plugin, one entry at a time, through
  `?.` and skipping nullish values with `isNullish`. Isolated block with a comment naming it as the future
  `onConfigure` extraction point.

### `packages/core/src/view/handler/default-edge-handler-factories.ts` (new)
- `getDefaultEdgeHandlerFactories()`, returning a fresh record with the three built-in factories.
- The only module besides the plugin that may reference `ElbowEdgeHandler` and `EdgeSegmentHandler`.

### `packages/core/src/view/plugin/SelectionCellsHandler.ts`
- Drop the `'elbow'` and `'segment'` entries and their imports.
- Comment forbidding any import of the helper module from here.

### `packages/core/src/view/Graph.ts`
- Pass `getDefaultEdgeHandlerFactories()` in the existing `super()` object literal.

### `packages/core/src/index.ts`
- One re-export line after `:61`.

### `packages/core/__tests__/view/handler/default-edge-handler-factories.test.ts` (new)
- Coverage of the helper: three kinds, fresh object per call, produced classes.

### `packages/core/__tests__/view/plugin/SelectionCellsHandler.test.ts`
- New describe for the per-graph-class guard, with full registry cleanup.
- New describe for the option.
- Rewrite of the two characterization `test.each` blocks.

### `CHANGELOG.md`
- One bullet under `**Breaking Changes**:` of `## Unreleased`, with the migration snippet.

### `packages/website/docs/usage/cell-handlers.md`
- New subsection inside `## Configuring the handler factories`.

### Not touched
- `packages/core/src/view/BaseGraph.ts`: it has no constructor and inherits `GraphOptions`, nothing to do.
- Any example package, any `vite.config.js`, any `chunkSizeWarningLimit`.
- `packages/core/__tests__/view/plugin/index.test.ts`: the default plugin list is unchanged, its
  `toHaveLength(9)` stays valid.

## Risks

1. **Global registry pollution from `Graph` in tests.** The highest-probability failure of this plan, and it is a
   flakiness that only shows up depending on test order. Mitigated by the full `unregisterAll` in `afterEach` of the
   new describe, see cycle 0.
2. **A future refactor undoing the win.** If anyone makes `SelectionCellsHandler` import the helper module, the static
   edge to both subclasses is back and every test still passes. Only the bundle size would tell. Mitigated by the
   comment required at cycle 3, and this is the reason the measurement of cycle 5 must be reported in the PR.
3. **`Graph` users silently losing handlers.** Caught by the cycle-0 guard and by measurement #3.
4. **Scope creep towards the `onConfigure` hook.** The forwarding block is deliberately dumb and isolated. Resist
   generalizing it here.
