# Plan: fix the no-useless-assignment violations and enable the rule

Issue: https://github.com/maxGraph/maxGraph/issues/1240 (Task, milestone 0.25.1)

## Starting point

- `eslint.config.mjs:66` sets `'no-useless-assignment': 'off'` with a TODO.
- 66 violations measured on 2026-10-12 (main at `d9670dfbc`), same list as the issue:
  `npx eslint "**/*.ts" --rule '{"no-useless-assignment":"error"}'` from the repository root.
- Expected outcome: no behavior change, then the `'off'` entry and its TODO removed.

## A real bug found, out of scope

`packages/core/src/view/mixin/EditingMixin.ts:70`, `startEditingAtCell`.

mxGraph (`mxGraph.prototype.startEditingAtCell`) has two consecutive `if`: fall back to the selection cell when no
cell is given (nulled when not editable), then start editing when the cell is not null. The maxGraph port turned the
second `if` into an `else`, so the fallback cell is computed and never used: `graph.startEditing(evt)` (line 61, which
calls `startEditingAtCell(null, evt)`) and `startEditingAtCell()` without a cell do nothing.

Introduced by accident in
https://github.com/maxGraph/maxGraph/commit/bc400a3ae34144915126f4b0d8a93c13789e67dd (2021-08-01, "Converted Graph*
classes into mixins", 40 files, first released in v0.1.0, no PR). The previous commit still had the two `if`. Signs of
an accident: the commit is a mechanical conversion that announces no behavior change, it kept the `cell = null`
branch that the `else` makes pointless, and the JSDoc of `startEditing` ("using the given cell or the first selection
cell") and the `graph.startEditing()` example in `CellEditorHandler.ts:126` still describe the mxGraph behavior.

Impact: only calls without a cell are affected, `graph.startEditing(evt)` and `startEditingAtCell(null)`. They are
silent no-ops: no editor, no `START_EDITING` nor `EDITING_STARTED` event, no error. Calls with a cell work, and they
are the only ones maxGraph makes itself (double click in `EventsMixin.ts:329`, the `edit` action of `Editor`). So
the users hit are applications using the public API to edit the selection, for instance on a key press as the
JSDoc example of `CellEditorHandler` shows, typically when migrating from mxGraph. No reported issue matches it:
searched all issues on 2026-10-12 (edit, editing, startEditing, F2, label edit, cell editor, keyboard), the closest
ones (#228, #544, #910) have other causes.

Decided: fixing it changes behavior, so it does not belong in #1240. It gets a dedicated PR, done right after the
ESLint PR, fixed test-first (tdd-gh-issue). In the ESLint PR, this violation stays, silenced by a targeted
`eslint-disable-next-line no-useless-assignment` comment saying the assignment is dead because of the bug. The bug PR
restores the two `if` of mxGraph and removes that comment, since the assignment is then read again.

## Fix patterns

| Pattern | Count | Fix |
|---|---|---|
| `let x = 0` / `let x = null` overwritten in every branch before any read | ~50 | `let x: number;` or `let x: T \| null;`, letting TypeScript's definite assignment analysis check every branch. Use `const` when there is a single assignment. |
| Initial value immediately replaced (`HexagonPerimeter.ts:51`) | 1 | Declare without the value |
| Dead statement, value never read | ~13 | Remove it |

Dead statements, all present as is in mxGraph, so their removal is behavior neutral:

- `view/handler/VertexHandler.ts:280`: last `i++` becomes `i`.
- `view/handler/VertexHandler.ts:1162-1163`: `off` copy never read, remove the variable.
- `view/handler/VertexHandler.ts:1667-1668`: `right` and `bottom` updates never read.
- `view/layout/CompactTreeLayout.ts:966`: `child = node.child`.
- `view/mixin/EventsMixin.ts:788`: `sender = sender ?? this` (parameter unused afterwards).
- `view/other/PrintPreview.ts:749`: `div = null` before the rethrow.
- `view/shape/stencil/StencilShape.ts:742`: `disableShadow = false`.
- `view/style/edge/Orthogonal.ts:445`: last `preferredOrderSet = true`.
- `view/style/perimeter/TrianglePerimeter.ts:136-137`: `dx` and `dy` "compute angle" lines.

Trap: if TypeScript reports "used before being assigned" where ESLint sees no read, do not restore the initial value.
Restructure (ternary, early return, exhaustive branch) and explain it in the commit body.

## Pull request

Decided: a single PR, `Closes #1240`. Labels only, no milestone on the PR. One commit per group keeps the review
manageable:

1. `util/`, `serialization/`, `editor/`, `gui/`, `packages/html/stories/Wires.stories.ts`: 13 violations, all
   declarations.
2. `view/` outside layout and style: `GraphView.ts`, `cell/`, `handler/`, `mixin/EventsMixin.ts`, `other/`,
   `plugin/`, `shape/`: 21 violations, most of the dead statements. `mixin/EditingMixin.ts` only gets the
   `eslint-disable-next-line` comment, see the bug section above.
3. `view/layout/`: 18 violations, algorithms, careful review.
4. `view/style/`: 14 violations.
5. Removal of the `'off'` entry and its TODO in `eslint.config.mjs`.

## Verification, per commit

- Rule forced on for the touched folders reports nothing:
  `npx eslint "<folders>" --rule '{"no-useless-assignment":"error"}'`.
- `npm run test-check -w packages/core` (type checking, catches definite assignment errors).
- `npm test -w packages/core`.
- `npm run lint`.
- Last commit: `npm run lint` with the rule enabled through the config, no override.

No CHANGELOG entry: nothing changes for users.

## Progress

- [x] Commit 1, util and serialization
- [x] Commit 2, view outside layout and style
- [x] Commit 3, layout
- [x] Commit 4, style
- [x] Commit 5, rule enabled
- [ ] Task files removed in the last commit of the branch
- [ ] Then: dedicated PR fixing `startEditingAtCell`, removing the `eslint-disable-next-line` comment
