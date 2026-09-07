# Implementation Plan: XML deserialization must produce real booleans

Branch `fix/xml-boolean-deserialization`, off `origin/main`. Exploration in `explore.md`, raw reports in `raw/`.

## Overview

The XML pipeline never produces a boolean. Three independent decode sites apply "a numeric-looking string becomes a
number", deciding on the shape of the VALUE and never on the type of the target, so `rounded="1"` lands in
`CellStateStyle.rounded` as the number 1 and `vertex="1"` lands in `Cell.vertex` as the number 1.

The strategy has four parts, in this order:

1. **Characterization tests first.** One shared table drives all three decode paths and asserts today's wrong values.
   The table is the single source of truth, so the fix commit flips expectations by editing one function per path
   rather than hundreds of literals. A compile-time exhaustiveness guard in the fixture makes a future 37th boolean
   property impossible to forget.
2. **Decode fix.** A new overridable predicate answers "is this attribute boolean", consulted BEFORE the numeric
   branch, backed by two mechanisms: a runtime type oracle for codec-backed class instances, and an explicit key list
   for style objects, which no oracle can serve.
3. **Encoder alignment.** The XML keeps 1/0 everywhere. `ObjectCodec` already emits 1/0 and does not change; the two
   codecs that emit the words `true`/`false` are aligned onto 1/0.
4. **Docs and decision record.** No public registration API, recorded as an ADR.

Two invariants the whole plan rests on:

- The DECODER must accept `1`, `0`, `true` and `false`. Released versions have been exporting `value="true"` from
  `StylesheetCodec`, so such files exist and today decode to the truthy string `'true'`.
- The ENCODER must keep emitting 1/0. mxGraph and draw.io readers compare with `== 1` / `== '1'`
  (`mxShape.js:1372-1375`, `mxRectangleShape.js:50,68,83`, `mxGraph.js:6372,9318`) and would read `"true"` as unset.

## Dependencies and ordering

- Step 1 is test-only and must be green before step 2 starts.
- Step 2 needs `BooleanCellStateStyleKeys` (`types.ts`) and `parseBoolean` (`internal/`) before the three codec sites.
- Step 3 is independent of step 2 and could ship separately, but belongs here because aligning `StylesheetCodec`'s
  output makes its falsy-drop bug reachable for booleans, so the two must land together.
- PR #1160 (`ConnectionsMixin.ts:175`) and draft PR #1028 (type-safe `setCellStyles`) touch neither the serialization
  layer nor the tests below. Keep this diff inside `serialization/` plus `types.ts` and `internal/`, and rebase once
  they land.

## File changes

### Step 1, characterization tests (test-only, green on the unfixed code)

#### `packages/core/__tests__/serialization/boolean-style-properties.ts` (NEW)

- Apache-2.0 header copied verbatim from `serialization.xml.mxGraph.test.ts:1-15`, `Copyright 2026-present`.
  No `.test.ts` suffix, matching `serialization/utils.ts` and `codec/shared.ts`.
- Derive the key type from the interface, mirroring `NumericCellStateStyleKeys` (`types.ts:980-984`), and derive it
  from `CellStyle` rather than `CellStateStyle` so `ignoreDefaultStyle` (`types.ts:76`) is included: the real count is
  **36**, not 35.
- CRITICAL: write the conditional as `NonNullable<CellStyle[K]> extends boolean`, NOT the
  `extends boolean | undefined` spelling of the numeric twin. `orthogonal?: boolean | null` (`types.ts:614`) fails the
  naive test, so the copied spelling would silently drop it and the exhaustiveness guarantee would be false.
- Export the 36-key array `as const`, plus the two compile-time guards: one assigning the array to
  `readonly BooleanStyleKey[]` (catches a typo or a renamed property), one asserting
  `[Exclude<BooleanStyleKey, (typeof KEYS)[number]>] extends [never]` with a string literal as the failing type so
  `tsc` prints a readable message. `no-unused-vars` is off and `noUnusedLocals` unset, so the unused consts lint clean.
