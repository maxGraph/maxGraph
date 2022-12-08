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
  absoluteArcSize?: number;
  align?: AlignValue;
  anchorPointDirection?: boolean;
  arcSize?: number;
  aspect?: string;
  autosize?: boolean;
  backgroundColor?: ColorValue;
  backgroundOutline?: number;
  bendable?: boolean;
  cloneable?: boolean;
  curved?: boolean;
  dashed?: boolean;
  dashPattern?: string;
  defaultEdge?: CellStateStyle;
  defaultVertex?: CellStateStyle;
  deletable?: boolean;
  direction?: DirectionValue;
  edgeStyle?: string;
  editable?: boolean;
  elbow?: string;
  endArrow?: ArrowType;
  endFill?: boolean;
  endSize?: number;
  entryDx?: number;
  entryDy?: number;
  entryPerimeter?: boolean;
  entryX?: number;
  entryY?: number;
  exitDx?: number;
  exitDy?: number;
  exitPerimeter?: boolean;
  exitX?: number;
  exitY?: number;
  fillColor?: ColorValue;
  fillOpacity?: number;
  fixDash?: boolean;
  flipH?: boolean;
  flipV?: boolean;
  foldable?: boolean;
  fontColor?: ColorValue;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: number;
  glass?: boolean;
  gradientColor?: ColorValue;
  gradientDirection?: DirectionValue;
  horizontal?: boolean;
  image?: string;
  imageAlign?: AlignValue;
  imageAspect?: boolean;
  imageBackground?: ColorValue;
  imageBorder?: ColorValue;
  imageHeight?: number;
  imageWidth?: number;
  indicatorColor?: ColorValue;
  indicatorDirection?: DirectionValue;
  indicatorHeight?: number;
  indicatorImage?: string;
  indicatorShape?: string;
  indicatorStrokeColor?: ColorValue;
  indicatorWidth?: number;
  jettySize?: number | 'auto';
  labelBackgroundColor?: ColorValue;
  labelBorderColor?: ColorValue;
  labelPadding?: number;
  labelPosition?: AlignValue;
  labelWidth?: number;
  loop?: Function;
  loopStyle?: Function;
  margin?: number;
  movable?: boolean;
  noEdgeStyle?: boolean;
  noLabel?: boolean;
  opacity?: number;
  orthogonal?: boolean | null;
  orthogonalLoop?: boolean;
  overflow?: OverflowValue;
  perimeter?: Function | string | null;
  perimeterSpacing?: number;
  pointerEvents?: boolean;
  portConstraint?: DIRECTION;
  portConstraintRotation?: DIRECTION;
  resizable?: boolean;
  resizeHeight?: boolean;
  resizeWidth?: boolean;
  rotatable?: boolean;
  rotation?: number;
  rounded?: boolean;
  routingCenterX?: number;
  routingCenterY?: number;
  segment?: number;
  separatorColor?: ColorValue;
  shadow?: boolean;
  shape?: ShapeValue;
  sourceJettySize?: number | 'auto';
  sourcePerimeterSpacing?: number;
  sourcePort?: string;
  sourcePortConstraint?: DIRECTION;
  spacing?: number;
  spacingBottom?: number;
  spacingLeft?: number;
  spacingRight?: number;
  spacingTop?: number;
  startArrow?: ArrowType;
  startFill?: boolean;
  startSize?: number;
  strokeColor?: ColorValue;
  strokeOpacity?: number;
  strokeWidth?: number;
  swimlaneFillColor?: ColorValue;
  swimlaneLine?: boolean;
  targetJettySize?: number | 'auto';
  targetPerimeterSpacing?: number;
  targetPort?: string;
  targetPortConstraint?: DIRECTION;
  textDirection?: TextDirectionValue;
  textOpacity?: number;
  verticalAlign?: VAlignValue;
  verticalLabelPosition?: VAlignValue;
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
