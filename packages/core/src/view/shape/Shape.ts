/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import Rectangle from '../geometry/Rectangle.js';
import { isNullish } from '../../internal/utils.js';
import { getBoundingBox, getDirectedBounds, mod } from '../../util/mathUtils.js';
import { NONE, NS_SVG } from '../../util/Constants.js';
import Point from '../geometry/Point.js';
import type AbstractCanvas2D from '../canvas/AbstractCanvas2D.js';
import SvgCanvas2D from '../canvas/SvgCanvas2D.js';
import InternalEvent from '../event/InternalEvent.js';
import Client from '../../Client.js';
import type CellState from '../cell/CellState.js';
import type StencilShape from './stencil/StencilShape.js';
import type CellOverlay from '../cell/CellOverlay.js';
import type ImageBox from '../image/ImageBox.js';
import type {
  ArrowValue,
  CellStateStyle,
  ColorValue,
  DialectValue,
  DirectionValue,
  GradientMap,
} from '../../types.js';
import { StyleDefaultsConfig } from '../../util/config.js';

/**
 * Base class for all shapes.
 * A shape in maxGraph is a separate implementation for SVG, VML and HTML.
 * Which implementation to use is controlled by the dialect property which
 * is assigned from within the CellRenderer when the shape is created.
 * The dialect must be assigned for a shape, and it does normally depend on
 * the browser and the configuration of the graph (see maxGraph rendering hint).
 *
 * For each supported shape in SVG and VML, a corresponding shape exists in
 * maxGraph, namely for text, image, rectangle, rhombus, ellipse and polyline.
 * The other shapes are a combination of these shapes (e.g. label and swimlane)
 * or they consist of one or more (filled) path objects (e.g. actor and cylinder).
 * The HTML implementation is optional but may be required for a HTML-only view
 * of the graph.
 *
 * ### Custom Shapes
 * To extend from this class, the basic code looks as follows.
 * In the special case where the custom shape consists only of one filled region
 * or one filled region and an additional stroke the mxActor and mxCylinder
 * should be subclassed, respectively.
 * ```javascript
 * class CustomShape extends Shape {
 *   constructor() {
 *     super();
 *   }
 * }
 * ```
 * To register a custom shape in an existing graph instance, one must register the
 * shape under a new name in the graph’s cell renderer as follows:
 * ```javascript
 * ShapeRegistry.add('customShape', CustomShape);
 * ```
 * The second argument is the name of the constructor.
 * In order to use the shape you can refer to the given name above in a stylesheet.
 * For example, to change the shape for the default vertex style, the following code
 * is used:
 * ```javascript
 * const style = graph.getStylesheet().getDefaultVertexStyle();
 * style.shape = 'customShape';
 * ```
 *
 * @category Shape
 */
class Shape {
  /**
   * Switch to preserve image aspect.
   * @default false
   */
  preserveImageAspect = false;
  overlay: CellOverlay | null = null;
  indicator: Shape | null = null;
  indicatorShape: typeof Shape | null = null;

  /** @see CellHighlight */
  opacity = 100;
  isDashed = false;

  fill: ColorValue = NONE;

  gradient: ColorValue = NONE;

  gradientDirection: DirectionValue = 'east';

  fillOpacity = 100;

  strokeOpacity = 100;

  stroke: ColorValue = NONE;

  strokeWidth = 1;

  spacing = 0;

  startSize = 1;

  endSize = 1;

  startArrow: ArrowValue | string = NONE;

  endArrow: ArrowValue | string = NONE;

  direction: DirectionValue = 'east';

  flipH = false;

  flipV = false;

  isShadow = false;

  isRounded = false;

  rotation = 0;

  cursor = '';

  verticalTextRotation = 0;

  oldGradients: GradientMap = {};

  glass = false;

  /**
   * Holds the dialect in which the shape is to be painted.
   */
  dialect: DialectValue | null = null;

  /**
   * Holds the scale in which the shape is being painted.
   */
  scale = 1;

  /**
   * Rendering hint for configuring the canvas.
   */
  antiAlias = true;