- Export a case type `{ key: string; raw: string }`. Type `key` as `string` deliberately: any narrower type would
  force suppressions downstream.
- Export four raw variants per key: `"1"`, `"0"`, `"true"`, `"false"`.
- Export one EXPECTATION FUNCTION PER PATH, not literal expectations. This is the pivot of the whole plan: the fix
  commit edits three small functions instead of hundreds of rows. Current behavior to encode:
  - path A and B: `"1"` gives 1, `"0"` gives 0, `"true"` gives `'true'`, `"false"` gives `'false'`.
  - path C: same, EXCEPT `"0"` gives the property ABSENT, because `StylesheetCodec.ts:176` guards with `if (value)`.
- Export three input builders driven by the same key list: a style string for path A, an `<Object ... as="style"/>`
  element for path B, a `<Stylesheet><add as=...><add value=... as=.../></add></Stylesheet>` document for path C.
- Export `buildExpectedStyle(cases, path): Record<string, unknown>`. The `Record<string, unknown>` return is what
  makes the whole matrix suppression-free, since `toEqual` accepts `unknown`
  (`node_modules/expect/build/index.d.ts:265`) and only a `CellStyle`-typed position forces a `@ts-ignore`.

#### `packages/core/__tests__/serialization/codec/mxgraph/utils.test.ts` (EXTEND, path A)

- Add a `describe` for the exhaustive boolean matrix inside the existing `describe('convertStyleFromString')`
  (`:21-81`). No lifecycle hooks: the function is pure and the file has none.
- One aggregate case putting all 36 keys in a single style string with one `toEqual` on the whole object, plus a
  `test.each` per (key, raw) so a failure names the property.
- `test.each` must keep the tuple plus `'%s'` form mandated by `.claude/rules/testing/conventions.md`; compose the
  first element as `` `${key}="${raw}"` `` to keep 144 titles distinct.
- Cover the `autosize` to `autoSize` rename explicitly (`fieldMapping` at `codec/mxGraph/utils.ts:19`): the raw style
  string says `autosize`, the decoded property is `autoSize`. This is the case that will break a naive implementation
  looking up the unmapped key.
- Remove the `<CellStyle>` cast at `:77` and the `@ts-ignore` at `:76` while touching the file: the suppression exists
  only because of the cast.

#### `packages/core/__tests__/serialization/serialization.xml.booleanProperties.test.ts` (NEW, path B and the classes)

- New file rather than growing `serialization.xml.test.ts`, which is already 542 lines and organized by scenario.
  The name follows the existing `serialization.xml.<variant>.test.ts` convention.
- Two lifecycles in the same file, one per describe, both already used in the tree:
  `beforeAll` + `afterEach` with `unregisterAllCodecs()` for the `ModelXmlSerializer` describe
  (`serialization.xml.test.ts:102-108`), plus `beforeEach(registerCoreCodecs)` for the raw-`Codec` describe
  (`StylesheetCodec.test.ts:5-13`).
- Describe 1, isolated: decode a bare `<Object rounded="1" .../>` through `importToObject` from `codec/shared.ts`,
  which exercises `convertAttributeFromXml` with no Cell or model machinery. `registerCoreCodecs` registers a codec
  named `Object` (`register-shared.ts:37`).
- Describe 2, realistic: the same style on a real `<Cell>` through `ModelXmlSerializer`, so the `mxCellCodec` and
  native `<Object as="style">` shapes are both covered.
- Describe 3, the non-style booleans, which is the "all classes" scope the maintainer asked for. Cover `Cell.vertex`,
  `Cell.edge`, `Cell.connectable`, `Cell.visible`, `Cell.collapsed`, `Geometry.relative`, the four
  `GraphDataModel` flags, the four `GraphView` flags, `AbstractGraph` options (`foldingEnabled`,
  `collapseToPreferredSize`, currently decoded as 1 UNNOTICED because the import test at
  `all-graph-classes.test.ts:110-123` asserts only `pageFormat` and `collapsedImage`), `Multiplicity.source`
  (`view/other/Multiplicity.ts:91`, encoded as `source="1"` at `all-graph-classes.test.ts:51`),
  `CollapseChange.collapsed` and `VisibleChange.visible` through `GenericChangeCodec`, `TerminalChange.source`, and
  the `Editor` flags through `EditorCodec`.
