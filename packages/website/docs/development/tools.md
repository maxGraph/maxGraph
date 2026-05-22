---
description: Internal tools to help during maxGraph development.
---

# Development tools

This page documents internal scripts and helpers used during maxGraph development. They are not part of the public API of the library — they are intended for maintainers and contributors who need to measure, inspect, or compare the impact of their changes on the project.

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
- a markdown summary table with the bundle sizes of every example (with an empty "before" column intended to be filled in manually when comparing snapshots);
- a CSV summary (one header line listing example names, one value line listing sizes in kB) — convenient to copy into a spreadsheet.

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

- a **Claude Code skill** named `compare-examples-size`, intended for users of Claude Code. It produces a markdown table comparing the size of the `maxGraph` chunk for all examples between two git revisions (commit SHAs, branch names, or tag names).
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

For each of the two references, the script checks out the revision, runs `npm ci`, builds `@maxgraph/core`, and runs `scripts/build-all-examples.bash` to capture the bundle sizes. It then prints a markdown table to stdout — build logs go to stderr — with one row per example and the following columns: example name, bundle size at the older revision, bundle size at the newer revision, delta in kB, and delta in %.

The column order is normalized by commit date so that the older revision is always in column 1 and the newer one in column 2, regardless of the argument order. The delta is therefore always `newer − older`: a positive delta means the bundle grew between the two revisions.

The working tree must be clean before running. The original branch is restored automatically at the end of the run, including on Ctrl-C or build failure.
