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
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import Rectangle from '../../geometry/Rectangle.js';
import { NONE } from '../../../util/Constants.js';

/**
 * Extends {@link Shape} to implement a cylinder shape.
 *
 * This shape is registered under `cylinder` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * If a custom shape with one filled area and an overlay path is needed, then this shape's {@link redrawPath} should be overridden.
 *
 * @category Vertex Shapes
 */
class CylinderShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokeWidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Defines the maximum height of the top and bottom part of the cylinder shape.
   */
  maxHeight = 40;

  /**
   * Sets stroke tolerance to 0 for SVG.
   */
  override svgStrokeTolerance = 0;

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
    this.redrawPath(c, x, y, w, h, false);
    c.fillAndStroke();

    if (!this.outline || !this.style || !(this.style.backgroundOutline ?? false)) {
      c.setShadow(false);
      c.begin();
      this.redrawPath(c, x, y, w, h, true);
      c.stroke();
    }
  }

  /**
   * Redirects to redrawPath for subclasses to work.
   */
  getCylinderSize(x: number, y: number, w: number, h: number) {
    return Math.min(this.maxHeight, Math.round(h / 5));
  }

  /**
   * Draws the path for this shape.
   */
  redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number,
    isForeground = false
  ): void {
    const dy = this.getCylinderSize(x, y, w, h);

    if ((isForeground && this.fill !== NONE) || (!isForeground && this.fill === NONE)) {
      c.moveTo(0, dy);
      c.curveTo(0, 2 * dy, w, 2 * dy, w, dy);

      // Needs separate shapes for correct hit-detection
      if (!isForeground) {
        c.stroke();
        c.begin();
      }
    }

    if (!isForeground) {
      c.moveTo(0, dy);
      c.curveTo(0, -dy / 3, w, -dy / 3, w, dy);
      c.lineTo(w, h - dy);
      c.curveTo(w, h + dy / 3, 0, h + dy / 3, 0, h - dy);
      c.close();
    }
  }
}

export default CylinderShape;
