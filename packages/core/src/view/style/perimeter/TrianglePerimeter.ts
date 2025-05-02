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
import { DIRECTION } from '../../../util/Constants';
import { intersection } from '../../../util/mathUtils';

/**
 * This perimeter is registered under `trianglePerimeter` in {@link StyleRegistry} when using {@link Graph} or calling {@link registerDefaultPerimeters}.
 *
 * @category Perimeter
 */
export const TrianglePerimeter: PerimeterFunction = (
  bounds: Rectangle,
  vertex: CellState,
  next: Point,
  orthogonal = false
): Point | null => {
  const direction = vertex != null ? vertex.style.direction : null;
  const vertical = direction === DIRECTION.NORTH || direction === DIRECTION.SOUTH;

  const { x } = bounds;
  const { y } = bounds;
  const w = bounds.width;
  const h = bounds.height;

  let cx = x + w / 2;
  let cy = y + h / 2;

  let start = new Point(x, y);
  let corner = new Point(x + w, cy);
  let end = new Point(x, y + h);

  if (direction === DIRECTION.NORTH) {
    start = end;
    corner = new Point(cx, y);
    end = new Point(x + w, y + h);
  } else if (direction === DIRECTION.SOUTH) {
    corner = new Point(cx, y + h);
    end = new Point(x + w, y);
  } else if (direction === DIRECTION.WEST) {
    start = new Point(x + w, y);
    corner = new Point(x, cy);
    end = new Point(x + w, y + h);
  }

  let dx = next.x - cx;
  let dy = next.y - cy;

  const alpha = vertical ? Math.atan2(dx, dy) : Math.atan2(dy, dx);
  const t = vertical ? Math.atan2(w, h) : Math.atan2(h, w);

  let base = false;

  if (direction === DIRECTION.NORTH || direction === DIRECTION.WEST) {
    base = alpha > -t && alpha < t;
  } else {
    base = alpha < -Math.PI + t || alpha > Math.PI - t;
  }

  let result = null;

  if (base) {
    if (
      orthogonal &&
      ((vertical && next.x >= start.x && next.x <= end.x) ||
        (!vertical && next.y >= start.y && next.y <= end.y))
    ) {
      if (vertical) {
        result = new Point(next.x, start.y);
      } else {
        result = new Point(start.x, next.y);
      }
    } else if (direction === DIRECTION.NORTH) {
      result = new Point(x + w / 2 + (h * Math.tan(alpha)) / 2, y + h);
    } else if (direction === DIRECTION.SOUTH) {
      result = new Point(x + w / 2 - (h * Math.tan(alpha)) / 2, y);
    } else if (direction === DIRECTION.WEST) {
      result = new Point(x + w, y + h / 2 + (w * Math.tan(alpha)) / 2);
    } else {
      result = new Point(x, y + h / 2 - (w * Math.tan(alpha)) / 2);
    }
  } else {
    if (orthogonal) {
      const pt = new Point(cx, cy);

      if (next.y >= y && next.y <= y + h) {
        pt.x = vertical ? cx : direction === DIRECTION.WEST ? x + w : x;
        pt.y = next.y;
      } else if (next.x >= x && next.x <= x + w) {
        pt.x = next.x;
        pt.y = !vertical ? cy : direction === DIRECTION.NORTH ? y + h : y;
      }

      // Compute angle
      dx = next.x - pt.x;
      dy = next.y - pt.y;

      cx = pt.x;
      cy = pt.y;
    }

    if ((vertical && next.x <= x + w / 2) || (!vertical && next.y <= y + h / 2)) {
      result = intersection(next.x, next.y, cx, cy, start.x, start.y, corner.x, corner.y);
    } else {
      result = intersection(next.x, next.y, cx, cy, corner.x, corner.y, end.x, end.y);
    }
  }

  if (result == null) {
    result = new Point(cx, cy);
  }
  return result;
};
