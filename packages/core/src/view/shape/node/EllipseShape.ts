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
import Rectangle from '../../geometry/Rectangle';

/**
 * Extends {@link Shape} to implement an ellipse shape.
 *
 * This shape is registered under `ellipse` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
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
