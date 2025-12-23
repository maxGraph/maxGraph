# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

maxGraph is a TypeScript library for displaying and interacting with vector diagrams. It's the successor to the end-of-life mxGraph library, providing the same features with TypeScript support, modern modular architecture, and tree-shaking capabilities.

## Build & Development Environment

**Node.js Version:** ALWAYS use the Node.js version specified in `.nvmrc`. This is the version used in CI/CD. Run `nvm use` if using nvm.

## Development Commands

### Setup
```bash
npm install  # Install dependencies (uses npm workspaces)
nvm use      # Use Node.js version from .nvmrc (required)
```

### Development
```bash
# Watch and rebuild core package
npm run dev -w packages/core

# Watch and run Storybook examples (recommended: run in parallel with core dev)
npm run dev -w packages/html

# Clear Storybook cache if needed
npm run clear-cache -w packages/html
```

### Building
```bash
# Build core package (both ESM and CJS)
npm run build -w packages/core

# Build Storybook mini-site
npm run build -w packages/html

# Build all examples
./scripts/build-all-examples.bash
```

### Testing
```bash
# Run tests for core package
npm test -w packages/core

# Run tests with coverage
npm test -w packages/core -- --coverage

# Run a specific test file
npm test -w packages/core -- path/to/test.test.ts

# Check TypeScript compilation of tests
npm run test-check -w packages/core

# Test TypeScript support
npm test -w packages/ts-support
```

### Code Quality
```bash
# Lint all TypeScript files
npm run lint

# Lint with auto-fix
npm run lint:fix

# Check for circular dependencies in built JS
npm run check:circular-dependencies -w packages/core

# Check npm package correctness
npm run check:npm-package -w packages/core

# Generate API documentation
npm run docs:api -w packages/core
```

### Building Local NPM Package
```bash
# From project root
npm install

# From packages/core folder
npm pack

# Use the generated maxgraph-core-*.tgz file or packages/core folder with npm link
```

## Architecture

### Core Class Hierarchy

The library has a three-tier Graph class structure:

1. **AbstractGraph** (`packages/core/src/view/AbstractGraph.ts`)
   - Base abstract class extending EventSource
   - Defines core graph functionality through mixins
   - Manages graph container, model, view, and plugins
   - Does not register any default built-ins

2. **BaseGraph** (`packages/core/src/view/BaseGraph.ts`)
   - Minimal implementation without default built-ins
   - Optimized for production with efficient tree-shaking
   - Requires explicit configuration of all features
   - Recommended for production use

3. **Graph** (`packages/core/src/view/Graph.ts`)
   - Full-featured implementation with all default built-ins
   - Auto-registers shapes, edge styles, perimeters, and plugins
   - Good for prototyping and evaluation
   - Not recommended for production due to larger bundle size

### Mixin Pattern

The Graph functionality is modularized using TypeScript mixins in `packages/core/src/view/mixins/`:
- Each mixin provides a specific capability (e.g., CellsMixin, EdgeMixin, ValidationMixin)
- Mixins are applied to AbstractGraph via `applyGraphMixins()`
- Each mixin has two files: implementation (.ts) and type definitions (.type.ts)
- Type definitions are unified in `_graph-mixins-types.ts`

Key mixins include:
- **CellsMixin**: Core cell operations (add, remove, update)
- **EdgeMixin**: Edge-specific operations
- **VertexMixin**: Vertex-specific operations
- **ConnectionsMixin**: Connection management
- **SelectionMixin**: Cell selection handling
- **EditingMixin**: In-place editing
- **FoldingMixin**: Cell folding/expanding
- **GroupingMixin**: Cell grouping operations
- **ValidationMixin**: Cell validation
- **EventsMixin**: Event handling
- **PanningMixin**: Panning functionality
- **ZoomMixin**: Zoom operations
- **SwimlaneMixin**: Swimlane support

### Plugin System

Plugins extend graph functionality (`packages/core/src/view/plugins/`):
- **TooltipHandler**: Display tooltips
- **PanningHandler**: Panning and popup menus
- **ConnectionHandler**: Create connections
- **SelectionHandler**: Move and clone cells
- **SelectionCellsHandler**: Manage selection
- **RubberBandHandler**: Rubberband selection
- **CellEditorHandler**: In-place cell editing
- **PopupMenuHandler**: Context menus
- **FitPlugin**: Auto-fit content

Default plugins are returned by `getDefaultPlugins()` and automatically loaded by `Graph` class only.

### Key Components

**GraphDataModel** (`packages/core/src/view/GraphDataModel.ts`)
- Manages the graph's data structure
- Handles cell hierarchy and relationships
- Fires events for model changes
- Supports undo/redo through undoable changes

