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

import { DEFAULT_MARKERSIZE, NONE } from '../../../util/Constants';
import PolylineShape from './PolylineShape';
import MarkerShape from './MarkerShape';
import Point from '../Point';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import Rectangle from '../Rectangle';
import { ArrowType, ColorValue } from '../../../types';

/**
 * Extends {@link mxShape} to implement a connector shape.
 * The connector shape allows for arrow heads on either side.
 * This shape is registered under {@link mxConstants.SHAPE_CONNECTOR} in {@link mxCellRenderer}.
 *
 * @class ConnectorShape
 * @extends {PolylineShape}
 */
class ConnectorShape extends PolylineShape {
  constructor(points: Point[], stroke: ColorValue, strokewidth: number) {
    super(points, stroke, strokewidth);
  }

  /**
   * Updates the <boundingBox> for this shape using <createBoundingBox>
   * and augmentBoundingBox and stores the result in <boundingBox>.
   */
  updateBoundingBox() {
    this.useSvgBoundingBox = !!this.style?.curved;
    super.updateBoundingBox();
  }

  /**
   * Paints the line shape.
   */
  paintEdgeShape(c: AbstractCanvas2D, pts: Point[]): void {
    // The indirection via functions for markers is needed in
    // order to apply the offsets before painting the line and
    // paint the markers after painting the line.
    const sourceMarker = this.createMarker(c, pts, true);
    const targetMarker = this.createMarker(c, pts, false);

    super.paintEdgeShape(c, pts);

    // Disables shadows, dashed styles and fixes fill color for markers
    c.setFillColor(this.stroke);
    c.setShadow(false);
    c.setDashed(false);

    if (sourceMarker) {
      sourceMarker();
    }

    if (targetMarker) {
      targetMarker();
    }
  }

  /**
   * Prepares the marker by adding offsets in pts and returning a function to paint the marker.
   */
  createMarker(c: AbstractCanvas2D, pts: Point[], source: boolean) {
    if (!this.style) return null;

    let result = null;
    const n = pts.length;
    const type: ArrowType | typeof NONE = (source ? this.style.startArrow : this.style.endArrow) || NONE;

    let p0 = source ? pts[1] : pts[n - 2];
    const pe = source ? pts[0] : pts[n - 1];

    if (type !== NONE && p0 !== null && pe !== null) {
      let count = 1;

      // Uses next non-overlapping point
      while (
        count < n - 1 &&
        Math.round(p0.x - pe.x) === 0 &&
        Math.round(p0.y - pe.y) === 0
      ) {
        p0 = source ? pts[1 + count] : pts[n - 2 - count];
        count++;
      }

      // Computes the norm and the inverse norm
      const dx = pe.x - p0.x;
      const dy = pe.y - p0.y;

      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

      const unitX = dx / dist;
      const unitY = dy / dist;

      const size =
        (source ? this.style.startSize : this.style.endSize) ?? DEFAULT_MARKERSIZE;

      // Allow for stroke width in the end point used and the
      // orthogonal vectors describing the direction of the marker
      const filled = !(source ? this.style.startFill : this.style.endFill);

      result = MarkerShape.createMarker(
        c,
        this,
        type,
        pe,
        unitX,
        unitY,
        size,
        source,
        this.strokeWidth,
        filled
      );
    }

    return result;
  }

  /**
   * Augments the bounding box with the strokewidth and shadow offsets.
   */
  augmentBoundingBox(bbox: Rectangle) {
    super.augmentBoundingBox(bbox);

    if (!this.style) return;

    // Adds marker sizes
    let size = 0;

    if (this.style.startArrow !== NONE) {
      size = (this.style.startSize ?? DEFAULT_MARKERSIZE) + 1;
    }

    if (this.style.endArrow !== NONE) {
      size = Math.max(size, this.style.endSize ?? DEFAULT_MARKERSIZE) + 1;
    }

    bbox.grow(size * this.scale);
  }
}

export default ConnectorShape;
