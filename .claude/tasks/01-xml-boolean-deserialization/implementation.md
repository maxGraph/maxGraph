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

## Task 11, the encoders aligned onto 1 and 0

Done, commit `b4a4301d6`. Full suite 63 suites and 1201 tests, one more than before because of the new round trip
test. Build, `test-check`, lint and the circular dependency check clean.

- The stylesheet value stringifier converts a boolean instead of returning it from a method declared to return a
  string and letting the DOM spell it out.
- The graph view attribute writer accepts a boolean and converts it in that one place, where it previously only
  received one because a type suppression widened the value.
- New round trip test: exporting a false property writes `0` and importing it back yields `false`. It is the test that
  ties task 09 and task 11 together, since the old truthiness guard would have dropped the value on the way back in.

### Open decision 4, settled with evidence

The hardcoded word on the `html` marker of the graph view format STAYS, and the code now says why: mxGraph's own
`mxGraphViewCodec.js:96` does `setAttribute('html', true)`, which the DOM spells as `html="true"`, so the maxGraph
port is byte identical to the ancestor. It is not a style property and that export format has no decoder, so aligning
it would buy nothing and lose fidelity.

Two test expectations updated, the only two that recorded the word form as correct: the graph view export and the
stylesheet export. The INPUT of the stylesheet import test keeps the word form permanently, as the regression case for
files exported by released versions, and it is now the only `="true"` left under `packages/core/__tests__`.

## Task 12, the registration API

Done, commit `a1e863a12`. Suite 64 suites and 1210 tests, and every CI check green including the ts-support compile
check and the circular dependency check.

Exported as planned: `registerCustomBooleanCellStylePropertiesForCodecs` and
`unregisterAllCustomBooleanCellStylePropertiesForCodecs`, named exports in `index.ts` rather than an `export *`, so
the list and the predicates stay out of the public API. Verified: the package `exports` map only exposes the root, so
a consumer cannot deep import them either.

### The finding that changed the shape of the test

Declaring the augmentation inside a core test file BREAKS the library's own exhaustiveness assertion. `test-check`
compiles the tests together with the sources they import, so the augmented property joins `BooleanCellStyleKeys` and
the built-in list no longer covers it, which is exactly what that assertion is there to report. The guard and an
in-repo augmentation are mutually exclusive by construction.

So the two halves are checked in the two places that can each carry one:

- the core unit test uses a documented cast and covers the RUNTIME contract: a declared property decodes as a boolean
  on all three paths in all four spellings, an undeclared one still decodes as a number, the teardown clears only the
  custom set, and the built-in properties keep working with no call.
- `packages/ts-support` covers the TYPE contract from outside the package, compiling against the published
  declarations with TypeScript 3.9.10: an augmented boolean property is accepted, while a misspelled name and a
  declared property of another type are both rejected, each behind `@ts-expect-error` so the check fails if they ever
  start compiling.

Verified that the private assertion is absent from the emitted declarations, so a consumer's augmentation cannot make
the library's own `.d.ts` fail to compile. And verified with a red check that a misspelled property name is a compile
error: `error TS2345: Argument of type '"myCustomFlg"' is not assignable to parameter of type 'BooleanCellStyleKeys'`.

## State at 2026-09-07, before a context compaction

Branch `fix/xml-boolean-deserialization`, 26 commits ahead of `origin/main`, NOTHING PUSHED, working tree clean.
Suite 64 suites and 1210 tests, and every CI check green: build, `test-check`, tests, ts-support, circular
dependencies, lint.

Tasks 01 to 12 are done and ticked in `tasks/index.md`. Remaining:

- **Task 13**, the Extending guide plus the links from the codec and global configuration pages. Blocked only on the
  task 15 decision, which its limits section must state.
- **Task 14**, ADR 0004 and the changelog ruling. Ready, independent of 15.
- **Task 15**, the child element form of a style value, BLOCKED on the maintainer choosing among the options below.

### Task 15, the options as presented, with the measurements behind them

Measured, not assumed: in the child form EVERY value stays a string today, not only booleans.
`<Object><add as="rounded" value="1"/><add as="strokeWidth" value="2"/></Object>` yields `"1"` and `"2"`, and an array
element `<Array><add value="1"/></Array>` yields `"1"` as well. The only in-repo uses of the shape are
`<Stylesheet><add as="defaultVertex">`, which `StylesheetCodec` handles through its own `decode` override rather than
through `ObjectCodec.decodeChild`, so that map entry form is effectively untested and is never produced by maxGraph's
own encoder. It is a hand written XML path.

