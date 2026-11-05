# Template and Labels of a New Issue

Applies whenever an issue is created with Claude, for instance with `gh issue create`. The body always follows an issue
template; the metadata depends on whether the user creating it has write access to the repository.

## Always write the body with the matching template

Pick the template matching the request in `.github/ISSUE_TEMPLATE/`, and write the body with its sections, in their
order: for a feature request, the problem, the solution, the alternatives and the additional context. Do it whatever
the access of the user: the sections are what readers and the triage expect to find, and an issue written by a
maintainer is read the same way as any other.

Write access only changes the metadata, see below: the title prefix, the labels, the Issue Type and the milestone.

## With write access: set the Issue Type, and no label

Such an issue starts already triaged, so it gets what the triage leaves on an accepted issue: an Issue Type, and no
label.

- Set only the Issue Type (`Bug`, `Enhancement`, `Task`, `Documentation`, `Epic`) with `gh issue create --type`.
- Add no `triage` label: it marks an issue that no maintainer has reviewed yet, which is not the case here.
- Add no kind label such as `bug`, `enhancement`, `chore` or `documentation`: the issue templates add them to record
  what the author thinks the issue is, and the triage replaces them with the Issue Type.
- Do not propose labels either. The milestone is still proposed, see [`milestones.md`](./milestones.md).
- Drop the title prefix of the template, such as `[FEAT]`: the Issue Type already says what the issue is.

The issue templates add both kinds of label by themselves, so do not copy the `labels:` of the template into
`gh issue create` along with its structure.

## Without write access: follow the issue template, metadata included

Everybody else also keeps the metadata of the template: its title prefix and its labels. The `triage` label and the
kind label it declares are what the triage starts from. Propose neither an Issue Type nor a milestone: setting them is
the job of the triage.

## Check the access, do not assume it

Read the permission of the account `gh` is logged in with, rather than guessing it from the name of the user:

```bash
gh api repos/maxGraph/maxGraph --jq '.permissions.push'
```

`true` means write access.

See the [issue triage page](../../../packages/website/docs/development/issue-triage.md) for what an accepted issue
carries and why.
