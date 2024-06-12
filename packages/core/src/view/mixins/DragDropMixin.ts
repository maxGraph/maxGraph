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

import { mixInto } from '../../util/Utils';
import Cell from '../cell/Cell';
import { Graph } from '../Graph';

declare module '../Graph' {
  interface Graph {
    /**
     * Specifies the return value for {@link isDropEnabled}.
     * @default false
     */
    dropEnabled: boolean;

    /**
     * Specifies if dropping onto edges should be enabled.
     *
     * This is ignored if {@link dropEnabled} is `false`.
     * If enabled, it will call {@link splitEdge} to carry out the drop operation.
     * @default true
     */
    splitEnabled: boolean;

    /**
     * Specifies if the graph should automatically scroll if the mouse goes near
     * the container edge while dragging.
     *
     * This is only taken into account if the container has scrollbars.
     *
     * If you need this to work without scrollbars then set {@link ignoreScrollbars} to
     * true. Please consult the {@link ignoreScrollbars} for details. In general, with
     * no scrollbars, the use of {@link allowAutoPanning} is recommended.
     * @default true
     */
    autoScroll: boolean;

    /**
     * Specifies if the size of the graph should be automatically extended if the
     * mouse goes near the container edge while dragging.
     *
     * This is only taken into account if the container has scrollbars.
     *
     * See {@link autoScroll}.
     * @default true
     */
    autoExtend: boolean;

    isAutoScroll: () => boolean;

    isAutoExtend: () => boolean;

    /**
     * Returns {@link dropEnabled} as a boolean.
     */
    isDropEnabled: () => boolean;

    /**
     * Specifies if the graph should allow dropping of cells onto or into other cells.
     *
     * @param value Boolean indicating if the graph should allow dropping of cells into other cells.
     */
    setDropEnabled: (value: boolean) => void;

    /**
     * Returns {@link splitEnabled} as a boolean.
     */
    isSplitEnabled: () => boolean;

    /**
     * Specifies if the graph should allow dropping of cells onto or into other cells.
     *
     * @param value Boolean indicating if the graph should allow dropping of cells into other cells.
     */
    setSplitEnabled: (value: boolean) => void;

    /**
     * Returns `true` if the given edge may be split into two edges with the given cell as a new terminal between the two.
     *
     * @param target {@link Cell} that represents the edge to be split.
     * @param cells {@link Cell} that should split the edge.
     * @param evt MouseEvent that triggered the invocation.
     */
    isSplitTarget: (target: Cell, cells?: Cell[], evt?: MouseEvent | null) => boolean;
  }
}

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
const DragDropMixin: PartialType = {
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

mixInto(Graph)(DragDropMixin);
