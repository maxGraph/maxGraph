# Raw exploration 7 (plan step): template-driven detection versus an explicit key list

## Is `template` always a real instance?

`ObjectCodec` ctor `ObjectCodec.ts:210-227`, assignment at :216, declared `template: any` at :238. No validation.
`createObjectCodec` is in `serialization/register-shared.ts:45-49` (NOT under codec/), a thin
`new ObjectCodec(template)` + `setName(name)`.

Real no-arg instances: Cell (via CellCodec.ts:57-61 and mxCellCodec), GraphDataModel (ModelCodec.ts:31),
Geometry (register-model-codecs.ts:33 and mxGeometryCodec.ts:36-38), Point (:34), Rectangle
(register-other-codecs.ts:75), Stylesheet (StylesheetCodec.ts:35), BaseGraph (BaseGraphCodec.ts:37),
Graph (GraphCodec.ts:51, `new Graph(undefined, undefined, [])` with an explicit "do not load default plugins"),
EditorKeyHandler / EditorPopupMenu / EditorToolbar (register-other-codecs.ts:90-92).

EMPTY or partially constructed:
- `createObjectCodec({}, 'Object')` (register-shared.ts:19) and `createObjectCodec([], 'Array')` (:20).
- ChildChange, RootChange, TerminalChange and the six GenericChange classes, all built with
  `const __dummy: any = undefined` (register-other-codecs.ts:31).
- GraphView (`new GraphView(undefined!)`, GraphViewCodec.ts:40), ImageBox (`new ImageBox(undefined!, 0, 0)`),
  Editor (`new Editor(undefined)`, EditorCodec.ts:43-52).
Nothing is registered with a class instead of an instance, nothing with null.

**The Object codec claim is CONFIRMED, twice over.** Its template is `{}`, and `ObjectCodec.decode` (:684-698)
builds the target with `obj = into || this.cloneTemplate()` (:688) where `cloneTemplate` (:285) is
`new this.template.constructor()`, so for the Object codec that is `new Object()` -> `{}`. Neither `template[name]`
nor `obj[name]` ever holds a boolean for a style object. Template-driven AND obj-driven detection are structurally
impossible for `<Object as="style">`.

A fourth, dynamic template source: `CodecRegistry.getCodec` (CodecRegistry.ts:112-118) auto-creates
`new ObjectCodec(new constructorOrName())` inside a `try/catch { ignore }` for any unregistered constructor.

## Fields a runtime oracle would MISS (complete list)

Detected fine (literal initializers): all 6 Cell fields, both Geometry, all 4 GraphDataModel, all 18 AbstractGraph
(verified individually), all 4 GraphView (the `undefined!` graph does not affect field initializers), 12 Editor
booleans, EditorToolbar.connectOnDrop.

MISSED:
1. `Editor.isActive` (editor/Editor.ts:441) declared `boolean | null = null`, so `typeof` is 'object'.
2. `CollapseChange.collapsed` and `.previous`, assigned FROM the ctor argument, template built with `__dummy`.
3. `VisibleChange.visible` and `.previous` (VisibleChange.ts:33-38), same.
4. `TerminalChange.source` (TerminalChange.ts:34), template `new TerminalChange(undefined x4)`.
For 2 to 4 the decode-time object is useless too: `cloneTemplate()` calls the ctor with NO arguments, so the field is
`undefined` there as well. Switching from template to obj does not rescue them.
MITIGATION: `previous` is in the exclude list of every change codec (GenericChangeCodec.ts:46 `['model','previous']`,
TerminalChangeCodec.ts:43) and `isExcluded` short-circuits at ObjectCodec.ts:777, so the real gaps are just
`CollapseChange.collapsed`, `VisibleChange.visible`, `TerminalChange.source` and `Editor.isActive`.

## Constructor side effects and timing

`AbstractGraph` ctor (view/AbstractGraph.ts:434-459) DOES touch the DOM: `document.createElement('div')` (:438),
`initializeCollaborators` (:441) building CellRenderer, GraphDataModel, GraphSelectionModel, Stylesheet and GraphView
(BaseGraph.ts:35-43), a model listener (:447), `view.init()` (:450), `sizeDidChange()` (:453), `view.revalidate()` (:458).
`Editor` ctor is explicitly guarded for the codec case: `if (document.body)` with the comment "don't execute when the
EditorCodec is set up" (editor/Editor.ts:402-433). Under jsdom `document.body` IS truthy, so registering the editor
codecs in tests constructs an EditorPopupMenu, UndoManager, a full Graph, an EditorToolbar and an EditorKeyHandler.
Pre-existing, not introduced by us.
TIMING: none of this happens at module import. The templates are created inside `registerModelCodecs` /
`registerCoreCodecs` / `registerEditorCodecs` (register-model-codecs.ts:26, register-other-codecs.ts:62,86,110), and
`ModelXmlSerializer` calls the former from its `registerCodecs()` hook (:52,68-69). Templates therefore already exist
before any decode: a template-driven check adds ZERO construction cost and no new DOM contact.

## Precedent for template-driven DECODING: none

`grep "this.template" packages/core/src/serialization/` gives five hits: the assignment (:216), the `getName()`
fallback (:274), `cloneTemplate()` (:285) used by decode at :688, the encode-side default suppression (:456), and
`StylesheetCodec.ts:130` re-implementing cloneTemplate. The template is already used on the decode path but ONLY as a
constructor source, never as a type oracle. :456 is the sole value-reading use and it is a loose `!=`, not `typeof`.

