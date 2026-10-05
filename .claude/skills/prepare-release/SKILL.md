---
name: prepare-release
description: "Prepare a maxGraph release: compute the version, collect breaking changes, features, documentation changes and example bundle sizes, then write the CHANGELOG entry, the bundle size history and the GitHub release notes, and optionally update the GitHub draft release. Use when the user asks to prepare a release, its release notes or its CHANGELOG entry."
disable-model-invocation: true
argument-hint: "[target-version]"
---

# Prepare a release

Follow the "Preparation" section of the release how-to (`packages/website/docs/development/release.md`). The skill
collects the information of the release (phase 1), then writes the `CHANGELOG.md` entry, the bundle size history and
the top section of the GitHub release body, everything **before** `## Resources` (phase 2). Once the tag is pushed,
it finalizes the GitHub draft release (phase 3).

The release notes are written **before** the release procedure starts: the one-line summary of the `CHANGELOG.md`
entry is derived from them.

## Core rules

- **Never invent** a PR/issue number or a feature that is not backed by a commit. If unsure, leave a
  `TODO` marker rather than guessing.
- **Show code examples when the change affects how users write code** (new/renamed/moved API, a new
  helper, a migration). Prefer a **before/after** pair in fenced ` ```ts ` blocks. The code must be
  **real**: read the actual signatures/exports from the source (e.g. `packages/core/src/`) rather than
  guessing. Use concrete, recognizable cases (e.g. the `EntityRelation` edge style) plus one more when
  it clarifies the pattern. Skip examples for purely internal or non-API changes.
- **Read the linked PR, not just the commit**, for every documented highlight and breaking change. The
  commit message is a summary; the PR body usually carries the context, rationale, code examples and
  screenshots worth reusing. Fetch it with `gh pr view <NNNN> --json title,body,url` and reuse relevant
  material as-is (including image/attachment URLs). This is still bound by the never-invent rule: use
  only what the PR actually states.
  - **Reconcile PR content with later commits.** A PR describes the state when it was authored; a
    following commit may have changed it. Verify API names, signatures and suggested usage against the
    current source before reusing them. Example: PR #1050 suggested read-only access via
    `.imageBundles`, which commit #1052 later made private, so `getImageFromBundles()` is the correct
    call to document.
- **Split the breaking changes by audience**, in the `CHANGELOG.md` entry and in the release notes: first those
  that concern every user, then those that only concern TypeScript users (type-only changes, such as a narrowed
  return type, and the minimum supported TypeScript version). In `CHANGELOG.md`, the second group is introduced by
  the label `**Breaking Changes for TypeScript users**:`, placed after the `**Breaking Changes**:` list. In the
  release notes, it is a `### For TypeScript users` sub-section of `## Breaking changes`. Drop the group when it is
  empty.
- **Never pass template placeholder prose through to the output.** The template lines
  `⚡ **This new version improves ...** ⚡`, `_If appropriate, briefly explain the contents..._` and the
  `**TODO: ...**` lines are prompts, not content: replace them with real content or drop the paragraph.
- **Truly manual fields**: only screenshots/animations are left for the user, as clearly marked
  placeholders. The one-line summary is drafted by the skill, not left blank.
