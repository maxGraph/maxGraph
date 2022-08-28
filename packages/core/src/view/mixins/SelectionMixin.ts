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
import CellArray from '../cell/CellArray';
import Rectangle from '../geometry/Rectangle';
import Dictionary from '../../util/Dictionary';
import RootChange from '../undoable_changes/RootChange';
import ChildChange from '../undoable_changes/ChildChange';
import { Graph } from '../Graph';
import { mixInto } from '../../util/Utils';
import GraphSelectionModel from '../GraphSelectionModel';

declare module '../Graph' {
  interface Graph {
    cells: CellArray;
    doneResource: string;
    updatingSelectionResource: string;
    singleSelection: boolean;
    selectionModel: any | null;

    getSelectionModel: () => GraphSelectionModel;
    setSelectionModel: (selectionModel: GraphSelectionModel) => void;
    isCellSelected: (cell: Cell) => boolean;
    isSelectionEmpty: () => boolean;
    clearSelection: () => void;
    getSelectionCount: () => number;
    getSelectionCell: () => Cell;
    getSelectionCells: () => CellArray;
    setSelectionCell: (cell: Cell | null) => void;
    setSelectionCells: (cells: CellArray) => void;
    addSelectionCell: (cell: Cell) => void;
    addSelectionCells: (cells: CellArray) => void;
    removeSelectionCell: (cell: Cell) => void;
    removeSelectionCells: (cells: CellArray) => void;
    selectRegion: (rect: Rectangle, evt: MouseEvent) => CellArray;
    selectNextCell: () => void;
    selectPreviousCell: () => void;
    selectParentCell: () => void;
    selectChildCell: () => void;
    selectCell: (isNext?: boolean, isParent?: boolean, isChild?: boolean) => void;
    selectAll: (parent?: Cell | null, descendants?: boolean) => void;
    selectVertices: (parent?: Cell | null, selectGroups?: boolean) => void;
    selectEdges: (parent?: Cell | null) => void;
    selectCells: (
      vertices: boolean,
      edges: boolean,
      parent?: Cell | null,
      selectGroups?: boolean
    ) => void;
    selectCellForEvent: (cell: Cell, evt: MouseEvent) => void;
    selectCellsForEvent: (cells: CellArray, evt: MouseEvent) => void;
    isSiblingSelected: (cell: Cell) => boolean;
    getSelectionCellsForChanges: (changes: any[], ignoreFn?: Function | null) => CellArray;
    updateSelection: () => void;
  }
}

type PartialGraph = Pick<
  Graph,
  | 'getDataModel'
  | 'getView'
  | 'isCellSelectable'
  | 'fireEvent'
  | 'getDefaultParent'
  | 'getCurrentRoot'
  | 'getCells'
  | 'isToggleEvent'
>;
type PartialCells = Pick<
  Graph,
  | 'singleSelection'
  | 'selectionModel'
  | 'getSelectionModel'
  | 'setSelectionModel'
  | 'isCellSelected'
  | 'isSelectionEmpty'
  | 'clearSelection'
  | 'getSelectionCount'
  | 'getSelectionCell'
  | 'getSelectionCells'
  | 'setSelectionCell'
  | 'setSelectionCells'
  | 'addSelectionCell'
  | 'addSelectionCells'
  | 'removeSelectionCell'
  | 'removeSelectionCells'
  | 'selectRegion'
  | 'selectNextCell'
  | 'selectPreviousCell'
  | 'selectParentCell'
  | 'selectChildCell'
  | 'selectCell'
  | 'selectAll'
  | 'selectVertices'
  | 'selectEdges'
  | 'selectCells'
  | 'selectCellForEvent'
  | 'selectCellsForEvent'
  | 'isSiblingSelected'
  | 'getSelectionCellsForChanges'
  | 'updateSelection'
