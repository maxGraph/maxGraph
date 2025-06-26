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
import './view/mixins/_graph-mixins-types';

export { AbstractGraph } from './view/AbstractGraph';
export { BaseGraph } from './view/BaseGraph';
export { Graph } from './view/Graph';
export * from './view/plugins';

export { GraphDataModel } from './view/GraphDataModel';
export { GraphView } from './view/GraphView';
export { default as LayoutManager } from './view/layout/LayoutManager';
export { default as Outline } from './view/other/Outline';
export { default as PrintPreview } from './view/other/PrintPreview';
export { default as SwimlaneManager } from './view/layout/SwimlaneManager';
export { default as Client } from './Client';

export { default as CellAttributeChange } from './view/undoable_changes/CellAttributeChange';
export { ChildChange } from './view/undoable_changes/ChildChange';
export { default as CollapseChange } from './view/undoable_changes/CollapseChange';
export { default as CurrentRootChange } from './view/undoable_changes/CurrentRootChange';
export { default as GeometryChange } from './view/undoable_changes/GeometryChange';
export { RootChange } from './view/undoable_changes/RootChange';
export { default as SelectionChange } from './view/undoable_changes/SelectionChange';
export { default as StyleChange } from './view/undoable_changes/StyleChange';
export { TerminalChange } from './view/undoable_changes/TerminalChange';
export { default as ValueChange } from './view/undoable_changes/ValueChange';
export { default as VisibleChange } from './view/undoable_changes/VisibleChange';

export { EditorKeyHandler } from './editor/EditorKeyHandler';
export { EditorPopupMenu } from './editor/EditorPopupMenu';
export { EditorToolbar } from './editor/EditorToolbar';
export { Editor } from './editor/Editor';

export { default as CellHighlight } from './view/cell/CellHighlight';
export { default as CellMarker } from './view/cell/CellMarker';
export { default as CellTracker } from './view/cell/CellTracker';
export { default as ConstraintHandler } from './view/handler/ConstraintHandler';
export { default as EdgeHandler } from './view/handler/EdgeHandler';
export { default as EdgeSegmentHandler } from './view/handler/EdgeSegmentHandler';
export { default as ElbowEdgeHandler } from './view/handler/ElbowEdgeHandler';
export { default as VertexHandle } from './view/cell/VertexHandle';
export { default as KeyHandler } from './view/handler/KeyHandler';
export { default as VertexHandler } from './view/handler/VertexHandler';
export * from './view/handler/config';

export { default as CircleLayout } from './view/layout/CircleLayout';
export { default as CompactTreeLayout } from './view/layout/CompactTreeLayout';
export { default as CompositeLayout } from './view/layout/CompositeLayout';
export { default as EdgeLabelLayout } from './view/layout/EdgeLabelLayout';
export { default as FastOrganicLayout } from './view/layout/FastOrganicLayout';
export { default as GraphLayout } from './view/layout/GraphLayout';
export { default as ParallelEdgeLayout } from './view/layout/ParallelEdgeLayout';
export { default as PartitionLayout } from './view/layout/PartitionLayout';
export { default as RadialTreeLayout } from './view/layout/RadialTreeLayout';
export { default as StackLayout } from './view/layout/StackLayout';

export { default as HierarchicalEdgeStyle } from './view/layout/datatypes/HierarchicalEdgeStyle';
export { default as HierarchicalLayout } from './view/layout/HierarchicalLayout';
export { default as SwimlaneLayout } from './view/layout/SwimlaneLayout';

export { default as GraphAbstractHierarchyCell } from './view/layout/datatypes/GraphAbstractHierarchyCell';
export { default as GraphHierarchyEdge } from './view/layout/datatypes/GraphHierarchyEdge';
export { default as GraphHierarchyModel } from './view/layout/hierarchical/GraphHierarchyModel';
export { default as GraphHierarchyNode } from './view/layout/datatypes/GraphHierarchyNode';
export { default as SwimlaneModel } from './view/layout/hierarchical/SwimlaneModel';

export { default as CoordinateAssignment } from './view/layout/hierarchical/CoordinateAssignment';
export { default as HierarchicalLayoutStage } from './view/layout/hierarchical/HierarchicalLayoutStage';
export { default as MedianHybridCrossingReduction } from './view/layout/hierarchical/MedianHybridCrossingReduction';
export { default as MinimumCycleRemover } from './view/layout/hierarchical/MinimumCycleRemover';
export { default as SwimlaneOrdering } from './view/layout/hierarchical/SwimlaneOrdering';

export { default as Codec } from './serialization/Codec';
export { default as CodecRegistry } from './serialization/CodecRegistry';
export { default as ObjectCodec } from './serialization/ObjectCodec';
export * from './serialization/ModelXmlSerializer';
export * from './serialization/codecs/_model-codecs';
export * from './serialization/codecs/_other-codecs';
export * from './serialization/register-model-codecs';
export * from './serialization/register-other-codecs';

export { default as ActorShape } from './view/shape/node/ActorShape';
export { default as LabelShape } from './view/shape/node/LabelShape';
export { default as Shape } from './view/shape/Shape';
export { default as SwimlaneShape } from './view/shape/node/SwimlaneShape';
export { default as TextShape } from './view/shape/node/TextShape';
export { default as TriangleShape } from './view/shape/node/TriangleShape';

export { default as ArrowShape } from './view/shape/edge/ArrowShape';
export { default as ArrowConnectorShape } from './view/shape/edge/ArrowConnectorShape';
export { default as ConnectorShape } from './view/shape/edge/ConnectorShape';
export { default as LineShape } from './view/shape/edge/LineShape';
export { default as PolylineShape } from './view/shape/edge/PolylineShape';

