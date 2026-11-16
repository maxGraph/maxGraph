# Task: fix issue #1051, SegmentConnector drops bends at some zoom scales

Branch `fix/1051-segment-connector-scale`, created from `main` at `63feb4c8a`.

Reference: analysis v2, attached to the comment
https://github.com/maxGraph/maxGraph/issues/1051#issuecomment-6549160539 (`ANALYSIS_1051_v2.md`).

Agreed scope before exploring:

1. a Storybook story, in its own commit before the fix, showing the issue repro, the comment repro and the v2 "bend
   exactly on a terminal border after 4 zoomIn" case, as a fixed grid of scales with point counts, plus a zoom slider;
2. TDD: failing test first (unscaled absolute points equal across scales), commit after green and before refactor;
3. fix: port draw.io 14.7.3 without the `innerLoopWaypoints` guard (v2 recommendation);
4. scale <= 0.15: out of scope for the fix, but tests pinning the behaviour, explained in the tests and in a code comment.

## Codebase Context

### `SegmentConnector`, `packages/core/src/view/style/edge/Segment.ts`

- L54-58: `pts`, `source`, `target` are divided by the scale (`scalePointArray`, `scaleCellState`), rounded to 0.1. The
  translate is **not** removed: the values are "unscaled but translated".
- L59: `tol = 1`.
- L67-81: `pushPoint` multiplies back by the scale, rounds to 0.1, and drops the point when it is within the tolerance
  of the last pushed one: `>= tol` (1) on x, `>= Math.max(1, scale)` on y. The tolerance is in **view pixels**.
- L203-275: the routing, five `pushPoint` calls (L210, L218, L237, L264, L272).
- L277-297: the cleanup "removes bends inside the terminal" compares `result` (view coordinates) with `source` /
  `target` (unscaled): the #1051 bug.
- L299-318: "removes last point if inside tolerance with end point" compares `pe = pts[lastInx]` (unscaled) with
  `result[last]` (view coordinates), and writes the unscaled `pe.x` / `pe.y` into `result`. **Same space mismatch as
  #1051**, on fixed target ends (`pe != null`). Not covered by v2, which only tested floating ends ("Not verified"
  section). Inherited from mxGraph (`mxEdgeStyle.js` L855-868), fixed by draw.io 32.0.1 (see below).

### `packages/core/src/view/style/edge/shared.ts`

- L30 `scalePointArray(points, scale)` and L57 `scaleCellState(state, scale)`: no translate parameter, unlike draw.io
  since 32.0.1.

### Other callers

- `OrthConnector` (`Orthogonal.ts` L222) and `ManhattanConnector` (`Manhattan.ts` L552) fall back to
  `SegmentConnector` (v2, conditions not read).
- `Manhattan.ts` L595-596 already rounds with the translate: `Math.round((pt.x + translate.x) * scale * 10) / 10`.

### Existing tests

- `packages/core/__tests__/view/style/edge/edge-style-routing.test.ts` (132 lines): `test.each` over edge styles,
  helper `computeAbsolutePoints(style, targetPosition, controlPoints)`, graph from `createGraphWithoutContainer()`
  (`packages/core/__tests__/utils`). One `segmentEdgeStyle` case at scale 1 (L57-69). Natural home for a new
  `describe` on scales, or a sibling file `segment-connector-scale.test.ts`.
- The v2 appendix holds ready-made test sources: the repros (`zz-scratch-1051.test.ts`), the two cases separating the
  patch from 14.7.3 with assertions (`zz-scratch-1051-advantages.test.ts`), and the seeded fuzz comparison.

### Stories

- `packages/html/stories/Orthogonal.stories.ts`, title `Connections/Orthogonal`: the closest neighbour. A new story
  goes under `Connections/`, for instance `Connections/SegmentZoom`.
- `packages/html/stories/ZoomAndFit.stories.ts`: pattern for control buttons (`DomHelpers.button`), `zoomIn` /
  `zoomOut`, `createGraphContainer(args)`.
- `packages/html/stories/shared/args.js`: `globalTypes` / `globalValues` use `type: 'range'` controls, the pattern for a
  scale slider as a Storybook arg; an in-page `<input type="range">` is the alternative, live without re-rendering.
- Demo link id is derived from `title:` (see `.claude/rules/documentation/website.md`).

## Research Findings: draw.io moved on after v2

**v2 was written against a stale draw.io clone** (`0f419a92`, 31.5.3). Two later releases rework `SegmentConnector`,
both published before v2 (2026-11-01):

### draw.io 32.0.1, `4231dfb383e7f6202b5e9091ede836fdcf17df4d` (2026-10-03): everything in model units

