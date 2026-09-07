# Implementation

Progress log for the tasks in `tasks/`. One section per task, appended as they land.

## Task 01, shared fixture for the boolean property matrix

Done. New file `packages/core/__tests__/serialization/boolean-style-properties.ts`, no other file touched.

### What it provides

- `BooleanCellStyleKey`, derived from `CellStyle` with `NonNullable<CellStyle[K]> extends boolean`.
- `booleanCellStyleKeys`, the 36 property names, declared `as const satisfies readonly BooleanCellStyleKey[]` so each
  name is checked on the declaration, plus a module-private assertion rejecting a boolean property missing from the
  list. The `as const` is load-bearing: annotating the array instead would widen the element type and make that
  assertion pass for any list, including an empty one.
- `serializedBooleanValues`, the four spellings `1`, `0`, `true`, `false`, plus the case generators
  `booleanCellStyleCasesFor` (36 cases) and `allBooleanCellStyleCases` (144 cases).
- One expectation function per decode path, `decodedFromStyleString`, `decodedFromXmlAttribute` and
  `decodedFromStylesheetEntry`, all three characterizing today's WRONG behavior.
- The three input builders `buildStyleString`, `buildStyleXmlAttributes` and `buildStylesheetXml`, and the expected
  object builder `buildExpectedStyle`, which returns `Record<string, unknown>` so no expectation needs a type
  suppression.
- `absentProperty`, a sentinel for the stylesheet path, where a value of `0` is not stored at all rather than stored
  wrongly. `buildExpectedStyle` omits those keys.

### Verification

- Property list confirmed against the source rather than the notes: exactly 36 boolean properties across the two
  interfaces, 1 on `CellStyle` and 35 on `CellStateStyle`, and neither interface has an index signature, so the
  mapped type is sound.
- RED CHECK in both directions, restored afterwards. Removing `swimlaneLine` from the list fails `test-check` with
  `error TS2322: Type 'true' is not assignable to type 'booleanCellStyleKeys is missing at least one boolean property
  of CellStyle'`. Adding a name that is not a boolean property fails with
  `error TS2322: Type '"notABooleanProperty"' is not assignable to type 'BooleanCellStyleKey'`.
- The three expectation functions were validated EMPIRICALLY against the real decoders with a throwaway test, since a
  fixture asserting the wrong current behavior would be worthless. 12 cases, all four spellings against all 36
  properties on all three paths, all passing, which confirms in particular that the stylesheet path really does drop
  a property written as `0`. The throwaway test was then deleted; tasks 02 to 04 write the real ones.
- `npm run test-check -w packages/core` passes, `npm run lint` clean after `lint:fix` (two prettier wrappings), full
  core suite green at 62 suites and 561 tests.

### Deviations from the plan

- The list uses `satisfies` on the declaration rather than the separate typed-alias assertion the plan sketched, which
  checks the same thing with one construct fewer. Available because the repository is on TypeScript 5.9; the 3.9 pin in
  `packages/ts-support` only constrains what consumers compile against.
- The remaining exhaustiveness assertion is followed by a `void` statement. Without it the constant is unused, and
  while `no-unused-vars` is off today, a `void` makes the intent explicit and survives that rule being turned on.
- Paths A and B share one internal coercion helper rather than duplicating the same three-way conditional, while
  still exposing one named function per path so each test file names its own path and the later flip stays per path.

- The per-path expected value functions and input builders were moved OUT of the fixture into the test file of each
  path, after review: each had exactly one consumer, so a shared fixture was the wrong home, and keeping only the
  stylesheet one out would have been an arbitrary asymmetry. The fixture keeps what more than one path needs, plus
  `coerceNumericLookingValue`, which is shared because the style string parser and the attribute decoder genuinely
  apply the same rule through two implementations.

### Follow-ups

- None for this task. Next is task 02, which consumes the fixture on the mxGraph style string path.