- `Geometry.relative` needs care: `ModelChecker` compares the whole geometry with `toEqual` against a real `Geometry`
  instance whose `relative` is the boolean `false`, so a decoded `1` cannot be expressed that way. Assert
  `geometry.relative` directly instead of going through `checkCellBaseProperties` (`utils.ts:88`).

#### `packages/core/__tests__/serialization/codec/StylesheetCodec.test.ts` (EXTEND, path C)

- Reuse the existing lifecycle and the `importToObject` / `exportObject` helpers.
- Add the 36-key matrix, and make the two pathological cases explicit and commented, since they are what the fix is
  most likely to overlook: `value="0"` makes the property VANISH (`:176`), and `value="false"` becomes the truthy
  string `'false'`.
- Keep the existing `value="true"` INPUT at `:39` permanently, as the regression case for stylesheets exported by
  released versions.

#### `packages/core/__tests__/serialization/utils.ts` (EXTEND)

- Widen `ExpectCellProperties.style` (`:5-8`) from `CellStyle` to `CellStyle | Record<string, unknown>`. This single
  line is what forces the four `@ts-ignore` in `serialization.xml.test.ts` and the three in
  `serialization.xml.mxGraph.test.ts`; widening it lets the fix commit DELETE all seven. Strictly additive, every
  current call site still type checks.
- Keep `expect(cell.style).toEqual(...)` at `:89`: whole-object comparison is exactly what the matrix needs, catching
  a wrong value AND a missing or extra key, which is essential for path C.
- Leave `expect(cell.vertex).toEqual(1)` (`:59`) and `expect(cell.edge).toEqual(1)` (`:70`) as they are for this
  commit. Do NOT add an option such as `{ vertexIsNumeric }`: it would let the fix pass while one branch still
  asserted the bug.

### Step 2, the decode fix

#### `packages/core/src/types.ts`

- Add `BooleanCellStateStyleKeys` immediately after `NumericCellStateStyleKeys` (`:979-984`), same `@category Style`
  tag, using the `NonNullable<...> extends boolean` form so `orthogonal` is included.
- Nothing else in this file changes.

#### `packages/core/src/internal/utils.ts` (or a new `packages/core/src/internal/boolean-utils.ts`)

- Add `parseBoolean(value: unknown): boolean | undefined`: `'1'` and `'true'` give `true`, `'0'` and `'false'` give
  `false`, anything else gives `undefined`.
- The `undefined` return is load-bearing, not defensive: an unrecognized token such as `rounded="yes"` must fall
  through to today's numeric or string behavior rather than silently becoming `false`. That is the exact trap
  `StencilShape.ts:73`'s `toBoolean` falls into, which is why it must not be reused.
- `internal/` is confirmed non-public (no `index.ts` export, no package subpath, every symbol tagged
  `@private not part of the public API`), and it is the lowest layer, so `serialization/` may depend on it freely.
  Tag the new export the same way and give it an explicit return type per `coding-practices.md`.
- Do NOT put this in `util/mathUtils.ts`: it is not math, and `export * as mathUtils` (`index.ts:166`) would freeze it
  as public API by accident.

#### `packages/core/src/serialization/boolean-attributes.ts` (NEW)

- Hold the runtime list of the 36 boolean style keys, declared `as const satisfies readonly BooleanCellStateStyleKeys[]`
  so a typo fails to compile, plus an `Exclude<...> extends never` assertion so a boolean property added to
  `CellStateStyle` later fails the build until it is listed. This is the mechanism that delivers the maintainer's
  "ensure we fix all properties" requirement mechanically rather than by vigilance.
