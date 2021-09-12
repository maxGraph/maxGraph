/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Shape from '../Shape';
import AbstractCanvas2D from '../../../../util/canvas/AbstractCanvas2D';
import Rectangle from '../../Rectangle';
import { ColorValue } from '../../../../types';

/**
 * Extends {@link Shape} to implement a horizontal line shape.
 * This shape is registered under {@link mxConstants.SHAPE_LINE} in {@link mxCellRenderer}.
 * @class Line
 * @extends {Shape}
 */
class LineShape extends Shape {
  constructor(bounds: Rectangle, stroke: ColorValue, strokeWidth = 1, vertical = false) {
    super();
    this.bounds = bounds;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
    this.vertical = vertical;
  }

  /**
   * Function: vertical
   *
   * Whether to paint a vertical line.
   */
  vertical: boolean;

  /**
   * Redirects to redrawPath for subclasses to work.
   * @param {AbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    c.begin();

    if (this.vertical) {
      const mid = x + w / 2;
      c.moveTo(mid, y);
      c.lineTo(mid, y + h);
    } else {
      const mid = y + h / 2;
      c.moveTo(x, mid);
      c.lineTo(x + w, mid);
    }

    c.stroke();
  }
}

export default LineShape;
