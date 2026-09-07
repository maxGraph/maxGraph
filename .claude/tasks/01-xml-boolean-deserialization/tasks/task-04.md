# Task: Characterize the stylesheet path

## Problem
The stylesheet decoder is a third, independent copy of the numeric coercion rule, and it misbehaves in two ways the
other paths do not: a property written as zero is silently dropped instead of stored, and a property written as the
word `false` becomes a truthy string. Neither is covered by any test, and one existing expectation asserts the string
spelling without any marker.

## Proposed Solution
Extend the existing stylesheet codec test with the exhaustive matrix, and make the two pathological cases explicit and
commented so the fix cannot overlook them. Keep the existing word-spelling input as a permanent regression case, since
released versions have been exporting it.

## Dependencies
- Task 01: the shared fixture.

## Context
- `plan.md`, step 1, section `codec/StylesheetCodec.test.ts`.
- The dropping guard is `packages/core/src/serialization/codec/StylesheetCodec.ts:176`; the numeric coercion is at
  `:171-172`.
- The file already has the right lifecycle and helpers and is only 72 lines:
  `packages/core/__tests__/serialization/codec/StylesheetCodec.test.ts`.
- The unmarked wrong expectation is at `:48`, and the input to keep is at `:39`.
- The per-path expected values, including which case yields an absent property, are tabulated in
  `raw/08-test-matrix.md`.
- The shared fixture `packages/core/__tests__/serialization/boolean-style-properties.ts` keeps only what more than one
  path needs: the property list with its two compile-time checks, the case generators, the absent-property sentinel,
  the numeric coercion rule and the expected-object builder. This task OWNS the expected value function for the stylesheet
  path and the stylesheet document builder, which is also why the dropped-property quirk is documented here, beside
  the test that proves it, rather than in the shared fixture.

## Success Criteria
- Every one of the 36 properties is covered on this path, in all four spellings.
- The dropped-property case and the truthy-string case are each asserted and commented as defects.
- `npm test -w packages/core` is green against the unfixed source.
