/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Shape from '../Shape';
import Point from '../Point';
import { LINE_ARCSIZE } from '../../../util/Constants';
import Rectangle from '../Rectangle';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';

/**
 * Extends {@link Shape} to implement a rhombus (aka diamond) shape.
 * This shape is registered under {@link mxConstants.SHAPE_RHOMBUS} in {@link cellRenderer}.
 * @class RhombusShape
 * @extends {Shape}
 */
class RhombusShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth: number = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokewidth;
  }

  /**
   * Adds roundable support.
   */
  // isRoundable(): boolean;
  isRoundable(): boolean {
    return true;
  }

  /**
   * Generic painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    const hw = w / 2;
    const hh = h / 2;

    const arcSize = (this.style?.arcSize ?? LINE_ARCSIZE) / 2;

    c.begin();
    this.addPoints(
      c,
      [
        new Point(x + hw, y),
        new Point(x + w, y + hh),
        new Point(x + hw, y + h),
        new Point(x, y + hh),
      ],
      this.isRounded,
      arcSize,
      true
    );
    c.fillAndStroke();
  }
}

export default RhombusShape;
