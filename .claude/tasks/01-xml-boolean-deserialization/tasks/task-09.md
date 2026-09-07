# Task: Boolean-aware decoding in the stylesheet codec, and its dropped values

## Problem
The stylesheet codec is the third copy of the numeric rule, and it does not route through the generic decoder at all
because it overrides decoding wholesale. It also discards any value it considers empty, so a property written as zero
disappears instead of being stored as false. Aligning the encoder in the next task would make that reachable for
booleans, so the two cannot be separated.

## Proposed Solution
Add the boolean conversion in the branch that reads the serialized value, before the numeric check, and replace the
emptiness guard with a genuine nullish check so a legitimate false or zero is stored.

## Dependencies
- Task 06: the foundations.

## Context
- `plan.md`, step 2, section `codec/StylesheetCodec.ts`.
- The value read is at `packages/core/src/serialization/codec/StylesheetCodec.ts:169`, the numeric check at `:171`,
  the discarding guard at `:176`.
- Keep the conversion out of the evaluated-text branch at `:166-168`, which already yields real types.
- The project rule mandates the shared nullish helper rather than a falsy test or a loose comparison
  (`.claude/rules/architecture/coding-practices.md`), and the file already imports from that module.
- This codec overriding decoding wholesale is the reason the conversion must be a shared function that both codecs
  import, with the codec method as a thin overridable wrapper. See `raw/09-helper-and-hooks.md`.
- Neighbouring defects found in the same twenty lines are listed there too; they are out of scope and belong in their
  own issues.

## Success Criteria
- Stylesheet entries yield real booleans for all 36 properties, in both the digit and the word spelling.
- A property written as zero is stored as false instead of vanishing.
- The characterization tests for this path now fail, which is expected until task 10.
