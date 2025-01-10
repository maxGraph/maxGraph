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

import { htmlEntities } from '../../util/StringUtils';
import Translations from '../../util/Translations';
import type Shape from '../geometry/Shape';
import type Cell from '../cell/Cell';
import type { Graph } from '../Graph';
import type SelectionCellsHandler from '../handler/SelectionCellsHandler';
import type TooltipHandler from '../handler/TooltipHandler';

type PartialGraph = Pick<
  Graph,
  'convertValueToString' | 'getPlugin' | 'getCollapseExpandResource'
>;
type PartialTooltip = Pick<Graph, 'getTooltip' | 'getTooltipForCell' | 'setTooltips'>;
type PartialType = PartialGraph & PartialTooltip;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const TooltipMixin: PartialType = {
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
          tip = shape.overlay ? (shape.overlay.toString() ?? null) : null;
        }
      });
    }

    if (!tip) {
      const selectionCellsHandler = this.getPlugin<SelectionCellsHandler>(
        'SelectionCellsHandler'
      );

      const handler = selectionCellsHandler?.getHandler(state.cell);

      if (
        handler &&
        'getTooltipForNode' in handler &&
        typeof handler.getTooltipForNode === 'function'
      ) {
        tip = handler.getTooltipForNode(node);
      }
    }

    if (!tip) {
      tip = this.getTooltipForCell(state.cell);
    }

    return tip;
  },

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

  setTooltips(enabled: boolean) {
    const tooltipHandler = this.getPlugin<TooltipHandler>('TooltipHandler');
    tooltipHandler?.setEnabled(enabled);
  },
};