https://github.com/jgraph/drawio/commit/4231dfb383e7f6202b5e9091ede836fdcf17df4d

In `SegmentConnector`:

- `pts`, `source`, `target` unscaled **and untranslated**: `scalePointArray(points, s, tr)`,
  `scaleCellState(state, s, tr)`, through a new `mxUtils.unscale(value, scale, translate)`
  (`Math.round((value / scale - translate) * 1e6) / 1e6`).
- the hints are untranslated too (`unscale(tmp.x, 1, tr.x)`).
- `lastPushed` is kept in model units (`result[0]` unscaled).
- `pushPoint` rounds in model units, compares with a **symmetric tolerance of 1 model unit** on both axes, and pushes
  `new mxPoint((pt.x + tr.x) * s, (pt.y + tr.y) * s)`. Comment: "Adds waypoints only if outside of tolerance in model
  units so that the result does not depend on the scale or translate".
- the "removes last point" block unscales `result[last]` before comparing with `pe`, and writes back `(pe.x + tr.x) * s`.

Consequences for this task:

- **The asymmetric tolerance is answered**: mxGraph has it (`mxEdgeStyle.js` L611, `Math.max(1, state.view.scale)` on y
  only), draw.io dropped it in 32.0.1 for a symmetric 1 model unit.
- **The scale <= 0.15 limitation disappears** with this version: the tolerance no longer grows to 1/scale model units, so
  a 6 unit segment at scale 0.15 is kept. What was planned as "pin the current sub-pixel behaviour" would become "prove
  it is fixed", unless only 14.7.3 is ported.
- **The fixed target end mismatch (L299-318) is fixed** there.
- The same commit also changes `ElbowConnector`, `SideToSide`, `TopToBottom` (`isLess`, new `roundScaled`) and the
  `wayPoints1` rounding of `OrthConnector`: same class of bug (route depending on scale or translate) in other styles,
  outside #1051.
- The 32.0.1 ChangeLog has no entry naming the segment connector.

### draw.io 32.5.5, `17b367b91dbab91804f852645788d7ffb46dcb79` (2026-10-18): channel bounds

https://github.com/jgraph/drawio/commit/17b367b91dbab91804f852645788d7ffb46dcb79

Adds `mxGraphView.getChannelBounds(state)` (returns the state by default) and `mxEdgeStyle.getChannelBounds`, used
instead of the terminal bounds for the channel checks and the cleanup. An extension point for draw.io, unrelated to the
scale: out of scope.

### Unchanged facts from v2

- 14.4.8 (`91c8890a2`) = the patch of the issue; 14.7.3 (`82f74a03e`) = `tempPoints` / `addPoint`.
- `innerLoopWaypoints` guard (30.2.7, `650fbd742`): feature, out of scope.

## Key Files

- `packages/core/src/view/style/edge/Segment.ts:54-81` - unscaling, tolerance, `pushPoint`
- `packages/core/src/view/style/edge/Segment.ts:277-297` - the #1051 cleanup
- `packages/core/src/view/style/edge/Segment.ts:299-318` - fixed end check, same space mismatch
- `packages/core/src/view/style/edge/shared.ts:30,57` - `scalePointArray`, `scaleCellState`
- `packages/core/__tests__/view/style/edge/edge-style-routing.test.ts:27-43` - test helper to reuse
- `packages/html/stories/Orthogonal.stories.ts`, `packages/html/stories/ZoomAndFit.stories.ts` - story patterns
- draw.io `src/main/webapp/mxgraph/src/view/mxEdgeStyle.js`, `SegmentConnector` at `17b367b9` - the target port
- mxGraph `javascript/src/js/view/mxEdgeStyle.js:598-611,855-868` at `ff141aab` - the origin

## Patterns to Follow

- `insertVertex` / `insertEdge` object form, no explicit `parent` (`.claude/rules/architecture/graph-api-usage.md`).
- `isNullish` for nullish checks on numbers; explicit return types; `.js` import extensions.
- Tests: `createGraphWithoutContainer()`, `test.each`, assert unscaled absolute points.
- TDD commits: commit after green, before the refactor.
- No CHANGELOG entry for a plain fix, unless users must adapt (routes change at some scales: to discuss at PR time).

## Dependencies

- `scaleCellState` / `scalePointArray` are shared: any signature change (translate parameter) must stay compatible with
  their other callers (`Manhattan.ts` uses its own rounding; check other users with grep before changing them).
- A `unscale` helper would be new in maxGraph (no equivalent today).

## Open decision

Which draw.io version to port: 14.7.3 (v2, decided before exploring) or the 32.0.1 `SegmentConnector` (model units,
symmetric tolerance, fixed end check). See the report to the user.
