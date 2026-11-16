# Implementation Plan: fix issue #1051, SegmentConnector drops bends at some zoom scales

## Overview

Port the draw.io 14.7.3 version of `SegmentConnector`: the routing collects the bends unscaled in a temporary array,
both "remove bends inside the terminal" cleanups run on that array against the unscaled terminals, and only then each
remaining bend goes through `pushPoint`. Nothing else of `SegmentConnector` changes. The draw.io 32 model-unit changes
are out of scope, tracked in #1322.

Order of the commits, each one on its own:

1. **Story** showing the bug, before any change to the core. It is what the user checks visually before and after the
   fix.
2. **Red**: the regression tests, failing on the current code. Not committed red, see Testing Strategy.
3. **Green**: the 14.7.3 port, with the tests of step 2. One commit, `fix: ...`.
4. **Refactor**: only if the green code calls for it (see `Segment.ts` below), plus the code comment on the sub-pixel
   tolerance. Its own commit, after green, never folded into it.
5. **Last commit of the branch**: remove `.claude/tasks/01-fix-segment-connector-scale/`, see `before-merge.md`.

## Dependencies

- None outside the repository. `scaleCellState` and `scalePointArray` in `shared.ts` are not touched, so `Orthogonal.ts`,
  their other caller, is unaffected.
- `OrthConnector` (`Orthogonal.ts:213-223`, `OrthogonalConnectorConfig.pointsFallback` is `true` by default,
  `config.ts:74`) and `ManhattanConnector` (`Manhattan.ts:549-552`) fall back to `SegmentConnector` as soon as the
  edge has control points, so the fix applies to both. The tests cover them through that path.

## File Changes

### `packages/html/stories/SegmentConnectorZoom.stories.ts` (new, commit 1)

- Title `Connections/SegmentConnectorZoom`, next to `Connections/Orthogonal`. Story id
  `connections-segmentconnectorzoom--default`.
- Structure follows `ZoomAndFit.stories.ts`: `createGraphContainer(args)` for the main graph, controls built with
  `DomHelpers.button`, `globalTypes` / `globalValues` from `shared/args.js`, a short HTML description at the top
  (pattern: `createMainDiv(htmlDescription)` in `shared/configure.js`) explaining what to look at and linking #1051.
- Three cases, defined once in a data table and reused by both parts of the story:
  - **issue description**: source `(870, 430, 310, 70)`, target `(450, 250, 410, 80)`, waypoints `(1025, 390)` and
    `(655, 390)`;
  - **comment of 2026-10-26**: source `(500, 500, 200, 200)`, target `(900, 900, 100, 100)`, waypoints `(800, 650)` and
    `(950, 800)`;
  - **bend on a terminal border**: source `(130, 550, 180, 110)`, target `(560, 420, 130, 160)`, waypoints `(600, 600)`
    and `(540, 420)`; the bend `(600, 420)` lies on the top border of the target.
  - All with floating ends (no `exitX`/`entryX`) and `edgeStyle: 'segmentEdgeStyle'`, inserted with the object form of
    `insertVertex` / `insertEdge`, no explicit parent.
- **Part 1, fixed grid**: one row per case, one column per scale: `1` (reference), `0.75`, `0.8`, `1.12`, `1.2 ** 4`
  (four `zoomIn`), `1.2 ** -4` (four `zoomOut`), `0.15`, `0.1`.
  - One small `Graph` per cell, in its own fixed-size container with hidden overflow, non-interactive
    (`setEnabled(false)`), built **without plugins** (`new Graph(container, undefined, [])`): the registries of `Graph`
    still render the same shapes, edge styles and perimeters, but the 24 cells do not each carry the default plugins
    and their `document` listeners. Only the slider graph of part 2 keeps the default plugins.
  - Bring the diagram into the cell with `view.scaleAndTranslate`, using an **integer translate**, so that the cells
    show the scale effect only and not the fractional-translate rounding of #1322.
  - Under each cell, a caption with the scale, the number of points of the edge (`state.absolutePoints.length`) and the
    number at scale 1, in red when they differ. That makes the bug readable on a screenshot without interaction, and
    turns green everywhere above 0.15 once the fix is in.
  - The `0.15` and `0.1` columns are labelled as the known limit, pointing at #1322, so that a red cell there is not
    read as a remaining case of #1051.
