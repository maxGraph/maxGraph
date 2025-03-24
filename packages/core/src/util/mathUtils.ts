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

import { DIRECTION, DIRECTION_MASK } from './Constants';
import Point from '../view/geometry/Point';
import Rectangle from '../view/geometry/Rectangle';
import CellState from '../view/cell/CellState';
import type { CellStateStyle } from '../types';
import { isNullish } from './Utils';

/**
 * Converts the given degree to radians.
 */
export const toRadians = (deg: number) => {
  return (Math.PI * deg) / 180;
};

/**
 * Converts the given radians to degree.
 */
export const toDegree = (rad: number) => {
  return (rad * 180) / Math.PI;
};

/**
 * Converts the given arc to a series of curves.
 */
export const arcToCurves = (
  x0: number,
  y0: number,
  r1: number,
  r2: number,
  angle: number,
  largeArcFlag: boolean,
  sweepFlag: boolean,
  x: number,
  y: number
) => {
  x -= x0;
  y -= y0;

  if (r1 === 0 || r2 === 0) {
    return [];
  }

  const fS = sweepFlag;
  const psai = angle;
  r1 = Math.abs(r1);
  r2 = Math.abs(r2);
  const ctx = -x / 2;
  const cty = -y / 2;
  const cpsi = Math.cos((psai * Math.PI) / 180);
  const spsi = Math.sin((psai * Math.PI) / 180);
  const rxd = cpsi * ctx + spsi * cty;
  const ryd = -1 * spsi * ctx + cpsi * cty;
  const rxdd = rxd * rxd;
  const rydd = ryd * ryd;
  const r1x = r1 * r1;
  const r2y = r2 * r2;
  const lamda = rxdd / r1x + rydd / r2y;
  let sds;

  if (lamda > 1) {
    r1 = Math.sqrt(lamda) * r1;
    r2 = Math.sqrt(lamda) * r2;
    sds = 0;
  } else {
    let seif = 1;

    if (largeArcFlag === fS) {
      seif = -1;
    }

    sds =
      seif * Math.sqrt((r1x * r2y - r1x * rydd - r2y * rxdd) / (r1x * rydd + r2y * rxdd));
  }

  const txd = (sds * r1 * ryd) / r2;
  const tyd = (-1 * sds * r2 * rxd) / r1;
  const tx = cpsi * txd - spsi * tyd + x / 2;
  const ty = spsi * txd + cpsi * tyd + y / 2;
  let rad = Math.atan2((ryd - tyd) / r2, (rxd - txd) / r1) - Math.atan2(0, 1);
  let s1 = rad >= 0 ? rad : 2 * Math.PI + rad;
  rad =
    Math.atan2((-ryd - tyd) / r2, (-rxd - txd) / r1) -
    Math.atan2((ryd - tyd) / r2, (rxd - txd) / r1);
  let dr = rad >= 0 ? rad : 2 * Math.PI + rad;

  if (!fS && dr > 0) {
    dr -= 2 * Math.PI;
  } else if (fS && dr < 0) {
    dr += 2 * Math.PI;
  }

  const sse = (dr * 2) / Math.PI;
  const seg = Math.ceil(sse < 0 ? -1 * sse : sse);
  const segr = dr / seg;
  const t = ((8 / 3) * Math.sin(segr / 4) * Math.sin(segr / 4)) / Math.sin(segr / 2);
  const cpsir1 = cpsi * r1;
  const cpsir2 = cpsi * r2;
  const spsir1 = spsi * r1;
  const spsir2 = spsi * r2;
  let mc = Math.cos(s1);
  let ms = Math.sin(s1);
  let x2 = -t * (cpsir1 * ms + spsir2 * mc);
  let y2 = -t * (spsir1 * ms - cpsir2 * mc);
  let x3 = 0;
  let y3 = 0;

  const result = [];

  for (let n = 0; n < seg; ++n) {
    s1 += segr;
    mc = Math.cos(s1);
    ms = Math.sin(s1);

    x3 = cpsir1 * mc - spsir2 * ms + tx;
    y3 = spsir1 * mc + cpsir2 * ms + ty;
    const dx = -t * (cpsir1 * ms + spsir2 * mc);
    const dy = -t * (spsir1 * ms - cpsir2 * mc);

    // CurveTo updates x0, y0 so need to restore it
    const index = n * 6;
    result[index] = Number(x2 + x0);
    result[index + 1] = Number(y2 + y0);
    result[index + 2] = Number(x3 - dx + x0);
    result[index + 3] = Number(y3 - dy + y0);
    result[index + 4] = Number(x3 + x0);
    result[index + 5] = Number(y3 + y0);

    x2 = x3 + dx;
    y2 = y3 + dy;
  }

  return result;
};

