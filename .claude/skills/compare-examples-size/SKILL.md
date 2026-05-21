---
name: compare-examples-size
description: Compare maxGraph example bundle sizes between two git references (commit SHA, branch, or tag) and emit a markdown table with deltas in kB and %. Use when the user asks to compare bundle sizes, measure the size impact of a change or release, diff example sizes between branches/tags/commits, or invokes the /compare-examples-size slash command with two refs.
---

# Compare Examples Size

## Overview

Builds the maxGraph examples at two git references and produces a markdown table comparing per-example bundle sizes. Useful to assess the size impact of a PR, refactor, or release.

## When to use

Trigger this skill on requests like:
- "compare bundle sizes between `main` and my branch"
- "what's the size impact of this branch?"
- "compare example sizes between `v1.2.0` and `main`"
- `/compare-examples-size <from> <to>`

## Inputs

Two git references — `<from>` and `<to>`. Each can be:
- a commit SHA (full or short)
- a branch name (HEAD of the branch is used)
- a tag name

If the user only provides one ref, ask for the second. Do not assume `HEAD` silently. If the user provides none, ask for both.

## Workflow

Run the bundled script with the two refs:

```bash
.claude/skills/compare-examples-size/scripts/compare-examples-size.bash <from> <to>
```

The script:
1. Verifies the working tree is strictly clean (`git status --porcelain` empty). Aborts with an error if not.
2. Resolves both refs via `git rev-parse --verify`. Aborts on unknown refs.
3. Normalizes the column order: the **older** commit (by committer timestamp) becomes column 1, the **newer** becomes column 2 — regardless of the order the user passed them on the CLI. A note is printed to stderr if a swap happened. Δ is therefore always `newer − older` (positive Δ = size grew over time).
4. Saves the current branch (or SHA if detached) and installs a `trap` so the original ref is restored on any exit — including build failures or Ctrl-C.
5. For each ref, in order older then newer:
   - `git checkout <ref>`
   - `npm ci` if `package-lock.json` differs from the previous ref (always runs on first ref to guarantee fresh deps). `npm ci` is used instead of `npm install` so the lock file is never rewritten — keeping the working tree clean across the checkout.
   - `npm run build -w packages/core`
   - `./scripts/build-all-examples.bash`, capturing its trailing CSV (header line + values line) into a temp file.
6. Parses both CSVs, joins by example name, and prints a markdown table to stdout.
7. Restores the original ref and removes the temp dir.

Build logs go to stderr; only the final markdown table goes to stdout, so it can be redirected to a file or piped directly.

## Output format

GitHub-flavored markdown table on stdout:

```
| Example | <older-label> <older-short-sha> (kB) | <newer-label> <newer-short-sha> (kB) | Δ kB | Δ % |
```

- Column 1 is always the **older** commit, column 2 the **newer** — even if the user passed them in the reverse order on the CLI.
- `<label>` is the branch or tag name the user supplied. If the user supplied a raw SHA, the label is omitted and only the short SHA appears.
- `Δ kB` is signed (`+` or `-`) and equals `newer − older`.
- `Δ %` is signed and uses the older size as the denominator.
- Rows are sorted alphabetically by example name.
- `N/A` is used when an example exists at one ref but not the other.

No commentary on causes of variation — just the numbers.

## Prerequisites and constraints

- The script must run from inside the maxGraph repository (it uses `git rev-parse --show-toplevel`).
- The active Node.js version should match `.nvmrc`. If `nvm` is available, the user should run `nvm use` before invoking the skill.
- The working tree must be clean. Do **not** auto-stash. If the user has uncommitted work, surface the error and ask them how to proceed.
- The script does two full `npm run build -w packages/core` + full examples build, so it takes several minutes. Warn the user before launching if this is the first run in a session.

## Failure handling

- **Dirty working tree**: report the offending files (`git status --short`) and stop.
- **Unknown ref**: report which ref failed to resolve and stop.
- **Build failure on a ref**: the `trap` restores the original ref before exiting. Report which ref failed and at which step (`npm ci`, core build, or examples build). Do not retry automatically.
- **Original ref restoration fails on exit**: surface the warning printed by the script and tell the user to `git checkout <original-ref>` manually.
- **Forced kill (SIGKILL) mid-run**: bash traps cannot run on SIGKILL, so the user can be left in detached HEAD. To detect this, the script writes a lock file at `.git/compare-examples-size.lock` containing the original ref before any checkout; the `trap` removes it on graceful exit. If the script aborts via SIGKILL, the lock survives. The next invocation will refuse to start and print the original ref to restore. After running `git checkout <that-ref>`, the user must remove the lock file as instructed.
