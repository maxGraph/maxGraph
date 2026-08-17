# Next steps

State at the time of writing: the implementation of issue #890 is complete on
`feat/890-edgehandler_only_default_in_basegraph`, 21 commits above `main`, working tree clean, nothing pushed. The
full CI validation list of `CLAUDE.md` passes, 576 tests green, and the Docusaurus site builds with no broken link or
anchor.

The branch has since been rebased on `main`, which brought in the `tree-shaking.md` documentation page. That page
stated things this work invalidates, so the last commit corrects it and cross-links it with `cell-handlers.md`.

## 1. Write the ADR on the graph options convention

To do now, in this branch, not as a follow-up.

This work introduces `GraphPluginOptions`, the second member of `GraphOptions` after `GraphCollaboratorsOptions`. Two
members make a convention, and every option added from now on will follow it by imitation. Writing it down now costs a
page, while the reasoning is still fresh and while the shape can still change: `edgeHandlerFactories` is unreleased, so
moving it is free until 0.25.0 ships and breaking afterwards.

**The repository has no ADR yet**: no directory, no template, no occurrence of "architecture decision". This first one
therefore also settles where they live, in which format and how they are numbered. Two plausible homes:
`packages/website/docs/development/`, alongside `contributing.md` and `release.md`, which publishes them on the website
in the contributor section, or a directory outside the website, which keeps them internal to the repository. A
lightweight format is enough: context, decision, consequences.

What the ADR has to state:

- the three-way split of `GraphOptions`: what the graph is built from, `container` and `plugins`, what it delegates to
  its collaborators, `GraphCollaboratorsOptions`, and what it hands over to its plugins, `GraphPluginOptions`. Each
  member exists because a distinct phase of the constructor consumes it;
- the naming convention, singular modifier, which is why `GraphCollaboratorsOptions` carries a `TODO` in `types.ts`
  and would be renamed in a grouped pass;
- an option is only honored when the component consuming it is present, and its absence is a silent no-op. The
  rationale is decision _D2_ of `plan.md`;
- the open question below, flat against grouped per plugin, with its deadline. The ADR is the right place to settle it
  rather than a comment in a task file.

## 2. Write the pull request description

Not started. Nothing about it is written anywhere else.

The issue number appears in no commit message, by project rule, so the PR description is the only place linking the
work to issue #890. It needs the `Closes #890` footer.

Content to report, measured with `./scripts/build-all-examples.bash` on this branch:

