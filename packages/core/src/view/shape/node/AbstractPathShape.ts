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
import type { ColorValue } from '../../../types.js';
import { NONE } from '../../../util/Constants.js';

/**
 * Base {@link Shape} for vertex shapes rendered from a single path.
 *
 * If a custom shape with one filled area is needed, override {@link redrawPath} as in the following example:
 *
 * ```typescript
 * class SampleShape extends AbstractPathShape {
 *   redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
 *     c.moveTo(0, 0);
 *     c.lineTo(w, h);
 *     // ...
 *     c.close();
 *   }
 * }
 * ```
 *
 * @category Vertex Shapes
 */
export abstract class AbstractPathShape extends Shape {
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
  override paintVertexShape(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    c.translate(x, y);
    c.begin();
    this.redrawPath(c, x, y, w, h);
    c.fillAndStroke();
  }

  /**
   * Draws the path for this shape.
   */
  abstract redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void;
}