  /**
   * Minimum stroke width for SVG output.
   */
  minSvgStrokeWidth = 1;

  /**
   * Holds the {@link Rectangle} that specifies the bounds of this shape.
   */
  bounds: Rectangle | null = null;

  /**
   * Holds the array of <Point> that specify the points of this shape.
   */
  points: (Point | null)[] = [];

  /**
   * Holds the outermost DOM node that represents this shape.
   */
  node: SVGGElement;

  /**
   * Optional reference to the corresponding <CellState>.
   */
  state: CellState | null = null;

  /**
   * Optional reference to the style of the corresponding <CellState>.
   */
  style: CellStateStyle | null = null;

  /**
   * Contains the bounding box of the shape, that is, the smallest rectangle
   * that includes all pixels of the shape.
   */
  boundingBox: Rectangle | null = null;

  /**
   * Holds the {@link StencilShape} that defines the shape.
   */
  stencil: StencilShape | null = null;

  /**
   * Event-tolerance for SVG strokes (in px).
   * This is only passed to the canvas in {@link createSvgCanvas} if {@link pointerEvents} is `true`.
   * @default 8
   */
  svgStrokeTolerance = 8;

  /**
   * Specifies if pointer events should be handled.
   * @default true
   */
  pointerEvents = true;

  originalPointerEvents: boolean | null = null;

  /**
   * Specifies if pointer events should be handled.
   * @default 'all'
   */
  svgPointerEvents = 'all';

  /**
   * Specifies if pointer events outside of shape should be handled.
   * @default false
   */
  shapePointerEvents = false;

  /**
   * Specifies if pointer events outside of stencils should be handled.
   * Set this to `true` for backwards compatibility with the 1.x branch.
   *
   * @default false
   */
  stencilPointerEvents = false;

  /**
   * Specifies if the shape should be drawn as an outline.
   *
   * This disables all fill colors and can be used to disable other drawing states that should not be painted for outlines.
   * This should be set before calling {@link apply}.
   *
   * @default false
   */
  outline = false;

  /**
   * Specifies if the shape is visible.
   * @default true
   */
  visible = true;

  /**
   * Allows to use the SVG bounding box in SVG.
   * @default true
   */
  useSvgBoundingBox = true;

  image: ImageBox | null = null;

  imageSrc: string | null = null;

  indicatorColor: ColorValue = NONE;

  indicatorStrokeColor: ColorValue = NONE;

  indicatorGradientColor: ColorValue = NONE;

  indicatorDirection: DirectionValue = 'east';

  indicatorImageSrc: string | null = null;

  constructor(stencil: StencilShape | null = null) {
    // `stencil` is not null when instantiated directly,
    // but can be null when instantiated through a child class.
    if (stencil) {
      this.stencil = stencil;
    }

    // moved from init()
    this.node = this.create();
  }

  /**
   * Initializes the shape by adding it into the given container if the node of the shape doesn't already have a parent.
   *
   * @param container DOM node that will contain the shape.
   */
  init(container: HTMLElement | SVGElement) {
    if (!this.node.parentNode) {
      container.appendChild(this.node);
    }
  }

  /**
   * Sets the styles to their default values.
   */
  initStyles() {
    this.strokeWidth = 1;
    this.rotation = 0;
    this.opacity = 100;
    this.fillOpacity = 100;
    this.strokeOpacity = 100;
    this.flipH = false;
    this.flipV = false;
  }

  /**
   * Returns true if HTML is allowed for this shape. This implementation always returns `false`.
   */
  isHtmlAllowed() {
    return false;
  }

  /**
   * Returns 0, or 0.5 if {@link strokeWidth} % 2 == 1.
   */
  getSvgScreenOffset(): number {
    const sw =
      this.stencil && this.stencil.strokeWidthValue !== 'inherit'
        ? Number(this.stencil.strokeWidthValue)
        : (this.strokeWidth ?? 0);

    return mod(Math.max(1, Math.round(sw * this.scale)), 2) === 1 ? 0.5 : 0;
  }

