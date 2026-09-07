# Raw exploration 9 (plan step): helper placement, hooks, public API, encoder alignment

## Where the helper goes

`internal/` is CONFIRMED not public API: zero hits for `internal` in `packages/core/src/index.ts`, no `internal`
subpath in package.json exports, and every symbol is tagged `@private not part of the public API`. Import direction is
`util/ -> internal/` (mathUtils.ts:24 imports isNullish) and `internal/*.ts` never references `serialization`, so
`internal/` is the lowest layer and both may depend on it without a cycle.
`util/mathUtils.ts` IS public (`export * as mathUtils` at index.ts:166), so putting the parser there would freeze it
as public API for free, and it is not math.

RECOMMENDATION, split in two because the pieces have different natures:
(a) the pure parser in `internal/utils.ts` next to isNullish (or a new `internal/boolean-utils.ts`, since the folder
    already uses per-topic kebab-case files: clone-utils.ts, i18n-utils.ts, time-utils.ts):
      `parseBoolean(value: unknown): boolean | undefined`, '1'/'true' -> true, '0'/'false' -> false, else undefined.
    The `undefined` return is LOAD-BEARING: an unrecognized token such as `rounded="yes"` must fall through to the
    existing numeric/string behavior instead of silently becoming false. That is exactly the trap StencilShape's
    toBoolean falls into.
(b) the boolean key list in a NEW `packages/core/src/serialization/boolean-attributes.ts`, importing
    `BooleanCellStateStyleKeys` from ../types.js and imported by all three sites. Not in internal/utils.ts (would
    inject CellStateStyle knowledge into a file that has none) and not in codec/mxGraph/utils.ts (would invert
    layering, making the generic ObjectCodec depend on the legacy mxGraph folder).
The TYPE `BooleanCellStateStyleKeys` goes in types.ts right after `NumericCellStateStyleKeys` (:979-984), its exact
twin, since types.ts is re-exported wholesale at index.ts:262 and the numeric twin is already consumed publicly
(util/styleUtils.ts:389,419, view/mixin/CellsMixin.type.ts:228,242).

## Existing boolean parsers: do not reuse

`StencilShape.ts:73` `const toBoolean = (value: string | null) => value !== '0'`, NOT exported, used only at :505-506.
Semantics are "default true, only '0' is false", correct for its XSD contract (comment :70-72) but WRONG for a codec:
it maps null, '', 'false' and any garbage to true. Reusing it would make `rounded="false"` decode to true.
Other ad hoc conversions, all out of scope, listed so the plan does not claim to unify them: StencilShape.ts:180,195,
388,567,568,577,646,652 (inline `=== '1'`), and a FOURTH ad hoc parse inside serialization/ at
`codec/editor/EditorToolbarCodec.ts:161` `node.getAttribute('toggle') != '0'` (default-true, same flaw).
No shared string-to-boolean utility exists.

## The three hooks

SITE 1, `ObjectCodec.convertAttributeFromXml` (:576-587). `isNumericAttribute` (:597-605) ends with
`isNumeric(attr.value)`, so "1" and "0" return TRUE today. The boolean branch therefore goes BEFORE it, and
`isNumericAttribute` must NOT learn about boolean keys: its documented contract (:589-596) is a value-shape question,
and `CellCodec.isNumericAttribute` (CellCodec.ts:75-77) delegates to super, so the meaning of that override would
drift. Target shape: `if (this.isBooleanValueAttribute(...)) { const parsed = parseBoolean(attr.value); if
(!isNullish(parsed)) return parsed; }` then the existing block untouched.
Ordering guarantees: a boolean key returns before parseFloat; a numeric key (strokeWidth, opacity, arcSize, entryX,
fontStyle, html) is never in the boolean set so it never reaches parseBoolean; the `!isNullish` fall-through keeps
`rounded="yes"` behaving as today.
SUBTLETY: `<Object as="style" rounded="1"/>` is decoded by the GENERIC ObjectCodec into a plain object, so `obj` is
not a class instance. The predicate must discriminate the way isNumericAttribute already does at :600-601
(`obj instanceof Geometry` / `obj instanceof Point`) for class fields (Cell.vertex/edge/connectable/visible/collapsed/
invalidating, Geometry.relative, and Multiplicity.source at view/other/Multiplicity.ts:91, encoded as source="1" in
all-graph-classes.test.ts:51) and fall back to the style key list for plain objects. Accepted risk to state
explicitly: a plain `<Object>` that is NOT a style then gets style-key semantics; the same looseness already exists
for isNumeric.
Also: the stale comment at ObjectCodec.ts:757-760 already claims the decoder "converts the string true and false to
their boolean values". It is false today, and this fix is what makes it true. Update or delete it.

