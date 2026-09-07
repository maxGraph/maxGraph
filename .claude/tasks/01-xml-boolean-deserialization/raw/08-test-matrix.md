# Raw exploration 8 (plan step): the characterization test matrix

## Type checking reality: the decisive answer

`@swc/jest` does NOT type check at all (jest.config.cjs configures only @swc/jest with
`jsc.parser.syntax: 'typescript'`; swc strips types, never runs tsc). `npm test` happily runs `{ rounded: 1 }`
against a boolean field.
BUT `test-check` is a separate CI-enforced gate that DOES cover the tests:
`"test-check": "tsc --noEmit --project tsconfig.test.json"`, and `packages/core/tsconfig.test.json` is three lines:
extends ./tsconfig, `include: ["__tests__/**/*.ts"]`, `exclude: ["src"]`. So EVERY test file is type checked with
`strict: true`, `skipLibCheck: false`, `noImplicitOverride`, `noImplicitReturns`.
`.github/workflows/build.yml:55-56` runs it on ubuntu, macos and windows BEFORE `npm test`. It currently passes clean.

**THE KEY FINDING: `toEqual` takes `unknown`** (`node_modules/expect/build/index.d.ts:265`
`toEqual(expected: unknown): R`). An UN-ANNOTATED object literal passed to toEqual is never checked against
CellStyle. That is exactly why `codec/mxgraph/utils.test.ts:29` gets away with `rounded: 0` and NO suppression, while
:78 needs one: :78 is inside `toEqual(<CellStyle>{ autoSize: 1 })`, an explicit cast.
Same for `serialization/utils.ts:59` `expect(cell.vertex).toEqual(1)`, no suppression despite `Cell.vertex: boolean`.
Suppressions are needed ONLY where the expected value flows through a CellStyle-typed position:
`ExpectCellProperties.style?: CellStyle` (`__tests__/serialization/utils.ts:5-8`), which is what forces all 4
@ts-ignore in serialization.xml.test.ts and the 3 in serialization.xml.mxGraph.test.ts, plus explicit `<CellStyle>` casts.

Linter: `eslint.config.mjs` sets `@typescript-eslint/ban-ts-comment: 'off'`, so a bare @ts-ignore is allowed.
`no-unnecessary-ts-expect-error` is NOT enabled (only the non-type-checked recommended preset is loaded and
`disableTypeChecked` is spread in). `__tests__` IS linted (root `eslint "**/*.ts"`, and the ignores list does not
cover it).
Repo spelling: `@ts-ignore`, 26 occurrences in __tests__, zero `@ts-expect-error`.
WORTH RAISING WITH THE MAINTAINER: `@ts-expect-error` would be strictly better here, because tsc raises TS2578
"Unused '@ts-expect-error' directive" once the value becomes a real boolean, so CI would FORCE the fix commit to
touch every flipped line. @ts-ignore is silent.
BEST ANSWER: design the matrix so ZERO suppressions are needed, by never typing an expected value as CellStyle.

## Shape of the matrix

One shared fixture module `packages/core/__tests__/serialization/boolean-style-properties.ts` (no .test.ts suffix,
matching `serialization/utils.ts` and `codec/shared.ts`), exporting:
- `BooleanStyleKey`, the derived type (see below), and `BOOLEAN_STYLE_KEYS` (36 keys) with the exhaustiveness guards.
- `interface BooleanCase { readonly key: string; readonly raw: string; readonly expected: unknown }`.
  `key` is deliberately `string`, not BooleanStyleKey, so nothing narrows and no suppression is needed.
- builders driven by the one key list: `buildStyleString(cases)` for path A, `buildObjectStyleXml(cases)` for path B,
  `buildStylesheetXml(styleName, cases)` for path C, and `buildExpectedStyle(cases): Record<string, unknown>`.
Because the expected object is `Record<string, unknown>` and toEqual takes `unknown`, no @ts-ignore anywhere.

FOUR raw variants per key, because the three paths diverge and each divergence is worth locking:

| key | raw | path A | path B | path C |
|---|---|---|---|---|
| rounded | "1" | 1 | 1 | 1 |
| rounded | "0" | 0 | 0 | **ABSENT (undefined)** |
| rounded | "true" | 'true' | 'true' | 'true' |
| rounded | "false" | 'false' | 'false' | 'false' |