  /**
   * Creates and returns the DOM node for the shape.
   * This implementation assumes that `maxGraph` produces SVG elements.
   */
  create() {
    return document.createElementNS(NS_SVG, 'g');
  }

  redraw() {
    this.updateBoundsFromPoints();

    if (this.visible && this.checkBounds()) {
      this.node.style.visibility = 'visible';
      this.clear();
      this.redrawShape();
      this.updateBoundingBox();
    } else {
      this.node.style.visibility = 'hidden';
      this.boundingBox = null;
    }
  }

  /**
   * Removes all child nodes and resets all CSS.
   */
  clear() {
    while (this.node.lastChild) {
      this.node.removeChild(this.node.lastChild);
    }
  }

  /**
   * Updates the bounds based on the points.
   */
  updateBoundsFromPoints() {
    const pts = this.points;

    if (pts.length > 0 && pts[0]) {
      this.bounds = new Rectangle(Math.round(pts[0].x), Math.round(pts[0].y), 1, 1);

      for (const pt of pts) {
        if (pt) {
          this.bounds.add(new Rectangle(Math.round(pt.x), Math.round(pt.y), 1, 1));
        }
      }
    }
  }

  /**
   * Returns the {@link Rectangle} for the label bounds of this shape, based on the
   * given scaled and translated bounds of the shape. This method should not
   * change the rectangle in-place. This implementation returns the given rect.
   */
  getLabelBounds(rect: Rectangle) {
    const d = this.style?.direction ?? 'east';
    let bounds = rect.clone();

    // Normalizes argument for getLabelMargins hook
    if (
      d !== 'south' &&
      d !== 'north' &&
      this.state &&
      this.state.text &&
      this.state.text.isPaintBoundsInverted()
    ) {
      bounds = bounds.clone();
      [bounds.width, bounds.height] = [bounds.height, bounds.width];
    }

    let labelMargins = this.getLabelMargins(bounds);

    if (labelMargins) {
      labelMargins = labelMargins.clone();

      let flipH = this.style?.flipH ?? false;
      let flipV = this.style?.flipV ?? false;

      // Handles special case for vertical labels
      if (this.state && this.state.text && this.state.text.isPaintBoundsInverted()) {
        const tmp = labelMargins.x;
        labelMargins.x = labelMargins.height;
        labelMargins.height = labelMargins.width;
        labelMargins.width = labelMargins.y;
        labelMargins.y = tmp;

        [flipH, flipV] = [flipV, flipH];
      }

      return getDirectedBounds(rect, labelMargins, this.style, flipH, flipV);
    }
    return rect;
  }

  /**
   * Returns the scaled top, left, bottom and right margin to be used for
   * computing the label bounds as an {@link Rectangle}, where the bottom and right
   * margin are defined in the width and height of the rectangle, respectively.
   */
  getLabelMargins(rect: Rectangle | null): Rectangle | null {
    return null;
  }

  /**
   * Returns true if the bounds are not null and all of its variables are numeric.
   */
  checkBounds() {
    return (
      !Number.isNaN(this.scale) &&
      Number.isFinite(this.scale) &&
      this.scale > 0 &&
      this.bounds &&
      !Number.isNaN(this.bounds.x) &&
      !Number.isNaN(this.bounds.y) &&
      !Number.isNaN(this.bounds.width) &&
      !Number.isNaN(this.bounds.height) &&
      this.bounds.width > 0 &&
      this.bounds.height > 0
    );
  }

  /**
   * Updates the SVG or VML shape.
   */
  redrawShape() {
    const canvas = this.createCanvas();

    if (canvas) {
      // Specifies if events should be handled
      canvas.pointerEvents = this.pointerEvents;

      this.beforePaint(canvas);
      this.paint(canvas);
      this.afterPaint(canvas);

      if (this.node !== canvas.root && canvas.root) {
        // Forces parsing in IE8 standards mode - slow! avoid
        this.node.insertAdjacentHTML('beforeend', canvas.root.outerHTML);
      }

      this.destroyCanvas(canvas);
    }
  }

