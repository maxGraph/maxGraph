import CellArray from '../cell/CellArray';
import { mixInto } from '../../util/utils';
import { sortCells } from '../../util/styleUtils';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import { Graph } from '../Graph';

declare module '../Graph' {
  interface Graph {
    orderCells: (back: boolean, cells?: CellArray) => CellArray;
    cellsOrdered: (cells: CellArray, back: boolean) => void;
  }
}

type PartialGraph = Pick<
  Graph,
  'fireEvent' | 'batchUpdate' | 'getModel' | 'getSelectionCells'
>;
type PartialOrder = Pick<Graph, 'orderCells' | 'cellsOrdered'>;
type PartialType = PartialGraph & PartialOrder;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const OrderMixin: PartialType = {
  /*****************************************************************************
   * Group: Order
   *****************************************************************************/

  /**
   * Moves the given cells to the front or back. The change is carried out
   * using {@link cellsOrdered}. This method fires {@link InternalEvent.ORDER_CELLS} while the
   * transaction is in progress.
   *
   * @param back Boolean that specifies if the cells should be moved to back.
   * @param cells Array of {@link mxCell} to move to the background. If null is
   * specified then the selection cells are used.
   */
  orderCells(back = false, cells) {
    if (!cells) cells = this.getSelectionCells();
    if (!cells) {
      cells = sortCells(this.getSelectionCells(), true);
    }

    this.batchUpdate(() => {
      this.cellsOrdered(<CellArray>cells, back);
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

  /**
   * Moves the given cells to the front or back. This method fires
   * {@link InternalEvent.CELLS_ORDERED} while the transaction is in progress.
   *
   * @param cells Array of {@link mxCell} whose order should be changed.
   * @param back Boolean that specifies if the cells should be moved to back.
   */
  cellsOrdered(cells, back = false) {
    this.batchUpdate(() => {
      for (let i = 0; i < cells.length; i += 1) {
        const parent = cells[i].getParent();

        if (back) {
          this.getModel().add(parent, cells[i], i);
        } else {
          this.getModel().add(parent, cells[i], parent ? parent.getChildCount() - 1 : 0);
        }
      }

      this.fireEvent(
        new EventObject(InternalEvent.CELLS_ORDERED, 'back', back, 'cells', cells)
      );
    });
  },
};

mixInto(Graph)(OrderMixin);
