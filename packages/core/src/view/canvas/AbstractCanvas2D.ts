/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import { arcToCurves, getRotatedPoint } from '../../util/mathUtils';
import {
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DIRECTION,
  NONE,
  SHADOWCOLOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  SHADOW_OPACITY,
} from '../../util/Constants';
import UrlConverter from '../../util/UrlConverter';
import Point from '../geometry/Point';
import { clone } from '../../util/cloneUtils';

import type {
  AlignValue,
  CanvasState,
  ColorValue,
  DirectionValue,
  OverflowValue,
  TextDirectionValue,
  VAlignValue,
} from '../../types';

/**
 * Base class for all canvases. A description of the public API is available in <mxXmlCanvas2D>.
 * All color values of {@link Constants#NONE} will be converted to null in the state.
 *
 * Constructor: D
 *
 * Constructs a new abstract canvas.
 */
class AbstractCanvas2D {
  constructor() {
    this.converter = this.createUrlConverter();
    this.reset();
  }

  /**
   * Holds the <UrlConverter> to convert image URLs.
   */
  converter: UrlConverter;

  /**
   * Holds the current state.
   */
  state: CanvasState = this.createState();

  /**
   * Stack of states.
   */
  states: CanvasState[] = [];

  /**
   * Holds the current path as an array.
   */
  path: (string | number)[] = [];

  /**
   * Switch for rotation of HTML. Default is false.
   */
  rotateHtml = true;

  /**
   * Holds the last x coordinate.
   */
  lastX = 0;

  /**
   * Holds the last y coordinate.
   */
  lastY = 0;

  /**
   * Contains the string used for moving in paths. Default is 'M'.
   */
  moveOp = 'M';

  /**
   * Contains the string used for moving in paths. Default is 'L'.
   */
  lineOp = 'L';

  /**
   * Contains the string used for quadratic paths. Default is 'Q'.
   */
  quadOp = 'Q';

  /**
   * Contains the string used for bezier curves. Default is 'C'.
   */
  curveOp = 'C';

  /**
   * Holds the operator for closing curves. Default is 'Z'.
   */
  closeOp = 'Z';

  /**
   * Boolean value that specifies if events should be handled. Default is false.
   */
  pointerEvents = false;

  // from Polyline (maybe from other shapes also)
  pointerEventsValue: string | null = null;

  /**
   * Create a new <UrlConverter> and returns it.
   */
  createUrlConverter() {
    return new UrlConverter();
  }

  /**
   * Resets the state of this canvas.
   */
  reset() {
    this.state = this.createState();
    this.states = [];
  }

  /**
   * Creates the state of the this canvas.
   */
  createState() {
    return {
      dx: 0,
      dy: 0,
      scale: 1,
      alpha: 1,
      fillAlpha: 1,
      strokeAlpha: 1,
      fillColor: NONE,
      gradientFillAlpha: 1,
      gradientColor: NONE,
      gradientAlpha: 1,
      gradientDirection: DIRECTION.EAST,
      strokeColor: NONE,
      strokeWidth: 1,
      dashed: false,
      dashPattern: '3 3',
      fixDash: false,
      lineCap: 'flat',
      lineJoin: 'miter',
      miterLimit: 10,
      fontColor: '#000000',
      fontBackgroundColor: NONE,
      fontBorderColor: NONE,
      fontSize: DEFAULT_FONTSIZE,
      fontFamily: DEFAULT_FONTFAMILY,
      fontStyle: 0,
      shadow: false,
      shadowColor: SHADOWCOLOR,
      shadowAlpha: SHADOW_OPACITY,
      shadowDx: SHADOW_OFFSET_X,
      shadowDy: SHADOW_OFFSET_Y,
      rotation: 0,
      rotationCx: 0,
      rotationCy: 0,
    } as CanvasState;
  }

  /**
   * Rounds all numbers to integers.
   */
  format(value: number) {
    return Math.round(value);
  }