SITE 2, `codec/mxGraph/utils.ts`. The hook must sit AT THE CALL SITE :38, not inside `convertToNumericIfNeeded`
(:46-57), which receives no key. Introduce `convertValueFromString(key, value)` and leave the numeric helper
key-blind. CRITICAL: the lookup must use the MAPPED key `fieldMapping.get(key) ?? key`, because the list is derived
from CellStateStyle where the property is `autoSize` while the mxGraph string says `autosize` (fieldMapping at :19).
That is precisely the `autoSize: 1` expectation at codec/mxgraph/utils.test.ts:78.
`ignoreDefaultStyle` is set programmatically at :10 and never passes the converter, which is why utils.test.ts:42
already asserts true: keep it that way.
DECISION NEEDED: `html` is a draw.io extension not declared in CellStateStyle, so it cannot come from the derived
list. Three expectations depend on it staying numeric (utils.test.ts:55, serialization.xml.mxGraph.test.ts:107,154).
Leaving it numeric is the zero-churn choice.

SITE 3, `codec/StylesheetCodec.ts:157-181`. The key is in scope at :160. The boolean step goes inside the `else`
branch BETWEEN :169 and :171, before the isNumeric check, and must stay OUT of the doEval branch (:166-168) which
already yields real JS types. This site does NOT route through convertAttributeFromXml (`decode` is a full override at
:129), which is the decisive argument for making the conversion a SHARED FREE FUNCTION that both ObjectCodec and
StylesheetCodec import, with the ObjectCodec method as a thin overridable wrapper.

## Public API compatibility

All five methods are PUBLIC: ObjectCodec.ts has no visibility modifier on any member (the single grep hit at :209 is
a property type). Confirmed in the built declarations `lib/esm/serialization/ObjectCodec.d.ts:347,356,365,373,463,480`.
ObjectCodec is exported at index.ts:92.
The JSDoc presents them as extension points: beforeEncode (:606-616) and afterEncode (:620-632) say "Hook for
subclassers"; getFieldTemplate (:836-843) and addObjectValue (:855-862) say "For strongly typed languages it may be
required to override this"; convertAttributeFromXml (:568-575) documents isNumericAttribute as its guard and
convertAttributeToXml (:531-539) documents isBooleanAttribute as its guard.
Overrides in the tree: CellCodec.ts:75-77 (isNumericAttribute, calls super), mxCellCodec.ts:31-38 (decodeAttribute),
StylesheetCodec.ts:129 (decode), :51 (encode), :84 getStringValue (a NEW public method, also an extension point),
GraphViewCodec.ts:47 (encode), mxGeometryCodec.ts:36 (afterDecode), CellCodec.ts:82 (isExcluded), :92 (afterEncode).
NO override anywhere of convertAttributeFromXml, convertAttributeToXml or isBooleanAttribute.
Effect on user subclasses: an override of convertAttributeFromXml that does not call super is unaffected and keeps
working; one that calls super inherits the boolean step. An override of isNumericAttribute is SILENTLY BYPASSED for a
boolean key, which is the intended semantics but a real behavior change deserving a CHANGELOG line: a user who
broadened isNumericAttribute to return false for `rounded` used to receive the string '1' and will now receive true.
RECOMMENDED SHAPE: a new public overridable predicate `isBooleanValueAttribute(dec, attr, obj): boolean`, signature
matching isNumericAttribute exactly so the two read as a pair. The name CANNOT be isBooleanAttribute: that is taken by
the encode side (:564) with the incompatible signature (enc, obj, name, value), and overloading it would be
source-breaking for anyone overriding the encoder hook. It is also the natural place for the module-augmentation
escape hatch.

## The Stylesheet falsy drop, confirmed