- Export two predicates: one for a style key, one for a field of a target object.
- The precedent for this artifact is `geometryNumericAttributes` / `pointNumericAttributes`
  (`ObjectCodec.ts:28-34`), a module-level typed array consulted by `isNumericAttribute`. Same shape, one level up.
- Keep it a plain module imported directly by the three codecs, NOT a registry. If the built-in keys sat behind a
  registration call, an application that forgot the call would silently lose correct decoding, reproducing the
  `Graph` versus `BaseGraph` footgun documented in `website/docs/usage/global-configuration.md:64-67` and
  `tree-shaking.md:189-202`. A plain module also keeps the fix tree-shakeable: an app that never decodes XML pays
  nothing.

#### `packages/core/src/serialization/ObjectCodec.ts`

- Add a public overridable predicate `isBooleanValueAttribute(dec, attr, obj): boolean`, signature matching
  `isNumericAttribute(dec, attr, obj)` (`:597`) exactly so the two read as a pair. The name must NOT be
  `isBooleanAttribute`: that is taken by the encode side (`:564`) with the incompatible signature
  `(enc, obj, name, value)`, and overloading it would be source-breaking for anyone overriding the encoder hook.
- Its base implementation combines the two mechanisms:
  - a runtime type oracle for class instances, reading `obj[fieldName]` rather than `this.template[fieldName]`. Both
    agree for every literal-initialized field, but `obj` also behaves correctly in the `decode(node, into)` path
    (`:688`) where the caller passes an already built instance, it covers user classes auto-registered by
    `CodecRegistry.getCodec` (`CodecRegistry.ts:112-118`), and it needs no template reasoning.
  - the style key list for plain objects, because the generic `Object` codec cannot be served by any oracle: its
    template is `{}` (`register-shared.ts:19`) AND its `cloneTemplate()` returns `{}` (`:285`), so neither
    `template[name]` nor `obj[name]` is ever a boolean for a style object.
  - Discriminate the two the way `isNumericAttribute` already does at `:600-601` with `obj instanceof Geometry` and
    `obj instanceof Point`. State in the JSDoc the accepted looseness: a plain `<Object>` that is not a style gets
    style-key semantics, exactly as it already gets `isNumeric` semantics today.
- In `convertAttributeFromXml` (`:576-587`), consult the new predicate BEFORE the `isNumericAttribute` branch, parse
  with `parseBoolean`, and return early only when the result is not nullish so an unrecognized token still falls
  through to the existing code.
- Do NOT teach `isNumericAttribute` about boolean keys. Its documented contract (`:589-596`) is a question about the
  shape of the value; making it answer `false` for `"1"` because the KEY is boolean would be a lie inherited by every
  subclass, and `CellCodec.isNumericAttribute` (`CellCodec.ts:75-77`) delegates to `super`, so that override's
  meaning would drift. Placing the check in `convertAttributeFromXml` also makes the fix immune to a user override of
  `isNumericAttribute` written as an unconditional `return true`.
- Do NOT hook `decodeAttribute` (`:753`): `mxCellCodec.decodeAttribute` (`mxCellCodec.ts:31-38`) overrides it and
  bypasses `super` for `style`, so logic there would be dead for that codec.
- Note for the implementation: `convertAttributeFromXml` is called at `:761` BEFORE `fieldname` is computed at `:762`,
  and `:778` assigns with the RAW attribute name. No shipped codec passes a `mapping` (none of the ~20 registrations
  passes the fourth constructor argument), so the predicate receives `attr.nodeName`. Either document that the lookup
  is attribute-name keyed, or call `getFieldName` inside the predicate.
- Fix the stale comment at `:757-760`, which already claims the decoder "converts the string true and false to their
  boolean values". It is false today and this change is what makes it true.
- `convertAttributeToXml` (`:540-554`) and `isBooleanAttribute` (`:564-566`) are NOT touched: the loose `==` there
  maps both `1` and `true` onto `"1"`, which is why the byte-identical round trip keeps passing.

