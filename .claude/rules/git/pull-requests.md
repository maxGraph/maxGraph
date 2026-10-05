# Pull Request Descriptions

Applies whenever the description of an existing pull request is updated, for instance with
`gh pr edit <N> --body-file <file>`.

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
