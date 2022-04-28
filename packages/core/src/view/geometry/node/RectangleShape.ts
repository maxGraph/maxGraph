/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import {
  LINE_ARCSIZE,
  NONE,
  RECTANGLE_ROUNDING_FACTOR,
} from '../../../util/Constants';
import Shape from '../Shape';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import Rectangle from '../Rectangle';
import { ColorValue } from '../../../types';

/**
 * Extends {@link Shape} to implement a rectangle shape.
 * This shape is registered under {@link mxConstants.SHAPE_RECTANGLE} in {@link cellRenderer}.
 * @class RectangleShape
 * @extends {Shape}
 */
class RectangleShape extends Shape {
  constructor(
    bounds: Rectangle,
    fill: ColorValue,
    stroke: ColorValue,
    strokeWidth: number = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Returns true for non-rounded, non-rotated shapes with no glass gradient.
   */
  isHtmlAllowed() {
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
  paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    let events = true;

    if (this.style && this.style.pointerEvents != null) {
      events = this.style.pointerEvents;
    }

    if (events || this.fill !== NONE || this.stroke !== NONE) {
      if (!events && this.fill === NONE) {
        c.pointerEvents = false;
      }

      if (this.isRounded) {
        let r = 0;

        if (this.style?.absoluteArcSize ?? false) {
          r = Math.min(w / 2, Math.min(h / 2, (this.style?.arcSize ?? LINE_ARCSIZE) / 2));
        } else {
          const f = (this.style?.arcSize ?? RECTANGLE_ROUNDING_FACTOR * 100) / 100;
          r = Math.min(w * f, h * f);
        }

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
  isRoundable(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    return true;
  }

  /**
   * Generic background painting implementation.
   */
  paintForeground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number): void {
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