#### `packages/core/src/serialization/codec/mxGraph/utils.ts`

- Introduce a key-aware conversion at the CALL SITE (`:38`), not inside `convertToNumericIfNeeded` (`:46-57`), which
  receives no key: try the boolean parse first when the key is a known boolean, then fall back to the existing
  numeric helper, then to the raw string. Leave `convertToNumericIfNeeded` key-blind and untouched.
- CRITICAL: look the key up in its MAPPED form, `fieldMapping.get(key) ?? key` (`:19`). The list is derived from
  `CellStateStyle` where the property is `autoSize`, while the mxGraph string says `autosize`. Using the raw key would
  leave `autoSize` decoding as a number, which is exactly the expectation at
  `__tests__/serialization/codec/mxgraph/utils.test.ts:78`.
- `ignoreDefaultStyle` is set programmatically at `:10` and never passes through the converter, which is why
  `utils.test.ts:42` already asserts `true`. Keep that path untouched.
- Leave `html` numeric: it is a draw.io extension not declared in `CellStateStyle`, so it cannot come from the derived
  list, and three expectations depend on it (`utils.test.ts:55`, `serialization.xml.mxGraph.test.ts:107,154`).

#### `packages/core/src/serialization/codec/StylesheetCodec.ts`

- Add the boolean step inside the `else` branch of `decode`, between `:169` (`getAttribute('value')`) and `:171`
  (the `isNumeric` check). The key is already in scope at `:160`.
- Keep the boolean step OUT of the `doEval` branch (`:166-168`), which already yields real JS types and must not be
  re-parsed.
- MANDATORY, not optional: replace `if (value)` at `:176` with `if (!isNullish(value))`. Today `value="0"` becomes the
  number 0, is falsy, and the property is dropped entirely; after the fix `false` would be dropped the same way, so
  aligning the encoder to write `"0"` makes this bug reachable for booleans. `isNullish` is the form required by
  `coding-practices.md`, and `:24` already imports from `internal/utils.js`.
- This codec fully overrides `decode` (`:129`) and never routes through `convertAttributeFromXml`, which is the reason
  the conversion must live in a shared free function that both codecs import, with the `ObjectCodec` method as a thin
  overridable wrapper.

### Step 3, encoder alignment onto 1/0

#### `packages/core/src/serialization/codec/StylesheetCodec.ts`

- In `getStringValue` (`:84-95`), add a `typeof value === 'boolean'` branch returning `'1'` or `'0'`. Today a boolean
  falls through both existing branches and is returned as a boolean from a method declared `string | null` (`:84`), a
  latent type lie, then stringified to `"true"` by `setAttribute` (`:67`).

#### `packages/core/src/serialization/codec/GraphViewCodec.ts`

- Widen `setNodeAttribute` (`:24-26`) to accept `number | boolean` and map a boolean to `'1'` / `'0'` in that one
  place. A boolean only reaches it today because the `@ts-ignore` at `:112` makes the value `any`.
- Optional, free, and consistent: `:95` hardcodes `node.setAttribute('html', 'true')`. No test asserts it. Align it or
  leave it, but decide rather than discover it later.

### Step 4, documentation and the decision record

#### `packages/website/docs/usage/codecs.md`

- `:212` currently states "Note that the codecs will turn booleans into numeric values" as intended behavior. It stays
  true for the ENCODE side and must be qualified: the XML keeps 1/0, while decoding now yields real booleans.
- The page's "Using custom object and custom Codec" section (`:162-177`) is where the new
  `isBooleanValueAttribute` hook belongs, and where a user with a module-augmented boolean style property is told to
  override it.

#### `docs/adr/0004-*.md` (NEW)

- Record the decision NOT to ship a runtime registration API for custom boolean style keys, following the conventions
  in `docs/adr/README.md` (Status field, one decision per file, record what was rejected and why). The rejected
  options and their costs are in `raw/06-registration-api.md`: the built-in list must stay a plain module under every
  option, and adding the API later is 8 to 9 files of which 3 are already touched here, so nothing is locked in.

