# Implementation Plan: Extract the event names from InternalEvent into EventNames

## Overview

Move the 96 event-name constants of `InternalEvent` into a new exported `EventNames` object, as a hard break (no
deprecated aliases on `InternalEvent`). Names and string values are unchanged.

Decisions (2026-10-07, see `explore.md` for the evidence):

- **Typing:** the object is declared `as const`; an exported `EventNamesMap` interface is derived from its type, and
  users add their own names through module augmentation of that interface. No runtime freezing.
- **Naming:** object `EventNames`, interface `EventNamesMap`, union type `EventName`.
- **First guidance in the API:** `EventSource.addListener` takes the event name as
  `EventName | (string & Record<never, never>)`, written inline with no new named type, as `Editor.ts:762` does. Editors
  then suggest the known names while any string stays accepted, so nothing breaks. Only `addListener` and the `name`
  field of `EventListenerObject` change: `removeListener` takes only the function, and `EventObject`, `fireEvent` and
  `fireMouseEvent` keep `string`. Enforcing `EventName` (and module augmentation for custom names) is a later task.
- **Dead `MOUSE_UP` branch** in `EventsMixin.ts`: keep the behaviour strictly identical with a cast and a comment
  referring to issue #1228. No deletion here.
- **Small fixes included:** the RESUME/SAVE JSDoc errors, the "Event: mxEvent.X" JSDoc headings, `InternalEvent`
  misused as a type in `EditorToolbar.ts` and `MaxToolbar.ts`.
