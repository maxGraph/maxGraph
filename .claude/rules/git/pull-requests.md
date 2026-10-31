# Pull Request Descriptions

Applies whenever the description of an existing pull request is updated, for instance with
`gh pr edit <N> --body-file <file>`, or content is added to an existing pull request.

## Keep what the bots added

Bots insert their own blocks into the description of a pull request. `--body-file` and `--body` replace the whole
description, so writing a new text silently deletes these blocks.

Before updating a description, fetch the current one:

```bash
gh pr view <N> --json body -q .body
```

Then carry over every block inserted by a bot, unchanged and at its place, and replace only the text written by
people. This concerns at least the CodeRabbit summary, delimited by these two markers:

```markdown
<!-- This is an auto-generated comment: release notes by coderabbit.ai -->
<!-- end of auto-generated comment: release notes by coderabbit.ai -->
```

## Comment on a pull request opened by a bot, do not edit its description

The description of a pull request opened by a bot, such as Dependabot, belongs to that bot. Dependabot rewrites the
whole description of a grouped update in place each time the group changes, which silently drops anything added to it:
the description of a webpack group update was rewritten four times. A single dependency update is not edited, it is
closed and replaced by a new pull request when a newer version comes out. Post the addition as a comment instead, with
`gh pr comment <N> --body-file <file>`, and measure again on the replacing pull request when there is one.

Check the author rather than guessing it from the branch name:

```bash
gh pr view <N> --json author -q '.author.login,.author.is_bot'
```

`is_bot` at `true` means a bot opened it.
