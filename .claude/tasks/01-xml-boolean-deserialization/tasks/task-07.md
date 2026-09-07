# Task: Boolean-aware decoding in the generic attribute decoder

## Problem
The generic attribute decoder coerces any numeric-looking attribute to a number, which is how both the native style
form and the class fields such as the vertex and edge flags end up as numbers. The predicate it consults answers a
question about the shape of the value, so it cannot be taught about boolean properties without lying to every
subclass that overrides it.

## Proposed Solution
Add a new overridable predicate answering whether an attribute is boolean, and consult it before the numeric branch.
Back it with two mechanisms: a runtime check of the target object's own field for class instances, and the property
list for plain objects, which is the only option for styles. Leave the numeric predicate and the whole encode side
untouched.

## Dependencies
- Task 06: the foundations.

## Context
- `plan.md`, step 2, section `ObjectCodec.ts`.
- The conversion site is `packages/core/src/serialization/ObjectCodec.ts:576-587`, the numeric predicate at
  `:597-605`.
- Read the target object rather than the codec template: they agree for every field with a literal initializer, but
  the object is also correct when a caller decodes into an already built instance, and it covers classes registered
  automatically. The evidence, including why the generic object codec can never be served this way, is in
  `raw/07-template-vs-list.md`.
- Discriminate class instances from plain objects the way the numeric predicate already does at `:600-601`. State the
  accepted looseness in the documentation: a plain element that is not a style gets style semantics, exactly as it
  already gets numeric semantics.
- The new name must not collide with the encode-side predicate at `:564`, whose signature differs.
- Do not hook the attribute assignment method: one codec already overrides it and bypasses its parent for styles
  (`packages/core/src/serialization/codec/mxGraph/mxCellCodec.ts:31-38`).
- The comment at `:757-760` already claims the decoder converts the words to booleans. It is false today and this
  change makes it true.
- The public API consequences, including which user override is now bypassed, are in `raw/09-helper-and-hooks.md`.

## Success Criteria
- The native attribute form yields real booleans for the style properties and for the class fields.
- Genuinely numeric properties are untouched, in particular the connection point coordinates where a zero must stay
  a number.
- An unrecognised token still behaves as it does today.
- The characterization tests for this path now fail, which is expected until task 10.
