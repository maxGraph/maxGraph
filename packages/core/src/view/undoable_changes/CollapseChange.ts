import Cell from '../cell/Cell';
import Model from '../other/Model';
import CodecRegistry from '../../serialization/CodecRegistry';
import GenericChangeCodec from './GenericChangeCodec';

import type { UndoableChange } from '../../types';

/**
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

CodecRegistry.register(
  new GenericChangeCodec(new CollapseChange(), 'collapsed')
);
export default CollapseChange;
