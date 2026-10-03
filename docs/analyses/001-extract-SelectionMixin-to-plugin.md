# Analysis 001: Extract `SelectionMixin` into a plugin

- **Date**: 2026-10-03
- **Analysis basis**: commit `c5930549df93e64b8d3bf032cc67f89adc621dd4`, during the development of version 0.25.0. File
  and line references point to that commit
- **Question**: can the selection management be made optional for visualization-only applications, by turning
  `SelectionMixin` into a plugin, and is the size gain worth the work?
- **Related**: [ADR 0001](../adr/0001-use-mixins-to-split-the-graph-class.md),
  [ADR 0002](../adr/0002-use-plugins-for-optional-and-new-features.md),
  [ADR 0003](../adr/0003-move-members-out-of-abstract-graph.md),
  [issue #762](https://github.com/maxGraph/maxGraph/issues/762), `ImageMixin` to `ImageBundlePlugin` precedent (#1050),
  [issue #1149](https://github.com/maxGraph/maxGraph/issues/1149) (`onConfigure` plugin lifecycle hook)

## Summary

| Option | Gain on `ts-example-without-defaults` | Breaking | Effort |
|---|---|---|---|
| 0. Remove the mixin and the model entirely (upper bound) | 5.46 kB minified, 1.30 kB gzip (measured) | n/a | n/a |
| 1. Keep the mixin, make the selection model optional | about 2.0 kB minified, 0.5 kB gzip (derived) | silent behaviour change for `BaseGraph` | 1 to 2 days |
| 2. Plugin plus a thin delegating facade on the graph | about 3.5 to 4 kB minified, 0.8 to 1 kB gzip (estimated) | `BaseGraph` only | 4 to 6 days |
| 3. Full plugin, `ImageBundlePlugin` style | about 4.5 kB minified, 1 to 1.1 kB gzip (estimated) | yes, most used API | 8 to 12 days |

The maxgraph chunk of the example is 220.86 kB minified (60.63 kB gzip), so the best case is **2.5 % minified, 2.1 %
gzip**. The work is feasible, but the gain is small compared with its cost and its breaking surface. Recommendation:
do not run it as a standalone project, see [Recommendation](#recommendation).

## Current implementation

### The pieces

| File | Lines | Role |
|---|---|---|
| `packages/core/src/view/mixin/SelectionMixin.ts` | 345 | 29 graph methods: get/set/add/remove selection cells, keyboard navigation (`selectNextCell` and siblings), `selectAll`, `selectVertices`, `selectEdges`, `selectRegion`, event driven selection, `updateSelection`, `getSelectionCellsForChanges` |
| `packages/core/src/view/mixin/SelectionMixin.type.ts` | 224 | type declarations merged into `AbstractGraph` |
| `packages/core/src/view/GraphSelectionModel.ts` | 262 | the selection state (`cells`), `singleSelection`, fires `CHANGE` and `UNDO` |
| `packages/core/src/view/undoable-change/SelectionChange.ts` | 71 | the undoable change applied by the model |

Every method of the mixin is a thin layer over `GraphSelectionModel`, except the navigation and bulk selection helpers,
which also use the view and the model.

### Wiring

- `AbstractGraph` calls `initializeCollaborators`, which must set the selection model
  (`AbstractGraph.ts:422-432`).
- `BaseGraph` always creates one: `options?.selectionModel?.(this) ?? new GraphSelectionModel(this)`
  (`BaseGraph.ts:38-40`). The `selectionModel` factory option is declared in `GraphCollaboratorsOptions`
  (`types.ts:1576`). `Graph` goes through the `createSelectionModel()` factory method (`Graph.ts:61-83`).
- The `selectionModel` property is per instance despite living in a mixin, which is covered by the "no global state for
  mixin properties" tests mentioned in ADR 0003.
- XML serialization ignores it: `selectionModel` is in the excluded fields of `GraphCodec` (`GraphCodec.ts:28`). There
  is no codec for `GraphSelectionModel` or `SelectionChange`.

### Who calls it

About 85 call sites in 24 files of `packages/core/src`, outside the mixin itself. They split into three groups.

**Always bundled, even in a visualization-only application**, because they live in `AbstractGraph` or in mixins:

- `AbstractGraph.graphModelChanged` calls `updateSelection()` after every model change (`AbstractGraph.ts:549`), and
  `processChange` calls `clearSelection()` on a `RootChange` (`:565`).
- `EventsMixin.click` performs the default click selection: `selectCellForEvent` or `clearSelection`
  (`EventsMixin.ts:261-310`).
- `CellsMixin` (9 sites), `GroupingMixin` (7), `OrderMixin` (2), and `ZoomMixin`, `FoldingMixin`, `EditingMixin`,
  `OverlaysMixin` (1 each) use the selection as the default argument of their operations, for instance
  `cells = cells ?? this.getSelectionCells()` in `CellsMixin.ts:310-369`.

**Plugins that cannot work without a selection**: `SelectionCellsHandler` (registers a listener on the model in its
constructor, `SelectionCellsHandler.ts:89`), `SelectionHandler` (15 sites), `RubberBandHandler`, `PopupMenuHandler`,
`ConnectionHandler`, `CellEditorHandler`, and the cell handlers `VertexHandler` and `EdgeHandler`.

**Editor layer**: `Editor` (16 sites, including a listener on the model at `Editor.ts:2236`), `EditorPopupMenu`,
`EditorToolbar`, and `Clipboard`.

Outside the core package:

- **Tests**: `GraphSelectionModel.test.ts` and `SelectionChange.test.ts` use a fake graph, so they do not depend on the
  mixin. There is **no test dedicated to `SelectionMixin`**. `SelectionCellsHandler.test.ts` and
  `VertexHandler.test.ts` use the graph API.
- **Stories**: about 15 stories, around 40 call sites. `Groups.stories.js` is the heaviest (11),
  `Constituent.stories.ts` overrides `selectCellForEvent` in a `Graph` subclass.
- **Examples**: none of them calls the selection API. The `*-without-defaults` examples use a bare `BaseGraph`.
- **Website**: `usage/graph.md` documents the `selectionModel` collaborator option. `migrate-from-mxgraph.md` says
  nothing about the selection API itself, because it is unchanged from `mxGraph`.

### Side finding

`singleSelection`, `doneResource` and `updatingSelectionResource` are declared on the graph
(`SelectionMixin.type.ts:23-25`, `singleSelection` is also listed in `SelectionMixin.ts:35`) but nothing initializes,
reads or writes them. The working flag is `GraphSelectionModel.singleSelection`: setting `graph.singleSelection = true`
silently does nothing. Tracked in [issue #1210](https://github.com/maxGraph/maxGraph/issues/1210), independently of
the decision here.

They are leftovers of a refactoring, not an `mxGraph` heritage:

- In `mxGraph` the three properties only exist on the selection model, for instance
  `mxGraphSelectionModel.prototype.singleSelection`
  ([v4.2.2+, `mxGraphSelectionModel.js:87`](https://github.com/jgraph/mxgraph/blob/ff141aab158417bd866e2dfebd06c61d40773cd2/javascript/src/js/view/mxGraphSelectionModel.js#L87)).
  `mxGraph` itself never had them. The two resources were used by `mxSelectionChange` to set `window.status`, which
  `maxGraph` dropped, so they are not read by `GraphSelectionModel` either.
- `bdc50a9f485c9ea2ff26e15c944052608ec6ac87` (2021-09-07) merged the selection model into `GraphSelectionMixin`, so the
  flag, `setSingleSelection` and the checks in `setCells` and `addCells` moved onto the graph and worked there.
- `413796ad322ddfeb9228f9e4913a2d80b196fa0b` (2022-01-08, #70, first released in `v0.1.0`) extracted
  `GraphSelectionModel` again and moved the value, the setter and the logic back into it, but left the type declaration
  and the `Pick` entry of `singleSelection` in the mixin, as well as the declarations of the two resources.
- `e18987983ac1cb22d501d046e7a4d4fed535e964` (2024-06-21, #470) only moved those declarations to
  `SelectionMixin.type.ts`.

The three properties have therefore been declared and never implemented on the graph since `v0.1.0`.

## Size measurement

Measured with Vite on `packages/ts-example-without-defaults` (a `BaseGraph` with no plugin, the closest target to a
visualization-only application), on the `maxgraph` chunk, after rebuilding the ESM output of the core package for each
variant. Sources were patched for the measurement only, the runtime of the patched variants was not checked.

| Variant | Minified | Gzip -9 | Delta minified | Delta gzip |
|---|---|---|---|---|
| Baseline | 220 859 B | 60 629 B | | |
| `SelectionMixin` not applied (`_graph-mixins-apply.ts`) | 217 447 B | 59 801 B | -3 412 B | -828 B |
| Same, and `BaseGraph` no longer creates a `GraphSelectionModel` | 215 403 B | 59 331 B | -5 456 B | -1 298 B |

Reading:

- The mixin is 3.4 kB minified, mostly because method names on a prototype are not mangled by the minifier.
- `GraphSelectionModel` plus `SelectionChange` weigh 2.0 kB minified. `UndoableEdit`, `EventSource`, `RootChange` and
  `ChildChange` stay in the bundle, as they are used elsewhere.
- The measured total is an upper bound: it removes the code without adding anything back. Every real option adds
  fallbacks at the always-bundled call sites, or a facade on the graph, see the estimates below.
- For scale: the earlier, unpublished measurement on 0.24.0 removing **all** mixins at once saved 73 to 77 kB per
  example. Selection is about 7 % of that.

## Options

### Option 1: keep the mixin, make the selection model optional

`BaseGraph` creates a `GraphSelectionModel` only when the `selectionModel` option is passed, and the mixin methods
become nullish safe (`this.selectionModel?.cells ?? []`).

- **Gain**: about 2.0 kB minified, 0.5 kB gzip, derived from the measurement (the model and the change only).
- **Cost**: 1 to 2 days.
- **Risks**: a silent behaviour change for every `BaseGraph` application that relies on selection without knowing it,
  for instance one registering `SelectionCellsHandler`, `SelectionHandler` or `RubberBandHandler`. Selection would stop
  working with no error. A warning in the plugins that need a model mitigates it. This is a breaking change in
  behaviour while the type signatures do not move, which is the hardest kind to notice.

### Option 2: plugin plus a delegating facade on the graph

A `SelectionModelPlugin` (id `'selection-model'`, following the naming rules) owns the `GraphSelectionModel` and the
heavy helpers (navigation, `selectAll`, `selectCells`, `updateSelection`, `getSelectionCellsForChanges`).
`AbstractGraph` keeps one-line methods such as `getSelectionCells()` that delegate to the plugin and return an empty
result when it is absent.

- **Gain**: about 3.5 to 4 kB minified, 0.8 to 1 kB gzip, estimated. The facade keeps around 25 unmangled method names.
- **Cost**: 4 to 6 days.
- **Breaking**: `Graph` users see no change, since the plugin goes in `getDefaultPlugins()`. `BaseGraph` users with
  interaction must register the plugin, and the `selectionModel` collaborator option moves to the plugin.
- **Precedent**: graph methods delegating to a plugin already exist, for the plugins derived from the `mxGraph`
  handlers. `mxGraph` already delegated these methods to its handlers, and `maxGraph` kept them, replacing the handler
  property with a `getPlugin` call and a nullish fallback:

  | Plugin | Graph methods | Location |
  |---|---|---|
  | `ConnectionHandler` | `setConnectable`, `isConnectable` | `ConnectionsMixin.ts:534-543` |
  | `PanningHandler` | `setPanning` | `PanningMixin.ts:312-315` |
  | `TooltipHandler` | `setTooltips` | `AbstractGraph.ts:494-497` |
  | `CellEditorHandler` | `startEditing`, `stopEditing`, `isEditing` | `EditingMixin.ts:77-131` |

  Option 2 therefore follows an existing pattern. What differs is the scale and the direction: those are a few
  methods on top of a handler that was already a separate object in `mxGraph`, whereas here the facade would cover
  29 methods, including getters whose fallback value must be chosen, for a feature that `mxGraph` implemented on the
  graph itself. The plugins converted from graph API rather than from handlers, `FitPlugin` and `ImageBundlePlugin`,
  kept no facade. ADR 0002 describes neither choice, so it should state when a facade is kept.

### Option 3: full plugin, `ImageBundlePlugin` style

The 29 methods leave the graph. Every call site becomes `graph.getPlugin<SelectionModelPlugin>('selection-model')?.x()`.

- **Gain**: about 4.5 kB minified, 1 to 1.1 kB gzip, estimated. The 29 call sites that stay bundled (mixins and
  `AbstractGraph`) get longer, since a `getPlugin` call plus a fallback replaces a short method call.
- **Cost**: 8 to 12 days. `ImageBundlePlugin` took 21 files and had one internal caller. Here there are about 85 call
  sites, 5 test files, about 15 stories, the user documentation, and a migration table.
- **Breaking**: the most used API inherited from `mxGraph` (`getSelectionCells`, `setSelectionCell`, `isCellSelected`,
  `clearSelection`). ADR 0001 used this very API as the reason for choosing mixins over delegation. Every application
  migrating from `mxGraph`, and every `Graph` user, would have to rewrite their selection calls.

## Risks common to options 2 and 3

- **Plugin construction order.** Plugins are instantiated in the order of the `plugins` option
  (`AbstractGraph.ts`, constructor). `SelectionCellsHandler` reads the selection model in its constructor, so it would
  break if listed before the selection plugin. `getDefaultPlugins()` can put it first, but nothing protects `BaseGraph`
  users.

  The optional `onConfigure` hook proposed in [issue #1149](https://github.com/maxGraph/maxGraph/issues/1149) solves
  it. The graph calls it on each registered plugin after **every** plugin is instantiated and before the first render,
  so the list of plugins is complete when it runs. The work done today in the constructors of the dependent plugins
  (the listener `SelectionCellsHandler` registers on the selection model, for instance) moves to `onConfigure`, and the
  order of the `plugins` array no longer matters. It also gives a natural place to detect a missing selection plugin
  and warn, instead of failing on a `null` model. Two conditions: the selection plugin must create its model in its
  constructor, not in its own `onConfigure`, since the order of the `onConfigure` calls is not specified; and the
  `selectionModel` collaborator option, which moves to the plugin in options 2 and 3, can use the plugin options
  introduced by the same issue.
- **Many behavioural decisions.** ADR 0002 requires a graceful fallback at every internal call site. With about 30
  always-bundled sites, each one is a small decision: what does `groupCells()` with no argument do when there is no
  selection plugin? The answer is usually "nothing", but it has to be decided and tested 30 times.
- **Lifecycle moves.** `updateSelection` after model changes and `clearSelection` on root change are hard-wired in
  `AbstractGraph`. The plugin should take them over by listening to the model `CHANGE` and graph `ROOT` events, which
  changes the order of operations in `graphModelChanged` (selection update before view validation today).
- **No safety net.** `SelectionMixin` has no dedicated test. Tests have to be written before moving it, which the
  effort estimates include.
- **Events and undo.** `GraphSelectionModel` fires `UNDO` with a `SelectionChange`. Consumers listening on
  `graph.getSelectionModel()` (the `Editor`, stories, user code) must keep a stable way to reach the model.

## Recommendation

Do not launch this as a standalone project.

- The best realistic gain is about 1 kB gzip (4 to 4.5 kB minified) out of 60.6 kB gzip, for 4 to 12 days of work and a
  breaking change on one of the most visible APIs.
- The cheap option (option 1) saves about 0.5 kB gzip and trades it for a silent behaviour change: a poor ratio.
- The hard parts (plugin construction order, the facade or breaking decision, fallbacks at call sites in the mixins) are
  not specific to selection. They will come up for every mixin in the conversion tracked by issue #762. The first one
  is already addressed by the `onConfigure` hook planned in issue #1149.

It becomes worth doing when it is part of that broader conversion, after the shared prerequisites below exist, so the
cost of selection drops to the move itself.

## Proposed action plan

Ordered so that each step pays off on its own, whatever is decided later.

1. **Fix the selection properties declared but not implemented on the graph** (side finding), tracked in
   [issue #1210](https://github.com/maxGraph/maxGraph/issues/1210). Independent of everything else.
2. **Write the missing tests for `SelectionMixin`** against `BaseGraph`: get/set/add/remove, navigation,
   `selectCells`, `selectCellForEvent` with toggle events, `updateSelection` after removing or collapsing cells. Useful
   now, required before any move. About 1 day.
3. **Decide the facade question once, in an ADR**: when does a plugin keep delegating methods on the graph? The
   handler-derived plugins keep them (`setConnectable`, `setPanning`, `setTooltips`, `stopEditing`), `FitPlugin` and
   `ImageBundlePlugin` do not, and nothing records why. Writing the rule settles option 2 against option 3 for
   selection and for the next mixins (`ConnectionsMixin`, `PanningMixin`, `EditingMixin` have the same profile).
4. **Implement the `onConfigure` lifecycle hook** of [issue #1149](https://github.com/maxGraph/maxGraph/issues/1149),
   already planned for 0.26.0, and move the selection dependent work of the handler plugins from their constructors to
   it. This removes the construction order constraint without a dedicated dependency mechanism, and provides the
   plugin options the `selectionModel` collaborator option needs once it moves to the plugin.
5. **Then convert `SelectionMixin`** with the chosen option, moving the `updateSelection` and `clearSelection` hooks out
   of `AbstractGraph` into the plugin, and adding a `CHANGELOG.md` entry, a migration note, and an update of
   `usage/graph.md`, `usage/plugins.md` and `usage/tree-shaking.md`. Reduce `chunkSizeLimitInKB` in
   `ts-example-without-defaults` in the same change.
6. **Measure again** on the same example to replace the estimates of this document with real figures.

Steps 1 and 2 cost about 1 day and are worth doing now. Steps 3 and 4 are the real entry ticket of the mixin to plugin
conversion, and step 4 is already planned for 0.26.0 for its own reasons. Once both exist, step 5 drops to roughly 3 to
5 days for option 2 or 6 to 8 days for option 3.

## Method and limits

- The effort figures are high level estimates made in a few minutes, based on the number of call sites and on the
  `ImageBundlePlugin` precedent (#1050), not on a prototype.
- Figures labelled "measured" come from real builds. "Derived" is a difference between two measured variants.
  "Estimated" adds an assumption on the size of facades or fallbacks, not verified by a build.
- Only `ts-example-without-defaults` was measured. Webpack examples were not, so the gain there may differ.
