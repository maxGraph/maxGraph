# Task: Boolean-aware decoding in the mxGraph style string parser

## Problem
The style string parser is an independent copy of the numeric rule and is the path every mxGraph and draw.io file
takes. Its numeric helper receives only a value and no key, so it cannot consult the property list where it stands.

## Proposed Solution
Move the decision to the call site, which has both key and value: try the boolean conversion when the key is a known
boolean property, then fall back to the existing numeric helper and finally to the raw string. Leave the numeric
helper key-blind.

## Dependencies
- Task 06: the foundations.

## Context
- `plan.md`, step 2, section `codec/mxGraph/utils.ts`.
- The call site is `packages/core/src/serialization/codec/mxGraph/utils.ts:38`, the numeric helper at `:45-57`.
- The lookup must use the mapped property name, not the raw one: the parser renames one property (`:19`), so the raw
  string and the interface disagree on its spelling. This is the case task 02 covers explicitly.
- One property is set programmatically and never passes through the converter (`:10`), and an existing expectation
  already asserts it correctly. Keep that path untouched.
- The draw.io extension property is not declared in the style interface, so it cannot come from the derived list and
  stays numeric. Three expectations depend on that.

## Success Criteria
- Style strings yield real booleans for all 36 properties, including the renamed one.
- The numeric properties in the same strings are unchanged.
- The characterization tests for this path now fail, which is expected until task 10.
