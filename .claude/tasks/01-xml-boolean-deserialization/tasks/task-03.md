# Task: Characterize the native XML attribute path

## Problem
The native format carries the style as an element whose attributes go through the generic attribute decoder, a
different code path from the mxGraph style string. Four properties are covered today, each behind a type suppression,
so the scope of the defect on this path is unknown.

## Proposed Solution
Add a dedicated test file for the exhaustive matrix on this path, exercising both the isolated element form and the
realistic form where the style sits on a cell inside a full model. Widen the one over-tight type in the shared model
checker so expectations no longer need suppressions.

## Dependencies
- Task 01: the shared fixture.

## Context
- `plan.md`, step 1, sections `serialization.xml.booleanProperties.test.ts` and `__tests__/serialization/utils.ts`.
- A new file rather than growing `serialization.xml.test.ts`, which is already 542 lines and organised by scenario.
  The name follows the existing `serialization.xml.<variant>.test.ts` convention.
- Two different codec lifecycles are needed in the same file, one per describe; both already exist in the tree
  (`serialization.xml.test.ts:102-108` and `codec/StylesheetCodec.test.ts:5-13`).
- The isolated form can use the helper in `packages/core/__tests__/serialization/codec/shared.ts`, since the codec
  named `Object` is registered by `registerCoreCodecs` (`packages/core/src/serialization/register-shared.ts:37`).
- The single field forcing all seven existing suppressions is the style type in
  `packages/core/__tests__/serialization/utils.ts:5-8`. Widening it is strictly additive; every current call site
  still type checks.
- Keep the whole-object comparison at `utils.ts:89`: it catches a wrong value and a missing or extra key, which
  matters for the next task.

## Success Criteria
- Every one of the 36 properties is covered on this path, in all four spellings, in both the isolated and the
  realistic form.
- `npm test -w packages/core` and `npm run test-check -w packages/core` are both green against the unfixed source.
- The new file contains no type suppression.