- **Out of scope:** the handle indexes and `PINCH_THRESHOLD` stay on `InternalEvent` (issue #1229);
  `nativeDblClickEnabled` (issue #1227); the direct eval (issue #1226).

## Change of decision (2026-10-07, after the implementation)

The documentation of custom event names through module augmentation is **dropped from this PR**:

- an added name has to be declared optional, otherwise the type check of `EventNames` fails when maxGraph is compiled
  with the application, so every use of the name in the API needs a non-null assertion (`EventNames.MY_EVENT!`), which
  is not acceptable for users;
- the alternative, asserting the initializer (`builtInEventNames as EventNamesMap`) to allow required names, was
  rejected: TypeScript would trust that the application assigned the name, and a forgotten assignment would only show at
  runtime, as a listener that never fires;
- as long as `addListener` accepts any string, the augmentation brings little; it will be designed and documented with
  the follow-up that makes the listener API take `EventName`.

What stays: `EventNamesMap` as an interface (to keep it open to augmentation), `EventName`, the loose `addListener`
signature, and the `ts-support` checks of the built-in names, of the union and of `addListener` (in
`packages/ts-support/src/event-names.ts`). What is removed: the guide section, the CHANGELOG sentence, the JSDoc
pointing to them, and the `ts-support` check of the augmentation (a later decision: testing it would present it as
supported; its replacement is part of #1230, noted in the issue). The sections below that describe them are kept for the record and marked
**dropped**.

Typing facts verified with tsc 5.9.3 in the scratchpad (not in the repository):

- An interface that extends the type of the `as const` object can be augmented from a consumer
  (`declare module '@maxgraph/core'`), built-in fields stay read-only (TS2540), typos are still caught.
- The union must be written as the indexed access of `Required<EventNamesMap>`: with a plain indexed access, a field
  added as optional brings `undefined` into the union.
- A field added as **required** breaks the library initializer when both are in the same compilation (TS2741), so the
  documentation tells users to declare their fields optional, as for `CellStateStyle`.
- The empty derived interface is rejected by the lint rule `@typescript-eslint/no-empty-object-type` (checked with
  eslint on stdin), so it needs a targeted disable comment with a reason.

## Dependencies

1. `EventNames.ts` first, since every other change imports it.
2. Core sources, then core tests, then `ts-support`, then stories, then docs and CHANGELOG.
3. Size budgets last, from the measured build.

Suggested commits (the branch will be squashed at merge anyway):

1. `refactor!: extract the event names from InternalEvent into EventNames`: new file, core sources, core tests,
   `ts-support`, stories, budgets, CHANGELOG, docs pages that reference the moved constants. One commit, so that every
   commit builds.
2. `docs: refer to EventNames in the event headings of the JSDoc`: the "Event: mxEvent.X" headings.
3. `refactor: type the toolbar DOM listeners with Event instead of InternalEvent`: the two misused types.

The RESUME/SAVE JSDoc fix goes in commit 1, since those JSDoc blocks are moved there.

## File Changes

### `packages/core/src/view/event/EventNames.ts` (new)

- Create the module with no import and no module-level side effect.
- Declare a non-exported `as const` object holding the 96 entries, in the current order of `InternalEvent.ts:532-1007`,
  with the same keys and values. Keep one JSDoc block per entry, as today (`Specifies the event name for <value>.`).
- Fix the two copy-paste errors while moving them: `RESUME` documents "resume" (was "suspend", `InternalEvent.ts:690`),
  `SAVE` documents "save" (was "open", `InternalEvent.ts:715`).
- Export the interface `EventNamesMap`, extending the type of that object. Add a JSDoc explaining that it exists to be
  augmented, with a short module augmentation example declaring an optional field and a pointer to the guide section.
  Add the eslint disable comment for `@typescript-eslint/no-empty-object-type` on that line, with a `--` reason, as
  `internal/utils.ts:26` does for `no-eval`.
- Export the const `EventNames`, explicitly typed `EventNamesMap`, initialized with the object. JSDoc: what it holds,
  that it replaces the former `InternalEvent` statics, that users may add their own names at runtime (JS) and declare
  them through `EventNamesMap` (TS), and `@since 0.26.0` (next minor, check the version in `packages/core/package.json`
  and the `@since` convention used elsewhere before writing it).
- Export the type `EventName`, the union of the values of `Required<EventNamesMap>`, with a JSDoc saying it includes the
  names added by augmentation and that the API still accepts any `string`.
- Consider: `@category Event`, as `InternalEvent` has (`InternalEvent.ts:66`).

### `packages/core/src/view/event/InternalEvent.ts`

- Remove the "Event names" section (banner at `:527` to `RESET` at `:1007`).
- Keep the 10 static methods, the 4 `*_HANDLE` statics and `PINCH_THRESHOLD`, unchanged.
- Import `EventNames` and use it in `redirectMouseEvents` (`:259, :269, :279`, `MOUSE_DOWN/MOVE/UP`).
- Update the JSDoc example at `:331` only if it refers to an event-name constant (it shows `mxEvent.addMouseWheelListener`,
  a method, so leave it).

### `packages/core/src/index.ts`

- Next to `export { default as InternalEvent } ...` (`:217`), export `EventNames` as a value and `EventName`,
  `EventNamesMap` as types (`export type`, as `:262` does).

### Core sources using the constants (59 files, 335 occurrences, about 75 of them in comments)

- Replace every `InternalEvent.<EVENT_NAME>` by `EventNames.<EVENT_NAME>`, code and comments (`{@link ...}` included).
  Only the 96 event names: `InternalEvent.<HANDLE>`, `InternalEvent.PINCH_THRESHOLD` and the methods are untouched.
- Add the `EventNames` import (with the `.js` extension), and remove the `InternalEvent` import where nothing else uses it.
- Tooling: start from `prototypes/event-names-proto/transform.mjs`, which did exactly this on the prototype (338
  references, 60 files, 23 imports removed), adapting it to the new file layout. Review the diff afterwards; do not commit
  the script output blindly.
- Consider: in files where `EventNames` only appears in JSDoc `{@link}`, check that lint and tsc accept the import (TS
  counts a JSDoc link as a use). If lint rejects it, keep the import and verify how other files handle link-only imports
  rather than dropping the link.
- Largest files: `view/mixin/EventsMixin.ts` (37), `view/handler/VertexHandler.ts`, `editor/Editor.ts`,
  `view/handler/EdgeHandler.ts`, `view/plugin/ConnectionHandler.ts`, `gui/MaxWindow.ts`.

### `packages/core/src/view/event/EventSource.ts`

- `addListener` (`:105`): type `name` as `EventName | (string & Record<never, never>)`, imported as a type from
  `EventNames.ts`. Same type for the `name` field of `EventListenerObject` (`:21-24`).
- Update the JSDoc of `addListener`: the known names are listed in `EventNames`, custom names are accepted, and point to
  the guide section on custom event names.
- Consider: the JSDoc says a listener with no name receives every event, and `fireEvent` checks `name === null`
  (`:153`), but the signature does not accept `null` and no caller passes it. Keep it as it is; changing that is not part
  of this task.
- Consider: all the classes extending `EventSource` (`AbstractGraph`, `GraphDataModel`, `GraphView`,
  `GraphSelectionModel`, `Editor`, `MaxToolbar`, `MaxPopupMenu`, `MaxWindow`) inherit the signature; none overrides
  `addListener`. Check that no caller passes a value that is not a string (tsc).

### `packages/core/src/view/mixin/EventsMixin.ts`

- At the dead `MOUSE_UP` check (`:614`, inside the `MOUSE_DOWN` branch of `:602`), cast `evtName` to `string` so the
  literal types do not reject the comparison (TS2367), keeping the behaviour identical.
- Add a one-line comment saying the branch can never run and pointing to issue #1228.

### `packages/core/src/view/mixin/*.type.ts`

- JSDoc `{@link InternalEvent.X}` and code examples: same replacement as the sources (covered by the scripted rewrite,
  listed here because these files are declarations only and easy to miss in review).

### JSDoc headings "Event: mxEvent.X" (commit 2)

- Replace `mxEvent.<EVENT_NAME>` by `EventNames.<EVENT_NAME>` in the event headings of: `editor/Editor.ts`,
  `gui/MaxWindow.ts`, `view/GraphDataModel.ts`, `view/GraphView.ts`, `view/undoable-change/UndoableEdit.ts`,
  `view/layout/LayoutManager.ts`, `view/mixin/EventsMixin.type.ts`, `view/plugin/ConnectionHandler.ts`,
  `view/plugin/CellEditorHandler.ts`, `view/animate/Morphing.ts`, `view/animate/Effects.ts`, `view/animate/Animation.ts`.
- Leave the `mxEvent.<method>` occurrences inside old code examples (`MaxWindow.ts:83`, `EditorToolbarCodec.ts:85-86`,
  `InternalEvent.ts:331`): they are not event names, and rewriting those examples is a different change.

### `packages/core/src/editor/EditorToolbar.ts` and `packages/core/src/gui/MaxToolbar.ts` (commit 3)

- `EditorToolbar.ts:448`: the `load` listener parameter is typed `InternalEvent` (the class instance type, which accepts
  anything); type it `Event`.
- `MaxToolbar.ts:235`: same for the `change` listener.
- Consider: `InternalEvent.addListener` takes `MouseEventListener | KeyboardEventListener`; a function taking `Event` is
  assignable to both. Confirm with tsc; if the `InternalEvent` import becomes unused, remove it.

### `packages/core/__tests__/`

- Update the 5 uses: `editor/Editor.test.ts:162`, `view/GraphSelectionModel.test.ts:43, 46`,
  `view/undoable-change/SelectionChange.test.ts:129, 142`. `view/handler/VertexHandler.test.ts:190` uses
  `ROTATION_HANDLE` and stays.
- No new jest test for the values themselves; they are checked once during the implementation (see Testing Strategy).

### `packages/ts-support/src/`

- Add an augmentation check next to `module-augmentation.ts` (same file, or a sibling following its comment style):
  augment `EventNamesMap` with an optional custom name, assign it at runtime, and check with `@ts-expect-error` that a
  built-in field cannot be reassigned, that an undeclared name is rejected, and that `EventName` accepts the custom value
  and rejects `undefined` and an unknown string. Also check that `addListener` accepts a built-in name, the custom name
  and an arbitrary string, and rejects a number (`@ts-expect-error`), so the loose type cannot silently become `any`.
- Pattern: `packages/ts-support/src/module-augmentation.ts:1-31`, including the comment explaining why a negative check
  is needed for the test to prove anything.

### `packages/html/stories/` (17 files, 28 occurrences)

- AutoLayout, DynamicLoading, DynamicToolbar, FileIO, GraphLayout, HtmlLabel, Manhattan, MenuStyle, Monitor, Morph,
  OffPage, OrgChart, Overlays, SwimLanes, UserObject, Validation, Wires.
- Replace `InternalEvent.<EVENT_NAME>` by `EventNames.<EVENT_NAME>`, add `EventNames` to the `@maxgraph/core` import,
  remove `InternalEvent` from it where it becomes unused (36 story files also call `InternalEvent` methods).
- Apply `.claude/rules/architecture/graph-api-usage.md` only to lines actually modified; do not convert unrelated
  positional `insertVertex` calls.

### Example packages and `packages/ts-support/src/index.ts`

- No source change: they only call `InternalEvent.disableContextMenu`.
- Size budgets: see Testing Strategy.

### `CHANGELOG.md`

- Under `## Unreleased` (`:8-10`), add a `**Breaking Changes**:` entry in the prose style of the 0.25.0 entries
  (`:20-21`):
  - the 96 event-name constants moved from `InternalEvent` to `EventNames`, same names and values; `InternalEvent` keeps
    the DOM helper methods, the handle indexes and `PINCH_THRESHOLD`;
  - migration: replace `InternalEvent.<NAME>` by `EventNames.<NAME>`, with a short before/after block;
  - **JavaScript users**: the old access returns `undefined` with no error, so a listener registered with it never
    fires; search the code for `InternalEvent\.[A-Z]` to find them all;
  - mention `EventNamesMap` and `EventName` for TypeScript users, with a link to the guide section (**dropped**: only
    `EventName` is mentioned, see "Change of decision").
- Do not add an entry for the small fixes (CHANGELOG policy: breaking changes only).

### `packages/website/docs/getting-started.mdx`

- `:179` and `:186`: `InternalEvent.CLICK` and `InternalEvent.CELLS_MOVED` become `EventNames.*`, and the import of the
  snippet if the page shows one.

### `packages/website/docs/guides/extend-maxgraph.md` (**dropped**, see "Change of decision")

- Add a section explaining how to add new event names, after "Extending the `Cell` style" (`:657`), with:
  - when it is useful: an application or a plugin firing its own events on the graph (or any `EventSource`) and wanting
    one place to reference their names, as the built-in ones are referenced through `EventNames`;
  - firing and listening: `fireEvent(new EventObject(name, ...))` and `addListener(name, ...)` accept any string, so a
    custom event works without registering anything; registering the name is about a single reference and editor
    guidance;
  - JavaScript: add the field to `EventNames` at application startup, before any listener uses it;
  - TypeScript: the same runtime assignment, plus the module augmentation of `EventNamesMap` that declares the field,
    **optional**, with the reason (a required field breaks the type check of `EventNames` itself when the library is
    compiled together with the application), the `export {}` requirement of the augmentation file, and what the user
    gets: `EventNames.MY_EVENT` checked, `EventName` including the new value, and `addListener` suggesting it;
  - a warning not to reuse the value of a built-in name, since listeners are matched by the string value only;
  - one complete example, derived from the `ts-support` check so that it is known to compile.
- Mirror the structure and the warnings of the `CellStateStyle` section (`:676-710`).
- Keep the guide a collection of independent recipes (`guides-structure.md`): one sentence of audience, links at the
  point of use, `Since 0.26.0` on the feature.
- Run the website build (`.claude/rules/documentation/website.md`), since the new heading creates an anchor.

### `packages/website/docs/guides/migrate-from-mxgraph.md`

- Leave unchanged. Its `:::danger` notice says the guide is not updated after 0.18.0 and sends readers to the CHANGELOG,
  which carries the migration. Flag it in the PR description so a reviewer can disagree.

## Testing Strategy

- **Values unchanged:** before deleting the statics, extract the 96 `[key, value]` pairs of `InternalEvent.ts` at the
  base commit and compare them with the entries of `EventNames.ts` (a one-off node check, like the regex of
  `transform.mjs`), same keys, same values, same order. Not committed.
- **No leftover:** `git grep` for `InternalEvent\.` followed by one of the 96 names, across the whole repository
  (sources, tests, stories, examples, docs, README, ADRs): no match.
- **Core:** `npm run build -w packages/core`, `npm run test-check -w packages/core`,
  `npm test -w packages/core -- --coverage`, `npm run check:circular-dependencies -w packages/core`,
  `npm run check:npm-package -w packages/core`.
- **Type support:** `npm test -w packages/ts-support`, with the new augmentation checks.
- **Stories:** `npm run build -w packages/html`; open a few modified stories in the dev server (Monitor, Overlays,
  AutoLayout) to check their listeners still fire, since a wrong name in a story only fails at runtime.
- **Lint:** `npm run lint`.
- **Website:** `npm run build -w packages/website`.
- **Sizes:** `./scripts/build-all-examples.bash`, compare with the baseline (raw minified, kB): js-example 466.88,
  js-example-selected-features 384.94, js-example-without-defaults 239.11, ts-example 428.73,
  ts-example-selected-features 361.53, ts-example-without-defaults 220.86. The prototype predicts about -1.8 to -2.4 kB
  everywhere (shorter references, no dropped name while the direct eval remains, see #1226). Update every budget that
  moves, per `.claude/rules/tooling/bundle-size-budgets.md` (round up to the next kB, both webpack limits, the Vite
  `chunkSizeLimitInKB`), in commit 1, and give the before/after table in the commit body and the PR.

## Documentation

- `EventNames.ts` JSDoc (object, interface, union).
- CHANGELOG breaking entry.
- `getting-started.mdx` snippet.
- New section of `guides/extend-maxgraph.md`.

## Rollout Considerations

- Breaking change: commit 1 uses `refactor!:` with a `BREAKING CHANGE:` footer listing the removed statics and the
  replacement.
- Follow-up task, outside this PR, issue #1230 (to update with the PR link once the PR is created): make `addListener` (and the other places taking an event name) require `EventName`,
  so that custom names must be declared through module augmentation. Breaking for TypeScript users who pass undeclared
  strings; listed in `explore.md`, "Follow-up work".
- Issue #1228 (dead branch) and #1229 (handles, `PINCH_THRESHOLD`) touch the same files; whichever lands second rebases.
  When #1228 is done after this branch, it removes the cast added here.
- The task files under `.claude/tasks/` are committed on this branch; decide before the PR whether they stay (they
  contain the prototypes needed by #1226) or move elsewhere, and clean the history of the absolute paths of commit
  `8b04ddbf8` if they stay.
