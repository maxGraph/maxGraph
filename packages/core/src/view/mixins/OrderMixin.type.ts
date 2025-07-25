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

import type Cell from '../cell/Cell.js';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Moves the given cells to the front or back. The change is carried out using {@link cellsOrdered}.
     *
     * This method fires {@link InternalEvent.ORDER_CELLS} while the transaction is in progress.
     *
     * @param back Boolean that specifies if the cells should be moved to back. Default is `false`.
     * @param cells Array of {@link Cell} to move to the background. If not set, then the selection cells are used.
     */
    orderCells: (back: boolean, cells?: Cell[]) => Cell[];

    /**
     * Moves the given cells to the front or back.
     *
     * This method fires {@link InternalEvent.CELLS_ORDERED} while the transaction is in progress.
     *
     * @param cells Array of {@link Cell} whose order should be changed.
     * @param back Boolean that specifies if the cells should be moved to back. Default is `false`.
     */
    cellsOrdered: (cells: Cell[], back: boolean) => void;
  }
}
