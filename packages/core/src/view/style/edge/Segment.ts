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
import { contains } from '../../../util/mathUtils';
import { scaleCellState, scalePointArray } from './shared';

import type { EdgeStyleFunction } from '../../../types';

export const SegmentConnector: EdgeStyleFunction = (
  state: CellState,
  sourceScaled: CellState,
  targetScaled: CellState | null,
  controlHints: Point[],
  result: Point[]
): void => {
  // Creates array of all way- and terminal points
  // TODO: Figure out what to do when there are nulls in `pts`!
  const pts = <Point[]>(
    (<unknown>scalePointArray(<Point[]>(<unknown>state.absolutePoints), state.view.scale))
  );
  const source = scaleCellState(sourceScaled, state.view.scale);
  const target = scaleCellState(targetScaled, state.view.scale);
  const tol = 1;

  // Whether the first segment outgoing from the source end is horizontal
  let lastPushed = result.length > 0 ? result[0] : null;
  let horizontal = true;
  let hint = null;

  // Adds waypoints only if outside of tolerance
  function pushPoint(pt: Point) {
    pt.x = Math.round(pt.x * state.view.scale * 10) / 10;
    pt.y = Math.round(pt.y * state.view.scale * 10) / 10;

    if (
      lastPushed == null ||
      Math.abs(lastPushed.x - pt.x) >= tol ||
      Math.abs(lastPushed.y - pt.y) >= Math.max(1, state.view.scale)
    ) {
      result.push(pt);
      lastPushed = pt;
    }

    return lastPushed;
  }

  // Adds the first point
  let pt = pts[0];

  if (pt == null && source != null) {
    pt = new Point(
      state.view.getRoutingCenterX(source),
      state.view.getRoutingCenterY(source)
    );
  } else if (pt != null) {
    pt = pt.clone();
  }

  const lastInx = pts.length - 1;
  let pe = null;

  // Adds the waypoints
  if (controlHints != null && controlHints.length > 0) {
    // Converts all hints and removes nulls
    let hints = [];

    for (let i = 0; i < controlHints.length; i += 1) {
      const tmp = state.view.transformControlPoint(state, controlHints[i], true);

      if (tmp != null) {
        hints.push(tmp);
      }
    }

    if (hints.length === 0) {
      return;
    }

    // Aligns source and target hint to fixed points
    if (pt != null && hints[0] != null) {
      if (Math.abs(hints[0].x - pt.x) < tol) {
        hints[0].x = pt.x;
      }

      if (Math.abs(hints[0].y - pt.y) < tol) {
        hints[0].y = pt.y;
      }
    }

    pe = pts[lastInx];

    if (pe != null && hints[hints.length - 1] != null) {
      if (Math.abs(hints[hints.length - 1].x - pe.x) < tol) {
        hints[hints.length - 1].x = pe.x;
      }

      if (Math.abs(hints[hints.length - 1].y - pe.y) < tol) {
        hints[hints.length - 1].y = pe.y;
      }
    }

    hint = hints[0];

    let currentTerm = source;
    let currentPt = pts[0];
    let hozChan = false;
    let vertChan = false;
    let currentHint = hint;

    if (currentPt != null) {
      currentTerm = null;
    }

    // Check for alignment with fixed points and with channels
    // at source and target segments only
    for (let i = 0; i < 2; i += 1) {
      const fixedVertAlign = currentPt != null && currentPt.x === currentHint.x;
      const fixedHozAlign = currentPt != null && currentPt.y === currentHint.y;

      const inHozChan =
        currentTerm != null &&
        currentHint.y >= currentTerm.y &&
        currentHint.y <= currentTerm.y + currentTerm.height;
      const inVertChan =
        currentTerm != null &&
        currentHint.x >= currentTerm.x &&
        currentHint.x <= currentTerm.x + currentTerm.width;

      hozChan = fixedHozAlign || (currentPt == null && inHozChan);
      vertChan = fixedVertAlign || (currentPt == null && inVertChan);

      // If the current hint falls in both the hor and vert channels in the case
      // of a floating port, or if the hint is exactly co-incident with a
      // fixed point, ignore the source and try to work out the orientation
      // from the target end
      if (!(i == 0 && ((hozChan && vertChan) || (fixedVertAlign && fixedHozAlign)))) {
        if (
          currentPt != null &&
          !fixedHozAlign &&
          !fixedVertAlign &&
          (inHozChan || inVertChan)
        ) {
          horizontal = !inHozChan;
          break;
        }

        if (vertChan || hozChan) {
          horizontal = hozChan;

          if (i === 1) {
            // Work back from target end
            horizontal = hints.length % 2 === 0 ? hozChan : vertChan;
          }

          break;
        }
      }

      currentTerm = target;
      currentPt = pts[lastInx];

      if (currentPt != null) {
        currentTerm = null;
      }

      currentHint = hints[hints.length - 1];

      if (fixedVertAlign && fixedHozAlign) {
        hints = hints.slice(1);
      }
    }

    if (
      horizontal &&
      ((pts[0] != null && pts[0].y !== hint.y) ||
        (pts[0] == null &&
          source != null &&
          (hint.y < source.y || hint.y > source.y + source.height)))
    ) {
      pushPoint(new Point(pt.x, hint.y));
    } else if (
      !horizontal &&
      ((pts[0] != null && pts[0].x !== hint.x) ||
        (pts[0] == null &&
          source != null &&
          (hint.x < source.x || hint.x > source.x + source.width)))
    ) {
      pushPoint(new Point(hint.x, pt.y));
    }

    if (horizontal) {
      pt.y = hint.y;
    } else {
      pt.x = hint.x;
    }

    for (let i = 0; i < hints.length; i += 1) {
      horizontal = !horizontal;
      hint = hints[i];

      //        MaxLog.show();
      //        MaxLog.debug('hint', i, hint.x, hint.y);

      if (horizontal) {
        pt.y = hint.y;
      } else {
        pt.x = hint.x;
      }

      pushPoint(pt.clone());
    }
  } else {
    hint = pt;
    // FIXME: First click in connect preview toggles orientation
    horizontal = true;
  }

  // Adds the last point
  pt = pts[lastInx];

  if (pt == null && target != null) {
    pt = new Point(
      state.view.getRoutingCenterX(target),
      state.view.getRoutingCenterY(target)
    );
  }

  if (pt != null) {
    if (hint != null) {
      if (
        horizontal &&
        ((pts[lastInx] != null && pts[lastInx].y !== hint.y) ||
          (pts[lastInx] == null &&
            target != null &&
            (hint.y < target.y || hint.y > target.y + target.height)))
      ) {
        pushPoint(new Point(pt.x, hint.y));
      } else if (
        !horizontal &&
        ((pts[lastInx] != null && pts[lastInx].x !== hint.x) ||
          (pts[lastInx] == null &&
            target != null &&
            (hint.x < target.x || hint.x > target.x + target.width)))
      ) {
        pushPoint(new Point(hint.x, pt.y));
      }
    }
  }

  // Removes bends inside the source terminal for floating ports
  if (pts[0] == null && source != null) {
    while (
      result.length > 1 &&
      result[1] != null &&
      contains(source, result[1].x, result[1].y)
    ) {
      result.splice(1, 1);
    }
  }

  // Removes bends inside the target terminal
  if (pts[lastInx] == null && target != null) {
    while (
      result.length > 1 &&
      result[result.length - 1] != null &&
      contains(target, result[result.length - 1].x, result[result.length - 1].y)
    ) {
      result.splice(result.length - 1, 1);
    }
  }

  // Removes last point if inside tolerance with end point
  if (
    pe != null &&
    result[result.length - 1] != null &&
    Math.abs(pe.x - result[result.length - 1].x) <= tol &&
    Math.abs(pe.y - result[result.length - 1].y) <= tol
  ) {
    result.splice(result.length - 1, 1);

    // Lines up second last point in result with end point
    if (result[result.length - 1] != null) {
      if (Math.abs(result[result.length - 1].x - pe.x) < tol) {
        result[result.length - 1].x = pe.x;
      }

      if (Math.abs(result[result.length - 1].y - pe.y) < tol) {
        result[result.length - 1].y = pe.y;
      }
    }
  }
};
