# Task: Extract the event-name constants from InternalEvent into a plain object

Move the 96 event-name constants of `InternalEvent` into a new exported plain object (not a class with static fields).
Names and string values stay identical. Users can add their own event names to the object. No runtime enforcement
(no `Object.freeze`, no `Object.defineProperty`). Goals: separation of responsibility, tree-shaking (to be confirmed).

Baseline commit: `b94f5137a9d5773b0a09b30c579eb3eca536208b` (0.25.0).

Sources of the findings: (I) usage inventory by a subagent, spot-checked by me (dynamic access, counts, examples);
(E) bundler experiment by a subagent in the scratchpad, V2 results re-checked by me on the bundle files;
(R) documentation research by a subagent, with its own scratchpad tests. Anything not verified is marked as such.

## Headline findings

1. **The tree-shaking premise only partly holds.** (E, R)
   - Vite 8.2.1 bundles with **rolldown 1.2.3** (not rollup), and rolldown never drops unused properties of an object
     literal, minified or not. Expect **no size gain** on the three `ts-example*` (Vite) examples.
   - Rollup 4.34+ does drop them (tested with 4.64.1), but no example uses rollup.
   - webpack 5 production drops them, but only through terser `hoist_props` after module concatenation, so the gain on
     the `js-example*` examples is possible but fragile (see below).
   - No bundler drops unused **class statics**, so today all 96 names ship whenever `InternalEvent` is reachable, which
     it always is (core calls `addListener` everywhere, and every example calls `disableContextMenu`).
2. **Deprecated aliases on `InternalEvent` cancel the gain in every bundler.** (E, V3)
3. **The separation-of-responsibility argument stands on its own.** The class JSDoc says `InternalEvent` is "Cross-browser
   DOM event support", while the 96 names are graph/model event names fired through `EventSource`/`EventObject`. They are
   never passed to `InternalEvent.addListener`, which takes DOM event names (I, §4).
4. **No dynamic access to `InternalEvent` exists anywhere** (`InternalEvent[`, iteration, `keyof typeof`, subclassing): 0
   occurrences, verified. So nothing in core blocks webpack's property pruning. (I)

## Update 2: measured on the real library (supersedes the expectations of "Headline findings" and item 5)

Prototype (PROTO): hard break, `EventNames` `as const` with the 96 names, 338 references rewritten in 60 core files.
Built against BASELINE (`git archive b94f5137a`), installed in scratch copies of the integration examples `rollup-ts`
and `vitejs-ts` and of `js-example-without-defaults`. Sizes are raw minified bytes of the single JS bundle each build
emits (the project compares raw minified sizes, never gzip). Scripts and the full procedure: `prototypes/README.md`.
Mangling claim re-checked by me on the bundles.

| Project (bundler) | Core | Direct eval (today) | Indirect eval | Eval effect |
|---|---|---|---|---|
| rollup-ts (rollup 4.62.4 + terser 5.49.2) | BASELINE | 367 072 | 342 063 | -25 009 (-6.8%) |
| | PROTO | 365 249 | 339 321 | -25 928 |
| | PROTO effect | -1 823 | -2 742 | |
| vitejs-ts (vite 8.2.1, rolldown 1.2.3, oxc) | BASELINE | 363 400 | 341 260 | -22 140 (-6.1%) |
| | PROTO | 361 613 | 341 066 | -20 547 |
| | PROTO effect | -1 787 | -194 | |
| js-example-without-defaults (webpack 5.109.2 + terser 5.39.0) | BASELINE | 239 107 | 210 241 | -28 866 (-12.1%) |
| | PROTO | 236 742 | 207 643 | -29 099 |
| | PROTO effect | -2 365 | -2 598 | |

Event-name properties kept in PROTO: 96 in every direct-eval build; with the indirect eval, terser drops the unused ones
(rollup keeps 66 values, webpack 59), rolldown keeps all 96.

Extra rollup run, direct eval, `treeshake.tryCatchDeoptimization: false`: BASELINE 367 072, PROTO 364 620 (-2 452),
62 properties kept, exactly those the code reads.

