---
description: Internal tools to help during maxGraph development.
---

# Development tools

This page documents internal scripts and helpers used during maxGraph development. They are not part of the public API of the library: they are intended for maintainers and contributors who need to measure, inspect, or compare the impact of their changes on the project.

## Build all examples

The script `scripts/build-all-examples.bash` builds every example shipped in the repository (`packages/ts-example*` and `packages/js-example*`) and reports the resulting bundle sizes.

It is useful to:

- give the size of the `maxGraph` chunk for all examples;
- visualize the tree-shaking effect of the examples, and observe how much each example reduces the size of the `maxGraph` chunk.

### Prerequisites

The `@maxgraph/core` package must be built first so that the examples pick up the latest changes:

```bash
npm run build -w packages/core
```

### Usage

Run from the repository root:

```bash
./scripts/build-all-examples.bash
```

The script prints, for each example:

- the size of every `*.js` file produced under `dist/`;
- a Markdown summary table with the bundle sizes of every example (with an empty "before" column intended to be filled in manually when comparing snapshots);
- a CSV summary (one header line listing example names, one value line listing sizes in kB), convenient to copy into a spreadsheet.

To skip the build step and only display the sizes from an existing `dist/` output:

```bash
./scripts/build-all-examples.bash --list-size-only
```

## Comparing the size of the maxGraph chunk between git revisions

Comparing the size of the `maxGraph` chunk between git revisions helps track the evolution of the codebase, the reduction of the size of `maxGraph`, and the impact of tree-shaking improvements over time.

It is also useful to:

- enrich pull request descriptions with a concrete measurement of the impact of a code change on the bundle size;
- support release notes, where the resulting table can demonstrate positive changes or warn readers about negative impacts on the bundle size.

Two interchangeable entry points are provided:

- a **Claude Code skill** named `compare-examples-size`, intended for users of Claude Code. It produces a Markdown table comparing the size of the `maxGraph` chunk for all examples between two git revisions (commit SHAs, branch names, or tag names).
- the underlying **bash script**, available for direct use at `.claude/skills/compare-examples-size/scripts/compare-examples-size.bash`. The skill is a thin wrapper around this script, so contributors who do not use Claude Code can still run the comparison from any shell.

### Usage

Run from the repository root, passing two git references in any order:

```bash
.claude/skills/compare-examples-size/scripts/compare-examples-size.bash <ref-1> <ref-2>
```

For example, to compare the current `main` branch against the `v0.23.0` release tag:

```bash
.claude/skills/compare-examples-size/scripts/compare-examples-size.bash main v0.23.0
```

For each of the two references, the script checks out the revision, runs `npm ci`, builds `@maxgraph/core`, and runs `scripts/build-all-examples.bash` to capture the bundle sizes. It then prints a Markdown table to stdout (build logs go to stderr) with one row per example and the following columns: example name, bundle size at the revision in column 1, bundle size at the revision in column 2, delta in kB, and delta in %.

The column order is normalized by the commit date so that the revision with the earlier commit date is always in column 1 and the later one in column 2, regardless of the argument order. The delta is therefore always `column 2 − column 1`.

Below the table, the script prints a short note stating how the two revisions are related, as computed by `git merge-base --is-ancestor`. This matters when reading the sign of the delta: it is chronological only when one revision is an ancestor of the other. Two revisions that have diverged, which is the usual case for a feature branch that has fallen behind its base, produce a delta that is merely the difference between two independent states. A branch behind its base shows a positive delta simply because it lacks the size reductions the base has since gained.

The working tree must be clean before running. The original branch is restored automatically at the end of the run, including on Ctrl-C or build failure.

### Reusing sizes already measured

Building both revisions takes several minutes. When the sizes of one revision are already known, they can be passed to the script, which then builds only the other revision:

```bash
# reuse the sizes of <ref-1>, build only <ref-2>
.claude/skills/compare-examples-size/scripts/compare-examples-size.bash --from-sizes sizes.md <ref-1> <ref-2>

# reuse the sizes of <ref-2>, build only <ref-1>
.claude/skills/compare-examples-size/scripts/compare-examples-size.bash --to-sizes sizes.md <ref-1> <ref-2>
```

Both revisions are still required, even the one that is not built, because they determine the column labels and the ancestry check. Only one side may be supplied: the script refuses to run without at least one revision to build.

The file may be a Markdown table produced by a previous run of the script, the Markdown table printed by `scripts/build-all-examples.bash`, or its 2-line CSV output. Values are accepted bare (`303.69`), with the unit (`303.69 kB`), or as `N/A`.

A table produced by a previous run holds two size columns, so the intended one must be named with `--sizes-column`, either by a substring of its header or by its 1-based index among the size columns:

```bash
.claude/skills/compare-examples-size/scripts/compare-examples-size.bash \
  --from-sizes previous-comparison.md --sizes-column main main my-branch
```

Reused sizes are only comparable to freshly built ones if they were measured with the same Node version and the same dependencies; nothing in the file records that, so it is up to the caller to check. As a safety net, when the selected column header embeds a short SHA, as the script's own tables do, the script verifies it against the revision given on the command line and aborts on a mismatch rather than emitting a table that pairs sizes with the wrong revision.
