---
name: pr-bundle-size
description: "Build the bundle size comparison table of a maxGraph pull request from the CI logs, without building anything locally. Use when the user asks for the bundle size impact of a pull request, for instance a bundler upgrade or a change in @maxgraph/core."
disable-model-invocation: true
argument-hint: "<pr-number>"
---

# Bundle size comparison of a pull request

Compare the sizes of the examples built by the CI run of the pull request with those of the `main` commit that run
was based on. Read [`.claude/shared/bundle-sizes/README.md`](../../shared/bundle-sizes/README.md) first: it explains
where the sizes come from and holds the reading rules that apply to the explanation below the table.

All the commands below use the shared script, from the root of the repository:

```bash
S=.claude/shared/bundle-sizes/ci-bundle-sizes.sh
```

## 1. Find the run of the pull request

```bash
$S pr-run <pr>     # <run> <status> <conclusion>
```

- **Nothing printed**: no `build.yml` run on the head of the pull request. Check whether it changes a file that
  triggers the workflow:
  ```bash
  git fetch origin main "pull/<pr>/head:refs/remotes/origin/pr/<pr>"
  $S relevant-files "$(git merge-base origin/main origin/pr/<pr>)" origin/pr/<pr>
  ```
  If it prints nothing, the sizes are unchanged by construction: say so and stop, there is no table to build.
  Otherwise the run is not started yet, or was skipped: tell the user.
- **Status other than `completed`**: the run is in progress, tell the user and stop.
- **Conclusion `failure`**: the sizes may still be there, the examples are built with `--fail-at-end`. Continue, and
  check the log of the failed job: when an example exceeds its size budget, report it with the table.

## 2. Find the reference run on main

```bash
$S pr-base <run>   # <merge sha> <base sha>
git fetch origin main
$S main-run <base sha>   # <main run> <main run sha>
```

The reference is the first parent of the merge commit that the run built, not the merge base of the branch. When the
pull request was updated since the run, the reference moves with the next run: always take both from the same run.

`main-run` fails when the latest successful run of `main` before the base is separated from it by commits changing a
file that triggers `build.yml`. Report the files it lists and stop: no valid reference exists, rebasing the pull
request or waiting for a run on `main` gives one.

## 3. Read the sizes and the toolchain

```bash
$S csv <main run> > <scratchpad>/main.csv
$S csv <run> > <scratchpad>/pr.csv
$S toolchain <main run sha> <merge sha>
```

`toolchain` lists the bundlers, minifiers and Node versions that differ between the reference and the merge commit.
Any line means the toolchain changed in the pull request, which matters for the explanation.

## 4. Build the table

```bash
$S table "main <first 9 chars of the main run sha>" <scratchpad>/main.csv <scratchpad>/pr.csv
```

The table has one row per example, named as in the CSV, with sizes in kB:
`| Example | main <sha> | PR | Δ kB | Δ % |`. An example missing on one side shows `N/A`.

## 5. Report

Print the table, ready to paste into the description of the pull request, followed by a short explanation that
follows the reading rules of the shared README:

- the changes, the largest first, in kB;
- the toolchain changes found in step 3, if any, stated as facts: an upgrade of a bundler or a minifier is part of
  the difference, so never attribute the whole change to `maxGraph`;
- the run links, `https://github.com/maxGraph/maxGraph/actions/runs/<run>`, for both sides;
- a failed size budget, if any, with the example and the limit to update.

Do not edit the pull request yourself. When the user asks to add the table to its description, follow
`.claude/rules/git/pull-requests.md` to keep the blocks added by bots.
