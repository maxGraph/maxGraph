# Raw exploration 3: existing test coverage

## The 12 `FIX should be` markers (two spellings: `FIX should be`, `FIX should be set to`)

serialization/utils.ts (2), the shared ModelChecker, so they apply to EVERY cell of EVERY import test:
- utils.ts:59 `expect(cell.vertex).toEqual(1)` should be `true`, no @ts-ignore.
- utils.ts:70 `expect(cell.edge).toEqual(1)` should be `true`, no @ts-ignore.

serialization/serialization.xml.test.ts (4), all behind `// @ts-ignore`:
- :136 `bendable: 0` should be false, :139 `rounded: 1` should be true (from `xmlWithVerticesAndEdges` at :86,
  `<Object bendable="0" rounded="1" fontColor="yellow" as="style" />`, maxGraph-native GraphDataModel format).
- :535 `entryPerimeter: 1`, :537 `shadow: 1`, both should be true (inline XML of the `import after export` describe).

serialization/serialization.xml.mxGraph.test.ts (3), all behind `// @ts-ignore`:
- :105 `dashed: 1` should be true, :111 `rounded: 0` should be false, :156 `rounded: 0` should be false.
- NOT marked and must stay numeric: `html: 1` (:107, :154, draw.io extension, not in CellStateStyle) and
  `fontStyle: 1` (:153, genuine numeric bitmask).

serialization/codec/mxgraph/utils.test.ts (3), unit tests of `convertStyleFromString`:
- :29 and :53 `rounded: 0` with a comment saying "should be true"; THE COMMENT IS WRONG, the input is `rounded=0`,
  so the correct expectation is `false`.
- :78 `autoSize: 1` should be true; the bare `// @ts-ignore` on :76 is for the `autosize` -> `autoSize` rename.
- Unmarked but same defect class: `dashed: 1` at :57. Correctly numeric: `html: 1` at :55.

Encode-side counterparts (different wording, not part of the 12):
- serialization.xml.test.ts:347 `// FIX boolean values should be set to true/false instead of 1/0`, guarding the
  expected XML `<Object bendable="0" rounded="1" ... />` at :364 produced from a source style
  `{ bendable: false, rounded: true }` at :329-334.
- serialization.xml.test.ts:409, same comment, currently vestigial (no boolean attribute in that expected XML).

## Map of packages/core/__tests__/serialization/

| file | lines | tests | scope |
|---|---|---|---|
| serialization.xml.test.ts | 542 | 14 | maxGraph-native `<GraphDataModel>` format: import, export, round trip (`Import then export` at :286) |
| serialization.xml.mxGraph.test.ts | 162 | 3 | mxGraph/draw.io compat: `<mxGraphModel>` import, string `style="a=1;b=2"`, real draw.io export (issue 221) |
| codec/mxgraph/utils.test.ts | 81 | 5 | pure unit tests of `convertStyleFromString`, no XML, no model |
| codec/StylesheetCodec.test.ts | 89 | 2 | named styles import + export |
| codec/all-graph-classes.test.ts | 143 | 2x2 | whole Graph/BaseGraph export + import, the only describe.each in the tree |
| codec/GraphViewCodec.test.ts | 103 | 1 | export only of a rendered GraphView |
| codec/shared.ts | 28 | - | `importToObject(obj, xml)`, `exportObject(obj)` helpers |
| utils.ts | 91 | - | the `ModelChecker` class |

### ModelChecker (serialization/utils.ts)
`checkRootCells()` (:33), `checkCellsCount(count)` (:45), `expectIsVertex(cell, value, properties?)` (:50),
`expectIsEdge(cell, value = null, properties?)` (:63), private `checkCellBaseProperties` (:76).
Load-bearing line: :89 `expect(cell.style).toEqual(properties?.style ?? {})`, the WHOLE style object compared with
toEqual, which is why each offending property needs its own `@ts-ignore` in the expected literal.

## Conventions in use

