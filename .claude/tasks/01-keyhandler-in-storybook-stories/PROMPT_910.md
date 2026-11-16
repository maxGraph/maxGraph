Implement issue #910 "KeyHandler does not work in Storybook stories" (https://github.com/maxGraph/maxGraph/issues/910). Read the issue body first: its task list per story and its "Tasks" section are the reference, and were updated on 2026-11-16.

## Context and facts already established

- `new KeyHandler(graph)` without any key binding is NOT useless. Its constructor adds a `keydown` listener on `document.documentElement`, and on Escape (when not editing) it calls `graph.escape(evt)`, which fires `InternalEvent.ESCAPE`. KeyHandler is the only caller of `graph.escape` in core. The listeners of that event cancel the gesture in progress: SelectionHandler (move), ConnectionHandler (connection), VertexHandler (resize), EdgeHandler (bend, reconnect). Escape during label editing is handled by CellEditorHandler itself, without KeyHandler. So the existing story comments such as "Stops editing on enter or escape keypress" are wrong about what it does, not about it doing something.
- In Storybook, the keystrokes are captured by Storybook unless the focus is inside the story. The workaround is `tabindex="0"` on the graph container and focusing it on click.
- Focusing the container on EVERY click breaks the label editing: the editor is a contentEditable element appended inside `graph.container` (see CellEditorHandler), so the click moves the focus back to the container and a label can only be edited the first time. The fixed version, used in `packages/html/stories/OrgChart.stories.ts` (merged with #532):

```ts
container.addEventListener('click', () => {
  // Keep the focus on the label editor, which is inside the container
  if (!container.contains(document.activeElement)) {
    container.focus();
  }
});
container.setAttribute('tabindex', '0');
```

- `packages/html/stories/Validation.stories.ts` still has the buggy version (`container.focus()` on every click). It is ticked in the issue task list, but must be migrated too.

## The plan (decided by the maintainer)

- Add an optional `options` parameter to the shared `createGraphContainer(args)` of `packages/html/stories/shared/configure.js`. One of its properties enables, on demand, the keystroke capture code above (the name of the property is to be decided now, propose a few).
- Replace the duplicated code in Validation and OrgChart with that option.
- Apply the option to every story listed in issue #910, keeping the bare `KeyHandler` and replacing its misleading comment with one explaining why this standalone instance is needed. Reference wording, from OrgChart:

```ts
// No key is bound, this instance is still needed: KeyHandler is what calls graph.escape() when Escape is pressed,
// which cancels a resize in progress. Escape during label editing is handled by the cell editor, without it.
new KeyHandler(graph);
```

  Adapt "a resize" to the gestures each story actually allows (move, connection, resize, bend).
- Toolbar.stories.ts and DynamicToolbar.stories.ts: restore the commented `KeyHandler` with the explaining comment.
- Stories creating a KeyHandler (2026-11-16): bare instance in Tree, Editing, Scrollbars, Indicators, UserObject, Labels, Window, OrgChart; with bindings in Guides, Validation, Permissions; commented out in Toolbar and DynamicToolbar. Re-check with `grep -n KeyHandler packages/html/stories/*`.

## Point to consider in the design

- Listener leak, out of scope: `new KeyHandler(graph)` adds a `keydown` listener on `document.documentElement` that no story removes, so each visit of a story may leave one more listener. This leak, and the same one for the graphs and the other objects created by the stories, is tracked in issue #1325 (https://github.com/maxGraph/maxGraph/issues/1325) and is NOT the subject of the #910 fix. Do not handle it here.
- Out of scope: managing the key handling as a graph plugin is issue #1323, and a keyCode-free handler is issue #1317. Do not implement them here.

## Verification

- Check in the running Storybook (`npm run dev -w packages/html`, with core built) that, in each modified story, Escape cancels a move or resize in progress after clicking in the graph, and that a label can be edited several times in a row.
- Headless option when no browser tool is available: playwright-core in the scratchpad driving the cached Chromium under `~/.cache/ms-playwright/` (match the playwright-core version to the Chromium revision). Port 8901 may be used by another worktree, use another port.
- The maintainer validates the stories by hand before any push.
