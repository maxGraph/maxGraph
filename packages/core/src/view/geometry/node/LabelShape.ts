/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Rectangle from '../Rectangle';
import {
  ALIGN,
  DEFAULT_IMAGESIZE,
  NONE,
} from '../../../util/constants';
import RectangleShape from './RectangleShape';
import { ColorValue } from '../../../types';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';

/**
 * Extends {@link Shape} to implement an image shape with a label.
 * This shape is registered under {@link Constants#SHAPE_LABEL} in
 * {@link CellRenderer}.
 *
 * Constructor: mxLabel
 *
 * Constructs a new label shape.
 *
 * @param bounds {@link Rectangle} that defines the bounds. This is stored in
 * {@link Shape#bounds}.
 * @param fill String that defines the fill color. This is stored in <fill>.
 * @param stroke String that defines the stroke color. This is stored in <stroke>.
 * @param strokewidth Optional integer that defines the stroke width. Default is
 * 1. This is stored in <strokewidth>.
 */
class LabelShape extends RectangleShape {
  constructor(
    bounds: Rectangle,
    fill: ColorValue,
    stroke: ColorValue,
    strokeWidth: number
  ) {
    super(bounds, fill, stroke, strokeWidth);
  }

  /**
   * Default width and height for the image.
   * @default mxConstants.DEFAULT_IMAGESIZE
   */
  imageSize = DEFAULT_IMAGESIZE;

  imageSrc: string | null = null;

  /**
   * Default value for image spacing
   * @type {number}
   * @default 2
   */
  spacing = 2;

  /**
   * Default width and height for the indicicator.
   * @type {number}
   * @default 10
   */
  indicatorSize = 10;

  /**
   * Default spacing between image and indicator
   * @default 2
   * @type {number}
   */
  indicatorSpacing = 2;

  indicatorImageSrc: string | null = null;

  /**
   * Initializes the shape and the <indicator>.
   */
  init(container: SVGElement) {
    super.init(container);

    if (this.indicatorShape) {
      this.indicator = new this.indicatorShape();
      this.indicator.dialect = this.dialect;
      this.indicator.init(this.node);
    }
  }

  /**
   * Reconfigures this shape. This will update the colors of the indicator
   * and reconfigure it if required.
   */
  redraw() {
    if (this.indicator) {
      this.indicator.fill = this.indicatorColor;
      this.indicator.stroke = this.indicatorStrokeColor;
      this.indicator.gradient = this.indicatorGradientColor;
      this.indicator.direction = this.indicatorDirection;
      this.indicator.redraw();
    }
    super.redraw();
  }

  /**
   * Returns true for non-rounded, non-rotated shapes with no glass gradient and
   * no indicator shape.
   */
  isHtmlAllowed() {
    return super.isHtmlAllowed() && this.indicatorColor === NONE && !!this.indicatorShape;
  }

  /**
   * Generic background painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  paintForeground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    this.paintImage(c, x, y, w, h);
    this.paintIndicator(c, x, y, w, h);
    super.paintForeground(c, x, y, w, h);
  }

  /**
   * Generic background painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  paintImage(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    if (this.imageSrc) {
      const bounds = this.getImageBounds(x, y, w, h);
      c.image(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        this.imageSrc,
        false,
        false,
        false
      );
    }
  }

  /**
   * Generic background painting implementation.
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  getImageBounds(x: number, y: number, w: number, h: number) {
    const align = this.style?.imageAlign ?? ALIGN.LEFT;
    const valign = this.style?.verticalAlign ?? ALIGN.MIDDLE;
    const width = this.style?.imageWidth ?? DEFAULT_IMAGESIZE;
    const height = this.style?.imageHeight ?? DEFAULT_IMAGESIZE;
    const spacing = this.style?.spacing ?? this.spacing + 5;

    if (align === ALIGN.CENTER) {
      x += (w - width) / 2;
    } else if (align === ALIGN.RIGHT) {
      x += w - width - spacing;
    } // default is left
    else {
      x += spacing;
    }

    if (valign === ALIGN.TOP) {
      y += spacing;
    } else if (valign === ALIGN.BOTTOM) {
      y += h - height - spacing;
    } // default is middle
    else {
      y += (h - height) / 2;
    }

    return new Rectangle(x, y, width, height);
  }

  /**
   * Generic background painting implementation.
   * @param {mxAbstractCanvas2D} c
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  paintIndicator(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    if (this.indicator) {
      this.indicator.bounds = this.getIndicatorBounds(x, y, w, h);
      this.indicator.paint(c);
    } else if (this.indicatorImageSrc) {
      const bounds = this.getIndicatorBounds(x, y, w, h);
      c.image(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        this.indicatorImageSrc,
        false,
        false,
        false
      );
    }
  }

  /**
   * Generic background painting implementation.
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @returns {Rectangle}
   */
  getIndicatorBounds(x: number, y: number, w: number, h: number) {
    const align = this.style?.imageAlign ?? ALIGN.LEFT;
    const valign = this.style?.verticalAlign ?? ALIGN.MIDDLE;
    const width = this.style?.indicatorWidth ?? this.indicatorSize;
    const height = this.style?.indicatorHeight ?? this.indicatorSize;
    const spacing = this.spacing + 5;

    if (align === ALIGN.RIGHT) {
      x += w - width - spacing;
    } else if (align === ALIGN.CENTER) {
      x += (w - width) / 2;
    } // default is left
    else {
      x += spacing;
    }

    if (valign === ALIGN.BOTTOM) {
      y += h - height - spacing;
    } else if (valign === ALIGN.TOP) {
      y += spacing;
    } // default is middle
    else {
      y += (h - height) / 2;
    }

    return new Rectangle(x, y, width, height);
  }

  /**
   * Generic background painting implementation.
   */
  redrawHtmlShape() {
    super.redrawHtmlShape();

    // Removes all children
    while (this.node.hasChildNodes()) {
      this.node.removeChild(this.node.lastChild as ChildNode);
    }

    if (this.imageSrc && this.bounds) {
      const node = document.createElement('img');
      node.style.position = 'relative';
      node.setAttribute('border', '0');

      const bounds = this.getImageBounds(
        this.bounds.x,
        this.bounds.y,
        this.bounds.width,
        this.bounds.height
      );
      bounds.x -= this.bounds.x;
      bounds.y -= this.bounds.y;

      node.style.left = `${Math.round(bounds.x)}px`;
      node.style.top = `${Math.round(bounds.y)}px`;
      node.style.width = `${Math.round(bounds.width)}px`;
      node.style.height = `${Math.round(bounds.height)}px`;

      node.src = this.imageSrc;

      this.node.appendChild(node);
    }
  }
}

export default LabelShape;
