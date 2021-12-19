/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Point from '../Point';
import ActorShape from '../ActorShape';
import { LINE_ARCSIZE } from '../../../util/constants';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';

/**
 * Implementation of the triangle shape.
 * @class TriangleShape
 * @extends {ActorShape}
 */
class TriangleShape extends ActorShape {
  constructor() {
    super();
  }

  /**
   * Adds roundable support.
   * @returns {boolean}
   */
  isRoundable() {
    return true;
  }

  /**
   * Draws the path for this shape.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    const arcSize = (this.style?.arcSize ?? LINE_ARCSIZE) / 2;

    this.addPoints(
      c,
      [new Point(0, 0), new Point(w, 0.5 * h), new Point(0, h)],
      this.isRounded,
      arcSize,
      true
    );
  }
}

export default TriangleShape;
