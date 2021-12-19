/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Point from '../geometry/Point';
import Dictionary from '../../util/Dictionary';
import CellState from './CellState';
import Cell from './Cell';
import { Graph } from '../Graph';
import GraphView from '../GraphView';

/**
 * @class CellStatePreview
 *
 * Implements a live preview for moving cells.
 */
class CellStatePreview {
  constructor(graph: Graph) {
    this.deltas = new Dictionary();
    this.graph = graph;
  }

  /**
   * Reference to the enclosing <mxGraph>.
   */
  graph: Graph;

  /**
   * Reference to the enclosing <mxGraph>.
   */
  deltas: Dictionary<Cell, { point: Point; state: CellState }>;

  /**
   * Contains the number of entries in the map.
   */
  count: number = 0;

  /**
   * Returns true if this contains no entries.
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /**
     *
   * @param {CellState} state
   * @param {number} dx
   * @param {number} dy
   * @param {boolean} add
   * @param {boolean} includeEdges
   * @return {*}  {mxPoint}
   * @memberof mxCellStatePreview
   */
  moveState(
    state: CellState,
    dx: number,
    dy: number,
    add: boolean = true,
    includeEdges: boolean = true
  ): Point {
    let delta = this.deltas.get(state.cell);

    if (delta == null) {
      // Note: Deltas stores the point and the state since the key is a string.
      delta = { point: new Point(dx, dy), state };
      this.deltas.put(state.cell, delta);
      this.count++;
    } else if (add) {
      delta.point.x += dx;
      delta.point.y += dy;
    } else {
      delta.point.x = dx;
      delta.point.y = dy;
    }

    if (includeEdges) {
      this.addEdges(state);
    }
    return delta.point;
  }

  /**
     *
   * @param {Function} visitor
   * @memberof mxCellStatePreview
   */
  show(visitor: Function | null = null): void {
    this.deltas.visit((key: string, delta: any) => {
      this.translateState(delta.state, delta.point.x, delta.point.y);
    });

    this.deltas.visit((key: string, delta: any) => {
      this.revalidateState(delta.state, delta.point.x, delta.point.y, visitor);
    });
  }

  /**
     *
   * @param {CellState} state
   * @param {number} dx
   * @param {number} dy
   * @memberof mxCellStatePreview
   */
  translateState(state: CellState, dx: number, dy: number): void {
    if (state != null) {
      if (state.cell.isVertex()) {
        (<GraphView>state.view).updateCellState(state);
        const geo = state.cell.getGeometry();

        // Moves selection cells and non-relative vertices in
        // the first phase so that edge terminal points will
        // be updated in the second phase
        if (
          (dx !== 0 || dy !== 0) &&
          geo != null &&
          (!geo.relative || this.deltas.get(state.cell) != null)
        ) {
          state.x += dx;
          state.y += dy;
        }
      }

      for (const child of state.cell.getChildren()) {
        this.translateState(<CellState>state.view.getState(child), dx, dy);
      }
    }
  }

  /**
     *
   * @param {CellState} state
   * @param {number} dx
   * @param {number} dy
   * @param {Function} visitor
   * @memberof mxCellStatePreview
   */
  revalidateState(
    state: CellState,
    dx: number,
    dy: number,
    visitor: Function | null = null
  ): void {
    // Updates the edge terminal points and restores the
    // (relative) positions of any (relative) children
    if (state.cell.isEdge()) {
      state.view.updateCellState(state);
    }

    const geo = (<Cell>state.cell).getGeometry();
    const pState = state.view.getState(<Cell>state.cell.getParent());

    // Moves selection vertices which are relative
    if (
      (dx !== 0 || dy !== 0) &&
      geo != null &&
      geo.relative &&
      state.cell.isVertex() &&
      (pState == null || pState.cell.isVertex() || this.deltas.get(state.cell) != null)
    ) {
      state.x += dx;
      state.y += dy;
    }

    this.graph.cellRenderer.redraw(state);

    // Invokes the visitor on the given state
    if (visitor != null) {
      visitor(state);
    }

    for (const child of state.cell.getChildren()) {
      this.revalidateState(<CellState>this.graph.view.getState(child), dx, dy, visitor);
    }
  }

  /**
     *
   * @param {CellState} state
   * @memberof mxCellStatePreview
   */
  addEdges(state: CellState): void {
    const edgeCount = state.cell.getEdgeCount();

    for (let i = 0; i < edgeCount; i += 1) {
      const s = state.view.getState(<Cell>state.cell.getEdgeAt(i));

      if (s != null) {
        this.moveState(s, 0, 0);
      }
    }
  }
}

export default CellStatePreview;
