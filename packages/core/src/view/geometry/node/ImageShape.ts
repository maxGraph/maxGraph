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

import RectangleShape from './RectangleShape';
import type Rectangle from '../Rectangle';
import CellState from '../../cell/CellState';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import { NONE } from '../../../util/Constants';
import { ColorValue } from '../../../types';

/**
 * Extends {@link RectangleShape} to implement an image shape.
 *
 * This shape is registered under `image` in {@link CellRenderer} when using {@link Graph} or calling {@link registerDefaultShapes}.
 *
 * @category Vertex Shapes
 */
class ImageShape extends RectangleShape {
  constructor(
    bounds: Rectangle,
    imageSrc: string,
    fill: ColorValue = '#FFFFFF',
    stroke: ColorValue = '#000000',
    strokeWidth = 1
  ) {
    super(bounds, fill, stroke, strokeWidth);

    this.imageSrc = imageSrc;
    this.shadow = false;
    this.preserveImageAspect = true;
  }

  // TODO: Document me!!
  shadow: boolean;

  /**
   * Disables offset in IE9 for crisper image output.
   */
  getSvgScreenOffset() {
    return 0;
  }

  /**
   * Overrides to replace the fill and stroke colors with the respective values from {@link imageBackground} and {@link imageBorder}.
   *
   * Applies the style of the given {@link CellState} to the shape. This implementation assigns the following styles to local fields:
   *
   * - {@link imageBackground} => fill
   * - {@link imageBorder} => stroke
   *
   * @param {CellState} state   {@link CellState} of the corresponding cell.
   */
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
