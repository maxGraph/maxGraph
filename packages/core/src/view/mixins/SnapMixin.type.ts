/*
Copyright 2024-present The maxGraph project Contributors

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

import type Point from '../geometry/Point';
import type Rectangle from '../geometry/Rectangle';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * @default 0
     */
    // TODO: Document me!
    snapTolerance: number;

    /**
     * Specifies the grid size.
     * @default 10
     */
    gridSize: number;

    /**
     * Specifies if the grid is enabled. This is used in {@link snap}.
     * @default true
     */
    gridEnabled: boolean;

    getSnapTolerance: () => number;

    /**
     * Snaps the given numeric value to the grid if {@link gridEnabled} is true.
     *
     * @param value Numeric value to be snapped to the grid.
     */
    snap: (value: number) => number;

    /**
     * Snaps the given delta with the given scaled bounds.
     *
     * @param delta
     * @param bounds
     * @param ignoreGrid default `false`
     * @param ignoreHorizontal default `false`
     * @param ignoreVertical default `false`
     */
    snapDelta: (
      delta: Point,
      bounds: Rectangle,
      ignoreGrid?: boolean,
      ignoreHorizontal?: boolean,
      ignoreVertical?: boolean
    ) => Point;

    /**
     * Returns {@link gridEnabled}.
     */
    isGridEnabled: () => boolean;

    /**
     * Specifies if the grid should be enabled.
     *
     * @param value Boolean indicating if the grid should be enabled.
     */
    setGridEnabled: (value: boolean) => void;

    /**
     * Returns {@link gridSize}.
     */
    getGridSize: () => number;

    /**
     * Sets {@link gridSize}.
     */
    setGridSize: (value: number) => void;
  }
}
