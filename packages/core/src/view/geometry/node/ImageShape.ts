/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import RectangleShape from './RectangleShape';
import Rectangle from '../Rectangle';
import CellState from '../../cell/CellState';
import AbstractCanvas2D from '../../canvas/SvgCanvas2D';
import CellOverlay from '../../cell/CellOverlay';
import { NONE } from '../../../util/Constants';
import { ColorValue } from '../../../types';

/**
 * Extends {@link mxShape} to implement an image shape.
 * This shape is registered under {@link mxConstants.SHAPE_IMAGE} in {@link cellRenderer}.
 *
 * @class ImageShape
 * @extends {RectangleShape}
 */
class ImageShape extends RectangleShape {
  constructor(
    bounds: Rectangle,
    imageSrc: string,
    fill: ColorValue = '#FFFFFF',
    stroke: ColorValue = '#000000',
    strokeWidth: number = 1
  ) {
    super(bounds, fill, stroke, strokeWidth);

    this.imageSrc = imageSrc;
    this.shadow = false;
  }

  // TODO: Document me!!
  shadow: boolean;

  imageSrc: string;

  // Used in mxCellRenderer
  overlay: CellOverlay | null = null;

  /**
   * Switch to preserve image aspect. Default is true.
   * @default true
   */
  // preserveImageAspect: boolean;
  preserveImageAspect = true;

  /**
   * Disables offset in IE9 for crisper image output.
   */
  getSvgScreenOffset() {
    return 0;
  }

  /**
   * Overrides {@link mxShape.apply} to replace the fill and stroke colors with the
   * respective values from {@link 'imageBackground'} and
   * {@link 'imageBorder'}.
   *
   * Applies the style of the given {@link CellState} to the shape. This
   * implementation assigns the following styles to local fields:
   *
   * - {@link 'imageBackground'} => fill
   * - {@link 'imageBorder'} => stroke
   *
   * @param {CellState} state   {@link CellState} of the corresponding cell.
   */
  // apply(state: CellState): void;
  apply(state: CellState) {
    super.apply(state);

    this.fill = NONE;
    this.stroke = NONE;
    this.gradient = NONE;

    if (this.style && this.style.imageAspect != null) {
      this.preserveImageAspect = this.style.imageAspect;
    }
  }

  /**
   * Returns true if HTML is allowed for this shape. This implementation always
   * returns false.
   */
  isHtmlAllowed() {
    return !this.preserveImageAspect;
  }

  /**
   * Creates and returns the HTML DOM node(s) to represent
   * this shape. This implementation falls back to <createVml>
   * so that the HTML creation is optional.
   */
  createHtml() {
    const node = document.createElement('div');
    node.style.position = 'absolute';
    return node;
  }

  /**
   * Disables inherited roundable support.
   */
  isRoundable(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    return false;
  }

  /**
   * Generic background painting implementation.
   */
  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    if (this.imageSrc) {
      const fill = this.style?.imageBackground ?? NONE;
      const stroke = this.style?.imageBorder ?? NONE;

      if (fill !== NONE) {
        // Stroke rendering required for shadow
        c.setFillColor(fill);
        c.setStrokeColor(stroke);
        c.rect(x, y, w, h);
        c.fillAndStroke();
      }

      // FlipH/V are implicit via mxShape.updateTransform
      c.image(x, y, w, h, this.imageSrc, this.preserveImageAspect, false, false);

      if (stroke !== NONE) {
        c.setShadow(false);
        c.setStrokeColor(stroke);
        c.rect(x, y, w, h);
        c.stroke();
      }
    } else {
      this.paintBackground(c, x, y, w, h);
    }
  }
}

export default ImageShape;
