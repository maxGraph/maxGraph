/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { intersection } from '../../util/utils';
import Point from '../geometry/Point';
import {
  DIRECTION_EAST,
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  DIRECTION_WEST,
} from '../../util/constants';
import Rectangle from '../geometry/Rectangle';
import CellState from '../cell/CellState';
import { CellStateStyles } from '../../types';

/**
 * @class Perimeter
 *
 * Provides various perimeter functions to be used in a style
 * as the value of {@link mxConstants.STYLE_PERIMETER}. Perimeters for
 * rectangle, circle, rhombus and triangle are available.
 *
 * ### Example
 *
 * @example
 * ```javascript
 * <add as="perimeter">mxPerimeter.RectanglePerimeter</add>
 * ```
 *
 * ### Or programmatically
 *
 * @example
 * ```javascript
 * style.perimiter = mxPerimeter.RectanglePerimeter;
 * ```
 *
 * When adding new perimeter functions, it is recommended to use the
 * mxPerimeter-namespace as follows:
 *
 * @example
 * ```javascript
 * mxPerimeter.CustomPerimeter = function (bounds, vertex, next, orthogonal)
 * {
 *   var x = 0; // Calculate x-coordinate
 *   var y = 0; // Calculate y-coordainte
 *
 *   return new mxPoint(x, y);
 * }
 * ```
 *
 * #### The new perimeter should then be registered in the {@link mxStyleRegistry} as follows
 * @example
 * ```javascript
 * mxStyleRegistry.putValue('customPerimeter', mxPerimeter.CustomPerimeter);
 * ```
 *
 * #### The custom perimeter above can now be used in a specific vertex as follows:
 *
 * @example
 * ```javascript
 * model.setStyle(vertex, 'perimeter=customPerimeter');
 * ```
 *
 * Note that the key of the {@link mxStyleRegistry} entry for the function should
 * be used in string values, unless {@link view.allowEval} is true, in
 * which case you can also use mxPerimeter.CustomPerimeter for the value in
 * the cell style above.
 *
 * #### Or it can be used for all vertices in the graph as follows:
 *
 * @example
 * ```javascript
 * var style = graph.getStylesheet().getDefaultVertexStyle();
 * style.perimiter = mxPerimeter.CustomPerimeter;
 * ```
 *
 * Note that the object can be used directly when programmatically setting
 * the value, but the key in the {@link mxStyleRegistry} should be used when
 * setting the value via a key, value pair in a cell style.
 *
 * The parameters are explained in {@link RectanglePerimeter}.
 */
class Perimeter {
  /**
   * Describes a rectangular perimeter for the given bounds.
   *
   * @param bounds {@link mxRectangle} that represents the absolute bounds of the
   * vertex.
   * @param vertex {@link CellState} that represents the vertex.
   * @param next {@link mxPoint} that represents the nearest neighbour point on the
   * given edge.
   * @param orthogonal Boolean that specifies if the orthogonal projection onto
   * the perimeter should be returned. If this is false then the intersection
   * of the perimeter and the line between the next and the center point is
   * returned.
   */
  static RectanglePerimeter(
    bounds: Rectangle,
    vertex: CellState,
    next: Point,
    orthogonal: boolean = false
  ): Point {
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
  }

  /**
   * Describes an elliptic perimeter. See {@link RectanglePerimeter}
   * for a description of the parameters.
   */
  static EllipsePerimeter(
    bounds: Rectangle,
    vertex: CellState,
    next: Point,
    orthogonal: boolean = false
  ): Point {
    const { x } = bounds;
    const { y } = bounds;
    const a = bounds.width / 2;
    const b = bounds.height / 2;
    const cx = x + a;
    const cy = y + b;
    const px = next.x;
    const py = next.y;

    // Calculates straight line equation through
    // point and ellipse center y = d * x + h
    const dx = parseInt(String(px - cx));
    const dy = parseInt(String(py - cy));

    if (dx === 0 && dy !== 0) {
      return new Point(cx, cy + (b * dy) / Math.abs(dy));
    }
    if (dx === 0 && dy === 0) {
      return new Point(px, py);
    }

    if (orthogonal) {
      if (py >= y && py <= y + bounds.height) {
        const ty = py - cy;
        let tx = Math.sqrt(a * a * (1 - (ty * ty) / (b * b))) || 0;

        if (px <= x) {
          tx = -tx;
        }

        return new Point(cx + tx, py);
      }

      if (px >= x && px <= x + bounds.width) {
        const tx = px - cx;
        let ty = Math.sqrt(b * b * (1 - (tx * tx) / (a * a))) || 0;

        if (py <= y) {
          ty = -ty;
        }

        return new Point(px, cy + ty);
      }
    }

    // Calculates intersection
    const d = dy / dx;
    const h = cy - d * cx;
    const e = a * a * d * d + b * b;
    const f = -2 * cx * e;
    const g = a * a * d * d * cx * cx + b * b * cx * cx - a * a * b * b;
    const det = Math.sqrt(f * f - 4 * e * g);

    // Two solutions (perimeter points)
    const xout1 = (-f + det) / (2 * e);
    const xout2 = (-f - det) / (2 * e);
    const yout1 = d * xout1 + h;
    const yout2 = d * xout2 + h;
    const dist1 = Math.sqrt(Math.pow(xout1 - px, 2) + Math.pow(yout1 - py, 2));
    const dist2 = Math.sqrt(Math.pow(xout2 - px, 2) + Math.pow(yout2 - py, 2));

    // Correct solution
    let xout = 0;
    let yout = 0;

    if (dist1 < dist2) {
      xout = xout1;
      yout = yout1;
    } else {
      xout = xout2;
      yout = yout2;
    }

    return new Point(xout, yout);
  }

