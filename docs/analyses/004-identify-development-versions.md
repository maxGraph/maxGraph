# Analysis 004: Identify the development versions of the library

> [!NOTE]
> Draft. The problem, the practices of other projects and a proposal are documented. The impact on the release
> process and the recommendation are still to come, see [Open points](#open-points).

- **Date**: 2026-11-25
- **Written with**: Claude Code (Claude Opus 5.5)
- **Analysis basis**: commit `032365667d5670ceb31728aa2800c4e9134aa706` on `main`, after version 0.25.2. File
  references point to that commit
- **Question**: how can a build of `@maxgraph/core` made from the development branch be told apart from the release it
  follows, by people, by the examples and by the CI?
- **Related**: [analysis 005](005-automate-release-tagging.md) and
  [ADR 0005](../adr/0005-automate-the-release-tag-with-a-github-app.md) on the automation of the release,
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
- **The integration examples have the same problem.** On their pull requests, the projects of
  [maxgraph-integration-examples](https://github.com/maxGraph/maxgraph-integration-examples) are built twice, with the
  latest release of maxGraph and with the development version. Their pages display the version of maxGraph in the
  footer, as the examples of this repository do, so the two builds of a page show the same version. Looking at a page,
  nobody can tell which build it comes from. A behaviour observed on a page, a bug or a fix, is then easily attributed
  to the wrong version: the page names a version, and that version is not the one running.
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

## How other projects handle development versions

The practices below were read on 2026-11-25, in the default branch of each project through the GitHub API, in the npm
registry, and in the official documentation of each ecosystem. Every repository link is pinned to the commit that was
read.

### Version rules that apply to npm

- [Semantic Versioning, item 11](https://semver.org/#spec-item-11): a pre-release has a **lower** precedence than the
  release with the same numbers, `1.0.0-alpha < 1.0.0`. So `0.26.0-dev` sorts after every `0.25.x` and before
  `0.26.0`, while a suffix on the released version, `0.25.0-post`, sorts **before** `0.25.0`, the release it follows.
- Pre-release identifiers compare in ASCII order, so `-dev` sorts after `-beta` and before `-rc`:
  `0.26.0-beta.1 < 0.26.0-dev < 0.26.0-rc.1`. Unlike Maven or PEP 440, Semantic Versioning has no rule putting a
  development version before every pre-release. This only matters if betas or release candidates are ever published.
- [node-semver](https://github.com/npm/node-semver/blob/b37b033b585ad5e575afeccadb426ea41bc6cea4/README.md#L185-L198)
  matches a pre-release only against a range carrying a pre-release on the same `major.minor.patch`: `^0.25.0` never
  selects `0.26.0-dev`. Inside this repository, no package declares a dependency on `@maxgraph/core` (checked in the
  `package.json` of every package), and the integration examples install the development build from a tarball path, so
  no range is involved.

### TypeScript

TypeScript stores a development version on its default branch, the next minor plus `-dev`, set by a commit after the
release.

- The root [`package.json`](https://github.com/microsoft/TypeScript/blob/502a981024b79219b447ed5f376a529df50118e3/package.json#L2-L4)
  says `0.0.0`, but it is a private workspace root named `@typescript/repo`, never published. Since the Go port of
  TypeScript 7, the version lives in
  [`tsc/internal/core/version.go`](https://github.com/microsoft/TypeScript/blob/502a981024b79219b447ed5f376a529df50118e3/tsc/internal/core/version.go#L7-L8):
  `var version = "7.1.0-dev"`, while the latest release is `7.0.2`.
- `main` moved from `7.0.0-dev` to `7.1.0-dev` by a manual commit,
  [Prepare main for 7.1 nightly builds](https://github.com/microsoft/TypeScript/commit/a5a219c3b5da0db4fa0ecf6c0b1f588c9af9c669),
  on 2026-07-08, the day `7.0.2` was published.
- The nightly build appends a date and a counter when it publishes, `7.1.0-dev.20261125.1`, under the `next` dist-tag
  ([dist-tags](https://registry.npmjs.org/-/package/typescript/dist-tags)), so `npm install typescript` stays on
  `latest`. The
  [`getPublishTag`](https://github.com/microsoft/TypeScript/blob/502a981024b79219b447ed5f376a529df50118e3/Herebyfile.mjs#L1965-L1977)
  function of the build refuses `latest` for a version that is not the stable one hardcoded on a release branch.
- Release branches hardcode their own version, `7.1.0-beta` on `release-7.1`
  ([version.go](https://github.com/microsoft/TypeScript/blob/3e9236361fa97a9e6c685f4833ac457ae2d8c50a/tsc/internal/core/version.go#L8)),
  through
  [`configure-release.mjs`](https://github.com/microsoft/TypeScript/blob/502a981024b79219b447ed5f376a529df50118e3/tools/scripts/configure-release.mjs#L22-L53).
- Before the port, TypeScript 6 already built its version as `${versionMajorMinor}.0-dev` in
  [`corePublic.ts`](https://github.com/microsoft/TypeScript/blob/c6a1812e0cc5e0c878d222fa80bc3225f72c136d/src/compiler/corePublic.ts#L3-L6).

### Other JavaScript projects

| Project | Version on the default branch | Latest release | How the version changes | Development builds published |
|---|---|---|---|---|
| [Prettier](https://github.com/prettier/prettier/blob/4772dcfad89966f1639f0832713a03e056edfbb3/package.json#L3) | `3.11.0-dev` | `3.10.1` | release script: next minor plus `-dev` after a minor, previous `-dev` value restored after a patch | none found |
| [Angular](https://github.com/angular/angular/blob/568c48b79651c98ea519e51f9ebeed1104cabaed/package.json#L3) | `22.4.0-next.0` | `22.3.0` | release tool commits the bump of the next branch | `-next.N` under the `next` dist-tag |
| [Vite](https://github.com/vitejs/vite/blob/86bf3067e8fcaea2ad6226bb77adc72fbb2ab95a/packages/vite/package.json#L3) | `8.4.0-beta.2` | `8.3.8` | release commits, `main` holds the current beta | betas under `beta`, previews on pkg.pr.new |
| [React](https://github.com/facebook/react/blob/92bb0678c52133a47b3095f6e54da883ea0d6cff/ReactVersions.js#L1-L33) | `19.3.0` | `19.3.1` | one file holds the version, the CI adds a suffix when publishing | `19.3.0-canary-<sha>-<date>`, `0.0.0-experimental-<sha>-<date>` |
| [typescript-eslint](https://registry.npmjs.org/-/package/@typescript-eslint/parser/dist-tags) | `8.74.0` | `8.74.0` | Nx release | `canary`, next patch plus `-alpha.N` |
| [Nx](https://github.com/nrwl/nx/blob/fe6b6e38af5992195a0423ff48ba6be8de1fbeb8/packages/nx/package.json#L3) | `0.0.1`, placeholder | `24.0.7` | computed by the CI when publishing | `-canary.<date>-<sha>`, `-pr.<n>.<sha>` |
| [semantic-release](https://github.com/semantic-release/semantic-release/blob/c74aef5032725b696b7f84803ff628a3bd0cb4c5/package.json#L4) | `0.0.0-development`, placeholder | `26.0.1` | computed from the commits, never committed | prerelease channels |
| [bpmn-visualization](https://github.com/process-analytics/bpmn-visualization-js/blob/cd09edeae0a069e85696ff0193ab9973ed9636b0/package.json) | `0.48.0-post` | `0.48.0` | suffix added to the released version | none |
| Vue, webpack, ESLint, Babel, Svelte, jest | the latest release | same | release scripts or changesets | mostly previews on pkg.pr.new, outside npm |

[Prettier](https://github.com/prettier/prettier/blob/4772dcfad89966f1639f0832713a03e056edfbb3/scripts/release/steps/bump-prettier.js#L42-L54)
is the closest precedent, including the case of maxGraph: a patch released from the default branch puts the previous
`-dev` value back instead of moving to a new one.

```javascript
if (verkit.difference(version, previousVersion) === "patch") {
  pkg.version = previousVersionOnDefaultBranch; // restore the `-dev` version
} else {
  pkg.version = verkit.increment(version, "minor") + "-dev";
}
```

[Angular documents](https://github.com/angular/angular/blob/568c48b79651c98ea519e51f9ebeed1104cabaed/contributing-docs/branches-and-versioning.md#L20-L21)
that its default branch "always represents a pre-release version". The
[semantic-release FAQ](https://semantic-release.gitbook.io/semantic-release/support/faq) recommends the
`0.0.0-development` placeholder, since the tag is its only source of truth. The
[changesets](https://github.com/changesets/changesets/blob/4582bbc9b44411be7bc440fec6081e5f794a62e2/docs/guide/snapshot-releases.md#L3-L5)
snapshots, `0.0.0-{tag}-{datetime}`, serve nightly releases from the default branch.

Six patterns come out of this sample:

1. **Next version plus `-dev`, committed** (TypeScript, Prettier): sorts correctly, readable in a checkout, but it
   guesses the next version, and two development builds carry the same version.
2. **Next version plus a counter, published** (Angular `-next.N`, Vite betas): the same idea for projects publishing
   every development build to npm, heavier than what maxGraph needs.
3. **Default branch equal to the last release, suffix added when publishing** (React, typescript-eslint, changesets
   snapshots): nothing to commit after a release, but a local build of the default branch still cannot be told from
   the release, which is the problem of maxGraph.
4. **No distinction** (Vue, webpack, ESLint, Babel, Svelte, jest): the most common choice, previews going through
   pkg.pr.new, addressed by commit.
5. **Placeholder version** (semantic-release, Nx): for fully automated releases where the tag is the source of truth;
   every build of the default branch reports a meaningless version.
6. **Suffix on the released version** (bpmn-visualization only): sorts before the release it follows.

### Other ecosystems

Two families exist outside npm.

**Version stored in the project and bumped by a commit after the release**, the family of the proposal:

- **Maven**: `X.Y-SNAPSHOT` is "the latest code along a development branch", older than its release
  ([getting started](https://maven.apache.org/guides/getting-started/index.html)). The
  [`release:prepare`](https://maven.apache.org/maven-release/maven-release-plugin/usage/prepare-release.html) goal
  sets the release version, commits, tags, sets the next development version (by default the next minor plus
  `-SNAPSHOT`) and commits again: two commits and a tag per release. Maven orders `snapshot` after `rc` and before the
  release
  ([ComparableVersion](https://maven.apache.org/ref/3.9.9/maven-artifact/apidocs/org/apache/maven/artifact/versioning/ComparableVersion.html)).
- **Node.js**: `main` carries `NODE_VERSION_IS_RELEASE 0`, which appends `-pre` to the version
  ([node_version.h](https://github.com/nodejs/node/blob/0623b0d4c72813e714ea5dccf805f98760ed0caa/src/node_version.h#L32)).
  After each release, a "Working on vX.Y.Z" commit increments the patch and sets the flag back to 0 so that "nightly
  builds are produced with the next version number _and_ a pre-release tag"
  ([release process](https://github.com/nodejs/node/blob/0623b0d4c72813e714ea5dccf805f98760ed0caa/doc/contributing/releases.md#L914-L933),
  [example commit](https://github.com/nodejs/node/commit/221ffa5df3013056d72bada8a68f878576ec6019) of 2026-11-11).
- **Rust**: Cargo excludes pre-releases from version requirements
  ([pre-releases](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html#pre-releases)). The crates
  sampled (serde, clap, tokio) keep the last released version on their default branch, with no marker.

**Version derived from the Git tags when building**, with no version stored in the project:

- **Gradle plugins**:
  [axion-release](https://github.com/allegro/axion-release-plugin/blob/2f7f294bec0ccb39492ee81396293bc90c2d8ba3/README.md#L17-L21)
  derives the version "from nearest tag", a snapshot after it;
  [reckon](https://github.com/ajoberstar/reckon/blob/d3fe682cd73ab792692b72207a404b5786066b97/README.md#L20-L31)
  ("Get that version number out of my build file!") builds `1.3.0-rc.1.8+3bb4161` from the distance to the last
  release;
  [nebula-release](https://github.com/nebula-plugins/nebula-release-plugin/blob/4bc2f7a51a2b2432a9d39b28a40b07cdbc93a8fa/README.md#L212)
  produces `X.Y.Z-dev.#+<hash>`.
- **Python**: PEP 440 puts `.devN` "immediately before the corresponding release"
  ([version specifiers](https://packaging.python.org/en/latest/specifications/version-specifiers/#developmental-releases)),
  and [setuptools_scm](https://setuptools-scm.readthedocs.io/en/latest/usage/) computes
  `{next_version}.dev{distance}+{hash}` from the last tag.
- **Go**: tags are the versions, and an untagged commit gets a pseudo-version that "compares higher than its base
  version, but lower than the next tagged version"
  ([pseudo-versions](https://go.dev/ref/mod#pseudo-versions)).

| | Stored and bumped after the release | Derived from the tags |
|---|---|---|
| Commit after the release | needed, pushed along with the tag | none, the tag is the source of truth |
| Version in a source checkout | the development version, readable | a placeholder or a stale value |
| Uniqueness of a build | none, unless a suffix is added when publishing | distance and hash in every build |
| Ordering against the releases | correct with the next version plus a suffix | correct by construction |
| Support in npm | native, `package.json` is read by every tool | none built in, the version must be injected into `package.json` and `Constants.ts` before packing, and the build needs the Git history |

## Proposal

At each release, once the tag is created, set the version of the development branch to the **next patch version with
a `-dev` suffix**, whatever the kind of the release:

| Event | Version on `main` afterwards |
|---|---|
| release of `0.25.0` | `0.25.1-dev` |
| release of `0.25.1`, a patch | `0.25.2-dev` |
| release of `0.26.0`, a minor | `0.26.1-dev` |

This is the scheme of Node.js, whose "Working on vX.Y.Z" commit increments the patch and adds `-pre`, see
[Other ecosystems](#other-ecosystems).

- **The rule never depends on the next release.** Every release, minor or patch, moves `main` to a new version, so the
  development version is always above the latest release and the script has no case to handle.
- **The ordering stays right.** `0.25.1-dev` sorts after `0.25.0` and before both `0.25.1` and `0.26.0`, so whatever
  the next release is, it sorts above the development builds that preceded it.
- **The development version may never be released.** When the next release is a minor one, `0.25.1-dev` is followed by
  `0.26.0`, and no `0.25.1` ever exists. This is accepted: the development version identifies a build of `main`, it
  does not announce the next release.

### The suffix: `-dev` or `-pre`

The examples use `-dev`. `-pre`, the suffix of Node.js, would work the same way. The choice is left to the
implementation. Both sort the same way against the releases, and both sort between the pre-release labels a future
beta or release candidate would use, since identifiers compare in ASCII order:
`0.25.1-beta.1 < 0.25.1-dev < 0.25.1-pre < 0.25.1-rc.1`.

- `-dev` says what the build is, a build of the development branch, and is the suffix of TypeScript and Prettier.
- `-pre` follows Node.js, but reads as "pre-release", the generic name Semantic Versioning gives to every suffix, which
  is less specific.

### Next minor plus `-dev`, considered and set aside

The first version of this proposal used the next minor, `0.26.0-dev` after `0.25.0`, the scheme of TypeScript and
Prettier. Most maxGraph releases are minor ones, so it guesses the next release more often. It was set aside because a
patch released from `main` does not fit it: after `0.25.1`, `main` would have to go back to `0.26.0-dev`, which is
already the version it carried before, so the development version does not change across that release. Prettier needs
a dedicated branch in its release script for this case, restoring the previous `-dev` value.

### Finding the previous release

The development version tells which release it follows: `0.25.1-dev` follows `0.25.0`. Two sources can give the
previous release, and they must agree:

- the version of `packages/core/package.json` on `main`, without the `-dev` suffix and with the patch decremented;
- the latest tag reachable from `main`, `git describe --tags --abbrev=0`, which the `prepare-release` skill already
  uses.

A mismatch means that the development version was not set after a release, or was set by hand to something else, and
the preparation of the release stops until it is understood.

### Script

- A script computes the development version from the released version: next patch, plus the `-dev` suffix.
- A detection function, "is this a development version", and the inverse computation, "which release does this
  development version follow", come with it. The latter serves the check of
  [Finding the previous release](#finding-the-previous-release).
- The script reuses `scripts/update-versions.mjs`, which updates `package.json`, `package-lock.json` and `Constants.ts`
  as today.
- The functions are tested with the test runner of Node.js, in a test file of their own, without adding a dependency.
  `update-versions.mjs` runs in a workflow that does not install the dependencies of the project, see its header.

### Impact on the `prepare-release` skill

- **Previous version**: today the latest tag reachable from `origin/main`. It also has to be deduced from the
  development version of `package.json`, and the two compared, see above.
- **Version bump in the preparation**: the skill leaves its changes uncommitted on `main` for the manual release
  commit. The preparation pull request now also replaces the development version, `0.25.1-dev`, by the version chosen
  for the release, `0.26.0` or `0.25.1`, with `update-versions.mjs`.
- **After the tag**: setting the next development version is a new step, wherever it ends up, see below.

### Interaction with the release

To be analysed. What is known already:

- setting the development version needs a commit after each release, pushed along with the tag. This is what Maven,
  Node.js and TypeScript do, and it means the release automation writes to `main`, which
  [ADR 0005](../adr/0005-automate-the-release-tag-with-a-github-app.md) rules out today;
- the preparation pull request replaces the development version by the released one, so between its merge and the
  tag, `main` carries the released version, as it does today.

## Open points

- The impact on the release process and on ADR 0005, see above.
- The suffix, `-dev` or `-pre`, chosen when implementing, see
  [The suffix](#the-suffix--dev-or--pre).
- Whether development builds are ever published to npm. If they are, `-dev` alone is not enough: two builds would carry
  the same version, and a counter or a date is needed, as in `7.1.0-dev.20261125.1` for TypeScript.
- How TypeScript packs `packages/typescript/package.json`, which says `7.1.0` without suffix, not checked.

## Next steps

1. Analyse the impact on the release process.
2. Write the recommendation of this analysis.
3. Record the decision in an ADR, cross-linked with this analysis.
4. Implement the script and its tests.

## Method and limits

- The problem and the proposal come from notes of the maintainer.
- The practices of other projects were collected on 2026-11-25 by three research subagents, one on TypeScript, one on
  JavaScript projects, one on other ecosystems. The main session checked directly the versions of TypeScript, Prettier
  and Angular, the bump commit and the dist-tags of TypeScript, the bump function of Prettier, and the `-pre` mechanism
  of Node.js. The other entries rely on the reports of the subagents and their links.
- The Rust practice comes from a sample of three crates, not from a published guideline.
- The precedence of pre-releases comes from the Semantic Versioning specification.