  /**
   * Creates a new canvas for drawing this shape. May return null.
   */
  createCanvas() {
    const canvas = this.createSvgCanvas();

    if (canvas && this.outline) {
      canvas.setStrokeWidth(this.strokeWidth);
      canvas.setStrokeColor(this.stroke);

      if (this.isDashed) {
        canvas.setDashed(this.isDashed);
      }

      canvas.setStrokeWidth = () => {
        return;
      };
      canvas.setStrokeColor = () => {
        return;
      };
      canvas.setFillColor = () => {
        return;
      };
      canvas.setGradient = () => {
        return;
      };
      canvas.setDashed = () => {
        return;
      };
      canvas.text = () => {
        return;
      };
    }

    return canvas;
  }

  /**
   * Creates and returns an {@link SvgCanvas2D} for rendering this shape.
   */
  createSvgCanvas() {
    if (!this.node) return null;

    const canvas = new SvgCanvas2D(this.node, false);
    canvas.strokeTolerance = this.pointerEvents ? this.svgStrokeTolerance : 0;
    canvas.pointerEventsValue = this.svgPointerEvents;

    const off = this.getSvgScreenOffset();

    if (off !== 0) {
      this.node.setAttribute('transform', `translate(${off},${off})`);
    } else {
      this.node.removeAttribute('transform');
    }

    canvas.minStrokeWidth = this.minSvgStrokeWidth;

    if (!this.antiAlias) {
      // Rounds all numbers in the SVG output to integers
      canvas.format = (value) => {
        return Math.round(value);
      };
    }

    return canvas;
  }

  /**
   * Destroys the given canvas which was used for drawing. This implementation
   * increments the reference counts on all shared gradients used in the canvas.
   */
  destroyCanvas(canvas: AbstractCanvas2D) {
    // Manages reference counts
    if (canvas instanceof SvgCanvas2D) {
      // Increments ref counts
      for (const key in canvas.gradients) {
        const gradient = canvas.gradients[key];

        if (gradient) {
          gradient.mxRefCount = (gradient.mxRefCount || 0) + 1;
        }
      }

      this.releaseSvgGradients(this.oldGradients);
      this.oldGradients = canvas.gradients;
    }
  }

  /**
   * Invoked before paint is called.
   */
  beforePaint(c: AbstractCanvas2D) {
    return;
  }

  /**
   * Invokes after paint was called.
   */
  afterPaint(c: AbstractCanvas2D) {
    return;
  }

  /**
   * Generic rendering code.
   */
  paint(c: AbstractCanvas2D) {
    let strokeDrawn = false;

    if (c && this.outline) {
      const { fillAndStroke, stroke } = c;

      c.stroke = (...args) => {
        strokeDrawn = true;
        stroke.apply(c, args);
      };

      c.fillAndStroke = (...args) => {
        strokeDrawn = true;
        fillAndStroke.apply(c, args);
      };
    }

    // Scale is passed-through to canvas
    const s = this.scale;
    const bounds = this.bounds;

    if (bounds) {
      let x = bounds.x / s;
      let y = bounds.y / s;
      let w = bounds.width / s;
      let h = bounds.height / s;

      if (this.isPaintBoundsInverted()) {
        const t = (w - h) / 2;
        x += t;
        y -= t;
        const tmp = w;
        w = h;
        h = tmp;
      }

      this.updateTransform(c, x, y, w, h);
      this.configureCanvas(c, x, y, w, h);

      // Adds background rectangle to capture events
      let bg = null;

      if (
        (!this.stencil && this.points.length === 0 && this.shapePointerEvents) ||
        (this.stencil && this.stencilPointerEvents)
      ) {
        const bb = this.createBoundingBox();

        if (bb && this.node) {
          bg = this.createTransparentSvgRectangle(bb.x, bb.y, bb.width, bb.height);
          this.node.appendChild(bg);
        }
      }

      if (this.stencil) {
        this.stencil.drawShape(c, this, x, y, w, h);
      } else {
        // Stencils have separate strokewidth
        c.setStrokeWidth(this.strokeWidth);

        if (this.points.length > 0) {
          // Paints edge shape
          const pts = [];

          for (let i = 0; i < this.points.length; i += 1) {
            const p = this.points[i];

            if (p) {
              pts.push(new Point(p.x / s, p.y / s));
            }
          }

          this.paintEdgeShape(c, pts);
        } else {
          // Paints vertex shape
          this.paintVertexShape(c, x, y, w, h);
        }
      }

      if (bg && c.state && !isNullish(c.state.transform)) {
        bg.setAttribute('transform', <string>c.state.transform);
      }

      // Draws highlight rectangle if no stroke was used
      if (c && this.outline && !strokeDrawn) {
        c.rect(x, y, w, h);
        c.stroke();
      }
    }
  }

