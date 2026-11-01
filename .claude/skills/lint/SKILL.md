---
name: lint
description: "Run ESLint on the project. Use when the user asks to lint or check code style."
disable-model-invocation: true
argument-hint: "[--fix]"
context: fork
agent: build-runner
---

# Lint

Arguments: `$ARGUMENTS`

Run the command matching the arguments:

- No arguments -> `npm run lint`
- `--fix` or `fix` -> `npm run lint:fix`

Report ONLY:
- SUCCESS or FAILURE
- Number of errors and warnings
- If failed: the FIRST 3 errors with file:line
- Lint duration
