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

import EventSource from '../event/EventSource.js';
import InternalEvent from '../event/InternalEvent.js';
import { convertPoint, sortCells } from '../../util/styleUtils.js';
import RootChange from '../undoable_changes/RootChange.js';
import ChildChange from '../undoable_changes/ChildChange.js';
import TerminalChange from '../undoable_changes/TerminalChange.js';
import GeometryChange from '../undoable_changes/GeometryChange.js';
import VisibleChange from '../undoable_changes/VisibleChange.js';
import StyleChange from '../undoable_changes/StyleChange.js';
import EventObject from '../event/EventObject.js';
import type Cell from '../cell/Cell.js';
import Rectangle from '../geometry/Rectangle.js';
import { getClientX, getClientY } from '../../util/EventUtils.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import GraphLayout from './GraphLayout.js';
import UndoableEdit from '../undoable_changes/UndoableEdit.js';

/**
 * Implements a layout manager that runs a given layout after any changes to the graph:
 *
 * ### Example
 *
 * ```javascript
 * const layoutManager = new LayoutManager(graph);
 * layoutManager.getLayout = (cell, eventName) => {
 *   return layout;
 * };
 * ```
 *
 * See {@link getLayout} for a description of the possible eventNames.
 *
 * #### Event: mxEvent.LAYOUT_CELLS
 *
 * Fires between begin- and endUpdate after all cells have been layouted in
 * {@link layoutCells}. The `cells` property contains all cells that have
 * been passed to {@link layoutCells}.
 *
 * @category Layout
 */
class LayoutManager extends EventSource {
  /**
   * Reference to the enclosing {@link AbstractGraph}.
   */
  graph!: AbstractGraph;

  /**
   * Specifies if the layout should bubble along
   * the cell hierarchy.
   * @default true
   */
  bubbling = true;

  /**
   * Specifies if event handling is enabled.
   * @default true
   */
  enabled = true;

  /**
   * Holds the function that handles the endUpdate event.
   */
  undoHandler: (...args: any[]) => any;

  /**
   * Holds the function that handles the move event.
   */
  moveHandler: (...args: any[]) => any;

  /**
   * Holds the function that handles the resize event.
   */
  resizeHandler: (...args: any[]) => any;

  constructor(graph: AbstractGraph) {
    super();

    // Executes the layout before the changes are dispatched
    this.undoHandler = (sender: any, evt: EventObject) => {
      if (this.isEnabled()) {
        this.beforeUndo(evt.getProperty('edit'));
      }
    };

    // Notifies the layout of a move operation inside a parent
    this.moveHandler = (sender: any, evt: EventObject) => {
      if (this.isEnabled()) {
        this.cellsMoved(evt.getProperty('cells'), evt.getProperty('event'));
      }
    };

    // Notifies the layout of a move operation inside a parent
    this.resizeHandler = (sender: any, evt: EventObject) => {
      if (this.isEnabled()) {
        this.cellsResized(
          evt.getProperty('cells'),
          evt.getProperty('bounds'),
          evt.getProperty('previous')
        );
      }
    };

    this.setGraph(graph);
  }

  /**
   * Returns true if events are handled. This implementation
   * returns {@link enabled}.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enables or disables event handling. This implementation
   * updates {@link enabled}.
   *
   * @param enabled Boolean that specifies the new enabled state.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Returns true if a layout should bubble, that is, if the parent layout
   * should be executed whenever a cell layout (layout of the children of
   * a cell) has been executed. This implementation returns {@link bubbling}.
   */
  isBubbling(): boolean {
    return this.bubbling;
  }

  /**
   * Sets {@link bubbling}.
   */
  setBubbling(value: boolean): void {
    this.bubbling = value;
  }

  /**
   * Returns the graph that this layout operates on.
   */
  getGraph() {
    return this.graph;
  }

  /**
   * Sets the graph that the layouts operate on.
   */
  setGraph(graph: AbstractGraph | null) {
    if (this.graph) {
      const model = this.graph.getDataModel();
      model.removeListener(this.undoHandler);
      this.graph.removeListener(this.moveHandler);
      this.graph.removeListener(this.resizeHandler);
    }

    this.graph = graph!;

    if (this.graph) {
      const model = this.graph.getDataModel();
      model.addListener(InternalEvent.BEFORE_UNDO, this.undoHandler);
      this.graph.addListener(InternalEvent.MOVE_CELLS, this.moveHandler);
      this.graph.addListener(InternalEvent.RESIZE_CELLS, this.resizeHandler);
    }
  }

  /**
   * Returns true if the given cell has a layout. This implementation invokes
   * <getLayout> with {@link Event#LAYOUT_CELLS} as the eventName. Override this
   * if creating layouts in <getLayout> is expensive and return true if
   * <getLayout> will return a layout for the given cell for
   * {@link Event#BEGIN_UPDATE} or {@link Event#END_UPDATE}.
   */
  hasLayout(cell: Cell | null) {
    return !!this.getLayout(cell, InternalEvent.LAYOUT_CELLS);
  }

  /**
   * Returns the layout for the given cell and eventName. Possible
   * event names are {@link InternalEvent.MOVE_CELLS} and {@link InternalEvent.RESIZE_CELLS}
   * for callbacks on when cells are moved or resized and
   * {@link InternalEvent.BEGIN_UPDATE} and {@link InternalEvent.END_UPDATE} for the capture
   * and bubble phase of the layout after any changes of the model.
   */
  getLayout(cell: Cell | null, eventName: string): GraphLayout | null {
    return null;
  }

