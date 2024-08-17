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

import type Rectangle from '../../geometry/Rectangle';
import type CellState from '../../cell/CellState';
import Point from '../../geometry/Point';
import type { PerimeterFunction } from '../../../types';
import { intersection } from '../../../util/mathUtils';

/**
 * @category Perimeter
 */
export const RhombusPerimeter: PerimeterFunction = (
  bounds: Rectangle,
  _vertex: CellState,
  next: Point,
  orthogonal = false
): Point | null => {
  const { x } = bounds;
  const { y } = bounds;
  const w = bounds.width;
  const h = bounds.height;

  const cx = x + w / 2;
  const cy = y + h / 2;

  const px = next.x;
  const py = next.y;

  // Special case for intersecting the diamond's corners
  if (cx === px) {
    if (cy > py) {
      return new Point(cx, y); // top
    }
    return new Point(cx, y + h); // bottom
  }
  if (cy === py) {
    if (cx > px) {
      return new Point(x, cy); // left
    }
    return new Point(x + w, cy); // right
  }

  let tx = cx;
  let ty = cy;

  if (orthogonal) {
    if (px >= x && px <= x + w) {
      tx = px;
    } else if (py >= y && py <= y + h) {
      ty = py;
    }
  }

  // In which quadrant will the intersection be?
  // set the slope and offset of the border line accordingly
  if (px < cx) {
    if (py < cy) {
      return intersection(px, py, tx, ty, cx, y, x, cy);
    }
    return intersection(px, py, tx, ty, cx, y + h, x, cy);
  }
  if (py < cy) {
    return intersection(px, py, tx, ty, cx, y, x + w, cy);
  }
  return intersection(px, py, tx, ty, cx, y + h, x + w, cy);
};
