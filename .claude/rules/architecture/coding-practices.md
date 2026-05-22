---
paths:
  - "packages/core/src/**"
---
# Coding Practices — Core Package

## Import Extensions

ALWAYS include `.js` extensions in import statements. Enforced by linter.

## Zero Runtime Dependencies

The core package has zero third-party runtime dependencies. NEVER add new runtime dependencies — implement functionality directly.

## Null/Undefined Checks

Use `isNullish` from `internal/utils.js` when checking variables that can have falsy values (0, "", false). NEVER use `!variable` for nullish checks on such variables.

```typescript
import { isNullish } from '../internal/utils.js';
if (isNullish(index)) { ... }  // Good — handles index = 0
if (!index) { ... }            // Bad — treats 0 as falsy
```

## Logging

Use `log()` from `internal/utils.js`. NEVER access `GlobalConfig.logger` directly.

```typescript
import { log } from '../internal/utils.js';
log().warn('Something unexpected happened');
```

## Internationalization

Use `translate()` and `isI18nEnabled()` from `internal/i18n-utils.js`. NEVER access `GlobalConfig.i18n` directly.

## Source Folder Naming

- Use **singular** form: `handler/` not `handlers/`
- Use **kebab-case**: `my-feature/` not `myFeature/`

## Plugin ID Naming

Applies to new plugins in `packages/core/src/view/plugin/` and the `BuiltinPluginId` union in `types.ts`.

- Use **kebab-case** for multi-word ids: `'image-bundle'`, not `'imageBundle'` or `'ImageBundlePlugin'`.
- Single-word ids stay lowercase: `'fit'`.
- Do NOT suffix with `Plugin` or `Handler` — the id is not the class name. Class names use `PascalCase` and end in `Plugin`: `ImageBundlePlugin`, `FitPlugin`.
- Prefer precise scope over generic names: `'image-bundle'` is better than `'image'` when the plugin only deals with image bundles, because it reserves the broader namespace for future plugins.
- Legacy handler plugins (`'ConnectionHandler'`, `'PanningHandler'`, etc., defined in `BuiltinPluginId`) predate this convention and are kept for backwards compatibility; do NOT use them as a template.

## Key Lint Rules

- `no-console: error` — use `log()` utility instead
- `no-eval: error`
- Const enums are forbidden — use regular enums
- File extensions required in imports (`n/file-extension-in-import`)

## Prettier Config

Tab width 2, single quotes, print width 90, trailing comma ES5, end of line auto. See `.prettierrc`.

## TypeScript

### Type-Only Imports

Use `import type` when an import is used only as a type annotation (not at runtime). This avoids accidental runtime bundle inclusion.

```typescript
import type { Logger } from '../types.js';  // Good — type-only
import { Logger } from '../types.js';       // Bad — if Logger is only used as type
```

### Explicit Return Types

ALWAYS declare explicit return types on exported functions and all class methods, including private methods, getters, and setters. This:
- improves IDE introspection (hover/signature help shows the type immediately, without re-inferring),
- speeds up TypeScript inference — the compiler reuses the declared type instead of recomputing it at every call site, which matters as the file count grows,
- pins the contract against accidental drift when the body changes (a refactor that silently widens the return type will fail at the declaration, not at distant callers).

```typescript
isSelected(cell: Cell): boolean {            // Good
  return this.cells.includes(cell);
}

isSelected(cell: Cell) {                     // Bad — return type implicit
  return this.cells.includes(cell);
}
```

Arrow callbacks (e.g. `cells.filter((cell) => ...)`) MAY rely on inference when the type is obvious from a single return.

## XML Parsing

ALWAYS use `parseXml()` from `xmlUtils.js` instead of calling `DOMParser` directly.

```typescript
import { parseXml } from '../util/xmlUtils.js';
const doc = parseXml(xmlString);  // Good
const doc = new DOMParser().parseFromString(xmlString, 'text/xml');  // Bad
```

## Memory Leak Prevention in destroy()

All `destroy()` methods MUST clean up:
- Remove event listeners
- Nullify object references
- Remove DOM elements created by the component
Missing cleanup causes memory leaks.
