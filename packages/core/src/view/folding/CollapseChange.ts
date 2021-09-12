import Cell from '../cell/datatypes/Cell';
import Model from '../model/Model';

import type { UndoableChange } from '../../types';

/**
 * Class: mxCollapseChange
 *
 * Action to change a cell's collapsed state in a model.
 *
 * Constructor: mxCollapseChange
 *
 * Constructs a change of a collapsed state in the
 * specified model.
 */
class CollapseChange implements UndoableChange {
  model: Model;
  cell: Cell;
  collapsed: boolean;
  previous: boolean;

  constructor(model: Model, cell: Cell, collapsed: boolean) {
    this.model = model;
    this.cell = cell;
    this.collapsed = collapsed;
    this.previous = collapsed;
  }

  /**
   * Function: execute
   *
   * Changes the collapsed state of {@link cell}` to {@link previous}` using
   * <Transactions.collapsedStateForCellChanged>.
   */
  execute() {
    this.collapsed = this.previous;
    this.previous = this.model.collapsedStateForCellChanged(
      this.cell,
      this.previous
    );
  }
}

export default CollapseChange;