>;
type PartialType = PartialGraph & PartialCells;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const SelectionMixin: PartialType = {
  selectionModel: null,

  /**
   * Returns the {@link mxGraphSelectionModel} that contains the selection.
   */
  getSelectionModel() {
    return this.selectionModel;
  },

  /**
   * Sets the {@link mxSelectionModel} that contains the selection.
   */
  setSelectionModel(selectionModel) {
    this.selectionModel = selectionModel;
  },

  /*****************************************************************************
   * Selection
   *****************************************************************************/

  /**
   * Returns true if the given cell is selected.
   *
   * @param cell {@link mxCell} for which the selection state should be returned.
   */
  isCellSelected(cell) {
    return this.selectionModel.isSelected(cell);
  },

  /**
   * Returns true if the selection is empty.
   */
  isSelectionEmpty() {
    return this.selectionModel.isEmpty();
  },

  /**
   * Clears the selection using {@link mxGraphSelectionModel.clear}.
   */
  clearSelection() {
    this.selectionModel.clear();
  },

  /**
   * Returns the number of selected cells.
   */
  getSelectionCount() {
    return this.selectionModel.cells.length;
  },

  /**
   * Returns the first cell from the array of selected {@link Cell}.
   */
  getSelectionCell() {
    return this.selectionModel.cells[0];
  },

  /**
   * Returns the array of selected {@link Cell}.
   */
  getSelectionCells() {
    return this.selectionModel.cells.slice();
  },

  /**
   * Sets the selection cell.
   *
   * @param cell {@link mxCell} to be selected.
   */
  setSelectionCell(cell) {
    this.selectionModel.setCell(cell);
  },

  /**
   * Sets the selection cell.
   *
   * @param cells Array of {@link Cell} to be selected.
   */
  setSelectionCells(cells) {
    this.selectionModel.setCells(cells);
  },

  /**
   * Adds the given cell to the selection.
   *
   * @param cell {@link mxCell} to be add to the selection.
   */
  addSelectionCell(cell) {
    this.selectionModel.addCell(cell);
  },

  /**
   * Adds the given cells to the selection.
   *
   * @param cells Array of {@link Cell} to be added to the selection.
   */
  addSelectionCells(cells) {
    this.selectionModel.addCells(cells);
  },

  /**
   * Removes the given cell from the selection.
   *
   * @param cell {@link mxCell} to be removed from the selection.
   */
  removeSelectionCell(cell) {
    this.selectionModel.removeCell(cell);
  },

  /**
   * Removes the given cells from the selection.
   *
   * @param cells Array of {@link Cell} to be removed from the selection.
   */
  removeSelectionCells(cells) {
    this.selectionModel.removeCells(cells);
  },

  /**
   * Selects and returns the cells inside the given rectangle for the
   * specified event.
   *
   * @param rect {@link mxRectangle} that represents the region to be selected.
   * @param evt Mouseevent that triggered the selection.
   */
  // selectRegion(rect: mxRectangle, evt: Event): mxCellArray;
  selectRegion(rect, evt) {
    const cells = this.getCells(rect.x, rect.y, rect.width, rect.height);
    this.selectCellsForEvent(cells, evt);
    return cells;
  },

  /**
   * Selects the next cell.
   */
  selectNextCell() {
    this.selectCell(true);
  },

  /**
   * Selects the previous cell.
   */
  selectPreviousCell() {
    this.selectCell();
  },

  /**
   * Selects the parent cell.
   */
  selectParentCell() {
    this.selectCell(false, true);
  },

  /**
   * Selects the first child cell.
   */
  selectChildCell() {
    this.selectCell(false, false, true);
  },

  /**
   * Selects the next, parent, first child or previous cell, if all arguments
   * are false.
   *
   * @param isNext Boolean indicating if the next cell should be selected.
   * @param isParent Boolean indicating if the parent cell should be selected.
   * @param isChild Boolean indicating if the first child cell should be selected.
   */
  selectCell(isNext = false, isParent = false, isChild = false) {
    const cell = this.selectionModel.cells.length > 0 ? this.selectionModel.cells[0] : null;

    if (this.selectionModel.cells.length > 1) {
      this.selectionModel.clear();
    }

    const parent = cell ? (cell.getParent() as Cell) : this.getDefaultParent();
    const childCount = parent.getChildCount();

    if (!cell && childCount > 0) {
      const child = parent.getChildAt(0);
      this.setSelectionCell(child);
    } else if (
      parent &&
      (!cell || isParent) &&
      this.getView().getState(parent) &&
      parent.getGeometry()
    ) {
      if (this.getCurrentRoot() !== parent) {
        this.setSelectionCell(parent);
      }
    } else if (cell && isChild) {
      const tmp = cell.getChildCount();

      if (tmp > 0) {
        const child = cell.getChildAt(0);
        this.setSelectionCell(child);
      }
    } else if (childCount > 0) {
      let i = parent.getIndex(cell);

      if (isNext) {
        i++;
        const child = parent.getChildAt(i % childCount);
        this.setSelectionCell(child);
      } else {
        i--;
        const index = i < 0 ? childCount - 1 : i;
        const child = parent.getChildAt(index);
        this.setSelectionCell(child);
      }
    }
  },

  /**
   * Selects all children of the given parent cell or the children of the
   * default parent if no parent is specified. To select leaf vertices and/or
   * edges use {@link selectCells}.
   *
   * @param parent Optional {@link Cell} whose children should be selected.
   * Default is {@link defaultParent}.
   * @param descendants Optional boolean specifying whether all descendants should be
   * selected. Default is `false`.
   */
  selectAll(parent, descendants = false) {
    parent = parent ?? this.getDefaultParent();

    const cells = descendants
      ? parent.filterDescendants((cell: Cell) => {
          return cell !== parent && !!this.getView().getState(cell);
        })
      : parent.getChildren();

    this.setSelectionCells(cells);
  },

  /**
   * Select all vertices inside the given parent or the default parent.
   */
  selectVertices(parent, selectGroups = false) {
    this.selectCells(true, false, parent, selectGroups);
  },

  /**
   * Select all vertices inside the given parent or the default parent.
   */
  selectEdges(parent) {
    this.selectCells(false, true, parent);
  },

  /**
   * Selects all vertices and/or edges depending on the given boolean
   * arguments recursively, starting at the given parent or the default
   * parent if no parent is specified. Use {@link selectAll} to select all cells.
   * For vertices, only cells with no children are selected.
   *
   * @param vertices Boolean indicating if vertices should be selected.
   * @param edges Boolean indicating if edges should be selected.
   * @param parent Optional {@link Cell} that acts as the root of the recursion.
   * Default is {@link defaultParent}.
   * @param selectGroups Optional boolean that specifies if groups should be
   * selected. Default is `false`.
   */
  selectCells(vertices = false, edges = false, parent, selectGroups = false) {
    parent = parent ?? this.getDefaultParent();

    const filter = (cell: Cell) => {
      const p = cell.getParent();

      return (
        !!this.getView().getState(cell) &&
        (((selectGroups || cell.getChildCount() === 0) &&
          cell.isVertex() &&
          vertices &&
          p &&
          !p.isEdge()) ||
          (cell.isEdge() && edges))
      );
    };

    const cells = parent.filterDescendants(filter);
    this.setSelectionCells(cells);
  },

  /**
   * Selects the given cell by either adding it to the selection or
   * replacing the selection depending on whether the given mouse event is a
   * toggle event.
   *
   * @param cell {@link mxCell} to be selected.
   * @param evt Optional mouseevent that triggered the selection.
   */
  selectCellForEvent(cell, evt) {
    const isSelected = this.isCellSelected(cell);

    if (this.isToggleEvent(evt)) {
      if (isSelected) {
        this.removeSelectionCell(cell);
      } else {
        this.addSelectionCell(cell);
      }
    } else if (!isSelected || this.getSelectionCount() !== 1) {
      this.setSelectionCell(cell);
    }
  },

  /**
   * Selects the given cells by either adding them to the selection or
   * replacing the selection depending on whether the given mouse event is a
   * toggle event.
   *
   * @param cells Array of {@link Cell} to be selected.
   * @param evt Optional mouseevent that triggered the selection.
   */
  selectCellsForEvent(cells, evt) {
    if (this.isToggleEvent(evt)) {
      this.addSelectionCells(cells);
    } else {
      this.setSelectionCells(cells);
    }
  },

  /**
   * Returns true if any sibling of the given cell is selected.
   */
  isSiblingSelected(cell) {
    const parent = cell.getParent() as Cell;
    const childCount = parent.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = parent.getChildAt(i);
      if (cell !== child && this.isCellSelected(child)) {
        return true;
      }
    }

    return false;
  },

  /*****************************************************************************
   * Selection state
   *****************************************************************************/

  /**
   * Returns the cells to be selected for the given array of changes.
   *
   * @param ignoreFn Optional function that takes a change and returns true if the
   * change should be ignored.
   */
  getSelectionCellsForChanges(changes, ignoreFn = null) {
    const dict = new Dictionary();
    const cells: CellArray = new CellArray();

    const addCell = (cell: Cell) => {
      if (!dict.get(cell) && this.getDataModel().contains(cell)) {
        if (cell.isEdge() || cell.isVertex()) {
          dict.put(cell, true);
          cells.push(cell);
        } else {
          const childCount = cell.getChildCount();

          for (let i = 0; i < childCount; i += 1) {
            addCell(cell.getChildAt(i));
          }
        }
      }
    };

    for (let i = 0; i < changes.length; i += 1) {
      const change = changes[i];

      if (change.constructor !== RootChange && (!ignoreFn || !ignoreFn(change))) {
        let cell = null;

        if (change instanceof ChildChange) {
          cell = change.child;
        } else if (change.cell && change.cell instanceof Cell) {
          cell = change.cell;
        }

        if (cell) {
          addCell(cell);
        }
      }
    }
    return cells;
  },

  /**
   * Removes selection cells that are not in the model from the selection.
   */
  updateSelection() {
    const cells = this.getSelectionCells();
    const removed = new CellArray();

    for (const cell of cells) {
      if (!this.getDataModel().contains(cell) || !cell.isVisible()) {
        removed.push(cell);
      } else {
        let par = cell.getParent();

        while (par && par !== this.getView().currentRoot) {
          if (par.isCollapsed() || !par.isVisible()) {
            removed.push(cell);
            break;
          }

          par = par.getParent();
        }
      }
    }
    this.removeSelectionCells(removed);
  },
};

mixInto(Graph)(SelectionMixin);
