---
name: build
description: "Build the core package (ESM + CJS). Use when the user asks to build, compile, or rebuild."
disable-model-invocation: true
argument-hint: "[workspace]"
context: fork
agent: build-runner
---

# Build

Arguments: `$ARGUMENTS`

Run the command matching the arguments:

- No arguments or `core` -> `npm run build -w packages/core`
- `html` or `storybook` -> `npm run build -w packages/html`
- `examples` -> `./scripts/build-all-examples.bash`
- `all` -> `npm run build -w packages/core`, then `./scripts/build-all-examples.bash`, then `npm run build -w packages/html`
- Other -> `npm run build -w packages/<arguments>`

Report ONLY:
- SUCCESS or FAILURE
- If failed: the FIRST error (max 20 lines)
- Build duration
