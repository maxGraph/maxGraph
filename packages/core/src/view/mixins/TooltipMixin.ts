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

import CellState from '../cell/CellState';
import { htmlEntities } from '../../util/StringUtils';
import Translations from '../../util/Translations';
import Shape from '../geometry/Shape';
import Cell from '../cell/Cell';
import { Graph } from '../Graph';
import SelectionCellsHandler from '../handler/SelectionCellsHandler';
import TooltipHandler from '../handler/TooltipHandler';
import { mixInto } from '../../util/Utils';

declare module '../Graph' {
  interface Graph {
    getTooltip: (
      state: CellState,
      node: HTMLElement | SVGElement,
      x: number,
      y: number
    ) => HTMLElement | string | null;
    getTooltipForCell: (cell: Cell) => HTMLElement | string;
    setTooltips: (enabled: boolean) => void;
  }
}

type PartialGraph = Pick<
  Graph,
  'convertValueToString' | 'getPlugin' | 'getCollapseExpandResource'
>;
type PartialTooltip = Pick<Graph, 'getTooltip' | 'getTooltipForCell' | 'setTooltips'>;
type PartialType = PartialGraph & PartialTooltip;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const TooltipMixin: PartialType = {
  /**
   * Returns the string or DOM node that represents the tooltip for the given
   * state, node and coordinate pair. This implementation checks if the given
   * node is a folding icon or overlay and returns the respective tooltip. If
   * this does not result in a tooltip, the handler for the cell is retrieved
   * from {@link selectionCellsHandler} and the optional getTooltipForNode method is
   * called. If no special tooltip exists here then {@link getTooltipForCell} is used
   * with the cell in the given state as the argument to return a tooltip for the
   * given state.
   *
   * @param state {@link CellState} whose tooltip should be returned.
   * @param node DOM node that is currently under the mouse.
   * @param x X-coordinate of the mouse.
   * @param y Y-coordinate of the mouse.
   */
  getTooltip(state, node, x, y) {
    let tip: HTMLElement | string | null = null;

    // Checks if the mouse is over the folding icon
    if (
      state.control &&
      (node === state.control.node || node.parentNode === state.control.node)
    ) {
      tip = this.getCollapseExpandResource();
      tip = htmlEntities(Translations.get(tip) || tip, true).replace(/\\n/g, '<br>');
    }

    if (!tip && state.overlays) {
      state.overlays.visit((id: string, shape: Shape) => {
        // LATER: Exit loop if tip is not null
        if (!tip && (node === shape.node || node.parentNode === shape.node)) {
          tip = shape.overlay ? shape.overlay.toString() ?? null : null;
        }
      });
    }

    if (!tip) {
      const selectionCellsHandler = this.getPlugin(
        'SelectionCellsHandler'
      ) as SelectionCellsHandler;

      const handler = selectionCellsHandler?.getHandler(state.cell);

      // @ts-ignore Guarded against undefined error already.
      if (handler && typeof handler.getTooltipForNode === 'function') {
        // @ts-ignore Guarded against undefined error already.
        tip = handler.getTooltipForNode(node);
      }
    }

    if (!tip) {
      tip = this.getTooltipForCell(state.cell);
    }

    return tip;
  },

  /**
   * Returns the string or DOM node to be used as the tooltip for the given
   * cell. This implementation uses the cells getTooltip function if it
   * exists, or else it returns {@link convertValueToString} for the cell.
   *
   * @example
   *
   * ```javascript
   * graph.getTooltipForCell = function(cell)
   * {
   *   return 'Hello, World!';
   * }
   * ```
   *
   * Replaces all tooltips with the string Hello, World!
   *
   * @param cell {@link mxCell} whose tooltip should be returned.
   */
  getTooltipForCell(cell: Cell) {
    let tip = null;

    if (cell && 'getTooltip' in cell) {
      // @ts-ignore getTooltip() must exists.
      tip = cell.getTooltip();
    } else {
      tip = this.convertValueToString(cell);
    }

    return tip;
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Specifies if tooltips should be enabled.
   *
   * This implementation updates {@link TooltipHandler.enabled}.
   *
   * @param enabled Boolean indicating if tooltips should be enabled.
   */
  setTooltips(enabled: boolean) {
    const tooltipHandler = this.getPlugin('TooltipHandler') as TooltipHandler;
    tooltipHandler?.setEnabled(enabled);
  },
};

mixInto(Graph)(TooltipMixin);