  /**
   * Called from {@link undoHandler}.
   *
   * @param cell Array of {@link Cell} that have been moved.
   * @param evt Mouse event that represents the mousedown.
   *
   * TODO: what is undoableEdit type?
   */
  beforeUndo(undoableEdit: UndoableEdit) {
    this.executeLayoutForCells(this.getCellsForChanges(undoableEdit.changes));
  }

  /**
   * Called from {@link moveHandler}.
   *
   * @param cell Array of {@link Cell} that have been moved.
   * @param evt Mouse event that represents the mousedown.
   */
  cellsMoved(cells: Cell[], evt: MouseEvent) {
    if (cells.length > 0 && evt) {
      const point = convertPoint(
        this.getGraph().container,
        getClientX(evt),
        getClientY(evt)
      );

      for (let i = 0; i < cells.length; i += 1) {
        const layout = this.getLayout(cells[i].getParent(), InternalEvent.MOVE_CELLS);

        if (layout) {
          layout.moveCell(cells[i], point.x, point.y);
        }
      }
    }
  }

  /**
   * Called from {@link resizeHandler}.
   *
   * @param cell Array of {@link Cell} that have been resized.
   * @param bounds {@link mxRectangle} taht represents the new bounds.
   */
  cellsResized(
    cells: Cell[] | null = null,
    bounds: Rectangle[] | null = null,
    prev: Cell[] | null = null
  ) {
    if (cells && bounds) {
      for (let i = 0; i < cells.length; i += 1) {
        const layout = this.getLayout(cells[i].getParent(), InternalEvent.RESIZE_CELLS);
        if (layout) {
          layout.resizeCell(cells[i], bounds[i], prev?.[i]);
        }
      }
    }
  }

  /**
   * Returns the cells for which a layout should be executed.
   */
  getCellsForChanges(changes: any[]): Cell[] {
    let result: Cell[] = [];
    for (const change of changes) {
      if (change instanceof RootChange) {
        return [];
      }
      result = result.concat(this.getCellsForChange(change));
    }
    return result;
  }

  /**
   * Executes all layouts which have been scheduled during the
   * changes.
   * @param change  mxChildChange|mxTerminalChange|mxVisibleChange|...
   */
  getCellsForChange(change: any): Cell[] {
    if (change instanceof ChildChange) {
      return this.addCellsWithLayout(
        change.child,
        this.addCellsWithLayout(change.previous)
      );
    }

    if (change instanceof TerminalChange || change instanceof GeometryChange) {
      return this.addCellsWithLayout(change.cell);
    }

    if (change instanceof VisibleChange || change instanceof StyleChange) {
      return this.addCellsWithLayout(change.cell);
    }

    return [];
  }

  /**
   * Adds all ancestors of the given cell that have a layout.
   */
  addCellsWithLayout(cell: Cell | null, result: Cell[] = []) {
    return this.addDescendantsWithLayout(cell, this.addAncestorsWithLayout(cell, result));
  }

  /**
   * Adds all ancestors of the given cell that have a layout.
   */
  addAncestorsWithLayout(cell: Cell | null, result: Cell[] = []): Cell[] {
    if (cell) {
      const layout = this.hasLayout(cell);

      if (layout) {
        result.push(cell);
      }

      if (this.isBubbling()) {
        this.addAncestorsWithLayout(cell.getParent(), result);
      }
    }
    return result;
  }

  /**
   * Adds all descendants of the given cell that have a layout.
   */
  addDescendantsWithLayout(cell: Cell | null, result: Cell[] = []) {
    if (cell && this.hasLayout(cell)) {
      for (let i = 0; i < cell.getChildCount(); i += 1) {
        const child = <Cell>cell.getChildAt(i);

        if (this.hasLayout(child)) {
          result.push(child);
          this.addDescendantsWithLayout(child, result);
        }
      }
    }

    return result;
  }

  /**
   * Executes the given layout on the given parent.
   */
  executeLayoutForCells(cells: Cell[]) {
    const sorted = sortCells(cells, false);
    this.layoutCells(sorted, true);
    this.layoutCells(sorted.reverse(), false);
  }

  /**
   * Executes all layouts which have been scheduled during the changes.
   */
  layoutCells(cells: Cell[], bubble = false) {
    if (cells.length > 0) {
      // Invokes the layouts while removing duplicates
      const model = this.getGraph().getDataModel();

      model.batchUpdate(() => {
        let last = null;

        for (const cell of cells) {
          if (cell !== model.getRoot() && cell !== last) {
            this.executeLayout(cell, bubble);
            last = cell;
          }
        }

        this.fireEvent(new EventObject(InternalEvent.LAYOUT_CELLS, { cells }));
      });
    }
  }

  /**
   * Executes the given layout on the given parent.
   */
  executeLayout(cell: Cell, bubble = false) {
    const layout = this.getLayout(
      cell,
      bubble ? InternalEvent.BEGIN_UPDATE : InternalEvent.END_UPDATE
    );
    if (layout) {
      layout.execute(cell);
    }
  }

  /**
   * Removes all handlers from the {@link graph} and deletes the reference to it.
   */
  destroy() {
    this.setGraph(null);
  }
}

export default LayoutManager;
