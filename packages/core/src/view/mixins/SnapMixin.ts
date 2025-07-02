/*
Copyright 2021-present The maxGraph project Contributors

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

import type { AbstractGraph } from '../AbstractGraph.js';

type PartialGraph = Pick<AbstractGraph, 'getView'>;
type PartialSnap = Pick<
  AbstractGraph,
  | 'snapTolerance'
  | 'gridSize'
  | 'gridEnabled'
  | 'getSnapTolerance'
  | 'snap'
  | 'snapDelta'
  | 'isGridEnabled'
  | 'setGridEnabled'
  | 'getGridSize'
  | 'setGridSize'
>;
type PartialType = PartialGraph & PartialSnap;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const SnapMixin: PartialType = {
  snapTolerance: 0,

  getSnapTolerance() {
    return this.snapTolerance;
  },

  gridSize: 10,

  gridEnabled: true,

  snap(value) {
    if (this.gridEnabled) {
      value = Math.round(value / this.gridSize) * this.gridSize;
    }
    return value;
  },

  snapDelta(
    delta,
    bounds,
    ignoreGrid = false,
    ignoreHorizontal = false,
    ignoreVertical = false
  ) {
    const t = this.getView().translate;
    const s = this.getView().scale;

    if (!ignoreGrid && this.gridEnabled) {
      const tol = this.gridSize * s * 0.5;

      if (!ignoreHorizontal) {
        const tx = bounds.x - (this.snap(bounds.x / s - t.x) + t.x) * s;

        if (Math.abs(delta.x - tx) < tol) {
          delta.x = 0;
        } else {
          delta.x = this.snap(delta.x / s) * s - tx;
        }
      }

      if (!ignoreVertical) {
        const ty = bounds.y - (this.snap(bounds.y / s - t.y) + t.y) * s;

        if (Math.abs(delta.y - ty) < tol) {
          delta.y = 0;
        } else {
          delta.y = this.snap(delta.y / s) * s - ty;
        }
      }
    } else {
      const tol = 0.5 * s;

      if (!ignoreHorizontal) {
        const tx = bounds.x - (Math.round(bounds.x / s - t.x) + t.x) * s;

        if (Math.abs(delta.x - tx) < tol) {
          delta.x = 0;
        } else {
          delta.x = Math.round(delta.x / s) * s - tx;
        }
      }

      if (!ignoreVertical) {
        const ty = bounds.y - (Math.round(bounds.y / s - t.y) + t.y) * s;

        if (Math.abs(delta.y - ty) < tol) {
          delta.y = 0;
        } else {
          delta.y = Math.round(delta.y / s) * s - ty;
        }
      }
    }
    return delta;
  },

  isGridEnabled() {
    return this.gridEnabled;
  },

  setGridEnabled(value) {
    this.gridEnabled = value;
  },

  getGridSize() {
    return this.gridSize;
  },

  setGridSize(value) {
    this.gridSize = value;
  },
};
