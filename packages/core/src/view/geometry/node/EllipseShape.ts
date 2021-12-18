/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Shape from '../Shape';
import AbstractCanvas2D from '../../../view/canvas/AbstractCanvas2D';
import Rectangle from '../Rectangle';

/**
 * Extends mxShape to implement an ellipse shape.
 * This shape is registered under mxConstants.SHAPE_ELLIPSE in mxCellRenderer.
 */
class EllipseShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokeWidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Paints the ellipse shape.
   */
  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    c.ellipse(x, y, w, h);
    c.fillAndStroke();
  }
}

export default EllipseShape;
