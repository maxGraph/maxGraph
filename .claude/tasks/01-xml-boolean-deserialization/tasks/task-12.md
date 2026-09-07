# Task: Registration API for custom boolean cell style properties

## Problem
An application that extends the style interface by module augmentation cannot have its own boolean properties decoded
correctly, because the decoders consult a list the library owns. The mxGraph style string path offers no usable hook
at all, since its parser is not reachable from the public API.

## Proposed Solution
Expose an additive registration in the module that owns the list, so one call covers all three decode shapes while the
library's own properties stay in place and keep working untouched.

## Dependencies
- Task 06: the foundations, which is where the list lives.
- Task 10: the decode fix must be green first, so the registration is added to working behaviour rather than to a
  moving target.

## Context
- `plan.md`, step 2, sections `boolean-attributes.ts` and `index.ts`, which fix the exported names
  `registerCustomBooleanCellStylePropertiesForCodecs` and
  `unregisterAllCustomBooleanCellStylePropertiesForCodecs` and record why each part of the name is there.
- The same sections carry the two-set structure and the reason the library's own properties must never sit behind the
  call, along with the parameter type that makes a consumer's augmented key accepted and a typo a compile error.
- Registration is decode only, because the encoder decides from the value type rather than from the key.
- The teardown exists because global mutable state leaks between tests, as every other unregister function in the
  codebase does.
- The full cost comparison and the rejected alternatives are in `raw/06-registration-api.md`.
- The test file to model on is `packages/core/__tests__/util/config.test.ts` or
  `packages/core/__tests__/internal/BaseRegistry.test.ts`.

## Success Criteria
- A registered custom property decodes to a real boolean on all three paths.
- The teardown clears only the custom set.
- The built-in properties keep working without any call.
- The new names are exported from the package root, and the predicates and the list are not.