  /**
   * Adds the given operation to the path.
   */
  addOp = (op: string, ...args: number[]) => {
    this.path.push(op);

    if (args.length > 1) {
      const s = this.state;

      for (let i = 1; i < args.length; i += 2) {
        this.lastX = args[i - 1];
        this.lastY = args[i];

        this.path.push(this.format((this.lastX + s.dx) * s.scale));
        this.path.push(this.format((this.lastY + s.dy) * s.scale));
      }
    }
  };

  /**
   * Rotates the given point and returns the result as an {@link Point}.
   */
  rotatePoint(x: number, y: number, theta: number, cx: number, cy: number) {
    const rad = theta * (Math.PI / 180);

    return getRotatedPoint(
      new Point(x, y),
      Math.cos(rad),
      Math.sin(rad),
      new Point(cx, cy)
    );
  }

  /**
   * Saves the current state.
   */
  save() {
    this.states.push(this.state);
    this.state = clone(this.state);
  }

  /**
   * Restores the current state.
   */
  restore() {
    const state = this.states.pop();

    if (state) this.state = state;
  }

  /**
   * Sets the current link. Hook for subclassers.
   */
  setLink(link: string | null) {
    // nop
  }

  /**
   * Scales the current state.
   */
  scale(value: number) {
    this.state.scale *= value;

    if (this.state.strokeWidth !== null) this.state.strokeWidth *= value;
  }

  /**
   * Translates the current state.
   */
  translate(dx: number, dy: number) {
    this.state.dx += dx;
    this.state.dy += dy;
  }

  /**
   * Rotates the current state.
   */
  rotate(theta: number, flipH: boolean, flipV: boolean, cx: number, cy: number) {
    // nop
  }

  /**
   * Sets the current alpha.
   */
  setAlpha(value: number) {
    this.state.alpha = value;
  }

  /**
   * Sets the current solid fill alpha.
   */
  setFillAlpha(value: number) {
    this.state.fillAlpha = value;
  }

  /**
   * Sets the current stroke alpha.
   */
  setStrokeAlpha(value: number) {
    this.state.strokeAlpha = value;
  }

  /**
   * Sets the current fill color.
   */
  setFillColor(value: ColorValue | null) {
    this.state.fillColor = value;
    this.state.gradientColor = NONE;
  }

  /**
   * Sets the current gradient.
   */
  setGradient(
    color1: ColorValue,
    color2: ColorValue,
    x: number,
    y: number,
    w: number,
    h: number,
    direction: DirectionValue,
    alpha1 = 1,
    alpha2: number = 1
  ) {
    const s = this.state;
    s.fillColor = color1;
    s.gradientFillAlpha = alpha1;
    s.gradientColor = color2;
    s.gradientAlpha = alpha2;
    s.gradientDirection = direction;
  }

  /**
   * Sets the current stroke color.
   */
  setStrokeColor(value: ColorValue | null) {
    this.state.strokeColor = value;
  }

  /**
   * Sets the current stroke width.
   */
  setStrokeWidth(value: number) {
    this.state.strokeWidth = value;
  }

  /**
   * Enables or disables dashed lines.
   */
  setDashed(value: boolean, fixDash = false) {
    this.state.dashed = value;
    this.state.fixDash = fixDash;
  }

  /**
   * Sets the current dash pattern.
   */
  setDashPattern(value: string) {
    this.state.dashPattern = value;
  }

  /**
   * Sets the current line cap.
   */
  setLineCap(value: string) {
    this.state.lineCap = value;
  }

  /**
   * Sets the current line join.
   */
  setLineJoin(value: string) {
    this.state.lineJoin = value;
  }

  /**
   * Sets the current miter limit.
   */
  setMiterLimit(value: number) {
    this.state.miterLimit = value;
  }

  /**
   * Sets the current font color.
   */
  setFontColor(value: ColorValue | null) {
    this.state.fontColor = value;
  }

  /**
   * Sets the current font background color.
   */
  setFontBackgroundColor(value: ColorValue | null) {
    this.state.fontBackgroundColor = value;
  }

