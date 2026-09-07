# Raw exploration 1: inventory of boolean properties reachable from XML deserialization

## CellStyle / CellStateStyle (packages/core/src/types.ts), 36 total

CellStyle extends CellStateStyle (types.ts:52), so all are visible on both.

CellStyle own (1): ignoreDefaultStyle (76).

CellStateStyle (35): absoluteArcSize (85), anchorPointDirection (104), autoSize (136), backgroundOutline (141),
bendable (148), cloneable (155), curved (160), dashed (165), deletable (182), editable (207), endFill (229),
entryPerimeter (277), exitPerimeter (334), fixDash (379), flipH (384), flipV (389), foldable (395), glass (420),
horizontal (444), imageAspect (472), movable (587), noEdgeStyle (593), noLabel (598), orthogonal (614, `boolean | null`),
orthogonalLoop (621), pointerEvents (668), portConstraintRotation (683), resizable (690), resizeHeight (697),
resizeWidth (704), rotatable (711), rounded (726), shadow (756), startFill (854), swimlaneLine (903).

The style object is flat: no nested style interface, so no further nested booleans. Stylesheet only stores
Map<string, CellStateStyle>.

## Cell (packages/core/src/view/cell/Cell.ts), 6

invalidating (87), vertex (122), edge (128), connectable (134), visible (140), collapsed (146).
All reachable through CellCodec generic reflection decode; the exclude list is ['children','edges','overlays','mxTransient']
and the reference list is ['parent','source','target'].

## Other codec-registered classes

- Geometry (register-model-codecs.ts:48,55): TRANSLATE_CONTROL_POINTS (93), relative (150).
- Point, Rectangle, ImageBox: no boolean fields.
- GraphDataModel (ModelCodec, register-model-codecs.ts:44): maintainEdgeParent (235), ignoreRelativeEdgeParent (241),
  createIds (247), endingUpdate (284).
- AbstractGraph (GraphCodec/BaseGraphCodec, register-other-codecs.ts:81-82), 18: destroyed (80), isConstrainedMoving (84),
  pageVisible (223), pageBreaksVisible (231), pageBreakDashed (243), preferPageSize (256), enabled (269),
  exportEnabled (275), importEnabled (281), ignoreScrollbars (289), translateToScrollPosition (297),
  resizeContainer (330), keepEdgesInForeground (345), keepEdgesInBackground (353), recursiveResize (359),
  resetViewOnRootChange (366), allowLoops (372), multigraph (387).
- GraphView (GraphViewCodec, register-other-codecs.ts:83): allowEval (148), captureDocumentGesture (154),
  rendering (160), updateStyle (189).
- CollapseChange.collapsed (30), VisibleChange.visible (30), TerminalChange.source (32).
- Editor (EditorCodec), 12 decodable: isActive (441, boolean|null), destroyed (443), swimlaneRequired (591),
  disableContextMenu (597), forcedInserting (617), escapePostData (674), horizontalFlow (693), layoutDiagram (712),
  maintainSwimlanes (733), layoutSwimlanes (739), movePropertiesDialog (837), validating (844).
- EditorToolbar.connectOnDrop (95).

## Confirmations and deltas from the second, independent inventory pass

- The 36 style booleans and the 6 Cell fields are confirmed exactly, same line numbers.
- `orthogonal?: boolean | null` (types.ts:614) is the ONLY union; no property is declared `boolean | number` anywhere.
  The runtime value is effectively `boolean | number` in spite of the declaration.
- Not style-reachable, so out of scope even though they hold booleans: `CanvasState.dashed/fixDash/shadow`
  (types.ts:1101,1106,1127, paint-time mirror), `VertexParameters.relative` (1199), `EdgeStyleMetaData.isOrthogonal` /
  `allowIntermediateHandles` (1650,1658), `GraphFoldingOptions` (1525,1540), `CellHandle.active` (1304).
- No style boolean is declared outside types.ts (Stylesheet.ts and styleUtils.ts checked).
- `CollapseChange.previous` (:31) and `VisibleChange.previous` (:31) are booleans too, excluded by their codec.
- The ONLY boolean-normalizing helper in the whole core is `StencilShape.ts:73`
  `const toBoolean = (value: string | null) => value !== '0'`, used for the SVG large-arc-flag / sweep-flag at
  :505-506. Unrelated to styles, not reusable as is. There is no getBooleanValue / parseBoolean / toBoolean for styles.
- Group 3 count excluding Cell: 47 boolean fields across Geometry (2), GraphDataModel (4), GraphView (4),
  AbstractGraph (18), CollapseChange (2), VisibleChange (2), TerminalChange (1), Editor (13), EditorToolbar (1).
- GraphViewCodec.encode is fully custom and does not write these fields; its decode is the inherited generic one.
  EditorToolbarCodec.decode is custom child-node parsing, not attribute reflection.
