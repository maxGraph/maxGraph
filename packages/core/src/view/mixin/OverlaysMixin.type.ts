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
import type CellOverlay from '../cell/CellOverlay.js';
import type Image from '../image/ImageBox.js';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Adds an {@link CellOverlay} for the specified cell.
     *
     * This method fires an {@link InternalEvent.ADD_OVERLAY} event and returns the new {@link CellOverlay}.
     *
     * @param cell {@link Cell} to add the overlay for.
     * @param overlay {@link CellOverlay} to be added for the cell.
     */
    addCellOverlay: (cell: Cell, overlay: CellOverlay) => CellOverlay;

    /**
     * Returns an array of {@link CellOverlay}s for the given cell or `null`, if no overlays are defined.
     *
     * @param cell {@link Cell} whose overlays should be returned.
     */
    getCellOverlays: (cell: Cell) => CellOverlay[];

    /**
     * Removes and returns the given {@link CellOverlay} from the given cell.
     *
     * This method fires a {@link InternalEvent.REMOVE_OVERLAY} event.
     *
     * If no overlay is given, then all overlays are removed using {@link removeCellOverlays}.
     *
     * @param cell {@link Cell} whose overlay should be removed.
     * @param overlay Optional {@link CellOverlay} to be removed.
     */
    removeCellOverlay: (cell: Cell, overlay: CellOverlay | null) => CellOverlay | null;

    /**
     * Removes all {@link CellOverlay}s from the given cell.
     *
     * This method fires a {@link InternalEvent.REMOVE_OVERLAY} event for each {@link CellOverlay}
     * and returns an array of {@link CellOverlay}s that was removed from the cell.
     *
     * @param cell {@link Cell} whose overlays should be removed
     */
    removeCellOverlays: (cell: Cell) => CellOverlay[];

    /**
     * Removes all {@link CellOverlay}s in the graph for the given cell and all its descendants.
     *
     * If no cell is specified then all overlays are removed from the graph.
     *
     * This implementation uses {@link removeCellOverlays} to remove the overlays from the individual cells.
     *
     * @param cell Optional {@link Cell} that represents the root of the subtree to remove the overlays from. Default is the root in the model.
     */
    clearCellOverlays: (cell: Cell | null) => void;

    /**
     * Creates an overlay for the given cell using the warning and image or {@link warningImage} and returns the new {@link CellOverlay}.
     * The warning is displayed as a tooltip in a red font and may contain HTML markup.
     * If the warning is `null` or a zero length string, then all overlays are removed from the cell.
     *
     * @example
     * ```javascript
     * graph.setCellWarning(cell, '<b>Warning:</b>: Hello, World!');
     * ```
     *
     * @param cell {@link Cell} whose warning should be set.
     * @param warning String that represents the warning to be displayed.
     * @param img Optional {@link Image} to be used for the overlay. Default is {@link warningImage}.
     * @param isSelect Optional boolean indicating if a click on the overlay should select the corresponding cell. Default is `false`.
     */
    setCellWarning: (
      cell: Cell,
      warning: string | null,
      img?: Image,
      isSelect?: boolean
    ) => CellOverlay | null;
  }
}
