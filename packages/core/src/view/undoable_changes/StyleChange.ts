import Cell from '../cell/Cell';
import Model from '../other/Model';
import CodecRegistry from '../../serialization/CodecRegistry';
import GenericChangeCodec from './GenericChangeCodec';

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
   * Changes the style of {@link cell}` to {@link previous}` using
   * <Transactions.styleForCellChanged>.
   */
  execute() {
    this.style = this.previous;
    this.previous = this.model.styleForCellChanged(this.cell, this.previous);
  }
}

const __dummy: any = undefined;
CodecRegistry.register(
  new GenericChangeCodec(new StyleChange(__dummy, __dummy, __dummy), 'style')
);
export default StyleChange;
