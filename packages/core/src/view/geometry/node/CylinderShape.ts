/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Shape from '../Shape';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import Rectangle from '../Rectangle';
import { NONE } from '../../../util/Constants';

/**
 * Extends {@link Shape} to implement an cylinder shape. If a custom shape with one filled area and an overlay path is
 * needed, then this shape's {@link redrawPath} should be overridden.
 *
 * This shape is registered under {@link mxConstants.SHAPE_CYLINDER} in {@link cellRenderer}.
 */
class CylinderShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokeWidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Defines the maximum height of the top and bottom part of the cylinder shape.
   */
  maxHeight = 40;

  /**
   * Sets stroke tolerance to 0 for SVG.
   */
  svgStrokeTolerance = 0;

  /**
   * Redirects to redrawPath for subclasses to work.
   */
  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    c.translate(x, y);
    c.begin();
    this.redrawPath(c, x, y, w, h, false);
    c.fillAndStroke();

    if (!this.outline || !this.style || this.style.backgroundOutline === 0) {
      c.setShadow(false);
      c.begin();
      this.redrawPath(c, x, y, w, h, true);
      c.stroke();
    }
  }

  /**
   * Redirects to redrawPath for subclasses to work.
   */
  getCylinderSize(x: number, y: number, w: number, h: number) {
    return Math.min(this.maxHeight, Math.round(h / 5));
  }

  /**
   * Draws the path for this shape.
   */
  redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isForeground: boolean = false
  ): void {
    const dy = this.getCylinderSize(x, y, w, h);

    if ((isForeground && this.fill !== NONE) || (!isForeground && this.fill === NONE)) {
      c.moveTo(0, dy);
      c.curveTo(0, 2 * dy, w, 2 * dy, w, dy);

      // Needs separate shapes for correct hit-detection
      if (!isForeground) {
        c.stroke();
        c.begin();
      }
    }

    if (!isForeground) {
      c.moveTo(0, dy);
      c.curveTo(0, -dy / 3, w, -dy / 3, w, dy);
      c.lineTo(w, h - dy);
      c.curveTo(w, h + dy / 3, 0, h + dy / 3, 0, h - dy);
      c.close();
    }
  }
}

export default CylinderShape;