/**
 * Returns the bounding box for the rotated rectangle.
 *
 * @param rect {@link Rectangle} to be rotated.
 * @param angle Number that represents the angle (in degrees).
 * @param cx Optional {@link Point} that represents the rotation center. If no
 * rotation center is given then the center of rect is used.
 */
export const getBoundingBox = (
  rect: Rectangle | null,
  rotation: number,
  cx: Point | null = null
) => {
  let result = null;

  if (rect && rotation !== 0) {
    const rad = toRadians(rotation);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    cx = cx != null ? cx : new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);

    let p1 = new Point(rect.x, rect.y);
    let p2 = new Point(rect.x + rect.width, rect.y);
    let p3 = new Point(p2.x, rect.y + rect.height);
    let p4 = new Point(rect.x, p3.y);

    p1 = getRotatedPoint(p1, cos, sin, cx);
    p2 = getRotatedPoint(p2, cos, sin, cx);
    p3 = getRotatedPoint(p3, cos, sin, cx);
    p4 = getRotatedPoint(p4, cos, sin, cx);

    result = new Rectangle(p1.x, p1.y, 0, 0);
    result.add(new Rectangle(p2.x, p2.y, 0, 0));
    result.add(new Rectangle(p3.x, p3.y, 0, 0));
    result.add(new Rectangle(p4.x, p4.y, 0, 0));
  }

  return result;
};

/**
 * Rotates the given point by the given cos and sin.
 */
export const getRotatedPoint = (pt: Point, cos: number, sin: number, c = new Point()) => {
  const x = pt.x - c.x;
  const y = pt.y - c.y;

  const x1 = x * cos - y * sin;
  const y1 = y * cos + x * sin;

  return new Point(x1 + c.x, y1 + c.y);
};

/**
 * Returns an integer mask of the port constraints of the given map
 *
 * @param terminal {@link CelState} that represents the terminal.
 * @param edge {@link CelState} that represents the edge.
 * @param source Boolean that specifies if the terminal is the source terminal.
 * @param defaultValue Default value to be returned if no port constraint is defined in the terminal.
 * @return the mask of port constraint directions
 */
