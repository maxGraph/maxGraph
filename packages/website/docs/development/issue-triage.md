---
description: Explain how maintainers triage the new issues of maxGraph.
---

# Issue Triage

This page explains how maintainers with write access to the repository qualify the new issues before they are worked on.

## Why triage is needed

An issue created from a template is a first report, not a ready-to-implement task. It often lacks what is needed to act on it: a reproduction, the maxGraph version, the expected behavior, or the reason behind a feature request. Some issues turn out to be usage questions, duplicates, or behaviors that are already fixed.

Starting to work on such an issue wastes time on guesses, and leaves the backlog full of items that nobody can pick up. Triage makes sure that every open issue that has passed it is understood, valid and actionable.

The triage is currently done manually. In the future, all these tasks could be assisted by, or delegated to, an automated solution such as a GitHub App or an agent.

## What the templates set

Every [issue template](https://github.com/maxGraph/maxGraph/tree/73e7ce0b76287fddaa2eff9a53fa03065213f874/.github/ISSUE_TEMPLATE) adds two labels to the issue:

- `triage`, which marks the issue as not reviewed yet,
- a label giving the kind of request chosen by the author:

| Template              | Label           |
|-----------------------|-----------------|
| Bug report            | `bug`           |
| Feature request       | `enhancement`   |
| Technical request     | `chore`         |
| Documentation request | `documentation` |

These labels reflect what the author thinks the issue is. They are temporary and are replaced during triage.

## Lifecycle of an issue

1. **To triage**: the issue has the `triage` label. A maintainer reviews it.
2. **Waiting for information**: the issue is incomplete. The maintainer asks the author for the missing details in a comment and adds the `waiting for author` label. The issue keeps the `triage` label until it is accepted or closed.
3. **Ready for implementation**: the issue is valid. The labels are removed and an Issue Type is set, see [Accept the issue](#accept-the-issue).
4. **Question**: the issue is a usage question rather than a request, see [Handle a question](#handle-a-question).
5. **Rejected**: the issue is closed without being implemented, see [Close the issue](#close-the-issue).

## Review the issue

Read the issue and check that it can be acted on. For a bug, it must be reproducible, ideally with a minimal example and the maxGraph version. For a feature or a technical request, the need must be clear.

When something is missing, ask for it in a comment, add the `waiting for author` label and wait for the author's answer. Remove the label once they answer. Without an answer after 30 days, the issue can be closed, see [Close the issue](#close-the-issue).

## Close the issue

Close the issue when:

- the requested information was not provided within 30 days,
- it is invalid,
- it duplicates another issue,
- it is already fixed or implemented.

Before closing, add a comment explaining why, so that the author and later readers understand the decision. Add the `invalid` label if the issue is invalid. For a duplicate or an issue already fixed, add the `duplicate` label and link, in the comment, to the original issue, or to the pull request or commit that fixed the problem when there is no such issue.

Always choose the close reason from the dropdown next to the **Close issue** button:

- `Close as not planned` when the information was not provided or the issue is invalid,
- `Close as duplicate` for a duplicate or an issue already fixed.

Never keep the default reason, `Close as completed`. It tells readers that the issue was fixed or implemented, and is set when the implementation of an accepted issue is merged, not during triage.

See [Closing an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/administering-issues/closing-an-issue) in the GitHub documentation.

## Handle a question

When the issue is in fact a usage question, either:

- add the `question` label and answer it in the issue,
- or convert it to a discussion, which is where the questions belong. See [Converting an issue to a discussion](https://docs.github.com/en/discussions/managing-discussions-for-your-community/moderating-discussions#converting-an-issue-to-a-discussion) in the GitHub documentation.

## Accept the issue

When the issue is valid:

1. Remove the `triage` label and the label set by the template.
2. Set the Issue Type, see [Adding or changing the issue type](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/editing-an-issue#adding-or-changing-the-issue-type) in the GitHub documentation.
3. Optionally, add `good first issue` if the issue suits a newcomer, or `help wanted` if contributions are welcome.

:::info Rule
An issue that has passed triage is characterized by its **Issue Type**, not by a label. Set it when the issue is accepted, not before.
:::

The Issue Types available in the maxGraph organization are:

| Issue Type      | Use it for                                           |
|-----------------|------------------------------------------------------|
| `Bug`           | An unexpected problem or behavior                    |
| `Enhancement`   | A request, idea, or new functionality                |
| `Documentation` | A documentation fix, improvement, reorganization     |
| `Task`          | A specific piece of work, such as a technical change |
| `Epic`          | A broad topic split into smaller, actionable issues  |

The Issue Type usually follows the label set by the template, the `chore` label of a technical request becoming the `Task` type. It may differ when the review shows otherwise: a bug report can turn out to be an enhancement, for example.
