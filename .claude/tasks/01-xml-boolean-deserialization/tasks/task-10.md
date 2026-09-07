# Task: Flip the expectations and land the decode fix

## Problem
Tasks 07 to 09 change behaviour, so every expectation asserting the old numeric values now fails. The suite must be
brought back to green in the same commit as the source change, and the assertions that recorded the defect must be
rewritten rather than deleted, so the coverage survives the fix.

## Proposed Solution
Flip the three per-path expectation functions in the shared fixture, then the existing assertions across the
serialization tests, and remove the type suppressions and the two misleading comments that no longer describe
anything true. Verify the round trip that must not change.

## Dependencies
- Tasks 07, 08 and 09. Those three plus this one form a single commit.

## Context
- `plan.md`, testing strategy.
- The complete list of existing assertions to flip is in `raw/08-test-matrix.md`, fourteen of them, including two that
  carry no marker and are therefore easy to miss.
- Seven type suppressions become unnecessary once the model checker field was widened in task 03.
- Two comments on the export side ask for the opposite of the recorded decision and must be deleted rather than
  implemented (`packages/core/__tests__/serialization/serialization.xml.test.ts:347` and `:409`).
- The canary is the byte-identical round trip at `serialization.xml.test.ts:286-292`. It must keep passing; if it
  fails, the encoder was changed rather than left alone.
- Verified as unaffected, so do not chase them: the encode-side expectations listed in `raw/08-test-matrix.md`.

## Success Criteria
- Full suite green, `test-check` green, lint clean.
- No `FIX should be` marker remains in the serialization tests.
- The round trip still produces byte-identical XML, proving the format did not change.
