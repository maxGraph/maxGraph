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

import ActorShape from './ActorShape';
import Point from '../Point';
import { LINE_ARCSIZE } from '../../../util/Constants';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';

/**
 * Implementation of the hexagon shape.
 *
 * This shape is registered under `hexagon` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class HexagonShape extends ActorShape {
  constructor() {
    super();
  }

  /**
   * Draws the path for this shape.
   */
  redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    const arcSize = (this.style?.arcSize ?? LINE_ARCSIZE) / 2;

    this.addPoints(
      c,
      [
        new Point(0.25 * w, 0),
        new Point(0.75 * w, 0),
        new Point(w, 0.5 * h),
        new Point(0.75 * w, h),
        new Point(0.25 * w, h),
        new Point(0, 0.5 * h),
      ],
      this.isRounded,
      arcSize,
      true
    );
  }
}

export default HexagonShape;