Path A = `convertStyleFromString` -> `convertToNumericIfNeeded` (codec/mxGraph/utils.ts:45-57).
Path B = `ObjectCodec.convertAttributeFromXml` (:576-588) + `isNumericAttribute` (:597-605). Same outcome as A.
Path C = StylesheetCodec (:166-180): parseFloat, then `if (value)` at :176, so `value="0"` parses to 0, is falsy and
the property is SILENTLY DROPPED; and `value="false"` stays the truthy string 'false', wrong in the opposite
direction. These two are the nastiest cases in the whole bug and are currently untested.

Two granularities from the same table: one AGGREGATE test per path (all 36 keys in a single style string / single
<Object> / single <add>, one toEqual on the whole object, catches "the fix missed one" in one shot), plus a
`test.each` per (key, raw) so a failure names the property.

## File placement

| path | file | action |
|---|---|---|
| A | `__tests__/serialization/codec/mxgraph/utils.test.ts` | EXTEND, it already owns the function |
| B | `__tests__/serialization/serialization.xml.booleanProperties.test.ts` | NEW, the existing file is 542 lines and organized by scenario |
| C | `__tests__/serialization/codec/StylesheetCodec.test.ts` | EXTEND, 72 lines with the right lifecycle and helpers |
| encode | the same three files, one `describe('export')` each | reuse `exportObject` from codec/shared.ts |
| non-style booleans | the new serialization.xml.booleanProperties.test.ts, second describe | NEW |
| shared table | `__tests__/serialization/boolean-style-properties.ts` | NEW |

Boilerplate: Apache-2.0 header verbatim from serialization.xml.mxGraph.test.ts:1-15 with `Copyright 2026-present`
(absent in every file under __tests__/serialization/codec/, no CI check, but new files should carry it); explicit
named `@jest/globals` imports (prefer the explicit form of serialization.xml.mxGraph.test.ts:17, some codec tests use
bare globals); `.js` omitted in imports.
Two DIFFERENT codec lifecycles, pick per path:
- ModelXmlSerializer paths: `beforeAll(unregisterAllCodecs)` + `afterEach(unregisterAllCodecs)` only
  (serialization.xml.test.ts:102-108).
- raw Codec paths using importToObject/exportObject: add `beforeEach(registerCoreCodecs)`
  (StylesheetCodec.test.ts:5-13, GraphViewCodec.test.ts:15-23).
- Path A needs NO lifecycle, convertStyleFromString is pure.
`test.each` with 144 rows keeps the mandated tuple + '%s' form by composing the description:
`test.each(cases.map(c => [`${c.key}="${c.raw}"`, c] as const))('%s', ...)`.
Path B can bypass ModelXmlSerializer with `importToObject({}, '<Object rounded="1"/>')` since registerCoreCodecs
registers a codec named `Object` (register-shared.ts:37). Recommend BOTH: the isolated <Object> test and one realistic
ModelXmlSerializer test with the style on a real <Cell>.

## Enumeration with a compile-time exhaustiveness guarantee

Mirror `NumericCellStateStyleKeys` (types.ts:980-984) INSIDE the test fixture, so the characterization commit stays
test-only, with ONE CRITICAL CORRECTION:
  `type BooleanStyleKey = NonNullable<{ [K in keyof CellStyle]: NonNullable<CellStyle[K]> extends boolean ? K : never }[keyof CellStyle]>`
Use `NonNullable<CellStyle[K]> extends boolean`, NOT the `extends boolean | undefined` spelling copied from the
numeric twin: `orthogonal?: boolean | null` (types.ts:614) fails that test, so the naive version silently DROPS
orthogonal, reproducing the very class of omission we are trying to prevent. No any/unknown members exist in
CellStateStyle, so the conditional type is sound.
Derive from `CellStyle`, not CellStateStyle, to also pick up `ignoreDefaultStyle` (types.ts:76), which IS settable
from the mxGraph style string (a leading `;`, codec/mxGraph/utils.ts:25). REAL COUNT: 36, not 35.

Two guards, both in the test file, working NOW before any runtime list exists:
  `const _keysAreValid: readonly BooleanStyleKey[] = BOOLEAN_STYLE_KEYS;`            // no typo, no stale key
  `type _Missing = Exclude<BooleanStyleKey, (typeof BOOLEAN_STYLE_KEYS)[number]>;`
  `const _noneMissing: [_Missing] extends [never] ? true : 'BOOLEAN_STYLE_KEYS is missing entries' = true;`