  /**
   * Sets the current font border color.
   */
  setFontBorderColor(value: ColorValue | null) {
    this.state.fontBorderColor = value;
  }

  /**
   * Sets the current font size.
   */
  setFontSize(value: number) {
    this.state.fontSize = value;
  }

  /**
   * Sets the current font family.
   */
  setFontFamily(value: string) {
    this.state.fontFamily = value;
  }

  /**
   * Sets the current font style.
   */
  setFontStyle(value: number) {
    this.state.fontStyle = value;
  }

  /**
   * Enables or disables and configures the current shadow.
   */
  setShadow(enabled: boolean) {
    this.state.shadow = enabled;
  }

  /**
   * Enables or disables and configures the current shadow.
   */
  setShadowColor(value: ColorValue | null) {
    this.state.shadowColor = value;
  }

  /**
   * Enables or disables and configures the current shadow.
   */
  setShadowAlpha(value: number) {
    this.state.shadowAlpha = value;
  }

  /**
   * Enables or disables and configures the current shadow.
   */
  setShadowOffset(dx: number, dy: number) {
    this.state.shadowDx = dx;
    this.state.shadowDy = dy;
  }

  /**
   * Starts a new path.
   */
  begin() {
    this.lastX = 0;
    this.lastY = 0;
    this.path = [];
  }

  /**
   *  Moves the current path the given coordinates.
   */
  moveTo(x: number, y: number) {
    this.addOp(this.moveOp, x, y);
  }

  /**
   * Draws a line to the given coordinates. Uses moveTo with the op argument.
   */
  lineTo(x: number, y: number) {
    this.addOp(this.lineOp, x, y);
  }

  /**
   * Adds a quadratic curve to the current path.
   */
  quadTo(x1: number, y1: number, x2: number, y2: number) {
    this.addOp(this.quadOp, x1, y1, x2, y2);
  }

  /**
   * Adds a bezier curve to the current path.
   */
  curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    this.addOp(this.curveOp, x1, y1, x2, y2, x3, y3);
  }

  /**
   * Adds the given arc to the current path. This is a synthetic operation that
   * is broken down into curves.
   */
  arcTo(
    rx: number,
    ry: number,
    angle: number,
    largeArcFlag: boolean,
    sweepFlag: boolean,
    x: number,
    y: number
  ) {
    const curves = arcToCurves(
      this.lastX,
      this.lastY,
      rx,
      ry,
      angle,
      largeArcFlag,
      sweepFlag,
      x,
      y
    );

    if (curves != null) {
      for (let i = 0; i < curves.length; i += 6) {
        this.curveTo(
          curves[i],
          curves[i + 1],
          curves[i + 2],
          curves[i + 3],
          curves[i + 4],
          curves[i + 5]
        );
      }
    }
  }

  /**
   * Closes the current path.
   */
  close(x1?: number, y1?: number, x2?: number, y2?: number, x3?: number, y3?: number) {
    this.addOp(this.closeOp);
  }

  /**
   * Empty implementation for backwards compatibility. This will be removed.
   */
  end() {}

  stroke() {}

  fill() {}

  fillAndStroke() {}

  rect(x: number, y: number, w: number, h: number) {}

  roundrect(x: number, y: number, w: number, h: number, r1: number, r2: number) {}

  ellipse(x: number, y: number, w: number, h: number) {}

  image(
    x: number,
    y: number,
    w: number,
    h: number,
    src: string,
    aspect = true,
    flipH = false,
    flipV = false
  ) {}

  text(
    x: number,
    y: number,
    w: number,
    h: number,
    str: string,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    format: string,
    overflow: OverflowValue,
    clip: boolean,
    rotation = 0,
    dir: TextDirectionValue
  ) {}

  updateText(
    x: number,
    y: number,
    w: number,
    h: number,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    overflow: OverflowValue,
    clip: boolean,
    rotation = 0,
    node: SVGElement
  ) {}
}

export default AbstractCanvas2D;
