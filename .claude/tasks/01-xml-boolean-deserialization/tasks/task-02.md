# Task: Characterize the mxGraph style string path

## Problem
`convertStyleFromString` turns `rounded=1` into the number 1 for every boolean property, and the current tests cover
only three properties, two of them with a comment that states the wrong expectation. Nothing proves the scope of the
defect on this path, and nothing would catch a property the fix forgets.

## Proposed Solution
Extend the existing unit test file for that function with the exhaustive matrix from the shared fixture: one aggregate
case carrying every property in a single style string, plus one case per property and spelling so a failure names the
offending property. Assert today's wrong values, so the suite is green before any source change.

## Dependencies
- Task 01: the shared fixture.

## Context
- `plan.md`, step 1, section `codec/mxgraph/utils.test.ts`.
- The function is pure and the file has no lifecycle hooks: `packages/core/__tests__/serialization/codec/mxgraph/utils.test.ts`.
- Cover the `autosize` to `autoSize` rename explicitly (`packages/core/src/serialization/codec/mxGraph/utils.ts:19`).
  The raw string uses one spelling and the decoded property another, which is the case that breaks an implementation
  looking up the unmapped key.
- Two existing expectations carry a comment claiming the value should be `true` when the input is `rounded=0`, so the
  comment is wrong and the correct value is `false` (`utils.test.ts:29` and `:53`).
- Removing the type cast at `:77` removes the only reason for the suppression at `:76`.
- `test.each` with the tuple form and a `'%s'` title is required by `.claude/rules/testing/conventions.md`.

## Success Criteria
- Every one of the 36 properties is covered on this path, in all four spellings.
- `npm test -w packages/core` is green against the unfixed source.
- The file no longer contains a type cast forcing a suppression.
