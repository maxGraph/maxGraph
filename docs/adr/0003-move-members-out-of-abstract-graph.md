# ADR 0003: Move members out of `AbstractGraph`

- **Status**: Accepted
- **Date**: 2026-08-10
- **Scope**: `packages/core/src/view/AbstractGraph.ts`, `packages/core/src/view/mixin/`, `packages/core/src/view/plugin/`
- **Analysis basis**: commit `5c8cf90d8`, during the development of version 0.25.0
- **Related**: [ADR 0001](0001-use-mixins-to-split-the-graph-class.md),
  [ADR 0002](0002-use-plugins-for-optional-and-new-features.md),
  [issue #762](https://github.com/maxGraph/maxGraph/issues/762)

> All line numbers in this document refer to commit `5c8cf90d8`. They drift as soon as any of the moves below lands, so
> treat them as pointers to help locate a member, not as an authoritative index.

## Context

`AbstractGraph` is 1337 lines. It inherits the God-object design of `mxGraph`, whose `mxGraph.js` reached 13229 lines in
v4.2.2. Mixins were introduced to break that class up (see `packages/core/src/view/mixin/_README.md`), and plugins are
now the direction the project is taking, `ImageMixin` having already become `ImageBundlePlugin`.

What remains in `AbstractGraph` is a mix of three things: members that genuinely belong to the class, members that
belong to an existing mixin and were never moved, and members that form coherent groups with no home yet. This ADR
decides how to tell them apart and where each goes.

Three technical facts constrain every option, and they are not obvious from reading the code:

**Moving a member to a mixin is not a breaking change.** `applyGraphMixins(AbstractGraph)` runs unconditionally at
`AbstractGraph.ts:1337`, and each mixin ships a `.type.ts` that augments the `AbstractGraph` interface through
declaration merging. After a move, `graph.scrollPointToVisible(...)` still compiles and still runs, on `AbstractGraph`,
`BaseGraph` and `Graph` alike.

**Moving a member to a mixin brings no tree-shaking gain.** For the same reason: all 21 mixins are imported and applied
by `_graph-mixins-apply.ts` whatever the graph flavour. A mixin move buys cohesion, readability and a smaller
`AbstractGraph.ts`, nothing more. Only a move to a plugin buys bundle size, at the price of a breaking change.

**A mutable default cannot move to a mixin.** `mixInto` copies mixin members onto the prototype, so an object or array
default is shared by every graph instance. This is documented at `AbstractGraph.ts:91-96` and is why
`alternateEdgeStyle`, `cells`, `mouseListeners`, `multiplicities` and `options` sit in the class today. A default that
is `null`, a number, a boolean or a string moves freely. The blocker is specific to mixins: plugins are instantiated per
graph (`AbstractGraph.ts:500`), so converting a mixin to a plugin dissolves the problem rather than solving it.

**Declaration order in `AbstractGraph` is observable output.** The Codec walks the object's own fields in declaration
order, so moving a property, or merely reordering two, changes the order of the child elements in the XML produced by
`exportObject`. Decoding is unaffected since elements are matched by their `as` attribute, and previously exported
documents stay valid, but any consumer comparing exported XML as text sees a diff. This was found during
implementation, not during the analysis, see [Implementation feedback](#implementation-feedback).

## Decision

### D1. No new mixin is created, plugins are the target

Any member that needs a home which does not exist yet goes to a **plugin**, never to a new mixin. Every remaining mixin
is itself expected to become a plugin eventually.

Creating new plugins is accepted, including the breaking change it implies for `BaseGraph` users, who must opt in
through the `plugins` option. `Graph` users see no change when the plugin ships in `getDefaultPlugins()`.

### D2. An existing mixin is a valid interim destination

Moving a member out of `AbstractGraph` into a mixin that **already exists** is cheap, non-breaking, and shrinks the
class today. The member then follows that mixin when it is converted to a plugin.

This is a staging move, not the final target. It must not harden into a design decision: a later plugin split may
regroup members differently.

### D3. Properties with a mutable default stay in `AbstractGraph`, grouped and tested

They are relocated into the existing block "Variables that should be in the mixins but requiring per-instance
initialization" (`AbstractGraph.ts:91-122`), so the reason they stay is visible at the declaration rather than only in
this ADR, and so the list of pending moves is readable straight from the source.

`alternateEdgeStyle` (`:102`) and `multiplicities` (`:114`) are already in that block. `pageFormat` (`:244`) and
`warningImage` (`:383`) are not, and must join it.

**A regression test is required for every property of that block.** `__tests__/view/Graph.test.ts` already provides the
home, the `describe('Expect no global state for properties coming from mixins')` block, which today covers
`selectionModel` only. Each test instantiates two graphs, asserts the property is not the same reference on both,
mutates it on the first, then asserts the second is unaffected. Covering the whole block rather than only the properties
named here means the next mutable default someone adds is caught by an existing pattern instead of by a code review.

### D4. `sizeDidChange` stays in `AbstractGraph`

It is called from the constructor (`:497`), from `graphModelChanged` (`:595`) and from `refresh` (`:1004`), so the
behaviour is not optional and cannot depend on a plugin being registered.

**Task attached to this decision:** document the reason in the code with a plain comment in the body of
`sizeDidChange`, just before the implementation. Deliberately not a JSDoc block, because JSDoc is user-facing API
documentation while this is a note for contributors, and a reader of the public API has no use for a refactoring
constraint.

The method currently sits in `EventsMixin.ts:802`, where it is the odd one out. "Stays in `AbstractGraph`" means it
stays on the graph class and out of any plugin, which also makes relocating it from `EventsMixin` into `AbstractGraph`
itself the natural follow-up.

This decision parks the container-sizing group, see [Appendix B.1](#b1-container-and-graph-sizing-parked).

### D5. `PageBreaksMixin` is renamed to `PageMixin`

Once it absorbs the page properties, the mixin covers the whole page concern and its current name no longer describes
it.

The rename is purely internal: mixins are not exported outside their directory (`view/mixin/_README.md`), and `index.ts`
only imports `_graph-mixins-types.js` for its side effect, so no public symbol changes. It touches four files, the two
mixin files, `_graph-mixins-apply.ts` and `_graph-mixins-types.ts`.

### D6. `setTooltips` is not deprecated

`setTooltips` (`:538`) is a two-line delegation to the `TooltipHandler` plugin. Replacing it with
`graph.getPlugin<TooltipHandler>('TooltipHandler')?.setEnabled(...)` was considered and rejected: it would break users
for no functional gain. It stays as is.

### D7. Members covered by issue #762 are not touched

The handler factories and two edge-style members are already being moved under
[issue #762](https://github.com/maxGraph/maxGraph/issues/762), announced by the comment at `AbstractGraph.ts:410`. No
move proposed in this ADR may touch them. See [Appendix B.3](#b3-handler-factories-and-edge-style-members-issue-762).

## Consequences

**Positive**

- `AbstractGraph.ts` drops from 1337 to roughly 800 lines. Implementation landed at 811.
- Each moved member lands next to the code that already uses it, which makes its `Pick<AbstractGraph, ...>` dependency
  list an accurate description of what it needs.
- The shared-state failure mode, silent today, becomes a failing test.
- The reason a member stays in `AbstractGraph` becomes visible at the declaration, not only in this document.

**Negative**

- No bundle-size gain from any of this work (see the second constraint in the Context). The payoff is cohesion.
- Cross-file moves render as delete plus add in review, so the diff overstates the risk and understates the mechanical
  nature of the change.
- The interim mixin destinations of D2 mean some members will move twice, once now and once when their host mixin
  becomes a plugin.
- Moving an accessor written as an arrow function property turns it into a prototype method, which changes its binding.
  Calling it on the graph is unaffected, but a detached reference stops working, and TypeScript gives both forms the
  same type so nothing warns before runtime. This makes the claim above, that a mixin move is not a breaking change,
  true of the interface but not quite of the behaviour. See [Implementation feedback](#implementation-feedback).

**Neutral but worth recording**

- The plan that follows contains no plugin work at all. Not because plugins are refused, D1 explicitly allows them, but
  because every group that turned out to be actionable happened to have an existing mixin to land in. The first genuine
  plugin extraction will come from a later group, or from converting one of the mixins listed in Appendix A.

## Implementation plan

### Order of work

Safety net first, then the interim moves, which are non-breaking and shrink the class immediately.

1. **The shared-state regression tests, plus regrouping `pageFormat` and `warningImage`** (D3). First on purpose: those
   tests guard against exactly the mistake the rest of the plan can make. Cheap, independent of everything else.
2. **The in-body comment on `sizeDidChange`** (D4). One comment, no code change, and it stops the next contributor from
   re-opening a settled question.
3. **The viewport-translation batch to `PanningMixin`**: `scrollPointToVisible`, the scrollbar flags, and `center`.
4. **The high-confidence rows of Appendix A** (`CellsMixin`, `ValidationMixin`, `LabelMixin`, `OverlaysMixin`,
   `OrderMixin`, `PageMixin`). Mechanical, removes roughly 275 lines.
5. **Drill-down into `GroupingMixin`** (Appendix B.2). This is the last move of the plan.

**The shared-state-blocked properties stay in `AbstractGraph`, and this plan does not move them.** `pageFormat`,
`warningImage`, `multiplicities` and `alternateEdgeStyle` remain in the group described by D3. There is no step 6.

Step 1 already does everything that can be done for them: they sit together where the constraint is visible at the
declaration, and a test pins the per-instance guarantee so a future move cannot break it silently. Moving them would
require per-instance initialization inside a mixin, which `mixInto` does not provide and which the project has
deliberately chosen not to fix.

Appendix A still records their target mixin, because the cohesion argument is real and will apply the day the
constraint disappears. Those rows are an inventory, not a backlog: acting on them is a separate decision, out of scope
here.

### Volume

Estimated by summing the line ranges of the members listed in the appendices, so treat the figures as plus or minus 15%.

| Step | Members | Lines leaving `AbstractGraph` | Files touched |
|---|---|---|---|
| 1. Tests and regrouping | 2 | ~0 (in-file move) | 2 |
| 2. `sizeDidChange` comment | 0 | 0 | 1 |
| 3. Viewport translation to `PanningMixin` | 6 | ~150 | 4 |
| 4. Appendix A high-confidence batch | ~33 | ~275 | 13 |
| 5. Drill-down to `GroupingMixin` | 6 | ~85 | 3 |

The diff is larger than the moved-line count, because the convention splits each member in two: the TSDoc goes to the
mixin `*.type.ts`, the implementation to the mixin `*.ts`. A moved method therefore produces one deletion and two
insertions. Realistic total: **1100 to 1500 changed lines over about 25 files**.

One thing that keeps the cost down: the `Pick<AbstractGraph, ...>` lists of the *other* mixins do not need updating.
Declaration merging keeps every member on the `AbstractGraph` interface wherever it is declared, so only the receiving
mixin changes structurally, moving the member from its `PartialGraph` list to its `PartialXxx` list.

### Pull request split

Not a single pull request, for two reasons. **Pure moves render as delete plus add**, so a reviewer cannot distinguish
"relocated verbatim" from "relocated and altered" without diffing by hand, and at 1300 lines that stops being a review.
And **the failure mode is silent**: a property with a mutable default that slips into a mixin becomes shared state
across every graph instance, with no compile error and, until step 1 lands, no failing test.

A third reason applies to any future plugin extraction, though not to the pull requests below since all of them are
source-compatible: mixing breaking and non-breaking changes forces the whole batch to wait for a major release.

| PR | Content | Size | Breaking |
|---|---|---|---|
| 1 | This ADR, plus ADR 0001 and ADR 0002 | ~450 lines | no |
| 2 | Shared-state regression tests, regrouping `pageFormat` / `warningImage`, and the `sizeDidChange` comment | ~130 changed | no |
| 3 | Viewport translation to `PanningMixin` | ~300 changed | no |
| 4 | `CellsMixin` + `ValidationMixin` + `OverlaysMixin` batch | ~350 changed | no |
| 5 | `LabelMixin` + `OrderMixin` batch, plus the page cluster and the `PageMixin` rename | ~360 changed | no |
| 6 | Drill-down to `GroupingMixin` | ~180 changed | no |

Each stays under roughly 400 changed lines, which is where review quality tends to drop.

### Review aids

- **One member family per commit** inside each pull request, so the diff can be reviewed commit by commit.
- **The test suite must pass untouched** in the relocation pull requests. These are mechanical moves, so any test change is a signal
  that the move was not a move. State this explicitly in each pull request description.
- **State the source and destination line ranges** in the description, so a reviewer can diff the two sides directly
  instead of hunting for them.
- **A disappearing import is evidence of a clean cut.** When the last consumer of a symbol leaves `AbstractGraph`, its
  import becomes unused and must be removed. That removal is a good proxy for "the concern left wholly", and the
  compiler will not point it out.

## Implementation feedback

The plan was carried out in five pull requests, #1131 to #1136. This section records what the analysis got right, what
it missed, and what the numbers turned out to be. It is written after the fact and does not change any decision above.

### Estimates against actuals

| | Estimated | Actual |
|---|---|---|
| `AbstractGraph.ts` final size | roughly 800 lines | **811 lines**, from 1337 |
| Files touched | about 25 | **24** |
| Total churn | 1100 to 1500 changed lines | **1561** (937 insertions, 624 deletions) |
| Lines leaving in step 3 | ~150 | 154 |
| Lines leaving in step 4 | ~275 | 286 |
| Lines leaving in step 5 | ~85 | 90 |

The per-step line estimates, obtained by summing the line ranges of the appendices, proved accurate within a few
percent. The total churn came out 4% above the upper bound, because each moved member costs slightly more than
predicted once the TSDoc is re-homed in the `.type.ts` file.

Step 4 was split into two pull requests, #1134 and #1135, since a single one would have been far above the review
ceiling. Of the five, only #1135 exceeded it, at 484 changed lines, because it also carried the `PageMixin` rename.

### What the analysis missed

Two consequences of a mixin move were not anticipated, and both are now recorded in the Context and Consequences
sections above.

**Declaration order is observable through the Codec.** Regrouping `pageFormat` and `warningImage` in step 1 changed the
order of the child elements in the exported XML and broke `all-graph-classes.test.ts`. Not a breaking change, decoding
matches on the `as` attribute, but it is a real output difference that the analysis treated as impossible: step 1 was
described as an in-file move with no effect at all.

**Arrow function properties change binding when they become mixin members.** Six accessors were affected across steps 3
and 4: `isIgnoreScrollbars`, `isTranslateToScrollPosition`, `isExportEnabled`, `isImportEnabled`,
`getAlreadyConnectedResource` and `getContainsValidationErrorsResource`. They were bound to their instance and could be
detached; as prototype methods they cannot. This is the only user-visible break of the whole plan, and it needed a
changelog entry. The ADR asserted flatly that mixin moves are not breaking changes, which is true of the type surface
but not of every runtime behaviour.

### What worked

**The safety-net-first ordering paid off immediately.** The shared-state tests of step 1 were in place before any
property moved, and the group they cover grew with the plan.

**The "no test changes" rule did its job.** Four of the five pull requests changed no test at all. The single exception
was step 1, and the test it broke pointed straight at the serialization finding above. A rule whose violation produces
a genuine discovery is worth keeping.

**Import removal turned out to be the best signal of a clean cut**, which is why it now appears in the review aids.
`hasScrollbars`, `isI18nEnabled`, `isNode` and `Point` all became unused in `AbstractGraph` as their concerns left.

**Splitting a property from its getter is workable.** `warningImage` and `pageFormat` stayed while `getWarningImage`
and `getPageFormat` moved, with a comment at the getter recording why. It reads better than expected, and it keeps the
blocked property visible in the group where the constraint is documented.

## Appendix A: members moving to an existing mixin

Per D2 these are staging moves: non-breaking, and each member follows its host mixin when that mixin becomes a plugin.

**Read the target column literally.** A row whose blocking state is `yes` does not move, wholly or in part: the target
named there is where the member would belong if the constraint of D3 did not exist, not a planned destination. Those
entries are an inventory kept for the day the constraint disappears. Where a row mixes both, the target column says
which part moves and which part stays.

Note there is no `ScrollMixin`: the scrolling and panning members live in `PanningMixin`.

| Members (line in `AbstractGraph.ts`) | Target mixin | Rationale | Blocking state | Confidence |
|---|---|---|---|---|
| `scrollPointToVisible` (695) | `PanningMixin` | Uses `isTimerAutoScroll`, `isAllowAutoPanning`, `getPanDx`, `getPanDy`, `PanningHandler`, all owned by `PanningMixin`. Already referenced from `PanningMixin.type.ts:40,48` as if it belonged there | none | **High** |
| `ignoreScrollbars` (277), `isIgnoreScrollbars` (520), `translateToScrollPosition` (285), `isTranslateToScrollPosition` (521) | `PanningMixin` | Same concern, should follow `scrollPointToVisible`. Only consumers are `EventsMixin.ts:689-690` and `scrollPointToVisible` itself | none | **High** |
| `center` (1018) | `PanningMixin` | Programmatic viewport translation, see [Appendix B.4](#b4-center-is-a-scroll-operation-not-a-fit-operation). Zero internal callers | none | **High** |
| `recursiveResize` (347), `isRecursiveResize` (1237), `setRecursiveResize` (1246) | `CellsMixin` | Sole internal consumer is `CellsMixin.ts:1062` (`resizeCells`) | none | **High** |
| `exportEnabled` (263), `isExportEnabled` (518), `importEnabled` (269), `isImportEnabled` (519) | `CellsMixin` | They back `canExportCell` / `canImportCell`, declared in `CellsMixin.type.ts:793,807` | none | **High** |
| `defaultOverlap` (176), `getOverlap` (1260), `isAllowOverlapParent` (1270) | `CellsMixin` | `constrainChild` lives in `CellsMixin.type.ts:634` and `CellsMixin.ts:1500` is the only internal caller of `getOverlap` | none | **High** |
| `multigraph` (375), `isMultigraph` (1201), `setMultigraph` (1212), `allowLoops` (360), `isAllowLoops` (1219), `setAllowLoops` (1228), `alreadyConnectedResource` (395), `getAlreadyConnectedResource` (534), `containsValidationErrorsResource` (403), `getContainsValidationErrorsResource` (536) | `ValidationMixin` | `ValidationMixin.ts:26-27` already `Pick`s `isAllowLoops` and `isMultigraph`; the two resource keys are only read by validation messages | none | **High** |
| `convertValueToString` (1120) | `LabelMixin` | `LabelMixin.ts:51` is the primary caller (`getLabel`), also used by `EditingMixin.ts:88` and `TooltipHandler.ts:418` | none | **High** |
| `getLinkForCell` (1141) | `LabelMixin` | Cell-text concern, single internal caller `PrintPreview.ts:948`. Weaker cohesion than `convertValueToString`, could equally justify staying | none | Medium |
| `warningImage` (383), `getWarningImage` (530) | `OverlaysMixin` for `getWarningImage`. `warningImage` **stays in `AbstractGraph`** | `OverlaysMixin.ts:133` is the only consumer (`setCellWarning`), and `OverlaysMixin.type.ts:74,85` already documents `warningImage` as if it were local | **yes**: `Image` instance | Medium |
| `keepEdgesInForeground` (333), `keepEdgesInBackground` (341) | `OrderMixin` | Z-order concern, single consumer `GraphView.ts:1095-1096`. `OrderMixin` is currently tiny and is the natural home | none | Medium |
| `pageVisible` (203), `isPageVisible` (510), `pageBreaksVisible` (211), `isPageBreaksVisible` (511), `pageBreakColor` (217), `getPageBreakColor` (512), `pageBreakDashed` (223), `isPageBreakDashed` (513), `minPageBreakDist` (229), `getMinPageBreakDist` (514), `preferPageSize` (236), `isPreferPageSize` (515), `pageFormat` (244), `getPageFormat` (516), `pageScale` (251), `getPageScale` (517), `getPreferredPageSize` (797) | `PageMixin` (D5), except `pageFormat` which **stays in `AbstractGraph`** | `PageBreaksMixin.ts:25-32` already `Pick`s six of these getters | **yes**: `pageFormat` is a mutable `Rectangle` | Medium |
| `multiplicities` (114) | **Stays in `AbstractGraph`.** Natural home would be `ValidationMixin` | Only used by `validateCell`. Correct home on cohesion grounds | **yes**: array | **Low**, blocked by D3 |
| `alternateEdgeStyle` (102) | **Stays in `AbstractGraph`.** Natural home would be `EdgeMixin` | Consumed by `flipEdge` | **yes**: `CellStyle` object | **Low**, blocked by D3 |

`EdgeMixin` receives nothing actionable: `alternateEdgeStyle` is its only candidate and it is blocked.

## Appendix B: groups examined separately

### B.1 Container and graph sizing (parked)

| Member | Line |
|---|---|
| `border`, `getBorder`, `setBorder` | 325, 1148, 1157 |
| `resizeContainer`, `isResizeContainer`, `setResizeContainer` | 318, 1168, 1177 |
| `minimumContainerSize`, `getMinimumContainerSize`, `setMinimumContainerSize` | 305, 526, 527 |
| `maximumContainerSize` | 311 |
| `minimumGraphSize`, `getMinimumGraphSize`, `setMinimumGraphSize` | 299, 523, 524 |
| `maximumGraphBounds`, `getMaximumGraphBounds` | 292, 986 |
| `doResizeContainer` | 822 |
| `getBorderSizes` | 779 |

A `SizingPlugin` was the natural target. D4 rules it out: `sizeDidChange` reads seven of these members (`getBorder`,
`getMinimumContainerSize`, `isResizeContainer`, `doResizeContainer`, `isPreferPageSize`, `getPreferredPageSize`,
`getMinimumGraphSize`), so keeping the caller in `AbstractGraph` while moving its collaborators into a plugin would turn
it into a chain of `getPlugin('sizing')?.` calls with fallbacks. That is worse than the current situation.

The group therefore stays put. The cohesion finding remains valid and will apply the day the constraint changes: today
`sizeDidChange` sits in `EventsMixin.ts:802` where it is the odd one out, the sizing members sit in `AbstractGraph`, and
the page breaks sit in `PageBreaksMixin`, which is three scattered pieces of one concern.

### B.2 Drill down and root (interim: `GroupingMixin`)

| Member | Line |
|---|---|
| `getCurrentRoot` | 892 |
| `getTranslateForRoot` | 925 |
| `getChildOffsetForCell` | 939 |
| `home` | 947 |
| `isValidRoot` | 966 |
| `resetViewOnRootChange` | 354 |

`GroupingMixin` already owns `enterGroup` / `exitGroup`, the drill-down entry points, and already `Pick`s `isValidRoot`
(`GroupingMixin.ts:33`).

To record for the later plugin conversion: drill-down is view navigation while grouping is model restructuring. The
eventual split may well separate them again, so this interim move must not harden into a design decision.

`defaultParent` / `getDefaultParent` / `setDefaultParent` (183, 1284, 1303) are deliberately excluded: called from
`processChange` (`:610`) and the single most used entry point of the whole API, the cohesion win does not justify the
churn.

### B.3 Handler factories and edge-style members (issue #762)

| Member | Line |
|---|---|
| `createEdgeHandlerInstance` | 418 |
| `createEdgeSegmentHandler` | 429 |
| `createElbowEdgeHandler` | 438 |
| `createVertexHandler` | 447 |
| `createHandler` | 843 |
| `createEdgeHandler` | 873 |

Left untouched per D7, work is already in progress. Listed here only so the inventory of `AbstractGraph` is complete.

The same issue covers two edge-style members, both to move to `GraphView`, their only consumer:

| Member | Sole consumer |
|---|---|
| `defaultLoopStyle` (368) | `GraphView.ts:1333` |
| `isOrthogonal` (1069) | `GraphView.ts:1421` |

Both were initially candidates for `EdgeMixin`. Those proposals are withdrawn: relocating them to a mixin now would only
add a step to undo later.

### B.4 `center` is a scroll operation, not a fit operation

The obvious target for `center` (`:1018`) looks like `FitPlugin`, which already owns `fit` (`FitPlugin.ts:128`) and
`fitCenter` (`:238`). That is wrong, and the name is what makes it look right.

**`center` never touches `view.scale`.** It only calls `view.setTranslate(...)` (`:1033,1052`) and sets
`container.scrollLeft` / `scrollTop` (`:1056-1057`). Scale is the dividing line in this codebase: `ZoomMixin` and
`FitPlugin` own scale, `PanningMixin` owns translate and scroll offset. `FitPlugin.fit` computes a new scale and
`fitCenter` applies `view.scaleAndTranslate(newScale, ...)` (`FitPlugin.ts:276`). `center` does neither.

**It is built exactly like `scrollRectToVisible`.** Both branch on `hasScrollbars(container)` and handle two worlds: no
scrollbars means adjust `view.translate`, scrollbars means adjust `container.scrollLeft` / `scrollTop`. Compare
`AbstractGraph.ts:1020,1032-1057` with `PanningMixin.ts:237,269`. `FitPlugin` never reads or writes `scrollLeft` /
`scrollTop` at all.

**`fitCenter` and `center` answer different questions.** `fitCenter` centers as a consequence of fitting, deriving the
translate from the newly computed scale. `center` centers at the current scale.

`center` therefore joins the programmatic viewport translation family (`scrollCellToVisible`, `scrollRectToVisible`,
`scrollPointToVisible`), which lives in `PanningMixin` today. That family, rather than the mixin as a whole, is the
cohesive unit that should drive the eventual plugin split.

### B.5 Background image (deferred)

`backgroundImage` (196), `getBackgroundImage` (1087), `setBackgroundImage` (1096). Three members, no internal caller in
`core/src` outside the class. Too small to justify its own plugin today. Either fold into `PageMixin` as an interim move
(background page plus background image is a defensible canvas-background concern), or bundle into a future
background/canvas plugin. Not worth acting on alone.

### B.6 Legacy rendering flags (deprecation lead, not a move)

`renderHint` (163), `dialect` (168), `getDialect` (509). `dialect` is typed `DialectValue` and always `'svg'`;
`renderHint` is a constructor leftover from `mxGraph` that nothing reads. The useful action is a deprecation decision,
not a relocation.

## Appendix C: members that stay in `AbstractGraph`

| Member | Why |
|---|---|
| `constructor` (478), `registerDefaults` (463), `initializeCollaborators` (476) | Bootstrap contract of the three-tier hierarchy |
| `container` (83), `getContainer` (505) | Read by nearly every mixin through `Pick` |
| `model` (131), `view` (138), `stylesheet` (153), `cellRenderer` (158), `getDataModel` (557), `getView` (564), `getStylesheet` (571), `setStylesheet` (578), `getCellRenderer` (508) | Collaborators wired by the constructor, the anchor every mixin depends on |
| `plugins` (133), `getPlugin` (506) | Plugin registry, cannot live in a mixin without a cycle |
| `graphModelChanged` (588), `processChange` (605), `graphModelChangeListener` (87) | Model-to-view dispatch, cross-cutting by nature |
| `destroy` (1313), `destroyed` (85) | Lifecycle, must own plugin and view teardown |
| `batchUpdate` (550) | Thin delegation to the model, the documented entry point for every change |
| `enabled` (257), `isEnabled` (1184), `setEnabled` (1194) | Global interaction switch, read by most mixins |
| `alternateEdgeStyle` (102), `cells` (104), `mouseListeners` (109), `multiplicities` (114), `options` (117) | Parked per D3, which also requires `pageFormat` (244) and `warningImage` (383) to join this block |
| `defaultLoopStyle` (368), `isOrthogonal` (1069) | Moving to `GraphView` under issue #762, see D7 |
| `sizeDidChange` | Per D4 |
| `setTooltips` (538) | Per D6 |
| `defaultParent` (183), `getDefaultParent` (1284), `setDefaultParent` (1303) | See Appendix B.2 |
| `refresh` (997), `getGraphBounds` (978) | Thin `GraphView` delegations on the main API surface |
| `isConstrainedMoving` (89), `paintBackground` (88) | Cross-cutting interaction state |
