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
import { isMultiTouchEvent } from '../../util/EventUtils';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import InternalMouseEvent from '../event/InternalMouseEvent';
import { Graph } from '../Graph';
import { mixInto } from '../../util/Utils';
import CellEditorHandler from '../handler/CellEditorHandler';

declare module '../Graph' {
  interface Graph {
    cellsEditable: boolean;

    startEditing: (evt: MouseEvent) => void;
    startEditingAtCell: (cell: Cell | null, evt?: MouseEvent | null) => void;
    getEditingValue: (cell: Cell, evt: MouseEvent | null) => string;
    stopEditing: (cancel: boolean) => void;
    labelChanged: (cell: Cell, value: any, evt: InternalMouseEvent | EventObject) => Cell;
    cellLabelChanged: (cell: Cell, value: any, autoSize: boolean) => void;
    isEditing: (cell?: Cell | null) => boolean;
    isCellEditable: (cell: Cell) => boolean;
    isCellsEditable: () => boolean;
    setCellsEditable: (value: boolean) => void;
  }
}

type PartialGraph = Pick<
  Graph,
  | 'convertValueToString'
  | 'batchUpdate'
  | 'getDataModel'
  | 'getSelectionCell'
  | 'fireEvent'
  | 'isAutoSizeCell'
  | 'cellSizeUpdated'
  | 'getCurrentCellStyle'
  | 'isCellLocked'
  | 'getPlugin'
>;
type PartialEditing = Pick<
  Graph,
  | 'cellsEditable'
  | 'startEditing'
  | 'startEditingAtCell'
  | 'getEditingValue'
  | 'stopEditing'
  | 'labelChanged'
  | 'cellLabelChanged'
  | 'isEditing'
  | 'isCellEditable'
  | 'isCellsEditable'
  | 'setCellsEditable'
>;
type PartialType = PartialGraph & PartialEditing;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const EditingMixin: PartialType = {
  /**
   * Specifies the return value for {@link isCellEditable}.
   * @default true
   */
  cellsEditable: true,

  /*****************************************************************************
   * Group: Cell in-place editing
   *****************************************************************************/

  /**
   * Calls {@link startEditingAtCell} using the given cell or the first selection
   * cell.
   *
   * @param evt Optional mouse event that triggered the editing.
   */
  startEditing(evt) {
    this.startEditingAtCell(null, evt);
  },

  /**
   * Fires a {@link startEditing} event and invokes {@link CellEditorHandler.startEditing}
   * on {@link editor}. After editing was started, a {@link editingStarted} event is
   * fired.
   *
   * @param cell {@link mxCell} to start the in-place editor for.
   * @param evt Optional mouse event that triggered the editing.
   */
  startEditingAtCell(cell = null, evt) {
    if (!evt || !isMultiTouchEvent(evt)) {
      if (!cell) {
        cell = this.getSelectionCell();

        if (cell && !this.isCellEditable(cell)) {
          cell = null;
        }
      } else {
        this.fireEvent(
          new EventObject(InternalEvent.START_EDITING, { cell, event: evt })
        );

        const cellEditor = this.getPlugin('CellEditorHandler') as CellEditorHandler;
        cellEditor.startEditing(cell, evt);

        this.fireEvent(
          new EventObject(InternalEvent.EDITING_STARTED, { cell, event: evt })
        );
      }
    }
  },

  /**
   * Returns the initial value for in-place editing. This implementation
   * returns {@link convertValueToString} for the given cell. If this function is
   * overridden, then {@link GraphDataModel.valueForCellChanged} should take care
   * of correctly storing the actual new value inside the user object.
   *
   * @param cell {@link mxCell} for which the initial editing value should be returned.
   * @param evt Optional mouse event that triggered the editor.
   */
  getEditingValue(cell, evt) {
    return this.convertValueToString(cell);
  },

  /**
   * Stops the current editing  and fires a {@link editingStopped} event.
   *
   * @param cancel Boolean that specifies if the current editing value
   * should be stored.
   */
  stopEditing(cancel = false) {
    const cellEditor = this.getPlugin('CellEditorHandler') as CellEditorHandler;
    cellEditor.stopEditing(cancel);
    this.fireEvent(new EventObject(InternalEvent.EDITING_STOPPED, { cancel }));
  },

  /**
   * Sets the label of the specified cell to the given value using
   * {@link cellLabelChanged} and fires {@link InternalEvent.LABEL_CHANGED} while the
   * transaction is in progress. Returns the cell whose label was changed.
   *
   * @param cell {@link mxCell} whose label should be changed.
   * @param value New label to be assigned.
   * @param evt Optional event that triggered the change.
   */
  labelChanged(cell, value, evt) {
    this.batchUpdate(() => {
      const old = cell.value;
      this.cellLabelChanged(cell, value, this.isAutoSizeCell(cell));
      this.fireEvent(
        new EventObject(InternalEvent.LABEL_CHANGED, {
          cell: cell,
          value: value,
          old: old,
          event: evt,
        })
      );
    });
    return cell;
  },

  /**
   * Sets the new label for a cell. If autoSize is true then
   * {@link cellSizeUpdated} will be called.
   *
   * In the following example, the function is extended to map changes to
   * attributes in an XML node, as shown in {@link convertValueToString}.
   * Alternatively, the handling of this can be implemented as shown in
   * {@link GraphDataModel.valueForCellChanged} without the need to clone the
   * user object.
   *
   * ```javascript
   * var graphCellLabelChanged = graph.cellLabelChanged;
   * graph.cellLabelChanged = function(cell, newValue, autoSize)
   * {
   * 	// Cloned for correct undo/redo
   * 	var elt = cell.value.cloneNode(true);
   *  elt.setAttribute('label', newValue);
   *
   *  newValue = elt;
   *  graphCellLabelChanged.apply(this, arguments);
   * };
   * ```
   *
   * @param cell {@link mxCell} whose label should be changed.
   * @param value New label to be assigned.
   * @param autoSize Boolean that specifies if {@link cellSizeUpdated} should be called.
   */
  cellLabelChanged(cell, value, autoSize = false) {
    this.batchUpdate(() => {
      this.getDataModel().setValue(cell, value);

      if (autoSize) {
        this.cellSizeUpdated(cell, false);
      }
    });
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Returns true if the given cell is currently being edited.
   * If no cell is specified then this returns true if any
   * cell is currently being edited.
   *
   * @param cell {@link mxCell} that should be checked.
   */
  isEditing(cell = null) {
    const cellEditor = this.getPlugin('CellEditorHandler') as CellEditorHandler;
    const editingCell = cellEditor.getEditingCell();
    return !cell ? !!editingCell : cell === editingCell;
  },

  /**
   * Returns true if the given cell is editable. This returns {@link cellsEditable} for
   * all given cells if {@link isCellLocked} does not return true for the given cell
   * and its style does not specify {@link 'editable'} to be 0.
   *
   * @param cell {@link mxCell} whose editable state should be returned.
   */
  isCellEditable(cell): boolean {
    const style = this.getCurrentCellStyle(cell);
    return this.isCellsEditable() && !this.isCellLocked(cell) && (style.editable || false);
  },

  /**
   * Returns {@link cellsEditable}.
   */
  isCellsEditable() {
    return this.cellsEditable;
  },

  /**
   * Specifies if the graph should allow in-place editing for cell labels.
   * This implementation updates {@link cellsEditable}.
   *
   * @param value Boolean indicating if the graph should allow in-place
   * editing.
   */
  setCellsEditable(value) {
    this.cellsEditable = value;
  },
};

mixInto(Graph)(EditingMixin);
