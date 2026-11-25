# Analysis 005: Identify the development versions of the library

> [!NOTE]
> Draft. This analysis gathers the initial notes, the problem and a first proposal. The exploration listed in
> [Exploration to do](#exploration-to-do) is still pending, and no recommendation is made yet.

- **Date**: 2026-11-25
- **Written with**: Claude Code (Claude Opus 5.5)
- **Analysis basis**: commit `032365667d5670ceb31728aa2800c4e9134aa706` on `main`, after version 0.25.2. File
  references point to that commit
- **Question**: how can a build of `@maxgraph/core` made from the development branch be told apart from the release it
  follows, by people, by the examples and by the CI?
- **Related**: [analysis 004](004-automate-release-tagging.md) and
  [ADR 0004](../adr/0004-automate-the-release-tag-with-a-github-app.md) on the automation of the release,
  [maxgraph-integration-examples#317](https://github.com/maxGraph/maxgraph-integration-examples/issues/317), created on
  2026-10-05, `scripts/update-versions.mjs`

## Problem

The version is changed only at release time. Between two releases, the development branch carries the version of the
previous release: on the analysis basis, `packages/core/package.json` and the `VERSION` constant of
`packages/core/src/util/Constants.ts` both say `0.25.2`, although `main` already holds changes made after it.

This is the classic problem of a version written in the project descriptor. In practice:

- **The examples cannot show which build they run.** Each example of this repository displays the version of maxGraph
  in its page, read from the `VERSION` constant (`packages/js-example/src/index.js`, `packages/ts-example/src/main.ts`
  and the other examples). A page built with the latest release and a page built with the development code display the
  same version.
- **The CI of the integration examples cannot check what it built.** In `maxgraph-integration-examples`, the
  development job runs `npm pack` on the `main` branch of maxGraph and installs the tarball. Issue
  [#317](https://github.com/maxGraph/maxgraph-integration-examples/issues/317) notes that nothing checks that the
  projects really use it, and that "the tarball also carries the version number of the latest release (the version is
  only bumped at release time), so the installed version cannot tell the two packages apart either". The sizes printed
  by that job feed the bundle size section of the release notes, so a silent fallback on the registry package would
  report the sizes of the released version as those of the upcoming one.

### Rejected: deduce the origin from the installation

The examples could display something else than the version, depending on how maxGraph was installed: scan
`package.json` or `package-lock.json` to tell a registry install from a local tarball. Rejected as too cumbersome: it
has to be done in every project and for every package manager, and it answers "where does it come from" rather than
"which version is it".

## Background: development versions elsewhere

JavaScript and npm have no notion of a development version comparable to the `-SNAPSHOT` of Maven, also used by
Gradle, where the development branch carries `1.3.0-SNAPSHOT` until `1.3.0` is released. The usual npm equivalent is a
pre-release identifier of [Semantic Versioning](https://semver.org/), such as `0.26.0-dev`.

Semantic Versioning gives a pre-release a **lower** precedence than the release with the same numbers: `0.26.0-dev`
sorts before `0.26.0`, and after every `0.25.x`. That makes a pre-release suffix meaningful only on the **next**
version, not on the one just released.

What three projects carry on their default branch, read on 2026-11-25:

| Project | Version on the default branch | Latest release | Scheme |
|---|---|---|---|
| [bpmn-visualization](https://github.com/process-analytics/bpmn-visualization-js/blob/cd09edeae0a069e85696ff0193ab9973ed9636b0/package.json) | `0.48.0-post` | `v0.48.0` | suffix added to the released version |
| [jest](https://github.com/jestjs/jest/blob/aa88f7cf0bfc7a3a2efbfcab97914886b22d4454/packages/jest/package.json) | `30.5.2` | `v30.5.2` | no distinction, like maxGraph today |
| [TypeScript](https://github.com/microsoft/TypeScript/blob/502a981024b79219b447ed5f376a529df50118e3/package.json) | `0.0.0` | `v7.0.2` | placeholder, the real version is set elsewhere, to be checked |

The scheme of bpmn-visualization, a suffix on the released version, collides with the precedence rule above:
`0.48.0-post` sorts **before** `0.48.0`, so a tool comparing versions takes the development build for an older one.

## First proposal

At each release, once the tag is created, set the version of the development branch to the **next minor version with
a `-dev` suffix**. Most releases are minor ones, so the next minor is the most likely next version. A patch release
does not invalidate it:

| Event | Version on `main` afterwards |
|---|---|
| release of `0.25.0` | `0.26.0-dev` |
| release of `0.25.1`, a patch | `0.26.0-dev` again |
| release of `0.26.0` | `0.27.0-dev` |

The suffix sorts after every `0.25.x` and before `0.26.0`, which is the order expected.

### Script

- A script computes the development version from the current version of `packages/core/package.json`: next minor,
  plus the `-dev` suffix.
- When the version already carries the `-dev` suffix, the script does nothing.
- A detection function, "is this a development version", is called before the function setting the version in the
  existing `scripts/update-versions.mjs`, which then updates `package.json`, `package-lock.json` and `Constants.ts` as
  today.
- The functions are tested with the test runner of Node.js, in a test file of their own, without adding a dependency.
  `update-versions.mjs` runs in a workflow that does not install the dependencies of the project, see its header.

### Interaction with the release automation

To be settled with [analysis 004](004-automate-release-tagging.md):

- the preparation pull request replaces `0.26.0-dev` by the released version `0.26.0`;
- after the tag, something sets `0.27.0-dev`: a follow-up pull request, a step of the release workflow (which would
  then write to `main`, ruled out by ADR 0004), or the next preparation pull request;
- a patch released from `main` goes from `0.26.0-dev` to `0.25.1`, then back to `0.26.0-dev`, which the script has to
  support.

## Exploration to do

- Java: how Maven and Gradle handle `-SNAPSHOT`, and the Gradle plugins deriving the version from the Git tags instead
  of storing it in the build file.
- Other languages and ecosystems.
- The discussions on the subject in the JavaScript world.
- The solutions of other libraries, beyond jest and bpmn-visualization: confirm what jest does, check how TypeScript
  sets its version, and look at a few more.
- Whether the `-dev` suffix has side effects on the npm tooling: ranges such as `^0.26.0` do not match a pre-release,
  the package would never be published under that version, the examples install it from a tarball.

## Next steps

1. Complete the exploration above.
2. Write the recommendation of this analysis.
3. Record the decision in an ADR, cross-linked with this analysis.
4. Implement the script and its tests.

## Method and limits

- The problem and the first proposal come from notes of the maintainer.
- The versions of the three projects were read on their default branch through the GitHub API on 2026-11-25. Only the
  `version` field was read, not how each project produces it.
- The precedence of pre-releases comes from the Semantic Versioning specification.
