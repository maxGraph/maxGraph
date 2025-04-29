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

import Point from '../../geometry/Point';
import type CellState from '../../cell/CellState';

/**
 * Scales an array of {@link Point}
 *
 * @param points array of {@link Point} to scale
 * @param scale the scaling to divide by
 * @private
 * @internal
 */
export function scalePointArray(points: Point[], scale: number): (Point | null)[] | null {
  let result: (Point | null)[] | null = [];

  if (points != null) {
    for (let i = 0; i < points.length; i += 1) {
      if (points[i] != null) {
        result[i] = new Point(
          Math.round((points[i].x / scale) * 10) / 10,
          Math.round((points[i].y / scale) * 10) / 10
        );
      } else {
        result[i] = null;
      }
    }
  } else {
    result = null;
  }

  return result;
}

/**
 * Scales an {@link CellState}.
 *
 * @param state {@link CellState} to scale
 * @param scale the scaling to divide by
 */
export function scaleCellState(state: CellState | null, scale: number): CellState | null {
  let result = null;

  if (state != null) {
    result = state.clone();
    result.setRect(
      Math.round((state.x / scale) * 10) / 10,
      Math.round((state.y / scale) * 10) / 10,
      Math.round((state.width / scale) * 10) / 10,
      Math.round((state.height / scale) * 10) / 10
    );
  }

  return result;
}
