import Cell from './datatypes/Cell';
import Model from '../model/Model';

import type { UndoableChange } from '../../types';

/**
 * Action to change a user object in a model.
 *
 * Constructs a change of a user object in the
 * specified model.
 *
 * @class ValueChange
 */
class ValueChange implements UndoableChange {
  model: Model;
  cell: Cell;
  value: unknown;
  previous: unknown;

  constructor(model: Model, cell: Cell, value: unknown) {
    this.model = model;
    this.cell = cell;
    this.value = value;
    this.previous = value;
  }

  /**
   * Changes the value of {@link cell}` to {@link previous}` using
   * <Transactions.valueForCellChanged>.
   */
  execute() {
    this.value = this.previous;
    this.previous = this.model.valueForCellChanged(this.cell, this.previous);
  }
}

export default ValueChange;
