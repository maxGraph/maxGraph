import Cell from '../cell/Cell';
import GraphModel from '../GraphModel';
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
  model: GraphModel;
  cell: Cell;
  visible: boolean;
  previous: boolean;

  constructor(model: GraphModel, cell: Cell, visible: boolean) {
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

const __dummy: any = undefined;
CodecRegistry.register(
  new GenericChangeCodec(new VisibleChange(__dummy, __dummy, __dummy), 'visible')
);
export default VisibleChange;