export const getPortConstraints = (
  terminal: CellState,
  edge: CellState,
  source: boolean,
  defaultValue: number
): number => {
  const value =
    terminal.style.portConstraint ??
    (source ? edge.style.sourcePortConstraint : edge.style.targetPortConstraint) ??
    null;

  if (isNullish(value)) {
    return defaultValue;
  }

  const directions = value.toString();
  let returnValue = DIRECTION_MASK.NONE;
  const constraintRotationEnabled = terminal.style.portConstraintRotation ?? false;
  let rotation = 0;

  if (constraintRotationEnabled) {
    rotation = terminal.style.rotation ?? 0;
  }

  let quad = 0;

  if (rotation > 45) {
    quad = 1;

    if (rotation >= 135) {
      quad = 2;
    }
  } else if (rotation < -45) {
    quad = 3;

    if (rotation <= -135) {
      quad = 2;
    }
  }

  if (directions.indexOf(DIRECTION.NORTH) >= 0) {
    switch (quad) {
      case 0:
        returnValue |= DIRECTION_MASK.NORTH;
        break;
      case 1:
        returnValue |= DIRECTION_MASK.EAST;
        break;
      case 2:
        returnValue |= DIRECTION_MASK.SOUTH;
        break;
      case 3:
        returnValue |= DIRECTION_MASK.WEST;
        break;
    }
  }
  if (directions.indexOf(DIRECTION.WEST) >= 0) {
    switch (quad) {
      case 0:
        returnValue |= DIRECTION_MASK.WEST;
        break;
      case 1:
        returnValue |= DIRECTION_MASK.NORTH;
        break;
      case 2:
        returnValue |= DIRECTION_MASK.EAST;
        break;
      case 3:
        returnValue |= DIRECTION_MASK.SOUTH;
        break;
    }
  }
  if (directions.indexOf(DIRECTION.SOUTH) >= 0) {
    switch (quad) {
      case 0:
        returnValue |= DIRECTION_MASK.SOUTH;
        break;
      case 1:
        returnValue |= DIRECTION_MASK.WEST;
        break;
      case 2:
        returnValue |= DIRECTION_MASK.NORTH;
        break;
      case 3:
        returnValue |= DIRECTION_MASK.EAST;
        break;
    }
  }
  if (directions.indexOf(DIRECTION.EAST) >= 0) {
    switch (quad) {
      case 0:
        returnValue |= DIRECTION_MASK.EAST;
        break;
      case 1:
        returnValue |= DIRECTION_MASK.SOUTH;
        break;
      case 2:
        returnValue |= DIRECTION_MASK.WEST;
        break;
      case 3:
        returnValue |= DIRECTION_MASK.NORTH;
        break;
    }
  }

  return returnValue;
};

/**
 * Reverse the port constraint bitmask. For example, north | east
 * becomes south | west
 */
export const reversePortConstraints = (constraint: number) => {
  let result = 0;

  result = (constraint & DIRECTION_MASK.WEST) << 3;
  result |= (constraint & DIRECTION_MASK.NORTH) << 1;
  result |= (constraint & DIRECTION_MASK.SOUTH) >> 1;
  result |= (constraint & DIRECTION_MASK.EAST) >> 3;

  return result;
};

/**
 * Finds the index of the nearest segment on the given cell state for
 * the specified coordinate pair.
 */
export const findNearestSegment = (state: CellState, x: number, y: number) => {
  let index = -1;

  if (state.absolutePoints.length > 0) {
    let last = state.absolutePoints[0];
    let min = null;

    for (let i = 1; i < state.absolutePoints.length; i += 1) {
      const current = state.absolutePoints[i];

      if (!last || !current) continue;

      const dist = ptSegDistSq(last.x, last.y, current.x, current.y, x, y);

      if (min == null || dist < min) {
        min = dist;
        index = i - 1;
      }

      last = current;
    }
  }

  return index;
};

/**
 * Adds the given margins to the given rectangle and rotates and flips the
 * rectangle according to the respective styles in style.
 */
