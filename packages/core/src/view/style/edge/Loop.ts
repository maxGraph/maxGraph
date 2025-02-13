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

import CellState from '../../cell/CellState';
import Point from '../../geometry/Point';
import { DIRECTION } from '../../../util/Constants';
import { contains } from '../../../util/mathUtils';

import type { EdgeStyleFunction } from '../../../types';

export const Loop: EdgeStyleFunction = (
  state: CellState,
  source: CellState,
  _target: CellState | null,
  points: Point[],
  result: Point[]
) => {
  const pts = state.absolutePoints;

  const p0 = pts[0];
  const pe = pts[pts.length - 1];

  if (p0 != null && pe != null) {
    if (points != null && points.length > 0) {
      for (let i = 0; i < points.length; i += 1) {
        let pt = points[i];
        pt = <Point>state.view.transformControlPoint(state, pt);
        result.push(new Point(pt.x, pt.y));
      }
    }

    return;
  }

  if (source != null) {
    const { view } = state;
    const { graph } = view;
    let pt = points != null && points.length > 0 ? points[0] : null;

    if (pt != null) {
      pt = <Point>view.transformControlPoint(state, pt);
      if (contains(source, pt.x, pt.y)) {
        pt = null;
      }
    }

    let x = 0;
    let dx = 0;
    let y = 0;
    let dy = 0;

    const seg = (state.style.segment ?? graph.gridSize) * view.scale;
    const dir = state.style?.direction ?? DIRECTION.WEST;

    if (dir === DIRECTION.NORTH || dir === DIRECTION.SOUTH) {
      x = view.getRoutingCenterX(source);
      dx = seg;
    } else {
      y = view.getRoutingCenterY(source);
      dy = seg;
    }

    if (pt == null || pt.x < source.x || pt.x > source.x + source.width) {
      if (pt != null) {
        x = pt.x;
        dy = Math.max(Math.abs(y - pt.y), dy);
      } else if (dir === DIRECTION.NORTH) {
        y = source.y - 2 * dx;
      } else if (dir === DIRECTION.SOUTH) {
        y = source.y + source.height + 2 * dx;
      } else if (dir === DIRECTION.EAST) {
        x = source.x - 2 * dy;
      } else {
        x = source.x + source.width + 2 * dy;
      }
    } else if (pt !== null) {
      x = view.getRoutingCenterX(source);
      dx = Math.max(Math.abs(x - pt.x), dy);
      y = pt.y;
      dy = 0;
    }

    result.push(new Point(x - dx, y - dy));
    result.push(new Point(x + dx, y + dy));
  }
};