Both changes together (BASELINE direct eval to PROTO indirect eval): rollup -27 751 (-7.6%), vite -22 334 (-6.1%),
webpack -31 464 (-13.2%).

Conclusions:
- **In every default build, no unused event name is dropped.** The small default gain (about -1.8 to -2.4 kB) comes
  from shorter code (`EventNames.X` references, one object literal instead of 96 `InternalEvent.X = "x"` assignments),
  not from tree-shaking.
- **Two blockers, both in the current core, both independent of this task:**
  1. **Direct `eval` in `doEval`** (`packages/core/src/internal/utils.ts:27`). It disables identifier mangling and
     terser `hoist_props` in the whole bundle (verified: `InternalMouseEvent` appears 26 times unmangled in the baseline
     webpack bundle, 0 times once patched). Patching it to an indirect eval `(0, eval)(expression)` shrinks the BASELINE
     alone by 22 to 29 kB (6 to 12%). Vite also warns "Use of direct `eval`". Semantic equivalence of indirect eval
     (global scope, sloppy mode unless the code says otherwise) is **not verified**: 6 callers (EditorPopupMenu,
     ObjectCodec, StylesheetCodec, EditorToolbarCodec, GraphView, StencilShape).
  2. **Rollup `treeshake.tryCatchDeoptimization`** (default `true`): any `EventNames.X` read inside a `try` block keeps
     every property. Bisected to `GraphDataModel.endUpdate` (`try/finally`); minimal repro in
     `prototypes/try-catch-repro/`. This is a consumer-side option, so the library can only avoid it by not reading the
     object in `try` blocks, which is not realistic.
- **Once the eval is gone, the extraction pays off with rollup and webpack** (-2.7 and -2.6 kB, 30 to 37 names dropped),
  **and barely moves Vite 8** (-194 B), where rolldown keeps the object whole.
- Names that disappear with rollup (30): activate resizeStart resizeEnd moveStart moveEnd minimize normalize maximize hide
  show close destroy fired get receive connect disconnect suspend resume post open save beforeAddVertex addVertex
  afterAddVertex redo layoutCells clear cellsToggled reset. webpack drops 7 more: resize move panStart panEnd mark add
  remove.

Other bundlers of the integration examples (full table and observations in `prototypes/README.md`):

| Project | PROTO effect, direct eval | PROTO effect, indirect eval | Eval effect on BASELINE |
|---|---|---|---|
| parcel-ts (Parcel, SWC) | -3 802 (25 names dropped) | -3 733 (30 dropped) | -144 143 (-28.5%) |
| lit-ts (Vite 8) | -1 787 | -198 | -23 205 (-6.1%) |
| sveltekit-ts (Vite 8), maxGraph chunk | -1 787 | -215 | -22 126 (-6.1%) |
| rsbuild-ts (Rspack, SWC) | -76 | -84 | -716 (-0.2%) |
| farm-ts (Farm, SWC) | **+1 005** | **+1 005** | -275 (-0.07%) |

- The direct eval hurts every bundler that hoists modules into one scope: Parcel most (-28.5%), then webpack, rollup and
  Vite (6 to 12%). Rsbuild and Farm keep a function per module, so only `utils` is deoptimized.
- The extraction never costs more than Farm's +1 005 B. Unused names are dropped by Parcel (even with today's eval),
  and by rollup and webpack once the eval is indirect; never by Vite, Rsbuild or Farm.

Vite / oxc outlook (documentation research):
- oxc minifier (alpha, pre-1.0) has no `hoist_props` equivalent. Tracking issue
  https://github.com/oxc-project/oxc/issues/10844 (open), implementation PR https://github.com/oxc-project/oxc/pull/22351
  (open, targets local non-escaping, never-written objects; whether `EventNames` qualifies after scope hoisting is
  untested).
