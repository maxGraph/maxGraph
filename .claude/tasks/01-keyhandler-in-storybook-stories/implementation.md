# Implementation: make KeyHandler work in all Storybook stories (issue #910)

## Changes

- `packages/html/stories/shared/configure.js`: `createGraphContainer(args, options)` with the opt-in
  `captureKeystrokes` (tabindex + focus on click unless the focus is already inside the container).
- OrgChart and Validation: their copies of the workaround replaced by the option (Validation had the buggy version).
- Guides, Permissions: option only; Guides loses the useless initial `graph.container.focus()` and the TODO on 910.
- Editing, Indicators, Labels, Scrollbars, Tree, UserObject, Window: option, and the bare `KeyHandler` gets the
  explaining comment with the gestures of the story (table in `plan.md`).
- Toolbar, DynamicToolbar: option, `KeyHandler` restored with the comment and imported. Kept on purpose: both mxGraph
  examples create one ("Stops editing on enter or escape keypress", `var keyHandler = new mxKeyHandler(graph);`), see
  https://github.com/jgraph/mxgraph/blob/ff141aab158417bd866e2dfebd06c61d40773cd2/javascript/examples/toolbar.html#L99
  and https://github.com/jgraph/mxgraph/blob/ff141aab158417bd866e2dfebd06c61d40773cd2/javascript/examples/dynamictoolbar.html#L85

## Checks

- eslint and prettier on the changed files: OK. `tsc --noEmit -p packages/html`: OK.
- Headless Chromium (playwright-core) driving the full Storybook UI (manager + preview iframe), port 8911:
  - all 13 stories: a click on a blank part of the graph focuses the container, and the Escape keydown targets a node
    inside `graph.container` (OrgChart checked separately: the first blank point found was on its toolbar overlay);
  - move cancelled by Escape, with a control drag without Escape that does move: Editing, Labels, Scrollbars, Tree,
    UserObject, Window. The other stories have no conclusive probe (the shape picked did not move in the control);
  - label editor keeps the focus twice in a row, after a click inside the editor: Guides, Permissions, Validation,
    Editing, Tree, UserObject (over two runs); no page error.

## Limits of the headless check

- It does not reproduce the original failure: on `main`, Editing also cancels the move on Escape headless, because the
  keydown targets the iframe `BODY`, which `KeyHandler.isGraphEvent` accepts (`source.parentNode === target`). The
  only difference measured is the keydown target (graph container on the branch, `BODY` on `main`).
- The Validation "label edited once" bug did not reproduce headless either on `main`.
- So the manual validation in a real browser by the maintainer remains the reference.
