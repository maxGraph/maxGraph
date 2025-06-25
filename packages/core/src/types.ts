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

import type { IDENTITY_FIELD_NAME } from './util/Constants';
import type { AbstractGraph } from './view/AbstractGraph';
import type AbstractCanvas2D from './view/canvas/AbstractCanvas2D';
import type Cell from './view/cell/Cell';
import type CellState from './view/cell/CellState';
import type EventSource from './view/event/EventSource';
import type InternalMouseEvent from './view/event/InternalMouseEvent';
import type Geometry from './view/geometry/Geometry';
import type Point from './view/geometry/Point';
import type Rectangle from './view/geometry/Rectangle';
import type Shape from './view/shape/Shape';
import type ImageBox from './view/image/ImageBox';
import type CellRenderer from './view/cell/CellRenderer';
import type GraphDataModel from './view/GraphDataModel';
import type { Stylesheet } from './view/style/Stylesheet';
import type GraphSelectionModel from './view/GraphSelectionModel';
import type GraphView from './view/GraphView';
import type EventObject from './view/event/EventObject';
import type Editor from './editor/Editor';

export type FilterFunction = (cell: Cell) => boolean;

/** @category Change */
export type UndoableChange = {
  execute: () => void;
  undo?: () => void;
  redo?: () => void;
};

/** @category Style */
export type StyleValue = string | number;

export type Properties = Record<string, any>;

/** @category Style */
export type CellStyle = CellStateStyle & {
  /**
   * Names of styles used to fill properties before applying the specific properties defined in {@link CellStateStyle}.
   *
   * Here's the initial algorithm for populating properties:
   * - Take the style name in order from the table
   * - Retrieve the style associated with the style registered in {@link StyleSheet}.
   * Ignore unknown styles
   * - Merge the current style with the style retrieved from `StyleSheet`.
   *
   * Once the initial population of properties is complete, merge the style with the properties defined {@link CellStateStyle}.
   *
   **NOTE**: the order of styles in the array is important: if the same property is defined in several styles,
   * the value actually used is that defined in the last style declared in the array.
   */
  baseStyleNames?: string[];

  /**
   * If set to `true`, ignores the default style when computing the actual style for a cell.
   * The {@link baseStyleNames} are still taken into account.
   *
   * @default false
   * @since 0.11.0
   */
  ignoreDefaultStyle?: boolean;
};

