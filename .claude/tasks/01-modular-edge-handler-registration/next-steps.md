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

**Done, and superseded: [PR #1145](https://github.com/maxGraph/maxGraph/pull/1145) is open and covers more than what
was planned here.** It adds the shared Vite plugin `scripts/vite/chunk-size-limit.mjs`, each example declaring its
limit once so `chunkSizeWarningLimit` and the blocking check cannot drift, `--fail-at-end` in
`scripts/build-all-examples.bash` used by the CI, `performance` budgets with `hints: 'error'` for the three webpack
examples, which had no guard at all, opt-in bundle analysis in the six bundled examples, the shared
`scripts/vite/maxgraph-chunk.mjs`, and the budget convention recorded in
`.claude/rules/tooling/bundle-size-budgets.md`.

Nothing left to carry here. The material that fed it stays in `explore.md`, section
_Making the size guard blocking (verified on this repo)_ and decision _E_.

## 4. The `onConfigure` plugin lifecycle hook

**Tracked in [issue #1149](https://github.com/maxGraph/maxGraph/issues/1149), which holds everything that used to be
described here**: why the hook is needed, the two candidate shapes of the plugin options with the id variant, module
augmentation for custom plugins, the silent no-op when the plugin is absent, and the task list.

The deadline of the shape decision is not in the issue, on purpose: it belongs to the ADR of item 1, which states it.

### Worked example: options for the rubber band plugin

**Tracked in [issue #1150](https://github.com/maxGraph/maxGraph/issues/1150), which holds everything that used to be
described here**: the four options and their state in the class, the two new properties, the fade out duration
hardcoded twice, the modifier key trigger with the three implementation constraints to review before implementing, the
`defaultOpacity` naming finding and the rename to consider, and the task list. It depends on #1149.
