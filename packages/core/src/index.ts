/*
Copyright 2021-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Contribution of Mixins to the Graph type (no side effects, types only)
import './view/mixin/_graph-mixins-types.js';

export { AbstractGraph } from './view/AbstractGraph.js';
export { BaseGraph } from './view/BaseGraph.js';
export { Graph } from './view/Graph.js';
export * from './view/plugin/index.js';

export { GraphDataModel } from './view/GraphDataModel.js';
export { GraphView } from './view/GraphView.js';
export { default as LayoutManager } from './view/layout/LayoutManager.js';
export { default as Outline } from './view/other/Outline.js';
export { default as PrintPreview } from './view/other/PrintPreview.js';
export { default as SwimlaneManager } from './view/layout/SwimlaneManager.js';
export { default as Client } from './Client.js';

export { default as CellAttributeChange } from './view/undoable-change/CellAttributeChange.js';
export { ChildChange } from './view/undoable-change/ChildChange.js';
export { default as CollapseChange } from './view/undoable-change/CollapseChange.js';
export { default as CurrentRootChange } from './view/undoable-change/CurrentRootChange.js';
export { default as GeometryChange } from './view/undoable-change/GeometryChange.js';
export { RootChange } from './view/undoable-change/RootChange.js';
export { default as SelectionChange } from './view/undoable-change/SelectionChange.js';
export { default as StyleChange } from './view/undoable-change/StyleChange.js';
export { TerminalChange } from './view/undoable-change/TerminalChange.js';
export { default as ValueChange } from './view/undoable-change/ValueChange.js';
export { default as VisibleChange } from './view/undoable-change/VisibleChange.js';

export { EditorKeyHandler } from './editor/EditorKeyHandler.js';
export { EditorPopupMenu } from './editor/EditorPopupMenu.js';
export { EditorToolbar } from './editor/EditorToolbar.js';
export { Editor } from './editor/Editor.js';

export { default as CellHighlight } from './view/cell/CellHighlight.js';
export { default as CellMarker } from './view/cell/CellMarker.js';
export { ConnectionHandlerCellMarker } from './view/plugin/ConnectionHandler.js';
export { default as CellTracker } from './view/cell/CellTracker.js';
export { default as ConstraintHandler } from './view/handler/ConstraintHandler.js';
export { default as EdgeHandler } from './view/handler/EdgeHandler.js';
export { default as EdgeSegmentHandler } from './view/handler/EdgeSegmentHandler.js';
export { default as ElbowEdgeHandler } from './view/handler/ElbowEdgeHandler.js';
export { default as VertexHandle } from './view/cell/VertexHandle.js';
export { default as KeyHandler } from './view/handler/KeyHandler.js';
export { default as VertexHandler } from './view/handler/VertexHandler.js';
export * from './view/handler/config.js';

export { default as CircleLayout } from './view/layout/CircleLayout.js';
export { default as CompactTreeLayout } from './view/layout/CompactTreeLayout.js';
export { default as CompositeLayout } from './view/layout/CompositeLayout.js';
export { default as EdgeLabelLayout } from './view/layout/EdgeLabelLayout.js';
export { default as FastOrganicLayout } from './view/layout/FastOrganicLayout.js';
export { default as GraphLayout } from './view/layout/GraphLayout.js';
export { default as ParallelEdgeLayout } from './view/layout/ParallelEdgeLayout.js';
export { default as PartitionLayout } from './view/layout/PartitionLayout.js';
export { default as RadialTreeLayout } from './view/layout/RadialTreeLayout.js';
export { default as StackLayout } from './view/layout/StackLayout.js';

export { default as HierarchicalEdgeStyle } from './view/layout/datatypes/HierarchicalEdgeStyle.js';
export { default as HierarchicalLayout } from './view/layout/HierarchicalLayout.js';
export { default as SwimlaneLayout } from './view/layout/SwimlaneLayout.js';

export { default as GraphAbstractHierarchyCell } from './view/layout/datatypes/GraphAbstractHierarchyCell.js';
export { default as GraphHierarchyEdge } from './view/layout/datatypes/GraphHierarchyEdge.js';
export { default as GraphHierarchyModel } from './view/layout/hierarchical/GraphHierarchyModel.js';
export { default as GraphHierarchyNode } from './view/layout/datatypes/GraphHierarchyNode.js';
export { default as SwimlaneModel } from './view/layout/hierarchical/SwimlaneModel.js';

export { default as CoordinateAssignment } from './view/layout/hierarchical/CoordinateAssignment.js';
export { default as HierarchicalLayoutStage } from './view/layout/hierarchical/HierarchicalLayoutStage.js';
export { default as MedianHybridCrossingReduction } from './view/layout/hierarchical/MedianHybridCrossingReduction.js';
export { default as MinimumCycleRemover } from './view/layout/hierarchical/MinimumCycleRemover.js';
export { default as SwimlaneOrdering } from './view/layout/hierarchical/SwimlaneOrdering.js';

export { default as Codec } from './serialization/Codec.js';
export { default as CodecRegistry } from './serialization/CodecRegistry.js';
export { default as ObjectCodec } from './serialization/ObjectCodec.js';
export * from './serialization/ModelXmlSerializer.js';
export * from './serialization/codec/_model-codecs.js';
export * from './serialization/codec/_other-codecs.js';
export * from './serialization/register-model-codecs.js';
export * from './serialization/register-other-codecs.js';

export { default as ActorShape } from './view/shape/node/ActorShape.js';
export { default as LabelShape } from './view/shape/node/LabelShape.js';
export { default as Shape } from './view/shape/Shape.js';
export { default as SwimlaneShape } from './view/shape/node/SwimlaneShape.js';
export { default as TextShape } from './view/shape/node/TextShape.js';
export { default as TriangleShape } from './view/shape/node/TriangleShape.js';

export { default as ArrowShape } from './view/shape/edge/ArrowShape.js';
export { default as ArrowConnectorShape } from './view/shape/edge/ArrowConnectorShape.js';
export { default as ConnectorShape } from './view/shape/edge/ConnectorShape.js';
export { default as LineShape } from './view/shape/edge/LineShape.js';
export { default as PolylineShape } from './view/shape/edge/PolylineShape.js';

export { default as CloudShape } from './view/shape/node/CloudShape.js';
export { default as CylinderShape } from './view/shape/node/CylinderShape.js';
export { default as DoubleEllipseShape } from './view/shape/node/DoubleEllipseShape.js';
export { default as EllipseShape } from './view/shape/node/EllipseShape.js';
export { default as HexagonShape } from './view/shape/node/HexagonShape.js';
export { default as ImageShape } from './view/shape/node/ImageShape.js';
export { default as RectangleShape } from './view/shape/node/RectangleShape.js';
export { default as RhombusShape } from './view/shape/node/RhombusShape.js';
export * from './view/shape/ShapeRegistry.js';
export * from './view/shape/register-shapes.js';

export { unregisterAllStencilShapes } from './view/shape/stencil/register.js';
export * from './view/shape/stencil/StencilShape.js';
export * from './view/shape/stencil/StencilShapeRegistry.js';

export { default as Guide } from './view/other/Guide.js';

export { default as Translations, TranslationsAsI18n } from './i18n/Translations.js';
export * from './i18n/config.js';
export * from './i18n/provider.js';

/**
 * @category Utils
 */
