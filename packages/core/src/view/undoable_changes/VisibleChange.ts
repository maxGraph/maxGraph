import Cell from '../cell/Cell';
import Model from '../other/Model';
import CodecRegistry from '../../serialization/CodecRegistry';
import GenericChangeCodec from './GenericChangeCodec';

import type { UndoableChange } from '../../types';

/**
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

CodecRegistry.register(
  new GenericChangeCodec(new VisibleChange(), 'visible')
);
export default VisibleChange;
