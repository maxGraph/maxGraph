/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Rectangle from './Rectangle';
import Shape from './Shape';
import SvgCanvas2D from '../canvas/SvgCanvas2D';
import { ColorValue } from '../../types';
import { NONE } from '../../util/Constants';

/**
 * Extends {@link Shape} to implement an actor shape. If a custom shape with one
 * filled area is needed, then this shape's {@link redrawPath} method should be overridden.
 *
 * This shape is registered under {@link Constants.SHAPE_ACTOR} in {@link cellRenderer}.
 *
 * ```javascript
 * function SampleShape() { }
 *
 * SampleShape.prototype = new mxActor();
 * SampleShape.prototype.constructor = vsAseShape;
 *
 * mxCellRenderer.registerShape('sample', SampleShape);
 * SampleShape.prototype.redrawPath = function(path, x, y, w, h)
 * {
 *   path.moveTo(0, 0);
 *   path.lineTo(w, h);
 *   // ...
 *   path.close();
 * }
 * ```
 */
class ActorShape extends Shape {
  constructor(
    bounds: Rectangle | null = null,
    fill: ColorValue = NONE,
    stroke: ColorValue = NONE,
    strokeWidth: number = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Redirects to redrawPath for subclasses to work.
   */
  paintVertexShape(c: SvgCanvas2D, x: number, y: number, w: number, h: number) {
    c.translate(x, y);
    c.begin();
    this.redrawPath(c, x, y, w, h);
    c.fillAndStroke();
  }

  /**
   * Draws the path for this shape.
   */
  redrawPath(c: SvgCanvas2D, x: number, y: number, w: number, h: number) {
    const width = w / 3;
    c.moveTo(0, h);
    c.curveTo(0, (3 * h) / 5, 0, (2 * h) / 5, w / 2, (2 * h) / 5);
    c.curveTo(w / 2 - width, (2 * h) / 5, w / 2 - width, 0, w / 2, 0);
    c.curveTo(w / 2 + width, 0, w / 2 + width, (2 * h) / 5, w / 2, (2 * h) / 5);
    c.curveTo(w, (2 * h) / 5, w, (3 * h) / 5, w, h);
    c.close();
  }
}

export default ActorShape;
