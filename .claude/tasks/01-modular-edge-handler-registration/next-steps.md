# Next steps

State at the time of writing: the implementation of issue #890 is complete on
`feat/890-edgehandler_only_default_in_basegraph`, 14 commits above `main`, working tree clean, nothing pushed. The
full CI validation list of `CLAUDE.md` passes, 576 tests green, and the Docusaurus site builds with no broken link or
anchor.

## 1. Write the pull request description

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

Suggested labels to propose: `enhancement`, `breaking change`, `typescript`. Confirm against the repository label
list before creating the PR.

## 2. Dedicated PR: make the bundle size guard blocking

Not started. Fully specified in `explore.md`, section _Making the size guard blocking (verified on this repo)_ and
decision _E_ of the same file: the plugin skeleton, the verified behavior, the current limit values and the trade-off
to accept.

Summary: Vite has no built-in way to fail a build on `chunkSizeWarningLimit`, see
[vitejs/vite#18496](https://github.com/vitejs/vite/issues/18496), but a plugin calling `this.error()` from
`generateBundle` does, which was verified on this repository with vite 8.2.1. Its byte count matches the sizes already
published, so the existing limits stay valid.

It is independent of #890 and touches the three Vite example configurations plus one new shared file. Recommended
before any further size-sensitive work, so the next bundle regression fails the build instead of printing a warning
nobody reads.

## 3. The `onConfigure` plugin lifecycle hook

Out of scope here, and no GitHub issue exists for it yet. The forwarding block of
`AbstractGraph.configureEdgeHandlerFactories` is deliberately isolated in a single private method to make its
extraction trivial.

The design rationale is in `plan.md`, decision _D2_, and the insertion point in `explore.md`. `GraphPlugin` currently
declares `onDestroy` only, so it is the interface to extend.

Side benefit to mention when opening the issue: the 0.23 kB the forwarding currently costs every application, even one
registering no plugin at all, would move into the plugin that needs it.

### Decide the shape of the plugin options before 0.25.0 ships

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

`fadeOutDuration` is hardcoded **twice** in `reset()`, as `'all 0.2s linear'` in the transition style and as `200` in
the `setTimeout` removing the element. Both must be derived from the option, the transition string being built from the
value. They cannot drift today, they will be able to.

Naming of the group: `rubberBand` or `rubberBandSelection`. Moot if the keys are plugin ids. Otherwise `rubberBand`
keeps a mechanical link with what the id would become under the current convention, `'rubber-band'`.
