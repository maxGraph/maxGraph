# Task: Characterize the boolean fields of the codec-registered classes

## Problem
The defect is not limited to styles. Every class with a registered codec decodes its boolean fields as numbers, and the
maintainer asked for all classes to be in scope. Today only two such fields are covered, both in a shared helper, and
one class field decodes wrongly with no test noticing it at all.

## Proposed Solution
Add a further group of cases to the new test file of task 03, covering the boolean fields of every codec-registered
class. Assert today's numeric values so the suite stays green, and treat the fields that no runtime check can discover
as first-class cases, since they will need explicit handling in the fix.

## Dependencies
- Task 03: it shares the same test file.

## Context
- `plan.md`, step 1, section `serialization.xml.booleanProperties.test.ts`, third describe.
- The full field inventory per class is in `raw/01-inventory.md`; the four fields no runtime check can discover, and
  why, are in `raw/07-template-vs-list.md`.
- One coverage gap to close rather than a regression: the graph options decode as numbers today because the existing
  import test asserts only two unrelated properties
  (`packages/core/__tests__/serialization/codec/all-graph-classes.test.ts:110-123`).
- `Multiplicity.source` (`packages/core/src/view/other/Multiplicity.ts:91`) is a boolean field that was missing from
  the first inventory; it is encoded as an attribute at `all-graph-classes.test.ts:51`.
- The geometry relative flag cannot be expressed through the shared model checker, because that helper compares the
  whole geometry against a real instance whose field is a genuine boolean. Assert that field directly.

## Success Criteria
- Every boolean field of every codec-registered class is covered, including the four that no runtime check can
  discover.
- `npm test -w packages/core` is green against the unfixed source.
- The characterization commit can be made: full suite and `test-check` green, no source file modified.
