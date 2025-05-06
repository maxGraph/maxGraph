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

/**
 * Describes a rectangular perimeter for the given bounds.
 *
 * This perimeter is registered under `rectanglePerimeter` in {@link PerimeterRegistry} when using {@link Graph} or calling {@link registerDefaultPerimeters}.
 *
 * @category Perimeter
 */
export const RectanglePerimeter: PerimeterFunction = (
  bounds: Rectangle,
  _vertex: CellState,
  next: Point,
  orthogonal = false
): Point => {
  const cx = bounds.getCenterX();
  const cy = bounds.getCenterY();
  const dx = next.x - cx;
  const dy = next.y - cy;
  const alpha = Math.atan2(dy, dx);
  const p = new Point(0, 0);
  const pi = Math.PI;
  const pi2 = Math.PI / 2;
  const beta = pi2 - alpha;
  const t = Math.atan2(bounds.height, bounds.width);

  if (alpha < -pi + t || alpha > pi - t) {
    // Left edge
    p.x = bounds.x;
    p.y = cy - (bounds.width * Math.tan(alpha)) / 2;
  } else if (alpha < -t) {
    // Top Edge
    p.y = bounds.y;
    p.x = cx - (bounds.height * Math.tan(beta)) / 2;
  } else if (alpha < t) {
    // Right Edge
    p.x = bounds.x + bounds.width;
    p.y = cy + (bounds.width * Math.tan(alpha)) / 2;
  } else {
    // Bottom Edge
    p.y = bounds.y + bounds.height;
    p.x = cx + (bounds.height * Math.tan(beta)) / 2;
  }

  if (orthogonal) {
    if (next.x >= bounds.x && next.x <= bounds.x + bounds.width) {
      p.x = next.x;
    } else if (next.y >= bounds.y && next.y <= bounds.y + bounds.height) {
      p.y = next.y;
    }
    if (next.x < bounds.x) {
      p.x = bounds.x;
    } else if (next.x > bounds.x + bounds.width) {
      p.x = bounds.x + bounds.width;
    }
    if (next.y < bounds.y) {
      p.y = bounds.y;
    } else if (next.y > bounds.y + bounds.height) {
      p.y = bounds.y + bounds.height;
    }
  }

  return p;
};
