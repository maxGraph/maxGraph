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

import { NONE } from '../../../util/Constants.js';
import Shape from '../Shape.js';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import Rectangle from '../../geometry/Rectangle.js';
import { ColorValue } from '../../../types.js';

/**
 * Extends {@link Shape} to implement a rectangle shape.
 *
 * This shape is registered under `rectangle` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class RectangleShape extends Shape {
  constructor(bounds: Rectangle, fill: ColorValue, stroke: ColorValue, strokeWidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Returns true for non-rounded, non-rotated shapes with no glass gradient.
   */
  override isHtmlAllowed() {
    let events = true;

    if (this.style && this.style.pointerEvents != null) {
      events = this.style.pointerEvents;
    }

    return (
      !this.isRounded &&
      !this.glass &&
      this.rotation === 0 &&
      (events || this.fill !== NONE)
    );
  }

  /**
   * Generic background painting implementation.
   */
  override paintBackground(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    let events = true;

    if (this.style && this.style.pointerEvents != null) {
      events = this.style.pointerEvents;
    }

    if (events || this.fill !== NONE || this.stroke !== NONE) {
      if (!events && this.fill === NONE) {
        c.pointerEvents = false;
      }

      if (this.isRounded) {
        const r = this.getArcSize(w, h);
        c.roundrect(x, y, w, h, r, r);
      } else {
        c.rect(x, y, w, h);
      }

      c.fillAndStroke();
    }
  }

  /**
   * Adds roundable support.
   */
  override isRoundable(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    return true;
  }

  /**
   * Generic background painting implementation.
   */
  override paintForeground(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    if (this.glass && !this.outline && this.fill !== NONE) {
      this.paintGlassEffect(
        c,
        x,
        y,
        w,
        h,
        this.getArcSize(w + this.strokeWidth, h + this.strokeWidth)
      );
    }
  }
}

export default RectangleShape;
