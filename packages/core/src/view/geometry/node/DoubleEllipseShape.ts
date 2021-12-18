/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Rectangle from '../Rectangle';
import Shape from '../Shape';
import AbstractCanvas2D from '../../../view/canvas/AbstractCanvas2D';

/**
 * Extends {@link Shape} to implement a double ellipse shape.
 *
 * This shape is registered under {@link mxConstants.SHAPE_DOUBLE_ELLIPSE} in {@link cellRenderer}.
 *
 * Use the following override to only fill the inner ellipse in this shape:
 * @example
 * ```javascript
 * mxDoubleEllipse.prototype.paintVertexShape = function(c, x, y, w, h)
 * {
 *   c.ellipse(x, y, w, h);
 *   c.stroke();
 *
 *   var inset = mxUtils.getValue(this.style, 'margin', Math.min(3 + this.strokewidth, Math.min(w / 5, h / 5)));
 *   x += inset;
 *   y += inset;
 *   w -= 2 * inset;
 *   h -= 2 * inset;
 *
 *   if (w > 0 && h > 0)
 *   {
 *     c.ellipse(x, y, w, h);
 *   }
 *
 *   c.fillAndStroke();
 * };
 * ```
 */
class DoubleEllipseShape extends Shape {
  constructor(bounds: Rectangle, fill: string, stroke: string, strokeWidth = 1) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Paints the background.
   */
  paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    c.ellipse(x, y, w, h);
    c.fillAndStroke();
  }

  /**
   * Paints the foreground.
   */
  paintForeground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    if (!this.outline) {
      const margin =
        this.style?.margin ?? Math.min(3 + this.strokeWidth, Math.min(w / 5, h / 5));

      x += margin;
      y += margin;
      w -= 2 * margin;
      h -= 2 * margin;

      // FIXME: Rounding issues in IE8 standards mode (not in 1.x)
      if (w > 0 && h > 0) {
        c.ellipse(x, y, w, h);
      }

      c.stroke();
    }
  }

  /**
   * @returns the bounds for the label.
   */
  getLabelBounds(rect: Rectangle) {
    const margin =
      this.style?.margin ??
      Math.min(
        3 + this.strokeWidth,
        Math.min(rect.width / 5 / this.scale, rect.height / 5 / this.scale)
      ) * this.scale;

    return new Rectangle(
      rect.x + margin,
      rect.y + margin,
      rect.width - 2 * margin,
      rect.height - 2 * margin
    );
  }
}

export default DoubleEllipseShape;
