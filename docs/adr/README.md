# Architecture Decision Records

This directory records architectural decisions that are hard to infer from the code alone: why a member lives where it
lives, why an obvious refactoring was set aside, which constraint blocks a move.

## Conventions

- One decision per file, named `NNNN-title-in-kebab-case.md`, numbered sequentially and never renumbered.
- `Status` is one of `Proposed`, `Accepted`, `Superseded by ADR-NNNN`, `Deprecated`. An accepted ADR is never edited to
  reverse its decision, a new ADR supersedes it.
- Record the reasoning, not only the outcome. An ADR that states what was decided without stating what was rejected and
  why is of little use six months later.
- Line width 120, consistent with the rest of the repository.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-use-mixins-to-split-the-graph-class.md) | Use mixins to split the Graph class | Accepted, superseded in direction by 0002 |
| [0002](0002-use-plugins-for-optional-and-new-features.md) | Use plugins for optional behaviour and new features | Accepted |
| [0003](0003-move-members-out-of-abstract-graph.md) | Move members out of `AbstractGraph` | Accepted |

0001 and 0002 record the two structural approaches and why the second replaces the first. 0003 applies them to the
members still sitting in `AbstractGraph`.
