---
name: ci
description: "Run the full CI validation sequence locally. Use when the user asks to validate before PR, run CI checks, or verify the build. Triggers on: ci, run ci, validate, check ci."
disable-model-invocation: true
---

# CI Validation

Launch a **sub-agent** (Agent tool) to run the full CI sequence. This keeps verbose output out of the main context.

## Sub-agent prompt

Use the Agent tool with a timeout of 600000ms (10 min):

```text
Run the full CI validation sequence from the project root, stopping at the first failure:

1. npm run build -w packages/core
2. npm run test-check -w packages/core
3. npm test -w packages/core -- --coverage
4. npm test -w packages/ts-support
5. ./scripts/build-all-examples.bash
6. npm run build -w packages/html
7. npm run check:circular-dependencies -w packages/core
8. npm run lint
9. npm run check:npm-package -w packages/core

Report ONLY:
- For each step: step number, name, SUCCESS or FAILURE
- If a step fails: the FIRST error (max 20 lines), then STOP
- Total duration
- Final verdict: ALL PASSED or FAILED at step X

Do NOT paste the full log for successful steps.
```