  /**
   * Describes a rhombus (aka diamond) perimeter. See {@link RectanglePerimeter}
   * for a description of the parameters.
   */
  static RhombusPerimeter(
    bounds: Rectangle,
    vertex: CellState,
    next: Point,
    orthogonal: boolean = false
  ): Point | null {
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
  }

  /**
   * Describes a triangle perimeter. See {@link RectanglePerimeter}
   * for a description of the parameters.
   */
  static TrianglePerimeter(
    bounds: Rectangle,
    vertex: CellState,
    next: Point,
    orthogonal: boolean = false
  ): Point | null {
    const direction = vertex != null ? vertex.style.direction : null;
    const vertical = direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH;

    const { x } = bounds;
    const { y } = bounds;
    const w = bounds.width;
    const h = bounds.height;

    let cx = x + w / 2;
    let cy = y + h / 2;

    let start = new Point(x, y);
    let corner = new Point(x + w, cy);
    let end = new Point(x, y + h);

    if (direction === DIRECTION_NORTH) {
      start = end;
      corner = new Point(cx, y);
      end = new Point(x + w, y + h);
    } else if (direction === DIRECTION_SOUTH) {
      corner = new Point(cx, y + h);
      end = new Point(x + w, y);
    } else if (direction === DIRECTION_WEST) {
      start = new Point(x + w, y);
      corner = new Point(x, cy);
      end = new Point(x + w, y + h);
    }

    let dx = next.x - cx;
    let dy = next.y - cy;

    const alpha = vertical ? Math.atan2(dx, dy) : Math.atan2(dy, dx);
    const t = vertical ? Math.atan2(w, h) : Math.atan2(h, w);

    let base = false;

    if (direction === DIRECTION_NORTH || direction === DIRECTION_WEST) {
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
      } else if (direction === DIRECTION_NORTH) {
        result = new Point(x + w / 2 + (h * Math.tan(alpha)) / 2, y + h);
      } else if (direction === DIRECTION_SOUTH) {
        result = new Point(x + w / 2 - (h * Math.tan(alpha)) / 2, y);
      } else if (direction === DIRECTION_WEST) {
        result = new Point(x + w, y + h / 2 + (w * Math.tan(alpha)) / 2);
      } else {
        result = new Point(x, y + h / 2 - (w * Math.tan(alpha)) / 2);
      }
    } else {
      if (orthogonal) {
        const pt = new Point(cx, cy);

        if (next.y >= y && next.y <= y + h) {
          pt.x = vertical ? cx : direction === DIRECTION_WEST ? x + w : x;
          pt.y = next.y;
        } else if (next.x >= x && next.x <= x + w) {
          pt.x = next.x;
          pt.y = !vertical ? cy : direction === DIRECTION_NORTH ? y + h : y;
        }

        // Compute angle
        dx = next.x - pt.x;
        dy = next.y - pt.y;

        cx = pt.x;
        cy = pt.y;
      }

      if ((vertical && next.x <= x + w / 2) || (!vertical && next.y <= y + h / 2)) {
        result = intersection(
          next.x,
          next.y,
          cx,
          cy,
          start.x,
          start.y,
          corner.x,
          corner.y
        );
      } else {
        result = intersection(next.x, next.y, cx, cy, corner.x, corner.y, end.x, end.y);
      }
    }

    if (result == null) {
      result = new Point(cx, cy);
    }
    return result;
  }

  /**
   * Describes a hexagon perimeter. See {@link RectanglePerimeter}
   * for a description of the parameters.
   */
  static HexagonPerimeter(
    bounds: Rectangle,
    vertex: CellState,
    next: Point,
    orthogonal: boolean = false
  ): Point | null {
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

    const direction =
      vertex != null
        ? Perimeter.getValue(vertex.style, 'direction', DIRECTION_EAST)
        : DIRECTION_EAST;
    const vertical = direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH;
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
  }

  private static getValue(
    style: CellStateStyles,
    direction: string,
    DIRECTION_EAST: string
  ) {
    return '';
  }
}

export default Perimeter;
