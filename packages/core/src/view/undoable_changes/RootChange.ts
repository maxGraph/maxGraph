import Cell from '../cell/Cell';
import Model from '../other/Model';

import type { UndoableChange } from '../../types';

/**
 * Action to change the root in a model.
 *
 * Constructor: mxRootChange
 *
 * Constructs a change of the root in the
 * specified model.
 *
 * @class RootChange
 */
class RootChange implements UndoableChange {
  model: Model;
  root: Cell | null;
  previous: Cell | null;

  constructor(model: Model, root: Cell | null) {
    this.model = model;
    this.root = root;
    this.previous = root;
  }

  /**
   * Carries out a change of the root using
   * <Transactions.rootChanged>.
   */
  execute() {
    this.root = this.previous;
    this.previous = this.model.rootChanged(this.previous);
  }
}

export default RootChange;