`if (value)` at :176 drops `value="0"` twice over: isNumeric('0') is true (mathUtils.ts:673-679), so :172 makes it the
number 0, falsy, so :177 never runs and the key is ABSENT. Same for `value=""` and, after the fix, for false.
Correct guard per coding-practices.md (which names `if (!variable)` bad and rejects `!= null` too):
`if (!isNullish(value))`. StylesheetCodec.ts:24 already imports from ../../internal/utils.js, so it is one identifier.
Other hazards in the same 20 lines:
1. A doEval returning 0, false or '' is dropped by :176 too; the same fix covers it and still rejects undefined.
2. `entry.getAttribute('as')!` at :160 is non-null asserted but can be null; `<add value="x"/>` without `as` writes
   `style['null']`.
3. `if (as)` at :141-143 silently skips `as=""`, mirroring the encode guard at :58.
4. The `extend` path is BROKEN: :145 `clone(obj.styles[extend])` object-indexes `Stylesheet.styles`, which is a
   `Map<string, CellStateStyle>` (view/style/Stylesheet.ts:61, and the encode path at :54-55 correctly uses
   .keys()/.get()). Indexing a Map always yields undefined, so `extend` never resolves and the warning at :149-151
   always fires. No test uses `extend=`. One-liner (`obj.styles.get(extend)`) but a SEPARATE defect. Also `:147
   if (!style)` should be isNullish.

## Encoder alignment

`StylesheetCodec.getStringValue` (:84-95) tests typeof for 'function' (:88) and 'object' (:90) only, so a boolean
falls through and is RETURNED AS A BOOLEAN from a method declared `string | null` (:84), a latent type lie; it then
passes `value != null` (:65) and `setAttribute` stringifies it to "true". Minimal change: one
`else if (type === 'boolean') { value = value ? '1' : '0'; }` branch (plain ternary, the typeof has already narrowed,
no need for the loose `== true` of ObjectCodec.ts:551).
`GraphViewCodec.setNodeAttribute` (:24-26) does `node.setAttribute(name, `${value}`)` and is declared `value: number`;
a boolean only reaches it because the @ts-ignore at :112 makes value `any`. Preferred minimal change: widen to
`number | boolean` and map in that one place.
Same file, :95 `node.setAttribute('html', 'true')` is hardcoded, the same inconsistency. No test asserts html="true",
so aligning it is free. Optional, it is a serialization marker, not a style property.

Encode test expectations to update, the ONLY three `="true"` in packages/core/__tests__:
- codec/StylesheetCodec.test.ts:83 `<add value="true" as="rounded" />` -> `value="1"`.
- codec/GraphViewCodec.test.ts:98 `rounded="true"` -> `rounded="1"`.
- codec/StylesheetCodec.test.ts:39 is INPUT XML: KEEP it as a regression case for files exported by released
  versions, and add `value="1"` and `value="0"` cases (the latter covers the :176 falsy drop).
Encode expectations that must STAY 1/0, the proof the encoder is only aligned: serialization.xml.test.ts:286-291
(byte-identical round trip), all-graph-classes.test.ts:51 `source="1"` and :57
`foldingEnabled="1" collapseToPreferredSize="1"`, serialization.xml.test.ts:419.
Comments to DELETE rather than implement: serialization.xml.test.ts:347 and :409.

## A genuine FOURTH decode site, currently doing NO conversion at all

`ObjectCodec.decodeChild` (:811-834) -> :819 `value = child.getAttribute('value')`. The `<add as="key" value="v"/>`
CHILD form gets neither numeric nor boolean conversion, so `<add as="rounded" value="1"/>` under a generic `<Object>`
yields the STRING '1'. In practice only the array-element shape is exercised (serialization.xml.test.ts:366-367,520,
all-graph-classes.test.ts:53) because StylesheetCodec fully overrides decode. DECIDE EXPLICITLY: leave it as is
(documented, matches today) or route it through the same conversion. Either way, name it in the plan.
`addObjectValue` (:863-871) `if (value != null && value !== template)` is safe for false: not nullish, and when the
template default is already false the assignment is skipped and the object keeps false.
Single generic encode site confirmed: ObjectCodec.encode writes only through `enc.setAttribute` (:499,:504) ->
Codec.ts:503-506, so the boolean-to-1/0 mapping lives entirely in convertAttributeToXml (:540-554), with the
template-default suppression at :456 explaining why `vertex = false` is omitted rather than written "0".
No fifth site: there is no CellStyle to style-string encoder.
