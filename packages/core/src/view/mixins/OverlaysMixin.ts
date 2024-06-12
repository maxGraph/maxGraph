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

import Cell from '../cell/Cell';
import CellOverlay from '../cell/CellOverlay';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import Image from '../image/ImageBox';
import InternalMouseEvent from '../event/InternalMouseEvent';
import { Graph } from '../Graph';
import { mixInto } from '../../util/Utils';

declare module '../Graph' {
  interface Graph {
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

type PartialGraph = Pick<
  Graph,
  | 'getView'
  | 'fireEvent'
  | 'getDataModel'
  | 'isEnabled'
  | 'getWarningImage'
  | 'getCellRenderer'
  | 'setSelectionCell'
>;
type PartialOverlays = Pick<
  Graph,
  | 'addCellOverlay'
  | 'getCellOverlays'
  | 'removeCellOverlay'
  | 'removeCellOverlays'
  | 'clearCellOverlays'
  | 'setCellWarning'
>;
type PartialType = PartialGraph & PartialOverlays;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const OverlaysMixin: PartialType = {
  addCellOverlay(cell, overlay) {
    cell.overlays.push(overlay);

    // Immediately update the cell display if the state exists
    const state = this.getView().getState(cell);

    if (state) {
      this.getCellRenderer().redraw(state);
    }

    this.fireEvent(new EventObject(InternalEvent.ADD_OVERLAY, { cell, overlay }));
    return overlay;
  },

  getCellOverlays(cell) {
    return cell.overlays;
  },

  removeCellOverlay(cell, overlay = null) {
    if (!overlay) {
      this.removeCellOverlays(cell);
    } else {
      const index = cell.overlays.indexOf(overlay);

      if (index >= 0) {
        cell.overlays.splice(index, 1);

        // Immediately updates the cell display if the state exists
        const state = this.getView().getState(cell);

        if (state) {
          this.getCellRenderer().redraw(state);
        }

        this.fireEvent(new EventObject(InternalEvent.REMOVE_OVERLAY, { cell, overlay }));
      } else {
        overlay = null;
      }
    }

    return overlay;
  },

  removeCellOverlays(cell) {
    const { overlays } = cell;

    cell.overlays = [];

    // Immediately updates the cell display if the state exists
    const state = this.getView().getState(cell);

    if (state) {
      this.getCellRenderer().redraw(state);
    }

    for (let i = 0; i < overlays.length; i += 1) {
      this.fireEvent(
        new EventObject(
          InternalEvent.REMOVE_OVERLAY,
          'cell',
          cell,
          'overlay',
          overlays[i]
        )
      );
    }

    return overlays;
  },

  clearCellOverlays(cell = null) {
    cell = cell ?? this.getDataModel().getRoot();

    if (!cell) return;

    this.removeCellOverlays(cell);

    // Recursively removes all overlays from the children
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);
      this.clearCellOverlays(child); // recurse
    }
  },

  setCellWarning(cell, warning = null, img, isSelect = false) {
    img = img ?? this.getWarningImage();

    if (warning && warning.length > 0) {
      // Creates the overlay with the image and warning
      const overlay = new CellOverlay(img, `<font color=red>${warning}</font>`);

      // Adds a handler for single mouseclicks to select the cell
      if (isSelect) {
        overlay.addListener(
          InternalEvent.CLICK,
          (sender: any, evt: InternalMouseEvent) => {
            if (this.isEnabled()) {
              this.setSelectionCell(cell);
            }
          }
        );
      }

      // Sets and returns the overlay in the graph
      return this.addCellOverlay(cell, overlay);
    }
    this.removeCellOverlays(cell);

    return null;
  },
};

mixInto(Graph)(OverlaysMixin);
