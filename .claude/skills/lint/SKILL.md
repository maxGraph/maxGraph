---
name: lint
description: "Run ESLint on the project. Use when the user asks to lint or check code style."
disable-model-invocation: true
argument-hint: "[--fix]"
---

# Lint

Launch a **sub-agent** (Agent tool) to run linting. This keeps verbose lint output out of the main context.

## Sub-agent prompt

Use the Agent tool with a timeout of 180000ms:

**Command logic:**
- No arguments → `npm run lint`
- `--fix` or `fix` → `npm run lint:fix`

```
Run the command from the project root.
Wait for completion. Report ONLY:
- SUCCESS or FAILURE
- Number of errors and warnings
- If failed: the FIRST 3 errors with file:line
- Lint duration
Do NOT paste the full log.
```