- **A. Leave and document.** Zero cost and zero risk. The inconsistency stays: attribute form gives `true`, child form
  gives `"1"`. The guide gains a paragraph saying registration does not cover that shape.
- **B. Boolean only, for the `as` named form.** About three lines, gated on the field name being a declared boolean
  property or the target field already holding a boolean. Closes exactly the inconsistency this work made visible,
  changes nothing about numbers, so arrays and every existing test are untouched. The numeric half becomes its own
  issue. RECOMMENDED.
- **C. Boolean and numeric, for the `as` named form.** Makes the child form equivalent to the attribute form, so
  `strokeWidth` becomes a number too. Changes a dimension nobody reported, and a hand written entry meant as text but
  looking numeric would change type. The attribute path already has that looseness, so it is defensible, just wider.
- **D. C plus array elements.** Rejected: `<Array as="baseStyleNames"><add value="1"/></Array>` would turn a style
  name into a number.

### Decisions already taken, for the pull request description

- The XML format does not change: the encoder writes 1 and 0 everywhere, which is the only form mxGraph and draw.io
  read back. The two `FIX boolean values should be set to true/false` comments were deleted rather than implemented.
- `GraphViewCodec`'s hardcoded `html="true"` stays, mirroring `mxGraphViewCodec.js:96`. Not a style property, and that
  export format has no decoder.
- Two side effects of the nullish guard on the stylesheet path, both correct, both worth a line in the pull request:
  an explicitly empty `value=""` is now stored rather than dropped, and an evaluated-text result of `0`, `false` or
  `''` is no longer discarded.
- Changelog candidates for task 14 to rule on: a user override of `isNumericAttribute` is now bypassed for boolean
  properties, and `StylesheetCodec` export changes `value="true"` to `value="1"`. The new registration functions are
  additive, so they get no entry under the project policy.

### Follow-up issues to file, none of them filed yet

1. `Multiplicity`: RESOLVED, nothing to do, and the characterization test was REMOVED. No codec is registered for the
   class, so `Codec.decode` keeps a clone of the XML element: the values are preserved and simply never turned into a
   `Multiplicity`. The earlier claim in these notes that a `source="1"` was LOST was wrong, measured: the element
   keeps `source="1"` and `type="rectangle"`. The maintainer's ruling is that a `Multiplicity` is **not intended to be
   serialized at all**, since it will only be used by a new plugin extracted from `ValidationMixin`. A test asserting
   how an unsupported input decodes would pin an accident and would obstruct that extraction, so it was dropped rather
   than kept.

2. `StylesheetCodec` read the style to extend with `obj.styles[extend]` while `Stylesheet.styles` is a `Map`, so
   `extend=` never resolved and the warning always fired: FIXED on the dedicated branch
   `fix/stylesheet-codec-extend`, off `origin/main`, one commit with four tests. Not pushed yet. It touches the same
   `decode` function as this branch, so expect a small conflict whichever lands second.
3. `CellsMixin.ts:1175-1185`, exhaustive branches treating an unset property like `false`.
4. The numeric half of the child element form, if option B is chosen for task 15.
5. Issue 2 of the original pair, the one this whole branch implements, was never filed as a GitHub issue. The draft is
   in the session scratchpad. Decide whether the pull request needs it for traceability.

## Task 15, the child element form of a style value

Answer: **option B**, booleans only, for the `as` named form.

`packages/core/src/serialization/ObjectCodec.ts`

- `decodeChild` now converts the value read from an `<add as="..." value="..."/>` child to a boolean when the field
  being written is a boolean one. The attribute predicate `isBooleanValueAttribute` is reused rather than duplicated,
  so an override of it covers both forms, and it is consulted with the MAPPED field name because that is the name
  `addObjectValue` writes to here, whereas `decodeAttribute` writes to the raw attribute name. An unrecognized
  spelling falls back to the string, exactly as on the attribute path.
- Deliberately not converted: numbers. `<add as="strokeWidth" value="2"/>` still yields the string `"2"`. That is
  follow-up issue 4.
- Untouched: array elements. They carry no `as`, so `getFieldName` returns `null` and the new branch is skipped, which
  is what keeps `<Array as="baseStyleNames"><add value="1"/></Array>` a list of strings.
