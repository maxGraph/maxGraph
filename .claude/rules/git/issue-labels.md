# Labels of a New Issue

Applies whenever an issue is created with Claude, for instance with `gh issue create`. What to set depends on whether
the user creating it has write access to the repository.

## With write access: set the Issue Type, and no label

Such an issue starts already triaged, so it gets what the triage leaves on an accepted issue: an Issue Type, and no
label.

- Set only the Issue Type (`Bug`, `Enhancement`, `Task`, `Documentation`, `Epic`) with `gh issue create --type`.
- Add no `triage` label: it marks an issue that no maintainer has reviewed yet, which is not the case here.
- Add no kind label such as `bug`, `enhancement`, `chore` or `documentation`: the issue templates add them to record
  what the author thinks the issue is, and the triage replaces them with the Issue Type.
- Do not propose labels either. The milestone is still proposed, see [`milestones.md`](./milestones.md).

The issue templates add both kinds of label by themselves, so do not copy the `labels:` of a template into
`gh issue create` when using its structure for the body.

## Without write access: follow the issue template

Everybody else follows the template matching the request, in `.github/ISSUE_TEMPLATE/`, labels included: the
`triage` label and the kind label it declares are what the triage starts from. Propose neither an Issue Type nor a
milestone: setting them is the job of the triage.

## Check the access, do not assume it

Read the permission of the account `gh` is logged in with, rather than guessing it from the name of the user:

```bash
gh api repos/maxGraph/maxGraph --jq '.permissions.push'
```

`true` means write access.

See the [issue triage page](../../../packages/website/docs/development/issue-triage.md) for what an accepted issue
carries and why.
