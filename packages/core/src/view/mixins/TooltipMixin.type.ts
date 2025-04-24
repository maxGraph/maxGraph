/*
Copyright 2024-present The maxGraph project Contributors

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

import type CellState from '../cell/CellState';
import type Cell from '../cell/Cell';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Returns the string or DOM node that represents the tooltip for the given
     * state, node and coordinate pair. This implementation checks if the given
     * node is a folding icon or overlay and returns the respective tooltip. If
     * this does not result in a tooltip, the handler for the cell is retrieved
     * from {@link SelectionCellsHandler} and the optional {@link getTooltipForNode} method is
     * called. If no special tooltip exists here then {@link getTooltipForCell} is used
     * with the cell in the given state as the argument to return a tooltip for the
     * given state.
     *
     * @param state {@link CellState} whose tooltip should be returned.
     * @param node DOM node that is currently under the mouse.
     * @param x X-coordinate of the mouse.
     * @param y Y-coordinate of the mouse.
     */
    getTooltip: (
      state: CellState,
      node: HTMLElement | SVGElement,
      x: number,
      y: number
    ) => HTMLElement | string | null;

    /**
     * Returns the string or DOM node to be used as the tooltip for the given
     * cell. This implementation uses the {@link Cell.getTooltip} function if it
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
     * @param cell {@link Cell} whose tooltip should be returned.
     */
    getTooltipForCell(cell: Cell): HTMLElement | string;

    /**
     * Specifies if tooltips should be enabled.
     *
     * This implementation updates {@link TooltipHandler.enabled}.
     *
     * **IMPORTANT**: only has an effect if the {@link TooltipHandler} plugin is available.
     *
     * @param enabled Boolean indicating if tooltips should be enabled.
     */
    setTooltips: (enabled: boolean) => void;
  }
}