- rolldown has no option; maintainers call it an oxc gap (https://github.com/rolldown/rolldown/issues/8582).
- Vite 8 cannot use rollup any more (https://vite.dev/guide/migration). `build.minify: 'terser'` is supported and would
  probably restore the removal; not measured.

Side finding of the prototype: with `as const`, tsc rejects `EventsMixin.ts` (TS2367) because the `MOUSE_UP` check at
`:614` sits inside the `if (evtName === InternalEvent.MOUSE_DOWN)` branch of `:602`, so it can never be true. Verified in
the sources. The prototype cast `(evtName as string)` to keep the behaviour identical.
It is a leftover of the IE quirks mode removal, not a functional bug: in mxGraph the outer condition was
`(!IS_QUIRKS && evtName == MOUSE_DOWN) || (IS_QUIRKS && evtName == MOUSE_UP && !this.fireDoubleClick)`
(https://github.com/jgraph/mxgraph/blob/ff141aab158417bd866e2dfebd06c61d40773cd2/javascript/src/js/view/mxGraph.js#L12925),
so the inner `MOUSE_UP` branch (`#L12936`) only served quirks mode. maxGraph kept only the `MOUSE_DOWN` half. On modern
browsers the double tap still works through the `else` branch: it sets `fireDoubleClick`, and the following mouse up
calls `dblClick` (`EventsMixin.ts:638-660`). Cleanup: delete the inner `if (MOUSE_UP)` branch and its `doubleClickFired`
flag, keep the body of the `else`. No behaviour change.

## Decisions (user, 2026-10-07)

1. The PR is still worth doing (separation of responsibility; size gain once `eval` is fixed).
2. The direct `eval` in `doEval` gets its own issue, and probably a PR before this one.
3. Dead `MOUSE_UP` branch: first planned as a separate PR from `main`, then turned into issue #1228 (no time to test
   it now), so it will not be merged before this branch: the plan must choose between the `(evtName as string)` cast
   and doing the deletion here. Test plan: a characterization test in jsdom with `nativeDblClickEnabled = false`
   (DOWN, UP, DOWN, UP on a cell: `dblClick` called once; same on the background: not called), committed green before
   the deletion; manual check on desktop with `nativeDblClickEnabled = false`, and on an iPad (double tap on a vertex
   opens the label editor), on `main` and on the branch.
   Follow-up, breaking, probably an issue: remove `nativeDblClickEnabled` and `isNativeDblClickEnabled()`, which only
   existed for IE quirks mode (`CellRenderer.ts:393` "Uses double click timeout in mxGraph for quirks mode"), now that
   IE is not supported. That covers the property and method (`EventsMixin.ts:194, :222`, `EventsMixin.type.ts:74,
   :154`), the conditional native listeners (`CellRenderer.ts:394, :771`, `GraphView.ts:681`, which become
   unconditional), and the `!this.nativeDblClickEnabled` half of the condition in `fireMouseEvent` (`EventsMixin.ts:595`).
   The emulation block itself stays, since it still handles double taps on touch devices (`doubleTapEnabled`). No
   story, example, doc or draw.io code sets the flag to `false`. Removing it also removes the jsdom test switch, so the
   characterization test above has to drive the touch path instead (or be rewritten) in that refactoring.
4. Hard break, no deprecated aliases.
5. Handle constants and `PINCH_THRESHOLD` move out of `InternalEvent` later, tracked by issue #1229.

## Follow-up work outside this branch

Decided:

- [x] **Issue: direct `eval` in `doEval`**, created as https://github.com/maxGraph/maxGraph/issues/1226 (milestone 0.26.0) (`internal/utils.ts:27`). Disables mangling and terser `hoist_props` in every
  consumer bundle, costs 22 to 29 kB (6 to 12%) on the examples, Vite warns about it. Check the
  semantics of an indirect eval for the 6 callers before proposing it. Probably a PR before this branch.
- [x] **Dead `MOUSE_UP` double-tap branch**, turned into an issue (no time to test it now): https://github.com/maxGraph/maxGraph/issues/1228. Not merged before this branch, so the extraction needs the cast or does the deletion itself (`EventsMixin.ts:614`), leftover of IE quirks mode.
  Characterization test first. Must be merged before this branch (the `as const` typing depends on it).
- [x] **Issue, breaking: remove `nativeDblClickEnabled` / `isNativeDblClickEnabled()`**, created as https://github.com/maxGraph/maxGraph/issues/1227, IE quirks mode only. Details in
  decision 3 above.
- [x] **Move the handle constants and `PINCH_THRESHOLD` out of `InternalEvent`**, turned into an issue: https://github.com/maxGraph/maxGraph/issues/1229. Handles go near the handlers
  (`view/handler/`), `PINCH_THRESHOLD` to a configuration object.

- [x] **Task, after this PR: enforce `EventName` in the listener API**, created as https://github.com/maxGraph/maxGraph/issues/1230. **When the PR exists, update the issue to link it** (its Context paragraph says "a pull request still in progress"). This PR only types `addListener` with
  `EventName | (string & Record<never, never>)` as a first guidance. The follow-up makes the registration (and, to
  decide, the unregistration and firing) of listeners require `EventName`, so that custom names have to be declared
  through the module augmentation of `EventNamesMap`. Breaking for TypeScript users passing undeclared strings.
  It also owns the user documentation of custom event names, dropped from this PR because declaring them required a
  non-null assertion at every use (optional augmented property); the design must avoid both that assertion and a
  runtime failure when the application forgets to assign a declared name.

Not decided yet (to settle during the plan, or to drop):

- [x] (done in this branch) Fix the two wrong JSDoc lines (`RESUME` says "suspend", `SAVE` says "open") while moving them: in this branch?
- [x] (done in this branch) `InternalEvent` misused as a type in `EditorToolbar.ts:448` and `MaxToolbar.ts:235`: separate small fix?
- [x] (done in this branch) Refresh the "Event: mxEvent.X" JSDoc headings in about 14 core files to `EventNames.X`: in this branch?
- [x] (dropped: the docs already say to tune the bundler, and that the examples are not tuned) Document in the tree-shaking guide that rollup's `treeshake.tryCatchDeoptimization: false` lets rollup drop
  unused event names (consumer-side option)?
- [x] Measure Vite 8 with `build.minify: 'terser'` (done, see `prototypes/README.md`: terser drops the 30 unused names
  once the eval is indirect, but its bundles stay 1 to 3.9 kB larger than oxc's). The user follows oxc PR #22351.

Scope decided by the user: the 4 `*_HANDLE` constants and `PINCH_THRESHOLD` move out of `InternalEvent`, but in a
separate PR. Handles are sentinel indexes returned by `getHandleForEvent` and compared in VertexHandler/EdgeHandler
(they identify a handle, not an event). `PINCH_THRESHOLD` is configuration, read only by `addMouseWheelListener`
(`InternalEvent.ts:416-417`).

## Codebase Context

### InternalEvent.ts (`packages/core/src/view/event/InternalEvent.ts`, 1016 lines)

- Module-level side effect: passive-listener detection `:34-50`, read in `addListener` `:81`.
  `packages/core/package.json:7-9` declares `"sideEffects": ["**/*.css"]`, so this side effect is already ignored by
  bundlers. Not affected by the change, but the new module must have none.
- 10 static methods `:73-465` (addListener, removeListener, removeAllListeners, addGestureListeners,
  removeGestureListeners, redirectMouseEvents, release, addMouseWheelListener, disableContextMenu, consume).
- Handle indexes `:488-523`: `LABEL_HANDLE=-1`, `ROTATION_HANDLE=-2`, `CUSTOM_HANDLE=-100`, `VIRTUAL_HANDLE=-100000`.
- Event names `:527-1007`: 96 constants, `MOUSE_DOWN='mouseDown'` to `RESET='reset'`. Each value is the camelCase form of
  the key, no duplicates, none deprecated. Typed `string` (no `readonly`, no `as const`).
  - JSDoc: identical one-liner `/** Specifies the event name for <value>. */`. Two copy-paste errors:
    `RESUME` `:692` says "suspend", `SAVE` `:717` says "open".
  - `MOUSE_DOWN/MOVE/UP` used inside the file by `redirectMouseEvents` `:259, :269, :279`.
  - Never referenced outside the file: `FIRED, GET, RECEIVE, DISCONNECT, SUSPEND, RESUME, CELLS_TOGGLED`.
- `PINCH_THRESHOLD=10` `:1013`, only used in the file `:416-417`.
- Export: `packages/core/src/index.ts:217` `export { default as InternalEvent } from './view/event/InternalEvent.js';`

### Usage inventory (InternalEvent.ts excluded)

| Area | Event-name consts | Handle consts | Methods |
|---|---|---|---|
| packages/core/src | 335 occ / 59 files (75 of them in comments, incl. `{@link InternalEvent.X}`) | 51 occ / 2 files (VertexHandler 28, EdgeHandler 23) | 156 / 32 |
| packages/core/__tests__ | 5 / 3 | 1 / 1 (VertexHandler.test.ts:190) | 0 |
| packages/html (stories) | 28 / 17 | 0 | 71 / 36 |
| packages/*-example* | 0 | 0 | 6 / 6 (all `disableContextMenu`) |
| packages/ts-support | 0 | 0 | 1 (`disableContextMenu`, src/index.ts:30) |
| packages/website/docs | 4 / 2 | 0 | 6 / 3 |
| README.md | 0 | 0 | 1 (:94) |

- Top core files: EventsMixin.ts 37, VertexHandler 29, Editor.ts 27, EdgeHandler 24, ConnectionHandler 16, MaxWindow 15.
- Tests with event names: `editor/Editor.test.ts:162`, `view/GraphSelectionModel.test.ts:43,46`,
  `view/undoable-change/SelectionChange.test.ts:129,142`.
- Stories (17): AutoLayout, DynamicLoading, DynamicToolbar, FileIO, GraphLayout, HtmlLabel, Manhattan, MenuStyle, Monitor,
  Morph, OffPage, OrgChart, Overlays, SwimLanes, UserObject, Validation, Wires.
- Website: `docs/getting-started.mdx:179` (CLICK), `:186` (CELLS_MOVED); `docs/guides/migrate-from-mxgraph.md:537-538`
  (PAN_START, PAN_END).
- `InternalEvent` misused as a type (instance type of the class): `editor/EditorToolbar.ts:448`, `gui/MaxToolbar.ts:235`.
  Unrelated to this task, but these lines will read oddly next to the change.
- `mxEvent.X` appears only in JSDoc headings ("Event: mxEvent.X") in Editor, MaxWindow, GraphDataModel, GraphView,
  UndoableEdit, LayoutManager, ConnectionHandler, CellEditorHandler, Morphing, Effects, Animation, EditorToolbarCodec,
  EventsMixin.type.ts:333, InternalEvent.ts:331. Candidates for a doc refresh while touching these files (optional).
- No codec registers or exposes `InternalEvent`/`mxEvent`.

### Typing of event names in the API

All plain `string`: `EventSource.addListener(name: string, ...)` `:105`, `EventObject(name = '', ...)` `:47`,
`EventListenerObject.name` `EventSource.ts:21-24`, `EventsMixin.type.ts` `:256, :267, :276, :313-314`. A union type of
event names would only be useful if these signatures adopted it (and they must keep accepting custom names).

## Item 1: client impact and compatibility options (decision left to the user)

What a client uses today: `InternalEvent.<EVENT>` with `graph.addListener`, `model.addListener`, `fireEvent(new
EventObject(...))`, comparisons on `evt.getName()`. The examples and ts-support only use `InternalEvent.disableContextMenu`,
so they need no change in any option.

| | (A) Hard break | (B) Deprecated aliases on `InternalEvent` |
|---|---|---|
| Client code | `InternalEvent.X` -> `EventNames.X` (rename, mechanical) | keeps working, deprecation warning in IDE |
| TS users | compile error TS2339 at each use: easy to find | none |
| JS users | **silent failure**: `InternalEvent.CLICK` is `undefined`, so `addListener(undefined, fn)` registers a listener that never fires, and no error is raised | none |
| Tree-shaking | webpack: unused names dropped (fragile); Vite/rolldown: no change | **no gain in any bundler** (E, V3): the alias assignments keep every string as long as `InternalEvent` is reachable, which it always is |
| Size | expected <= baseline | likely slightly above baseline (object + aliases) |
| Separation of responsibility | achieved now | achieved at removal time |
| Release notes | `BREAKING CHANGE` footer, CHANGELOG "Breaking Changes" entry, migration note | CHANGELOG "Other Changes" style note (rare exception per policy), breaking entry at removal |

Notes:
- The JS silent failure is the main risk of (A) and must be spelled out in the CHANGELOG entry, with a hint to search for
  `InternalEvent\.[A-Z]`.
- Getters (`static get CLICK()`) instead of field aliases do not change the tree-shaking result: class members are never
  pruned (E, V1).
- (B) could ship in one release and (A) in a later one, so the two are not exclusive in time.

## Item 2: read-only fields vs no constraint (typing)

Requirement recap: users add fields; no runtime enforcement. TS `readonly` and `as const` emit no JS, so every option has
the same runtime behavior and the same tree-shaking (E, V6: identical emitted JS). The choice is about the TS experience.

| Option | Built-ins readonly | TS user adds a field | Union of names includes added | Typo `EventNames.CLIK` caught |
|---|---|---|---|---|
| (a) plain object, inferred type | no | **error TS2339** (needs a cast) | n/a, union is `string` | yes |
| (a') `as const` | yes (TS2540) | **error TS2339** (needs a cast) | no | yes |
| (b) augmentable interface | yes | yes, via `declare module` | yes | yes |
| (c) `Record<string, string>` | no | yes | n/a | **no** |
| (c') `typeof builtIns & Record<string, string>` | yes | yes, no declaration | n/a | **no** |

All tested by (R) with tsc 5.9.3.

How a user adds a field:

```js
// JavaScript, every option
EventNames.MY_EVENT = 'myEvent';
```

```ts
// TypeScript, option (b)
import { EventNames } from '@maxgraph/core';

declare module '@maxgraph/core' {
  interface EventNamesMap {
    MY_EVENT?: 'myEvent'; // optional, see the pitfall below
  }
}
EventNames.MY_EVENT = 'myEvent';
```

Option (b) details:
- Works for consumers of the published `.d.ts`, since `export declare const EventNames: EventNamesMap` has no initializer
  to re-check. (R, tested)
- Pitfall: when the augmentation and the library initializer are in the same compilation (maxGraph tests, stories,
  ts-support, a monorepo mapping to sources), a **required** augmented field makes the initializer fail with TS2741.
  Mitigations: document the field as optional `?` (same recommendation as the existing `CellStateStyle` augmentation in
  `packages/website/docs/guides/extend-maxgraph.md:657-770`), or initialize with a cast (`builtIns as EventNamesMap`).
- The augmentation file must be a module (`export {}` or an import), same warning as the CellStateStyle guide.
- Avoiding a 96-line duplication between interface and object: `const builtIns = {...} as const;` then
  `export interface EventNamesMap extends Readonly<typeof builtIns> {}` (an interface may extend an object type alias)
  and `export const EventNames: EventNamesMap = builtIns`. **Not tested**, the plan must verify that augmentation of an
  interface declared this way works and that the cast-free assignment survives an optional augmented field.
- Precedent in the repo: module augmentation of `CellStateStyle`/`CellStyle` (public, documented, verified by
  `packages/ts-support/src/module-augmentation.ts:9`). No library found that augments the type of a runtime constant
  object this way (R, uncertain); Vue `ComponentCustomProperties` and Chart.js `ChartTypeRegistry` augment registries.

Note on the value of adding a field: firing or listening to a custom event already works with any string
(`new EventObject('myEvent')`, `addListener('myEvent', ...)`, see `stories/AutoLayout.stories.ts:87, 96, 216`). Adding the
name to the object only brings discoverability and a single place to reference it.

**Recommendation:** (b) with the interface derived from the `as const` object, if the plan's verification passes.
- Readonly itself costs nothing: `as const` gives it for free. What costs is the extensibility requirement, and (b) is the
  only option that meets it without losing typo detection.
- It reuses a mechanism already documented for `CellStateStyle`, so the doc cost is a short section in the same guide.
- If the user drops the "TS users add fields with type safety" part, (a') `as const` is the simplest (JS users can still
  add, TS users need a cast), and it is what `util/Constants.ts` already does for `NODE_TYPE`, `DIRECTION_MASK`.
- (a) gives nothing over (a'), and (c)/(c') lose typo detection on the 335 internal uses.

## Item 3: naming

Repo conventions (I, §5):
- `util/Constants.ts`: `as const` objects in UPPER_SNAKE (`FONT_STYLE_MASK :380`, `DIRECTION_MASK :394`, `NODE_TYPE :408`),
  exported through `export * as constants` (`index.ts:145`).
- Other exported objects: PascalCase `*Config` (`GlobalConfig`, `HandleConfig`, `VertexHandlerConfig`, ...), not `as const`.
- String unions in `types.ts` are named `*Value` (`DirectionValue :1000`, `AlignValue :1012`), with the open-ended form
  `StyleArrowValue = ArrowValue | (string & Record<never, never>)` `:1042`.
- No existing `EventName`, `EventNames` or `EventType` symbol (no collision).

Ecosystem (R): OpenLayers singular `EventType` (plain object, `@enum {string}`), Phaser plural `Events`, three.js singular
`MOUSE`/`TOUCH`. No dominant convention. TS handbook pairs the object and the union under different names; same-name pairing
is legal.

| Name | For | Against |
|---|---|---|
| `EventNames` | reads as a collection: `EventNames.CLICK` is "an event name"; leaves `EventName` free for a union type | none found |
| `EventName` | mirrors OpenLayers `EventType` | collides with the natural name of the union type, forcing same-name pairing or another type name |
| `InternalEventNames` / `InternalEventName` | close to the old location, easy to find for migrating users | `Internal` is misleading: these are graph/model events fired through `EventSource`, not the DOM events `InternalEvent` handles; `Internal` also suggests "not for users" while users are invited to extend it |

**Recommendation:** `EventNames` for the object, `EventNamesMap` for the augmentable interface if option (b) is chosen,
and `EventName` reserved for a union type if one is added (not required by this task).

## Item 4: scope (for the plan to decide)

- **Event names outside `InternalEvent`:** none. No other class holds event-name constants, no enum exists in core. Only
  string literals in doc examples (`EventObject.ts:41`, `EventSource.ts:132`), the default `new EventObject('')`
  (`EventSource.ts:142`), a custom `'pointerdown'` in `AutoLayout.stories.ts`, and test names.
- **Not event names, still on `InternalEvent`:**
  - handle indexes `LABEL_HANDLE`, `ROTATION_HANDLE`, `CUSTOM_HANDLE`, `VIRTUAL_HANDLE`: 51 uses in VertexHandler/EdgeHandler
    (comparisons). Related to mouse event handling (`InternalMouseEvent`), not to event names.
  - `PINCH_THRESHOLD`: used only in `InternalEvent.ts`.
  - Leaving them on `InternalEvent` keeps the task focused; moving them is a separate decision.
- **Doc fixes worth folding in:** the two wrong JSDoc lines (RESUME, SAVE), since the JSDoc moves anyway.

## Item 5: verification

Run `./scripts/build-all-examples.bash` after the change and compare with the baseline:

| Example | Bundler | Baseline (kB) | Budget file | Current budget |
|---|---|---|---|---|
| js-example | webpack | 466.88 | `packages/js-example/webpack.config.js:43` | asset 467_000, entry 473_000 |
| js-example-selected-features | webpack | 384.94 | `packages/js-example-selected-features/webpack.config.js:43` | 385_000 / 391_000 |
| js-example-without-defaults | webpack | 239.11 | `packages/js-example-without-defaults/webpack.config.js:43` | 240_000 / 241_000 |
| ts-example | Vite (rolldown) | 428.73 | `packages/ts-example/vite.config.js:27` | 429 |
| ts-example-selected-features | Vite (rolldown) | 361.53 | `packages/ts-example-selected-features/vite.config.js:27` | 362 |
| ts-example-without-defaults | Vite (rolldown) | 220.86 | `packages/ts-example-without-defaults/vite.config.js:27` | 221 |

Expectations from the experiment, to confirm or refute by the measure:
- Vite examples: no decrease expected (rolldown keeps the object whole). Flag them; a decrease would contradict (E).
- webpack examples: a decrease bounded by the names no reachable code references. 89 of the 96 names are referenced in
  core, so `js-example` (full `Graph`) should gain little; `js-example-without-defaults` is where unreachable names are
  most likely. Upper bound of the whole set is a few kB.
- Possible side effect, **untested**: once terser hoists the properties into variables, it may inline the string at each
  use site instead of referencing a variable, which could make some bundles grow. The measure settles it.
- Budgets: update per `.claude/rules/tooling/bundle-size-budgets.md` only if a size changes, rounding up to the next kB, in
  the same commit, and explain the change in the commit body. Both `maxAssetSize` and `maxEntrypointSize` for webpack.

Also run the CI checks from `CLAUDE.md` (build, test-check, tests, ts-support, examples, html build, circular
dependencies, lint, check:npm-package).

## Item 6: diligence if breaking (option A)

- Commit: `refactor!:` with a `BREAKING CHANGE:` footer listing the removed statics and the replacement.
- `CHANGELOG.md` `## Unreleased` (`:8-10`): an entry under `**Breaking Changes**:`, in the prose style of the 0.25.0 entries
  (`:20-21`), with a before/after code block and the JS silent-failure warning.
- Docs to update: `packages/website/docs/getting-started.mdx:179, :186`; `docs/guides/migrate-from-mxgraph.md:529,
  :536-540` (`mxEvent` now maps to `EventNames` for event names, `InternalEvent` for DOM helpers); if option (b),
  a section next to the `CellStateStyle` augmentation in `docs/guides/extend-maxgraph.md:657-770`.
- Stories (17 files) and the 3 test files: migrate to the new object.

## Research Findings

- Rollup 4.27.0 added object-literal property tree-shaking (#5420), reverted in 4.27.3, re-landed in 4.34.0
  (https://github.com/rollup/rollup/pull/5737). Disabled by dynamic access and escaping objects.
- Rolldown treeshake options list no property-level pruning (https://rolldown.rs/reference/InputOptions.treeshake).
- terser `hoist_props` (default on): https://terser.org/docs/options/
- webpack nested tree-shaking concerns namespace re-exports, not object literals
  (https://webpack.js.org/blog/2020-10-10-webpack-5-release/).
- TS objects vs enums: https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums
- Module augmentation: https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation

Untested alternative that would tree-shake in every bundler: individual named exports, or a namespace
(`export * as EventNames from './EventNames.js'`). A module namespace object is **not extensible**, so it violates the
"users add fields" requirement. Mentioned for completeness, not proposed.

## Key Files

- `packages/core/src/view/event/InternalEvent.ts:488-1013` - constants to move (names) or keep (handles, PINCH_THRESHOLD)
- `packages/core/src/index.ts:217` - public export, add the new object next to it
- `packages/core/src/view/event/EventSource.ts:105, 139` and `EventObject.ts:47` - event-name parameters (`string`)
- `packages/core/src/view/mixin/EventsMixin.ts` / `.type.ts` - largest consumer (37)
- `packages/core/src/util/Constants.ts:380-421` - existing `as const` object convention
- `packages/website/docs/guides/extend-maxgraph.md:657-770` - existing module-augmentation doc to mirror
- `packages/ts-support/src/module-augmentation.ts` - where an augmentation check would go
- `CHANGELOG.md:8-10` - Unreleased section

## Patterns to Follow

- New module without module-level side effects; import with `.js` suffix as the rest of core.
- Keep values and keys identical; keep one JSDoc per key.
- Module augmentation: document optional `?` fields and the `export {}` requirement, as for `CellStateStyle`.
- Budgets rounded up to the next kB, never padded.

## Dependencies

- None new. Bundlers in use: webpack 5.109.2 + terser 5.39.0 (js examples), Vite 8.2.1 with rolldown 1.2.3 (ts examples).
- Experiment scripts: `prototypes/`, see `prototypes/README.md`. The typing tests of (R) were not kept.
