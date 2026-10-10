# Milestones

Applies whenever an issue or a pull request is created or edited, for instance with `gh issue create`,
`gh issue edit` or `gh pr create`.

## Set a milestone on issues only, never on pull requests

A milestone is named after the version it ships in, such as `0.26.0`, and tracks what that release contains. That is
the work item, so it belongs to the issue. The pull request implementing it is only the change, and the issue it closes
already carries the release.

- When a user with write access creates or edits an issue, propose a milestone along with the issue type, and no
  label, see [`issue-labels.md`](./issue-labels.md).
- When creating or editing a pull request, set labels only, and do not offer a milestone, even when the branch clearly
  targets a given release or adds a `@since` tag naming its version.
- An issue fixed by a pull request gets the milestone of the first release containing that pull request, also when the
  issue is closed long after, or by its author.

The release process relies on it: before a release, the maintainer looks for the issues closed as completed without a
milestone, so a missing one shows up there, see the
[release how-to](../../../packages/website/docs/development/release.md).