#### `CHANGELOG.md`

- Per the project policy, only breaking changes are listed. Two candidates, both for the maintainer to rule on:
  a user override of `isNumericAttribute` is now bypassed for boolean keys (someone who broadened it to return
  `false` for `rounded` used to receive the string `'1'` and now receives `true`), and `StylesheetCodec` export
  changes `value="true"` to `value="1"`.

## Testing strategy

- Characterization commit: 3 aggregate cases plus 3 x 144 rows, plus roughly 25 non-style class fields. All green
  before any source change. Run `npm test -w packages/core`, then `npm run test-check -w packages/core`, which is what
  actually type checks the tests (`tsc --noEmit -p tsconfig.test.json`, every file under `__tests__`, `strict: true`),
  and is a separate CI gate on three OSes (`.github/workflows/build.yml:55-56`). `@swc/jest` type checks NOTHING.
- Fix commit: edit the three expectation functions in the fixture, then the 14 existing assertions, then delete the 7
  now-unnecessary `@ts-ignore` and the two misleading encode comments. The list of 14, with the two the `FIX should be`
  markers missed, is in `raw/08-test-matrix.md`.
- Watch `serialization.xml.test.ts:286-292` (`Import then export - expect the same xml content`) as the canary: it
  must keep passing byte-identically. If it fails, the encoder was changed rather than aligned.
- Full CI before the PR, per `CLAUDE.md`: build core, `test-check`, tests with coverage, ts-support, the examples
  script, the html build, circular dependencies, lint, and the npm package check.

## Rollout considerations

- Behavior change for consumers: decoded style booleans and `Cell.vertex` / `Cell.edge` change from `1`/`0` to
  `true`/`false`. The blast radius was measured and is small: ZERO strict comparisons (`=== true`, `!== false`) exist
  in `packages/core/src` or its tests, and no code does arithmetic on these values. Two sites actively improve:
  `ConnectionHandler.ts:1513` stops reporting a spurious difference between an XML-loaded `1` and a code-built `true`,
  and the dedup at `XmlCanvas2D.ts:357,601` starts working for mixed graphs.
- The XML format does not change, so no migration is needed for existing files, and mxGraph and draw.io
  interoperability is unaffected.
- Deliberately OUT of scope, each with its owner: `GraphLayout.ts:244` and the type-safe `setCellStyles` belong to
  draft PR #1028; the story sites (`HoverStyle.stories.js:46`, `OrgChart.stories.js:118-136`) are fixed by the
  TypeScript migration, issue #1035; `CellsMixin.ts:1175-1185` (exhaustive branches treating unset as `false`) and
  the broken `extend` in `StylesheetCodec.ts:145` (a `Map` indexed as an object, so `extend=` never resolves and no
  test covers it) each deserve their own issue.

## Decisions still needed from the maintainer

1. `@ts-expect-error` instead of `@ts-ignore` for any suppression that survives? `tsc` raises TS2578 on an unused
   directive, so CI would FORCE the fix commit to touch every flipped line. The repo uses `@ts-ignore` exclusively
   (26 occurrences) and `ban-ts-comment` is off. Recommended: use `@ts-expect-error` for the characterization
   suppressions only, if any remain after the `Record<string, unknown>` design.
2. 144 rows per path, or trim to the `"1"` / `"0"` variants per key (72) plus aggregate cases for the word spellings?
   Recommended: keep all 144, they are cheap and the word spellings are where path C misbehaves worst.
3. `ObjectCodec.decodeChild` (`:811-834`), a fourth decode site that converts NOTHING: `<add as="rounded" value="1"/>`
   under a generic `<Object>` yields the string `'1'`. Only the array-element shape is exercised today. Route it
   through the same conversion, or leave and document? Recommended: leave it, and name it in the PR description.
4. Align `GraphViewCodec.ts:95` (`html="true"`) too, or leave it?
