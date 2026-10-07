# Implementation: Extract the event names from InternalEvent into EventNames

## Completed

One commit per task:

| Commit | Content |
|---|---|
| `bb4c1ea80` `refactor!: extract the event names from InternalEvent into EventNames` | New `view/event/EventNames.ts` (`as const` object, `EventNamesMap`, `EventName`), the 96 statics removed from `InternalEvent`, 371 references rewritten in 60 core files, 3 test files and 17 stories, cast plus comment on the dead `MOUSE_UP` branch (#1228), RESUME/SAVE JSDoc fixed, exports in `index.ts`, `ts-support` augmentation check, `getting-started.mdx`, CHANGELOG breaking entry, size budgets |
| `fdcfc6ab6` `feat: suggest the event names in EventSource.addListener` | `addListener` and `EventListenerObject.name` typed `EventName \| (string & Record<never, never>)`, `ts-support` checks |
| `e2328e2a4` `docs: explain how to add custom event names in the extend guide` | New section "Adding custom event names" in `guides/extend-maxgraph.md`, intro and description updated. **Reverted** by `0413b8416` |
| `c83ad61a1` `docs: refer to EventNames in the event documentation of the JSDoc` | 58 `mxEvent.<NAME>` replaced by `EventNames.<NAME>` in the JSDoc of 12 files |
| `0cd2d038b` `refactor: type the toolbar DOM listeners with Event instead of InternalEvent` | `EditorToolbar.ts`, `MaxToolbar.ts` |
| `0413b8416` `docs: stop documenting custom event names until the API requires EventName` | Guide section removed, CHANGELOG and JSDoc no longer mention augmentation; see "Change of decision" in `plan.md` |

The 96 names and values were compared with the base version of `InternalEvent.ts`: identical, same order.

## Deviations from Plan

- **JSDoc `mxEvent` references:** the plan targeted the "Event:" headings; the code examples of the JSDoc named the events
  the same way (`addListener(mxEvent.CHANGE, ...)`), so every `mxEvent.<event name>` was replaced. `mxEvent.<method>`,
  `mxEventObject` and `mxUtils` in those examples are left as they are.
- **Files referencing event names only in JSDoc without importing `InternalEvent`** (`Clipboard.ts`, `CellOverlay.ts`,
  `ParallelEdgeLayout.ts`, 11 mixin `.type.ts` files): no import added, as before the change.
- **Guide snippets:** the listener parameters are annotated (`_sender: unknown, evt: EventObject`). `addListener` takes
  a `Function`, so `(sender, evt) =>` fails with TS7006 under `strict`. The JavaScript snippets of `getting-started.mdx`
  are unaffected.
- **Custom event names no longer documented:** using an augmented name with the API needs a non-null assertion
  (`EventNames.MY_EVENT!`), because the property has to be optional. Found while writing the `ts-support` check. The
  guide section was then removed, see "Change of decision" in `plan.md`.
- **`ts-support` runs TypeScript 3.9.10**: the new types (`as const`, `Required`, `export type`, `string & Record<...>`)
  compile with it.

- **Augmentation check removed from `ts-support`:** after dropping the documentation, the check of the `EventNamesMap`
  augmentation was removed too, so that nothing presents the mechanism as supported. The other checks moved to
  `packages/ts-support/src/event-names.ts`. Issue #1230 now asks for a check of the mechanism it will choose.

## Test Results

- Values unchanged: 96/96, same keys, values and order as the base commit.
- `npm run build -w packages/core`: OK.
- `npm run test-check -w packages/core`: OK.
- `npm test -w packages/core`: 63 suites, 575 tests passed.
- `npm test -w packages/ts-support` (TypeScript 3.9.10): OK, including every `@ts-expect-error` of the new checks.
- `npm run lint`: OK.
- `npm run check:circular-dependencies -w packages/core`: no circular dependency.
- `npm run check:npm-package -w packages/core`: no problems found.
- `npm run build -w packages/html`: OK.
- `npm run build -w packages/website`: OK (broken links and anchors checked).
- The TypeScript example of the guide was compiled in `ts-support` (temporary file, removed).
- `./scripts/build-all-examples.bash`: all examples build within their new budgets.

| Example | Before (kB) | After (kB) |
|---|---|---|
| js-example | 466.88 | 463.99 |
| js-example-selected-features | 384.94 | 382.19 |
| js-example-without-defaults | 239.11 | 236.77 |
| ts-example | 428.73 | 426.93 |
| ts-example-selected-features | 361.53 | 359.78 |
| ts-example-without-defaults | 220.86 | 219.25 |

Stories checked at runtime (2026-10-07, after the rebase on origin/main): Storybook static build served locally,
headless Chromium driven by Playwright, every listener registered with `EventNames.*` triggered by real mouse input (no
direct call), page errors collected. 7 listeners, 7 PASS, no page error (only a 404 on `/favicon.ico`):

| Story | Line | Listener | Observed effect |
|---|---|---|---|
| Misc/Monitor | 351 | overlay `CLICK` | one alert per overlay click, none on the background |
| Effects/Overlays | 126 | graph `CLICK` | overlay added on a first click, removed on a second one |
| Effects/Overlays | 142 | overlay `CLICK` | "Overlay clicked" alert |
| Effects/Overlays | 158 | graph `DOUBLE_CLICK` | "Double-click: Cell" then "Double-click: Graph" alerts |
| Layouts/AutoLayout | 187 | overlay `CLICK` | vertex and edge added, layout applied |
| Layouts/AutoLayout | 169 | morph `DONE` | edges rendered once the animation ends, later changes still rendered (the update was closed) |
| Layouts/AutoLayout | 254 | connection handler `CONNECT` | edge added, target vertex moved to a new rank |

## Follow-up Tasks

- Enforce `EventName` in the listener API (the task recorded in `explore.md`).
- #1226 (indirect eval), #1227 (`nativeDblClickEnabled`), #1228 (dead branch, removes the cast added here), #1229
  (handle indexes and `PINCH_THRESHOLD`).
- `migrate-from-mxgraph.md` still says `InternalEvent.PAN_START`/`PAN_END`, on purpose (frozen at 0.18.0); mention it in
  the PR description.
- Before the PR: decide whether `.claude/tasks/` stays on the branch, and clean the absolute paths from the history of
  `8b04ddbf8` if it does.
