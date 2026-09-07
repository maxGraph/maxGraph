# Task: Shared fixture for the boolean property matrix

## Problem
The characterization tests must cover every boolean property of the style types on three different decode paths, and
the fix must later flip hundreds of expectations from numbers to booleans. Without a single source of truth, the flip
becomes a hand edit of hundreds of literals, and a boolean property added to the interface later would be silently
left out of the coverage, which is the very class of omission this work exists to prevent.

## Proposed Solution
Create one shared, non-test fixture module that owns the key list, the input builders and the expected values. It must
derive the property list from the types rather than restating it, and carry a compile-time assertion that fails the
build when a boolean property exists in the interface but not in the list. Expected values must come from one function
per decode path, so the later flip to real booleans is three small edits rather than a sweep.

## Dependencies
- None, can start immediately.

## Context
- `plan.md`, step 1, section `boolean-style-properties.ts`.
- Derive from `CellStyle`, not `CellStateStyle`: the count is 36, not 35, because the mxGraph style string can set
  `ignoreDefaultStyle` through a leading semicolon (`packages/core/src/types.ts:76`,
  `packages/core/src/serialization/codec/mxGraph/utils.ts:10`).
- Model the derived type on `NumericCellStateStyleKeys` (`packages/core/src/types.ts:980-984`) but use the
  `NonNullable<...>` form, otherwise `orthogonal?: boolean | null` (`types.ts:614`) is silently dropped and the
  exhaustiveness guarantee is false.
- Naming and placement follow `packages/core/__tests__/serialization/utils.ts` and
  `packages/core/__tests__/serialization/codec/shared.ts`, which are helpers without the `.test.ts` suffix.
- The four raw spellings per property and the three per-path expectations, including the two pathological path C
  cases, are tabulated in `raw/08-test-matrix.md`.
- Expected objects must stay untyped (`Record<string, unknown>`), because `toEqual` accepts `unknown` and that is what
  keeps the whole matrix free of type suppressions.

## Success Criteria
- The module exports the property list, the case variants, the three input builders and the three expectation
  functions.
- `npm run test-check -w packages/core` passes, and it FAILS with a readable message when a boolean property is
  removed from the list by hand.
- No `@ts-ignore` or `@ts-expect-error` anywhere in the module.