/** @category Style */
export type CellStateStyle = {
  /**
   * This specifies if {@link arcSize} for rectangles is absolute or relative.
   * @default false
   */
  absoluteArcSize?: boolean;
  /**
   * This value defines how the lines of the label are aligned horizontally.
   * - `left` means that the lines of label text are aligned to the left of the label bounds.
   * - `right` means that the lines of label text are aligned to the right of the label bounds.
   * - `center` means that the center of the label text lines are aligned to the center of the label bounds.
   *
   * Note that this value does not affect the positioning of the overall label bounds relative
   * to the vertex. To move the label bounds horizontally, use {@link labelPosition}.
   * @default 'center'
   */
  align?: AlignValue;
  /**
   *  This defines if the direction style should be taken into account when computing the fixed point location for connected edges.
   *  See also {@link direction}.
   *
   *  Set this to `false` to ignore the direction style for fixed connection points.
   *  @default true
   */
  anchorPointDirection?: boolean;
  /**
   * For **vertex**, this defines the rounding factor for a {@link rounded} vertex in percent.
   * The possible values are between `0` and `100`.
   * If this value is not specified, then `constants.RECTANGLE_ROUNDING_FACTOR * 100` is used.
   *
   * Shapes supporting `arcSize`:
   * - Rectangle
   * - Rhombus
   * - Swimlane
   * - Triangle
   *
   * For **edge**, this defines the absolute size of the {@link rounded} corners in pixels.
   * If this value is not specified, then {@link LINE_ARCSIZE} is used.
   *
   * See also {@link absoluteArcSize}.
   */
  arcSize?: number;
  /**
   * The possible values are empty or fixed.
   * If `fixed` is used, the aspect ratio of the cell will be maintained when resizing.
   * @default 'empty'
   */
  aspect?: string;
  /**
   * This specifies if a cell should be resized automatically if its value changed.
   * This is normally combined with {@link resizable} to disable manual resizing.
   *
   * Note that a cell is in fact auto-resizable according to the value returned by {@link AbstractGraph.isAutoSizeCell}.
   * @default false
   */
  autoSize?: boolean;
  /**
   * This specifies if only the background of a cell should be painted when it is highlighted.
   * @default false
   */
  backgroundOutline?: boolean;
  /**
   * This specifies if the control points of an edge can be moved.
   *
   * Note that a cell is in fact bendable according to the value returned by {@link AbstractGraph.isCellBendable}.
   * @default true
   */
  bendable?: boolean;
  /**
   * This specifies if a cell can be cloned.
   *
   * Note that a cell is in fact cloneable according to the value returned by {@link AbstractGraph.isCellCloneable}.
   * @default true
   */
  cloneable?: boolean;
  /**
   * It is only applicable for connector shapes.
   * @default false
   */
  curved?: boolean;
  /**
   * See also {@link dashPattern} and {@link fixDash}.
   * @default false
   */
  dashed?: boolean;
  /**
   * The type of this value is a space-separated list of numbers that specify a custom-defined dash pattern. Only relevant if {@link dashed} is `true`.
   *
   * Dash styles are defined by the length of the dash (the drawn part of the stroke) and the length of the space between the dashes.
   *
   * The lengths are relative to the line width: a length of `1` is equal to the line width.
   *
   * See also {@link dashed} and {@link fixDash}.
   */
  dashPattern?: string;
  /**
   * This specifies if a cell can be deleted.
   *
   * Note that a cell is in fact deletable according to the value returned by {@link AbstractGraph.isCellDeletable}.
   * @default true
   */
  deletable?: boolean;
  /**
   * The direction style is used to specify the direction of certain shapes (e.g. Swimlane) or EdgeStyle (e.g. Loop).
   * @default 'east' for shapes and 'west' for the Loop EdgeStyle
   */
  direction?: DirectionValue;
  /**
   * This defines the style of the edge if the current cell is an Edge.
   *
   * The possible values are all names of the shapes registered with {@link EdgeStyleRegistry.add}.
   * This includes {@link EdgeStyleValue} values and custom names that have been registered.
   *
   * It is also possible to pass a {@link EdgeStyleFunction}.
   * **IMPORTANT**: when using a {@link EdgeStyleFunction}, be sure that is correctly registered in the {@link EdgeStyleRegistry}.
   * Otherwise, the function may not be correctly configured. See {@link EdgeStyleMetaData}.
   *
   * See {@link noEdgeStyle}.
   */
  edgeStyle?: StyleEdgeStyleValue;
  /**
   * This specifies if the value of a cell can be edited using the in-place editor.
   *
   * Note that a cell is in fact editable according to the value returned by {@link AbstractGraph.isCellEditable}.
   * @default true
   */
  editable?: boolean;
  /**
   * This defines how the three-segment orthogonal edge style leaves its terminal vertices.
   * The 'vertical' style leaves the terminal vertices at the top and bottom sides.
   *
   * @default 'horizontal'
   */
  elbow?: ElbowValue;
  /**
   * This defines the style of the end arrow marker.
   *
   * Possible values are all names of registered arrow markers with {@link EdgeMarkerRegistry.add}.
   * This includes {@link ArrowValue} values and custom names that have been registered.
   *
   * See {@link startArrow}.
   */
  endArrow?: StyleArrowValue;
  /**
   * Use `false` to not fill or `true` to fill the end arrow marker.
   * See {@link startFill}.
   * @default true
   */
  endFill?: boolean;
  /**
   * Set the fill color of the end arrow marker if {@link endFill} is `true`.
   * If not set, use {@link strokeColor}.
   * @since 0.10.0
   */
  endFillColor?: ColorValue;
  /**
   * Set the stroke color of the end arrow marker.
   * If not set, use {@link strokeColor}.
   * @since 0.10.0
   */
  endStrokeColor?: ColorValue;
  /**
   * The value represents the size of the end marker in pixels.
   * See {@link startSize}.
   */
  endSize?: number;
  /**
   * The horizontal offset of the connection point of an edge with its target terminal.
   */
  entryDx?: number;
  /**
   * The vertical offset of the connection point of an edge with its target terminal.
   */
  entryDy?: number;
  /**
   * Defines if the perimeter should be used to find the exact entry point along the perimeter
   * of the target.
   * @default true
   */
  entryPerimeter?: boolean;
  /**
   * The connection point in relative horizontal coordinates of an edge with its target terminal.
   */
  entryX?: number;
  /**
   * The connection point in relative vertical coordinates of an edge with its target terminal.
   */
  entryY?: number;
  /**
   * The horizontal offset of the connection point of an edge with its source terminal.
   */
  exitDx?: number;
  /**
   * The vertical offset of the connection point of an edge with its source terminal.
   */
  exitDy?: number;
  /**
   * Defines if the perimeter should be used to find the exact entry point along the perimeter
   * of the source.
   * @default true
   */
  exitPerimeter?: boolean;
  /**
   * The horizontal relative coordinate connection point of an edge with its source terminal.
   */
  exitX?: number;
  /**
   * The vertical relative coordinate connection point of an edge with its source terminal.
   */
  exitY?: number;
  /**
   * The possible values are all HTML color names or HEX codes, as well as special keywords such as:
   * - `indicated` to use the color of a related cell or the indicator shape
   * - `inherit` to use the color of the direct parent cell
   * - `none` for no color
   * - `swimlane` to use the color of the parent swimlane if one exists in the parent hierarchy
   */
  fillColor?: SpecialStyleColorValue;
  /**
   * Possible range is `0-100`.
   */
  fillOpacity?: number;
  /**
   * Use `false` for dash patterns that depend on the line width and `true` for dash patterns
   * that ignore the line width.
   * See also {@link dashed} and {@link dashPattern}.
   * @default false
   */
  fixDash?: boolean;
  /**
   * Horizontal flip.
   * @default false
   */
  flipH?: boolean;
  /**
   * Vertical flip.
   * @default false
   */
  flipV?: boolean;
  /**
   * This specifies if a cell is foldable using a folding icon.
   * See {@link AbstractGraph.isCellFoldable}.
   * @default true
   */
  foldable?: boolean;
  /**
   * The possible values are all HTML color names or HEX codes, as well as special keywords such as:
   * - `indicated` to use the color of a related cell or the indicator shape
   * - `inherit` to use the color of the direct parent cell
   * - `none` for no color
   * - `swimlane` to use the color of the parent swimlane if one exists in the parent hierarchy
   */
  fontColor?: SpecialStyleColorValue;
  /**
   * The possible values are names such as `Arial; Dialog; Verdana; Times New Roman`.
   */
  fontFamily?: string;
  /**
   * The size of the font (in px).
   */
  fontSize?: number;
  /**
   * Values may be any logical AND (sum) of the {@link FONT_STYLE_FLAG}. For instance, FONT_STYLE_FLAG.BOLD, FONT_STYLE_FLAG.ITALIC, ...
   */
  fontStyle?: number;
  /**
   * Enable the glass gradient effect
   * @default false
   */
  glass?: boolean;
  /**
   * The possible values are all HTML color names or HEX codes, as well as special keywords such as:
   * - `indicated` to use the color of a related cell or the indicator shape
   * - `inherit` to use the color of the direct parent cell
   * - `none` for no color
   * - `swimlane` to use the color of the parent swimlane if one exists in the parent hierarchy
   */
  gradientColor?: SpecialStyleColorValue;
  /**
   * Generally, and by default in maxGraph, gradient painting is done from the value of {@link fillColor} to the value of {@link gradientColor}.
   * If we take the example of 'north', this means that the {@link fillColor} color is at the bottom of paint pattern
   * and the {@link gradientColor} color is at the top, with a gradient in-between.
   * @default 'south'
   */
  gradientDirection?: DirectionValue;
  /**
   * This value only applies to vertices.
   * If the {@link shape} is `swimlane`, a value of `false` indicates that the swimlane should
   * be drawn vertically, `true` indicates that it should be drawn horizontally.
   * If the shape style does not indicate that this vertex is a 'swimlane', this value only
   * affects whether the label is drawn horizontally or vertically.
   * @default true
   */
  horizontal?: boolean;
  /**
   * The possible values are any image URL.
   *
   * This is the path to the image that is to be displayed within the label of a vertex.
   * Data URLs should use the following format: `data:image/png,xyz` where xyz is the base64
   * encoded data (without the "base64"-prefix).
   */
  image?: string;
  /**
   * The value defines how any image in the vertex label is horizontally aligned within the
   * label bounds of a {@link LabelShape}.
   * @default 'left'
   */
  imageAlign?: AlignValue;
  /**
   * The possible values are:
   * - `false`: do not preserve aspect of the image
   * - `true`: keep aspect of the image
   *
   * This is only used in `ImageShape`.
   * @default true
   */
  imageAspect?: boolean;
  /**
   * The possible values for the image background are all HTML color names or HEX codes.
   *
   * This is only used in `ImageShape`.
   * @default 'none'
   */
  imageBackground?: ColorValue;
  /**
   * The possible values for the color of the image border are all HTML color names or HEX codes.
   *
   * This is only used in `ImageShape`.
   * @default 'none'
   */
  imageBorder?: ColorValue;
  /**
   * The value is the image height in pixels and must be greater than `0`.
   * @default {@link DEFAULT_IMAGESIZE}
   */
  imageHeight?: number;
  /**
   * The value is the image width in pixels and must be greater than `0`.
   * @default {@link DEFAULT_IMAGESIZE}
   */
  imageWidth?: number;
  /**
   * The possible values are all HTML color names or HEX codes, as well as the special `swimlane` keyword
   * to refer to the color of the parent `swimlane` if one exists.
   */
  indicatorColor?: ColorValue;
  /**
   * The direction style is used to specify the direction of certain shapes (eg. {@link TriangleShape}).
   * @default 'east'
   */
  indicatorDirection?: DirectionValue;
  /**
   * The possible values start at 0 (in pixels).
   */
  indicatorHeight?: number;
  /**
   * Indicator image used within a {@link LabelShape}.
   * The possible values are all image URLs.
   *
   * The {@link indicatorShape} has precedence over the indicatorImage.
   */
  indicatorImage?: string;
  /**
   * The indicator shape used within an {@link LabelShape}.
   * The possible values are all names of registered Shapes with {@link CellRenderer.registerShape}.
   * This includes {@link ShapeValue} values and custom names that have been registered.
   *
   * The `indicatorShape` property has precedence over the {@link indicatorImage} property.
   */
  indicatorShape?: StyleShapeValue;
  /**
   * The color of the indicator stroke in {@link LabelShape}.
   * The possible values are all HTML color names or HEX codes.
   */
  indicatorStrokeColor?: ColorValue;
  /**
   * The possible values start at 0 (in pixels).
   */
  indicatorWidth?: number;
  /**
   * The jetty size in {@link EdgeStyle.OrthConnector} when {@link sourceJettySize} or {@link targetJettySize}.
   * @default {@link OrthogonalConnectorConfig.buffer}
   */
  jettySize?: number | 'auto';
  /**
   * The possible values are all HTML color names or HEX codes.
   */
  labelBackgroundColor?: ColorValue;
  /**
   * The possible values are all HTML color names or HEX codes.
   */
  labelBorderColor?: ColorValue;
  /**
   * The label padding, i.e. the space between the label border and the label.
   */
  labelPadding?: number;
  /**
   * The label alignment defines the position of the label relative to the cell.
   * - `left` means that the entire label bounds is placed completely just to the left of the vertex.
   * - `right` means that the label bounds are adjusted to the right.
   * - `center` means that the label bounds are vertically aligned with the bounds of the vertex.
   * - `ignore` means that there is no alignment
   *
   * Note that this value does not affect the positioning of label within the label bounds.
   * To move the label bounds horizontally within the label bounds, use {@link align}
   * @default 'center'
   */
  labelPosition?: AlignValue | 'ignore';
  /**
   * The width of the label if the label position is not `center`.
   */
  labelWidth?: number;
  /**
   * The possible values are the functions defined in {@link EdgeStyle}.
   *
   * See {@link edgeStyle}.
   * See {@link AbstractGraph.defaultLoopStyle}.
   */
  loopStyle?: EdgeStyleFunction;
  /**
   * The margin between the ellipses in {@link DoubleEllipseShape}.
   *
   * The possible values are all positive numbers.
   */
  margin?: number;
  /**
   * This specifies if a cell can be moved.
   *
   * Note that a cell is in fact movable according to the value returned by {@link AbstractGraph.isCellMovable}.
   * @default true
   */
  movable?: boolean;
  /**
   *  If this is `true`, no edge style is applied for a given edge.
   *  See {@link edgeStyle}.
   *  @default false
   */
  noEdgeStyle?: boolean;
  /**
   * If this is `true`, no label is visible for a given cell.
   * @default false
   */
  noLabel?: boolean;
  /**
   * The possible range is `0-100`.
   */
  opacity?: number;
  /**
   * Defines if the connection points on either end of the edge should be computed so that
   * the edge is vertical or horizontal if possible and if the point is not at a fixed location.
   * The computation of the connection points involves the {@link perimeter}.
   *
   * This is used in {@link AbstractGraph.isOrthogonal}, which is in charge of determining if the edge terminals should be orthogonal.
   *
   * If the {@link orthogonal} property is not explicitly set but the {@link edgeStyle} belongs to one of the "orthogonal" `EdgeStyle` connectors,
   * for example when using {@link EdgeStyle.SegmentConnector} or {@link EdgeStyle.EntityRelation}, the {@link AbstractGraph.isOrthogonal} method which also returns `true`.
   * @default undefined
   */
  orthogonal?: boolean | null;
  /**
   * Use this style to specify if loops should be routed using an orthogonal router. Currently,
   * this uses {@link EdgeStyle.OrthConnector} but will be replaced with a dedicated
   * orthogonal loop router in later releases.
   * @default false
   */
  orthogonalLoop?: boolean;
  /**
   * This value specifies how overlapping vertex labels are handled.
   * - A value of 'visible' will show the complete label.
   * - A value of 'hidden' will clip the label so that it does not overlap the vertex bounds.
   * - A value of 'fill' will use the vertex bounds.
   * - A value of 'width' will use the vertex width for the label.
   *
   * See {@link AbstractGraph.isLabelClipped}.
   *
   * Note that the vertical alignment is ignored for overflow filling and for horizontal
   * alignment.
   *
   * @default 'visible'
   */
  overflow?: OverflowValue;
  /**
   * This defines the perimeter around a particular shape.
   *
   * For {@link PerimeterFunction} types, some possible values are the builtin functions defined in the `Perimeter` namespace.
   *
   * Alternatively, use a string or a value from {@link PerimeterValue} to access perimeter styles registered in {@link PerimeterRegistry}.
   * If {@link GraphView.allowEval} is set to `true`, you can pass the {@link PerimeterFunction} implementation directly as a string.
   * Remember that enabling this switch carries a possible security risk
   *
   * **WARNING**: explicitly set the value to null or undefined means to not use any perimeter.
   * To use the perimeter defined in the default vertex, do not set this property.
   */
  perimeter?: PerimeterFunction | PerimeterValue | (string & {}) | null;
  /**
   * This is the distance between the connection point and the perimeter in pixels.
   * - When used in a vertex style, this applies to all incoming edges to floating ports
   * (edges that terminate on the perimeter of the vertex).
   * - When used in an edge style, this spacing applies to the source and target separately,
   * if they terminate in floating ports (on the perimeter of the vertex).
   */
  perimeterSpacing?: number;
  /**
   * Specifies if pointer events should be fired on transparent backgrounds.
   * This style is currently only supported by {@link RectangleShape}, {@link SwimlaneShape}
   * and {@link StencilShape}.
   *
   * This style is usually set to `false` in groups where the transparent part should allow any
   * underlying cells to be clickable.
   * @default true
   */
  pointerEvents?: boolean;
  /**
   * For vertices only. Defines the direction(s) in which edges are allowed to connect to cells.
   *
   * If not set, use the {@link sourcePortConstraint} or the {@link targetPortConstraint} property of the related edges.
   */
  portConstraint?: StylePortConstraint;
  /**
   * For vertices only. Defines if the directions of the port constraints are rotated with the vertex rotation.
   * - `false` makes the port constraints remain absolute, relative to the graph.
   * - `true` makes the constraints rotate with the vertex.
   *
   * @see portConstraint
   * @default false
   */
  portConstraintRotation?: boolean;
  /**
   * This specifies if a cell can be resized.
   *
   * Note that a cell is in fact resizable according to the value returned by {@link AbstractGraph.isCellResizable}.
   * @default true
   */
  resizable?: boolean;
  /**
   * This specifies if the height of a cell is resized if the parent is resized.
   * - If `true`, then the height will be resized even if the cell geometry is relative.
   * - If `false`, then the height will not be resized.
   * @default false
   */
  resizeHeight?: boolean;
  /**
   * This specifies if the width of a cell is resized if the parent is resized.
   * - If `true`, then the width will be resized even if the cell geometry is relative.
   * - If `false`, then the width will not be resized.
   * @default false
   */
  resizeWidth?: boolean;
  /**
   * This specifies if a cell can be rotated.
   *
   * Note that a cell is in fact rotatable according to the value returned by {@link AbstractGraph.isCellRotatable}.
   * @default true
   */
  rotatable?: boolean;
  /**
   * The possible range is 0-360.
   * @default 0
   */
  rotation?: number;
  /**
   * For edges, this determines whether the joins between edges segments are smoothed to a rounded finish.
   *
   * For vertices that have the rectangle shape, this determines whether the rectangle is rounded.
   *
   * See also {@link absoluteArcSize} and {@link arcSize} for the 'rounded' settings.
   *
   * @default false
   */
  rounded?: boolean;
  /**
   * This is the relative offset from the center used to connect the edges.
   *
   * The possible values are between -0.5 and 0.5.
   * @default 0
   */
  routingCenterX?: number;
  /**
   * This is the relative offset from the center used to connect the edges.
   *
   * The possible values are between -0.5 and 0.5.
   * @default 0
   */
  routingCenterY?: number;
  /**
   * The type of this value is float and the value represents the size of the horizontal
   * segment of the entity relation style.
   * @default {@link EntityRelationConnectorConfig.segment}
   */
  segment?: number;
  /**
   * The possible values are all HTML color names or HEX codes.
   * This style is only used for `swimlane` shapes.
   */
  separatorColor?: ColorValue;
  /**
   * Add a shadow when painting the shape.
   * @default false
   */
  shadow?: boolean;
  /**
   * The name of the shape to be used for the cell.
   *
   * The actual implementation of the shape is determined by the {@link CellRenderer.createShape} method:
   * - first, it looks for a shape in {@link StencilShapeRegistry},
   * - if not found, it looks for a shape in the {@link CellRenderer} registry.
   *
   * If no shape is specified, the default shape is used:
   * - for edges, this is {@link CellRenderer.defaultEdgeShape}
   * - for vertices, this is {@link CellRenderer.defaultVertexShape}
   *
   * The possible values are all names of the shapes registered with {@link CellRenderer.registerShape} and {@link StencilShapeRegistry.addStencil}.
   * This includes {@link ShapeValue} values and custom names that have been registered.
   */
  shape?: StyleShapeValue;
  /**
   * The size of the source jetty in {@link EdgeStyle.OrthConnector}.
   *
   * This value takes precedence over {@link jettySize}.
   * @default {@link jettySize}
   */
  sourceJettySize?: number | 'auto';
  /**
   * This is the distance between the source connection point of an edge and the perimeter
   * of the source vertex in pixels.
   *
   * This style only applies to edges.
   * @default 0
   */
  sourcePerimeterSpacing?: number;
  /**
   * Defines the ID of the cell that should be used to compute the perimeter point of
   * the source for an edge.
   *
   * This allows for graphically connecting to a cell while keeping the actual terminal of
   * the edge.
   */
  sourcePort?: string;
  /**
   * For edges only. Defines the direction(s) in which edges are allowed to connect to sources.
   *
   * Used as fallback if no {@link portConstraint} is defined on the source vertex of the edge.
   */
  sourcePortConstraint?: StylePortConstraint;
  /**
   * The value represents the spacing, in pixels, added to each side of a label in a vertex.
   *
   * This style only applies to vertices.
   * @default 0
   */
  spacing?: number;
  /**
   * The value represents the spacing, in pixels, added to the bottom side of a label in a
   * vertex. It is added to the {@link CellStateStyle.spacing} value.
   *
   * This style only applies to vertices.
   * @default 0
   */
  spacingBottom?: number;
  /**
   * The value represents the spacing, in pixels, added to the left side of a label in a
   * vertex. It is added to the {@link CellStateStyle.spacing} value.
   *
   * This style only applies to vertices.
   * @default 0
   */
  spacingLeft?: number;
  /**
   * The value represents the spacing, in pixels, added to the right side of a label in a
   * vertex. It is added to the {@link CellStateStyle.spacing} value.
   *
   * This style only applies to vertices.
   * @default 0
   */
  spacingRight?: number;
  /**
   * The value represents the spacing, in pixels, added to the top side of a label in a
   * vertex. It is added to the {@link CellStateStyle.spacing} value.
   *
   * This style only applies to vertices.
   * @default 0
   */
  spacingTop?: number;
  /**
   * This defines the style of the start arrow marker.
   *
   * Possible values are all names of registered arrow markers with {@link EdgeMarkerRegistry.add}.
   * This includes {@link ArrowValue} values and the names of any new shapes.
   *
   * See {@link endArrow}.
   */
  startArrow?: StyleArrowValue;
  /**
   * Use `false` to not fill or `true` to fill the start arrow marker.
   * See {@link endFill}.
   * @default true
   */
  startFill?: boolean;
  /**
   * Set the fill color of the start arrow marker if {@link startFill} is `true`.
   * If not set, use {@link startStrokeColor}.
   * @since 0.10.0
   */
  startFillColor?: ColorValue;
  /**
   * Set the stroke color of the start arrow marker.
   * If not set, use {@link strokeColor}.
   * @since 0.10.0
   */
  startStrokeColor?: ColorValue;
  /**
   * The value represents the size of the start marker, in pixels, or the size of the title region
   * of a `swimlane` depending on the shape it is used for.
   * See {@link endSize}.
   */
  startSize?: number;
  /**
   * The possible values are all HTML color names or HEX codes, as well as special keywords such as:
   * - `indicated` to use the color of a related cell or the indicator shape
   * - `inherit` to use the color of the direct parent cell
   * - `none` for no color
   * - `swimlane` to use the color of the parent swimlane if one exists in the parent hierarchy
   */
  strokeColor?: SpecialStyleColorValue;
  /**
   * The possible range is `0-100`.
   */
  strokeOpacity?: number;
  /**
   * The possible range is any non-negative value greater than or equal to 1.
   * The value defines the stroke width in pixels.
   *
   * Note: To hide a stroke, use `none` as value of `strokeColor`.
   */
  strokeWidth?: number;
  /**
   * The fill color of the `swimlane` background.
   * The possible values are all HTML color names or HEX codes.
   * @default no background
   */
  swimlaneFillColor?: ColorValue;
  /**
   * This style specifies whether the line between the title region of a `swimlane` should
   * be visible. Use `false` for hidden or `true` for visible.
   * @default true
   */
  swimlaneLine?: boolean;
  /**
   * The size of the target jetty in {@link EdgeStyle.OrthConnector}.
   *
   * This value takes precedence over {@link jettySize}.
   * @default {@link jettySize}
   */
  targetJettySize?: number | 'auto';
  /**
   * This is the distance between the target connection point of an edge and the perimeter
   * of the target vertex in pixels.
   *
   * This style only applies to edges.
   * @default 0
   */
  targetPerimeterSpacing?: number;
  /**
   * Defines the ID of the cell that should be used to compute the perimeter point of
   * the target for an edge.
   *
   * This allows for graphically connecting to a cell while keeping the actual terminal of
   * the edge.
   */
  targetPort?: string;
  /**
   * For edges only. Defines the direction(s) in which edges are allowed to connect to sources.
   *
   * Used as fallback if no {@link portConstraint} is defined on the target vertex of the edge.
   */
  targetPortConstraint?: StylePortConstraint;
  /**
   * @default {@link DEFAULT_TEXT_DIRECTION}
   */
  textDirection?: TextDirectionValue;
  /**
   * The possible range is `0-100`.
   */
  textOpacity?: number;
  /**
   * This value defines how the lines of the label are vertically aligned.
   * - `top` means that the topmost line of the label text is aligned with the top of the label bounds.
   * - `bottom` means that the bottom-most line of the label text is aligned with the bottom of the
   * label bounds.
   * - `middle` means that there is equal spacing between the topmost line of the text label and the top
   * of the label bounds and between the bottom-most line of the text label and the bottom of the
   * label bounds.
   *
   * Note that this value doesn't affect the positioning of the overall label bounds relative to
   * the vertex. To move the label bounds vertically, use {@link verticalLabelPosition}.
   *
   * @default 'middle'
   */
  verticalAlign?: VAlignValue;
  /**
   * The label alignment defines the position of the label relative to the cell.
   * - 'top' means that the entire label bounds are placed completely just on the top of the vertex.
   * - 'bottom' means that the label bounds are adjusted on the bottom of the vertex.
   * - 'middle' means that the label bounds are horizontally aligned with the bounds of the vertex.
   *
   * Note that this value doesn't affect the positioning of label within the label bounds.
   * To move the label vertically within the label bounds, use {@link verticalAlign}.
   * @default 'middle'
   */
  verticalLabelPosition?: VAlignValue;
  /**
   * This value specifies how white-space inside an HTML vertex label should be handled.
   * - A 'nowrap' value means that the text will never wrap to the next line until a line break
   * is encountered.
   * - A 'wrap' value means that the text will wrap if necessary.
   *
   * This style is only used for HTML labels.
   * @default 'nowrap'
   */
  whiteSpace?: WhiteSpaceValue;
};

