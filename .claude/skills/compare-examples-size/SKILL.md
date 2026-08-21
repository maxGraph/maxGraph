---
name: compare-examples-size
description: Compare maxGraph example bundle sizes between two git references (commit SHA, branch, or tag) and emit a markdown table with deltas in kB and %. Also accepts already-measured sizes for one of the two refs (a table or CSV from an earlier run) and then builds only the other ref. Use when the user asks to compare bundle sizes, measure the size impact of a change or release, diff example sizes between branches/tags/commits, reuse sizes they already have for one side, or invokes the /compare-examples-size slash command with two refs.
---

# Compare Examples Size

## Overview

Builds the maxGraph examples at two git references and produces a markdown table comparing per-example bundle sizes. Useful to assess the size impact of a PR, refactor, or release.

Each build takes several minutes, so the script also accepts sizes that were already measured for one of the two refs. It then builds only the other ref, halving the runtime.

## When to use

Trigger this skill on requests like:
- "compare bundle sizes between `main` and my branch"
- "what's the size impact of this branch?"
- "compare example sizes between `v1.2.0` and `main`"
- "here is the table from my last run on `main`, compare it with my branch"
- "I already have the sizes for the release, just measure `main`"
- `/compare-examples-size <from> <to>`

## Inputs

Two git references, `<from>` and `<to>`. Each can be:
- a commit SHA (full or short)
- a branch name (HEAD of the branch is used)
- a tag name

If the user only provides one ref, ask for the second. Do not assume `HEAD` silently. If the user provides none, ask for both.