- **Part 2, zoom slider**: one interactive graph holding the three cases side by side (offset in model coordinates so
  that they do not overlap), with an in-page `<input type="range">` from 0.05 to 3 by 0.01 driving `view.setScale`,
  plus `Zoom In`, `Zoom Out` and `Zoom Actual` buttons. A live line shows the current scale and, for each case, the
  current point count against the scale 1 count, same colour code as the grid. Keep the graph editable so that the
  waypoints can be moved to explore other routes.
- Consider: the grid builds 24 graphs (3 cases x 8 scales, one view per scale); keep each container small (about
  220 x 160 px). Measure the render time once in headless Chromium (`performance.now()` around the construction,
  target about 200 ms) and check that the slider stays smooth. Known and accepted: Storybook re-runs the template on an
  arg change without destroying the previous graphs, like every other story. No `KeyHandler` is needed, the story does not move or connect cells interactively beyond what
  `Graph` provides.

### `packages/core/__tests__/view/style/edge/Segment.test.ts` (new, commit 3)

- License header as in `edge-style-routing.test.ts` (2026-present).
- Graphs through `createGraphWithoutContainer()` only, built inside each test, never at module scope.
- A helper building the case (source, target, waypoints, edge style) and returning the absolute points of the edge
  state at a given scale, brought back to scale 1 and rounded to 0.1, terminal points included. Reuse the shape of
  `computeAbsolutePoints` in `edge-style-routing.test.ts:27-43`, with `view.setScale(scale)` before reading. Same
  helper serves every `describe`, no duplication.
- A comparison helper asserting the same number of points and each coordinate within 1 unit of the scale 1 route.
- `describe('issue 1051 repros')`:
  - the scale 1 routes asserted exactly, as listed in the v2 analysis: `(1025,430) (1025,390) (655,390) (655,330)` for
    the description, `(700,650) (800,650) (800,800) (950,800) (950,900)` for the comment;
  - `test.each` over the two repros and the scales `0.5`, `0.69`, `0.75`, `0.8`, `0.84`, `0.87`, `1.11`, `1.12`, `1.15`,
    `1.2`, `1.5`, `2`: the route equals the scale 1 route. `0.69` to `0.87` and `1.11` to `1.15` are the failing ranges
    measured by v2, the others guard against regressions.
  - one case through `orthogonalEdgeStyle` and `manhattanEdgeStyle` on the description repro at `0.75`, to pin the
    fallback path.
- `describe('bend exactly on a terminal border')`: the third case, at `1.2 ** 4`, `1.2 ** -4`, `0.555`, `0.667`; the
  route equals the scale 1 route, which does not contain `(600, 420)`.
- `describe('short segment next to a bend inside the source')`: source `(150, 280, 100, 70)`, target
  `(430, 400, 170, 150)`, waypoints `(165, 350)` and `(155, 355)`; at scale `0.1` the bend `(165, 355)` is kept and the
  route equals the scale 1 route. Fixed by 14.7.3 even though the scale is below 0.15: the cleanup now runs before
  `pushPoint`.
- `describe('segments shorter than 1 pixel')`, characterization tests of the behaviour kept on purpose:
  - a configuration with two bends a few units apart, outside both terminals, chosen **empirically** during step 2 so
    that at scale `0.1` one of them is under the 1 pixel tolerance of `pushPoint`;
  - assert that the route at `0.1` has one bend less than at scale 1, and that the same route at `0.5` is complete;
  - a comment explaining why: `pushPoint` applies a tolerance of 1 pixel in view coordinates, so a segment shorter than
    `1 / scale` model units is dropped; invisible at that scale, and #1322 tracks moving the tolerance to model units.
  - These pass before and after the fix: they are not part of the red step.
