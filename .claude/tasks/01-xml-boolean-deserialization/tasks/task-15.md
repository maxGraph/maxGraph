# Task: Decide and handle the child element form of a style value

## Problem
A fourth decode site converts nothing at all. When a style value arrives as a child element carrying a name and a
value rather than as an attribute, it is stored as the raw string, for the library's own properties as much as for a
registered custom one. After the fix, the same property would decode to a real boolean when written as an attribute
and to a string when written as a child, an inconsistency inside a single format, and it makes the answer to "does
the registration cover the native format" conditional.

## Proposed Solution
Either route that site through the same conversion as the attribute path, or leave it and state the limitation in the
guide. The recommendation changed to routing it, because the alternative is a documented exception that a reader
discovers only by hitting it.

## Dependencies
- BLOCKED on the maintainer answering open decision 3 in `plan.md`.
- Task 07 if the answer is to route it, since it is the same file and the same conversion.
- Task 13 either way, because the limits section of the guide must state the outcome.

## Context
- `plan.md`, decisions still needed, item 3.
- The site is `packages/core/src/serialization/ObjectCodec.ts:811-834`, where the value is read at `:819` with no
  numeric and no boolean conversion.
- maxGraph's own encoder never emits that shape for a style, it always writes attributes, so only hand-written XML is
  affected. The array element shape that IS exercised today is unrelated and must keep working
  (`packages/core/__tests__/serialization/serialization.xml.test.ts:366-367` and `:520`).
- The stylesheet codec is unaffected either way, since it overrides decoding wholesale and has its own path, handled
  in task 09.

## Success Criteria
- The decision is recorded in `plan.md` and reflected in the guide.
- If routed: the child form and the attribute form agree for every boolean property, and the array element shape is
  unchanged.
- If left: the guide states it as a known limitation rather than leaving a reader to discover it.