Optionally, already-measured sizes for **one** of the two refs. See [Reusing sizes already measured](#reusing-sizes-already-measured). Both sides cannot be supplied at once: the script requires at least one ref to build, and refuses the combination.

## Workflow

Run the bundled script with the two refs:

```bash
.claude/skills/compare-examples-size/scripts/compare-examples-size.bash <from> <to>
```

The script:
1. Verifies the working tree is strictly clean (`git status --porcelain` empty). Aborts with an error if not.
2. Resolves both refs via `git rev-parse --verify`. Aborts on unknown refs.
3. Normalizes the column order: the commit with the **earlier** committer timestamp becomes column 1, the **later** one becomes column 2, regardless of the order the user passed them on the CLI. A note is printed to stderr if a swap happened. Δ is therefore always `column 2 − column 1`.
4. Classifies the relationship of the two refs (`identical`, `ancestor`, `descendant`, or `diverged`) with `git merge-base --is-ancestor`, and reports it on stderr right away, before the builds. This decides whether the sign of Δ means anything chronologically, so it is settled up front rather than left to the reader.
5. Saves the current branch (or SHA if detached) and installs a `trap` so the original ref is restored on any exit, including build failures or Ctrl-C. An interrupted run exits with a non-zero status (130 on Ctrl-C, 143 on `SIGTERM`), so a caller can tell it apart from a successful comparison.
6. For each ref whose sizes were **not** supplied, in column order:
   - `git checkout <ref>`
   - `npm ci` if `package-lock.json` differs from the previous ref (always runs on first ref to guarantee fresh deps). `npm ci` is used instead of `npm install` so the lock file is never rewritten, keeping the working tree clean across the checkout.
   - `npm run build -w packages/core`
   - `./scripts/build-all-examples.bash`, capturing its trailing CSV (header line + values line) into a temp file.
7. Parses both sides, joins by example name, and prints the markdown table to stdout, followed by a blockquote note giving the ancestry relationship and the provenance of any reused sizes.
8. Restores the original ref and removes the temp dir.

Build logs go to stderr. Stdout carries the table and its note, so it can be redirected to a file or piped directly.

## Reusing sizes already measured

When the user already has sizes for one of the two refs, pass them instead of rebuilding that side:

```bash
# reuse the sizes of <from>, build only <to>
compare-examples-size.bash --from-sizes <file> <from> <to>

# reuse the sizes of <to>, build only <from>
compare-examples-size.bash --to-sizes <file> <from> <to>

# when <file> holds several size columns, name the one to read
compare-examples-size.bash --from-sizes <file> --sizes-column <name-or-index> <from> <to>
```

Both refs are still required, even the one that is not built: they are what the ancestry check and the column labels are computed from.

### Accepted file formats

The parser auto-detects, so no conversion is needed:
- the markdown table printed by a previous run of this script (has two size columns, so `--sizes-column` is required);
- the markdown table printed by `scripts/build-all-examples.bash` (its `before` column is empty by design, so the populated `now` column is detected on its own);
- the 2-line CSV printed by `scripts/build-all-examples.bash` (names line, then values line).

Cell values may be bare (`303.69`), carry the unit (`303.69 kB`), or be `N/A`. If the user pastes a table into the conversation rather than pointing at a file, write it verbatim to a scratch file and pass that path.

### Confirm the ref before running

**Always confirm with the user which ref the supplied sizes were measured at, and never infer it silently.** Reused numbers are indistinguishable from freshly built ones in the output, so a wrong pairing produces a table that looks authoritative and is wrong.

If the file is a previous run's table, its column headers contain the label and short SHA (`main 34a0d3c (kB)`). Use that as the suggestion when asking, rather than as the answer. The script cross-checks it: when the chosen column header embeds a SHA that is not a prefix of the resolved ref, it aborts and names both commits. That guard only fires when a SHA is present in the header, so it is a safety net, not a substitute for asking.

Also confirm the sizes were measured with the same toolchain: a different Node version or a dependency bump between the two measurements makes the comparison meaningless, and nothing in the file records that.

### Ambiguous columns

A previous run's table holds two size columns, so the script aborts and lists the candidates with their indices. Ask the user which one applies, or infer it from the ref they confirmed, then re-run with `--sizes-column`. It accepts a header substring (`--sizes-column main`) or a 1-based index among the size columns (`--sizes-column 1`). Delta columns are never candidates.

## Output format

GitHub-flavored markdown table on stdout:

```
| Example | <older-label> <older-short-sha> (kB) | <newer-label> <newer-short-sha> (kB) | Δ kB | Δ % |
```

- Column 1 is always the commit with the **earlier** timestamp, column 2 the **later** one, even if the user passed them in the reverse order on the CLI.
- `<label>` is the branch or tag name the user supplied. If the user supplied a raw SHA, the label is omitted and only the short SHA appears.
- `Δ kB` is signed (`+` or `-`) and equals `column 2 − column 1`.
- `Δ %` is signed and uses the column 1 size as the denominator.
- Rows are sorted alphabetically by example name.
- `N/A` is used when an example exists at one ref but not the other.

The table is followed by a blockquote note carrying the context needed to read it: the ancestry relationship of the two refs, and, when one side was supplied, which column was reused and from which file. Keep that note with the table when passing it on, since the table alone does not say whether a column was rebuilt.

## Analysis

After the table, report the comparison in prose. Cover:

- **The headline**: which examples moved, by how much, and in which direction. Lead with the largest absolute Δ in kB, not the largest percentage, since a big percentage on a small bundle is usually noise.
- **The sign's meaning**, taken from the ancestry note. See [Reading the sign of Δ](#reading-the-sign-of-δ) below. This is not optional: the same `+80 kB` means "this change added 80 kB" under `ancestor` and "this branch is missing 80 kB of reductions its base already has" under `diverged`.
- **Provenance**, whenever a side was supplied rather than built.
- **`N/A` rows**, which mean an example exists at one ref and not the other, so it was added or removed rather than resized.

Do not attribute a delta to a specific commit, dependency, or refactor unless the diff was actually inspected. Sizes alone establish that something moved, never why. If the user wants the cause, offer to look at `git log`/`git diff` between the refs as a separate step.

### Reading the sign of Δ

The script classifies this for you and states it in the note under the table. The four cases:

| Ancestry | Meaning of a positive Δ |
| --- | --- |
| `identical` | Both columns are the same commit; every Δ should be 0. |
| `ancestor` | Column 1 precedes column 2, so the bundle grew as history advanced. |
| `descendant` | Column 2 is the ancestor despite its later timestamp (rebase or amended date), so the bundle shrank as history advanced. |
| `diverged` | Nothing chronological; the difference between two independent states. |

The sign is only chronological when one ref is an ancestor of the other. In that case a positive Δ does mean the
bundle grew as the history advanced.

When the two refs have **diverged** (neither is an ancestor of the other, which is the normal case for a feature
branch that has fallen behind its base), the timestamp ordering carries no before/after meaning, and a positive Δ
does **not** mean the size grew over time. A branch based on an old `main` will show a large positive Δ against a
newer `main` purely because it lacks the size reductions `main` has since gained.

Check the relationship before interpreting the sign:

```bash
git merge-base --is-ancestor <ref1> <ref2>   # exit 0 means ref1 is an ancestor of ref2
```

If the refs have diverged, report the Δ as the difference between the two states and say explicitly that it is not a
chronological progression. Do not describe it as growth or as a regression introduced by either ref. When the intent
was to measure a branch's own impact, the right comparison is the branch against its merge base
(`git merge-base <branch> main`), or the branch rebased onto its base.

## Prerequisites and constraints

- The script must run from inside the maxGraph repository (it uses `git rev-parse --show-toplevel`).
- The active Node.js version should match `.nvmrc`. If `nvm` is available, the user should run `nvm use` before invoking the skill.
- The working tree must be clean. Do **not** auto-stash. If the user has uncommitted work, surface the error and ask them how to proceed.
- The script does a full `npm run build -w packages/core` + full examples build per ref that has to be built, so it takes several minutes for two refs and roughly half that when one side's sizes are supplied. Warn the user before launching if this is the first run in a session, and mention that supplying sizes for one side halves the wait when they have them.

## Failure handling

- **Dirty working tree**: report the offending files (`git status --short`) and stop.
- **Unknown ref**: report which ref failed to resolve and stop.
- **Ambiguous size column** (exit 1, before any build): the supplied file holds several size columns. The error lists them with indices. Ask the user which one, then re-run with `--sizes-column`.
- **SHA mismatch between the supplied column and the ref** (exit 1, before any build): the reused sizes describe a different commit than the ref given on the command line. Do not work around it by picking another column at random. Ask the user which ref those sizes belong to, and re-run with the correct ref.
- **Unparseable sizes file** (exit 1): no column holds numbers, or a CSV has mismatched header and value counts. Report the path and the parser's message; ask for the file in one of the accepted formats.
- **Both sides supplied** (exit 2): at least one ref must be built. Ask which side to measure.
- **Build failure on a ref**: the `trap` restores the original ref before exiting. Report which ref failed and at which step (`npm ci`, core build, or examples build). Do not retry automatically.
- **Original ref restoration fails on exit**: surface the warning printed by the script and tell the user to `git checkout <original-ref>` manually.
- **Forced kill (SIGKILL) mid-run**: bash traps cannot run on SIGKILL, so the user can be left in detached HEAD. To detect this, the script writes a lock file named `compare-examples-size.lock` in the common git dir (`git rev-parse --git-common-dir`, usually `.git/`) containing the original ref before any checkout; the `trap` removes it on graceful exit. If the script aborts via SIGKILL, the lock survives. The next invocation will refuse to start and print the original ref to restore. After running `git checkout <that-ref>`, the user must remove the lock file as instructed.