- Fixed along the way: the JSDoc of `isBooleanValueAttribute` had been orphaned by the insertion of `booleanFields`
  between the block and the method, so the hook was undocumented and `booleanFields` carried two blocks. Reordered.
  The paragraph telling a reader to override the hook for a module augmented property now points at
  `registerCustomBooleanCellStylePropertiesForCodecs` first, and says why an override cannot cover the mxGraph style
  string form.

`packages/core/__tests__/serialization/serialization.xml.booleanProperties.test.ts`

- New describe block for the `add` children form: the 4 aggregate cases and the 144 per property rows, the same matrix
  the attribute form already had, plus three targeted tests: the two forms agree, a property of another type is still
  a string, and an unrecognized spelling is left untouched. 488 tests in this file, up from 337.

Verification: 64 suites and 1361 tests green, `test-check` clean, `npm run build -w packages/core` clean, eslint clean
on both changed files. The byte identical round trip test still passes, so the encoder was not touched.

## Task 14, the decision record and the changelog ruling

- `docs/adr/0004-register-custom-boolean-style-properties-for-codecs.md`, status `Accepted`. Four decisions: the
  properties the library declares stay a plain module-level constant and are never registered (this is the
  load-bearing half, it is what rules out the footgun), the minimal additive API, the two compile-time checks with the
  assertion deliberately unexported so the unresolved conditional never reaches the published `.d.ts`, and
  `booleanFields` plus the overridable predicate as a complement rather than a substitute. All four rejected options
  are recorded with their costs, including the arguments that supported doing nothing, since those are the ones to
  revisit if the API is ever reconsidered.
- `docs/adr/README.md`, the index row and one sentence of prose placing 0004 as the first ADR about the extensibility
  of the public types rather than about class structure.
- `CHANGELOG.md`, the ruling: one **Breaking Changes** bullet for the decoded values becoming real booleans, with the
  `== 1` migration spelled out, the note that the XML format itself does not change, and the `isNumericAttribute`
  override bypass folded in; one **Other Changes** bullet for `StylesheetCodec` writing `value="1"` instead of
  `value="true"`, following the precedent of the existing bullet about the child element order. Nothing for the
  registration functions, which are additive.

## Task 13, the Extending guide

`packages/website/docs/usage/extending.md` (new), titled `Extending maxGraph`. The page is deliberately not scoped to
styles, since other extension subjects will be added to it, so its structure separates the two levels:

- `## Introduction` maps the extension points that already have a page of their own, `edge-styles.md`,
  `perimeters.md`, `cell-handlers.md`, `plugins.md`, `codecs.md`, `image-bundles.md`, plus
  `global-configuration.md` and `tree-shaking.md` for the registries they write to, with one plain line for custom
  shapes, which have no page and go to the `ShapeRegistry`. It then states what this page is for: what those pages do
  not cover, the extension points that need something declared beyond a single registry call.
- `## Extending the Cell style` holds everything style specific, as `###` subsections, so a future `## Extending ...`
  sits beside it rather than inside it.

The subsections, in the order a reader needs them:

1. `When custom style properties are useful`, prose and bullets only, each case tied to the API that actually receives
   the style: a custom shape reads `this.style`, a custom perimeter and a custom edge style read `state.style` from
   the `CellState` they are handed, a custom marker reads `shape.style`, and application data survives an XML round
   trip because the codecs encode the whole style object. It closes on the alternatives a declaration replaces:
   hardcoding the value, abusing an unrelated built-in property, or casting.
2. `Adding custom properties to the style types`, the `declare module` mechanics, `CellStyle extends CellStateStyle`,
   when to augment `CellStyle` directly, optional properties, and the TypeScript 3.9 minimum.
3. `A shape configured by its own style property`, a `BadgedRectangleShape` extending `RectangleShape`, reading
   `this.style?.badgeColor` and drawing with `setFillColor`, `ellipse` and `fillAndStroke`, registered with
   `ShapeRegistry.add`. It overrides `paintVertexShape` like the shipped `packages/ts-example/src/custom-shapes.ts`
   does, and every call in it was checked against the real signatures rather than written from memory: an earlier
   draft used a `c.text(...)` call whose argument list did not exist.
4. `Only boolean properties must be declared to the codecs`, opening with an admonition that the whole section applies
   from 0.25.0, since until then every boolean style property decoded as `1` or `0`, maxGraph's own included, with no
   way to change it.
