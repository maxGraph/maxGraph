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

import EventSource from '../view/event/EventSource';
import { Graph } from './Graph';
import Cell from './cell/Cell';
import SelectionChange from './undoable_changes/SelectionChange';
import UndoableEdit from './undoable_changes/UndoableEdit';
import EventObject from './event/EventObject';
import InternalEvent from './event/InternalEvent';
import { GlobalConfig } from '../util/config';

/**
 * Class: mxGraphSelectionModel
 *
 * Implements the selection model for a graph. Here is a listener that handles
 * all removed selection cells.
 *
 * (code)
 * graph.getSelectionModel().addListener(mxEvent.CHANGE, function(sender, evt)
 * {
 *   var cells = evt.getProperty('added');
 *
 *   for (var i = 0; i < cells.length; i++)
 *   {
 *     // Handle cells[i]...
 *   }
 * });
 * (end)
 *
 * Event: mxEvent.UNDO
 *
 * Fires after the selection was changed in <changeSelection>. The
 * <code>edit</code> property contains the {@link UndoableEdit} which contains the
 * {@link SelectionChange}.
 *
 * Event: mxEvent.CHANGE
 *
 * Fires after the selection changes by executing an {@link SelectionChange}. The
 * <code>added</code> and <code>removed</code> properties contain arrays of
 * cells that have been added to or removed from the selection, respectively.
 * The names are inverted due to historic reasons. This cannot be changed.
 *
 * Constructor: mxGraphSelectionModel
 *
 * Constructs a new graph selection model for the given {@link Graph}.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing {@link Graph}.
 */
class GraphSelectionModel extends EventSource {
  constructor(graph: Graph) {
    super();
    this.graph = graph;
    this.cells = [];
  }

  graph: Graph;
  cells: Cell[];

  /**
   * Specifies the resource key for the status message after a long operation.
   * If the resource for this key does not exist then the value is used as
   * the status message. Default is 'done'.
   */
  doneResource = GlobalConfig.i18n.isEnabled() ? 'done' : '';

  /**
   * Specifies the resource key for the status message while the selection is
   * being updated. If the resource for this key does not exist then the
   * value is used as the status message. Default is 'updatingSelection'.
   */
  updatingSelectionResource = GlobalConfig.i18n.isEnabled() ? 'updatingSelection' : '';

  /**
   * Specifies if only one selected item at a time is allowed.
   * Default is false.
   */
  singleSelection = false;

  /**
   * Returns {@link singleSelection} as a boolean.
   */
  isSingleSelection() {
    return this.singleSelection;
  }

  /**
   * Sets the {@link singleSelection} flag.
   *
   * @param {boolean} singleSelection Boolean that specifies the new value for
   * {@link singleSelection}.
   */
  setSingleSelection(singleSelection: boolean) {
    this.singleSelection = singleSelection;
  }

  /**
   * Returns true if the given {@link Cell} is selected.
   */
  isSelected(cell: Cell) {
    return this.cells.indexOf(cell) >= 0;
  }

  /**
   * Returns true if no cells are currently selected.
   */
  isEmpty() {
    return this.cells.length === 0;
  }

  /**
   * Clears the selection and fires a {@link change} event if the selection was not
   * empty.
   */
  clear() {
    this.changeSelection(null, this.cells);
  }

  /**
   * Selects the specified {@link Cell} using {@link setCells}.
   *
   * @param cell {@link mxCell} to be selected.
   */
  setCell(cell: Cell) {
    this.setCells(cell ? [cell] : []);
  }

  /**
   * Selects the given array of {@link Cell} and fires a {@link change} event.
   *
   * @param cells Array of {@link Cell} to be selected.
   */
  setCells(cells: Cell[]) {
    if (this.singleSelection) {
      cells = [<Cell>this.getFirstSelectableCell(cells)];
    }

    const tmp = [];
    for (let i = 0; i < cells.length; i += 1) {
      if (this.graph.isCellSelectable(cells[i])) {
        tmp.push(cells[i]);
      }
    }
    this.changeSelection(tmp, this.cells);
  }

  /**
   * Returns the first selectable cell in the given array of cells.
   */
  getFirstSelectableCell(cells: Cell[]) {
    for (let i = 0; i < cells.length; i += 1) {
      if (this.graph.isCellSelectable(cells[i])) {
        return cells[i];
      }
    }
    return null;
  }

  /**
   * Adds the given {@link Cell} to the selection and fires a {@link select} event.
   *
   * @param cell {@link mxCell} to add to the selection.
   */
  addCell(cell: Cell) {
    this.addCells([cell]);
  }

  /**
   * Adds the given array of {@link Cell} to the selection and fires a {@link select}
   * event.
   *
   * @param cells Array of {@link Cell} to add to the selection.
   */
  addCells(cells: Cell[]) {
    let remove = null;
    if (this.singleSelection) {
      remove = this.cells;

      const selectableCell = this.getFirstSelectableCell(cells);
      cells = selectableCell ? [selectableCell] : [];
    }

    const tmp = [];
    for (let i = 0; i < cells.length; i += 1) {
      if (!this.isSelected(cells[i]) && this.graph.isCellSelectable(cells[i])) {
        tmp.push(cells[i]);
      }
    }

    this.changeSelection(tmp, remove);
  }

  /**
   * Removes the specified {@link Cell} from the selection and fires a {@link select}
   * event for the remaining cells.
   *
   * @param cell {@link mxCell} to remove from the selection.
   */
  removeCell(cell: Cell) {
    this.removeCells([cell]);
  }

  /**
   * Removes the specified {@link Cell} from the selection and fires a {@link select}
   * event for the remaining cells.
   *
   * @param cells {@link mxCell}s to remove from the selection.
   */
  removeCells(cells: Cell[]) {
    const tmp = [];

    for (let i = 0; i < cells.length; i += 1) {
      if (this.isSelected(cells[i])) {
        tmp.push(cells[i]);
      }
    }
    this.changeSelection(null, tmp);
  }

  /**
   * Adds/removes the specified arrays of {@link Cell} to/from the selection.
   *
   * @param added Array of {@link Cell} to add to the selection.
   * @param remove Array of {@link Cell} to remove from the selection.
   */
  changeSelection(added: Cell[] | null = null, removed: Cell[] | null = null) {
    if (
      (added && added.length > 0 && added[0]) ||
      (removed && removed.length > 0 && removed[0])
    ) {
      const change = new SelectionChange(this.graph, added || [], removed || []);
      change.execute();
      const edit = new UndoableEdit(this.graph, false);
      edit.add(change);
      this.fireEvent(new EventObject(InternalEvent.UNDO, { edit }));
    }
  }

  /**
   * Inner callback to add the specified {@link Cell} to the selection. No event
   * is fired in this implementation.
   *
   * Paramters:
   *
   * @param cell {@link mxCell} to add to the selection.
   */
  cellAdded(cell: Cell) {
    if (!this.isSelected(cell)) {
      this.cells.push(cell);
    }
  }

  /**
   * Inner callback to remove the specified {@link Cell} from the selection. No
   * event is fired in this implementation.
   *
   * @param cell {@link mxCell} to remove from the selection.
   */
  cellRemoved(cell: Cell) {
    const index = this.cells.indexOf(cell);
    if (index >= 0) {
      this.cells.splice(index, 1);
    }
  }
}

export default GraphSelectionModel;
