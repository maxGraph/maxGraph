/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Shape from '../Shape';
import { LINE_ARCSIZE } from '../../../util/constants';
import Point from '../Point';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import { ColorValue } from '../../../types';

/**
 * Extends {@link Shape} to implement a polyline (a line with multiple points).
 * This shape is registered under {@link Constants#SHAPE_POLYLINE} in
 * {@link CellRenderer}.
 *
 * Constructor: mxPolyline
 *
 * Constructs a new polyline shape.
 *
 * @param points Array of <Point> that define the points. This is stored in
 * {@link Shape#points}.
 * @param stroke String that defines the stroke color. Default is 'black'. This is
 * stored in <stroke>.
 * @param strokewidth Optional integer that defines the stroke width. Default is
 * 1. This is stored in <strokewidth>.
 */
class PolylineShape extends Shape {
  constructor(points: Point[], stroke: ColorValue, strokeWidth = 1) {
    super();
    this.points = points;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  /**
   * Returns 0.
   */
  getRotation() {
    return 0;
  }

  /**
   * Returns 0.
   */
  getShapeRotation() {
    return 0;
  }

  /**
   * Returns false.
   */
  isPaintBoundsInverted() {
    return false;
  }

  /**
   * Paints the line shape.
   */
  paintEdgeShape(c: AbstractCanvas2D, pts: Point[]) {
    const prev = c.pointerEventsValue;
    c.pointerEventsValue = 'stroke';

    if (!this.style || !this.style.curved) {
      this.paintLine(c, pts, this.isRounded);
    } else {
      this.paintCurvedLine(c, pts);
    }
    c.pointerEventsValue = prev;
  }

  /**
   * Paints the line shape.
   */
  paintLine(c: AbstractCanvas2D, pts: Point[], rounded?: boolean) {
    const arcSize = this.style?.arcSize ?? LINE_ARCSIZE;

    c.begin();
    this.addPoints(c, pts, rounded, arcSize, false);
    c.stroke();
  }

  /**
   * Paints the line shape.
   */
  paintCurvedLine(c: AbstractCanvas2D, pts: Point[]) {
    c.begin();

    const pt = pts[0];
    const n = pts.length;
    c.moveTo(pt.x, pt.y);

    for (let i = 1; i < n - 2; i += 1) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const ix = (p0.x + p1.x) / 2;
      const iy = (p0.y + p1.y) / 2;
      c.quadTo(p0.x, p0.y, ix, iy);
    }

    const p0 = pts[n - 2];
    const p1 = pts[n - 1];
    c.quadTo(p0.x, p0.y, p1.x, p1.y);

    c.stroke();
  }
}

export default PolylineShape;
