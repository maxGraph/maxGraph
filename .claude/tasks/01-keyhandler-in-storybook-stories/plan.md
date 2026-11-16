# Implementation Plan: make KeyHandler work in all Storybook stories (issue #910)

## Overview

Provide the Storybook focus workaround once, as an opt-in `captureKeystrokes` option of the shared
`createGraphContainer(args, options)`, then enable it in every story creating a `KeyHandler`. The two existing copies
(OrgChart, correct; Validation, buggy since it steals the focus from the label editor) are replaced by the option.
Bare `KeyHandler` instances are kept, and their misleading comments are replaced by one explaining that they are what
calls `graph.escape()`, naming the gestures the story allows.

No change in `packages/core`. No automated test: stories are not tested, the verification is done in the running
Storybook (headless Chromium driven by playwright-core), then by hand by the maintainer.

## Dependencies

1. Create the branch `fix/keyhandler-in-storybook-stories` from `main` (`14b5f2758`).
2. `configure.js` first: every story change depends on the option.

## Gestures cancelled by Escape, per story (checked in the sources)

Escape cancels, through `InternalEvent.ESCAPE`: a move (`SelectionHandler`), a connection (`ConnectionHandler`), a
resize (`VertexHandler`), a bend or reconnection (`EdgeHandler`). Resize and bend need a selected cell (the handlers
exist for the selection only), a move does not (`SelectionHandler.mouseDown` starts on an unselected movable cell).

| Story | Wording in the comment | Why |
|---|---|---|
| DynamicToolbar, Toolbar, Indicators | a move, a resize, a connection or a bend | defaults, `setConnectable(true)`, edges created by connecting |
| Scrollbars | a move, a resize, a connection or a bend | `setConnectable(true)`, one edge; only editing is disabled |
| Editing | a move or a resize | not connectable, no edge |
| Labels | a move, a resize or a bend | one edge, not connectable |
| Window | a move, a resize or a bend | one edge, not connectable |
| UserObject | a move or a bend | `setCellsResizable(false)`, one edge |
| Tree | a move | `setCellsSelectable(false)`: no resize or bend handle, unselected cells can still be moved |
| OrgChart | unchanged ("a resize") | already written in PR 532 |

## File Changes

### `packages/html/stories/shared/configure.js`
- Add an optional second parameter `options` to `createGraphContainer`, with a single boolean property
  `captureKeystrokes` (default false: the 69 other callers are unchanged).
- When true: set `tabindex="0"` on the container and add the click listener focusing the container only when
  `document.activeElement` is not inside it (code moved from `OrgChart.stories.ts:189-195`).
- Move the explanation there: JSDoc of the property says Storybook captures the keystrokes while the focus is outside
  the story, so `KeyHandler` only receives them once the container has the focus; the inline comment keeps the
  "Keep the focus on the label editor, which is inside the container" note.
- JSDoc: `@param [options] {{captureKeystrokes?: boolean}}` so the TS stories (`allowJs`, strict) type-check the call.

### `packages/html/stories/OrgChart.stories.ts`
- Replace lines 187-195 (comment, listener, `tabindex`) by `createGraphContainer(args, { captureKeystrokes: true })`.
- Keep the KeyHandler comment (`:259-261`) as is.

### `packages/html/stories/Validation.stories.ts`
- Replace lines 63-66 (focus on every click, `tabindex`) by the option. Fixes the label edited only once.

### `packages/html/stories/Guides.stories.ts`
- Use the option.
- Remove the useless initial `graph.container.focus()` and its comment (`:141-142`): the container is not in the DOM yet.
- Remove the TODO about issue 910 (`:144-145`), keep "Handles keystroke events".

### `packages/html/stories/Permissions.stories.js`
- Use the option. The `KeyHandler` with its Delete binding is unchanged.

### `packages/html/stories/Editing.stories.js`, `Indicators.stories.js`, `Labels.stories.js`, `Scrollbars.stories.js`, `Tree.stories.js`, `UserObject.stories.ts`, `Window.stories.ts`
- Use the option.
- Replace the comment of the bare `new KeyHandler(graph)` (add one where there is none) by the OrgChart wording with
  the gestures of the table. Turn `const keyHandler = new KeyHandler(graph);` into `new KeyHandler(graph);` where the
  variable is unused (Editing, Tree).
- Window: the comment "Adds rubberband selection and keystrokes" at `:82` describes the tooltips and panning lines; keep
  it about those only ("Enables tooltips and panning").

### `packages/html/stories/Toolbar.stories.ts`, `DynamicToolbar.stories.ts`
- Use the option, uncomment the `KeyHandler` as a bare `new KeyHandler(graph);` with the explaining comment, import
  `KeyHandler` from `@maxgraph/core`.

## Testing Strategy

- `npm run lint` scoped to the changed files (eslint) and `tsc --noEmit -p packages/html` (or `npm run build -w
  packages/html`) for the TS typing of the new parameter.
- Headless check in Storybook on a free port (not 8901): for each modified story, click in the graph, start a drag of a
  vertex, press Escape, release, and check that the vertex did not move; then double-click a label twice in a row and
  check that the editor keeps the focus (typing changes the label both times) where editing is enabled. Guides: arrow
  key moves the selected vertex. Validation and Permissions: Delete removes the selection.
- Maintainer validates by hand before any push.

## Documentation

None: the stories are the documentation; the JSDoc of the option explains the workaround.

## Rollout Considerations

- Stories only, nothing published. No CHANGELOG entry.
- Out of scope: listener leak (#1325), plugin (#1323), keyCode-free handler (#1317).
- Commits: task files; `fix(stories)` for the option and its use. No push.