/** @category Style */
export type NumericCellStateStyleKeys = NonNullable<
  {
    [k in keyof CellStateStyle]: CellStateStyle[k] extends number | undefined ? k : never;
  }[keyof CellStateStyle]
>;

/** @category Style */
export type ColorValue = string;
/**
 * Color values and special placeholders used to resolve colors (see {@link CellRenderer.resolveColor}) for style properties.
 * @category Style
 */
export type SpecialStyleColorValue =
  | 'indicated'
  | 'inherit'
  | 'none'
  | 'swimlane'
  | (string & {});

/** @category Style */
export type DirectionValue = 'north' | 'south' | 'east' | 'west';
/** @category Style */
export type TextDirectionValue =
  /** Use this value to use the default text direction of the operating system. */
  | ''
  /** Use this value to find the direction for a given text with {@link Text.getAutoDirection}. */
  | 'auto'
  /** Use this value for left to right text direction. */
  | 'ltr'
  /** Use this value for right to left text direction. */
  | 'rtl';
/** @category Style */
export type AlignValue = 'left' | 'center' | 'right';
/** @category Style */
export type VAlignValue = 'top' | 'middle' | 'bottom';
/** @category Style */
export type OverflowValue = 'fill' | 'width' | 'auto' | 'hidden' | 'scroll' | 'visible';
/** @category Style */
export type WhiteSpaceValue = 'normal' | 'wrap' | 'nowrap' | 'pre';
/**
 * Names used to register the edge markers provided out-of-the-box by maxGraph with {@link EdgeMarkerRegistry.add}.
 *
 * Can be used as a value for {@link CellStateStyle.startArrow} and {@link CellStateStyle.endArrow}.
 *
 * @category Style
 */
