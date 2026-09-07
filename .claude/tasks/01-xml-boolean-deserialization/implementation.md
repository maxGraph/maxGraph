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

## Tasks 02, 03 and 04, the three decode paths characterized

Done, in parallel, one commit each: `a9a8dd7b5`, `c4d5edb68`, `b6fcea57c`. Each task owns the expected value function
and the input builder for its own path, so the shared fixture keeps only what more than one path needs.

### What landed

- Task 02, `codec/mxgraph/utils.test.ts`: 4 aggregate tests plus 144 per-case plus 4 for the property the parser
  renames, where the raw string and the interface disagree on the spelling. 157 tests in that suite. Dropped a cast
  that was the only reason for a type suppression in a neighbouring test.
- Task 03, new `serialization.xml.booleanProperties.test.ts`: 296 tests, the isolated element form and the realistic
  form on a cell inside a full model. Widened `ExpectCellProperties.style` in `serialization/utils.ts`, the single
  line that was forcing the seven existing suppressions.
- Task 04, `codec/StylesheetCodec.test.ts`: 152 tests, including two dedicated named tests for the defects unique to
  this path, a property written as zero vanishing from the style and a property written as the word false being kept
  as a truthy string.

### Verification

- Full core suite green: 63 suites, 1159 tests, up from 62 and 561.
- `npm run test-check -w packages/core` clean, repo-wide `npm run lint` clean.
- Zero type suppressions in any of the new code. The ten remaining in the serialization tests are pre-existing: seven
  `FIX should be` markers that task 10 deletes, and three documenting an intentional mxGraph compatibility deviation.
- Task 03 ran a red check that was not asked for and should have been: making its expected value a real boolean fails
  all 296 cases, proving none passes vacuously and that the fix flips the whole matrix through one function.

### Notes carried forward to the fix

- `ignoreDefaultStyle` behaves as an ordinary property on the style string path, while the leading semicolon shorthand
  bypasses the value converter entirely. That is why the existing test asserting `true` for it is already correct and
  must stay untouched.
- Two `CellStyle` casts remain in pre-existing tests of the style string file. They force no suppression today, so
  they were left alone as out of scope.

## Task 05, the boolean fields of the codec registered classes

Done, commit `8619556ff`, 190 lines appended to `serialization.xml.booleanProperties.test.ts`. Full suite now 63
suites and 1200 tests. `test-check` and repo-wide `lint` clean.

### Reachable surface, established by probing rather than assumed

Covered, all decoding as numbers today, in each of the four spellings: `Cell` (6 fields), `Geometry` (2),
`GraphDataModel` (4), `GraphView` (4), `CollapseChange.collapsed`, `VisibleChange.visible`,
`TerminalChange.source`, `Editor` (11), the 18 own flags of the graph, and the 2 folding options.

Not reachable, so not covered:

- `GraphView` cannot be decoded through a `<Graph>` document at all, because `GraphCodec` excludes the `view` field.
  It is covered as a standalone `<GraphView>` document instead.
- The `previous` field of the change classes is excluded from decoding by their codecs.
- `Multiplicity` attributes are not decoded at all. A `<Multiplicity source="1"/>` inside a graph produces an instance
  whose `source` is `undefined`, so the XML value is LOST rather than mistyped. Recorded as a test documenting the
  behavior, and it deserves its own issue: it is a different defect from this one.

### The finding that matters for the fix

The graph folding options are a plain object, not a class instance, so they look like a style object to the decoder.
But unlike a style they are reached through a field of the graph, so the object being decoded into already holds real
booleans, which means a runtime check of the target field can serve them while it cannot serve a style. The test
asserts that precondition explicitly before decoding, so task 07 cannot regress it silently.

### Deviations and notes

- One aggregate assertion per class and spelling rather than one test per field: the equality diff already names the
  offending field, and it avoids constructing an `Editor`, which builds a whole graph under jsdom, once per field.
- The Apache header of task 03's file was briefly duplicated: the rtk proxy strips comment blocks from `cat` output,
  so the file looked headerless. Verify headers with `python3` or `grep`, never with `cat`.

## Task 06, the foundations

Done, commit `cca2dfeca`, the first source change of this work. No behavior change: nothing consults the new code yet,
so the suite stays at 63 suites and 1200 tests.

### What landed