- Explicit `import { afterEach, beforeAll, describe, expect, test } from '@jest/globals'`.
- Imports from '../../src' barrel WITHOUT `.js`; deep imports when not exported.
- Apache-2.0 header on every file, year = creation year.
- Codec isolation boilerplate: `beforeAll(unregisterAllCodecs)` + `afterEach(unregisterAllCodecs)` in the
  serialization.xml* files; the codec/*.test.ts add `beforeEach(registerCoreCodecs)`.
- Sentence-style test names, often citing the upstream issue.
- No `.xml` fixture files anywhere under `packages/core/__tests__`: XML is always an inline template literal, hoisted
  to a module-level const when reused (`xmlWithSingleVertex` :54, `xmlWithVerticesAndEdges` :70) or built by a helper
  (`buildXml(name)` with an `@NAME@` placeholder, all-graph-classes.test.ts:42-96).
- Expected export XML compared with toEqual, indentation sensitive (2 spaces, space before `/>`).
- `test.each` is MANDATED by .claude/rules/testing/conventions.md (tuple form, '%s' title) but only one
  `describe.each` exists in this tree today (all-graph-classes.test.ts:98-104). The boolean matrix would be the first
  real `test.each` here, consistent with the rule rather than with the local status quo.
- Test imports omit `.js`; tests mirror src, note `__tests__/serialization/codec/mxgraph/` (lowercase) mirrors
  `src/serialization/codec/mxGraph/` (camelCase).

## Where the new exhaustive tests belong: THREE layers, three code paths

a) Parser unit level: extend `codec/mxgraph/utils.test.ts` with a `describe('boolean properties')` inside the existing
   `describe('convertStyleFromString')` (:21-81), `test.each` over all boolean keys. Culprit is
   `convertToNumericIfNeeded` in `src/serialization/codec/mxGraph/utils.ts`. Cheapest layer, no XML.
b) XML attribute decode level: `<Object rounded="1" as="style"/>` goes through `ObjectCodec.convertAttributeFromXml`
   (`src/serialization/ObjectCodec.ts:576`) -> `isNumericAttribute` (:597), a DIFFERENT path from (a).
   Suggested: a new sibling file `serialization.xml.booleanStyles.test.ts` rather than growing the 542-line file.
c) Encode level: round trip next to `Import then export` (serialization.xml.test.ts:286); governed by
   `ObjectCodec.convertAttributeToXml` / `isBooleanAttribute` (ObjectCodec.ts:540-565), which deliberately emits '1'/'0'.

## Tests that ALREADY assert a correct boolean (localises the defect)

- utils.ts:57 `cell.edge === false`, :72 `cell.vertex === false`: pass because they are the default field values,
  never touched by decoding. Only the attribute-set path yields 1.
- codec/mxgraph/utils.test.ts:42 `ignoreDefaultStyle: true`: correct because `convertStyleFromString` sets it
  programmatically, bypassing `convertToNumericIfNeeded`. Direct evidence the bug is in value parsing.
- codec/GraphViewCodec.test.ts:86 sets `rounded: true` and the expected export at :98 has `rounded="true"`, so that
  export path already round-trips a real boolean, unlike ObjectCodec.convertAttributeToXml which emits "1".
- codec/StylesheetCodec.test.ts:58 `rounded: true` exports as `<add value="true" as="rounded" />` (:84), correct, BUT
  the mirror import test at :48 asserts `rounded: 'true'`, a STRING. Unmarked defect of the same family.
- serialization.xml.test.ts:329-334 builds a style with real booleans; all-graph-classes.test.ts:57 shows
  `foldingEnabled="1" collapseToPreferredSize="1"` for non-style booleans, so the 1/0 encoding is systemic.

## Near-miss keys that MUST stay numeric

`fontStyle` (bitmask), `html` (draw.io extension, not in CellStateStyle), `strokeWidth`, `arcSize`, `endSize`.
There is a `NumericCellStateStyleKeys` type at types.ts:980, a useful counterpart if a `BooleanCellStateStyleKeys`
is introduced.
