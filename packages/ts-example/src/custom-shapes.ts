/*
Copyright 2022-present The maxGraph project Contributors

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

import type { AbstractCanvas2D } from '@maxgraph/core';
import { EllipseShape, RectangleShape, ShapeRegistry } from '@maxgraph/core';

// The renderer builds a registered shape with no argument, so these defaults cannot come from a constructor. They are
// also derived from the style, so `resetStyles()` wipes them on every style change. Each one is therefore declared
// twice, as a class field for the first render and in a `resetStyles()` override for every later change, which is why
// it is a named constant rather than a literal.
const RECTANGLE_STROKE_WIDTH = 3;
const RECTANGLE_IS_ROUNDED = true; // force rounded shape
const ELLIPSE_STROKE_WIDTH = 5;

export const registerCustomShapes = (): void => {
  ShapeRegistry.add('customRectangle', CustomRectangleShape);
  ShapeRegistry.add('customEllipse', CustomEllipseShape);
};

class CustomRectangleShape extends RectangleShape {
  override strokeWidth = RECTANGLE_STROKE_WIDTH;
  override isRounded = RECTANGLE_IS_ROUNDED;

  override resetStyles(): void {
    super.resetStyles();
    this.strokeWidth = RECTANGLE_STROKE_WIDTH;
    this.isRounded = RECTANGLE_IS_ROUNDED;
  }

  override paintBackground(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    c.setFillColor('Chartreuse');
    super.paintBackground(c, x, y, w, h);
  }

  override paintVertexShape(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    c.setStrokeColor('Black');
    super.paintVertexShape(c, x, y, w, h);
  }
}

class CustomEllipseShape extends EllipseShape {
  override strokeWidth = ELLIPSE_STROKE_WIDTH;

  override resetStyles(): void {
    super.resetStyles();
    this.strokeWidth = ELLIPSE_STROKE_WIDTH;
  }

  override paintVertexShape(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    c.setFillColor('Yellow');
    c.setStrokeColor('Red');
    super.paintVertexShape(c, x, y, w, h);
  }
}
