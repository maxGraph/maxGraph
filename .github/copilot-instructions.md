# maxGraph Copilot Instructions

## Repository Overview

maxGraph is a TypeScript library for displaying and interacting with vector diagrams (nodes/vertices and edges). It's the successor to the end-of-life mxGraph library, providing the same features with TypeScript support, modern ES2020 code, and a maintained npm package (`@maxgraph/core`).

**Repository Stats (on 2025-10-20, commit 8e78815d):**
- Size: ~1.8GB (including node_modules)
- Core source: ~19,500 lines of TypeScript
- 40 test suites with 368+ tests
- Monorepo structure using npm workspaces
- Target: ES2020, TypeScript 3.8+, no third-party runtime dependencies

**Browser Support:** Chrome, Edge, Firefox, Safari, and Chromium-based browsers (mobile and desktop).

## Build & Development Environment

**Node.js Version:** ALWAYS use the Node.js version specified in `.nvmrc`. This is the version used in CI/CD. Run `nvm use` if using nvm.

**Critical:** This is a npm workspace monorepo. ALWAYS run `npm install` from the repository root before any other commands.

### Installation & Setup

```bash
# From repository root - ALWAYS do this first
npm install

# If you get module resolution errors, ensure you're using Node 20
node --version  # Should show v20.x.x
```

### Core Build Process

**Build Location:** `packages/core/` contains the main library.

**Build Output:**
- ESM: `packages/core/lib/esm/`
- CommonJS: `packages/core/lib/cjs/` (with generated `package.json`)

**Build Commands (from packages/core/):**

```bash
# Clean build artifacts
npm run clean  # Removes lib/ directory

# Full build (builds both ESM and CJS)
npm run build  # Takes ~22 seconds
# Internally runs: build:esm, then build:cjs

# Watch mode for development
npm run dev  # Runs tsc --watch for ESM only
```

**Important:** The build process:
1. Compiles TypeScript to ESM format in `lib/esm/`
2. Compiles TypeScript to CommonJS format in `lib/cjs/`
3. Generates a `lib/cjs/package.json` with `{"type": "commonjs"}` via `scripts/generate-cjs-package-json.mjs`

### Testing

**From packages/core/:**

```bash
# Run all tests (takes ~6-7 seconds)
npm test  # Uses Jest with jsdom environment

# Run tests with coverage
npm test -- --coverage  # Coverage reports to packages/core/coverage/

# Type-check tests without running them
npm run test-check  # Uses tsconfig.test.json
```

**Test Configuration:** Tests use Jest with @swc/jest for fast TypeScript compilation. Test files are in `packages/core/__tests__/` with pattern `**/*.test.ts`. The jest.config.cjs includes a moduleNameMapper to handle `.js` extensions in imports.

### Linting

**From repository root:**

```bash
# Lint all TypeScript files (takes ~10-15 seconds)
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

**Configuration:** ESLint 9 with flat config (eslint.config.mjs), using TypeScript ESLint, Prettier integration, and import plugin. Key rules:
- No console statements (`no-console: error`)
- No eval (`no-eval: error`)
- Const enums are forbidden
- File extensions required in imports for packages/core/ (`n/file-extension-in-import: ['error', 'always']`)

**Prettier Config (.prettierrc):**
- Tab width: 2
- Single quotes: true
- Print width: 90
- Trailing comma: ES5
- End of line: auto

### Build Examples

**From repository root:**

```bash
# Build all example projects (ts-example*, js-example*)
./scripts/build-all-examples.bash

# List built file sizes without building
./scripts/build-all-examples.bash --list-size-only
```

Examples are located in `packages/ts-example*` and `packages/js-example*` directories. They use various build tools (Vite for TypeScript examples, Webpack for JavaScript examples).

### Storybook (HTML Package)

**From packages/html/:**

```bash
# Run Storybook dev server on port 8901
npm run dev

# Build Storybook static site to dist/
npm run build

