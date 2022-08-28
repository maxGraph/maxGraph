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

import CellArray from '../cell/CellArray';
import Cell from '../cell/Cell';
import Dictionary from '../../util/Dictionary';
import { Graph } from '../Graph';
import { mixInto } from '../../util/Utils';

declare module '../Graph' {
  interface Graph {
    isTerminalPointMovable: (cell: Cell, source: boolean) => boolean;
    getOpposites: (
      edges: CellArray,
      terminal: Cell | null,
      sources?: boolean,
      targets?: boolean
    ) => CellArray;
  }
}

type PartialGraph = Pick<Graph, 'getView'>;
type PartialTerminal = Pick<Graph, 'isTerminalPointMovable' | 'getOpposites'>;
type PartialType = PartialGraph & PartialTerminal;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const TerminalMixin: PartialType = {
  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Returns true if the given terminal point is movable. This is independent
   * from {@link isCellConnectable} and {@link isCellDisconnectable} and controls if terminal
   * points can be moved in the graph if the edge is not connected. Note that it
   * is required for this to return true to connect unconnected edges. This
   * implementation returns true.
   *
   * @param cell {@link mxCell} whose terminal point should be moved.
   * @param source Boolean indicating if the source or target terminal should be moved.
   */
  isTerminalPointMovable(cell, source) {
    return true;
  },

  /*****************************************************************************
   * Group: Cell retrieval
   *****************************************************************************/

  /**
   * Returns all distinct visible opposite cells for the specified terminal
   * on the given edges.
   *
   * @param edges Array of {@link Cell} that contains the edges whose opposite
   * terminals should be returned.
   * @param terminal Terminal that specifies the end whose opposite should be
   * returned.
   * @param sources Optional boolean that specifies if source terminals should be
   * included in the result. Default is `true`.
   * @param targets Optional boolean that specifies if targer terminals should be
   * included in the result. Default is `true`.
   */
  getOpposites(edges, terminal = null, sources = true, targets = true) {
    const terminals = new CellArray();

    // Fast lookup to avoid duplicates in terminals array
    const dict = new Dictionary<Cell, boolean>();

    for (let i = 0; i < edges.length; i += 1) {
      const state = this.getView().getState(edges[i]);

      const source = state
        ? state.getVisibleTerminal(true)
        : this.getView().getVisibleTerminal(edges[i], true);
      const target = state
        ? state.getVisibleTerminal(false)
        : this.getView().getVisibleTerminal(edges[i], false);

      // Checks if the terminal is the source of the edge and if the
      // target should be stored in the result
      if (source === terminal && target && target !== terminal && targets) {
        if (!dict.get(target)) {
          dict.put(target, true);
          terminals.push(target);
        }
      }

      // Checks if the terminal is the taget of the edge and if the
      // source should be stored in the result
      else if (target === terminal && source && source !== terminal && sources) {
        if (!dict.get(source)) {
          dict.put(source, true);
          terminals.push(source);
        }
      }
    }
    return terminals;
  },
};

mixInto(Graph)(TerminalMixin);