**GraphView** (`packages/core/src/view/GraphView.ts`)
- Visual representation layer
- Manages cell states and rendering
- Handles coordinate transformations
- Updates visual elements on model changes

**CellRenderer** (`packages/core/src/view/cell/CellRenderer.ts`)
- Renders cells using shapes
- Creates and updates visual elements
- Manages cell appearance

**Stylesheet** (`packages/core/src/view/style/Stylesheet.ts`)
- Defines visual styles for cells
- Maps style names to style properties
- Supports style inheritance

**Cell** (`packages/core/src/view/cell/Cell.ts`)
- Core entity representing vertices and edges
- Contains geometry, style, value, and children
- Maintains parent-child relationships

### Shape System

Shapes render visual elements (`packages/core/src/view/shape/`):
- **node/**: Vertex shapes (rectangles, circles, actors, swimlanes, etc.)
- **edge/**: Edge shapes (connectors, arrows, polylines)
- **stencil/**: Custom shapes defined via XML stencils

Shapes must be registered via registries (e.g., `ShapeRegistry`) before use. The `Graph` class auto-registers default shapes, but `BaseGraph` requires manual registration.

### Serialization

The library supports XML serialization (`packages/core/src/serialization/`):
- **ModelXmlSerializer**: High-level API for model serialization
- **Codec/ObjectCodec**: Low-level codec system
- **CodecRegistry**: Registry for codecs
- Compatible with mxGraph XML format

### Style Configuration

Three main style registries:
- **EdgeMarkerRegistry**: Arrow markers for edges
- **EdgeStyleRegistry**: Edge routing styles (orthogonal, Manhattan, etc.)
- **PerimeterRegistry**: Perimeter functions for connection points

Registries are in `packages/core/src/view/style/`.

## Directory Structure

```
packages/
├── core/                    # Main library package (@maxgraph/core)
│   ├── src/
│   │   ├── view/           # Graph view layer
│   │   │   ├── mixins/     # Graph functionality mixins
│   │   │   ├── plugins/    # Graph plugins
│   │   │   ├── shape/      # Shape implementations
│   │   │   ├── style/      # Style system
│   │   │   ├── cell/       # Cell-related classes
│   │   │   ├── layout/     # Layout algorithms
│   │   │   ├── handler/    # Event handlers
│   │   │   └── event/      # Event system
│   │   ├── editor/         # Editor utilities
│   │   ├── gui/            # GUI components
│   │   ├── serialization/  # XML serialization
│   │   ├── util/           # Utility functions
│   │   ├── i18n/           # Internationalization
│   │   └── types.ts        # TypeScript type definitions
│   ├── __tests__/          # Jest tests
│   ├── css/                # Stylesheets
│   ├── images/             # Image assets
│   └── i18n/               # Translation files
├── html/                   # Storybook examples
├── ts-example/             # TypeScript example app
├── ts-example-selected-features/  # Tree-shaking example
├── ts-example-without-defaults/   # No-defaults example
├── ts-example-jest-commonjs/      # Jest/CommonJS example
├── js-example/             # JavaScript example
├── js-example-nodejs/      # Node.js headless example
├── js-example-selected-features/  # JS tree-shaking example
├── js-example-without-defaults/   # JS no-defaults example
├── ts-support/             # TypeScript integration tests
└── website/                # Documentation website (Docusaurus)
```

## Coding Practices

When developing in the core package, follow these guidelines:

### Null/Undefined Checks

Use the `isNullish` function when checking for `null` or `undefined` on variables that can have falsy values (numbers, strings, booleans). This avoids bugs where `0`, `""`, or `false` are incorrectly treated as nullish.

```typescript
import { isNullish } from '../internal/utils.js';

// Good - correctly handles index = 0
if (isNullish(index)) { ... }

// Bad - treats index = 0 as falsy
if (!index) { ... }
```

### Logging and i18n

Use the internal utility functions instead of accessing `GlobalConfig` directly:

**For logging**, use the `log()` function from `internal/utils.js`:
```typescript
import { log } from '../internal/utils.js';

// Good - uses internal log function
log().warn('Something unexpected happened');
log().error('An error occurred', error);

// Bad - accesses GlobalConfig directly
GlobalConfig.logger.warn('Something unexpected happened');
```

**For internationalization**, use functions from `internal/i18n-utils.js`:
```typescript
import { translate, isI18nEnabled } from '../internal/i18n-utils.js';

// Good - uses internal i18n functions
const message = translate('key', params, 'default');
if (isI18nEnabled()) { ... }

// Bad - accesses GlobalConfig directly
const message = GlobalConfig.i18n.get('key', params, 'default');
```

### Source Folder Naming

When creating new folders in `packages/core/src/`, follow these naming conventions:
- Use **singular** form (e.g., `handler/` not `handlers/`)
- Use **kebab-case** (e.g., `my-feature/` not `myFeature/` or `my_feature/`)

```
# Good
packages/core/src/view/handler/
packages/core/src/view/cell/
packages/core/src/view/some-feature/

# Bad
packages/core/src/view/handlers/      # plural
packages/core/src/view/someFeature/   # camelCase
packages/core/src/view/some_feature/  # snake_case
```

## Important Patterns

### Using Graph vs BaseGraph

**For prototyping/demos**: Use `Graph` for automatic setup:
```typescript
import { Graph } from '@maxgraph/core';
const graph = new Graph(container);
// All defaults are registered automatically
```

**For production**: Use `BaseGraph` with explicit registration:
```typescript
import { BaseGraph } from '@maxgraph/core';
import { registerShape } from '@maxgraph/core';
// Register only needed features
const graph = new BaseGraph({ container, plugins: [...] });
```

### Tree-Shaking

To minimize bundle size, use `BaseGraph` and import only required features. See `ts-example-selected-features` for examples.

### Batch Updates

Always wrap multiple model changes in `batchUpdate()`:
```typescript
graph.batchUpdate(() => {
  // Multiple operations
  graph.insertVertex(...);
  graph.insertEdge(...);
});
```

### Working with Styles

Styles are defined as objects conforming to `CellStyle` type. See `packages/core/src/types.ts` for the complete `CellStyle` interface.

### Testing

- Tests use Jest with jsdom environment
- Tests are in `packages/core/__tests__/` mirroring `src/` structure
- Use `@swc/jest` for fast TypeScript compilation
- Import paths in tests should omit `.js` extension (handled by moduleNameMapper)

## Commit Message Style

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

### Format

```
type(scope): subject

Optional body with more details
- Can use bullet points
- To explain the changes
```

### Types

- **feat**: New feature or enhancement
  - Example: `feat: allow to pass more null and undefined to Multiplicity (#914)`
- **fix**: Bug fix
  - Example: `fix: correct edge rendering in Safari`
- **refactor**: Code refactoring (no functional changes)
  - Example: `refactor: simplify implementation of ParallelEdgeLayout (#909)`
- **chore**: Maintenance tasks (dependencies, build, config)
  - Example: `chore: use stricter options with the TS compiler (#922)`
- **docs**: Documentation changes
  - Example: `docs: add badge to DeepWiki in the README (#913)`
- **test**: Adding or updating tests
- **perf**: Performance improvements
- **style**: Code style changes (formatting, whitespace)

### Scopes (optional but recommended)

Common scopes used in this project:
- **docs**: Documentation files (README, CLAUDE.md, etc.)
- **deps-dev**: Development dependencies
- **deps-gha**: GitHub Actions dependencies
- **typescript**: TypeScript configuration or type-related changes
- Component/module names (e.g., `graph`, `layout`, `serialization`)

### Subject Line Guidelines

- Use lowercase (except for proper nouns like "Claude")
- Be concise and descriptive (50-72 characters recommended)
- Use imperative mood ("add" not "added", "fix" not "fixed")
- No period at the end

### Body Guidelines

- Wrap at 72 characters
- Explain the "why" not the "what" (code shows the what)
- Use bullet points for multiple items
- Separate body from subject with a blank line
- Provide context and reasoning for the change

### Examples from this Repository

**Simple change:**
```
chore(deps-gha): bump actions/setup-node from v4 to v6

Update the build-setup action.
```

**Feature with detailed body:**
```
feat: allow to pass more null and undefined to Multiplicity

- Update type signatures to accept nullish values
- Improve API flexibility for edge cases
- Add tests for null/undefined handling
```

**Documentation update:**
```
chore(docs): add Claude Code configuration file

Add CLAUDE.md with comprehensive guidance for Claude Code AI assistant including:
- All development, build, and testing commands
- Architecture overview (Graph class hierarchy, mixin pattern, plugin system)
- Directory structure and important implementation patterns

This file also serves as a useful reference for contributors.
```

**Refactoring:**
```
refactor: simplify implementation of ParallelEdgeLayout (#909)
```

## Build Output

The core package generates:
- **ESM**: `packages/core/lib/esm/` (ES2020 modules)
- **CJS**: `packages/core/lib/cjs/` (CommonJS modules)
- Both include TypeScript declarations

## Browser Compatibility

Targets modern browsers (Chrome, Edge, Firefox, Safari, Chromium-based browsers). No IE support. Code conforms to ES2020 standard.