5. `Declaring custom boolean properties to the codecs`, the registration, the four serialized shapes it covers, decode
   only, global state, the `unregisterAll` companion and the `BooleanCellStyleKeys` typing.
6. `Scoping the decoding to a custom Codec`, the `isBooleanValueAttribute` override and `booleanFields`, with the
   honest scope limit: it covers the attribute and child element forms of that codec only, and cannot reach the
   mxGraph style string form.
7. `Limits`, the two measured facts about the child element form.

The example was moved out of section 1 into its own section 3 on the maintainer's instruction: it used
`declare module` a section before the augmentation was explained. Three other orderings were proposed and rejected,
the one kept being motivation prose, then mechanics, then the worked example.

`packages/website/docs/usage/codecs.md`, the sentence that presented numeric booleans as intended behaviour is
qualified rather than deleted: it stays true of encoding, and decoding produces real booleans since 0.25.0. Two links
to the guide, one in the custom codec section and one beside the corrected sentence.

`packages/website/docs/usage/global-configuration.md`, the register and unregister pair documented in the
`## Codecs and Serialization` section, NOT in `## Styles` where it first landed: the declaration is only needed by an
application that decodes XML, so placing it among the style registries suggested it was mandatory for anyone
extending a style.

Every name used in the guide was checked against the exports: `Codec`, `ObjectCodec`, `booleanFields`,
`registerCoreCodecs`, `RectangleShape`, `ShapeRegistry`, `AbstractCanvas2D`, the two registration functions and
`BooleanCellStyleKeys` are all reachable from the package entry point. `npm run build -w packages/website` was run
after each change, and reports no broken link or anchor.

## Corrections made while finishing

- **"Module augmentation shipped one release ago" is false**, in `plan.md` and in `raw/06-registration-api.md`. The
  commits that unlocked it (`632341982` and `67bdd9c9e`) are still under `## Unreleased`, so it ships in the same
  0.25.0 release as this fix. The ADR and the guide say so correctly, the two planning notes keep the wrong claim as
  written at the time.
- **"Three shapes" became four** once task 15 landed. Updated in the `registerCustomBooleanCellStylePropertiesForCodecs`
  JSDoc, in the ADR consequence and in the changelog bullet, naming the child element form distinctly from the
  stylesheet entry form.
- **The JSDoc of `isBooleanValueAttribute` was orphaned** by the insertion of `booleanFields`. Fixed with task 15.

## Bundle size budgets

The examples script had never actually run on this branch: `packages/ts-example` was missing the
`vite-bundle-analyzer` dev dependency added by `95689c7dc`, so it aborted on the first example until `npm install`
was run. The lock file was already correct and did not change.

With the examples actually building, two of the six exceeded their size budget, and they are exactly the two that
import `ModelXmlSerializer`, `js-example` and `js-example-selected-features`. The other four contain no codec
reference at all and are unchanged. The growth is the serialization code this fix adds, chiefly the 36 name list and
the predicates, and it is between 1.6 and 2.6 kB minified.

Both budgets updated to the measured size rounded up to the next kB, per
`.claude/rules/tooling/bundle-size-budgets.md`:

- `packages/js-example/webpack.config.js`: asset 467 000 to 469 000 (measured 468 576), entrypoint 473 000 to
  475 000 (measured 474 085)
- `packages/js-example-selected-features/webpack.config.js`: asset 385 000 to 387 000 (measured 386 635), entrypoint
  391 000 to 393 000 (measured 392 144)

The three vite examples and `js-example-without-defaults` still pass with their recorded values, which are already
the next kB above their current sizes, so nothing was padded there.

## Full CI, the list in CLAUDE.md, all green

| Check | Result |
|---|---|
| `npm run build -w packages/core` | pass |
| `npm run test-check -w packages/core` | pass |
| `npm test -w packages/core -- --coverage` | pass, 64 suites, 1361 tests |
| `npm test -w packages/ts-support` | pass, TypeScript 3.9.10 |
| `./scripts/build-all-examples.bash` | pass, after the two budget updates |
| `npm run build -w packages/html` | pass |
| `npm run check:circular-dependencies -w packages/core` | pass |
| `npm run lint` | pass |
| `npm run check:npm-package -w packages/core` | pass |
| `npm run build -w packages/website` | pass, no broken link |

All 15 tasks are done. Nothing committed yet at the time of writing: tasks 13, 14 and 15 plus the budget updates are
in the working tree.