| Example | Before (#823) | After | Delta |
|---|---|---|---|
| `js-example` | 468.90 | 469.38 | +0.48 |
| `js-example-selected-features` | 386.54 | **379.39** | **-7.15** |
| `js-example-without-defaults` | 240.03 | 240.35 | +0.32 |
| `ts-example` | 428.65 | 429.10 | +0.45 |
| `ts-example-selected-features` | 361.52 | 361.74 | +0.22 |
| `ts-example-without-defaults` | 220.87 | 221.10 | +0.23 |

Points the description must make:

- `js-example-selected-features` is the demonstration: it registers `SelectionCellsHandler` and no edge style, so all
  its edges are of the `'default'` kind. It loses 7.15 kB with strictly unchanged behavior. No example was created for
  the occasion.
- `ts-example` proves the non-regression for `Graph`: 0.45 kB, not 7 kB, so `Graph` users keep everything they had.
- The 0.23 kB added to `ts-example-without-defaults` is the forwarding code in `AbstractGraph`, paid by every
  application even when it registers no plugin at all. The follow-up `onConfigure` hook would move it into the plugin
  and remove that cost.
- `ts-example-selected-features` had to declare the `'segment'` factory: it registers `orthogonalEdgeStyle` and
  genuinely needs `EdgeSegmentHandler`. This is the migration every affected `BaseGraph` application has to do, and the
  example now illustrates it.
- Two `chunkSizeWarningLimit` were raised, `ts-example` 429 to 430 and `ts-example-without-defaults` 221 to 222.
- The structural proof, independent of the sizes: in the emitted `lib/esm`, `AbstractGraph.js` imports no plugin at
  all, and `SelectionCellsHandler.js` imports only `EdgeHandler` and `VertexHandler`.
- Breaking change, already described in `CHANGELOG.md` under `## Unreleased`.
- The documentation of `tree-shaking.md` is corrected by the same branch: the plugin no longer instantiates
  `ElbowEdgeHandler` and `EdgeSegmentHandler`, the migration guide gains the step declaring the factories, and #890 is
  removed from its list of open tree-shaking issues.

Suggested labels to propose: `enhancement`, `breaking change`, `typescript`. Confirm against the repository label
list before creating the PR.

## 3. Dedicated PR: make the bundle size guard blocking

**In progress in the `chore/improve_build_of_examples` branch**, out of this one. Fully specified in `explore.md`,
section _Making the size guard blocking (verified on this repo)_ and decision _E_ of the same file: the plugin
skeleton, the verified behavior, the current limit values and the trade-off to accept.

Two requirements settled since `explore.md` was written, both scoped to that branch:

- the check is implemented **once** and shared by the three Vite configs, which already duplicate the whole
  `codeSplitting.groups` block and differ only by the limit. The limit stays declared once per example and feeds both
  `chunkSizeWarningLimit` and the blocking check, so the warning and the error cannot drift apart.
- `scripts/build-all-examples.bash` gains a `--fail-at-end` option, and the CI uses it. Once the check blocks, the
  first failing example aborts the whole script under `set -euo pipefail`, hiding both the other examples and the size
  table. With the option, every example is built, failures are collected, the file listing, the markdown table and the
  CSV are still printed, and the summary of the violations comes last, with a non-zero exit code. Default behavior is
  unchanged. The single CI call site is `.github/workflows/_reusable_build_examples.yml:33`, a reusable workflow used
  by `build.yml:93` and `create-github-release.yml:25`, so one change covers both, and the consequence for its
  `Upload all examples as artifact` step has to be decided explicitly.

Summary: Vite has no built-in way to fail a build on `chunkSizeWarningLimit`, see
[vitejs/vite#18496](https://github.com/vitejs/vite/issues/18496), but a plugin calling `this.error()` from
`generateBundle` does, which was verified on this repository with vite 8.2.1. Its byte count matches the sizes already
published, so the existing limits stay valid.

It is independent of #890 and touches the three Vite example configurations plus one new shared file. Recommended
before any further size-sensitive work, so the next bundle regression fails the build instead of printing a warning
nobody reads.

## 4. The `onConfigure` plugin lifecycle hook

Out of scope here, and no GitHub issue exists for it yet. The forwarding block of
`AbstractGraph.configureEdgeHandlerFactories` is deliberately isolated in a single private method to make its
extraction trivial.

The design rationale is in `plan.md`, decision _D2_, and the insertion point in `explore.md`. `GraphPlugin` currently
declares `onDestroy` only, so it is the interface to extend.

Side benefit to mention when opening the issue: the 0.23 kB the forwarding currently costs every application, even one
registering no plugin at all, would move into the plugin that needs it.

### Decide the shape of the plugin options before 0.25.0 ships

This is the open question of the ADR of item 1, which is where it gets settled. What follows is the material for it.

`GraphPluginOptions` is flat today, `edgeHandlerFactories` sitting directly at its top level. Grouping the options per
plugin is the alternative, and it has to be settled **before the release**: changing the shape is free while 0.25.0 is
unreleased, and breaking afterwards.

Two forms, and the choice decides more than aesthetics:

- **keys are plugin ids**. The mapping from a configuration entry to its owning plugin is then carried by the key
  itself, so `onConfigure` dispatches generically, and it works for custom plugins too since their id is their id.
  This reopens decision _D2_: detecting configuration provided for a plugin that is not registered becomes possible
  without the mapping table that was judged unworkable. The cost is that option keys inherit the current id
  inconsistency, `'RubberBandHandler'` and `'SelectionCellsHandler'` in legacy PascalCase against `'image-bundle'` and
  `'fit'` in the current kebab-case convention, giving
  `{ 'image-bundle': { … }, SelectionCellsHandler: { … } }`.
- **keys are chosen names**, `rubberBand` rather than `'RubberBandHandler'`. More readable, but the name to plugin
  link becomes implicit again, so no generic dispatch and no detection of an unregistered plugin.

If grouping wins, `edgeHandlerFactories` moves under the key of `SelectionCellsHandler`.

### Worked example for that PR: options for the rubber band plugin

Group of options mapping onto `RubberBandHandler`, to be implemented once the hook exists. Property names checked
against the class:

| Option | State of the class | Note |
|---|---|---|
| `fadeOut` | `fadeOut`, default `false` | maps as is |
| `defaultOpacity` | `defaultOpacity`, default `20`, from 0 to 100 | maps as is. The option keeps the property name rather than being shortened to `opacity`, so that every option of the group maps one to one onto the property it drives |
| `fadeOutDuration` | does not exist | new property, default taken from the current hardcoded value, 200 ms |
| `triggerModifierKey` | does not exist, `isForceRubberbandEvent()` hardcodes the alt key | new property, `'alt' \| 'control' \| 'meta' \| 'shift' \| null`, default `null`, meaning no modifier is required, which is the current behavior |

`fadeOutDuration` is hardcoded **twice** in `reset()`, as `'all 0.2s linear'` in the transition style and as `200` in
the `setTimeout` removing the element. Both must be derived from the option, the transition string being built from the
value. They cannot drift today, they will be able to.

#### `triggerModifierKey`, and why it unblocks left button panning

The option answers a concrete conflict, already acknowledged in the sources: `PanningHandler.useLeftButtonForPanning`
carries the comment _"Setting this to true may conflict with {@link RubberBandHandler}"_
(`packages/core/src/view/plugin/PanningHandler.ts:141`). Both plugins claim a plain left press on the background, both
in their `mouseDown`, both guarded by `!me.isConsumed()`, so the winner is whichever plugin comes first in the mouse
listener list, that is first in the `plugins` option. One of the two features is unusable.

Setting `triggerModifierKey` to `'shift'` splits the gesture instead of ordering it: a plain left drag on the
background pans, a shift left drag rubber band selects. The two features coexist, which is the behavior every diagram
editor offers.

Description for the JSDoc, to be refined when implemented: _the modifier key that must be held down for a mouse press
to start a rubber band selection. When `null`, no modifier is required and any press on the background starts one,
which conflicts with `PanningHandler.useLeftButtonForPanning`. Set it to free the plain left press for another
plugin._

Three implementation constraints, each verified against the current code:

- the option cannot simply gate `mouseDown`. `PanningHandler.isPanningTrigger()` matches on the left button alone
  (`PanningHandler.ts:275`), so a shift left press is also a panning trigger, and the plugin registered first still
  wins. The modifier press must be handled in the `FIRE_MOUSE_EVENT` path, the one `isForceRubberbandEvent` already
  uses, because `EventsMixin.fireMouseEvent` fires that event before dispatching to the mouse listeners
  (`EventsMixin.ts:673`). The rubber band then consumes the press before `PanningHandler.mouseDown` ever sees it,
  whatever the plugin order.
- that path must keep the `!me.getState()` check that `mouseDown` has, which `isForceRubberbandEvent` deliberately
  does not. Shift is already `AbstractGraph.isConstrainedEvent` (`EventsMixin.ts:880`), used by `SelectionHandler` for
  constrained moves, so starting a rubber band on a shift press **over a cell** would break constrained dragging. Only
  presses on the background may trigger it.
- when the option is set, the plain press must stop starting a selection, otherwise nothing is freed. So the option
  moves the trigger, it does not add one.

Whether the alt override of `isForceRubberbandEvent` survives as an unconditional second trigger, or whether
`triggerModifierKey` simply replaces it with `'alt'` as its default, is the one open point. Replacing it is the smaller
API, and it keeps a single answer to "what starts a rubber band", at the price of making `null` mean something the
current class cannot express.

Naming: `startModifierKey` was the alternative. Rejected because `start()` is the method both trigger paths call, so
the name would suggest it gates the alt override too. `triggerModifierKey` names the trigger, which is what it selects.

Naming of the group: `rubberBand` or `rubberBandSelection`. Moot if the keys are plugin ids. Otherwise `rubberBand`
keeps a mechanical link with what the id would become under the current convention, `'rubber-band'`.
