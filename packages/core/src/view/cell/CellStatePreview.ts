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

import Point from '../geometry/Point.js';
import type CellState from './CellState.js';
import type Cell from './Cell.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type GraphView from '../GraphView.js';

// only used by the deltas property which is not supposed to be accessed directly (should be private)
interface CellDelta {
  point: Point;
  state: CellState;
}

/**
 * Implements a live preview for moving cells.
 */
class CellStatePreview {
  constructor(graph: AbstractGraph) {
    this.deltas = new Map();
    this.graph = graph;
  }

  /**
   * Reference to the enclosing {@link AbstractGraph}.
   */
  graph: AbstractGraph;

  deltas: Map<Cell, CellDelta>;

  /**
   * Contains the number of entries in the map.
   */
  count = 0;

  /**
   * Returns true if this contains no entries.
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  moveState(
    state: CellState,
    dx: number,
    dy: number,
    add = true,
    includeEdges = true
  ): Point {
    let delta = this.deltas.get(state.cell);

    if (delta == null) {
      // Note: Deltas stores the point and the state since the key is a string.
      delta = { point: new Point(dx, dy), state };
      this.deltas.set(state.cell, delta);
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
   */
  show(visitor: Function | null = null): void {
    this.deltas.forEach((delta) => {
      this.translateState(delta.state, delta.point.x, delta.point.y);
    });

    this.deltas.forEach((delta) => {
      this.revalidateState(delta.state, delta.point.x, delta.point.y, visitor);
    });
  }

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
