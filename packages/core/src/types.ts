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

import { DIRECTION, IDENTITY_FIELD_NAME } from './util/Constants';
import type Cell from './view/cell/Cell';
import type CellState from './view/cell/CellState';
import EventSource from './view/event/EventSource';
import type InternalMouseEvent from './view/event/InternalMouseEvent';
import type Shape from './view/geometry/Shape';
import type { Graph } from './view/Graph';
import type ImageBox from './view/image/ImageBox';

export type CellMap = {
  [id: string]: Cell;
};

export type FilterFunction = (cell: Cell) => boolean;

export type UndoableChange = {
  execute: () => void;
  undo?: () => void;
  redo?: () => void;
};

export type StyleValue = string | number;

export type Properties = {
  [k: string]: any;
};

export type CellStyle = CellStateStyle & { baseStyleNames?: string[] };

export type CellStateStyle = {
  /**
   * This specifies if {@link arcSize} for rectangles is absolute or relative. Possible values are 1 and 0 (default).
   * @default 0
   */
  absoluteArcSize?: number;
  /**
   * This value defines how the lines of the label are horizontally aligned.
   * - `left` mean label text lines are aligned to left of the label bounds
   * - `right` to the right of the label bounds
   * - `center` means the center of the text lines are aligned in the center of the label bounds.
   *
   * Note this value does not affect the positioning of the overall label bounds relative
   * to the vertex. To move the label bounds horizontally, use {@link labelPosition}.
   * @default 'center'
   */
  align?: AlignValue;
  /**
   *  The defines if the direction style should be taken into account when computing the fixed point location for connected edges.
   *  See also {@link direction}.
   *
   *  Set this to `false` to ignore the direction style for fixed connection points.
   *  @default true
   */
  anchorPointDirection?: boolean;
  /**
   * Defines the rounding factor for a {@link rounded} vertex in percent (without the percent sign).
   * Possible values are between 0 and 100. If this value is not specified then `constants.RECTANGLE_ROUNDING_FACTOR * 100`
   * is used.
   *
   * Shapes supporting `arcSize`:
   * - Rectangle
   * - Rhombus
   * - Swimlane
   * - Triangle
   *
   * For edges, this defines the absolute size of {@link rounded} corners in pixels.
   * If this values is not specified then {@link LINE_ARCSIZE} is used.
   *
   * See also {@link absoluteArcSize}.
   */
  arcSize?: number;
  /**
   * Possible values are empty or fixed.
   * If `fixed` is used then the aspect ratio of the cell will be maintained when resizing.
   * @default 'empty'
   */
  aspect?: string;
  /**
   * This specifies if a cell should be resized automatically if the value has changed.
   * See {@link Graph.isAutoSizeCell}. This is normally combined with {@link resizable} to disable manual sizing.
   * @default false
   */
  autosize?: boolean;
  backgroundColor?: ColorValue;
  /**
   * This specifies if only the background of a cell should be painted when it is highlighted.
   * Possible values are 0 (false) or 1 (true).
   * @default 0
   */
  backgroundOutline?: number;
  /**
   * This specifies if the control points of an edge can be moved.
   * See {@link Graph.isCellBendable}.
   * @default true
   */
  bendable?: boolean;
  /**
   * This specifies if a cell can be cloned.
   * See {@link Graph.isCellCloneable}.
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
   * The type of this value is a space separated list of numbers that specify a custom-defined dash pattern. Only relevant if {@link dashed} is `true`.
   *
   * Dash styles are defined in terms of the length of the dash (the drawn part of the stroke) and the length of the space between the dashes.
   *
   * The lengths are relative to the line width: a length of `1` is equal to the line width.
   *
   * See also {@link dashed} and {@link fixDash}.
   */
  dashPattern?: string;
  defaultEdge?: CellStateStyle;
  defaultVertex?: CellStateStyle;
  /**
   * This specifies if a cell can be deleted. See {@link Graph.isCellDeletable}.
   * @default true
   */
  deletable?: boolean;
  /**
   * The direction style is used to specify the direction of certain shapes (eg. Swimlane).
   * @default 'east'
   */
  direction?: DirectionValue;
  /**
   * Possible values for style provided out-of-the box by maxGraph are defined in {@link EDGESTYLE}.
   *
   * See {@link noEdgeStyle}.
   */
  edgeStyle?: string;
  /**
   * This specifies if the value of a cell can be edited using the in-place editor.
   * See {@link Graph.isCellEditable}.
   * @default true
   */
  editable?: boolean;
  /**
   * This defines how the three segment orthogonal edge style leaves its terminal vertices.
   * The 'vertical' style leaves the terminal vertices at the top and bottom sides.
   *
   * Possible values are 'horizontal' and 'vertical'.
   * @default 'horizontal'
   */
  elbow?: string;
  /**
   * This defines the style of the end arrow marker.
   * See {@link startArrow}.
   */
  endArrow?: ArrowType;
  /**
   * Use `false` for no fill or `true` for fill.
   * See {@link startFill}.
   * @default true
   */
  endFill?: boolean;
  /**
   * The value represents the size of the end marker in pixels.
   * See {@link startSize}.
   */
  endSize?: number;
  /**
   * The horizontal offset of the connection point of an edge with its source terminal.
   */
  entryDx?: number;
  /**
   * The vertical offset of the connection point of an edge with its source terminal.
   */
  entryDy?: number;
  /**
   * Defines if the perimeter should be used to find the exact entry point along the perimeter
   * of the source.
   * @default true
   */
  entryPerimeter?: boolean;
  /**
   * The horizontal relative coordinate connection point of an edge with its target terminal.
   */
  entryX?: number;
  /**
   * The vertical relative coordinate connection point of an edge with its target terminal.
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
   * Possible values are all HTML color names or HEX codes, as well as special keywords such
   * as `swimlane`, `inherit`, `indicated` to use the color code of a related cell or the
   * indicator shape.
   */
  fillColor?: ColorValue;
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
   * See {@link Graph.isCellFoldable}.
   * @default true
   */
  foldable?: boolean;
  /**
   * Possible values are all HTML color names or HEX codes.
   */
  fontColor?: ColorValue;
  /**
   * Possible values are names such as `Arial; Dialog; Verdana; Times New Roman`.
   */
  fontFamily?: string;
  /**
   * The fontSize style (in px).
   */
  fontSize?: number;
  /**
   * Values may be any logical AND (sum) of the {@link FONT}. For instance, FONT.BOLD,
   * FONT.ITALIC, ...
   */
  fontStyle?: number;
  /**
   * Enable the glass gradient effect
   * @default false
   */
  glass?: boolean;
  /**
   * Possible values are all HTML color names or HEX codes.
   */
  gradientColor?: ColorValue;
  /**
   * Generally, and by default in maxGraph, gradient painting is done from the value of {@link fillColor} to the value of {@link gradientColor}.
   * Taking the example of 'north', this means {@link fillColor} color at the bottom of paint pattern
   * and {@link gradientColor} at top, with a gradient in-between.
   * @default 'south'
   */
  gradientDirection?: DirectionValue;
  /**
   * This value only applies to vertices.
   * If the {@link shape} is `swimlane`, a value of `false` indicates that the swimlane should
   * be drawn vertically, `true` indicates to draw it horizontally.
   * If the shape style does not indicate that this vertex is a 'swimlane', this value affects
   * only whether the label is drawn horizontally or vertically.
   * @default true
   */
  horizontal?: boolean;
  /**
   * Possible values are any image URL.
   *
   * This is the path to the image that is to be displayed within the label of a vertex.
   * Data URLs should use the following format: `data:image/png,xyz` where xyz is the base64
   * encoded data (without the "base64"-prefix).
   */
  image?: string;
  /**
   * The value defines how any image in the vertex label is aligned horizontally within the
   * label bounds of a {@link LabelShape}.
   * @default 'left'
   */
  imageAlign?: AlignValue;
  /**
   * Possible values are
   * - `false`: do not preserve aspect
   * - `true`: keep aspect
   *
   * This is only used in `ImageShape`.
   * @default true
   */
  imageAspect?: boolean;
  /**
   * Possible values are all HTML color names or HEX codes.
   *
   * This is only used in `ImageShape`.
   * @default 'none'
   */
  imageBackground?: ColorValue;
  /**
   * Possible values are all HTML color names or HEX codes.
   *
   * This is only used in `ImageShape`.
   * @default 'none'
   */
  imageBorder?: ColorValue;
  /**
   * The value is the image height in pixels and must be greater than `0`.
   * @default constants.DEFAULT_IMAGESIZE
   */
  imageHeight?: number;
  /**
   * The value is the image width in pixels and must be greater than `0`.
   * @default constants.DEFAULT_IMAGESIZE
   */
  imageWidth?: number;
  /**
   * Possible values are all HTML color names or HEX codes, as well as the special `swimlane` keyword
   * to refer to the color of the parent `swimlane` if one exists.
   */
  indicatorColor?: ColorValue;
  /**
   * The direction style is used to specify the direction of certain shapes (eg. {@link TriangleShape}).
   * @default 'east'
   */
  indicatorDirection?: DirectionValue;
  /**
   * Possible values start at 0 (in pixels).
   */
  indicatorHeight?: number;
  /**
   * Indicator image used within a {@link LabelShape}. Possible values are all image URLs.
   *
   * The {@link indicatorShape} has precedence over the indicatorImage.
   */
  indicatorImage?: string;
  /**
   * The indicator shape used within an {@link LabelShape}.
   * Possible values are all names of registered Shapes with {@link CellRenderer.registerShape}.
   * This generally includes {@link ShapeValue} values and the names of any new shapes.
   *
   * The `indicatorShape` property has precedence over the {@link indicatorImage} property.
   */
  indicatorShape?: string;
  /**
   * The indicator stroke color in {@link LabelShape}.
   * Possible values are all HTML color names or HEX codes.
   */
  indicatorStrokeColor?: ColorValue;
  /**
   * Possible values start at 0 (in pixels).
   */
  indicatorWidth?: number;
  /**
   * The jetty size in {@link EdgeStyle.OrthConnector}.
   * @default 10
   */
  jettySize?: number | 'auto';
  /**
   * Possible values are all HTML color names or HEX codes.
   */
  labelBackgroundColor?: ColorValue;
  /**
   * Possible values are all HTML color names or HEX codes.
   */
  labelBorderColor?: ColorValue;
  /**
   * The label padding, i.e. the space between the label border and the label.
   */
  labelPadding?: number;
  /**
   * The label align defines the position of the label relative to the cell.
   * - `left` means the entire label bounds is placed completely just to the left of the vertex
   * - `right` means adjust to the right
   * - `center` means the label bounds are vertically aligned with the bounds of the vertex
   *
   * Note this value does not affect the positioning of label within the label bounds.
   * To move the label bounds horizontally within the label bounds, use {@link align}
   * @default 'center'
   */
  labelPosition?: AlignValue;
  /**
   * The width of the label if the label position is not `center`.
   */
  labelWidth?: number;
  /**
   * Possible values are the functions defined in {@link EdgeStyle}.
   */
  loop?: Function;
  loopStyle?: Function;
  /**
   * The margin between the ellipses in {@link DoubleEllipseShape}.
   *
   * Possible values are all positive numbers.
   */
  margin?: number;
  /**
   * This specifies if a cell can be moved.
   *
   * See {@link Graph.isCellMovable}.
   * @default true
   */
  movable?: boolean;
  /**
   *  If this is `true` then no edge style is applied for a given edge. See {@link edgeStyle}.
   *  @default false
   */
  noEdgeStyle?: boolean;
  /**
   * If this is `true` then no label is visible for a given cell.
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
   *
   * Default is false.
   * This is used in {@link Graph.isOrthogonal}, which also returns `true` if the {@link edgeStyle}
   * of the edge is an `elbow` or `entity`.
   * @default false
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
   * - A value of 'fill' will use the vertex bounds
   * - A value of 'width' will use the vertex width for the label.
   *
   * See {@link Graph.isLabelClipped}.
   *
   * Note that the vertical alignment is ignored for overflow fill and for horizontal
   * alignment, left should be used to avoid pixel offsets in Internet Explorer
   * 11 and earlier or if foreignObjects are disabled.
   *
   * @default 'visible'
   */
  overflow?: OverflowValue;
  /**
   * This defines the perimeter around a particular shape.
   *
   * For `Function` types, possible values are the functions defined in {@link Perimeter}.
   *
   * Alternatively, use a string or a value of {@link PERIMETER} to access perimeter styles
   * registered in {@link StyleRegistry}.
   */
  perimeter?: Function | string | null;
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
   * This style is currently only supported in {@link RectangleShape}, {@link SwimlaneShape}
   * and {@link StencilShape}.
   *
   * This is typically set to `false` in groups where the transparent part should allow any
   * underlying cells to be clickable.
   * @default true
   */
  pointerEvents?: boolean;
  /**
   * Defines the direction(s) that edges are allowed to connect to cells in.
   */
  portConstraint?: DIRECTION;
  /**
   * Define whether port constraint directions are rotated with vertex rotation.
   * - `false` causes port constraints to remain absolute, relative to the graph
   * - `true` causes the constraints to rotate with the vertex.
   * @default false
   */
  portConstraintRotation?: DIRECTION;
  /**
   * This specifies if a cell can be resized.
   *
   * See {@link Graph.isCellResizable}.
   * @default true
   */
  resizable?: boolean;
  /**
   * This specifies if a cell's height resize if the parent is resized.
   * - If `true`, then the height will be resized even if the cell's geometry is relative.
   * - If `false`, then the cell's height will not be resized.
   * @default false
   */
  resizeHeight?: boolean;
  /**
   * This specifies if a cell's width resize if the parent is resized.
   * - If `true`, then the width will be resized even if the cell's geometry is relative.
   * - If `false`, then the cell's width will not be resized.
   * @default false
   */
  resizeWidth?: boolean;
  /**
   * This specifies if a cell can be rotated.
   * @default true
   */
  rotatable?: boolean;
  /**
   * The possible range is 0-360.
   * @default 0
   */
  rotation?: number;
  /**
   * For edges this determines whether joins between edges segments are smoothed to a rounded finish.
   *
   * For vertices that have the rectangle shape, this determines whether the rectangle is rounded.
   *
   * See also {@link absoluteArcSize} and {@link arcSize} for the 'rounded' settings.
   *
   * @default false
   */
  rounded?: boolean;
  /**
   * This is the relative offset from the center used for connecting edges.
   *
   * Possible values are between -0.5 and 0.5.
   * @default 0
   */
  routingCenterX?: number;
  /**
   * This is the relative offset from the center used for connecting edges.
   *
   * Possible values are between -0.5 and 0.5.
   * @default 0
   */
  routingCenterY?: number;
  /**
   * The type of this value is float and the value represents the size of the horizontal
   * segment of the entity relation style.
   * @default constants.ENTITY_SEGMENT
   */
  segment?: number;
  /**
   * Possible values are all HTML color names or HEX codes. This style is only used for
   * `swimlane` shapes.
   */
  separatorColor?: ColorValue;
  /**
   * Add a shadow when painting the shape.
   * @default false
   */
  shadow?: boolean;
  /**
   * Possible values are all names of registered Shapes with {@link CellRenderer.registerShape}.
   * This generally includes {@link ShapeValue} values and the names of any new shapes.
   */
  shape?: ShapeValue;
  /**
   * The source jetty size in {@link EdgeStyle.OrthConnector}.
   *
   * This has precedence over {@link jettySize}.
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
   * Defines the ID of the cell that should be used for computing the perimeter point of
   * the source for an edge.
   *
   * This allows for graphically connecting to a cell while keeping the actual terminal of
   * the edge.
   */
  sourcePort?: string;
  /**
   * Defines the direction(s) that edges are allowed to connect to sources in.
   */
  sourcePortConstraint?: DIRECTION;
  /**
   * The value represents the spacing, in pixels, added to each side of a label in a vertex.
   *
   * This style applies to vertices only.
   * @default 0
   */
  spacing?: number;
  /**
   * The value represents the spacing, in pixels, added to the bottom side of a label in a
   * vertex. It is added to the {@link CellStateStyle.spacing} value.
   *
   * This style applies to vertices only.
   * @default 0
   */
  spacingBottom?: number;
  /**
   * The value represents the spacing, in pixels, added to the left side of a label in a
   * vertex. It is added to the {@link CellStateStyle.spacing} value.
   *
   * This style applies to vertices only.
   * @default 0
   */
  spacingLeft?: number;
  /**
   * The value represents the spacing, in pixels, added to the right side of a label in a
   * vertex. It is added to the {@link CellStateStyle.spacing} value.
   *
   * This style applies to vertices only.
   * @default 0
   */
  spacingRight?: number;
  /**
   * The value represents the spacing, in pixels, added to the top side of a label in a
   * vertex. It is added to the {@link CellStateStyle.spacing} value.
   *
   * This style applies to vertices only.
   * @default 0
   */
  spacingTop?: number;
  /**
   * This defines the style of the start arrow marker.
   * See {@link endArrow}.
   */
  startArrow?: ArrowType;
  /**
   * Use `false` for no fill or `true` for fill.
   * See {@link endFill}.
   * @default true
   */
  startFill?: boolean;
  /**
   * The value represents the size of the start marker in pixels or the size of the swimlane
   * title region depending on the shape it is used for.
   * See {@link endSize}.
   */
  startSize?: number;
  /**
   * Possible values are all HTML color names or HEX codes, as well as special keywords such
   * as `swimlane`, `inherit`, `indicated` to use the color code of a related cell or the
   * indicator shape or `none` for no color.
   */
  strokeColor?: ColorValue;
  /**
   * The possible range is `0-100`.
   */
  strokeOpacity?: number;
  /**
   * The possible range is any non-negative value larger or equal to 1.
   * The value defines the stroke width in pixels.
   *
   * Note: To hide a stroke use strokeColor `none`.
   */
  strokeWidth?: number;
  /**
   * The fill color of the `swimlane` background.
   * Possible values are all HTML color names or HEX codes.
   * @default no backgroune
   */
  swimlaneFillColor?: ColorValue;
  /**
   * This style specifies whether the line between the title region of a `swimlane` should
   * be visible. Use `false` for hidden or `true` for visible.
   * @default true
   */
  swimlaneLine?: boolean;
  /**
   * The target jetty size in {@link EdgeStyle.OrthConnector}.
   *
   * This has precedence over {@link jettySize}.
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
   * Defines the ID of the cell that should be used for computing the perimeter point of
   * the target for an edge.
   *
   * This allows for graphically connecting to a cell while keeping the actual terminal of
   * the edge.
   */
  targetPort?: string;
  /**
   * Defines the direction(s) that edges are allowed to connect to sources in.
   */
  targetPortConstraint?: DIRECTION;
  /**
   * @default constants.DEFAULT_TEXT_DIRECTION
   */
  textDirection?: TextDirectionValue;
  /**
   * The possible range is `0-100`.
   */
  textOpacity?: number;
  /**
   * This value defines how the lines of the label are vertically aligned.
   * - `top` means the topmost label text line is aligned against the top of the label bounds
   * - `bottom` means the bottom-most label text line is aligned against the bottom of the
   * label bounds
   * - `middle` means there is equal spacing between the topmost text label line and the top
   * of the label bounds and between the bottom-most text label line and the bottom of the
   * label bounds.
   *
   * Note this value doesn't affect the positioning of the overall label bounds relative to
   * the vertex. To move the label bounds vertically, use {@link verticalLabelPosition}.
   *
   * @default 'middle'
   */
  verticalAlign?: VAlignValue;
  /**
   * The label align defines the position of the label relative to the cell.
   * - 'top' means the entire label bounds is placed completely just on the top of the vertex
   * - 'bottom' means adjust on the bottom
   * - 'middle' means the label bounds are horizontally aligned with the bounds of the vertex
   *
   * Note this value doesn't affect the positioning of label within the label bounds.
   * To move the label vertically within the label bounds, use {@link verticalAlign}.
   * @default 'middle'
   */
  verticalLabelPosition?: VAlignValue;
  /**
   * This value specifies how white-space inside an HTML vertex label should be handled.
   * - A value of 'nowrap' means the text will never wrap to the next line until a linefeed
   * is encountered.
   * - A value of 'wrap' means text will wrap when necessary.
   *
   * This style is only used for HTML labels.
   * @default 'nowrap'
   */
  whiteSpace?: WhiteSpaceValue;
};

