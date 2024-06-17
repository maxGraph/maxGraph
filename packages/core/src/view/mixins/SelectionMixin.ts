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
import Dictionary from '../../util/Dictionary';
import RootChange from '../undoable_changes/RootChange';
import ChildChange from '../undoable_changes/ChildChange';
import type { Graph } from '../Graph';

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
export const SelectionMixin: PartialType = {
  selectionModel: null,

  getSelectionModel() {
    return this.selectionModel;
  },

  setSelectionModel(selectionModel) {
    this.selectionModel = selectionModel;
  },

  /*****************************************************************************
   * Selection
   *****************************************************************************/

  isCellSelected(cell) {
    return this.selectionModel.isSelected(cell);
  },

  isSelectionEmpty() {
    return this.selectionModel.isEmpty();
  },

  clearSelection() {
    this.selectionModel.clear();
  },

  getSelectionCount() {
    return this.selectionModel.cells.length;
  },

  getSelectionCell() {
    return this.selectionModel.cells[0];
  },

  getSelectionCells() {
    return this.selectionModel.cells.slice();
  },

  setSelectionCell(cell) {
    this.selectionModel.setCell(cell);
  },

  setSelectionCells(cells) {
    this.selectionModel.setCells(cells);
  },

  addSelectionCell(cell) {
    this.selectionModel.addCell(cell);
  },

  addSelectionCells(cells) {
    this.selectionModel.addCells(cells);
  },

  removeSelectionCell(cell) {
    this.selectionModel.removeCell(cell);
  },

  removeSelectionCells(cells) {
    this.selectionModel.removeCells(cells);
  },

  selectRegion(rect, evt) {
    const cells = this.getCells(rect.x, rect.y, rect.width, rect.height);
    this.selectCellsForEvent(cells, evt);
    return cells;
  },

  selectNextCell() {
    this.selectCell(true);
  },

  selectPreviousCell() {
    this.selectCell();
  },

  selectParentCell() {
    this.selectCell(false, true);
  },

  selectChildCell() {
    this.selectCell(false, false, true);
  },

  selectCell(isNext = false, isParent = false, isChild = false) {
    const cell =
      this.selectionModel.cells.length > 0 ? this.selectionModel.cells[0] : null;

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

  selectAll(parent, descendants = false) {
    parent = parent ?? this.getDefaultParent();

    const cells = descendants
      ? parent.filterDescendants((cell: Cell) => {
          return cell !== parent && !!this.getView().getState(cell);
        })
      : parent.getChildren();

    this.setSelectionCells(cells);
  },

  selectVertices(parent, selectGroups = false) {
    this.selectCells(true, false, parent, selectGroups);
  },

  selectEdges(parent) {
    this.selectCells(false, true, parent);
  },

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

  selectCellsForEvent(cells, evt) {
    if (this.isToggleEvent(evt)) {
      this.addSelectionCells(cells);
    } else {
      this.setSelectionCells(cells);
    }
  },

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

  getSelectionCellsForChanges(changes, ignoreFn = null) {
    const dict = new Dictionary();
    const cells: Cell[] = [];

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

  updateSelection() {
    const cells = this.getSelectionCells();
    const removed = [];

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