- `BooleanCellStyleKeys` in `types.ts`, next to `NumericCellStateStyleKeys`, tagged `@since 0.25.0` like the other
  recent additions. Derived from `CellStyle` rather than `CellStateStyle` so `ignoreDefaultStyle` is included, which
  task 02 proved a style string really can set, and with `NonNullable` applied so `orthogonal` is not dropped.
- `parseBoolean` in `internal/utils.ts`, next to `isNullish`, accepting both spellings and returning `undefined` for
  anything else. Tagged `@private not part of the public API` like its neighbours.
- New `src/serialization/boolean-attributes.ts` holding the 36-name list with its two compile-time checks, plus
  `isBooleanCellStyleProperty` for style objects and `isBooleanFieldOfTarget`, which reads the target field and so
  serves every class instance and every plain object reached through a field.

### Verification

- RED CHECK on the production list: removing a name fails `npm run build -w packages/core` with
  `error TS2322: Type 'true' is not assignable to type 'booleanCellStyleProperties is missing at least one boolean
  property of CellStyle'`. The guard therefore protects the shipped code, not only the tests, and it fires in a step
  CI already runs.
- Build, `test-check`, full suite, repo-wide lint and the circular dependency check all green.

### Deviations from the plan

- The custom property set and the registration functions were NOT added here, although task 06 mentions splitting the
  list in two. A set with no way to add to it is dead code, so the second set arrives with its API in task 12.
- The test fixture now imports the production list instead of keeping its own copy, and its local derived type and
  duplicate guards are gone. The 36 names exist in exactly one place, and the tests iterate what production uses. The
  fixture shrank from 200 lines to 83.
- `booleanCellStyleProperties` is exported so the fixture can iterate it, but it is not re-exported from `index.ts`
  and is marked `@internal`, as is `isBooleanCellStyleProperty`.

## Tasks 07, 08, 09 and 10, the decode fix

Done. Landed as two commits rather than one, because the source change was committed before the flip on request:
`eafbabf9b` for the three decode sites, `8c273a496` for the expectations. Full suite green again at 63 suites and
1200 tests, `test-check`, lint, build and the circular dependency check all clean.

### The three sites

- `ObjectCodec` gained the public overridable `isBooleanValueAttribute`, consulted before the numeric branch. It keys
  on the RAW attribute name, and for a better reason than the mapping being computed later: `decodeAttribute` assigns
  with the raw name, so a mapped lookup would test a different field from the one being written.
- The style string parser converts at its call site, keyed on the MAPPED name, verified as `autosize=1` giving
  `{ autoSize: true }`.
- The stylesheet codec converts in its own decode override, and its truthiness guard became a nullish check, without
  which a property written as `0` would have kept vanishing and the fix would have been invisible on that path.

### The gap that task 07 uncovered, and how it was closed

Four fields are assigned from a constructor argument, so the object being decoded into holds `undefined` and no
runtime check can see them: `CollapseChange.collapsed`, `VisibleChange.visible`, `TerminalChange.source` and
`Editor.isActive`. Rather than three ad-hoc predicate overrides, `ObjectCodec` gained a declarative `booleanFields`,
the counterpart of its existing `exclude` and `idrefs`, and each codec names its own exceptions.
`GenericChangeCodec` takes an optional third argument, since it serves six change classes and only two have a boolean
variable. Keying this on codec names was rejected: they come from `template.constructor.name` here, which minification
would mangle.

### Verification beyond the suite

Each fork probed the behavior rather than reasoning about it. Confirmed: `entryX="0"`, `exitY="0"`, `fontSize="0"`,
`strokeWidth`, `fontStyle`, `opacity`, `arcSize` and `html` all stay numbers, `entryX` being the regression the plan
flagged; `Geometry._x="0"` stays `0` while `relative="1"` becomes `true`; unrecognized spellings keep today's values,
`rounded="yes"` staying `'yes'` and `shadow="2"` staying `2`; and the byte identical round trip passes, so the format
did not change.

### Deviations

- The three per-path expectation functions collapsed into one shared function in the fixture. The split existed
  because the paths disagreed, which is precisely what the fix removed, so keeping three identical wrappers would have
  been duplication describing a divergence that no longer exists.
- Two side effects of the nullish guard on the stylesheet path, both correct and both worth a line in the pull
  request: an explicitly empty `value=""` is now stored rather than dropped, and an evaluated-text result of `0`,
  `false` or `''` is no longer discarded.
- No `FIX should be` marker remains anywhere under `packages/core/__tests__`. The only suppressions left in the
  serialization tests are the three documenting an intentional mxGraph compatibility deviation.
