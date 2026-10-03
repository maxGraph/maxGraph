# Analyses

This directory records analyses made before a decision: whether a change is feasible, what it would gain, what it
would cost, and what it would break. They answer "is it worth starting?" for work whose cost or benefit is not obvious
from the code.

An analysis is not a decision. When it leads to one, the decision is recorded in an
[Architecture Decision Record](../adr/README.md) that links back to the analysis.

## Conventions

- One question per file, named `NNN-short-title.md`, numbered sequentially and never renumbered.
- The header states the date, the question, and the **analysis basis**: the commit every file and line reference points
  to. Figures go stale as the code moves, so the basis is what makes them checkable later.
- Every figure says how it was obtained: `measured` on a real build, `derived` from measured values, or `estimated`
  from an assumption that no build has verified. State which example and which bundler a size was measured on.
- End with a recommendation and, when the answer is not "no", an action plan whose steps are useful on their own.
- An analysis is not rewritten when the code or the decision moves on. A new analysis replaces it, and the old one
  links to its successor.
- Line width 120, consistent with the rest of the repository.

## Index

| Analysis | Title | Date | Recommendation |
|---|---|---|---|
| [001](001-extract-SelectionMixin-to-plugin.md) | Extract `SelectionMixin` into a plugin | 2026-10-03 | Not as a standalone project, only as part of the mixin to plugin conversion |