export const getDirectedBounds = (
  rect: Rectangle,
  m: Rectangle,
  style: CellStateStyle | null,
  flipH: boolean,
  flipV: boolean
) => {
  const d = style?.direction ?? 'east';
  flipH ??= style?.flipH ?? false;
  flipV ??= style?.flipV ?? false;

  m.x = Math.round(Math.max(0, Math.min(rect.width, m.x)));
  m.y = Math.round(Math.max(0, Math.min(rect.height, m.y)));
  m.width = Math.round(Math.max(0, Math.min(rect.width, m.width)));
  m.height = Math.round(Math.max(0, Math.min(rect.height, m.height)));

  if (
    (flipV && (d === DIRECTION.SOUTH || d === DIRECTION.NORTH)) ||
    (flipH && (d === DIRECTION.EAST || d === DIRECTION.WEST))
  ) {
    const tmp = m.x;
    m.x = m.width;
    m.width = tmp;
  }

  if (
    (flipH && (d === DIRECTION.SOUTH || d === DIRECTION.NORTH)) ||
    (flipV && (d === DIRECTION.EAST || d === DIRECTION.WEST))
  ) {
    const tmp = m.y;
    m.y = m.height;
    m.height = tmp;
  }

  const m2 = Rectangle.fromRectangle(m);

  if (d === DIRECTION.SOUTH) {
    m2.y = m.x;
    m2.x = m.height;
    m2.width = m.y;
    m2.height = m.width;
  } else if (d === DIRECTION.WEST) {
    m2.y = m.height;
    m2.x = m.width;
    m2.width = m.x;
    m2.height = m.y;
  } else if (d === DIRECTION.NORTH) {
    m2.y = m.width;
    m2.x = m.y;
    m2.width = m.height;
    m2.height = m.x;
  }

  return new Rectangle(
    rect.x + m2.x,
    rect.y + m2.y,
    rect.width - m2.width - m2.x,
    rect.height - m2.height - m2.y
  );
};

/**
 * Returns the intersection between the polygon defined by the array of
 * points and the line between center and point.
 */
export const getPerimeterPoint = (pts: Point[], center: Point, point: Point) => {
  let min = null;

  for (let i = 0; i < pts.length - 1; i += 1) {
    const pt = intersection(
      pts[i].x,
      pts[i].y,
      pts[i + 1].x,
      pts[i + 1].y,
      center.x,
      center.y,
      point.x,
      point.y
    );

    if (pt != null) {
      const dx = point.x - pt.x;
      const dy = point.y - pt.y;
      const ip = { p: pt, distSq: dy * dy + dx * dx };

      if (ip != null && (min == null || min.distSq > ip.distSq)) {
        min = ip;
      }
    }
  }

  return min != null ? min.p : null;
};

/**
 * Returns true if the given rectangle intersects the given segment.
 *
 * @param bounds {@link Rectangle} that represents the rectangle.
 * @param p1 {@link Point} that represents the first point of the segment.
 * @param p2 {@link Point} that represents the second point of the segment.
 */
export const rectangleIntersectsSegment = (bounds: Rectangle, p1: Point, p2: Point) => {
  const top = bounds.y;
  const left = bounds.x;
  const bottom = top + bounds.height;
  const right = left + bounds.width;

  // Find min and max X for the segment
  let minX = p1.x;
  let maxX = p2.x;

  if (p1.x > p2.x) {
    minX = p2.x;
    maxX = p1.x;
  }

  // Find the intersection of the segment's and rectangle's x-projections
  if (maxX > right) {
    maxX = right;
  }

  if (minX < left) {
    minX = left;
  }

  if (minX > maxX) {
    // If their projections do not intersect return false
    return false;
  }

  // Find corresponding min and max Y for min and max X we found before
  let minY = p1.y;
  let maxY = p2.y;
  const dx = p2.x - p1.x;

  if (Math.abs(dx) > 0.0000001) {
    const a = (p2.y - p1.y) / dx;
    const b = p1.y - a * p1.x;
    minY = a * minX + b;
    maxY = a * maxX + b;
  }

  if (minY > maxY) {
    const tmp = maxY;
    maxY = minY;
    minY = tmp;
  }

  // Find the intersection of the segment's and rectangle's y-projections
  if (maxY > bottom) {
    maxY = bottom;
  }

  if (minY < top) {
    minY = top;
  }

  if (minY > maxY) {
    // If Y-projections do not intersect return false
    return false;
  }

  return true;
};

/**
 * Returns true if the specified point (x, y) is contained in the given rectangle.
 *
 * @param bounds {@link Rectangle} that represents the area.
 * @param x X-coordinate of the point.
 * @param y Y-coordinate of the point.
 */