## Recommended mechanism

Two populations, two mechanisms, one shared hook.

A. Codec-backed class instances (Cell, Geometry, GraphDataModel, AbstractGraph/BaseGraph/Graph, GraphView, Editor,
   EditorToolbar, plus user classes auto-registered by CodecRegistry.getCodec): a runtime type oracle, and prefer
   `typeof obj[fieldname] === 'boolean'` over `typeof this.template[...]`. `obj` is already in the signature of both
   `isNumericAttribute` (:597) and `convertAttributeFromXml` (:576); it equals the template for every
   literal-initialized field, and it behaves BETTER in the `into` path (decode at :688) where the caller decodes into
   a pre-existing fully built instance, which is exactly the Editor / Graph configuration case. It also covers user
   codecs that override cloneTemplate.
B. Plain style objects and any bare `<Object>`: impossible via any runtime oracle, so an explicit static key set,
   modeled on `geometryNumericAttributes` / `pointNumericAttributes` (ObjectCodec.ts:28-34).

THE HOOK. Do NOT fold this into `isNumericAttribute`: that predicate means "is this a number", it is already
overridden by `CellCodec.isNumericAttribute` (CellCodec.ts:75-77) and by third parties, and a subclass returning
`true` unconditionally would re-break booleans. Add a NEW sibling predicate and consult it FIRST inside
`convertAttributeFromXml` (:576-588):
  `isBooleanAttributeFromXml(dec, attr, obj): boolean`
  then `if (...) return value === '1' || value === 'true'` before the `isNumericAttribute` branch.
This mirrors the encode side exactly (`convertAttributeToXml` :540 gated by `isBooleanAttribute` :564) and gives
per-codec overriding the same way CellCodec already overrides isNumericAttribute.
Name carefully: `isBooleanAttribute` is TAKEN by the encode side (:564) and its signature differs
(`enc, obj, name, value` versus `dec, attr, obj`), so pick a distinct name.

Overrides needed where the oracle cannot reach: the style key set (either in the base predicate guarded by "target is
a plain object", or a small dedicated Object-codec subclass, since register-shared.ts:19 uses the generic
`createObjectCodec({}, 'Object')`); `GenericChangeCodec` / `TerminalChangeCodec` for collapsed / visible / source
(GenericChangeCodec already carries a `variable` field at :47 naming the changed field, so a per-instance "this
variable is boolean" flag fits its design); `EditorCodec` for isActive (or change Editor.ts:441 to `= false`, but that
is an observable behavior change).

Do NOT hook `decodeAttribute` (:753): `mxCellCodec.decodeAttribute` (mxCellCodec.ts:30-37) already overrides it and
bypasses super for `style`, so logic there would be dead for that codec. Also note a latent inconsistency:
decodeAttribute computes `const fieldname = this.getFieldName(name)` at :762 but assigns with the RAW attribute name
at :778, and `convertAttributeFromXml` is called at :761 BEFORE fieldname exists, so the new predicate receives
`attr.nodeName`. No shipped codec passes a `mapping` (none of the ~20 ctors passes the 4th argument), so this is inert
today, but either document that the lookup is attribute-name-keyed or call `this.getFieldName(attr.nodeName)` inside
the predicate.

Two coercion sites this mechanism does NOT cover at all: `codec/mxGraph/utils.ts convertToNumericIfNeeded` (the legacy
style string path, reached from mxCellCodec.decodeAttribute, never passes through convertAttributeFromXml) and
`StylesheetCodec.ts:168-170` (its own decode override at :129).

## Public API and subclassing risk

`ObjectCodec` is exported from `index.ts:92`, next to `Codec` (:90) and `CodecRegistry` (:91).
EVERY method is public: `grep "protected|private"` returns a single hit, `private name?: string` at :209.
The JSDoc PRESENTS them as extension points: `beforeEncode` (:609) and `afterEncode` (:620) are headed "Hook for
subclassers", `getFieldTemplate` (:835-842) says "For strongly typed languages it may be required to override this",
same for `addObjectValue` (:854-861). `CodecRegistry`'s class JSDoc (:22-44) teaches MONKEY-PATCHING instance methods:
`const codec = new ObjectCodec(new GraphDataModel()); codec.encode = function... ; CodecRegistry.register(codec)`.
The public page `packages/website/docs/usage/codecs.md` has "Using custom object and custom Codec" (:162), says the
default scheme "may be overridden by custom codecs" (:177), and DOCUMENTS THE CURRENT BEHAVIOR AS INTENDED at :212:
"Note that the codecs will turn booleans into numeric values". That sentence is about the encode side and stays true,
but the page needs a note about the decode side.
Live in-tree example: `packages/html/stories/JsonData.stories.ts:66-77` replaces `decode` wholesale, so it bypasses
decodeAttribute and is unaffected.

Risks in order of severity:
1. A subclass overriding `convertAttributeFromXml` without calling super silently misses the fix (acceptable, they own
   the conversion); one that DOES call super inherits the new behavior and may see true/false where it saw 1/0.
2. A subclass overriding `isNumericAttribute`: putting the boolean check INSIDE it would let a user override written as
   `return true` defeat the fix. Putting it in convertAttributeFromXml BEFORE isNumericAttribute is immune.
3. Behavioral break for consumers reading decoded values with `=== 1`. Style objects are the higher-risk half since
   they are handed to user code and to shape implementations.
4. Method name collision: `isBooleanAttribute` is already taken on the encode side.
