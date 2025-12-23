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

import CellOverlay from '../cell/CellOverlay.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
import type InternalMouseEvent from '../event/InternalMouseEvent.js';
import type { AbstractGraph } from '../AbstractGraph.js';

type PartialGraph = Pick<
  AbstractGraph,
  | 'getView'
  | 'fireEvent'
  | 'getDataModel'
  | 'isEnabled'
  | 'getWarningImage'
  | 'getCellRenderer'
  | 'setSelectionCell'
>;
type PartialOverlays = Pick<
  AbstractGraph,
  | 'addCellOverlay'
  | 'getCellOverlays'
  | 'removeCellOverlay'
  | 'removeCellOverlays'
  | 'clearCellOverlays'
  | 'setCellWarning'
>;
type PartialType = PartialGraph & PartialOverlays;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const OverlaysMixin: PartialType = {
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
