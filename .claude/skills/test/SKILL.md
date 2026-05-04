---
name: test
description: "Run tests for the core package. Use when the user asks to run tests."
disable-model-invocation: true
argument-hint: "[test file path or --coverage]"
---

# Test

Launch a **sub-agent** (Agent tool) to run tests. This keeps verbose test output out of the main context.

## Sub-agent prompt

Use the Agent tool with a timeout of 180000ms:

**Command logic:**
- No arguments → `npm test -w packages/core`
- `--coverage` → `npm test -w packages/core -- --coverage`
- A file path → `npm test -w packages/core -- $ARGUMENTS`
- `ts-support` → `npm test -w packages/ts-support`
- `check` → `npm run test-check -w packages/core`

```
Run the command from the project root.
Wait for completion. Report ONLY:
- SUCCESS or FAILURE
- Number of test suites and tests passed/failed
- If failed: the FIRST failing test (max 20 lines)
- Test duration
Do NOT paste the full log.
```
