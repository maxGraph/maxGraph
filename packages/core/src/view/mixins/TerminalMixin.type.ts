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

import type Cell from '../cell/Cell';

declare module '../Graph' {
  interface Graph {
    /**
     * Returns true if the given terminal point is movable. This is independent
     * from {@link isCellConnectable} and {@link isCellDisconnectable} and controls if terminal
     * points can be moved in the graph if the edge is not connected.
     * Note that it is required for this to return true to connect unconnected edges.
     *
     * This implementation returns `true`.
     *
     * @param cell {@link Cell} whose terminal point should be moved.
     * @param source Boolean indicating if the source or target terminal should be moved.
     */
    isTerminalPointMovable: (cell: Cell, source: boolean) => boolean;

    /**
     * Returns all distinct visible opposite cells for the specified terminal on the given edges.
     *
     * @param edges Array of {@link Cell} that contains the edges whose opposite terminals should be returned.
     * @param terminal Terminal that specifies the end whose opposite should be returned. Default is `null`.
     * @param includeSources Optional boolean that specifies if source terminals should be included in the result. Default is `true`.
     * @param includeTargets Optional boolean that specifies if target terminals should be included in the result. Default is `true`.
     */
    getOpposites: (
      edges: Cell[],
      terminal: Cell | null,
      includeSources?: boolean,
      includeTargets?: boolean
    ) => Cell[];
  }
}
