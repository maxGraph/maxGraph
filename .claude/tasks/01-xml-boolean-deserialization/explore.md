# Task: XML deserialization produces 0 and 1 instead of booleans

GitHub issue: not filed yet (draft ready). Branch: `fix/xml-boolean-deserialization`, off `origin/main` at `42b02cab2`.

Goal, as stated by the maintainer: exhaustive test coverage over ALL boolean style properties, proving that today the
decoded value is a number rather than a boolean, so that the later fix cannot silently miss a property. Then fix.

## The defect in one paragraph

Nothing in the deserialization pipeline ever produces a boolean. Three independent code paths apply the same rule,
"a numeric-looking string becomes a number", deciding on the SHAPE OF THE VALUE and never on the type of the target
property. `rounded="1"` therefore lands in `CellStateStyle.rounded` as the number `1`, while the interface declares
`boolean`. The encoder is the mirror image: a single site collapses real booleans and the numbers 0/1 into the same
`"1"` / `"0"` output using loose equality, which is why the XML round trip looks stable while the in-memory type is
wrong.

## Codebase context

### The three decode sites (zero of them produce a boolean)

| # | Site | Guard | Feeds |
|---|---|---|---|
| 1 | `packages/core/src/serialization/ObjectCodec.ts:580` `Number.parseFloat(value)` | `isNumericAttribute` (:597-605), which ends with `isNumeric(attr.value)` | every XML attribute of every object: `vertex`, `edge`, `relative`, `collapsed`, `visible`, `connectable`, and every style key of the native `<Object as="style">` form |
| 2 | `packages/core/src/serialization/codec/mxGraph/utils.ts:51`, in `convertToNumericIfNeeded`, called at `:38` | `isNumeric` (:47) | the mxGraph string form `style="rounded=1;shadow=0"` |
| 3 | `packages/core/src/serialization/codec/StylesheetCodec.ts:171-172` | `isNumeric(value)` | `<Stylesheet><add as="x"><add as="rounded" value="1"/>` |

`isNumeric` is `packages/core/src/util/mathUtils.ts:673-679`: anything `parseFloat`-able and finite, `0x` excluded.

A fourth site, `StylesheetCodec.ts:166` `doEval(text)` under `allowEval`, is the only path that can currently yield a
real boolean.

`ObjectCodec.decodeAttribute` (:753-781) carries a STALE COMMENT at :757-760 claiming it "converts the string true and
false to their boolean values". It does not. Line :778 is a bare `obj[name] = value`, with no check against the type
of the target field.

### The single encode site

`ObjectCodec.convertAttributeToXml` (:540-554), line **:551** `value = value == true ? '1' : '0'`, guarded by
`isBooleanAttribute` (:564-566). The loose `==` means real booleans and the numbers 1/0 take the same branch and
produce identical XML. `Cell.vertex = false` is omitted entirely rather than written `"0"`, because of the
template-default check at :456.

There is NO `CellStyle` to style-string encoder: `convertStyleFromString` has no counterpart, and `mxCellCodec` is
registered with `registerAlias = false` (`register-model-codecs.ts:36`), so encoding always resolves to `CellCodec`.
Export is never in the mxGraph string format.

### No boolean metadata exists anywhere

No allow-list, map or set of boolean keys exists in the codebase. The only key-based metadata on the decode path is
`geometryNumericAttributes` / `pointNumericAttributes` (`ObjectCodec.ts:28-34`) and the single rename
`autosize -> autoSize` (`codec/mxGraph/utils.ts:21`). The `?: boolean` declarations in `types.ts` are erased at
runtime. The codec `template` WOULD be a usable source of truth for classes (`new Cell().vertex === false`,
`new Geometry().relative === false`) but is only used for encode-side default suppression.

There is a type-level precedent for deriving a key list: `NumericCellStateStyleKeys` (`types.ts:980-985`), a mapped
type filtering `CellStateStyle` on `extends number | undefined`. A `BooleanCellStateStyleKeys` twin is the obvious
counterpart, and a `satisfies` plus an `Exclude<...> extends never` assertion can make the runtime array provably
exhaustive at compile time. That mechanism is what guarantees "we fix later all properties".

### The inventory to cover

