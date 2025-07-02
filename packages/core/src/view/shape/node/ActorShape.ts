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

import type Rectangle from '../../geometry/Rectangle.js';
import Shape from '../Shape.js';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import { ColorValue } from '../../../types.js';
import { NONE } from '../../../util/Constants.js';

/**
 * Extends {@link Shape} to implement an actor shape.
 *
 * This shape is registered under `actor` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * If a custom shape with one filled area is needed, then this shape's {@link redrawPath} method should be overridden
 * like in the following example:
 *
 * ```typescript
 * class SampleShape extends ActorShape {
 *   redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
 *     path.moveTo(0, 0);
 *     path.lineTo(w, h);
 *     // ...
 *     path.close();
 *   }
 * }
 * ```
 *
 * @category Vertex Shapes
 */
class ActorShape extends Shape {
  constructor(
    bounds: Rectangle | null = null,
    fill: ColorValue = NONE,
    stroke: ColorValue = NONE,
    strokeWidth = 1
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
  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    c.translate(x, y);
    c.begin();
    this.redrawPath(c, x, y, w, h);
    c.fillAndStroke();
  }

  /**
   * Draws the path for this shape.
   */
  redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
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
