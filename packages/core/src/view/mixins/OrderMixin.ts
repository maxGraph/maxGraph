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

import { sortCells } from '../../util/styleUtils';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import type { AbstractGraph } from '../AbstractGraph';
import type Cell from '../cell/Cell';

type PartialGraph = Pick<
  AbstractGraph,
  'fireEvent' | 'batchUpdate' | 'getDataModel' | 'getSelectionCells'
>;
type PartialOrder = Pick<AbstractGraph, 'orderCells' | 'cellsOrdered'>;
type PartialType = PartialGraph & PartialOrder;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const OrderMixin: PartialType = {
  orderCells(back = false, cells) {
    if (!cells) cells = this.getSelectionCells();
    if (!cells) {
      cells = sortCells(this.getSelectionCells(), true);
    }

    this.batchUpdate(() => {
      this.cellsOrdered(<Cell[]>cells, back);
      const event = new EventObject(
        InternalEvent.ORDER_CELLS,
        'back',
        back,
        'cells',
        cells
      );
      this.fireEvent(event);
    });

    return cells;
  },

  cellsOrdered(cells, back = false) {
    this.batchUpdate(() => {
      for (let i = 0; i < cells.length; i += 1) {
        const parent = cells[i].getParent();

        if (back) {
          this.getDataModel().add(parent, cells[i], i);
        } else {
          this.getDataModel().add(
            parent,
            cells[i],
            parent ? parent.getChildCount() - 1 : 0
          );
        }
      }

      this.fireEvent(new EventObject(InternalEvent.CELLS_ORDERED, { back, cells }));
    });
  },
};