export const contains = (bounds: Rectangle, x: number, y: number) => {
  return (
    bounds.x <= x &&
    bounds.x + bounds.width >= x &&
    bounds.y <= y &&
    bounds.y + bounds.height >= y
  );
};

/**
 * Returns true if the two rectangles intersect.
 *
 * @param a {@link Rectangle} to be checked for intersection.
 * @param b {@link Rectangle} to be checked for intersection.
 */
export const intersects = (a: Rectangle, b: Rectangle) => {
  let tw = a.width;
  let th = a.height;
  let rw = b.width;
  let rh = b.height;

  if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
    return false;
  }

  const tx = a.x;
  const ty = a.y;
  const rx = b.x;
  const ry = b.y;

  rw += rx;
  rh += ry;
  tw += tx;
  th += ty;

  return (
    (rw < rx || rw > tx) &&
    (rh < ry || rh > ty) &&
    (tw < tx || tw > rx) &&
    (th < ty || th > ry)
  );
};

/**
 * Returns true if the state and the hotspot intersect.
 *
 * @param state <CellState>
 * @param x X-coordinate.
 * @param y Y-coordinate.
 * @param hotspot Optional size of the hostpot.
 * @param min Optional min size of the hostpot.
 * @param max Optional max size of the hostpot.
 */
export const intersectsHotspot = (
  state: CellState,
  x: number,
  y: number,
  hotspot: number,
  min: number,
  max: number
) => {
  hotspot = hotspot != null ? hotspot : 1;
  min = min != null ? min : 0;
  max = max != null ? max : 0;

  if (hotspot > 0) {
    let cx = state.getCenterX();
    let cy = state.getCenterY();
    let w = state.width;
    let h = state.height;

    const style = state.style;
    const start = (style?.startSize ?? 0) * state.view.scale;

    if (start > 0) {
      if (style?.horizontal ?? true) {
        cy = state.y + start / 2;
        h = start;
      } else {
        cx = state.x + start / 2;
        w = start;
      }
    }

    w = Math.max(min, w * hotspot);
    h = Math.max(min, h * hotspot);

    if (max > 0) {
      w = Math.min(w, max);
      h = Math.min(h, max);
    }

    const rect = new Rectangle(cx - w / 2, cy - h / 2, w, h);
    const alpha = toRadians(style?.rotation ?? 0);

    if (alpha != 0) {
      const cos = Math.cos(-alpha);
      const sin = Math.sin(-alpha);
      const cx = new Point(state.getCenterX(), state.getCenterY());
      const pt = getRotatedPoint(new Point(x, y), cos, sin, cx);
      x = pt.x;
      y = pt.y;
    }

    return contains(rect, x, y);
  }

  return true;
};

/**
 * Returns true if the specified value is numeric, that is, if it is not
 * null, not an empty string, not a HEX number and isNaN returns false.
 *
 * @param n String representing the possibly numeric value.
 */
export const isNumeric = (n: any): n is {} => {
  return (
    !Number.isNaN(parseFloat(n)) &&
    isFinite(+n) &&
    (typeof n !== 'string' || n.toLowerCase().indexOf('0x') < 0)
  );
};

/**
 * Returns true if the given value is an valid integer number.
 *
 * @param n String representing the possibly numeric value.
 */
export const isInteger = (n: string) => {
  return String(parseInt(n)) === String(n);
};

/**
 * Returns the remainder of division of n by m. You should use this instead
 * of the built-in operation as the built-in operation does not properly
 * handle negative numbers.
 */
export const mod = (n: number, m: number) => {
  return ((n % m) + m) % m;
};

