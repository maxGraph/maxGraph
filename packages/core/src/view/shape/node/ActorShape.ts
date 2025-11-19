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
import { AbstractPathShape } from './AbstractPathShape.js';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import type { ColorValue } from '../../../types.js';

/**
 * Extends {@link Shape} to implement an actor shape.
 *
 * This shape is registered under `actor` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class ActorShape extends AbstractPathShape {
  constructor(
    bounds?: Rectangle | null,
    fill?: ColorValue,
    stroke?: ColorValue,
    strokeWidth?: number
  ) {
    super(bounds, fill, stroke, strokeWidth);
  }

  /**
   * Draws the path for this shape.
   */
  override redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
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
