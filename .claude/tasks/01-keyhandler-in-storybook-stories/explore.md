# Task: make KeyHandler work in all Storybook stories (issue #910)

Source of the request: the body of issue #910 (its "Tasks" section, updated on 2026-11-16) and the maintainer's prompt
for this task. Everything below comes from reading the sources directly, no subagent was used.

## Codebase Context

### Why the keys do not reach KeyHandler in Storybook

- `new KeyHandler(graph)` listens to `keydown` on `document.documentElement` when no target is given
  (`packages/core/src/view/handler/KeyHandler.ts:77-80`).
- `keyDown` (`KeyHandler.ts:255`) only handles an event accepted by `isEnabledForEvent` (`KeyHandler.ts:285`), which
  requires `isGraphEvent` (`KeyHandler.ts:229`): the source is the target, a direct child of it, the cell editor, or a
  node inside `graph.container`.
- Escape (`keyCode === 27`) calls `escape` -> `graph.escape(evt)` (`KeyHandler.ts:258-259`, `310-312`), even while
  editing; the other keys are skipped while editing (`isEventIgnored`, `KeyHandler.ts:299`).
- In Storybook, the keystrokes are captured by Storybook unless the focus is inside the story. Established workaround:
  make the graph container focusable (`tabindex="0"`) and focus it on click.

### Why focusing on every click breaks label editing

The cell editor is a contentEditable element appended inside `graph.container`
(`packages/core/src/view/plugin/CellEditorHandler.ts:289` and `:762`). A click handler that always calls
`container.focus()` steals the focus from the editor, so a label can be edited only the first time. The fix is to focus
the container only when `document.activeElement` is not already inside it.

### Shared helper to extend

`packages/html/stories/shared/configure.js:27` - `createGraphContainer(args)` creates the `div` (size from `args`,
grid background). Plain JS with JSDoc (`@param args {Record<string, string>}`, `@return {HTMLDivElement}`). It is
imported by 82 story files, TS ones included: `packages/html/tsconfig.json` has `allowJs: true` and `strict: true`, so
the JSDoc of a new `options` parameter is what types it for the TS stories. It must stay optional so the other 69+
callers are untouched.

### Existing copies of the workaround

- `packages/html/stories/OrgChart.stories.ts:183-195`: the correct version (focus only if the focus is outside the
  container), with a two-line comment explaining why (Storybook captures the keystrokes). KeyHandler comment at
  `:259-261` is the reference wording.
- `packages/html/stories/Validation.stories.ts:62-66`: buggy version, `container.focus()` on every click.

### Stories creating a KeyHandler (grep on 2026-11-16, matches the issue list)

| Story | Container creation | KeyHandler | Current comment | Gestures cancellable by Escape |
|---|---|---|---|---|
| `DynamicToolbar.stories.ts` | `:79` | commented, `:102-103` | "Stops editing on enter or escape keypress (TODO not working...)" | move, resize, bend, connection (`setConnectable(true)` `:99`) |
| `Editing.stories.js` | `:46` | bare, `:134-135` | "Adds handling of return and escape keystrokes for editing" | move, resize (no connection: not connectable) |
| `Guides.stories.ts` | `:62` | with arrow bindings, `:147-154` | TODO about issue 910 at `:144-146`, plus a useless `graph.container.focus()` at `:141-142` (container not focusable, not even in the DOM yet) | move, resize, bend, connection |
| `Indicators.stories.js` | `:33` | bare, `:38` | none | move, resize, bend, connection (`:37`) |
| `Labels.stories.js` | `:48` | bare, `:58` | none | move (cells and labels), resize, bend |
| `OrgChart.stories.ts` | `:183` | bare, `:259-261` | already fixed | resize (`setCellsMovable(false)` `:243`) |
| `Permissions.stories.js` | `:51` | with Delete binding, `:72-80` | "Enables rubberband selection and key handling" | depends on the permission: move, resize, bend, connection |
| `Scrollbars.stories.js` | `:114` | bare, `:531-532` | "Enables key handling (eg. escape)" | move, resize, connection (`:515`) |
| `Toolbar.stories.ts` | `:86` | commented, `:126-127` | same as DynamicToolbar | move, resize, bend, connection (`:123`) |
| `Tree.stories.js` | `:48` | bare, `:206-207` | "Stops editing on enter or escape keypress" | move, resize, bend |
| `UserObject.stories.ts` | `:67` | bare, `:107-108` | "Stops editing on enter key, handles escape" | move, bend (`setCellsResizable(false)` `:100`) |
| `Validation.stories.ts` | `:62` | with Delete binding, `:131` | none | move, resize, bend, connection (`:80`) |
| `Window.stories.ts` | `:57` | bare, `:86` | "Adds rubberband selection and keystrokes" (`:82`, describes tooltips and panning lines) | move, resize, bend |

