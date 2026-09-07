# Task: Align the two encoders that emit the words true and false onto 1 and 0

## Problem
The XML format must stay on 1 and 0, which the generic encoder already does, but two codecs stringify a real boolean
to the word instead. maxGraph therefore emits two spellings for the same thing, and its own stylesheet output cannot
be read back as a boolean.

## Proposed Solution
Make both codecs write a real boolean the way the generic encoder does, so a single spelling leaves the library, and
update the test expectations that recorded the word form as correct.

## Dependencies
- Task 09: aligning the stylesheet output to write zero makes the discarding guard reachable for booleans, so the two
  must land together.

## Context
- `plan.md`, step 3.
- The stylesheet value stringifier at `packages/core/src/serialization/codec/StylesheetCodec.ts:84-95` returns a
  boolean from a method declared to return a string, and the DOM then stringifies it.
- The graph view attribute writer at `packages/core/src/serialization/codec/GraphViewCodec.ts:24-26` is declared for
  numbers and only receives a boolean because of a suppression at `:112`.
- The hardcoded word at `GraphViewCodec.ts:95` is open decision 4 in `plan.md` and must be settled here rather than
  left to be discovered later.
- The three test expectations to update, and the ones that must stay on 1 and 0, are listed in
  `raw/09-helper-and-hooks.md`.
- The input expectation at `packages/core/__tests__/serialization/codec/StylesheetCodec.test.ts:39` must be kept
  permanently as a regression case for files exported by released versions.

## Success Criteria
- No test expectation in `packages/core/__tests__` expects a boolean written as a word.
- A stylesheet round trip preserves a false value.
- The byte-identical round trip test still passes.
