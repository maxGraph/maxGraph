---
name: prepare-release-notes
description: "Prepare the GitHub release notes draft for a maxGraph release. Produces the release body (breaking changes, deprecations, highlights, bundle size tables) from commits and the CHANGELOG, then optionally updates the GitHub draft release. Use when the user asks to prepare, draft, or write the release notes for a version."
disable-model-invocation: true
argument-hint: "[target-version]"
---

# Prepare release notes

Generate the top section of a maxGraph GitHub release body (everything **before** `## Resources`)
from the commit history and the CHANGELOG, then optionally push it into the GitHub draft release.

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
- **Never pass template placeholder prose through to the output.** The template lines
  `⚡ This new version improves ... ⚡` and `_If appropriate, briefly explain the contents..._` are
  prompts, not content: replace them with a real drafted summary (see [step 2](#2-load-the-template)).
- **Truly manual fields**: only screenshots/animations are left for the user, as clearly marked
  placeholders. The one-line summary is drafted by the skill, not left blank.
- **Never delete `## Resources` or anything after it** in the draft (see [step 8](#8-update-the-draft)).
  That content is auto-generated (`generateReleaseNotes: true`) and cannot be regenerated.
- **An empty commit filter result is a valid outcome.** The `git log ... | grep` lookups in steps 3 to
  5 exit with code 1 when the release contains no commit of that type. Read it as "no such commits":
  drop the corresponding section and move on, instead of retrying with looser patterns.
- **Do NOT hard-wrap prose.** GitHub release notes render a single newline as a visible line break,
  so a wrapped paragraph shows mid-sentence breaks in the published notes. Keep each paragraph and each
  list item on a single line, however long. (Code fences and Markdown tables are naturally multi-line
  and unaffected.)

## Workflow

### 1. Determine the versions

- Ask the user (or confirm) the **target version** being released and the **previous version**.
- The previous version is normally the latest existing `v*` tag: `git tag --sort=-creatordate | head -3`.
- Establish the commit range: from the previous tag to `HEAD` (or to the target tag if it already
  exists), e.g. `git log v<previous>..HEAD --oneline`.

### 2. Load the template

Read the `body:` block in `.github/workflows/create-github-release.yml`. Use its content **from the
beginning up to (but NOT including) the `## Resources` section** as the structure to fill in. The
sections to produce are: one-line summary, Breaking changes, Removal of deprecated API, Deprecated
APIs, Highlights, Bundle size reduction, and the two bundle size tables.

**One-line summary**: draft it from the breaking changes and highlights collected below, keeping the
`⚡ ... ⚡` style used by previous releases (e.g. "⚡ This new version improves modularity and fixes
important memory leaks. ⚡"). Present it to the user for approval like the feature list. Do not leave
the template's `⚡ ... ⚡` / `_If appropriate..._` prompt lines in the output. Reuse the approved
summary for the `CHANGELOG.md` entry.

### 3. Breaking changes and deprecations

- List commits whose title contains `!` per semver (`type!:` or `type(scope)!:`):
  `git log v<previous>..HEAD --oneline | grep -E '^[a-f0-9]+ [a-z]+(\([^)]+\))?!:'`
- Also list commits declaring a `BREAKING CHANGE:` footer, which catches a breaking change whose title
  lacks the `!`: `git log v<previous>..HEAD --format='%h %s' --grep='^BREAKING CHANGE'`. The two
  lookups usually overlap; merge them by commit hash.
- Cross-check `CHANGELOG.md` (the `## Unreleased` section, plus the target version section if already
  added): verify every breaking change **and** every deprecation notice from the commits has a
  matching CHANGELOG entry. **Flag any missing entry** to the user rather than silently filling it.
- Fill the "Breaking changes", "Removal of deprecated API", and "Deprecated APIs" sections. Drop a
  section entirely if it has no content.
- Add a before/after migration snippet for any breaking change that alters call sites (see Core rules).
- Read the linked PR for the full rationale and impact, not just the commit message (see Core rules).

### 4. Features (validate with the user first)

- Extract `feat` commits: `git log v<previous>..HEAD --oneline | grep -E '^[a-f0-9]+ feat(\([^)]+\))?!?:'`
- For each candidate, read the linked PR (see Core rules): its description often has context, code
  examples and screenshots not in the commit message, which can be reused directly in the highlight.
- Produce a **pre-list** of candidate highlights and present it to the user to validate the level of
  detail **before** writing the prose. Do not write the Highlights section until the user approves.
- Link each highlight to its real PR (`For more details, see #<PR_NUMBER>.`), taken from the commit
  (merge commits and squashed commits usually carry the `(#NNNN)` suffix). No PR number found → leave
  a `TODO`.
- For API-facing highlights (new helper, new option), include a before/after code example (see Core
  rules).

### 5. Bug fixes (excluded by default)

- Do **not** document bug fixes by default.
- Still present the list of `fix` commits to the user so they can decide, case by case, which (if any)
  deserve a mention: `git log v<previous>..HEAD --oneline | grep -E '^[a-f0-9]+ fix(\([^)]+\))?!?:'`

### 6. Bundle size, current version

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
  prints a markdown table and a CSV of bundle sizes at the end.
- **Size budgets can fail the build.** Each example declares a bundle size limit and its build fails
  when the bundle grows past it (see `.claude/rules/tooling/bundle-size-budgets.md`). Without
  `--fail-at-end`, the script stops at the first failing example and never prints the size table.
  If an example fails, do not use its size: report the failure to the user, since the growth must be
  checked and the limit updated on `main` before the release.
- Fill the **current-version column** of the "Examples in the `maxGraph` repository" table with those
  sizes.

### 7. Bundle size, previous version

- Fetch the previous release body and extract its bundle size table:
  `gh release view v<previous> --json body -q .body`
- Copy the sizes from its bundle size table into the **`before` column** of the new table. Most recent
  releases include this data, but the table format has varied across versions (headers, layout, extra
  columns), so match by example name rather than by column position, and normalize the numbers.
- **If the previous sizes genuinely cannot be found** (the release body has no bundle size data at all),
  do not guess: **ask the user how to proceed**. If the user agrees to compute them, build the examples
  at the previous tag and tabulate with the same method as the current version:
  1. Ensure a clean tree (stash if needed), then `git checkout v<previous>`.
  2. Build core and examples there (steps from [6](#6-bundle-size-current-version): nvm, then
     `npm run build -w packages/core`, then `./scripts/build-all-examples.bash`). Do not pass
     `--fail-at-end` there: the tags released before the size budgets do not need it, and their script
     does not know the option (some versions reject unknown options).
  3. Return to the branch (and `git stash pop`), then run `./scripts/build-all-examples.bash
     --list-size-only` to tabulate the previous `dist/` with the **current** script. This matters
     because the old script may predate the size-table output; `--list-size-only` reads the `dist/`
     left on disk without rebuilding.
  4. Rebuild core and examples at the branch afterwards, since the previous build left `lib/` and
     `dist/` at the old version.
  In the future this will be handled by the `compare-examples-size` skill (see
  [PR #1074](https://github.com/maxGraph/maxGraph/pull/1074)); prefer it once merged.
- **External repo table** ("Examples in the `maxgraph-integration-examples` repository"): leave it
  empty and **ask the user** whether they want to complete it (for now they do it manually).

### 8. Update the draft

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

- No unhandled `TODO`/placeholder left except the intentional manual fields (screenshots,
  external-repo table).
- The one-line summary is drafted and approved by the user.
- Each documented feature links to a real `#PR`.
- The `## Resources` section and everything after it is preserved unchanged in the draft.
- The release date on the draft's first line is preserved (never overwritten by the placeholder).