export type ArrowValue =
  | 'none'
  | 'classic'
  | 'classicThin'
  | 'block'
  | 'blockThin'
  | 'open'
  | 'openThin'
  | 'oval'
  | 'diamond'
  | 'diamondThin';

/**
 * {@link ArrowValue} with support for extensions.
 * @category Style
 */
export type StyleArrowValue = ArrowValue | (string & {});

/**
 * @category Style
 * @since 0.17.0
 */
export type StylePortConstraint = DirectionValue | DirectionValue[];

/**
 * Names used to register the shapes provided out-of-the-box by maxGraph with {@link CellRenderer.registerShape}.
 * They can be used as a value for {@link CellStateStyle.shape}.
 *
 * @category Style
 * @category Shape
 */
export type ShapeValue =
  /** Name under which {@link ActorShape} is registered by default. */
  | 'actor'
  /** Name under which {@link ArrowShape} is registered by default. */
  | 'arrow'
  /** Name under which {@link ArrowConnectorShape} is registered by default. */
  | 'arrowConnector'
  /** Name under which {@link CloudShape} is registered by default. */
  | 'cloud'
  /** Name under which {@link ConnectorShape} is registered by default. */
  | 'connector'
  /** Name under which {@link CylinderShape} is registered by default. */
  | 'cylinder'
  /** Name under which {@link DoubleEllipseShape} is registered by default. */
  | 'doubleEllipse'
  /** Name under which {@link EllipseShape} is registered by default. */
  | 'ellipse'
  /** Name under which {@link HexagonShape} is registered by default. */
  | 'hexagon'
  /** Name under which {@link ImageShape} is registered by default. */
  | 'image'
  /** Name under which {@link LabelShape} is registered by default. */
  | 'label'
  /** Name under which {@link LineShape} is registered by default. */
  | 'line'
  /** Name under which {@link RectangleShape} is registered by default. */
  | 'rectangle'
  /** Name under which {@link RhombusShape} is registered by default. */
  | 'rhombus'
  /** Name under which {@link SwimlaneShape} is registered by default. */
  | 'swimlane'
  /** Name under which {@link TriangleShape} is registered by default. */
  | 'triangle';

