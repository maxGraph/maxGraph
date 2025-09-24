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
import { ARROW_SIZE, ARROW_SPACING, ARROW_WIDTH } from '../../../util/Constants.js';
import Rectangle from '../../geometry/Rectangle.js';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import Point from '../../geometry/Point.js';
import { ColorValue } from '../../../types.js';

/**
 * Extends {@link Shape} to implement an arrow shape.
 *
 * The shape is used to represent edges, not vertices.
 *
 * This shape is registered under `arrow` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Edge Shapes
 */
class ArrowShape extends Shape {
  constructor(
    points: Point[],
    fill: ColorValue,
    stroke: ColorValue,
    strokeWidth = 1,
    arrowWidth = ARROW_WIDTH,
    spacing = ARROW_SPACING,
    endSize = ARROW_SIZE
  ) {
    super();
    this.points = points;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
    this.arrowWidth = arrowWidth;
    this.spacing = spacing;
    this.endSize = endSize;
  }

  arrowWidth: number;

  /**
   * Augments the bounding box with the edge width and markers.
   */
  override augmentBoundingBox(bbox: Rectangle) {
    super.augmentBoundingBox(bbox);

    const w = Math.max(this.arrowWidth, this.endSize);
    bbox.grow((w / 2 + this.strokeWidth) * this.scale);
  }

  /**
   * Paints the line shape.
   */
  override paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
    // Geometry of arrow
    const spacing = ARROW_SPACING;
    const width = ARROW_WIDTH;
    const arrow = ARROW_SIZE;

    // Base vector (between end points)
    const p0 = pts[0];
    const pe = pts[pts.length - 1];
    const dx = pe.x - p0.x;
    const dy = pe.y - p0.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const length = dist - 2 * spacing - arrow;

    // Computes the norm and the inverse norm
    const nx = dx / dist;
    const ny = dy / dist;
    const basex = length * nx;
    const basey = length * ny;
    const floorx = (width * ny) / 3;
    const floory = (-width * nx) / 3;

    // Computes points
    const p0x = p0.x - floorx / 2 + spacing * nx;
    const p0y = p0.y - floory / 2 + spacing * ny;
    const p1x = p0x + floorx;
    const p1y = p0y + floory;
    const p2x = p1x + basex;
    const p2y = p1y + basey;
    const p3x = p2x + floorx;
    const p3y = p2y + floory;
    // p4 not necessary
    const p5x = p3x - 3 * floorx;
    const p5y = p3y - 3 * floory;

    c.begin();
    c.moveTo(p0x, p0y);
    c.lineTo(p1x, p1y);
    c.lineTo(p2x, p2y);
    c.lineTo(p3x, p3y);
    c.lineTo(pe.x - spacing * nx, pe.y - spacing * ny);
    c.lineTo(p5x, p5y);
    c.lineTo(p5x + floorx, p5y + floory);
    c.close();

    c.fillAndStroke();
  }
}

export default ArrowShape;
