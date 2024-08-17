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

import ActorShape from '../ActorShape';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import Rectangle from '../Rectangle';

/**
 * Extends {@link ActorShape} to implement a cloud shape.
 * This shape is registered by default under {@link SHAPE.CLOUD} in {@link CellRenderer}.
 *
 * @category Vertex Shapes
 */
class CloudShape extends ActorShape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokeWidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Draws the path for this shape.
   */
  redrawPath(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    c.moveTo(0.25 * w, 0.25 * h);
    c.curveTo(0.05 * w, 0.25 * h, 0, 0.5 * h, 0.16 * w, 0.55 * h);
    c.curveTo(0, 0.66 * h, 0.18 * w, 0.9 * h, 0.31 * w, 0.8 * h);
    c.curveTo(0.4 * w, h, 0.7 * w, h, 0.8 * w, 0.8 * h);
    c.curveTo(w, 0.8 * h, w, 0.6 * h, 0.875 * w, 0.5 * h);
    c.curveTo(w, 0.3 * h, 0.8 * w, 0.1 * h, 0.625 * w, 0.2 * h);
    c.curveTo(0.5 * w, 0.05 * h, 0.3 * w, 0.05 * h, 0.25 * w, 0.25 * h);
    c.close();
  }
}

export default CloudShape;