/**
 * {@link ShapeValue} with support for extensions.
 * @category Style
 * @category Shape
 */
export type StyleShapeValue = ShapeValue | (string & {});

export type CanvasState = {
  alpha: number;
  dashPattern: string;
  dashed: boolean;
  dx: number;
  dy: number;
  fillAlpha: number;
  fillColor: ColorValue;
  fixDash: boolean;
  fontBackgroundColor: ColorValue;
  fontBorderColor: ColorValue;
  fontColor: ColorValue;
  fontFamily: string;
  fontSize: number;
  /**
   * See {@link CellStateStyle.fontStyle}.
   */
  fontStyle: number;
  gradientAlpha: number;
  gradientColor: ColorValue;
  gradientDirection: DirectionValue;
  gradientFillAlpha: number;
  lineCap: string;
  lineJoin: string;
  miterLimit: number;
  rotation: number;
  rotationCx: number;
  rotationCy: number;
  scale: number;
  shadow: boolean;
  shadowAlpha: number;
  shadowColor: ColorValue;
  shadowDx: number;
  shadowDy: number;
  strokeAlpha: number;
  strokeColor: ColorValue;
  strokeWidth: number;
  transform: string | null;
};

export interface Gradient extends SVGLinearGradientElement {
  mxRefCount: number;
}

