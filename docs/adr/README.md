# Architecture Decision Records

This directory records architectural decisions that are hard to infer from the code alone: why a member lives where it
lives, why an obvious refactoring was set aside, which constraint blocks a move.

## Conventions

- One decision per file, named `NNNN-title-in-kebab-case.md`, numbered sequentially and never renumbered.
- `Status` is one of `Proposed`, `Accepted`, `Superseded by ADR-NNNN`, `Deprecated`, and nothing else. An accepted ADR
  is never edited to reverse its decision, a new ADR supersedes it.
- `Superseded by ADR-NNNN` means the decision itself no longer holds. An ADR whose approach is merely no longer applied
  to new code stays `Accepted` for as long as its reasoning still explains part of the codebase. Record that shift in
  the body of the ADR, not in its status.
- Record the reasoning, not only the outcome. An ADR that states what was decided without stating what was rejected and
  why is of little use six months later.
- Line width 120, consistent with the rest of the repository.

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](0001-use-mixins-to-split-the-graph-class.md) | Use mixins to split the Graph class | Accepted |
| [0002](0002-use-plugins-for-optional-and-new-features.md) | Use plugins for optional behaviour and new features | Accepted |
| [0003](0003-move-members-out-of-abstract-graph.md) | Move members out of `AbstractGraph` | Accepted |

0001 and 0002 record the two structural approaches and why the second replaces the first. 0003 applies them to the
members still sitting in `AbstractGraph`.

0001 stays `Accepted` rather than superseded: plugins replace mixins for new code, but the mixin design still explains
a large part of the current codebase, and its recorded costs are what justify the shift.