  /**
   * Sets the state of the canvas for drawing the shape.
   */
  configureCanvas(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    let dash: string | null = null;

    if (this.style && this.style.dashPattern != null) {
      dash = this.style.dashPattern;
    }

    c.setAlpha(this.opacity / 100);
    c.setFillAlpha(this.fillOpacity / 100);
    c.setStrokeAlpha(this.strokeOpacity / 100);

    // Sets alpha, colors and gradients
    if (this.isShadow) {
      c.setShadow(this.isShadow);
    }

    // Dash pattern
    if (this.isDashed) {
      c.setDashed(this.isDashed, this.style?.fixDash ?? false);
    }

    if (dash) {
      c.setDashPattern(dash);
    }

    if (this.fill !== NONE && this.gradient !== NONE) {
      const b = this.getGradientBounds(c, x, y, w, h);
      c.setGradient(
        this.fill,
        this.gradient,
        b.x,
        b.y,
        b.width,
        b.height,
        this.gradientDirection
      );
    } else {
      c.setFillColor(this.fill);
    }

    c.setStrokeColor(this.stroke);
  }

  /**
   * Returns the bounding box for the gradient box for this shape.
   */
  getGradientBounds(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    return new Rectangle(x, y, w, h);
  }

  /**
   * Sets the scale and rotation on the given canvas.
   */
  updateTransform(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    // NOTE: Currently, scale is implemented in state and canvas. This will
    // move to canvas in a later version, so that the states are unscaled
    // and untranslated and do not need an update after zooming or panning.
    c.scale(this.scale);
    c.rotate(this.getShapeRotation(), this.flipH, this.flipV, x + w / 2, y + h / 2);
  }

  /**
   * Paints the vertex shape.
   */
  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    this.paintBackground(c, x, y, w, h);