Guard 2 fails tsc with a readable message the day a 37th boolean is added, and test-check runs on three OSes.
`no-unused-vars` is off and noUnusedLocals is not set, so the unused consts lint clean.
When the fix introduces the runtime list in src, swap the const for an import of it and KEEP both guards: they then
validate the production list.

## Interaction with ModelChecker

Signatures: `interface ExpectCellProperties { geometry?: Geometry; style?: CellStyle }` (:5-8);
`expectIsVertex(cell, value, properties?)` (:50-61) asserting `cell.edge === false`, `isEdge()` falsy,
`cell.vertex === 1` (:59, the FIX), `isVertex()` truthy; `expectIsEdge` the mirror (:63-74, `cell.edge === 1` at :70);
private `checkCellBaseProperties` (:76-90) with `expect(cell.geometry).toEqual(properties?.geometry ?? null)` (:88)
and `expect(cell.style).toEqual(properties?.style ?? {})` (:89).
EXTEND, do not bypass and do not add an option:
- Keep :89's whole-object toEqual, it is exactly the semantics the matrix wants (wrong values AND missing or extra
  keys, essential for path C where value="0" makes the property vanish).
- The ONLY blocker is the `CellStyle` type on `ExpectCellProperties.style`. Widen it to
  `CellStyle | Record<string, unknown>`. That one line removes the suppressions from the new tests AND lets the fix
  commit DELETE all 7 existing @ts-ignore in the two serialization.xml* files. Strictly additive, every current call
  site still type checks.
- Leave `toEqual(1)` at :59 and :70 for the characterization commit, flip to `true` in the fix commit. Do NOT add a
  `{ vertexIsNumeric }` option: it would let the fix pass while one branch still asserts the bug.
- CAVEAT on Geometry.relative: :88 compares against a real `Geometry` instance whose `relative` is the boolean false,
  while a decoded `<Geometry relative="1">` yields 1, so toEqual reports a mismatch. The relative characterization
  must build the expected value as a plain object or assert `geometry.relative` directly. This is the one place
  ModelChecker cannot express the wrong value.

## Regression list for the fix commit: 14, not 12

The 12 marked: utils.ts:59, utils.ts:70, codec/mxgraph/utils.test.ts:29, :53, :78 (with the @ts-ignore at :76 and the
<CellStyle> cast at :77), serialization.xml.test.ts:137, :140, :536, :538, serialization.xml.mxGraph.test.ts:105,
:111, :156.
PLUS TWO the markers miss, which is precisely why the exhaustive sweep pays:
13. `codec/mxgraph/utils.test.ts:57` `dashed: 1`, a declared boolean (types.ts:165), no FIX comment, no @ts-ignore.
14. `codec/StylesheetCodec.test.ts:48` `rounded: 'true'`, path C decoding value="true" to the STRING 'true'.

Verified NOT affected, so the fix must not chase them:
- serialization.xml.test.ts:286-292 `Import then export - expect the same xml content`: safe before and after,
  because `convertAttributeToXml` (:540-554) maps anything loosely equal to true/false onto '1'/'0' via
  `isBooleanAttribute` (:564-566), so both 1 and true encode to "1". WATCH IT as the canary if the fix touches encode.
- serialization.xml.test.ts:330-331 -> expected XML at :364, encode of real booleans, already correct.
- codec/all-graph-classes.test.ts:57 expects `<Object foldingEnabled="1" collapseToPreferredSize="1" as="options">`,
  encode side, unaffected. NOTE its companion Import test (:110-123) asserts only pageFormat and
  options.collapsedImage, so `options.foldingEnabled` currently decodes to 1 UNNOTICED: a coverage gap to fill in the
  characterization commit, not a regression.
- codec/GraphViewCodec.test.ts expected `rounded="true"`: style set as a real boolean in code, no decode involved.
- __tests__/util/styleUtils.test.ts:222,227,232: fontStyle is a numeric bitmask, out of scope.
- __tests__/editor/Editor.test.ts:76-82 goes through ModelChecker.expectIsVertex, so it inherits case 1 and fixes
  itself when utils.ts:59 flips.
- Nothing outside packages/core/__tests__ exercises these paths.

## Volume

3 aggregate + 3 x 144 = 435 new cases, plus about 25 non-style booleans. 14 existing assertions to flip in the fix
commit, plus the deletion of 7 now-unnecessary @ts-ignore.
