import Cell from '../cell/Cell';
import Model from '../other/Model';

import type { UndoableChange } from '../../types';

/**
 * Class: mxVisibleChange
 *
 * Action to change a cell's visible state in a model.
 *
 * Constructor: mxVisibleChange
 *
 * Constructs a change of a visible state in the
 * specified model.
 */
class VisibleChange implements UndoableChange {
  model: Model;
  cell: Cell;
  visible: boolean;
  previous: boolean;

  constructor(model: Model, cell: Cell, visible: boolean) {
    this.model = model;
    this.cell = cell;
    this.visible = visible;
    this.previous = visible;
  }

  /**
   * Function: execute
   *
   * Changes the visible state of {@link cell}` to {@link previous}` using
   * <Transactions.visibleStateForCellChanged>.
   */
  execute() {
    this.visible = this.previous;
    this.previous = this.model.visibleStateForCellChanged(
      this.cell,
      this.previous
    );
  }
}

export default VisibleChange;