    if (!this.outline || !this.style || !(this.style.backgroundOutline ?? false)) {
      c.setShadow(false);
      this.paintForeground(c, x, y, w, h);
    }
  }

  /**
   * Hook for subclassers. This implementation is empty.
   */
  paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    return;
  }

  /**
   * Hook for subclassers. This implementation is empty.
   */
  paintForeground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    return;
  }

  /**
   * Hook for subclassers. This implementation is empty.
   */
  paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
    return;
  }

  /**
   * Base arc size for the shape, taken from the style.
   * @since 0.21.0
   */
  protected getBaseArcSize(): number {
    return (this.style?.arcSize ?? StyleDefaultsConfig.lineArcSize) / 2;
  }

  /**
   * Returns the arc size for the given dimension.
   */
  getArcSize(w: number, h: number): number {
    if (this.style?.absoluteArcSize) {
      return Math.min(this.getBaseArcSize(), Math.min(h, w) / 2);
    }
    const roundingFactor =
      (this.style?.arcSize ?? StyleDefaultsConfig.roundingFactor * 100) / 100;
    return Math.min(w, h) * roundingFactor;
  }

  /**
   * Paints the glass gradient effect.
   */
  paintGlassEffect(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number,
    arc: number
  ) {
    const sw = Math.ceil((this.strokeWidth ?? 0) / 2);
    const size = 0.4;

    c.setGradient('#ffffff', '#ffffff', x, y, w, h * 0.6, 'south', 0.9, 0.1);
    c.begin();
    arc += 2 * sw;

    if (this.isRounded) {
      c.moveTo(x - sw + arc, y - sw);
      c.quadTo(x - sw, y - sw, x - sw, y - sw + arc);
      c.lineTo(x - sw, y + h * size);
      c.quadTo(x + w * 0.5, y + h * 0.7, x + w + sw, y + h * size);
      c.lineTo(x + w + sw, y - sw + arc);
      c.quadTo(x + w + sw, y - sw, x + w + sw - arc, y - sw);
    } else {
      c.moveTo(x - sw, y - sw);
      c.lineTo(x - sw, y + h * size);
      c.quadTo(x + w * 0.5, y + h * 0.7, x + w + sw, y + h * size);
      c.lineTo(x + w + sw, y - sw);
    }

    c.close();
    c.fill();
  }

  /**
   * Paints the given points with rounded corners.
   */
  addPoints(
    c: AbstractCanvas2D,
    pts: Point[],
    rounded = false,
    arcSize: number,
    close = false,
    exclude: number[] = [],
    initialMove = true
  ) {
    if (pts.length > 0) {
      const pe = pts[pts.length - 1];

      // Adds virtual waypoint in the center between start and end point
      if (close && rounded) {
        pts = pts.slice();
        const p0 = pts[0];
        const wp = new Point(pe.x + (p0.x - pe.x) / 2, pe.y + (p0.y - pe.y) / 2);
        pts.splice(0, 0, wp);
      }

      let pt = pts[0];
      let i = 1;

      // Draws the line segments
      if (initialMove) {
        c.moveTo(pt.x, pt.y);
      } else {
        c.lineTo(pt.x, pt.y);
      }

      while (i < (close ? pts.length : pts.length - 1)) {
        let tmp = pts[mod(i, pts.length)];
        let dx = pt.x - tmp.x;
        let dy = pt.y - tmp.y;

        if (rounded && (dx !== 0 || dy !== 0) && !exclude.includes(i - 1)) {
          // Draws a line from the last point to the current
          // point with a spacing of size off the current point
          // into direction of the last point
          let dist = Math.sqrt(dx * dx + dy * dy);
          const nx1 = (dx * Math.min(arcSize, dist / 2)) / dist;
          const ny1 = (dy * Math.min(arcSize, dist / 2)) / dist;

          const x1 = tmp.x + nx1;
          const y1 = tmp.y + ny1;
          c.lineTo(x1, y1);

          // Draws a curve from the last point to the current
          // point with a spacing of size off the current point
          // into direction of the next point
          let next = pts[mod(i + 1, pts.length)];

          // Uses next non-overlapping point
          while (
            i < pts.length - 2 &&
            Math.round(next.x - tmp.x) === 0 &&
            Math.round(next.y - tmp.y) === 0
          ) {
            next = pts[mod(i + 2, pts.length)];
            i++;
          }

          dx = next.x - tmp.x;
          dy = next.y - tmp.y;

          dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const nx2 = (dx * Math.min(arcSize, dist / 2)) / dist;
          const ny2 = (dy * Math.min(arcSize, dist / 2)) / dist;

          const x2 = tmp.x + nx2;
          const y2 = tmp.y + ny2;

          c.quadTo(tmp.x, tmp.y, x2, y2);
          tmp = new Point(x2, y2);
        } else {
          c.lineTo(tmp.x, tmp.y);
        }

        pt = tmp;
        i += 1;
      }

      if (close) {
        c.close();
      } else {
        c.lineTo(pe.x, pe.y);
      }
    }
  }

  /**
   * Resets all styles.
   */
  resetStyles() {
    this.initStyles();

    this.spacing = 0;

    this.fill = NONE;
    this.gradient = NONE;
    this.gradientDirection = 'east';
    this.stroke = NONE;
    this.startSize = 1;
    this.endSize = 1;
    this.startArrow = NONE;
    this.endArrow = NONE;
    this.direction = 'east';

    this.isShadow = false;
    this.isDashed = false;
    this.isRounded = false;
    this.glass = false;
  }

  /**
   * Applies the style of the given <CellState> to the shape. This
   * implementation assigns the following styles to local fields:
   *
   * - <'fillColor'> => fill
   * - <'gradientColor'> => gradient
   * - <'gradientDirection'> => gradientDirection
   * - <'opacity'> => opacity
   * - {@link Constants#STYLE_FILL_OPACITY} => fillOpacity
   * - {@link Constants#STYLE_STROKE_OPACITY} => strokeOpacity
   * - <'strokeColor'> => stroke
   * - <'strokeWidth'> => strokewidth
   * - <'shadow'> => isShadow
   * - <'dashed'> => isDashed
   * - <'spacing'> => spacing
   * - <'startSize'> => startSize
   * - <'endSize'> => endSize
   * - <'rounded'> => isRounded
   * - <'startArrow'> => startArrow
   * - <'endArrow'> => endArrow
   * - <'rotation'> => rotation
   * - <'direction'> => direction
   * - <'glass'> => glass
   *
   * This keeps a reference to the <style>. If you need to keep a reference to
   * the cell, you can override this method and store a local reference to
   * state.cell or the <CellState> itself. If <outline> should be true, make
   * sure to set it before calling this method.
   *
   * @param state <CellState> of the corresponding cell.
   */
  apply(state: CellState) {
    this.state = state;
    this.style = state.style;

    if (this.style) {
      this.fill = this.style.fillColor ?? this.fill;
      this.gradient = this.style.gradientColor ?? this.gradient;
      this.gradientDirection = this.style.gradientDirection ?? this.gradientDirection;
      this.opacity = this.style.opacity ?? this.opacity;
      this.fillOpacity = this.style.fillOpacity ?? this.fillOpacity;
      this.strokeOpacity = this.style.strokeOpacity ?? this.strokeOpacity;
      this.stroke = this.style.strokeColor ?? this.stroke;
      this.strokeWidth = this.style.strokeWidth ?? this.strokeWidth;
      this.spacing = this.style.spacing ?? this.spacing;
      this.startSize = this.style.startSize ?? this.startSize;
      this.endSize = this.style.endSize ?? this.endSize;
      this.startArrow = this.style.startArrow ?? this.startArrow;
      this.endArrow = this.style.endArrow ?? this.endArrow;
      this.rotation = this.style.rotation ?? this.rotation;
      this.direction = this.style.direction ?? this.direction;
      this.flipH = !!this.style.flipH;
      this.flipV = !!this.style.flipV;

      if (this.direction === 'north' || this.direction === 'south') {
        const tmp = this.flipH;
        this.flipH = this.flipV;
        this.flipV = tmp;
      }

      this.isShadow = this.style.shadow ?? this.isShadow;
      this.isDashed = this.style.dashed ?? this.isDashed;
      this.isRounded = this.style.rounded ?? this.isRounded;
      this.glass = this.style.glass ?? this.glass;
    }
  }

  /**
   * Sets the cursor on the given shape.
   *
   * @param cursor The cursor to be used.
   */
  setCursor(cursor: string) {
    this.cursor = cursor;
    this.node.style.cursor = cursor;
  }

  /**
   * Returns the current cursor.
   */
  getCursor() {
    return this.cursor;
  }

  /**
   * Hook for subclassers. This implementation returns `false`.
   */
  isRoundable(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    return false;
  }

  /**
   * Updates the {@link boundingBox} for this shape using {@link createBoundingBox} and
   * {@link augmentBoundingBox} and stores the result in {@link boundingBox}.
   */
  updateBoundingBox() {
    // Tries to get bounding box from SVG subsystem
    // LATER: Use getBoundingClientRect for fallback in VML
    if (this.useSvgBoundingBox && this.node.ownerSVGElement) {
      try {
        const b = this.node.getBBox();

        if (b.width > 0 && b.height > 0) {
          this.boundingBox = new Rectangle(b.x, b.y, b.width, b.height);

          // Adds strokeWidth
          this.boundingBox.grow(((this.strokeWidth ?? 0) * this.scale) / 2);

          return;
        }
      } catch (e) {
        // fallback to code below
      }
    }

    if (this.bounds) {
      let bbox = this.createBoundingBox();

      if (bbox) {
        this.augmentBoundingBox(bbox);
        const rot = this.getShapeRotation();

        if (rot !== 0) {
          bbox = getBoundingBox(bbox, rot);
        }
      }

      this.boundingBox = bbox;
    }
  }

  /**
   * Returns a new rectangle that represents the bounding box of the bare shape
   * with no shadows or strokewidths.
   */
  createBoundingBox() {
    if (!this.bounds) return null;

    const bb = this.bounds.clone();
    if (
      (this.stencil && (this.direction === 'north' || this.direction === 'south')) ||
      this.isPaintBoundsInverted()
    ) {
      bb.rotate90();
    }

    return bb;
  }

  /**
   * Augments the bounding box with the strokewidth and shadow offsets.
   */
  augmentBoundingBox(bbox: Rectangle) {
    if (this.isShadow) {
      bbox.width += Math.ceil(StyleDefaultsConfig.shadowOffsetX * this.scale);
      bbox.height += Math.ceil(StyleDefaultsConfig.shadowOffsetX * this.scale);
    }

    // Adds strokeWidth
    bbox.grow(((this.strokeWidth ?? 0) * this.scale) / 2);
  }

  /**
   * Returns true if the bounds should be inverted.
   */
  isPaintBoundsInverted() {
    // Stencil implements inversion via aspect
    return !this.stencil && (this.direction === 'north' || this.direction === 'south');
  }

  /**
   * Returns the rotation from the style.
   */
  getRotation() {
    return this.rotation ?? 0;
  }

  /**
   * Returns the rotation for the text label.
   */
  getTextRotation() {
    let rot = this.getRotation();

    if (!(this.style?.horizontal ?? true)) {
      rot += this.verticalTextRotation || -90; // WARNING WARNING!!!! ===============================================================================================
    }

    return rot;
  }

  /**
   * Returns the actual rotation of the shape.
   */
  getShapeRotation() {
    let rot = this.getRotation();

    switch (this.direction) {
      case 'north': {
        rot += 270;

        break;
      }
      case 'west': {
        rot += 180;

        break;
      }
      case 'south': {
        rot += 90;

        break;
      }
      // No default
    }

    return rot;
  }

  /**
   * Adds a transparent rectangle that catches all events.
   */
  createTransparentSvgRectangle(x: number, y: number, w: number, h: number) {
    const rect = document.createElementNS(NS_SVG, 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(h));
    rect.setAttribute('fill', NONE);
    rect.setAttribute('stroke', NONE);
    rect.setAttribute('pointer-events', 'all');
    return rect;
  }

  redrawHtmlShape() {
    return;
  }

  /**
   * Sets a transparent background CSS style to catch all events.
   *
   * Paints the line shape.
   */
  setTransparentBackgroundImage(node: SVGElement) {
    node.style.backgroundImage = `url('${Client.imageBasePath}/transparent.gif')`;
  }

  /**
   * Paints the line shape.
   */
  releaseSvgGradients(grads: GradientMap) {
    for (const key in grads) {
      const gradient = grads[key];

      if (gradient) {
        gradient.mxRefCount = (gradient.mxRefCount || 0) - 1;

        if (gradient.mxRefCount === 0 && gradient.parentNode) {
          gradient.parentNode.removeChild(gradient);
        }
      }
    }
  }

  /**
   * Destroys the shape by removing it from the DOM and releasing the DOM
   * node associated with the shape using {@link Event#release}.
   */
  destroy() {
    InternalEvent.release(this.node);

    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }

    this.node.innerHTML = '';

    // Decrements refCount and removes unused
    this.releaseSvgGradients(this.oldGradients);
    this.oldGradients = {};
  }
}

export default Shape;
