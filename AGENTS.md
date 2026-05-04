# AGENTS.md

## maxGraph AI Agent Guide

This document provides essential knowledge for AI coding agents to be productive in the maxGraph codebase. It summarizes architecture, workflows, and project-specific conventions. For deeper details, see `CLAUDE.md`, `README.md`, and referenced files.

---

### 1. Architecture Overview
- **Core Library**: TypeScript, modular, tree-shakable. Main logic in `packages/core/src/`.
- **Graph Hierarchy**: Three main classes:
  - `AbstractGraph`: Abstract base, mixin-based, no built-ins.
  - `BaseGraph`: Minimal, production-optimized, explicit config (recommended for production).
  - `Graph`: Full-featured, all defaults/plugins registered (for prototyping).
- **Key Patterns**:
  - **Mixins**: `packages/core/src/view/mixin/` (`.ts` + `.type.ts` per mixin)
  - **Plugins**: `packages/core/src/view/plugin/`, loaded by `Graph` via `getDefaultPlugins()`. New plugins follow the `*Plugin.ts` naming; some legacy files still use `*Handler.ts` and will be renamed later.
  - **Registries**: Edge styles, markers, perimeters in `packages/core/src/view/style/`; shape registry in `packages/core/src/view/shape/`
  - **Serialization**: XML (mxGraph-compatible) in `packages/core/src/serialization/`
  - **Batch Updates**: Always wrap multiple model changes in `batchUpdate()`

### 2. Developer Workflows
- **Node.js**: Always use version in `.nvmrc` (`nvm use`)
- **Install**: `npm install` (uses npm workspaces)
- **Build Core**: `npm run build -w packages/core` (ESM + CJS)
- **Watch Core**: `npm run dev -w packages/core`
- **Run Storybook**: `npm run dev -w packages/html`
- **Test**: `npm test -w packages/core` (coverage: add `-- --coverage`)
- **Lint**: `npm run lint` (auto-fix: `npm run lint:fix`)
- **CI Validation**: Run all before PR:
  - `npm run build -w packages/core`
  - `npm run test-check -w packages/core`
  - `npm test -w packages/core -- --coverage`
  - `npm test -w packages/ts-support`
  - `./scripts/build-all-examples.bash`
  - `npm run build -w packages/html`
  - `npm run check:circular-dependencies -w packages/core`
  - `npm run lint`
  - `npm run check:npm-package -w packages/core`

### 3. Project-Specific Conventions
- **TypeScript**: Strict types, no implicit any. Use object references, not strings, for API calls.
- **Mixins/Plugins**: Add new features via mixins or plugins, not by modifying core classes directly.
- **Registries**: Register only required shapes/styles for tree-shaking (see `ts-example-selected-features`).
- **Testing**: Use Jest. Test patterns in `.claude/rules/testing/conventions.md`.
- **Commits/PRs**: Follow `.claude/rules/git/commit-conventions.md` for commit messages. PRs should run full CI.
- **Documentation**: Update `README.md` and `CLAUDE.md` for major changes. Use concise, accurate docs.

### 4. Examples & Integration
- **Examples**: See `packages/ts-example*` and `packages/js-example*` for integration patterns:
  - With/without defaults, feature selection, headless Node.js, XML import/export.
- **Storybook**: `packages/html/stories/` for feature demos (JS/TS, migrating to TS).
- **Website**: Built with Docusaurus (`packages/website`). External resources must be copied to `generated/` before build.

### 5. References
- **CellStyle interface**: `packages/core/src/types.ts`
- **Graph vs BaseGraph**: `packages/ts-example-selected-features/`
- **Build output**: `packages/core/lib/esm/`, `packages/core/lib/cjs/`
- **Release process**: See `packages/website/docs/development/release.md`

---

**For more, see:**
- `CLAUDE.md` (architecture, CI, conventions)
- Project root `README.md` (features, commands, migration)
- `packages/core/README.md` (core usage)
- Example READMEs for integration patterns