# Clear Storybook cache if needed
npm run clear-cache
```

The `packages/html/` contains Storybook stories (JavaScript and TypeScript) demonstrating maxGraph features. Stories are being progressively migrated to TypeScript.

## Validation & CI Checks

**ALWAYS run these validations before committing changes:**

### Complete CI Build Sequence (from repository root):

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Build core package
npm run build -w packages/core

# 3. Type-check core tests
npm run test-check -w packages/core

# 4. Run core tests with coverage
npm test -w packages/core -- --coverage

# 5. Test TypeScript support
npm test -w packages/ts-support

# 6. Build all examples
./scripts/build-all-examples.bash

# 7. Build Storybook
npm run build -w packages/html

# 8. Check for circular dependencies
npm run check:circular-dependencies -w packages/core

# 9. Lint all code
npm run lint

# 10. Check npm package types
npm run check:npm-package -w packages/core
```

### Individual Validation Commands

**Circular Dependencies Check:**
```bash
cd packages/core
npm run check:circular-dependencies
# Uses madge to scan lib/ directory for circular imports
```

**NPM Package Validation:**
```bash
cd packages/core
npm run check:npm-package
# Uses @arethetypeswrong/cli to validate package exports
```

**API Documentation Build:**
```bash
cd packages/core
npm run docs:api
# Generates TypeDoc documentation to build/api/
```

## CI/CD Workflows

### Build Workflow (.github/workflows/build.yml)
**Triggers:** Push/PR to main (excluding docs-only changes)
**Runs on:** ubuntu-24.04, macos-14, windows-2022 (fail-fast: false)

**Steps:**
1. Checkout code
2. Setup Node.js from .nvmrc
3. Run `npm ci --prefer-offline --audit false --ignore-scripts --no-fund`
4. Build core (ESM)
5. Type-check tests
6. Run tests with coverage
7. Test TypeScript support package
8. Build all examples
9. Build Storybook
10. Check circular dependencies
11. Lint
12. Check npm package

### Website Generation Workflow (.github/workflows/generate-website.yml)
**Triggers:** Push/PR to main (for core/website/html changes)

**Steps:**
1. Build core API docs (`npm run docs:api -w packages/core`)
2. Build Storybook demo
3. Copy generated resources (`npm run extra:copy-gen-resources -w packages/website`)
4. Build website (`npm run build -w packages/website`)
5. Type-check website
6. Deploy to GitHub Pages (on main push only)

### Publish Workflow (.github/workflows/publish-npm-package.yml)
**Triggers:** Tag push matching `v*`
**Publishes:** `packages/core` to npm with provenance

## Project Structure

### Repository Root Files
- `.nvmrc` - Node.js version specification (version 20)
- `package.json` - Root workspace configuration with workspace list
- `tsconfig.json` - Base TypeScript config (ES2020, DOM, strict mode)
- `eslint.config.mjs` - ESLint flat config with TypeScript, Prettier, and import rules
- `.prettierrc` - Prettier formatting configuration
- `.gitignore` - Ignores: node_modules/, dist/, lib/, build/, coverage/, *.tgz

### Workspace Structure
```
packages/
├── core/                    # Main @maxgraph/core library
│   ├── src/                 # TypeScript source (view/, util/, serialization/, etc.)
│   ├── __tests__/           # Jest tests (40 test suites)
│   ├── lib/                 # Build output (esm/ and cjs/) - gitignored
│   ├── build/               # API docs output - gitignored
│   ├── css/                 # Stylesheets (included in npm package)
│   ├── images/              # Image assets (included in npm package)
│   ├── i18n/                # Internationalization files
│   ├── xsd/                 # XML schema definitions
│   ├── scripts/             # Build scripts (generate-cjs-package-json.mjs)
│   ├── jest.config.cjs      # Jest configuration
│   ├── tsconfig.json        # TypeScript config (extends root)
│   └── package.json         # Core package definition
│
├── html/                    # Storybook examples/stories
├── website/                 # Docusaurus documentation site
├── ts-example*/             # TypeScript example projects (Vite-based)
├── js-example*/             # JavaScript example projects (Webpack-based)
└── ts-support/              # TypeScript 3.8 compatibility tests
```

