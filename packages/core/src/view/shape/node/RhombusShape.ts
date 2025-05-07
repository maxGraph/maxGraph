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

import Shape from '../Shape';
import Point from '../../geometry/Point';
import { LINE_ARCSIZE } from '../../../util/Constants';
import Rectangle from '../../geometry/Rectangle';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';

/**
 * Extends {@link Shape} to implement a rhombus (aka diamond) shape.
 *
 * This shape is registered under `rhombus` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class RhombusShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokewidth = 1) {
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