export type GradientMap = Record<string, Gradient>;

export type EdgeParametersValue = Record<string | number | symbol, any> | string;
export type EdgeParameters = {
  /**
   * Optional string that defines the id of the new edge. If not set, the id is auto-generated when creating the vertex.
   */
  id?: string;
  /**
   * The parent of the new edge. If not set, use the default parent.
   */
  parent?: Cell | null;
  /**
   * The {@link Cell} that defines the source of the edge.
   */
  source?: Cell | null;
  style?: CellStyle;
  /**
   * The {@link Cell} that defines the target of the edge.
   */
  target?: Cell | null;
  /**
   * Object to be used as the user object which is generally used to display the label of the vertex. The default implementation handles `string` object.
   */
  value?: EdgeParametersValue;
};

export type VertexParameters = {
  /**
   * Class reference to a class derived from {@link Geometry}.
   * This can be useful for defining custom constraints.
   * @default {@link Geometry}
   */
  geometryClass?: typeof Geometry;
  /**
   * It is mandatory to set this value or the {@link size} property.
   */
  height?: number;
  /**
   * Optional string that defines the id of the new vertex. If not set, the id is auto-generated when creating the vertex.
   */
  id?: string;
  /**
   * The parent of the new vertex. If not set, use the default parent.
   */
  parent?: Cell | null;
  /**
   * Fallback when the {@link x} or the {@link y} properties are not set.
   * Order of the elements: x, y
   *
   * **NOTE:** If the position of the vertex is not set at vertex creation (by setting the {@link x} or the {@link y} properties or this property), it is advised to use a {@link GraphLayout} or a {@link LayoutManager} to automatically compute the actual position.
   */
  position?: [number, number];
  /**
   * Specifies if the geometry is relative.
   * @default false
   */
  relative?: boolean;
  /**
   * Fallback when the {@link width} or the {@link height} properties are not set.
   * Order of the elements: width, height
   *
   * **NOTE:** If the size of the vertex is not set at vertex creation (by setting the {@link width} and the {@link height} properties or this property), it is advised to later set the size on the geometry of the vertex instance.
   * Otherwise, the vertex has no size and it is not displayed.
   */
  size?: [number, number];
  style?: CellStyle;
  /**
   * Object to be used as the user object which is generally used to display the label of the vertex. The default implementation handles `string` object.
   */
  value?: any;
  /**
   * It is mandatory to set this value or the {@link size} property.
   */
  width?: number;
  /**
   * It is mandatory to set this value or the {@link position} property.
   */
  x?: number;
  /**
   * It is mandatory to set this value or the {@link position} property.
   */
  y?: number;
};

/**
 * The ids of all built-in {@link GraphPlugin} provided by maxGraph.
 * @since 0.20.0
 * @category Plugin
 */
export type BuiltinPluginId =
  | 'CellEditorHandler'
  | 'ConnectionHandler'
  | 'fit'
  | 'PanningHandler'
  | 'PopupMenuHandler'
  | 'RubberBandHandler'
  | 'SelectionCellsHandler'
  | 'SelectionHandler'
  | 'TooltipHandler';

