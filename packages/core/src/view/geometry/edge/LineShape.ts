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
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import Rectangle from '../Rectangle';
import { ColorValue } from '../../../types';

/**
 * Extends {@link Shape} to implement a horizontal line shape.
 *
 * The shape is used to represent edges, not vertices.
 *
 * By default, this shape is registered under {@link SHAPE.LINE} in {@link CellRenderer}.
 *
 * @category Edge Shapes
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
