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

import { SideToSide } from './SideToSide';
import { TopToBottom } from './TopToBottom';
import CellState from '../../cell/CellState';
import Point from '../../geometry/Point';
import { ELBOW } from '../../../util/Constants';

import type { EdgeStyleFunction } from '../../../types';

/**
 * Uses either {@link SideToSide} or {@link TopToBottom} depending on the horizontal flag in the cell style.
 * {@link SideToSide} is used if horizontal is `true` or unspecified.
 */
export const ElbowConnector: EdgeStyleFunction = (
  state: CellState,
  source: CellState,
  target: CellState | null,
  points: Point[],
  result: Point[]
): void => {
  let pt = points != null && points.length > 0 ? points[0] : null;

  let vertical = false;
  let horizontal = false;

  if (source != null && target != null) {
    if (pt != null) {
      const left = Math.min(source.x, target.x);
      const right = Math.max(source.x + source.width, target.x + target.width);

      const top = Math.min(source.y, target.y);
      const bottom = Math.max(source.y + source.height, target.y + target.height);

      pt = <Point>state.view.transformControlPoint(state, pt);
      vertical = pt.y < top || pt.y > bottom;
      horizontal = pt.x < left || pt.x > right;
    } else {
      const left = Math.max(source.x, target.x);
      const right = Math.min(source.x + source.width, target.x + target.width);

      vertical = left === right;
      if (!vertical) {
        const top = Math.max(source.y, target.y);
        const bottom = Math.min(source.y + source.height, target.y + target.height);

        horizontal = top === bottom;
      }
    }
  }

  if (!horizontal && (vertical || state.style.elbow === ELBOW.VERTICAL)) {
    TopToBottom(state, source, target, points, result);
  } else {
    SideToSide(state, source, target, points, result);
  }
};
