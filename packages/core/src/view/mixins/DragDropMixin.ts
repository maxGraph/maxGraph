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

import type { Graph } from '../Graph';

type PartialGraph = Pick<Graph, 'getEdgeValidationError'>;
type PartialDragDrop = Pick<
  Graph,
  | 'dropEnabled'
  | 'splitEnabled'
  | 'autoScroll'
  | 'autoExtend'
  | 'isAutoScroll'
  | 'isAutoExtend'
  | 'isDropEnabled'
  | 'setDropEnabled'
  | 'isSplitEnabled'
  | 'setSplitEnabled'
  | 'isSplitTarget'
>;
type PartialType = PartialGraph & PartialDragDrop;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const DragDropMixin: PartialType = {
  dropEnabled: false,

  splitEnabled: true,

  autoScroll: true,

  isAutoScroll() {
    return this.autoScroll;
  },

  autoExtend: true,

  isAutoExtend() {
    return this.autoExtend;
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  isDropEnabled() {
    return this.dropEnabled;
  },

  setDropEnabled(value) {
    this.dropEnabled = value;
  },

  /*****************************************************************************
   * Group: Split behaviour
   *****************************************************************************/

  isSplitEnabled() {
    return this.splitEnabled;
  },

  setSplitEnabled(value) {
    this.splitEnabled = value;
  },

  isSplitTarget(target, cells = [], evt) {
    if (
      target.isEdge() &&
      cells.length === 1 &&
      cells[0].isConnectable() &&
      !this.getEdgeValidationError(target, target.getTerminal(true), cells[0])
    ) {
      const src = target.getTerminal(true);
      const trg = target.getTerminal(false);

      return !cells[0].isAncestor(src) && !cells[0].isAncestor(trg);
    }
    return false;
  },
};
