# Implementation: fix issue #1051, SegmentConnector drops bends at some zoom scales

## Completed

### Commit 1, story `Connections/SegmentConnectorZoom`

- Grid of 3 cases x 8 scales, one graph per cell without plugins, shrunk with a CSS transform; slider and zoom buttons
  on 3 interactive graphs.
- Before the fix, 10 cells of 24 differ from scale 1. Slider and buttons checked in headless Chromium, about 5 ms per
  scale change, no page error.

### Step 2, red: `packages/core/__tests__/view/style/edge/Segment.test.ts`

36 tests on the current code: 17 fail, 19 pass.

| Group | Failing on the current code |
|---|---|
| issue description | 0.69, 0.75, 0.8, 0.84, 1.11, 1.12, 1.15 |
| issue comment | 0.8, 0.84, 0.87 |
| fallback styles at 0.75 | `orthogonalEdgeStyle`, `manhattanEdgeStyle` |
| bend on the target border | `1.2 ** 4`, `1.2 ** -4`, 0.555, 0.667 |
| short segment next to a bend inside the source | scale 0.1 |

Passing as expected: the scale 1 routes, the regression guards (0.5, 0.87 for the description, 0.69 to 0.75 for the
comment, 1.11 to 2), and the two characterization tests of the sub-pixel limit.

### Step 3, green: `packages/core/src/view/style/edge/Segment.ts`

- Draw.io 14.7.3 port: `tempPoints` / `addPoint`, the five routing `pushPoint` calls become `addPoint`, both cleanups
  run on `tempPoints` against the unscaled terminals, then every remaining bend goes through `pushPoint`. No
  `innerLoopWaypoints` guard.
- The 36 tests of `Segment.test.ts` pass, as do the existing `edge-style-routing.test.ts` routes at scale 1.
- Story after the fix: 24 cells of 24 identical to scale 1, the border case at 0.15 and 0.1 included.

### Step 4, refactor: comment only

- A comment on `pushPoint` explains the tolerance in view pixels, its x/y asymmetry inherited from mxGraph, and links
  #1322. The two cleanup loops were not extracted: one works from the front, the other from the back, and a shared
  function would not read better.

### Step 5, review follow-up: tests

- A review of the branch found the source cleanup guarded by the scale 0.1 test only. Added a bend on the source
  border, twin of the target case, at scale 1 and at 5 scales; with the source cleanup disabled, the scale 1 test
  fails. The border cases now run at 0.75 too.
- `expectSameRoute` tolerance lowered from 1 to 0.2, 1 kept only for the scale 0.1 case. The comment on the scales
  gives the failing range of each case, and the scale 0.1 characterization test says it changes with #1322.
- 43 tests: all pass on the branch, 23 fail on the old code (the 10 border ones included).

### Screenshots: what draw.io 14.7.3 fixes beyond the patch of the issue

`screenshots/` holds the "Bend on the target border" row of the story grid, the case the patch proposed on the issue
(comparing with `sourceScaled`/`targetScaled`, draw.io 14.4.8) does not fix:

- `border-1-main.png`: the code of `main`, 6 cells of 8 differ from scale 1;
- `border-2-issue-patch.png`: the patch of the issue, still wrong at 1.12, 2.07 (4 zoom in) and 0.48 (4 zoom out): the
  bend on the border is kept and the edge crosses the target up to its far border;
- `border-3-fix.png`: this branch, every cell matches scale 1.

Each was taken in headless Chromium after replacing the built `Segment.js` of `packages/core/lib/esm` by the variant.
With the patch, the unit tests fail on the border cases and on the short segment at scale 0.1, which the story does not
show, and pass on both repros of the issue.

## Deviations from Plan

- Story: the view translate stays at 0 and each graph container is offset in a viewport, instead of an integer
  translate. The translate takes part in the route computation (the cleanup compares `(model + translate) * scale` with
  `model + translate`), so any translate moves the scales where the bug shows. Scrolling the container was tried and
  showed nothing, the SVG not covering the scrolled area.
- Story: no orange colour below 0.15. In the border case the cells at 0.15 and 0.1 are the #1051 bug, not the sub-pixel
  limit, so the colour would have been misleading. The description says a red cell there may come from #1322.
- Sub-pixel tests: the configuration is placed far from the origin (source at `(1000, 1000)`). Near the origin, at
  scale 0.1, the scaled bends fall inside the unscaled bounds of the source and the #1051 bug removes them all, which
  hides the tolerance effect. Two bends 5 units apart: kept at 0.5, dropped at 0.1.

## Test Results

- Story: eslint, prettier and `tsc` of `packages/html` pass.
- Red step: as listed above.
- Green step: `npm test -w packages/core`, 101 suites and 785 tests pass; `npm run test-check -w packages/core` passes.
- CI validation list of `CLAUDE.md`, after the refactor commit: `npm run lint`, `check:circular-dependencies`,
  `check:npm-package`, `npm run build -w packages/html` and `./scripts/build-all-examples.bash` all pass. No size
  budget of the examples failed, so no budget to update.

## Follow-up Tasks

- See `before-merge.md`.
