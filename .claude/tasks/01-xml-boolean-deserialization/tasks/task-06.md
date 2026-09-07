# Task: Foundations for boolean-aware decoding

## Problem
Nothing in the codebase knows which properties are boolean. The decoders decide by the shape of the value, so they
cannot tell `rounded="1"` from `strokeWidth="1"`, and there is no shared way to turn a serialized token into a
boolean. Both are prerequisites for every decode site.

## Proposed Solution
Add three pieces of foundation: a derived type naming the boolean properties of the style types, a shared parser that
converts a serialized token to a boolean and reports when it recognises nothing, and a module owning the runtime list
of boolean property names. The list must be split in two, the library's own properties and the ones an application
registers, and must carry a compile-time assertion tying it to the interface.

## Dependencies
- Tasks 02, 03, 04 and 05: the characterization tests must be green and committed first.

## Context
- `plan.md`, step 2, sections `types.ts`, `internal/utils.ts` and `boolean-attributes.ts`.
- The type goes next to its numeric twin (`packages/core/src/types.ts:980-984`) and must use the `NonNullable<...>`
  form so the one nullable boolean property is included.
- The parser must report an unrecognised token rather than defaulting, so an unknown spelling keeps today's behaviour
  instead of silently becoming false. That is the trap the existing stencil helper falls into
  (`packages/core/src/view/shape/stencil/StencilShape.ts:73`), which is why it must not be reused.
- Placement rationale, including why the parser must not go in the public math utilities, is in
  `raw/09-helper-and-hooks.md`.
- The precedent for the list is the two module-level arrays consulted by the numeric predicate
  (`packages/core/src/serialization/ObjectCodec.ts:28-34`).
- The compile-time assertion must stay module-private, so the unresolved conditional type never reaches the published
  declarations where a consumer augmentation could break their build.
- Project rules apply: explicit return types on exported functions, `.js` import extensions, and the internal folder
  is not public API (`.claude/rules/architecture/coding-practices.md`).

## Success Criteria
- The three pieces exist and the build passes.
- Removing a boolean property from the runtime list fails the build with a readable message.
- No behaviour change yet: the full suite is still green because no decoder consults any of this.