Gestures assume the `Graph` defaults (movable, resizable, bendable on, connectable off) unless a story line says
otherwise. The plan step must double-check each one before writing the comment, in particular Labels (`isCellResizable`
override for relative cells), Scrollbars (custom `SelectionHandler`, `isCellConnectable` override `:431`) and
Tree (layout may reposition moved cells).

Notes per story:
- Window: the container is placed inside a `MaxWindow` (`:61-70`), not in the story `div`. A click listener on the
  container still works since the editor and the cells are inside it.
- UserObject: `graph.container.focus()` at `:241-242` ("Forces focusout in IE") is unrelated, leave it.
- Toolbar and DynamicToolbar: `KeyHandler` is not imported today, the import must be added.

## Documentation Insights

- No library documentation needed: the behaviour comes from maxGraph's own `KeyHandler` and the DOM focus model
  (`tabindex="0"` makes a `div` focusable, `Node.contains` includes the node itself).
- Issue #910 body (2026-11-16) is the reference for the expected result per story.

## Research Findings

No web research: the root cause and workaround are already established and validated by the maintainer in the
OrgChart story (merged with PR #532).

## Key Files

- `packages/html/stories/shared/configure.js:23-37` - `createGraphContainer`, to receive the optional `options`
- `packages/html/stories/OrgChart.stories.ts:187-195` - code and comment to move into the helper
- `packages/html/stories/Validation.stories.ts:63-66` - buggy copy to replace
- the 13 stories of the table above
- `packages/core/src/view/handler/KeyHandler.ts:77`, `:229`, `:255`, `:310` - behaviour referenced in the comments
- `packages/core/src/view/plugin/CellEditorHandler.ts:762` - why the editor focus must be preserved

## Patterns to Follow

- Comment on the bare instance, adapted per story from OrgChart:
  ```ts
  // No key is bound, this instance is still needed: KeyHandler is what calls graph.escape() when Escape is pressed,
  // which cancels a resize in progress. Escape during label editing is handled by the cell editor, without it.
  new KeyHandler(graph);
  ```
- Stories with bindings (Guides, Validation, Permissions) do not need that comment, only the container option.
- Story conventions: `insertVertex`/`insertEdge` object form only for code written or modified (not a reason to touch
  untouched call sites).
- No em/en dash in code or comments.
- Commits: `fix(stories): ...` or `refactor(stories): ...`, scope used by the last commit on `main` (`14b5f2758`).

## Candidate names for the option

Decided by the maintainer: **`captureKeystrokes`**, used as `createGraphContainer(args, { captureKeystrokes: true })`.

Candidates that were proposed:
- `focusOnClick`: says literally what the code does.
- `captureKeystrokes` (chosen): says why it is needed (what the story gets).
- `keyboardFocusable`: describes the resulting state of the container.
- `enableKeyHandling`: ties it to KeyHandler, but suggests it creates one.

## Dependencies

- Core must be built for Storybook (`npm run build -w packages/core`), then `npm run dev -w packages/html` on a port
  other than 8901.
- Headless check: playwright-core in the scratchpad with the cached Chromium under `~/.cache/ms-playwright/`
  (see the `reference_headless_story_testing` memory).
- Work must happen on a new branch: the working copy is currently on `main`.

## Out of scope

- Listener leak of `KeyHandler` on `document.documentElement` and of other story objects: issue #1325.
- Key handling as a graph plugin: issue #1323. keyCode-free handler: issue #1317.
