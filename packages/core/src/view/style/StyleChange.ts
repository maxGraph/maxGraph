import Cell from '../cell/datatypes/Cell';
import Model from '../model/Model';

import type { UndoableChange } from '../../types';

/**
 * Action to change a cell's style in a model.
 *
 * @class StyleChange
 */
class StyleChange implements UndoableChange {
  model: Model;
  cell: Cell;
  style: string | null;
  previous: string | null;

  constructor(model: Model, cell: Cell, style: string | null) {
    this.model = model;
    this.cell = cell;
    this.style = style;
    this.previous = style;
  }

  /**
   * Function: execute
   *
   * Changes the style of {@link cell}` to {@link previous}` using
   * <Transactions.styleForCellChanged>.
   */
  execute() {
    this.style = this.previous;
    this.previous = this.model.styleForCellChanged(this.cell, this.previous);
  }
}

export default StyleChange;
