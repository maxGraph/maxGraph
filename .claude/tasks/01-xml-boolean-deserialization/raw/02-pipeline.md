# Raw exploration 2: decode and encode pipeline

## DECODE, mxGraph style string `style="rounded=1;shadow=0;html=1"`

Chain: `ModelXmlSerializer.import()` (ModelXmlSerializer.ts:55-58) -> `Codec.decode()` (Codec.ts:355-373, looks up by
node name, alias `mxGraphModel -> GraphDataModel` at register-model-codecs.ts:33) -> `ObjectCodec.decode` ->
`ModelCodec.decodeChild` (ModelCodec.ts:47-53) -> `decodeRoot` (:57-75) -> `Codec.decodeCell` (Codec.ts:431-462,
`getCodec('mxCell')` at :439, registered decode-only at register-model-codecs.ts:36 with registerAlias=false) ->
`ObjectCodec.decode` (:686-701) -> `CellCodec.beforeDecode` (CellCodec.ts:114) -> `decodeNode` (:710) ->
`decodeAttributes` (:724-732) -> `mxCellCodec.decodeAttribute` (mxCellCodec.ts:31-38, intercepts ONLY `style`) ->
`convertStyleFromString` (codec/mxGraph/utils.ts:23-43) -> `convertToNumericIfNeeded` (:45-57).

THE conversion site: `codec/mxGraph/utils.ts:38` calls it, `:51` does `Number.parseFloat(value)`.
Guard `isNumeric` (util/mathUtils.ts:673-679): any numeric-looking string becomes a number, `0x...` excluded.
No boolean branch anywhere. `rounded=1` -> number 1, `shadow=0` -> number 0.
`"true"` / `"false"` are NOT numeric, so they stay STRINGS. Trap: `rounded=false` gives the truthy string 'false',
so the style behaves as enabled.

## DECODE, attributes `vertex="1"` / `edge="1"`

Not intercepted by mxCellCodec (only `style` is), so they fall through to ObjectCodec.
`ObjectCodec.decodeAttribute` (ObjectCodec.ts:753-781). NOTE the stale comment at :757-760 claiming it "converts the
string true and false to their boolean values": the implementation does NOT. :761 calls convertAttributeFromXml,
:778 does a bare `obj[name] = value` with no check against the target field type.
`ObjectCodec.convertAttributeFromXml` (:576-588), conversion at **:580** `Number.parseFloat(value)`.
`isNumericAttribute` (:597-605) decides on the VALUE SHAPE (`isNumeric(attr.value)`), not on the key, plus two
key-based exceptions for Geometry and Point.
`CellCodec.isNumericAttribute` (CellCodec.ts:75-77) only special-cases `value`; vertex/edge are untouched.
Result: `cell.vertex === 1`, `cell.edge === 1`, while Cell.ts:122,128 declare them `= false`.
The unset one stays `false` because the attribute is absent and the class default applies.

## ENCODE

There is NO CellStyle -> style-string encoder. `convertStyleFromString` has no counterpart; mxCellCodec is registered
with registerAlias=false, so encoding always resolves to `CellCodec` (name `Cell`). Export is never in the mxGraph
format.
A CellStyle object goes `ObjectCodec.encodeObject` (:408-423) -> `encodeValue` (:436-461) -> `writeAttribute`
(:467-479) -> `writeComplexAttribute` (:511-529) -> the generic `Object` codec (register-shared.ts:19), emitting
`<Object ... as="style"/>` with one XML attribute per style key.
Boolean conversion: `ObjectCodec.convertAttributeToXml` (:540-554), line **:551** `value = value == true ? '1' : '0'`,
guarded by `isBooleanAttribute` (:564-566) `typeof value.length === 'undefined' && (value == true || value == false)`.
So a real `true` produces "1" and `false` produces "0", never "true"/"false". Because the check is a LOOSE `==`, the
numbers 1 and 0 take the same branch and produce identical XML, which is exactly why the number/boolean confusion is
invisible in the output.
`Cell.vertex = false` is OMITTED rather than written as "0", due to the template-default check at :456.