export type NumericCellStateStyleKeys = NonNullable<
  {
    [k in keyof CellStateStyle]: CellStateStyle[k] extends number | undefined ? k : never;
  }[keyof CellStateStyle]
>;

export type ColorValue = string;
export type DirectionValue = 'north' | 'south' | 'east' | 'west';
export type TextDirectionValue = '' | 'ltr' | 'rtl' | 'auto';
export type AlignValue = 'left' | 'center' | 'right';
export type VAlignValue = 'top' | 'middle' | 'bottom';
export type OverflowValue = 'fill' | 'width' | 'auto' | 'hidden' | 'scroll' | 'visible';
export type WhiteSpaceValue = 'normal' | 'wrap' | 'nowrap' | 'pre';
export type ArrowType =
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
export type ShapeValue =
  | 'rectangle'
  | 'ellipse'
  | 'doubleEllipse'
  | 'rhombus'
  | 'line'
  | 'image'
  | 'arrow'
  | 'arrowConnector'
  | 'label'
  | 'cylinder'
  | 'swimlane'
  | 'connector'
  | 'actor'
  | 'cloud'
  | 'triangle'
  | 'hexagon';

export type CanvasState = {
  dx: number;
  dy: number;
  scale: number;
  alpha: number;
  fillAlpha: number;
  strokeAlpha: number;
  fillColor: ColorValue;
  gradientFillAlpha: number;
  gradientColor: ColorValue;
  gradientAlpha: number;
  gradientDirection: DirectionValue;
  strokeColor: ColorValue;
  strokeWidth: number;
  dashed: boolean;
  dashPattern: string;
  fixDash: boolean;
  lineCap: string;
  lineJoin: string;
  miterLimit: number;
  fontColor: ColorValue;
  fontBackgroundColor: ColorValue;
  fontBorderColor: ColorValue;
  fontSize: number;
  fontFamily: string;
  fontStyle: number;
  shadow: boolean;
  shadowColor: ColorValue;
  shadowAlpha: number;
  shadowDx: number;
  shadowDy: number;
  rotation: number;
  rotationCx: number;
  rotationCy: number;
  transform: string | null;
};

export interface Gradient extends SVGLinearGradientElement {
  mxRefCount: number;
}

export type GradientMap = {
  [k: string]: Gradient;
};

export interface GraphPluginConstructor {
  new (graph: Graph): GraphPlugin;
  pluginId: string;
}

export interface GraphPlugin {
  onDestroy: () => void;
}

// Events

export type Listener = {
  name: string;
  f: MouseEventListener | KeyboardEventListener;
};

export type ListenerTarget = {
  mxListenerList?: Listener[];
};

export type Listenable = (EventTarget | (Window & typeof globalThis)) & ListenerTarget;

export type MouseEventListener = (me: MouseEvent) => void;
export type KeyboardEventListener = (ke: KeyboardEvent) => void;

export type GestureEvent = Event &
  MouseEvent & {
    scale?: number;
    pointerId?: number;
  };

export type MouseListenerSet = {
  mouseDown: (sender: EventSource, me: InternalMouseEvent) => void;
  mouseMove: (sender: EventSource, me: InternalMouseEvent) => void;
  mouseUp: (sender: EventSource, me: InternalMouseEvent) => void;
};

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
  [k: string]: any;
};

export type IdentityFunction = {
  (): any;
  [IDENTITY_FIELD_NAME]?: string;
};
