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

import type Rectangle from '../../geometry/Rectangle.js';
import type CellState from '../../cell/CellState.js';
import Point from '../../geometry/Point.js';
import type { PerimeterFunction } from '../../../types.js';
import { intersection } from '../../../util/mathUtils.js';

/**
 * This perimeter is registered under `hexagonPerimeter` in {@link PerimeterRegistry} when using {@link Graph} or calling {@link registerDefaultPerimeters}.
 *
 * @category Perimeter
 */
export const HexagonPerimeter: PerimeterFunction = (
  bounds: Rectangle,
  vertex: CellState,
  next: Point,
  orthogonal = false
): Point | null => {
  const { x } = bounds;
  const { y } = bounds;
  const w = bounds.width;
  const h = bounds.height;

  const cx = bounds.getCenterX();
  const cy = bounds.getCenterY();
  const px = next.x;
  const py = next.y;
  const dx = px - cx;
  const dy = py - cy;
  const alpha = -Math.atan2(dy, dx);
  const pi = Math.PI;
  const pi2 = Math.PI / 2;

  let result: Point | null = new Point(cx, cy);

  const direction = vertex?.style?.direction ?? 'east';
  const vertical = direction === 'north' || direction === 'south';
  let a = new Point();
  let b = new Point();

  // Only consider corrects quadrants for the orthogonal case.
  if (
    (px < x && py < y) ||
    (px < x && py > y + h) ||
    (px > x + w && py < y) ||
    (px > x + w && py > y + h)
  ) {
    orthogonal = false;
  }

  if (orthogonal) {
    if (vertical) {
      // Special cases where intersects with hexagon corners
      if (px === cx) {
        if (py <= y) {
          return new Point(cx, y);
        }
        if (py >= y + h) {
          return new Point(cx, y + h);
        }
      } else if (px < x) {
        if (py === y + h / 4) {
          return new Point(x, y + h / 4);
        }
        if (py === y + (3 * h) / 4) {
          return new Point(x, y + (3 * h) / 4);
        }
      } else if (px > x + w) {
        if (py === y + h / 4) {
          return new Point(x + w, y + h / 4);
        }
        if (py === y + (3 * h) / 4) {
          return new Point(x + w, y + (3 * h) / 4);
        }
      } else if (px === x) {
        if (py < cy) {
          return new Point(x, y + h / 4);
        }
        if (py > cy) {
          return new Point(x, y + (3 * h) / 4);
        }
      } else if (px === x + w) {
        if (py < cy) {
          return new Point(x + w, y + h / 4);
        }
        if (py > cy) {
          return new Point(x + w, y + (3 * h) / 4);
        }
      }
      if (py === y) {
        return new Point(cx, y);
      }
      if (py === y + h) {
        return new Point(cx, y + h);
      }

      if (px < cx) {
        if (py > y + h / 4 && py < y + (3 * h) / 4) {
          a = new Point(x, y);
          b = new Point(x, y + h);
        } else if (py < y + h / 4) {
          a = new Point(x - Math.floor(0.5 * w), y + Math.floor(0.5 * h));
          b = new Point(x + w, y - Math.floor(0.25 * h));
        } else if (py > y + (3 * h) / 4) {
          a = new Point(x - Math.floor(0.5 * w), y + Math.floor(0.5 * h));
          b = new Point(x + w, y + Math.floor(1.25 * h));
        }
      } else if (px > cx) {
        if (py > y + h / 4 && py < y + (3 * h) / 4) {
          a = new Point(x + w, y);
          b = new Point(x + w, y + h);
        } else if (py < y + h / 4) {
          a = new Point(x, y - Math.floor(0.25 * h));
          b = new Point(x + Math.floor(1.5 * w), y + Math.floor(0.5 * h));
        } else if (py > y + (3 * h) / 4) {
          a = new Point(x + Math.floor(1.5 * w), y + Math.floor(0.5 * h));
          b = new Point(x, y + Math.floor(1.25 * h));
        }
      }
    } else {
      // Special cases where intersects with hexagon corners
      if (py === cy) {
        if (px <= x) {
          return new Point(x, y + h / 2);
        }
        if (px >= x + w) {
          return new Point(x + w, y + h / 2);
        }
      } else if (py < y) {
        if (px === x + w / 4) {
          return new Point(x + w / 4, y);
        }
        if (px === x + (3 * w) / 4) {
          return new Point(x + (3 * w) / 4, y);
        }
      } else if (py > y + h) {
        if (px === x + w / 4) {
          return new Point(x + w / 4, y + h);
        }
        if (px === x + (3 * w) / 4) {
          return new Point(x + (3 * w) / 4, y + h);
        }
      } else if (py === y) {
        if (px < cx) {
          return new Point(x + w / 4, y);
        }
        if (px > cx) {
          return new Point(x + (3 * w) / 4, y);
        }
      } else if (py === y + h) {
        if (px < cx) {
          return new Point(x + w / 4, y + h);
        }
        if (py > cy) {
          return new Point(x + (3 * w) / 4, y + h);
        }
      }
      if (px === x) {
        return new Point(x, cy);
      }
      if (px === x + w) {
        return new Point(x + w, cy);
      }

      if (py < cy) {
        if (px > x + w / 4 && px < x + (3 * w) / 4) {
          a = new Point(x, y);
          b = new Point(x + w, y);
        } else if (px < x + w / 4) {
          a = new Point(x - Math.floor(0.25 * w), y + h);
          b = new Point(x + Math.floor(0.5 * w), y - Math.floor(0.5 * h));
        } else if (px > x + (3 * w) / 4) {
          a = new Point(x + Math.floor(0.5 * w), y - Math.floor(0.5 * h));
          b = new Point(x + Math.floor(1.25 * w), y + h);
        }
      } else if (py > cy) {
        if (px > x + w / 4 && px < x + (3 * w) / 4) {
          a = new Point(x, y + h);
          b = new Point(x + w, y + h);
        } else if (px < x + w / 4) {
          a = new Point(x - Math.floor(0.25 * w), y);
          b = new Point(x + Math.floor(0.5 * w), y + Math.floor(1.5 * h));
        } else if (px > x + (3 * w) / 4) {
          a = new Point(x + Math.floor(0.5 * w), y + Math.floor(1.5 * h));
          b = new Point(x + Math.floor(1.25 * w), y);
        }
      }
    }

    let tx = cx;
    let ty = cy;

    if (px >= x && px <= x + w) {
      tx = px;

      if (py < cy) {
        ty = y + h;
      } else {
        ty = y;
      }
    } else if (py >= y && py <= y + h) {
      ty = py;

      if (px < cx) {
        tx = x + w;
      } else {
        tx = x;
      }
    }

    result = intersection(tx, ty, next.x, next.y, a.x, a.y, b.x, b.y);
  } else {
    if (vertical) {
      const beta = Math.atan2(h / 4, w / 2);

      // Special cases where intersects with hexagon corners
      if (alpha === beta) {
        return new Point(x + w, y + Math.floor(0.25 * h));
      }
      if (alpha === pi2) {
        return new Point(x + Math.floor(0.5 * w), y);
      }
      if (alpha === pi - beta) {
        return new Point(x, y + Math.floor(0.25 * h));
      }
      if (alpha === -beta) {
        return new Point(x + w, y + Math.floor(0.75 * h));
      }
      if (alpha === -pi2) {
        return new Point(x + Math.floor(0.5 * w), y + h);
      }
      if (alpha === -pi + beta) {
        return new Point(x, y + Math.floor(0.75 * h));
      }

      if (alpha < beta && alpha > -beta) {
        a = new Point(x + w, y);
        b = new Point(x + w, y + h);
      } else if (alpha > beta && alpha < pi2) {
        a = new Point(x, y - Math.floor(0.25 * h));
        b = new Point(x + Math.floor(1.5 * w), y + Math.floor(0.5 * h));
      } else if (alpha > pi2 && alpha < pi - beta) {
        a = new Point(x - Math.floor(0.5 * w), y + Math.floor(0.5 * h));
        b = new Point(x + w, y - Math.floor(0.25 * h));
      } else if (
        (alpha > pi - beta && alpha <= pi) ||
        (alpha < -pi + beta && alpha >= -pi)
      ) {
        a = new Point(x, y);
        b = new Point(x, y + h);
      } else if (alpha < -beta && alpha > -pi2) {
        a = new Point(x + Math.floor(1.5 * w), y + Math.floor(0.5 * h));
        b = new Point(x, y + Math.floor(1.25 * h));
      } else if (alpha < -pi2 && alpha > -pi + beta) {
        a = new Point(x - Math.floor(0.5 * w), y + Math.floor(0.5 * h));
        b = new Point(x + w, y + Math.floor(1.25 * h));
      }
    } else {
      const beta = Math.atan2(h / 2, w / 4);

      // Special cases where intersects with hexagon corners
      if (alpha === beta) {
        return new Point(x + Math.floor(0.75 * w), y);
      }
      if (alpha === pi - beta) {
        return new Point(x + Math.floor(0.25 * w), y);
      }
      if (alpha === pi || alpha === -pi) {
        return new Point(x, y + Math.floor(0.5 * h));
      }
      if (alpha === 0) {
        return new Point(x + w, y + Math.floor(0.5 * h));
      }
      if (alpha === -beta) {
        return new Point(x + Math.floor(0.75 * w), y + h);
      }
      if (alpha === -pi + beta) {
        return new Point(x + Math.floor(0.25 * w), y + h);
      }

      if (alpha > 0 && alpha < beta) {
        a = new Point(x + Math.floor(0.5 * w), y - Math.floor(0.5 * h));
        b = new Point(x + Math.floor(1.25 * w), y + h);
      } else if (alpha > beta && alpha < pi - beta) {
        a = new Point(x, y);
        b = new Point(x + w, y);
      } else if (alpha > pi - beta && alpha < pi) {
        a = new Point(x - Math.floor(0.25 * w), y + h);
        b = new Point(x + Math.floor(0.5 * w), y - Math.floor(0.5 * h));
      } else if (alpha < 0 && alpha > -beta) {
        a = new Point(x + Math.floor(0.5 * w), y + Math.floor(1.5 * h));
        b = new Point(x + Math.floor(1.25 * w), y);
      } else if (alpha < -beta && alpha > -pi + beta) {
        a = new Point(x, y + h);
        b = new Point(x + w, y + h);
      } else if (alpha < -pi + beta && alpha > -pi) {
        a = new Point(x - Math.floor(0.25 * w), y);
        b = new Point(x + Math.floor(0.5 * w), y + Math.floor(1.5 * h));
      }
    }

    result = intersection(cx, cy, next.x, next.y, a.x, a.y, b.x, b.y);
  }

  if (result == null) {
    return new Point(cx, cy);
  }
  return result;
};