/**
 * Returns the intersection of two lines as an {@link Point}.
 *
 * @param x0 X-coordinate of the first line's startpoint.
 * @param y0 X-coordinate of the first line's startpoint.
 * @param x1 X-coordinate of the first line's endpoint.
 * @param y1 Y-coordinate of the first line's endpoint.
 * @param x2 X-coordinate of the second line's startpoint.
 * @param y2 Y-coordinate of the second line's startpoint.
 * @param x3 X-coordinate of the second line's endpoint.
 * @param y3 Y-coordinate of the second line's endpoint.
 */
export const intersection = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number
) => {
  const denom = (y3 - y2) * (x1 - x0) - (x3 - x2) * (y1 - y0);
  const nume_a = (x3 - x2) * (y0 - y2) - (y3 - y2) * (x0 - x2);
  const nume_b = (x1 - x0) * (y0 - y2) - (y1 - y0) * (x0 - x2);

  const ua = nume_a / denom;
  const ub = nume_b / denom;

  if (ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub <= 1.0) {
    // Get the intersection point
    const x = x0 + ua * (x1 - x0);
    const y = y0 + ua * (y1 - y0);

    return new Point(x, y);
  }

  // No intersection
  return null;
};

/**
 * Returns the square distance between a segment and a point. To get the
 * distance between a point and a line (with infinite length) use
 * {@link Utils#ptLineDist}.
 *
 * @param x1 X-coordinate of the startpoint of the segment.
 * @param y1 Y-coordinate of the startpoint of the segment.
 * @param x2 X-coordinate of the endpoint of the segment.
 * @param y2 Y-coordinate of the endpoint of the segment.
 * @param px X-coordinate of the point.
 * @param py Y-coordinate of the point.
 */
export const ptSegDistSq = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  px: number,
  py: number
) => {
  x2 -= x1;
  y2 -= y1;

  px -= x1;
  py -= y1;

  let dotprod = px * x2 + py * y2;
  let projlenSq;

  if (dotprod <= 0.0) {
    projlenSq = 0.0;
  } else {
    px = x2 - px;
    py = y2 - py;
    dotprod = px * x2 + py * y2;

    if (dotprod <= 0.0) {
      projlenSq = 0.0;
    } else {
      projlenSq = (dotprod * dotprod) / (x2 * x2 + y2 * y2);
    }
  }

  let lenSq = px * px + py * py - projlenSq;

  if (lenSq < 0) {
    lenSq = 0;
  }

  return lenSq;
};

/**
 * Returns the distance between a line defined by two points and a point.
 * To get the distance between a point and a segment (with a specific
 * length) use {@link Utils#ptSeqDistSq}.
 *
 * @param x1 X-coordinate of point 1 of the line.
 * @param y1 Y-coordinate of point 1 of the line.
 * @param x2 X-coordinate of point 1 of the line.
 * @param y2 Y-coordinate of point 1 of the line.
 * @param px X-coordinate of the point.
 * @param py Y-coordinate of the point.
 */
export const ptLineDist = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  px: number,
  py: number
) => {
  return (
    Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) /
    Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1))
  );
};

/**
 * Returns 1 if the given point on the right side of the segment, 0 if its
 * on the segment, and -1 if the point is on the left side of the segment.
 *
 * @param x1 X-coordinate of the startpoint of the segment.
 * @param y1 Y-coordinate of the startpoint of the segment.
 * @param x2 X-coordinate of the endpoint of the segment.
 * @param y2 Y-coordinate of the endpoint of the segment.
 * @param px X-coordinate of the point.
 * @param py Y-coordinate of the point.
 */
export const relativeCcw = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  px: number,
  py: number
) => {
  x2 -= x1;
  y2 -= y1;
  px -= x1;
  py -= y1;
  let ccw = px * y2 - py * x2;

  if (ccw == 0.0) {
    ccw = px * x2 + py * y2;

    if (ccw > 0.0) {
      px -= x2;
      py -= y2;
      ccw = px * x2 + py * y2;

      if (ccw < 0.0) {
        ccw = 0.0;
      }
    }
  }

  return ccw < 0.0 ? -1 : ccw > 0.0 ? 1 : 0;
};