### Core Source Structure (packages/core/src/)
```
├── index.ts                 # Main entry point
├── types.ts                 # Type definitions (53K+ lines)
├── Client.ts                # Client utilities
├── view/                    # View layer (Graph, rendering, shapes)
│   ├── Graph.ts             # Main Graph class
│   ├── AbstractGraph.ts     # Abstract base class
│   ├── GraphView.ts         # View management (71K+ lines)
│   ├── GraphDataModel.ts    # Data model (37K+ lines)
│   ├── cell/                # Cell rendering and overlay
│   ├── shape/               # Shape definitions (node/, edge/, stencil/)
│   ├── handler/             # Event handlers
│   ├── plugins/             # Graph plugins
│   ├── mixins/              # Graph mixins (various capabilities)
│   ├── layout/              # Layout algorithms (hierarchical/, util/, datatypes/)
│   ├── style/               # Styling system
│   ├── canvas/              # Canvas rendering
│   └── event/               # Event system
├── serialization/           # XML serialization/codecs
├── util/                    # Utility functions
├── editor/                  # Editor components
├── gui/                     # GUI widgets
├── i18n/                    # Internationalization
└── internal/                # Internal utilities
```

## Common Issues & Workarounds

### Module Resolution Errors
**Symptom:** Cannot find module errors after fresh clone
**Solution:** Run `npm install` from the repository root. This repo uses npm workspaces.

### Build Failures
**Symptom:** TypeScript compilation fails
**Solution:** 
1. Ensure Node.js version 20 is active
2. Run `npm run clean` in packages/core/, then rebuild
3. Check that lib/ directory is clean before build

### Test Failures
**Symptom:** Jest tests fail to run
**Solution:** 
1. Build the core package first: `npm run build -w packages/core`
2. Tests require the jsdom environment (configured in jest.config.cjs)
3. Module resolution issues: Check moduleNameMapper in jest.config.cjs

### Lint Errors
**Common issues:**
- Forbidden console statements: Remove or use proper logging
- Missing file extensions: Add `.js` to imports in packages/core/
- Const enums: Convert to regular enums

### Workspace Command Errors
**Issue:** "npm run dev" at root fails with MODULE_NOT_FOUND
**Explanation:** There is no root `dev` script implementation. Use workspace-specific commands:
```bash
npm run dev -w packages/core      # Watch core
npm run dev -w packages/html      # Run Storybook
```

## Important Configuration Details

### TypeScript Configuration
- **Compiler target:** ES2020
- **Module system:** ES2020 modules (ESM primary, CJS via separate compilation)
- **Strict mode:** Enabled with noImplicitOverride, noImplicitReturns
- **Declaration files:** Generated for both ESM and CJS
- **IsolatedModules:** true (required for build tooling)

### Package Exports (packages/core/package.json)
The package exports both ESM and CJS with conditional exports:
- `"."` - Main entry (dual ESM/CJS)
- `"./css/*"` - Stylesheet assets
- `"./images/*"` - Image assets
- `"./i18n/*"` - Localization files
- `"./xsd/*"` - XML schemas

### Jest Configuration Notes
- **Environment:** jsdom (for DOM APIs)
- **Transform:** @swc/jest for fast TypeScript compilation
- **Extension handling:** `.js` extensions are stripped via moduleNameMapper
- **Coverage:** Reports to coverage/ directory in lcov and text-summary formats

## Making Changes

### Typical Development Workflow

1. **Start development:**
   ```bash
   cd packages/core
   npm run dev  # Watch mode for core
   ```

2. **In another terminal, run Storybook:**
   ```bash
   cd packages/html
   npm run dev  # Hot-reloads when core changes
   ```

3. **Before committing:**
   ```bash
   # From repository root
   npm run lint          # Check code style
   npm test -w packages/core  # Run tests
   ```

### When Modifying Core Source
- **Always** include `.js` extensions in import statements in packages/core/src/
- Follow existing code structure and patterns
- Maintain strict TypeScript typing
- Add/update tests in `packages/core/__tests__/` if adding new functionality
- Run the complete CI validation sequence before submitting PRs

### When Adding Dependencies
- Add to appropriate workspace package.json
- Run `npm install` from repository root to update lock file
- Prefer avoiding new runtime dependencies in core package (it has zero dependencies)

### When Updating Examples
- Example projects are independent applications demonstrating maxGraph usage
- ts-example* use Vite, js-example* use Webpack
- Build all examples to verify changes: `./scripts/build-all-examples.bash`

## Trust These Instructions

These instructions were generated by thoroughly exploring the codebase, running all build commands, examining CI workflows, and validating the complete build process. TRUST this information and only search for additional details if:
1. These instructions don't cover your specific use case
2. You encounter errors that contradict what's documented here
3. You need implementation details not covered in this overview

The build times, command sequences, and configuration details have all been verified to work correctly on this repository.
