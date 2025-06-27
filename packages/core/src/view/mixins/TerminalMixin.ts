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

import type Cell from '../cell/Cell';
import type { AbstractGraph } from '../AbstractGraph';

type PartialGraph = Pick<AbstractGraph, 'getView'>;
type PartialTerminal = Pick<AbstractGraph, 'isTerminalPointMovable' | 'getOpposites'>;
type PartialType = PartialGraph & PartialTerminal;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const TerminalMixin: PartialType = {
  isTerminalPointMovable(cell, source) {
    return true;
  },

  getOpposites(
    edges,
    terminal = null,
    includeSources = true,
    includeTargets = true
  ): Cell[] {
    const terminals: Cell[] = [];

    // Fast lookup to avoid duplicates in terminals array
    const coveredEntries = new Map<Cell, boolean>();

    for (let i = 0; i < edges.length; i += 1) {
      const state = this.getView().getState(edges[i]);

      const source = state
        ? state.getVisibleTerminal(true)
        : this.getView().getVisibleTerminal(edges[i], true);
      const target = state
        ? state.getVisibleTerminal(false)
        : this.getView().getVisibleTerminal(edges[i], false);

      // Checks if the terminal is the source of the edge and if the target should be stored in the result
      if (source === terminal && target && target !== terminal && includeTargets) {
        if (!coveredEntries.has(target)) {
          coveredEntries.set(target, true);
          terminals.push(target);
        }
      }

      // Checks if the terminal is the target of the edge and if the source should be stored in the result
      else if (target === terminal && source && source !== terminal && includeSources) {
        if (!coveredEntries.has(source)) {
          coveredEntries.set(source, true);
          terminals.push(source);
        }
      }
    }
    return terminals;
  },
};
