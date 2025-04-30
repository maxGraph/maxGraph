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
import Geometry from '../../geometry/Geometry';
import Point from '../../geometry/Point';
import { DIRECTION_MASK } from '../../../util/Constants';
import { getPortConstraints } from '../../../util/mathUtils';
import type { EdgeStyleFunction } from '../../../types';
import { EntityRelationConnectorConfig } from '../config';

/**
 * Implements an entity relation style for edges (as used in database
 * schema diagrams). At the time the function is called, the result
 * array contains a placeholder (null) for the first absolute point,
 * that is, the point where the edge and source terminal are connected.
 * The implementation of the style then adds all intermediate waypoints
 * except for the last point, that is, the connection point between the
 * edge and the target terminal. The first ant the last point in the
 * result array are then replaced with Point that take into account
 * the terminal's perimeter and next point on the edge.
 *
 * @param state {@link CellState} that represents the edge to be updated.
 * @param source {@link CellState} that represents the source terminal.
 * @param target {@link CellState} that represents the target terminal.
 * @param _points
 * @param result Array of {@link Point} that represent the actual points of the edge.
 */
export const EntityRelation: EdgeStyleFunction = (
  state: CellState,
  source: CellState,
  target: CellState | null,
  _points: Point[],
  result: Point[]
) => {
  const { view } = state;
  const segment =
    (state.style?.segment ?? EntityRelationConnectorConfig.segment) * view.scale;

  const pts = state.absolutePoints;
  const p0 = pts[0];
  const pe = pts[pts.length - 1];

  let isSourceLeft = false;

  if (source != null) {
    const sourceGeometry = <Geometry>source.cell.getGeometry();

    if (sourceGeometry.relative) {
      isSourceLeft = sourceGeometry.x <= 0.5;
    } else if (target != null) {
      isSourceLeft =
        (pe != null ? pe.x : target.x + target.width) < (p0 != null ? p0.x : source.x);
    }
  }

  if (p0 != null) {
    source = new CellState();
    source.x = p0.x;
    source.y = p0.y;
  } else if (source != null) {
    const constraint = getPortConstraints(source, state, true, DIRECTION_MASK.NONE);

    if (
      constraint !== DIRECTION_MASK.NONE &&
      constraint !== DIRECTION_MASK.WEST + DIRECTION_MASK.EAST
    ) {
      isSourceLeft = constraint === DIRECTION_MASK.WEST;
    }
  } else {
    return;
  }

  let isTargetLeft = true;

  if (target != null) {
    const targetGeometry = <Geometry>target.cell.getGeometry();

    if (targetGeometry.relative) {
      isTargetLeft = targetGeometry.x <= 0.5;
    } else if (source != null) {
      isTargetLeft =
        (p0 != null ? p0.x : source.x + source.width) < (pe != null ? pe.x : target.x);
    }
  }

  if (pe != null) {
    target = new CellState();
    target.x = pe.x;
    target.y = pe.y;
  } else if (target != null) {
    const constraint = getPortConstraints(target, state, false, DIRECTION_MASK.NONE);

    if (
      constraint !== DIRECTION_MASK.NONE &&
      constraint != DIRECTION_MASK.WEST + DIRECTION_MASK.EAST
    ) {
      isTargetLeft = constraint === DIRECTION_MASK.WEST;
    }
  }

  if (source != null && target != null) {
    const x0 = isSourceLeft ? source.x : source.x + source.width;
    const y0 = view.getRoutingCenterY(source);

    const xe = isTargetLeft ? target.x : target.x + target.width;
    const ye = view.getRoutingCenterY(target);

    const seg = segment;

    let dx = isSourceLeft ? -seg : seg;
    const dep = new Point(x0 + dx, y0);

    dx = isTargetLeft ? -seg : seg;
    const arr = new Point(xe + dx, ye);

    // Adds intermediate points if both go out on same side
    if (isSourceLeft === isTargetLeft) {
      const x = isSourceLeft ? Math.min(x0, xe) - segment : Math.max(x0, xe) + segment;

      result.push(new Point(x, y0));
      result.push(new Point(x, ye));
    } else if (dep.x < arr.x === isSourceLeft) {
      const midY = y0 + (ye - y0) / 2;

      result.push(dep);
      result.push(new Point(dep.x, midY));
      result.push(new Point(arr.x, midY));
      result.push(arr);
    } else {
      result.push(dep);
      result.push(arr);
    }
  }
};
