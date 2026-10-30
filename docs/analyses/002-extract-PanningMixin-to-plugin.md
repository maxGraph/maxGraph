# Analysis 002: Extract `PanningMixin` into a plugin

- **Date**: 2026-10-26
- **Analysis basis**: commit `6a2cebcf579556b183d86e210707c665affa45b8` on `main`, after version 0.25.1. File and line
  references point to that commit
- **Question**: should `PanningMixin` leave `AbstractGraph` for a plugin, how does it relate to the `PanningHandler`
  plugin that already exists, and what would the move cost?
- **Related**: [ADR 0001](../adr/0001-use-mixins-to-split-the-graph-class.md),
  [ADR 0002](../adr/0002-use-plugins-for-optional-and-new-features.md),
  [ADR 0003](../adr/0003-move-members-out-of-abstract-graph.md) (Appendix A and B.4),
  [analysis 001](001-extract-SelectionMixin-to-plugin.md),
  [issue #762](https://github.com/maxGraph/maxGraph/issues/762) (open),
  [issue #1149](https://github.com/maxGraph/maxGraph/issues/1149) (open, `onConfigure` plugin hook),
  [PR #1132](https://github.com/maxGraph/maxGraph/pull/1132) (open draft, moves the viewport translation members to
  `PanningMixin`),
  [issue #1297](https://github.com/maxGraph/maxGraph/issues/1297) (open, `PanningHandler.isActive()` always true)

## Relation to ADR 0003 and PR #1132

These three documents answer successive questions.

- ADR 0003 decides which members leave `AbstractGraph` now, and in which existing mixin they wait for a plugin (D2). Its
  step 3 moves `scrollPointToVisible`, `center`, `ignoreScrollbars` and `translateToScrollPosition` to `PanningMixin`.
- PR #1132 implements that step 3. It is a relocation: the members stay mixin members.
- This analysis covers the step that comes next, which ADR 0003 leaves open: D1 expects every mixin to become a plugin,
  D2 says a later split may regroup members differently, and B.4 names the scroll family as the unit that should drive
  that split, without working out how.

It assumes that #1132 has landed. Its file and line references point to the basis commit, before #1132, so the members
#1132 moves are cited at their current place in `AbstractGraph`, and the counts that #1132 changes are given for both
states.

## Summary

| Option | Gain on `ts-example-without-defaults` | Breaking | Effort |
|---|---|---|---|
| 0. Mixin not applied at all (upper bound) | not measured yet; about 3.1 kB minified, estimated | n/a | n/a |
| 1. Keep the mixin, make its collaborator optional | none: there is no collaborator to make optional | no | none |
| 2. Split: scroll family to a new plugin, thin facade on the graph | not measured yet | `BaseGraph` only, silent | 2 to 4 days |
| 3. Full plugin, `ImageBundlePlugin` style | not measured yet | yes, `setPanning` and offsets | 6 to 9 days |

The estimate of option 0 scales the measurement of analysis 001 (3 412 B for the 345 lines of `SelectionMixin.ts`) to
the 316 lines of `PanningMixin.ts`, assuming the same bytes per source line. No build verified it.

`PanningMixin` is not one concern but three: the pan offset (`panDx`, `panDy`, `panGraph`) that every mouse event
reads, the programmatic scrolling (`scrollCellToVisible`, `scrollRectToVisible`), and one switch delegating to the
`PanningHandler` plugin (`setPanning`). Only the second is a plugin candidate. Folding the mixin into `PanningHandler`
is not advised, see [Option 2](#option-2-split-the-scroll-family-into-a-new-plugin-with-a-facade). Recommendation: no
standalone project; extract the scroll family once PR #1132 has landed, see [Recommendation](#recommendation).

## Current implementation

### The pieces

| File | Lines | Role |
|---|---|---|
| `packages/core/src/view/mixin/PanningMixin.ts` | 316 | 18 graph members: 7 properties and 11 methods, listed below |
| `packages/core/src/view/mixin/PanningMixin.type.ts` | 118 | type declarations and TSDoc merged into `AbstractGraph` |
| `packages/core/src/view/plugin/PanningHandler.ts` | 467 | the existing plugin: mouse driven panning, force panning, pinch zoom, owns a `PanningManager` |
| `packages/core/src/view/other/PanningManager.ts` | 261 | timer driven auto panning, created only by `PanningHandler` (`PanningHandler.ts:127`) |

Members of the mixin, by concern:

| Concern | Members | Location |
|---|---|---|
| Pan offset and preview | `panDx`, `panDy`, `getPanDx`, `setPanDx`, `getPanDy`, `setPanDy`, `shiftPreview1`, `shiftPreview2`, `panGraph` | `PanningMixin.ts:55-56,76-194` |
| Panning configuration | `useScrollbarsForPanning`, `isUseScrollbarsForPanning`, `timerAutoScroll`, `isTimerAutoScroll`, `allowAutoPanning`, `isAllowAutoPanning` | `PanningMixin.ts:58-74` |
| Programmatic scrolling | `scrollCellToVisible`, `scrollRectToVisible` | `PanningMixin.ts:196-310` |
| Switch of the plugin | `setPanning` | `PanningMixin.ts:312-315` |

`panGraph` (`:96-194`) is the largest member, about 100 lines: with scrollbars it sets `container.scrollLeft` and
`scrollTop`, without them it moves the DOM children of the container into two absolutely positioned `div`s
(`shiftPreview1` and `shiftPreview2`), applies a `transform` to the canvas, and fires `InternalEvent.PAN`.

Members of the same family still in `AbstractGraph`, which ADR 0003 (Appendix A, B.4) targets at `PanningMixin` and
open PR #1132 moves there: `scrollPointToVisible` (`AbstractGraph.ts:651-728`), `center` (`:922-964`),
`ignoreScrollbars` (`:289`), `translateToScrollPosition` (`:297`), `isIgnoreScrollbars` and
`isTranslateToScrollPosition` (`:476-477`). The ADR records step 3 as carried out, but only #1131 reached `main`;
#1132 to #1136 are open.

### How the mixin and `PanningHandler` relate

They are coupled in both directions, through the graph:

- The mixin reaches the plugin with `getPlugin` and a nullish fallback: `setPanning` sets
  `PanningHandler.panningEnabled` (`PanningMixin.ts:312-315`). `scrollRectToVisible` also refreshes the
  `SelectionCellsHandler` plugin (`:298-305`).
- The plugin calls the mixin: `this.graph.panGraph` while dragging (`PanningHandler.ts:369`) and to reset the preview
  (`:406`), `isUseScrollbarsForPanning` on mouse up (`:401`). Its `PanningManager` calls `panGraph`, `setPanDx`,
  `setPanDy`, `getPanDx`, `getPanDy` (`PanningManager.ts:81-87,189-201`).
- `AbstractGraph.scrollPointToVisible` uses both: the mixin flags `isTimerAutoScroll`, `isAllowAutoPanning` and the
  offsets, then `panningHandler.getPanningManager().panTo(...)` (`AbstractGraph.ts:652-727`).

So the split is not "graph side" against "plugin side" of one feature. `PanningHandler` is the **interactive** side:
gestures turned into a pan. The mixin holds the **viewport offset** that any code converting a pointer position must
subtract, and the **programmatic** scrolling, which needs no gesture at all. `panGraph` is the bridge: it is the
primitive `PanningHandler`, `PanningManager` and `Outline` all drive.

The two names already disagree on the plugin side: `PanningHandler` has its own `panGraph`
(`PanningHandler.ts:449-451`), which sets a persistent view translation, while the graph's `panGraph` only previews one.

### Wiring

- `_graph-mixins-apply.ts:31,59` applies the mixin, `_graph-mixins-types.ts:31` imports its types. Nothing else wires
  it.
- `AbstractGraph`, `BaseGraph` and `Graph` create **nothing** for it. There is no collaborator option in
  `GraphCollaboratorsOptions`, and `BaseGraph.ts:20-26` creates no panning object. `PanningManager` exists only inside
  `PanningHandler`.
- `PanningHandler` is opt-in like every plugin: listed in `getDefaultPlugins()` (`plugin/index.ts:55`) for `Graph`,
  absent from `BaseGraph` unless passed, id `'PanningHandler'` in `BuiltinPluginId` (`types.ts:1233`).
- Serialization: `GraphCodec` excludes no panning field (`serialization/codec/GraphCodec.ts:23-31`) and there is no
  codec for `PanningHandler` or `PanningManager`. The mixin defaults sit on the prototype, non enumerable, so they are
  not encoded. `panGraph` and `PanningManager` assign `panDx`, `panDy` and `shiftPreview1/2` on the instance, which
  makes them own enumerable fields that `ObjectCodec.encodeObject` walks (`ObjectCodec.ts:411`). They are written
  only when they differ from the template (`:456`), and they return to `0` and `null` at the end of a pan, so an export
  made during a pan is the only case affected. From reading, not tested.
- "No global state for mixin properties": the mixin has no mutable default (`null`, booleans, numbers), so none of its
  members is in `__tests__/view/no-global-state-for-mixin-properties.ts:39-95`, and none needs to be. A plugin
  conversion is not blocked by D3 of ADR 0003.

### Who calls it

55 call sites in 15 files of `packages/core/src`, outside the mixin files. Per member:

| Member | Sites | Member | Sites |
|---|---|---|---|
| `getPanDx` | 14 | `panGraph` | 7 |
| `getPanDy` | 14 | `scrollCellToVisible` | 3 |
| `setPanDx` | 2 | `scrollRectToVisible` | 1 |
| `setPanDy` | 2 | `setPanning` | 1 |
| `panDx` (property) | 3 | `isUseScrollbarsForPanning` | 1 |
| `panDy` (property) | 3 | `isTimerAutoScroll` | 1 |
| `useScrollbarsForPanning` (property) | 2 | `isAllowAutoPanning` | 1 |

`shiftPreview1`, `shiftPreview2`, `timerAutoScroll` and `allowAutoPanning` have no site outside the mixin. The last
two are read only through their getters, and nothing in the repository sets them: not the core, the stories, the
examples nor the documentation.

**Always bundled, 9 sites**, in `AbstractGraph` and the mixins:

- `EventsMixin.updateMouseEvent` subtracts `getPanDx()` and `getPanDy()` from **every** mouse event
  (`EventsMixin.ts:397-398`).
- `SwimlaneMixin.getDropTarget` does the same (`SwimlaneMixin.ts:241-242`).
- `ZoomMixin.zoom` calls `scrollRectToVisible` when `keepSelectionVisibleOnZoom` is set (`ZoomMixin.ts:89`), `false`
  by default (`:43`), and revalidates the view when it returns `false`.
- `AbstractGraph.scrollPointToVisible` reads `isTimerAutoScroll`, `isAllowAutoPanning`, `getPanDx` and `getPanDy`
  (`AbstractGraph.ts:655,722,726`). It is itself called by `EventsMixin` on every mouse move with the button down
  (`EventsMixin.ts:686`), since `autoScroll` defaults to `true` (`DragDropMixin.ts:42`).

After #1132 and option 2, `scrollPointToVisible` leaves the always-bundled code for the plugin, together with its 4
sites. The always-bundled sites left are 5: the 4 offset reads of `EventsMixin` and `SwimlaneMixin`, and the call of
`ZoomMixin.zoom`.

**Plugins and handlers, 14 sites**: `PanningHandler` (3), `ConnectionHandler` (4), `SelectionHandler` (3, including
`scrollCellToVisible` at `SelectionHandler.ts:1590`), `RubberBandHandler` (2), `EdgeHandler` (2). Apart from
`PanningHandler`, they only read the offsets.

**Standalone classes of `view/other`, 29 sites**, bundled only when imported: `Outline` (10: `panGraph` and the
`useScrollbarsForPanning`, `panDx`, `panDy` properties), `PanningManager` (9), `Guide` (8), `DragSource` (2).
`Outline` is not a plugin: it takes the graph in its constructor (`Outline.ts:73`) and, when the graph has scrollbars,
`panGraph` is what scrolls it (`Outline.ts:586,635`), not only a preview.

**Editor layer, 3 sites**: `Editor` calls `setPanning(true)` on the `Graph` it creates (`Editor.ts:1395`) and
`scrollCellToVisible` (`:2571`), `EditorToolbar` calls `scrollCellToVisible` (`EditorToolbar.ts:433`).

None of the 55 sites runs in a constructor: they are in mouse handlers, timers and command methods.

Outside the core package:

- **Tests**: `__tests__/view/mixin/PanningMixin.test.ts` (23 lines) holds one test, checking that `setPanning` does not
  throw without the plugin. Nothing tests `panGraph`, the offsets or the scroll methods.
  `__tests__/view/plugin/PanningHandler.test.ts` (53 lines) only covers `onDestroy`.
- **Stories**: 24 sites in 20 files. `setPanning(true)` in 19 stories, `scrollCellToVisible` in 3 (`Clipboard`,
  `DragSource`, `AutoLayout`), `panDx` and `panDy` read in `Wires.stories.ts:556-557`.
- **Examples**: `setPanning(true)` in the 4 examples using `Graph`: `js-example`, `js-example-selected-features`,
  `ts-example`, `ts-example-selected-features`. The `*-without-defaults` examples call nothing.
- **Website**: `setPanning(true)` in `getting-started.mdx:74` and twice in `usage/plugins.md` (`:79`, the table of
  opt-in plugins, and `:109`). No page documents `panGraph`, the offsets or the scroll methods.

### Prior decisions

- ADR 0003: Appendix A and B.4 place the scroll family in `PanningMixin` and name it as the unit of the eventual plugin
  split, see [the relation above](#relation-to-adr-0003-and-pr-1132). D6 keeps `setTooltips`, a two-line delegation to
  `TooltipHandler`, rather than deprecating it; `setPanning` has exactly the same shape.
- PR #1132: open draft since 2026-08-10. Its description records why `center` goes to `PanningMixin` rather than
  `FitPlugin`, and the one runtime break it brings, for detached references to `isIgnoreScrollbars` and
  `isTranslateToScrollPosition`.
- Issue #762 covers the handler factories and two edge style members (ADR 0003, D7), none of the panning members.
- `git log --follow` on `PanningMixin.ts`: no member moved in or out since the mixin was created in 2021. The recent
  commits are renames and typing changes (#470, #512, #735, #743, #776, #985). `ffd503605` (#272, 2023-12-07) added the
  nullish fallback of `setPanning`.

### Side finding

`PanningHandler.isActive()` returns `this.active || this.initialScale !== null` (`PanningHandler.ts:234-236`), while
`initialScale` is a number initialized to `0` (`:183`) and reset to `0` (`:107`), never to `null`. The method therefore
always returns `true`, so the `allowAutoPanning` branch of `AbstractGraph.scrollPointToVisible`
(`AbstractGraph.ts:720-727`) can never call `PanningManager.panTo`. `isActive` has no other caller.

In `mxGraph`, `initialScale` has no default and is reset to `null` on `gestureend`, so the same test was correct
([`mxPanningHandler.js:76-78,215-217`](https://github.com/jgraph/mxgraph/blob/ff141aab158417bd866e2dfebd06c61d40773cd2/javascript/src/js/handler/mxPanningHandler.js#L215-L217)).
The `0` and the `!== 0` checks came with `648e324cc06254c90694347dc216ac008aa63697` (2021-08-09), first released in
`v0.1.0`, which left `isActive` on `!== null`. Found by reading, not reproduced at runtime. Reported as
[issue #1297](https://github.com/maxGraph/maxGraph/issues/1297).

## Size measurement

Not measured. The protocol below is the one of analysis 001.

- Example: `packages/ts-example-without-defaults`, a bare `BaseGraph` with no plugin, Vite, `maxgraph` chunk, raw
  minified bytes. The current limit is `chunkSizeLimitInKB = 221` (`vite.config.js:27`).
- For each variant: apply the patch, rebuild the ESM output of the core package (`npm run build:esm -w packages/core`),
  build the example (`npm run build -w packages/ts-example-without-defaults`), read the `maxgraph` chunk, revert.
- The runtime of the patched variants is not checked: variants 1 and 4 leave `getPanDx` undefined, which throws on the
  first mouse event.

| Variant | Patch | Minified | Delta minified |
|---|---|---|---|
| Baseline | none | not measured yet | |
| 1. Mixin not applied (upper bound of option 3) | A | not measured yet | not measured yet |
| 2. Scroll methods of the mixin stubbed (option 2, today) | B | not measured yet | not measured yet |
| 3. Variant 2, plus `scrollPointToVisible` and `center` stubbed (option 2, after #1132) | B + C | not measured yet | not measured yet |
| 4. Variant 1, plus `scrollPointToVisible` and `center` stubbed (whole family) | A + C | not measured yet | not measured yet |

Variant 1 is the analogue of the first variant of 001. 001's second variant, the collaborator no longer created by
`BaseGraph`, has no analogue here, since `BaseGraph` creates nothing for panning and `PanningHandler` is already out of
this example. Variants 2 and 3 ignore the cost of the facade, a few one-line methods.

Patch A, in `packages/core/src/view/mixin/_graph-mixins-apply.ts`:

```diff
-import { PanningMixin } from './PanningMixin.js';
 ...
     OverlaysMixin,
-    PanningMixin,
     PortsMixin,
```

Patch B, in `packages/core/src/view/mixin/PanningMixin.ts`: replace the body of `scrollCellToVisible` (`:196-225`) and
`scrollRectToVisible` (`:227-310`) with stubs, and drop the imports they alone used.

```diff
-import Rectangle from '../geometry/Rectangle.js';
-import Point from '../geometry/Point.js';
-import type SelectionCellsHandler from '../plugin/SelectionCellsHandler.js';
 ...
-  scrollCellToVisible(cell, center = false) {
-    ... (lines 197-224)
-  },
+  scrollCellToVisible() {},
 
-  scrollRectToVisible(rect) {
-    ... (lines 228-309)
-  },
+  scrollRectToVisible() {
+    return false;
+  },
```

Patch C, in `packages/core/src/view/AbstractGraph.ts`: replace the bodies of `scrollPointToVisible` (`:651-728`) and
`center` (`:922-964`) with empty ones, keeping the signatures. `hasScrollbars` stays imported, other members use it.

## Options

### Option 1: keep the mixin, make its collaborator optional

The shape of 001 option 1 does not apply. The mixin has no collaborator created by the graph: `PanningHandler` and
its `PanningManager` are already optional, and a `BaseGraph` without them does not bundle them. What remains is the
mixin itself, always applied.

- **Gain**: none, by construction rather than by measurement.
- **Breaking**: none.
- **Effort**: none. Listed only to record that the cheap option of 001 has nothing to remove here.

### Option 2: split the scroll family into a new plugin, with a facade

Two homes are possible for the code leaving the graph.

**2a. Fold it into `PanningHandler`.** Rejected:

- `PanningHandler` is not idle once registered. Whatever `panningEnabled` says, it pans on multi touch events and
  zooms on pinch gestures (`PanningHandler.ts:79-116`, `isForcePanningEvent` at `:286-288`), as `usage/plugins.md:96-99`
  documents. A `BaseGraph` registering it only to get `scrollCellToVisible` would gain gestures it did not ask for.
- `Outline` scrolls its source graph through `panGraph` (`Outline.ts:635`) and does not need `PanningHandler`. Moving
  `panGraph` into the plugin would make an outline silently stop scrolling a graph with scrollbars when the plugin is
  absent.

**2b. A new plugin for programmatic scrolling.** Recommended shape, cut along the concerns found above:

| Concern | Destination | Why |
|---|---|---|
| Pan offset and preview (9 members) | stays on the graph | read by every mouse event in always-bundled code (`EventsMixin.ts:397-398`), written by `PanningManager` and `Outline`, which are not plugins; a fallback of `0` everywhere would be 28 `getPlugin` lookups on a hot path |
| `setPanning` | stays on the graph | same shape as `setTooltips`, kept by ADR 0003 D6; called by 4 examples, 19 stories, `getting-started.mdx` |
| `scrollCellToVisible`, `scrollRectToVisible` | new plugin, one-line facade on the graph | 4 internal callers, no hot path, no shared state |
| `scrollPointToVisible`, `center` (after #1132) | new plugin, one-line facade on the graph | the family named by ADR 0003 B.4 |
| `ignoreScrollbars`, `translateToScrollPosition` and getters (after #1132) | stay on the graph | public configuration; `EventsMixin.ts:689-690`, always bundled, reads both getters on every mouse up |
| `timerAutoScroll`, `allowAutoPanning` and getters | stay on the graph, read by the plugin | public configuration; moving them would break code setting them, for a few booleans |
| `useScrollbarsForPanning` and getter | stays on the graph | read by `panGraph`, `PanningHandler` and `Outline` as well as by `scrollRectToVisible` |

The plugin name is to be chosen; something like `ViewportScrollPlugin`, id `'viewport-scroll'`, follows the naming
rules of `coding-practices.md`.

Only methods leave the graph. The configuration properties of the family stay on it and the plugin reads them from
the graph, as `PanningHandler` already does for `useScrollbarsForPanning`. Moving them too would remove public members
that applications set directly, `graph.allowAutoPanning = true` for instance: a type error in TypeScript, and an
assignment silently ignored in JavaScript. Keeping them costs a few booleans and one-line getters.

- **Breaking for `Graph` users**: none, if the plugin goes in `getDefaultPlugins()` and the facades are kept.
- **Breaking for `BaseGraph` users**: a behaviour change with unchanged types, the kind 001 called the hardest to
  notice. Without the plugin, `scrollCellToVisible` and `scrollRectToVisible` do nothing, auto scrolling while dragging
  stops (`EventsMixin.ts:686` reaches a no-op `scrollPointToVisible`), and `zoom` with `keepSelectionVisibleOnZoom`
  falls back to its existing revalidate branch (`ZoomMixin.ts:89-94`). Users of the `Editor` are unaffected, it builds a
  `Graph`.
- **Fallbacks at always-bundled sites**: 2, both natural. `zoom` already handles a `false` result, and a no-op
  `scrollPointToVisible` means no auto scroll. The 4 offset reads of `EventsMixin` and `SwimlaneMixin` do not change,
  nor does the mouse up branch of `EventsMixin.ts:689-690`, which converts the scroll position into a translation: it
  reads `isIgnoreScrollbars()` and `isTranslateToScrollPosition()`, which stay on the graph. Moving those two flags to
  the plugin would have made it a third fallback, and a silent behaviour change for a `BaseGraph` setting them.
- **Gain**: not measured yet, see variants 2 and 3. Most of it is in `scrollPointToVisible` and `center`, which are
  in `AbstractGraph` today; without #1132 the plugin would take only about 115 lines of the mixin.
- **Effort**: 2 to 4 days, estimated. Based on 001 option 2 (4 to 6 days for a facade of 29 methods and about 85 call
  sites), reduced here to 4 facades, 4 internal callers of the moved methods, no construction order constraint, plus
  the tests the mixin lacks (about 1 day).

### Option 3: full plugin, `ImageBundlePlugin` style

All 18 members leave the graph, together with the family of #1132. Every call becomes
`graph.getPlugin<...>(...)?.x()` with a fallback.

- **Breaking for `Graph` users**: every direct use: `setPanning` in the 4 `Graph` examples and the getting started page,
  24 story sites, the offsets read by user code such as `Wires.stories.ts:556-557`. It also goes against the precedent
  of ADR 0003 D6 for the same shape of method.
- **Breaking for `BaseGraph` users**: the same, plus registering the plugin.
- **Fallbacks**: 55 core sites. `getPanDx` and `getPanDy` alone are 28, including `EventsMixin.updateMouseEvent`, run on
  every mouse event; each becomes a `Map` lookup plus `?? 0`. `Outline` and `PanningManager`, which are not plugins,
  would depend on one.
- **Gain**: not measured yet, bounded by variant 4.
- **Effort**: 6 to 9 days, estimated. Fewer core sites than selection (55 against about 85), but the same documentation,
  migration table and story rewrite.

## Risks

- **Plugin construction order.** Low here. None of the 55 sites runs in a constructor, so the new plugin of option 2
  is only reached at call time through `getPlugin`, after every plugin exists. Issue #1149 is not a prerequisite for
  option 2, unlike for selection in 001.
- **The facade decision.** Still open (001 action plan, step 3). For this mixin the evidence points one way: the
  members kept on the graph in option 2 are either a delegation already shaped like `setTooltips` or a value read on
  every mouse event. Option 2 can proceed on that basis, but the ADR asked by 001 should record the rule.
- **Dependency on PR #1132.** Options 2 and 3 start from the family that #1132 gathers in `PanningMixin`, so they come
  after it. The members of that family then move twice, from `AbstractGraph` to the mixin and from the mixin to the
  plugin, which ADR 0003 accepts for interim moves (Consequences, Negative).
- **No safety net.** One test, which checks that `setPanning` does not throw. `panGraph` manipulates the DOM of the
  container and `scrollRectToVisible` has two branches by scrollbars; both need tests before any move.
- **Dead branch.** The side finding means the `allowAutoPanning` path of `scrollPointToVisible` has never run in
  `maxGraph`. Moving it as is carries an untested and unreachable path into the plugin; fixing `isActive` first makes
  it reachable, and is a behaviour change of its own.
- **Name clash.** `PanningHandler.panGraph` and `AbstractGraph.panGraph` do different things. A new plugin should not
  add a third meaning.

## Recommendation

Do not run it as a standalone project, and do not turn `PanningMixin` into a single plugin, nor fold it into
`PanningHandler`.

- The mixin is three concerns. Two of them, the pan offset and `setPanning`, belong on the graph: one is read on every
  mouse event by always-bundled code and by classes that are not plugins, the other follows ADR 0003 D6.
- `PanningHandler` is the interactive side and stays as it is. Making it the home of programmatic scrolling would bring
  gestures to applications that only want to scroll a cell into view.
- The real plugin candidate is the programmatic scroll family that ADR 0003 B.4 already identified, half of which is
  still in `AbstractGraph` pending PR #1132. Its gain is not measured yet.

It becomes worth doing as part of the conversion tracked by issue #762, once PR #1132 has landed and the mixin has
tests.

## Proposed action plan

Ordered so that each step pays off on its own.

1. **Fix the `PanningHandler.isActive` bug** of the side finding, reported as issue #1297, with a test. Independent of
   the rest, and it decides whether `allowAutoPanning` is a feature to carry over or to deprecate.
2. **Land PR #1132 first.** Option 2 starts from the scroll family that #1132 gathers in `PanningMixin`. Extracting it
   while half of the family is still in `AbstractGraph` would move code that #1132 also moves.
3. **Write the missing tests** against `BaseGraph`: `panGraph` with and without scrollbars (DOM of the container, `PAN`
   event, offsets), `scrollRectToVisible` in both branches, `scrollCellToVisible` with `center`, `setPanning` with and
   without the plugin. About 1 day, useful now.
4. **Run the size protocol** above, so the decision rests on measured figures.
5. **Write the facade rule in an ADR**, as step 3 of 001's plan asks, and record there why the offsets and
   `setPanning` stay on the graph.
6. **Then extract the scroll family** (option 2b) if the measured gain justifies it: the plugin file, its export, the
   `BuiltinPluginId` entry, `getDefaultPlugins()`, the table of `usage/plugins.md`, a `CHANGELOG.md` entry for the
   `BaseGraph` behaviour change, and a lower `chunkSizeLimitInKB` in `ts-example-without-defaults`.

Steps 1 to 4 cost about 2 days and are worth doing whatever is decided. Steps 5 and 6 belong to the mixin to plugin
conversion.

## Method and limits

- The figures were first collected at `81aa8d73`, then checked again at the basis commit. Between the two, only the
  stories changed in a way that matters here: `Rotation.stories.ts` adds one `setPanning(true)`.
- Call sites were counted with one `git grep` per member at the basis commit, in call form for the 11 methods and
  as a property access for the 7 properties, excluding the mixin files. `git grep` searches tracked files only, so
  `node_modules`, `dist` and `lib` need no exclusion:

  ```bash
  basis=6a2cebcf579556b183d86e210707c665affa45b8
  exclude=':!packages/core/src/view/mixin/PanningMixin*'
  for member in getPanDx getPanDy setPanDx setPanDy panGraph scrollCellToVisible scrollRectToVisible setPanning \
      isUseScrollbarsForPanning isTimerAutoScroll isAllowAutoPanning; do
    echo "$member $(git grep -nE "\.$member\(" "$basis" -- packages/core/src "$exclude" | wc -l)"
  done
  for member in panDx panDy useScrollbarsForPanning timerAutoScroll allowAutoPanning shiftPreview1 shiftPreview2; do
    echo "$member $(git grep -nE "\.$member\b" "$basis" -- packages/core/src "$exclude" | wc -l)"
  done
  ```

  It prints 56 lines in `packages/core/src`. The same loops with the pathspecs `packages/core/__tests__`,
  `packages/html/stories`, `'packages/*-example*'` and `packages/website/docs` give the counts outside the core package.
  Counts are lines: `AbstractGraph.ts:726` holds both `getPanDx` and `getPanDy` and counts once for each. One hit was
  dropped as being on another receiver, which gives the 55 sites: `PanningHandler.ts:407`, a call to the plugin's own
  `panGraph`. Every hit of `getPanDx` and `getPanDy` was read to confirm the receiver is a graph.
- Bare names (`timerAutoScroll`, `allowAutoPanning`, `shiftPreview`, `useScrollbarsForPanning`) were also grepped
  without the dot, to find assignments or configuration objects; only a TSDoc mention in `DragDropMixin.type.ts:44`
  came up.
- Issue and PR states were read with `gh` on 2026-10-26: #762, #1149 open; PR #1132, #1134, #1135, #1136 open,
  #1133 does not exist.
- The effort figures are high level estimates scaled from 001, not from a prototype. No figure of this document is
  measured; the size table is a protocol to run.
- The behaviour statements about `PanningHandler` gestures, `Outline` and the codec come from reading the code, not
  from running it.
