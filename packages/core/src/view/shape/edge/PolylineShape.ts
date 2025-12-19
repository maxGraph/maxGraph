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

import Shape from '../Shape.js';
import Point from '../../geometry/Point.js';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import { ColorValue } from '../../../types.js';

/**
 * Extends {@link Shape} to implement a polyline (a line with multiple points).
 *
 * The shape is used to represent edges, not vertices.
 *
 * This shape is **NOT** registered in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Edge Shapes
 */
class PolylineShape extends Shape {
  /**
   * Constructs a new polyline shape.
   *
   * @param points Array of <{@link Point} that define the points. This is stored in {@link Shape.points}.
   * @param stroke String that defines the stroke color. Default is 'black'. This is stored in {@link Shape.stroke}.
   * @param strokeWidth Optional integer that defines the stroke width. Default is 1. This is stored in {@link Shape.strokeWidth}.
   */
  constructor(points: Point[], stroke: ColorValue, strokeWidth = 1) {
    super();
    this.points = points;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Returns 0.
   */
  override getRotation() {
    return 0;
  }

  /**
   * Returns 0.
   */
  override getShapeRotation() {
    return 0;
  }

  /**
   * Returns false.
   */
  override isPaintBoundsInverted() {
    return false;
  }

  /**
   * Paints the line shape.
   */
  override paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
    const prev = c.pointerEventsValue;
    c.pointerEventsValue = 'stroke';

    if (!this.style?.curved) {
      this.paintLine(c, pts, this.isRounded);
    } else {
      this.paintCurvedLine(c, pts);
    }
    c.pointerEventsValue = prev;
  }

  /**
   * Paints the line shape.
   */
  paintLine(c: AbstractCanvas2D, pts: Point[], rounded?: boolean) {
    c.begin();
    this.addPoints(c, pts, rounded, this.getBaseArcSize(), false);
    c.stroke();
  }

  /**
   * Paints the line shape.
   */
  paintCurvedLine(c: AbstractCanvas2D, pts: Point[]) {
    c.begin();

    const pt = pts[0];
    const n = pts.length;
    c.moveTo(pt.x, pt.y);

    for (let i = 1; i < n - 2; i += 1) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const ix = (p0.x + p1.x) / 2;
      const iy = (p0.y + p1.y) / 2;
      c.quadTo(p0.x, p0.y, ix, iy);
    }

    const p0 = pts[n - 2];
    const p1 = pts[n - 1];
    c.quadTo(p0.x, p0.y, p1.x, p1.y);

    c.stroke();
  }
}

export default PolylineShape;
