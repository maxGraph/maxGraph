import Cell from '../datatypes/Cell';
import Model from '../../model/Model';

import type { UndoableChange } from '../../../types';

/**
 * Action to change a terminal in a model.
 *
 * Constructor: mxTerminalChange
 *
 * Constructs a change of a terminal in the
 * specified model.
 */
class TerminalChange implements UndoableChange {
  model: Model;
  cell: Cell;
  terminal: Cell | null;
  previous: Cell | null;
  source: boolean;

  constructor(
    model: Model,
    cell: Cell,
    terminal: Cell | null,
    source: boolean
  ) {
    this.model = model;
    this.cell = cell;
    this.terminal = terminal;
    this.previous = terminal;
    this.source = source;
  }

  /**
   * Changes the terminal of {@link cell}` to {@link previous}` using
   * <Transactions.terminalForCellChanged>.
   */
  execute() {
    this.terminal = this.previous;
    this.previous = this.model.terminalForCellChanged(
      this.cell,
      this.previous,
      this.source
    );
  }
}

export default TerminalChange;
