/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import EventSource from '../event/EventSource';
import InternalEvent from '../event/InternalEvent';
import { convertPoint, sortCells } from '../../util/Utils';
import RootChange from '../model/RootChange';
import ChildChange from '../model/ChildChange';
import TerminalChange from '../cell/edge/TerminalChange';
import GeometryChange from '../geometry/GeometryChange';
import VisibleChange from '../style/VisibleChange';
import StyleChange from '../style/StyleChange';
import EventObject from '../event/EventObject';
import Cell from '../cell/datatypes/Cell';
import Rectangle from '../geometry/Rectangle';
import InternalMouseEvent from '../event/InternalMouseEvent';
import { getClientX, getClientY } from '../../util/EventUtils';
import CellArray from '../cell/datatypes/CellArray';
import { Graph } from '../Graph';

/**
 * @class LayoutManager
 * @extends {EventSource}
 *
 * Implements a layout manager that runs a given layout after any changes to the graph:
 *
 * ### Example
 *
 * @example
 * ```javascript
 * var layoutMgr = new mxLayoutManager(graph);
 * layoutMgr.getLayout(cell, eventName)
 * {
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
 */
class LayoutManager extends EventSource {
  constructor(graph: Graph) {
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
   * Reference to the enclosing {@link graph}.
   */
  graph: Graph | null = null;

  /**
   * Specifies if the layout should bubble along
   * the cell hierarchy.
   * @default true
   */
  bubbling: boolean = true;

  /**
   * Specifies if event handling is enabled.
   * @default true
   */
  enabled: boolean = true;

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
  getGraph(): Graph | null {
    return this.graph;
  }

  /**
   * Sets the graph that the layouts operate on.
   */
  // setGraph(graph: mxGraph): void;
  setGraph(graph: Graph | null): void {
    if (this.graph != null) {
      const model = this.graph.getModel();
      model.removeListener(this.undoHandler);
      this.graph.removeListener(this.moveHandler);
      this.graph.removeListener(this.resizeHandler);
    }

    this.graph = graph;

    if (this.graph != null) {
      const model = this.graph.getModel();
      model.addListener(InternalEvent.BEFORE_UNDO, this.undoHandler);
      this.graph.addListener(InternalEvent.MOVE_CELLS, this.moveHandler);
      this.graph.addListener(InternalEvent.RESIZE_CELLS, this.resizeHandler);
    }
  }

  /**
   * Function: hasLayout
   *
   * Returns true if the given cell has a layout. This implementation invokes
   * <getLayout> with <mxEvent.LAYOUT_CELLS> as the eventName. Override this
   * if creating layouts in <getLayout> is expensive and return true if
   * <getLayout> will return a layout for the given cell for
   * <mxEvent.BEGIN_UPDATE> or <mxEvent.END_UPDATE>.
   */
  hasLayout(cell: Cell | null): boolean {
    return !!this.getLayout(cell, InternalEvent.LAYOUT_CELLS);
  }

  /**
   * Returns the layout for the given cell and eventName. Possible
   * event names are {@link InternalEvent.MOVE_CELLS} and {@link InternalEvent.RESIZE_CELLS}
   * for callbacks on when cells are moved or resized and
   * {@link InternalEvent.BEGIN_UPDATE} and {@link InternalEvent.END_UPDATE} for the capture
   * and bubble phase of the layout after any changes of the model.
   */
  // getLayout(cell: mxCell, eventName?: string): mxGraphLayout | null;
  getLayout(cell: Cell | null, eventName: string): any {
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
  beforeUndo(undoableEdit: any): void {
    this.executeLayoutForCells(this.getCellsForChanges(undoableEdit.changes));
  }

  /**
   * Called from {@link moveHandler}.
   *
   * @param cell Array of {@link Cell} that have been moved.
   * @param evt Mouse event that represents the mousedown.
   */
  cellsMoved(cells: CellArray, evt: InternalMouseEvent): void {
    if (cells != null && evt != null) {
      const point = convertPoint(
        (<Graph>this.getGraph()).container,
        getClientX(evt),
        getClientY(evt)
      );
      const model = (<Graph>this.getGraph()).getModel();

      for (let i = 0; i < cells.length; i += 1) {
        const layout = this.getLayout(cells[i].getParent(), InternalEvent.MOVE_CELLS);

        if (layout != null) {
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
    cells: CellArray | null = null,
    bounds: Rectangle[] | null = null,
    prev: CellArray | null = null
  ): void {
    if (cells != null && bounds != null) {
      const model = (<Graph>this.getGraph()).getModel();

      for (let i = 0; i < cells.length; i += 1) {
        const layout = this.getLayout(cells[i].getParent(), InternalEvent.RESIZE_CELLS);
        if (layout != null) {
          layout.resizeCell(cells[i], bounds[i], prev?.[i]);
        }
      }
    }
  }

  /**
   * Returns the cells for which a layout should be executed.
   */
  getCellsForChanges(changes: any[]): CellArray {
    let result: CellArray = new CellArray();
    for (const change of changes) {
      if (change instanceof RootChange) {
        return new CellArray();
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
  getCellsForChange(change: any): CellArray {
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

    return new CellArray();
  }

  /**
   * Adds all ancestors of the given cell that have a layout.
   */
  addCellsWithLayout(cell: Cell, result: CellArray = new CellArray()): CellArray {
    return this.addDescendantsWithLayout(cell, this.addAncestorsWithLayout(cell, result));
  }

  /**
   * Adds all ancestors of the given cell that have a layout.
   */
  addAncestorsWithLayout(cell: Cell, result: CellArray = new CellArray()): CellArray {
    if (cell != null) {
      const layout = this.hasLayout(cell);

      if (layout != null) {
        result.push(cell);
      }

      if (this.isBubbling()) {
        const model = (<Graph>this.getGraph()).getModel();
        this.addAncestorsWithLayout(<Cell>cell.getParent(), result);
      }
    }
    return result;
  }

  /**
   * Adds all descendants of the given cell that have a layout.
   */
  addDescendantsWithLayout(cell: Cell, result: CellArray = new CellArray()): CellArray {
    if (cell != null && this.hasLayout(cell)) {
      const model = (<Graph>this.getGraph()).getModel();

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
  executeLayoutForCells(cells: CellArray): void {
    const sorted = sortCells(cells, false);
    this.layoutCells(sorted, true);
    this.layoutCells(sorted.reverse(), false);
  }

  /**
   * Executes all layouts which have been scheduled during the changes.
   */
  layoutCells(cells: CellArray, bubble: boolean = false): void {
    if (cells.length > 0) {
      // Invokes the layouts while removing duplicates
      const model = (<Graph>this.getGraph()).getModel();

      model.beginUpdate();
      try {
        let last = null;

        for (const cell of cells) {
          if (cell !== model.getRoot() && cell !== last) {
            this.executeLayout(cell, bubble);
            last = cell;
          }
        }

        this.fireEvent(new EventObject(InternalEvent.LAYOUT_CELLS, 'cells', cells));
      } finally {
        model.endUpdate();
      }
    }
  }

  /**
   * Executes the given layout on the given parent.
   */
  executeLayout(cell: Cell, bubble: boolean = false): void {
    const layout = this.getLayout(
      cell,
      bubble ? InternalEvent.BEGIN_UPDATE : InternalEvent.END_UPDATE
    );
    if (layout != null) {
      layout.execute(cell);
    }
  }

  /**
   * Removes all handlers from the {@link graph} and deletes the reference to it.
   */
  destroy(): void {
    this.setGraph(null);
  }
}

export default LayoutManager;