- `CellStateStyle`, 35 boolean properties (`types.ts`): absoluteArcSize 85, anchorPointDirection 104, autoSize 136,
  backgroundOutline 141, bendable 148, cloneable 155, curved 160, dashed 165, deletable 182, editable 207, endFill 229,
  entryPerimeter 277, exitPerimeter 334, fixDash 379, flipH 384, flipV 389, foldable 395, glass 420, horizontal 444,
  imageAspect 472, movable 587, noEdgeStyle 593, noLabel 598, orthogonal 614, orthogonalLoop 621, pointerEvents 668,
  portConstraintRotation 683, resizable 690, resizeHeight 697, resizeWidth 704, rotatable 711, rounded 726, shadow 756,
  startFill 854, swimlaneLine 903.
  `orthogonal` is the only union, `boolean | null`. No property is declared `boolean | number`.
- `CellStyle`, 1 more: `ignoreDefaultStyle` (types.ts:76), set programmatically by the parser, not decoded.
- `Cell`, 6 fields (`Cell.ts`): invalidating 87, vertex 122, edge 128, connectable 134, visible 140, collapsed 146.
- Other codec-registered classes, 47 fields: Geometry 2, GraphDataModel 4, GraphView 4, AbstractGraph 18,
  CollapseChange 2, VisibleChange 2, TerminalChange 1, Editor 13, EditorToolbar 1.

Keys that MUST stay numeric and are the trap of this task: `fontStyle` (bitmask), `strokeWidth`, `arcSize`, `endSize`,
`opacity`, `entryX`, `entryY`, `imageWidth`, `perimeterSpacing`, and `html` (a draw.io extension not even declared in
`CellStateStyle`).

### Existing test coverage

Twelve `FIX should be` markers record the defect instead of fixing it:

- `__tests__/serialization/utils.ts:59` (`cell.vertex` is 1) and `:70` (`cell.edge` is 1). These sit in the shared
  `ModelChecker`, so they apply to every cell of every import test.
- `serialization.xml.test.ts:136` bendable 0, `:139` rounded 1, `:535` entryPerimeter 1, `:537` shadow 1, all behind
  `// @ts-ignore`.
- `serialization.xml.mxGraph.test.ts:105` dashed 1, `:111` and `:156` rounded 0.
- `codec/mxgraph/utils.test.ts:29` and `:53` rounded 0 (THE COMMENT IS WRONG there: the input is `rounded=0`, so the
  right expectation is `false`, not `true`), `:78` autoSize 1. Unmarked but identical in nature: `dashed: 1` at `:57`.

Encode-side counterparts, different wording: `serialization.xml.test.ts:347` and `:409`
`// FIX boolean values should be set to true/false instead of 1/0`.

Paths that ALREADY behave correctly, which localizes the defect:
- `codec/mxgraph/utils.test.ts:42` `ignoreDefaultStyle: true`, because the parser sets it programmatically and
  bypasses `convertToNumericIfNeeded`.
- `codec/GraphViewCodec.test.ts:86` sets `rounded: true` and expects `rounded="true"` at `:98`.
- `codec/StylesheetCodec.test.ts:58` exports `rounded: true` as `<add value="true" as="rounded" />` at `:84`, but the
  mirror import at `:48` asserts the STRING `'true'`. Unmarked defect of the same family.

The `ModelChecker` compares the whole style object at once (`utils.ts:89`
`expect(cell.style).toEqual(properties?.style ?? {})`), which is why every offending property needs its own
`@ts-ignore` in the expected literal.

### Blast radius of switching to real booleans: small, and mostly improvements

- Strict comparisons (`=== true`, `!== false`, ...): ZERO occurrences in `packages/core/src`, `packages/core/__tests__`,
  the stories and the examples. Verified directly. The dangerous class does not exist here.