### Round trip tests
- serialization.xml.test.ts:286-292 `Import then export - expect the same xml content` passes today PRECISELY because
  both directions use the lossy 1/0 form. Stable in XML, wrong in memory.
- serialization.xml.test.ts:319-385 builds real booleans and expects `<Object bendable="0" rounded="1">`, with the
  FIX comment at :347 (and :409).
- serialization.xml.test.ts:506-540 imports `entryPerimeter="1" shadow="1"` and gets numbers.
encode(true) -> "1" -> decode -> 1 (number). `true` never survives as `true`.

## Blast radius

No JSON serializer exists at all (`grep JSON.parse|JSON.stringify` in serialization/ returns nothing); XML via codecs
is the only format. ModelXmlSerializer.ts:48-49 explains the name.

mxGraph-specific surface is exactly 3 files: `codec/mxGraph/mxCellCodec.ts`, `codec/mxGraph/mxGeometryCodec.ts`,
`codec/mxGraph/utils.ts` (the last one NOT exported publicly).
Shared by both formats: ObjectCodec.convertAttributeFromXml / isNumericAttribute / decodeAttribute, and
convertAttributeToXml / isBooleanAttribute, plus CellCodec, ModelCodec, Codec.decodeCell/encodeCell.

Public entry points (index.ts:90-97): Codec, CodecRegistry, ObjectCodec, ModelXmlSerializer (+ModelExportOptions),
the model codecs (CellCodec, ModelCodec, mxCellCodec, mxGeometryCodec), the other codecs (BaseGraphCodec,
ChildChangeCodec, GenericChangeCodec, GraphCodec, GraphViewCodec, RootChangeCodec, StylesheetCodec,
TerminalChangeCodec, editor codecs) and the registration functions (registerModelCodecs, registerCoreCodecs,
registerEditorCodecs, registerAllCodecs, unregisterAllCodecs).

## NO boolean metadata exists anywhere

No allow-list, map, set or runtime table saying which keys are boolean. Greps for booleanKeys / BOOLEAN_ /
isBooleanKey / booleanStyle / booleanAttributes return zero hits.
The only key-based metadata on the decode path is ObjectCodec.ts:28-34 (`geometryNumericAttributes`,
`pointNumericAttributes`) and the single rename entry `autosize -> autoSize` (codec/mxGraph/utils.ts:21).
`CellStateStyle` boolean declarations are TypeScript-only, fully erased at runtime.
Decoding never consults the target field type: ObjectCodec.ts:778 is a bare assignment. The codec `template` IS a
viable source of truth (new Cell().vertex === false, new Geometry().relative === false) but is currently used only for
encode-side default suppression (:456).

## Every string -> number coercion site on decode (boolean sites: ZERO)

1. ObjectCodec.ts:580, guarded by isNumericAttribute (:597-605). Every XML attribute whose VALUE looks numeric.
   Covers vertex, edge, relative, collapsed, visible, connectable and native-format style keys in `<Object as="style">`.
2. codec/mxGraph/utils.ts:51, guarded by isNumeric (:47). The mxGraph `style="..."` string entries.
3. codec/StylesheetCodec.ts:171-172, a THIRD independent copy of the same rule, for
   `<Stylesheet><add as="x"><add as="rounded" value="1"/>`. Also note `if (value)` at :177 silently DROPS any falsy
   value, so `value="0"` is discarded entirely.
4. codec/editor/EditorCodec.ts:164-165,180-181, parseInt on the editor `<ui>` node x/y/width/height only.
5. codec/StylesheetCodec.ts:166 `doEval(text)` when allowEval, the only path that can currently produce a real boolean.

Encode side, single site: ObjectCodec.ts:551.