/**
 * The ids that can be used to define a {@link GraphPlugin}.
 * @since 0.20.0
 * @category Plugin
 */
export type PluginId = BuiltinPluginId | (string & Record<never, never>); // any other string value

/** @category Plugin */
export interface GraphPluginConstructor {
  pluginId: PluginId;
  new (graph: AbstractGraph): GraphPlugin;
}

/** @category Plugin */
export interface GraphPlugin {
  onDestroy: () => void;
}

// Events
/** @category Event */
export type Listener = {
  name: string;
  f: MouseEventListener | KeyboardEventListener;
};

/** @category Event */
export type ListenerTarget = {
  mxListenerList?: Listener[];
};

/** @category Event */
export type Listenable = (EventTarget | (Window & typeof globalThis)) & ListenerTarget;

/** @category Event */
export type MouseEventListener = (me: MouseEvent) => void;
/** @category Event */
export type KeyboardEventListener = (ke: KeyboardEvent) => void;

/** @category Event */
export type GestureEvent = Event &
  MouseEvent & {
    scale?: number;
    pointerId?: number;
  };

/** @category Event */
export type MouseListenerSet = {
  mouseDown: (sender: EventSource, me: InternalMouseEvent) => void;
  mouseMove: (sender: EventSource, me: InternalMouseEvent) => void;
  mouseUp: (sender: EventSource, me: InternalMouseEvent) => void;
};

/** @category Event */
export type EventCache = GestureEvent[];

export interface CellHandle {
  state: CellState;
  cursor: string;
  image: ImageBox | null;
  shape: Shape | null;
  active: boolean;
  setVisible: (v: boolean) => void;
  processEvent: (me: InternalMouseEvent) => void;
  positionChanged: () => void;
  execute: (me: InternalMouseEvent) => void;
  reset: () => void;
  redraw: () => void;
  destroy: () => void;
}

/** @category GUI */
export interface PopupMenuItem extends HTMLElement {
  table: HTMLElement;
  tbody: HTMLElement;
  div: HTMLElement;
  willAddSeparator: boolean;
  containsItems: boolean;
  activeRow: PopupMenuItem | null;
  eventReceiver: HTMLElement | null;
}

export type IdentityObject = {
  [IDENTITY_FIELD_NAME]?: string;
} & Record<string, any>;

export type IdentityFunction = {
  (): any;
  [IDENTITY_FIELD_NAME]?: string;
};

/**
 * Describes a perimeter for the given bounds.
 *
 * @param bounds the {@link Rectangle} that represents the absolute bounds of the vertex.
 * @param vertex the {@link CellState} that represents the vertex.
 * @param next the {@link Point} that represents the nearest neighbour point on the given edge.
 * @param orthogonal Boolean that specifies if the orthogonal projection onto the perimeter should be returned.
 *                   If this is `false`, then the intersection of the perimeter and the line between the next and the center point is returned.
 * @returns the resulting {@link Point} projected to the perimeter.
 *
 * @category Perimeter
 */
export type PerimeterFunction = (
  bounds: Rectangle,
  vertex: CellState,
  next: Point,
  orthogonal: boolean
) => Point | null;

/**
 * Names used to register the perimeter provided out-of-the-box by maxGraph with {@link PerimeterRegistry.add}.
 *
 * Can be used as a value for {@link CellStateStyle.perimeter}.
 *
 * @category Perimeter
 */
export type PerimeterValue =
  | 'ellipsePerimeter'
  | 'hexagonPerimeter'
  | 'rectanglePerimeter'
  | 'rhombusPerimeter'
  | 'trianglePerimeter';

/**
 * Computes the actual points of the edge.
 *
 * @param state {@link CellState} that represents the edge to be updated.
 * @param source {@link CellState} that represents the source terminal.
 * @param target {@link CellState} that represents the target terminal.
 * @param points List of relative control points.
 * @param result Array of {@link Point} that represent the actual points of the edge.
 *
 * @since 0.8.0
 * @category EdgeStyle
 */
export type EdgeStyleFunction = (
  state: CellState,
  source: CellState,
  target: CellState | null,
  points: Point[],
  result: Point[]
) => void;

/**
 * Names used to register the edge styles (a.k.a. connectors) provided out-of-the-box by maxGraph with {@link EdgeStyleRegistry.add}.
 *
 * Can be used as a value for {@link CellStateStyle.edgeStyle}.
 *
 * @since 0.14.0
 * @category EdgeStyle
 */
export type EdgeStyleValue =
  | 'elbowEdgeStyle'
  | 'entityRelationEdgeStyle'
  | 'loopEdgeStyle'
  | 'manhattanEdgeStyle'
  | 'orthogonalEdgeStyle'
  | 'segmentEdgeStyle'
  | 'sideToSideEdgeStyle'
  | 'topToBottomEdgeStyle';

/**
 * {@link EdgeStyleValue} with support for extensions and {@link EdgeStyleFunction}.
 * @since 0.14.0
 * @category EdgeStyle
 */
export type StyleEdgeStyleValue =
  | EdgeStyleFunction
  | EdgeStyleValue
  | (string & {})
  | null;

/**
 * @since 0.11.0
 * @category Style
 */
export type MarkerFactoryFunction = (
  canvas: AbstractCanvas2D,
  shape: Shape,
  type: StyleArrowValue,
  pe: Point,
  unitX: number,
  unitY: number,
  size: number,
  source: boolean,
  sw: number,
  filled: boolean
) => MarkerFunction;

/**
 * @since 0.19.0
 * @category Style
 */
export type MarkerFunction = () => void;

/**
 * @experimental subject to change or removal. The logging system may be modified in the future without prior notice.
 * @since 0.11.0
 * @category Logging
 */
export interface Logger {
  /**
   * Log the specified string at TRACE level and returns the current time in milliseconds.
   *
   * @return may return `undefined` hen the TRACE level is not enabled.
   */
  enter(message: string): number | undefined;

  /**
   * Log the specified string at TRACE level and also log the difference between the current
   * time and t0 in milliseconds.
   *
   * @see {@link enter} for an example.
   */
  leave(message: string, baseTimestamp?: number): void;

  /**
   * Shows the console in the UI. This may produce no effect in some implementation which doesn't rely on the UI to log.
   */
  show(): void;

  trace(message: string): void;

  debug(message: string): void;

  info(message: string): void;

  warn(message: string): void;

  error(message: string, ...optionalParams: any[]): void;
}