export { default as CloudShape } from './view/shape/node/CloudShape';
export { default as CylinderShape } from './view/shape/node/CylinderShape';
export { default as DoubleEllipseShape } from './view/shape/node/DoubleEllipseShape';
export { default as EllipseShape } from './view/shape/node/EllipseShape';
export { default as HexagonShape } from './view/shape/node/HexagonShape';
export { default as ImageShape } from './view/shape/node/ImageShape';
export { default as RectangleShape } from './view/shape/node/RectangleShape';
export { default as RhombusShape } from './view/shape/node/RhombusShape';
export * from './view/shape/ShapeRegistry';
export * from './view/shape/register-shapes';

export { unregisterAllStencilShapes } from './view/shape/stencil/register';
export {
  default as StencilShape,
  StencilShapeConfig,
} from './view/shape/stencil/StencilShape';
export * from './view/shape/stencil/StencilShapeRegistry';

export { default as Guide } from './view/other/Guide';

export { default as Translations, TranslationsAsI18n } from './i18n/Translations';
export * from './i18n/config';
export * from './i18n/provider';

/**
 * @category Utils
 */
export * as cellArrayUtils from './util/cellArrayUtils';
/**
 * @category Utils
 */
export * as cloneUtils from './util/cloneUtils';
/**
 * @category Utils
 */
export * as constants from './util/Constants';
/**
 * @category GUI
 * @category Utils
 */
export * as DomHelpers from './util/domHelpers';
/**
 * @category Utils
 */
export * as domUtils from './util/domUtils';
/**
 * @category Event
 * @category Utils
 */
export * as eventUtils from './util/EventUtils';
/**
 * @category Utils
 */
export * as gestureUtils from './util/gestureUtils';
/**
 * @category Utils
 */
export * as mathUtils from './util/mathUtils';
/**
 * @category Utils
 */
export * as printUtils from './util/printUtils';
/**
 * @category Utils
 */
export * as stringUtils from './util/StringUtils';
/**
 * @category Utils
 */
export * as styleUtils from './util/styleUtils';
/**
 * @category Utils
 */
export * as xmlUtils from './util/xmlUtils';

export * from './util/config';
export * from './util/logger';

export { default as Animation } from './view/animate/Animation';
export { default as Effects } from './view/animate/Effects';
export { default as Morphing } from './view/animate/Morphing';

export { default as AbstractCanvas2D } from './view/canvas/AbstractCanvas2D';
export { default as SvgCanvas2D } from './view/canvas/SvgCanvas2D';
export { default as XmlCanvas2D } from './view/canvas/XmlCanvas2D';

export { default as Geometry } from './view/geometry/Geometry';
export { default as ObjectIdentity } from './util/ObjectIdentity';
export { default as Point } from './view/geometry/Point';
export { default as Rectangle } from './view/geometry/Rectangle';

export * from './view/style/builtin-style-elements';
export * from './view/style/config';
export * from './view/style/register';
export * from './view/style/edge/EdgeStyleRegistry';
export { EdgeMarkerRegistry } from './view/style/marker/EdgeMarkerRegistry';
export { PerimeterRegistry } from './view/style/perimeter/PerimeterRegistry';
export { Stylesheet } from './view/style/Stylesheet';

export { default as DragSource } from './view/other/DragSource';
export { default as PanningManager } from './view/other/PanningManager';

export { default as InternalEvent } from './view/event/InternalEvent';
export { default as EventObject } from './view/event/EventObject';
export { default as EventSource } from './view/event/EventSource';
export { default as InternalMouseEvent } from './view/event/InternalMouseEvent';

export { default as MaxForm } from './gui/MaxForm';
export { default as MaxLog } from './gui/MaxLog';
export { MaxLogAsLogger } from './gui/MaxLogAsLogger';
export { default as MaxPopupMenu } from './gui/MaxPopupMenu';
export { default as MaxToolbar } from './gui/MaxToolbar';
export { default as MaxWindow } from './gui/MaxWindow';
/**
 * @category GUI
 * @category Utils
 */
export * as guiUtils from './gui/guiUtils';

export { default as ImageBox } from './view/image/ImageBox';
export { default as ImageBundle } from './view/image/ImageBundle';
export { default as ImageExport } from './view/image/ImageExport';

export { default as UrlConverter } from './util/UrlConverter';
export { default as MaxXmlRequest } from './util/MaxXmlRequest';
/**
 * @category Utils
 */
export * as requestUtils from './util/requestUtils';

export { default as AutoSaveManager } from './view/other/AutoSaveManager';
export { default as Clipboard } from './util/Clipboard';

export { default as UndoableEdit } from './view/undoable_changes/UndoableEdit';
export { default as UndoManager } from './view/undoable_changes/UndoManager';

export { Cell } from './view/cell/Cell';
export { default as CellOverlay } from './view/cell/CellOverlay';
export { default as CellPath } from './view/cell/CellPath';
export { default as CellRenderer } from './view/cell/CellRenderer';
export { default as CellState } from './view/cell/CellState';
export { default as CellStatePreview } from './view/cell/CellStatePreview';
export { default as TemporaryCellStates } from './view/cell/TemporaryCellStates';
export { default as ConnectionConstraint } from './view/other/ConnectionConstraint';
export { default as Multiplicity } from './view/other/Multiplicity';

// Ensure types are exported in the type definitions
export type { HTMLImageElementWithProps } from './gui/MaxToolbar';
export * from './types';