export * as cellArrayUtils from './util/cellArrayUtils.js';
/**
 * @category Utils
 */
export * as cloneUtils from './util/cloneUtils.js';
/**
 * @category Utils
 */
export * as constants from './util/Constants.js';
/**
 * @category GUI
 * @category Utils
 */
export * as DomHelpers from './util/domHelpers.js';
/**
 * @category Utils
 */
export * as domUtils from './util/domUtils.js';
/**
 * @category Event
 * @category Utils
 */
export * as eventUtils from './util/EventUtils.js';
/**
 * @category Utils
 */
export * as gestureUtils from './util/gestureUtils.js';
/**
 * @category Utils
 */
export * as mathUtils from './util/mathUtils.js';
/**
 * @category Utils
 */
export * as printUtils from './util/printUtils.js';
/**
 * @category Utils
 */
export * as stringUtils from './util/StringUtils.js';
/**
 * @category Utils
 */
export * as styleUtils from './util/styleUtils.js';
/**
 * @category Utils
 */
export * as xmlUtils from './util/xmlUtils.js';
/**
 * @category Utils
 */
export * as xmlViewUtils from './util/xmlViewUtils.js';

export * from './util/config.js';
export * from './util/logger.js';

export { default as Animation } from './view/animate/Animation.js';
export { default as Effects } from './view/animate/Effects.js';
export { default as Morphing } from './view/animate/Morphing.js';