/**
 * The abstract interface for the I18n system. The actual implementation is configured in {@link GlobalConfig.i18n}.
 *
 * @experimental subject to change or removal. The I18n system may be modified in the future without prior notice.
 * @since 0.17.0
 * @category I18n
 */
export interface I18nProvider {
  /**
   * Returns whether internationalization is enabled.
   */
  isEnabled(): boolean;

  /**
   * Returns the value for the specified resource key.
   *
   * @param key String that represents the key of the resource to be returned.
   * @param params Array of the values for the placeholders to be replaced with in the resulting string. The form of the placeholder is specific to each implementation.
   * @param defaultValue Optional string that specifies the default return value.   */
  get(
    key?: string | null,
    params?: any[] | null,
    defaultValue?: string | null
  ): string | null;

  /**
   * Load the translation file for the given basename and language.
   *
   * This is mainly used by the maxGraph built-in provider to bind to {@link Translations.add}.
   *
   * @param basename The basename for which the file should be loaded.
   * @param language The language for which the file should be loaded. Default is `null`.
   * @param callback Optional callback for asynchronous loading. Default is `null`.
   */
  addResource(
    basename?: string | null,
    language?: string | null,
    callback?: (() => void) | null
  ): void;
}

/**
 * @category Graph
 */
export type GraphFoldingOptions = {
  /**
   * Specifies if folding (collapse and expand via an image icon in the graph should be enabled).
   * @default true
   */
  foldingEnabled: boolean;
  /**
   * Specifies the {@link ImageBox} to indicate a collapsed state.
   * @default `Client.imageBasePath + '/collapsed.gif'`
   */
  collapsedImage: ImageBox;
  /**
   * Specifies the {@link ImageBox} to indicate a expanded state.
   * @default `Client.imageBasePath + '/expanded.gif'`
   */
  expandedImage: ImageBox;
  /**
   * Specifies if the cell size should be changed to the preferred size when a cell is first collapsed.
   * @default true
   */
  collapseToPreferredSize: boolean;
};

/**
 * @since 0.18.0
 * @category Shape
 */
export type ShapeConstructor = new (...arguments_: any) => Shape;

/**
 * Options passed to the {@link AbstractGraph} constructor.
 *
 * @since 0.18.0
 * @category Graph
 */
export type GraphOptions = {
  container?: HTMLElement;
  plugins?: GraphPluginConstructor[];
} & GraphCollaboratorsOptions;

/**
 * Collaborators injected in the {@link AbstractGraph} when it is instantiated.
 *
 * @since 0.18.0
 * @category Graph
 */
export type GraphCollaboratorsOptions = {
  cellRenderer?: CellRenderer;
  model?: GraphDataModel;
  selectionModel?: (graph: AbstractGraph) => GraphSelectionModel;
  stylesheet?: Stylesheet;
  view?: (graph: AbstractGraph) => GraphView;
};

/**
 * @since 0.20.0
 */
export type DialectValue =
  /** The mixed HTML display dialect name. */
  | 'mixedHtml'
  /** The preferred HTML display dialect name. */
  | 'preferHtml'
  /** The strict HTML display dialect name. */
  | 'strictHtml'
  /** The SVG display dialect name. */
  | 'svg';

/**
 * @since 0.20.0
 * @category Style
 */
export type ElbowValue = 'horizontal' | 'vertical';

/**
 * The base definition of all registries storing "style" configuration.
 * @category Style
 * @category Configuration
 * @since 0.20.0
 */
export interface Registry<V> {
  add(name: string, value: V): void;

  get(name: string | null | undefined): V | null;

  getName(value: V | null): string | null;

  /**
   * **WARNING**: this method should not be called directly. Call the related global unregister function instead.
   * @private
   */
  clear(): void;
}

/**
 * Allowed values for {@link EdgeStyleMetaData.handlerKind}.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export type EdgeStyleHandlerKind =
  | 'default'
  | 'elbow'
  | 'segment'
  | (string & Record<never, never>); // any other string value

/**
 * Metadata used to configure the edge style when adding it to {@link EdgeStyleRegistry}.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export type EdgeStyleMetaData = {
  /**
   * The kind of {@link EdgeHandler} to use for this edge style.
   * This value is used to select the implementation of the edge handler to use to manage the underlying edge.
   * @default 'default'
   */
  handlerKind?: EdgeStyleHandlerKind;
  /**
   * Defines if the edge style is considered as orthogonal or not.
   * @default false */
  isOrthogonal?: boolean;
};

/**
 * The definition of a registry that stores the {@link EdgeStyleFunction}s and their configuration.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export interface EdgeStyleRegistryInterface extends Registry<EdgeStyleFunction> {
  add(name: string, edgeStyle: EdgeStyleFunction, metaData?: EdgeStyleMetaData): void;

  /**
   * Retrieves the orthogonal state of the specified `edgeStyle` as it was registered.
   *
   * If the `edgeStyle` is not registered or the orthogonal state was not set during registration, this method returns `false`.
   */
  isOrthogonal(edgeStyle?: EdgeStyleFunction | null): boolean;

  /**
   * Retrieves the handler kind of the specified `edgeStyle` as it was registered.
   *
   * If the `edgeStyle` is not registered or the `handlerKind` was not set during registration, this method returns  `'default'`.
   */
  getHandlerKind(edgeStyle?: EdgeStyleFunction | null): EdgeStyleHandlerKind;
}

/**
 * The definition of a registry that stores the {@link MarkerFactoryFunction}s and their configuration.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export interface EdgeMarkerRegistryInterface extends Registry<MarkerFactoryFunction> {
  /**
   * Returns a {@link MarkerFunction} to paint the given marker.
   *
   * The type parameter is used to retrieve the correct {@link MarkerFactoryFunction} from the registry which is then used to create the {@link MarkerFunction}.
   *
   * If none is found, `null` is returned.
   */
  createMarker(
    canvas: AbstractCanvas2D,
    shape: Shape,
    type: StyleArrowValue,
    pe: Point,
    unitX: number,
    unitY: number,
    size: number,
    source: boolean,
    sw: number,
    filled: boolean
  ): MarkerFunction | null;
}

// TODO rename to EventListener?
export type EventListenerFunction = (
  sender: EventTarget, // TODO why not EventSource? Listenable? or both objects?
  eventObject: EventObject
) => void;

// TODO rename to EditorAction?
export type EditorActionFunction = (
  editor: Editor,
  cell: Cell | null,
  evt?: Event | null
) => void;