- Consider: if a scale listed above does not fail on the current code, keep it as a regression guard, and say so in the
  commit body rather than removing it.

### `packages/core/src/view/style/edge/Segment.ts` (commit 3, then commit 4)

Commit 3, the port, nothing more:

- Add a local `tempPoints` array and an `addPoint` function next to `pushPoint`, with the draw.io comment "Adds
  translated unscaled points for precise collision checks".
- Replace the five `pushPoint` calls of the routing by `addPoint`: L210, L218, L237 (the `pt.clone()` in the hints
  loop, the clone stays since `pt` keeps being mutated), L264, L272.
- Rewrite the two cleanups (L277-297) on `tempPoints`: the source one removes from index 0 (not 1: `tempPoints` holds
  only the bends, while `result[0]` is the start point), the target one from the last index; same conditions
  `pts[0] == null && source != null` and `pts[lastInx] == null && target != null`, against `source` and `target`, the
  unscaled terminals.
- After the cleanups, push every element of `tempPoints` through `pushPoint`, with a `for...of` loop, before the
  "removes last point if inside tolerance with end point" block, which stays unchanged.
- Do not port the `innerLoopWaypoints` guard (draw.io 30.2.7, a self-loop feature).
- Keep the existing `== null` checks as they are, the change is a port, not a cleanup of the function.

Commit 4, refactor and comment:

- A comment on `pushPoint` (L66) stating that its tolerance is 1 pixel in view coordinates, so that below a scale of
  about 0.15 a segment of a few model units is dropped, on purpose since it cannot be seen, and that #1322 tracks
  moving it to model units. Mention the asymmetry (`1` on x, `Math.max(1, scale)` on y) inherited from mxGraph.
- Optional: extract the two "remove bends inside the terminal" loops into a local function only if it reads better
  than the two loops; otherwise, no refactor, and commit 4 is just the comment, as `docs(...)` or `refactor(...)`
  depending on its content.

### `packages/core/__tests__/view/style/edge/edge-style-routing.test.ts`

- No change. Its `segmentEdgeStyle` case at scale 1 must still pass, which is the check that the port does not change
  routes at scale 1.

### `.claude/tasks/01-fix-segment-connector-scale/`

- `implementation.md` written during the code phase, committed with the work.
- Removed by the last commit of the branch.

## Testing Strategy

- **Red** (step 2): write `Segment.test.ts`, run `npm test -w packages/core -- __tests__/view/style/edge/Segment.test.ts`
  on the current code and record which tests fail in `implementation.md`. Expected failures: the repros in their
  failing ranges, the border case, likely the short segment case. Do not commit the red state on its own: the green
  commit carries the tests and the fix together.
- **Green** (step 3): the same file passes, plus `edge-style-routing.test.ts`, `EdgeStyleRegistry.test.ts` and the full
  `packages/core` suite.
- **Before the PR**: the CI validation list of `CLAUDE.md`, delegated to the `build-runner` agent: core build,
  `test-check`, tests with coverage, `npm run build -w packages/html` (the story), circular dependencies, lint. Warn the
  user before the heavy runs.
- **Visual**: the user checks the story before the fix (commit 1, red captions in the grid) and after (green captions
  everywhere above 0.15). Screenshots of both states through headless Chromium, see the `reference_headless_story_testing`
  memory, attached to the PR description.

## Documentation

- No CHANGELOG entry: a plain fix, routes only change where they were wrong. Revisit if the review shows a route
  changing at a scale where it was right.
- No website page change. The story is linked from the PR description.
- The code comment of commit 4 documents the sub-pixel limit and points at #1322.

## Rollout Considerations

- No API change, no breaking change. `SegmentConnector` keeps its signature.
- Users who copied the workaround of the comment of 2026-10-26 (a custom edge style running `SegmentConnector` at scale
  1) can drop it; worth one sentence in the PR description, not in the CHANGELOG.
- After merge: comment on #1051 with the link to the PR and the story; the milestone of #1051 is the first release
  containing the PR.