export { default as AbstractCanvas2D } from './view/canvas/AbstractCanvas2D.js';
export { default as SvgCanvas2D } from './view/canvas/SvgCanvas2D.js';
export { default as XmlCanvas2D } from './view/canvas/XmlCanvas2D.js';

export { default as Geometry } from './view/geometry/Geometry.js';
export { default as ObjectIdentity } from './util/ObjectIdentity.js';
export { default as Point } from './view/geometry/Point.js';
export { default as Rectangle } from './view/geometry/Rectangle.js';

export * from './view/style/builtin-style-elements.js';
export * from './view/style/config.js';
export * from './view/style/register.js';
export * from './view/style/edge/EdgeStyleRegistry.js';
export { EdgeMarkerRegistry } from './view/style/marker/EdgeMarkerRegistry.js';
export { PerimeterRegistry } from './view/style/perimeter/PerimeterRegistry.js';
export { Stylesheet } from './view/style/Stylesheet.js';

export { default as DragSource } from './view/other/DragSource.js';
export { default as PanningManager } from './view/other/PanningManager.js';

export { default as InternalEvent } from './view/event/InternalEvent.js';
export { default as EventObject } from './view/event/EventObject.js';
export { default as EventSource } from './view/event/EventSource.js';
export { default as InternalMouseEvent } from './view/event/InternalMouseEvent.js';

export { default as MaxForm } from './gui/MaxForm.js';
export { default as MaxLog } from './gui/MaxLog.js';
export { MaxLogAsLogger } from './gui/MaxLogAsLogger.js';
export { default as MaxPopupMenu } from './gui/MaxPopupMenu.js';
export { default as MaxToolbar } from './gui/MaxToolbar.js';
export { default as MaxWindow } from './gui/MaxWindow.js';
/**
 * @category GUI
 * @category Utils
 */
export * as guiUtils from './gui/guiUtils.js';

export { default as ImageBox } from './view/image/ImageBox.js';
export { default as ImageBundle } from './view/image/ImageBundle.js';
export { default as ImageExport } from './view/image/ImageExport.js';

export { default as UrlConverter } from './util/UrlConverter.js';
export { default as MaxXmlRequest } from './util/MaxXmlRequest.js';
/**
 * @category Utils
 */
export * as requestUtils from './util/requestUtils.js';

export { default as AutoSaveManager } from './view/other/AutoSaveManager.js';
export { default as Clipboard } from './util/Clipboard.js';

export { default as UndoableEdit } from './view/undoable-change/UndoableEdit.js';
export { default as UndoManager } from './view/undoable-change/UndoManager.js';

export { Cell } from './view/cell/Cell.js';
export { default as CellOverlay } from './view/cell/CellOverlay.js';
export { default as CellPath } from './view/cell/CellPath.js';
export { default as CellRenderer } from './view/cell/CellRenderer.js';
export { default as CellState } from './view/cell/CellState.js';
export { default as CellStatePreview } from './view/cell/CellStatePreview.js';
export { default as TemporaryCellStates } from './view/cell/TemporaryCellStates.js';
export { default as ConnectionConstraint } from './view/other/ConnectionConstraint.js';
export { default as Multiplicity } from './view/other/Multiplicity.js';

// Ensure types are exported in the type definitions
export type { HTMLImageElementWithProps } from './gui/MaxToolbar.js';
export * from './types.js';
