---
name: ci
description: "Run the full CI validation sequence locally. Use when the user asks to validate before PR, run CI checks, or verify the build. Triggers on: ci, run ci, validate, check ci."
disable-model-invocation: true
context: fork
agent: build-runner
---

# CI Validation

Run the full CI validation sequence, mirroring `.github/workflows/build.yml`, stopping at the first failure:

1. `npm run build -w packages/core`
2. `npm run test-check -w packages/core`
3. `npm test -w packages/core -- --coverage`
4. `npm test -w packages/ts-support`
5. `./scripts/build-all-examples.bash`
6. `npm run build -w packages/html`
7. `npm run check:circular-dependencies -w packages/core`
8. `npm run lint`
9. `npm run check:npm-package -w packages/core`

Report ONLY:
- For each step: step number, name, SUCCESS or FAILURE
- If a step fails: the FIRST error (max 20 lines), then STOP
- Total duration
- Final verdict: ALL PASSED or FAILED at step X
