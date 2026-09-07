# Task: Record the decision and rule on the changelog

## Problem
The registration API was chosen over three alternatives and over doing nothing at all, and that reasoning would
otherwise live only in this task folder, which is not part of the repository history a future maintainer reads. Two
behaviour changes shipped alongside it also need a ruling on whether they count as breaking.

## Proposed Solution
Write an ADR recording the decision and, as importantly, what was rejected and why, so the question is not reopened
from scratch later. Then have the maintainer rule on the two changelog candidates and add an entry only for what they
consider breaking.

## Dependencies
- Task 12: the decision being recorded is the shape of that API.

## Context
- `plan.md`, step 4, sections `docs/adr/0004-*.md` and `CHANGELOG.md`.
- The conventions are in `docs/adr/README.md`, including the status field, one decision per file and sequential
  numbering. Its four existing files were added by commit `42b02cab2` and none discusses style extensibility, so this
  is ADR 0004.
- The rejected options and their costs are in `raw/06-registration-api.md`, including why doing nothing was dropped
  once the mxGraph style string path turned out to have no usable hook.
- The project changelog policy is breaking changes only, so the additive registration functions get no entry.
- The two candidates for a breaking entry: a user override of the numeric predicate is now bypassed for boolean
  properties, and the stylesheet export changes which spelling it writes.

## Success Criteria
- The ADR follows the local conventions, including the status field, and records what was rejected and why.
- The changelog contains an entry only for what the maintainer rules breaking, and nothing for the additive API.
