# Bundle sizes of the examples from the CI logs

Shared by the `prepare-release` and `pr-bundle-size` skills. Read the sizes from the CI logs with
[`ci-bundle-sizes.sh`](./ci-bundle-sizes.sh), run with `--help` for its commands, and read them with the rules below.
Never build anything to get them, unless the skill offers a local fallback.

## Where the sizes come from

The `build_examples (ubuntu-24.04) / build` job of the `build.yml` workflow runs `scripts/build-all-examples.bash`,
which prints a `CSV of bundle sizes (kB)` section: a header line with the names of the examples, then a values line.
The macOS and Windows jobs print the same values. The `csv` command extracts these two lines.

- **Never pass `--branch main` to `gh run list`.** It returned old runs whose logs had expired (`HTTP 410` when reading
  them). The script filters on `headBranch` with `jq` instead.
- **The log lines are `<job>\t<step>\t<timestamp> <content>`** and the step column is `UNKNOWN STEP`, so the script
  filters on the section title, not on the step.
- **`build.yml` is path filtered.** It only runs when one of the paths of its `paths` filter changes, so a commit of
  `main` often has no run of its own. The sizes of the latest run before it are valid for it only when none of the
  commits in between changes a filtered path, which `main-run` checks with `relevant-files`. That command mirrors the
  filter of `build.yml`: update both together.
- **A run that failed on a size budget still prints the sizes**, since the examples are built with `--fail-at-end`.
  The values are real, but the growth must be checked and the budget updated, see
  `.claude/rules/tooling/bundle-size-budgets.md`.
- **A pull request run builds `refs/pull/<N>/merge`**, the merge of the pull request into `main` at the time of the
  run. Its reference is therefore the first parent of that merge commit, not the merge base of the branch, which may
  be much older. The `pr-base` command reads both from the checkout step.
- **Sizes are in kB (1000 bytes) of raw minified output**, never gzipped. The webpack examples (`js-example*`) give the
  size of the whole application, the Vite examples (`ts-example*`) the size of the `maxgraph` chunk only.

## Reading rules

Apply them to any explanation of a size change, in a pull request or in the release notes.

- **Never attribute a size change without evidence.** Sizes alone establish that something moved, never why.
  Attribute a change to a pull request only when that pull request measured it, or when the diff between the
  measurements was inspected. Otherwise describe the change without naming a cause.
- **Lead with the largest changes in kB, not in %.** A large percentage on a small bundle is usually noise.
- **Compare measurements made with the same toolchain** (Node version, bundler and dependencies). Nothing in the sizes
  records it, so a tooling change between two measurements is part of their difference, which then cannot be
  attributed to `maxGraph` alone. The `toolchain` command lists the bundlers, minifiers and Node versions that differ
  between two commits.
