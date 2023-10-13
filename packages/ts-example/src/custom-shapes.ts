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

import type { AbstractCanvas2D, ColorValue, Rectangle } from '@maxgraph/core';
import { CellRenderer, EllipseShape, RectangleShape } from '@maxgraph/core';

export function registerCustomShapes(): void {
  console.info('Registering custom shapes...');
  // @ts-ignore TODO fix CellRenderer. Calls to this function are also marked as 'ts-ignore' in CellRenderer
  CellRenderer.registerShape('customRectangle', CustomRectangleShape);
  // @ts-ignore
  CellRenderer.registerShape('customEllipse', CustomEllipseShape);
  console.info('Custom shapes registered');
}

class CustomRectangleShape extends RectangleShape {
  constructor(bounds: Rectangle, fill: ColorValue, stroke: ColorValue) {
    super(bounds, fill, stroke, 3);
    this.isRounded = true; // force rounded shape
  }

  paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number): void {
    c.setFillColor('Chartreuse');
    super.paintBackground(c, x, y, w, h);
  }

  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    c.setStrokeColor('Black');
    super.paintVertexShape(c, x, y, w, h);
  }
}

class CustomEllipseShape extends EllipseShape {
  constructor(bounds: Rectangle, fill: string, stroke: string) {
    super(bounds, fill, stroke, 5);
  }

  paintVertexShape(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
    c.setFillColor('Yellow');
    c.setStrokeColor('Red');
    super.paintVertexShape(c, x, y, w, h);
  }
}
