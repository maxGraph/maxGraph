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

## Key Lint Rules

- `no-console: error` — use `log()` utility instead
- `no-eval: error`
- Const enums are forbidden — use regular enums
- File extensions required in imports (`n/file-extension-in-import`)

## Prettier Config

Tab width 2, single quotes, print width 90, trailing comma ES5, end of line auto. See `.prettierrc`.

## Type-Only Imports

Use `import type` when an import is used only as a type annotation (not at runtime). This avoids accidental runtime bundle inclusion.

```typescript
import type { Logger } from '../types.js';  // Good — type-only
import { Logger } from '../types.js';       // Bad — if Logger is only used as type
```

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
