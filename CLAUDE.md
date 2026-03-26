# CLAUDE.md

maxGraph is a TypeScript library for displaying and interacting with vector diagrams. Successor to mxGraph, with TypeScript support, modern modular architecture, and tree-shaking.

## Build & Development

**Node.js:** ALWAYS use the version in `.nvmrc`. Run `nvm use` if using nvm.

```bash
npm install                              # Install (npm workspaces)
npm run dev -w packages/core             # Watch core
npm run dev -w packages/html             # Watch Storybook (run in parallel with core)
npm run build -w packages/core           # Build core (ESM + CJS)
npm test -w packages/core                # Run tests
npm test -w packages/core -- --coverage  # Tests with coverage
npm run lint                             # Lint all
npm run lint:fix                         # Lint with auto-fix
```

## CI Validation

Run before submitting PRs (mirrors `.github/workflows/build.yml`):

```bash
npm run build -w packages/core
npm run test-check -w packages/core
npm test -w packages/core -- --coverage
npm test -w packages/ts-support
./scripts/build-all-examples.bash
npm run build -w packages/html
npm run check:circular-dependencies -w packages/core
npm run lint
npm run check:npm-package -w packages/core
```

CI runs on ubuntu-24.04, macos-14, windows-2022.

## Architecture

Three-tier Graph class hierarchy:
- **AbstractGraph** — base abstract class with mixins, no default built-ins
- **BaseGraph** — minimal, production-optimized, requires explicit config (recommended for production)
- **Graph** — full-featured with all defaults registered (good for prototyping, not production)

Key patterns:
- **Mixins** in `packages/core/src/view/mixins/` — each has `.ts` + `.type.ts` files
- **Plugins** in `packages/core/src/view/plugins/` — loaded by `Graph` via `getDefaultPlugins()`
- **Registries** for shapes, edge styles, perimeters in `packages/core/src/view/style/`
- **XML serialization** in `packages/core/src/serialization/` (mxGraph-compatible)
- Always wrap multiple model changes in `batchUpdate()`

## Key Conventions

- See `.claude/rules/architecture/coding-practices.md` for core package rules (imports, nullish checks, logging, i18n)
- See `.claude/rules/testing/conventions.md` for test patterns
- See `.claude/rules/git/commit-conventions.md` for commit message style

## References

- CellStyle interface: `packages/core/src/types.ts`
- Graph vs BaseGraph examples: `packages/ts-example-selected-features/`
- Build output: `packages/core/lib/esm/` (ESM) and `packages/core/lib/cjs/` (CJS)
- Browser support: modern browsers (Chrome, Edge, Firefox, Safari), ES2020, no IE
