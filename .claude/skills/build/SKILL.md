---
name: build
description: "Build the core package (ESM + CJS). Use when the user asks to build, compile, or rebuild."
disable-model-invocation: true
argument-hint: "[workspace]"
---

# Build

Launch a **sub-agent** (Agent tool) to run the build. This keeps verbose build output out of the main context.

## Sub-agent prompt

Use the Agent tool with a timeout of 180000ms:

**Command logic:**
- No arguments or `core` -> `npm run build -w packages/core`
- `html` or `storybook` -> `npm run build -w packages/html`
- `examples` -> `./scripts/build-all-examples.bash`
- `all` -> `npm run build -w packages/core && ./scripts/build-all-examples.bash && npm run build -w packages/html`
- Other -> `npm run build -w packages/$ARGUMENTS`

```text
Run the command from the project root.
Wait for completion. Report ONLY:
- SUCCESS or FAILURE
- If failed: the FIRST error (max 20 lines)
- Build duration
Do NOT paste the full log.
```