- **Never delete `## Resources` or anything after it** in the draft (see [step 12](#12-update-the-draft)).
  That content is auto-generated (`generateReleaseNotes: true`) and cannot be regenerated.
- **An empty commit filter result is a valid outcome.** The `git log ... | grep` lookups of phase 1 exit with
  code 1 when the release contains no commit of that type. Read it as "no such commits": drop the corresponding
  section and move on, instead of retrying with looser patterns.
- **Do NOT hard-wrap the release notes prose.** GitHub release notes render a single newline as a visible line
  break, so a wrapped paragraph shows mid-sentence breaks in the published notes. Keep each paragraph and each
  list item on a single line, however long. (Code fences and Markdown tables are naturally multi-line and
  unaffected.) This applies to the release notes only, not to `CHANGELOG.md`.
- **Leave the repository changes uncommitted.** The `CHANGELOG.md` entry and the new rows of the bundle size
  history go into the `chore(release): prepare version <version>` commit of the release procedure, together with
  the version updates. Do not commit or push them.

## Phase 1: collect the information

### 1. Determine the versions

The project follows [semver](https://semver.org/) and uses conventional commits, so the commit history
tells which version comes next. Compute it, then ask the user to confirm (see the "Preparation" section
of `packages/website/docs/development/release.md`).

- **Release branch**: releases are done from `main`, and the skill may run from another branch (the one carrying
  a change to the skill, for instance). Always work on `origin/main`, never on `HEAD`: run
  `git fetch --tags origin main` first. All the commands of this skill use `origin/main`.
- **Previous version**: the latest tag reachable from `origin/main`: `git describe --tags --abbrev=0 origin/main`.
  - **Finalize phase**: if the GitHub release of that tag is still a draft
    (`gh release view <tag> --json isDraft -q .isDraft` returns `true`), the tag is the version being
    released: it is the target, and the previous version is the tag before it
    (`git describe --tags --abbrev=0 <tag>^`). Skip the computation below and go to
    [phase 3](#phase-3-finalize-the-github-release).
- **Commit range**: `v<previous>..origin/main`, or `v<previous>..v<target>` in the finalize phase.
- **Bump type**, from the commits of the range:
  - breaking change: a `!` after the type or scope (`type!:`, `type(scope)!:`), or a
    `BREAKING CHANGE:` footer (same lookups as [step 2](#2-breaking-changes-and-deprecations));
  - feature: a `feat` commit (same lookup as [step 3](#3-features-validate-with-the-user-first));
  - anything else (fixes, refactoring, documentation, dependencies...) is a patch.
- **Target version**: until the first major version (`0.x.y`), bump the **minor** version when the
  range contains a feature or a breaking change, otherwise bump the **patch** version. From `1.0.0`
  on, a breaking change bumps the **major** version, a feature the **minor**, anything else the
  **patch**.
- **Ask the user**, citing what drove the decision, e.g. "The previous version was 0.24.0. The release
  contains 2 breaking changes and 4 features, so it is a minor update: I propose to release version
  0.25.0." Use the version the user answers, even if it differs from the proposal.
- If the user passed a target version as argument and it differs from the computed one, show both and
  ask which one to use.
- An empty range means there is nothing to release: say so and stop.

#### Pause: milestone management

Once the version is confirmed, **stop** before collecting anything else: the maintainer manages the milestone of the
release with the version known (see the "Milestone management" section of the release how-to). Help with read-only
checks, and never change a milestone or an issue yourself:

```bash
# milestones still open: is there one named after <target>, or one to rename?
gh api 'repos/maxGraph/maxGraph/milestones?state=open' -q '.[] | "\(.title)\topen=\(.open_issues)\tclosed=\(.closed_issues)\t\(.html_url)"'
# issues still open in the milestone of the release
gh issue list -R maxGraph/maxGraph --milestone "<target>" --state open --json number,title
# issues closed as completed since the previous release, without milestone
gh issue list -R maxGraph/maxGraph --search "is:issue is:closed reason:completed no:milestone closed:>=<date of the previous release>" --json number,title,closedAt
```

The date of the previous release is `gh release view v<previous> --json publishedAt -q '.publishedAt[:10]'`. An
empty list is a valid outcome.

Report the findings: the milestone to rename or create, the open issues to move, the issues that may belong to the
release, and remind the maintainer to close the milestone. Then wait until the maintainer says the milestone is done,
or chooses to skip it, before going on with [step 2](#2-breaking-changes-and-deprecations). Keep the milestone URL:
the `## Resources` section of the draft release asks to validate it.

### 2. Breaking changes and deprecations

- List commits whose title contains `!` per semver (`type!:` or `type(scope)!:`):
  `git log v<previous>..origin/main --oneline | grep -E '^[a-f0-9]+ [a-z]+(\([^)]+\))?!:'`
- Also list commits declaring a `BREAKING CHANGE:` footer, which catches a breaking change whose title
  lacks the `!`: `git log v<previous>..origin/main --format='%h %s' --grep='^BREAKING CHANGE'`. The two
  lookups usually overlap; merge them by commit hash.
- Read the linked PR of each one for the full rationale and impact, not just the commit message (see Core rules).
- Classify each breaking change: every user, or TypeScript users only (see Core rules).
- Cross-check `CHANGELOG.md` (the `## Unreleased` section, plus the target version section if already
  added): verify every breaking change **and** every deprecation notice from the commits has a
  matching CHANGELOG entry. List the missing ones: they are added in [step 10](#10-changelog-entry).

### 3. Features (validate with the user first)

- Extract `feat` commits: `git log v<previous>..origin/main --oneline | grep -E '^[a-f0-9]+ feat(\([^)]+\))?!?:'`
- For each candidate, read the linked PR (see Core rules): its description often has context, code
  examples and screenshots not in the commit message, which can be reused directly in the highlight.
- Produce a **pre-list** of candidate highlights and present it to the user to validate the level of
  detail **before** writing the prose. Do not write the Highlights section until the user approves.
- Link each highlight to its real PR (`For more details, see #<PR_NUMBER>.`), taken from the commit
  (merge commits and squashed commits usually carry the `(#NNNN)` suffix). No PR number found → leave
  a `TODO`.

### 4. Bug fixes (excluded by default)

- Do **not** document bug fixes by default.
- Still present the list of `fix` commits to the user so they can decide, case by case, which (if any)
  deserve a mention: `git log v<previous>..origin/main --oneline | grep -E '^[a-f0-9]+ fix(\([^)]+\))?!?:'`

### 5. Bundle sizes of the examples

Do not build anything: the sizes are read from the bundle size history and from the CI logs. Build locally only
as a [fallback](#fallback-build-locally).

The history is stored in `docs/examples-bundle-size/`, read its `README.md` first: one CSV per repository
(`maxgraph-examples.csv`, `maxgraph-integration-examples.csv`), one row per version, sizes in kB, columns named
after the examples as printed by the CI.

**Previous version.** Read the row of `<previous>` in both CSV files. Also read the rows labelled
`<previous> (...)`, which give the sizes of the previous version after a change of the build tooling, and the notes
of `docs/examples-bundle-size/README.md` about these versions.

**maxGraph repository, current version.** The `build_examples (ubuntu-24.04) / build` job of the `build.yml`
workflow prints the sizes (the macOS and Windows jobs print the same values).

```bash
gh run list -R maxGraph/maxGraph --workflow build.yml --limit 20 --json databaseId,headBranch,headSha,conclusion,createdAt,event -q '[.[] | select(.headBranch=="main" and .event=="push" and .conclusion=="success")][0]'
gh run view <run> -R maxGraph/maxGraph --json jobs -q '.jobs[] | select(.name=="build_examples (ubuntu-24.04) / build") | .databaseId'
gh run view <run> -R maxGraph/maxGraph --job <job> --log | grep -A4 'CSV of bundle sizes' | sed -E 's/^[^\t]*\t[^\t]*\t[0-9TZ:.-]+ //'
```

Filter on `headBranch` with `jq`, never pass `--branch main`: in both repositories, it returned old runs whose logs had
expired (`HTTP 410` when reading them). The log lines are `<job>\t<step>\t<timestamp> <content>` and the step column is
`UNKNOWN STEP`, so filter on the section title, not on the step. The CSV is the header line followed by the values line.

- `build.yml` only runs when the paths listed in its `paths` filter change, so the latest successful run is often
  not on the last commit of `main`. Compare its `headSha` with it: `git diff --name-only <headSha> origin/main`. If
  none of the changed files matches the `paths` filter of `build.yml`, the sizes are valid for `origin/main`.
  Otherwise wait for a run
  on a more recent commit, or ask the user.
- If the run failed because an example exceeds its size budget, do not use the sizes: report it to the user, since
  the growth must be checked and the limit updated on `main` before the release.

**maxgraph-integration-examples repository, current version.** The `build_projects (development)` job of the
`check-typescript-projects.yml` workflow builds the projects against an `npm pack` of the `main` branch of
`maxGraph`, and prints the sizes in the same format.

```bash
gh run list -R maxGraph/maxgraph-integration-examples --workflow check-typescript-projects.yml --limit 10 --json databaseId,headBranch,headSha,conclusion,createdAt,event -q '[.[] | select(.headBranch=="main")]'
gh run view <run> -R maxGraph/maxgraph-integration-examples --json jobs -q '.jobs[] | "\(.databaseId)\t\(.name)"'
gh run view <run> -R maxGraph/maxgraph-integration-examples --job <build_projects (development) job> --log | grep -A4 'CSV of bundle sizes' | sed -E 's/^[^\t]*\t[^\t]*\t[0-9TZ:.-]+ //'
```

- **Check which `maxGraph` commit was built.** The `build_maxgraph_dev_package` job prints it:
  `gh run view <run> -R maxGraph/maxgraph-integration-examples --job <build_maxgraph_dev_package job> --log | sed -E 's/^[^\t]*\t[^\t]*\t[0-9TZ:.-]+ //' | grep -A1 'git log -1 --format=%H'`.
  Compare it with `gh api repos/maxGraph/maxGraph/commits/main -q .sha`. If they differ and the commits in between
  change `packages/core` (outside Markdown files), the sizes are stale: ask the user to dispatch the workflow,
  `gh workflow run check-typescript-projects.yml -R maxGraph/maxgraph-integration-examples --ref main`, and tell
  them that it also redeploys the GitHub Pages demo of that repository. Never dispatch it without the user's OK.
- **Baseline with the current tooling.** The `build_projects (release)` job of the same run builds the projects
  with the released `<previous>` from npm and the current tooling of the repository. Read its CSV the same way: it
  gives the sizes of `<previous>` with today's tooling, so comparing it with the `development` job isolates the
  effect of `maxGraph`. When these values differ from the last `<previous>` row of the CSV (plain or
  `<previous> (...)`), the tooling of the repository changed since that row was recorded: look for the dependency
  upgrades merged in the meantime (`git log` of the integration repository, `chore(deps` PRs), and add a tooling
  row named after them in [step 11](#11-bundle-size-history), with a note in the README.
- **A breaking change can break the build of the integration projects.** The `development` job then fails and
  prints no usable size. The fix is done in advance through a PR on the integration repository. Ask the user for
  that PR, and read the `build_projects (development)` job of its latest run instead (the workflow also runs on
  pull requests): `gh run list -R maxGraph/maxgraph-integration-examples --workflow check-typescript-projects.yml --branch <pr branch>`.

**Size information from the pull requests.** Pull requests that change the bundle size often carry a comparison
table (before/after, or against the previous version). Look at the PRs of the range labelled `enhancement` or
`refactor`, or whose title starts with `feat`, `refactor` or `perf`, and at the bundler upgrades
(`chore(deps-dev): bump` of `vite` or `webpack`):

- `gh pr view <NNNN> --json body,comments,reviews` and look for size tables.
- Keep the intermediate values: they explain where a size change comes from, and the release notes can show them
  as extra columns (see [step 8](#8-bundle-size-paragraph)). For example, the v0.20.0 release notes had the columns
  `v0.19.0 | enums removal | EdgeStyles tree-shaking | v0.20.0`.
- Watch the bundler upgrades: their effect must not be attributed to `maxGraph`. Compare the new sizes with the
  last `<previous> (...)` tooling row when there is one. For the integration projects, the `release` job gives this
  baseline directly (see above). For the maxGraph examples, there is no such job: when an upgrade has no tooling row
  yet, tell the user, who may add one.

#### Fallback: build locally

Only when the CI data is not available (no usable run, logs expired), and after asking the user:

- **Load Node first.** `npm` is not on the `PATH` in a non-interactive shell. Source nvm and select
  the repo version before any build, otherwise the build fails with `npm: command not found`:
  ```bash
  export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"; nvm use
  ```
- **Build core first.** `build-all-examples.bash` only builds the examples; they bundle
  `@maxgraph/core` from `packages/core/lib`, so a stale or missing `lib/` yields wrong sizes. Run
  `npm run build -w packages/core` before the examples.
- Then run `./scripts/build-all-examples.bash --fail-at-end`. Delegate the whole build to a sub-agent
  via the Agent tool (with the nvm setup above) to keep the verbose output out of context. The script
  prints a markdown table and a CSV of bundle sizes at the end. Without `--fail-at-end`, the script stops at the
  first example exceeding its size budget and never prints the sizes.
- The integration projects cannot be built from this repository: ask the user.

### 6. Documentation changes (validate with the user first)

The release notes mention the **significant** documentation additions or changes. It is a curated selection, not
a list of every documentation PR: the automatically generated list below `## Resources` already has a
`📝 Documentation` category with all of them.

**List the candidates.**

- Commits touching the documentation:
  `git log v<previous>..origin/main --format='%h %s' -- packages/website/docs docs README.md`
- `docs` commits, which also catch API documentation changes made in the JSDoc of the sources:
  `git log v<previous>..origin/main --oneline | grep -E '^[a-f0-9]+ docs(\([^)]+\))?!?:'`
- Pages added, the strongest signal of a significant change:
  `git diff --name-status --diff-filter=A v<previous> origin/main -- packages/website/docs docs`
- Read the linked PR of each candidate (see Core rules) to understand what the change brings to the
  reader, not only which files it touches.

**Criteria for a significant change.** A candidate qualifies when it meets at least one of:

- **New page or new section** of the website, e.g. a dedicated tree-shaking page, a roadmap page, or a
  new Guides section grouping task oriented pages.
- **Substantial rewrite** of an existing page that changes what the reader learns from it: new
  concepts explained, a restructured page, or a recommended way of doing something that changed.
- **Documentation of a change of this release** that a user has to read to adopt it, such as a
  migration guide update for a breaking change or the page of a new feature. Link it from the matching
  breaking change or highlight as well.
- **API documentation (JSDoc) changes that alter the advice given to users**, such as replacing an
  outdated recommendation. Link to the API page on the website when there is one.
- **Contributor documentation of broad interest**, such as architecture decision records (`docs/adr`)
  or a new page of the development section. Group these in a short "For contributors" list at the
  end of the paragraph.

A candidate does **not** qualify when it only fixes typos, wording, broken links or formatting,
updates code samples without changing what they teach, or concerns the configuration of AI agents
(`AGENTS.md`, `.claude/`).

**Present a pre-list** of the qualifying candidates, and of the borderline ones with the criterion
hesitated on, and let the user validate it **before** writing the paragraph, as for the highlights.

## Phase 2: write the release content

Write the release notes first (steps 7 to 9), then derive the `CHANGELOG.md` entry from them (step 10).

### 7. Release notes body

Read the `body:` block in `.github/workflows/create-github-release.yml`. Use its content **from the
beginning up to (but NOT including) the `## Resources` section** as the structure to fill in: one-line
summary, Breaking changes, Removal of deprecated API, Deprecated APIs, Highlights (including the Bundle size
and Documentation paragraphs).

- **Breaking changes, Removal of deprecated API, Deprecated APIs**: from [step 2](#2-breaking-changes-and-deprecations),
  split by audience (see Core rules). Add a before/after migration snippet for any breaking change that alters call
  sites. Drop a section entirely if it has no content.
- **Highlights**: from the pre-list validated in [step 3](#3-features-validate-with-the-user-first), and the fixes
  the user chose in [step 4](#4-bug-fixes-excluded-by-default). For API-facing highlights (new helper, new
  option), include a before/after code example (see Core rules).
- **One-line summary**: draft it from the breaking changes and highlights, in bold between two `⚡`, as in the
  template (e.g. "⚡ **This new version improves modularity and fixes important memory leaks.** ⚡").
  Present it to the user for approval like the feature list. It is reused, without the emoji and the bold, in the
  `CHANGELOG.md` entry.

Write the result to `RELEASE_NOTES_DRAFT.md` at the repo root (ignored by `.gitignore`), unless the draft release
already exists (see [phase 3](#phase-3-finalize-the-github-release)).

### 8. Bundle size paragraph

A single `### Bundle size` paragraph of the Highlights describes the examples of both repositories, followed by
one table per repository. Do not split the description of the changes from the results, as v0.20.0 did with a
separate section.

- Start with a short explanation of the size changes, per repository: which change of the release causes them
  (link the PRs found in [step 5](#5-bundle-sizes-of-the-examples)), and which part comes from a bundler upgrade.
  If the sizes grew, say so in the title and the explanation.
  Three reading rules apply to this explanation:
  - **Never attribute a size change without evidence.** Sizes alone establish that something moved, never why.
    Attribute a change to a PR only when that PR measured it, or when the diff between the measurements was
    inspected. Otherwise describe the change without naming a cause.
  - **Lead with the largest changes in kB, not in %.** A large percentage on a small bundle is usually noise.
  - **Compare measurements made with the same toolchain** (Node version, bundler and dependencies). Nothing in the
    sizes records it, so a tooling change between two measurements makes their difference meaningless: compare with
    the tooling row instead (see [step 5](#5-bundle-sizes-of-the-examples)).
- Then copy **verbatim** the following block, replacing only `<target>`. It is mandatory in every release notes,
  so that each one can be read on its own:

  ```markdown
  > [!NOTE]
  > - What each example contains: see the [examples of the maxGraph repository](https://github.com/maxGraph/maxGraph/blob/v<target>/packages/website/docs/demo-and-examples.md) and the [projects of the maxgraph-integration-examples repository](https://github.com/maxGraph/maxgraph-integration-examples/blob/v<target>/README.md).
  > - In the `maxGraph` repository, the `js-example*` examples are built with webpack and the size is the one of the whole application. The `ts-example*` examples are built with Vite and the size is the one of the `maxGraph` chunk only, which doesn't include the rest of the application.
  > - In the `maxgraph-integration-examples` repository, the size is the one of the whole application, whatever the bundler.
  > - The bundlers used in these examples are not tuned, they are mainly using the default configuration. So, it is probably possible to improve the tree-shaking efficiency in these examples.
  ```

  The `maxgraph-integration-examples` tag is created shortly after the `maxGraph` one, with the same version.
- **Tables**: one row per example, named as in the CSV files, sizes in kB. Columns: `<previous>`, then the tooling
  row `<previous> (...)` when the history has one, then the intermediate values worth showing (one column per PR,
  named after the change), then `<target>`. Use the same columns for both tables when the data exists, and `N/A`
  for an example that did not exist in a version.

### 9. Documentation paragraph

Fill the `### Documentation` paragraph of the Highlights, after the bundle size tables, with the changes validated
in [step 6](#6-documentation-changes-validate-with-the-user-first). Drop the paragraph when there are none.

One list item per page or group of related pages: what the reader finds there, a link to the published page
(`https://maxgraph.github.io/maxGraph/docs/<path>`, the path of the file under `packages/website/docs` without its
extension, unless its front matter sets a `slug`), and the PR (`see #<PR_NUMBER>`). Link to files outside the
website, such as ADRs, with a permalink pinned to a commit SHA.

### 10. CHANGELOG entry

Turn the `## Unreleased` section into the entry of the new version, as previous releases did: insert the version
heading right after the `_**Note:** Yet to be released breaking changes appear here._` line, so that the pending
entries become those of the new version, and keep the `## Unreleased` heading and its note above it.

```markdown
## <target>

Release date: `<YYYY-MM-DD>`

For more details, see the [<target> Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v<target>) on the GitHub release page.

<one-line summary approved in step 7, without the emoji and the bold>

**Breaking Changes**:
- ...
```

- **Release date**: ask the user for the planned release date (default: today).
- **Breaking changes**: keep the existing entries, and add the missing ones listed in
  [step 2](#2-breaking-changes-and-deprecations) **after** them. Split them by audience (see Core rules). Write the
  added ones at the summary level: the details, migration snippets and rationale belong to the release notes.
- **Existing entries are left as they are**, even when they are more detailed than a summary: do not shorten or
  reword them. Moving an existing entry to the TypeScript group, with its text unchanged, is the only change
  allowed. Tell the user which existing entries are detailed and were left unchanged, so they can shorten them by
  hand if needed.
- **No breaking change**: write it explicitly, `**Breaking Changes**: none.`, since the entry details nothing else
  than the summary and the breaking changes.
- Keep an existing `**Other Changes**:` section as is.
- `CHANGELOG.md` is not a release notes body: keep its existing wrapping style.

### 11. Bundle size history

Append the sizes of `<target>` to both CSV files of `docs/examples-bundle-size/`: one row, `Version` set to
`<target>`, values as printed by the CI, in the column order of the header. A new example gets a new column, with
`-` for the previous versions.

- When the release contains a bundler upgrade whose effect was measured or extrapolated, the corresponding
  `<previous> (...)` tooling row is added to the CSV at the same time, before the `<target>` row. For the
  integration projects, its values come from the `build_projects (release)` job (see
  [step 5](#5-bundle-sizes-of-the-examples)).
- When a value needs an explanation (tooling row, extrapolated value, unexplained change), add a note for that
  version in the "Notes on some versions" section of `docs/examples-bundle-size/README.md`. Only the values that
  need it are commented.

### Report the files left for the release commit

At the end of phase 2, tell the user which files were changed and left uncommitted, so they can review them and
reuse them later in the release procedure:

- `CHANGELOG.md`, with the entry of `<target>`: to include in the `chore(release): prepare version <target>` commit;
- `docs/examples-bundle-size/maxgraph-examples.csv` and `docs/examples-bundle-size/maxgraph-integration-examples.csv`,
  and `docs/examples-bundle-size/README.md` when a note was added: to include in the same commit;
- `RELEASE_NOTES_DRAFT.md`, ignored by git: the release notes body, reused in
  [phase 3](#phase-3-finalize-the-github-release) to update the draft release.

Also list the existing `CHANGELOG.md` entries left unchanged although detailed (see
[step 10](#10-changelog-entry)).

## Phase 3: finalize the GitHub release

### 12. Update the draft

The skill runs in two phases (see the release how-to in `packages/website/docs/development/release.md`):
the content is prepared **before** the tag is pushed, when the GitHub draft release does not exist yet,
and the draft is finalized **after** the release workflow has created it.

First check whether the draft exists: `gh release view v<target> --json isDraft -q .isDraft`.

- **No release found** (preparation phase): write to a file, see the alternative below. Do not offer to
  update the draft.
- **Draft found** (finalize phase): when the user is OK with the content, ask whether to update it in
  place. If a `RELEASE_NOTES_DRAFT.md` from the preparation phase exists, start from it and refresh what
  may have changed since (commits merged after the preparation, final bundle sizes).
- **Release found but already published** (`isDraft` is `false`): stop and ask the user.

**Preferred: update the draft in place (only after explicit user OK).**

1. Fetch the current draft body into a file at the repo root:
   `gh release view v<target> --json body -q .body > RELEASE_BODY_CURRENT.md`
2. Split it at the `## Resources` line. Everything from `## Resources` onward is the **preserved
   suffix** and must be kept **byte-for-byte**.
3. Write the new body to `RELEASE_BODY_NEW.md`: generated top section + the preserved suffix (starting
   at `## Resources`).
4. **Keep the release date already in the draft.** The workflow set the real date on the first line
   (`_Version <version> released on <date>._`); reuse that exact line from the current draft instead of
   the generated `<RELEASE_DATE>` placeholder, so the finalize step never overwrites the actual date.
5. Show the user exactly what will be preserved before applying, then:
   `gh release edit v<target> --notes-file RELEASE_BODY_NEW.md`
6. Delete `RELEASE_BODY_CURRENT.md` and `RELEASE_BODY_NEW.md` once the draft is updated.

Guard: if `## Resources` is not found in the current draft body, **stop and ask the user** instead of
editing (do not risk overwriting content that cannot be regenerated).

**Alternative: write to a file.**

When the draft does not exist yet, or the user prefers not to touch it, write the generated top section
to `RELEASE_NOTES_DRAFT.md` at the repo root. This file is already ignored by `.gitignore`.

## Success criteria

- No unhandled `TODO`/placeholder left except the intentional manual fields (screenshots).
- The one-line summary is drafted, approved by the user, and identical in the release notes and `CHANGELOG.md`.
- Each documented feature links to a real `#PR`.
- Every breaking change and deprecation of the range has a `CHANGELOG.md` entry, split by audience, or the entry
  states `**Breaking Changes**: none.`
- The bundle size paragraph contains the mandatory note block verbatim, and both tables match the CSV files.
- Both CSV files have a `<target>` row, and every value needing an explanation has a note in the README.
- The Documentation paragraph, when present, only holds changes the user validated, each linking to its
  published page and its `#PR`.
- The `CHANGELOG.md` and CSV changes are left uncommitted, and the user is told which files they are.
- The `## Resources` section and everything after it is preserved unchanged in the draft.
- The release date on the draft's first line is preserved (never overwritten by the placeholder).
