---
name: test
description: "Run tests for the core package. Use when the user asks to run tests."
disable-model-invocation: true
argument-hint: "[test file path or --coverage]"
context: fork
agent: build-runner
---

# Test

Arguments: `$ARGUMENTS`

Run the command matching the arguments:

- No arguments -> `npm test -w packages/core`
- `--coverage` -> `npm test -w packages/core -- --coverage`
- A file path -> `npm test -w packages/core -- <arguments>`
- `ts-support` -> `npm test -w packages/ts-support`
- `check` -> `npm run test-check -w packages/core`

Report ONLY:
- SUCCESS or FAILURE
- Number of test suites and tests passed/failed
- If failed: the FIRST failing test (max 20 lines)
- Test duration