- `||` defaults on a boolean style property: exactly one, `ConnectionsMixin.ts:175` (`|| false` on this branch, since
  PR #1160 is not merged). Today an XML-loaded `entryPerimeter: 1` and a code-built `true` differ, and that difference
  reaches `ConnectionHandler.ts:1513` `c1.perimeter !== c2.perimeter`, which then reports a spurious mismatch. This is
  the strongest functional argument for the fix.
- Everything else defaults with `??` (about 25 sites) or reads in truthiness position, all invariant under the change.
- `Cell.vertex` / `Cell.edge` are read nowhere outside `Cell.ts:278,288,295,305`; the ~60 call sites go through
  `isVertex()` / `isEdge()` in truthiness position.
- Sites that get BETTER: `XmlCanvas2D.ts:357` and `:601` dedup by `===` on `dashed` / `shadow`, defeated today by a
  graph mixing XML-loaded and code-built cells; `AbstractGraph.isOrthogonal()` (:973-977) stops returning 0/1 from a
  `: boolean` signature.
- Nothing relies on the value being a number: no arithmetic, no `Number(...)`, no `? 1 : 0` on a boolean style key.

### Bugs of the same family found along the way, to be decided in the plan

1. `GraphLayout.ts:244` `setCellStyles('noEdgeStyle', value ? '0' : '1', ...)` writes the truthy STRING `'0'`, so
   `setEdgeStyleEnabled(edge, true)` is a no-op (`GraphView.ts:1334`, `EdgeHandler.ts:419` both read it with `??` and
   truthiness). NOT ours to fix: the draft PR maxGraph#1028 already does, and goes further by making `setCellStyles`
   generic (`value: CellStateStyle[K] | undefined | null`), which turns writing a string into a boolean key into a
   compile error. That PR is the WRITE side of the same defect; this task is the DECODE side. Keep out of scope and
   avoid touching `GraphLayout.ts`, `styleUtils.ts` or `CellsMixin.type.ts` to keep the two diffs disjoint.
2. `StylesheetCodec.ts:176` `if (value) { style[key] = value; }` silently drops `<add as="rounded" value="0"/>`.
   Emitting `false` does not fix it, `false` is falsy too. Needs `if (value != null)`.
3. `CellsMixin.ts:1175-1185` `if (style.resizeWidth) ... else if (!style.resizeWidth) ...`: the branches are
   exhaustive, so an unset property behaves like `false`.
4. `HoverStyle.stories.js:46` `state.style.rounded = hover ? '1' : '0'`: `'0'` is truthy, so the un-hover branch has
   never worked.
5. `OrgChart.stories.js:118-120,133,136` writes `'1'` strings and `0` numbers into boolean-typed keys.

Items 4 and 5 need no action here: both files are `.js`, hence untyped and unlinted, and the TypeScript compiler will
reject those assignments as soon as the stories are migrated, which issue maxGraph#1035 tracks.

## mxGraph reference, the compatibility constraint

- mxGraph style objects NEVER contain booleans: `mxStylesheet.getCellStyle`
  (`javascript/src/js/view/mxStylesheet.js:225-247`) parses numeric-looking values with `parseFloat` and keeps
  everything else as a string. maxGraph inherited this rule verbatim.
- mxGraph reads a style flag by LOOSE EQUALITY against 1 or '1', never by truthiness and never against `"true"`:
  `mxShape.js:1372-1375` (shadow, dashed, rounded, glass), `mxShape.js:1124`, `mxRectangleShape.js:50,68,83`,
  `mxSwimlane.js:151,238,338`, `mxGraph.js:6372-6373,9318-9319` (flipH). So `"true"` is not a recognized token there.
- mxGraph attribute decoding is the same rule (`io/mxObjectCodec.js:630-669`), and `mxCell.isVertex()` is
  `return this.vertex != 0` (`mxCell.js:293-295`).
- mxGraph ENCODES booleans as `'1'` / `'0'` (`io/mxObjectCodec.js:588-616`), with an explicit comment that the raw
  value must not be used because 0 would otherwise be truthy.
- Zero `*.xml` file in either checkout uses `=true` / `=false` for a boolean style key, or `vertex="true"`.

Conclusion: the DECODER must keep accepting `1` / `0`. Accepting `true` / `false` as well is optional and defensive
(nothing mxGraph or draw.io emits needs it, but maxGraph's own `GraphViewCodec` and `StylesheetCodec` already write
`"true"` on export, so the reader should handle it). The ENCODER must keep emitting `1` / `0`, otherwise mxGraph and
draw.io readers, which compare with `== 1`, would silently treat the value as unset.

A trap of the current state: `rounded=false` in a style string decodes to the truthy STRING `'false'`, so writing the
word in a style silently enables the flag.

## Key files

- `packages/core/src/serialization/ObjectCodec.ts:540-605, 753-781` - the shared decode and encode conversions.
- `packages/core/src/serialization/codec/mxGraph/utils.ts:23-57` - `convertStyleFromString`, `convertToNumericIfNeeded`.
- `packages/core/src/serialization/codec/StylesheetCodec.ts:160-180` - the third copy of the rule, plus the falsy drop.
- `packages/core/src/serialization/codec/CellCodec.ts:75-77` - `isNumericAttribute`, only `value` is special-cased.
- `packages/core/src/util/mathUtils.ts:673-679` - `isNumeric`, the shared predicate.
- `packages/core/src/types.ts:76-977` - the 36 boolean style properties; `:980-985` `NumericCellStateStyleKeys`.
- `packages/core/src/view/cell/Cell.ts:87-146, 278, 295` - the 6 boolean fields and their accessors.
- `packages/core/__tests__/serialization/utils.ts:50-91` - `ModelChecker`, whole-style `toEqual` at `:89`.
- `packages/core/__tests__/serialization/codec/mxgraph/utils.test.ts` - the pure parser unit tests, cheapest layer.
- `packages/ts-support/src/module-augmentation.ts` - proof that `CellStateStyle` is user-augmentable.

## Patterns to follow

- Test conventions (`.claude/rules/testing/conventions.md`): jest + jsdom, `@swc/jest`, tests mirror `src/`, imports
  WITHOUT the `.js` extension, and `test.each` / `it.each` is MANDATED when cases differ only by data. The
  serialization tree currently has a single `describe.each` (`all-graph-classes.test.ts:98-104`) and no `test.each`,
  so the boolean matrix would be the first, consistent with the rule rather than with the local status quo.
- Explicit `import { ... } from '@jest/globals'`, Apache-2.0 header with the creation year.
- Codec isolation boilerplate: `beforeAll(unregisterAllCodecs)` + `afterEach(unregisterAllCodecs)`, plus
  `beforeEach(registerCoreCodecs)` in the `codec/*.test.ts` files.
- No `.xml` fixture files anywhere: XML is an inline template literal, hoisted to a module-level const when reused.
- Known deviations are recorded inline with `// @ts-ignore` plus a comment, `FIX should be ...` for bugs and
  `mxGraph compatibility, ...` for intentional ones.
- Core coding rules (`.claude/rules/architecture/coding-practices.md`) and the object form of `insertVertex` /
  `insertEdge` (`graph-api-usage.md`) apply to any test code that builds a graph.

## Dependencies and open questions for the plan step

1. **The allow-list is unavoidable.** Both decoders convert on the value shape, so emitting booleans for every "1"/"0"
   would also corrupt `strokeWidth=1`, `opacity=0`, `entryX=0`, `fontStyle=1`. `entryX=0` becoming `false` would be a
   real regression (`ConnectionsMixin.ts:160-166`). The fix needs a boolean key list applied in the three decode sites,
   plus `CellCodec.isNumericAttribute` for `vertex` / `edge`.
2. **Module augmentation.** `CellStateStyle` is user-extensible (shipped in `67bdd9c9e`, see
   `packages/ts-support/src/module-augmentation.ts`), so a user-declared boolean property cannot appear in a
   hardcoded runtime list. Decide whether to expose a registration API or to document the limitation.
3. **Test direction.** Characterization first (assert the current numbers over all 36 properties, then flip them in the
   fix commit) versus strict TDD (assert booleans, watch 36 tests fail, then fix). The maintainer asked to "show that
   currently values are set to number", which points at the first; the repo TDD habit points at the second.
4. **Scope.** Style properties only, or also `Cell.vertex` / `Cell.edge` and the 47 fields of the other codec-registered
   classes? The two `ModelChecker` markers mean `vertex` / `edge` are nearly free to include.
5. **Encoding.** Must keep emitting 1/0. Decide whether the two `FIX boolean values should be set to true/false`
   comments at `serialization.xml.test.ts:347,409` are still wanted, since acting on them would break draw.io
   compatibility. They look like a misunderstanding worth removing rather than implementing.
6. **Overlapping PRs on the same family.** #1160 (open, ready) changes `ConnectionsMixin.ts:175` from `|| false` to
   `?? true`. #1028 (draft) owns the write side: type-safe `setCellStyles` plus the `GraphLayout` call sites. This
   branch is off `origin/main` and contains neither. Keep this diff to the serialization layer so it conflicts with
   neither, and rebase once they land.

## Decisions taken by the maintainer on the open questions

1. **Allow-list, agreed.** Derive `BooleanCellStateStyleKeys` from `CellStateStyle` the way `NumericCellStateStyleKeys`
   (types.ts:980-985) is derived, back it with a runtime array declared `satisfies`, and add a compile-time
   exhaustiveness assertion (`Exclude<BooleanCellStateStyleKeys, (typeof list)[number]> extends never`) so a boolean
   property added to the interface later cannot be forgotten.
2. **Registration API: evaluate feasibility and cost** during the plan step, do not assume it. The need comes from
   module augmentation (`packages/ts-support/src/module-augmentation.ts`): a user-declared boolean style property
   cannot appear in the library's runtime list. Look at how the existing registries and config objects expose
   extension points before designing anything.
3. **Characterization tests first.** Assert the current numeric behavior over every boolean property, commit that as
   the record of the defect, then flip the expectations in the fix commit so the diff shows exactly what changed.
4. **Scope: all classes**, not only the style properties. `Cell` (6 fields), `Geometry` (2), `GraphDataModel` (4),
   `AbstractGraph` (18), `GraphView` (4), the change classes (5) and the editor classes (14), plus the two
   `ModelChecker` markers on `vertex` / `edge`.
5. **Encoding: pending.** See the analysis below; the earlier claim in this document that the encoder must keep
   emitting 1/0 for draw.io compatibility was WRONG. maxGraph exports only its own `<GraphDataModel>` /
   `<Object as="style">` format, which mxGraph and draw.io cannot read anyway (they read `<mxGraphModel>` with a
   semicolon style string), and `ModelXmlSerializer.export()` offers only a `pretty` option. The constraint is
   decode-only. Two maxGraph codecs already emit the words: `GraphViewCodec` writes `rounded="true"`
   (GraphViewCodec.test.ts:98) and `StylesheetCodec` writes `<add value="true" as="rounded" />`
   (StylesheetCodec.test.ts:84) while importing it back as the STRING 'true' (StylesheetCodec.test.ts:48), which is a
   live bug and means the DECODER must accept `true` / `false` whatever we decide about the encoder.
   DECIDED, and the opposite of what I first proposed: the XML keeps 1/0 everywhere, only the decoded JS value has to
   be a real boolean. `ObjectCodec.ts:551` therefore stays as it is, no observable output change, the byte-identical
   round trip at serialization.xml.test.ts:286 keeps passing, no CHANGELOG breaking entry for it, and the two
   `FIX boolean values should be set to true/false` comments at :347 and :409 are WRONG and get deleted.
   Instead, align the two codecs that currently emit the words onto 1/0, which is far cheaper:
   - `StylesheetCodec.getStringValue` (:83-94) returns a boolean untouched, so setAttribute writes "true". Add a
     `type === 'boolean'` branch returning '1' / '0'. One line, plus the expectation at StylesheetCodec.test.ts:84.
   - `GraphViewCodec` (:113-127) writes `${value}` through setNodeAttribute, same effect. One line, plus the
     expectation at GraphViewCodec.test.ts:98. Cosmetic only: that codec is export-only and its output is never read
     back by maxGraph.
   CONSEQUENCE that promotes an optional fix to a mandatory one: once StylesheetCodec exports `false` as `value="0"`,
   the import path hits `StylesheetCodec.ts:176` `if (value) { style[key] = value; }`, which DROPS falsy values, so a
   stylesheet carrying `rounded: false` would come back with the property missing. `if (value != null)` is part of
   this work, not a follow-up.
   The DECODER must still accept `true` / `false` in addition to 1/0, for a concrete reason rather than defensiveness:
   released maxGraph versions have been exporting `value="true"` from StylesheetCodec, so such files exist in the wild
   and today decode to the truthy STRING 'true' (StylesheetCodec.test.ts:48). One extra comparison in the shared
   helper covers it.
   Whether the StylesheetCodec output change (`value="true"` becomes `value="1"`) deserves a CHANGELOG line is left
   to the maintainer: it is observable to anyone parsing exported stylesheet XML, but it is a consistency fix within
   a format only maxGraph reads.
6. **Rebase once #1160 and #1028 land.** Keep this diff inside the serialization layer so it conflicts with neither.
