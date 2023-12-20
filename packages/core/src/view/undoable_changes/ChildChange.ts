/*
Copyright 2021-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import GraphDataModel from '../GraphDataModel';
import Cell from '../cell/Cell';

import type { UndoableChange } from '../../types';

/**
 * Action to add or remove a child in a model.
 *
 * Constructor: mxChildChange
 *
 * Constructs a change of a child in the
 * specified model.
 *
 * @class ChildChange
 */
export class ChildChange implements UndoableChange {
  model: GraphDataModel;
  parent: Cell | null;
  child: Cell;
  previous: Cell | null;
  index: number;
  previousIndex: number;

  constructor(model: GraphDataModel, parent: Cell | null, child: Cell, index = 0) {
    this.model = model;
    this.parent = parent;
    this.previous = parent;
    this.child = child;
    this.index = index;
    this.previousIndex = index;
  }

  /**
   * Changes the parent of {@link child}` using
   * <Transactions.parentForCellChanged> and
   * removes or restores the cell's
   * connections.
   */
  execute() {
    let tmp = this.child.getParent();
    const tmp2 = tmp ? tmp.getIndex(this.child) : 0;

    if (!this.previous) {
      this.connect(this.child, false);
    }

    tmp = this.model.parentForCellChanged(this.child, this.previous, this.previousIndex);

    if (this.previous) {
      this.connect(this.child, true);
    }

    this.parent = this.previous;
    this.previous = tmp;
    this.index = this.previousIndex;
    this.previousIndex = tmp2;
  }

  /**
   * Disconnects the given cell recursively from its
   * terminals and stores the previous terminal in the
   * cell's terminals.
   *
   * @warning doc from mxGraph source code is incorrect
   */
  connect(cell: Cell, isConnect = true) {
    const source = cell.getTerminal(true);
    const target = cell.getTerminal(false);

    if (source) {
      if (isConnect) {
        this.model.terminalForCellChanged(cell, source, true);
      } else {
        this.model.terminalForCellChanged(cell, null, true);
      }
    }

    if (target) {
      if (isConnect) {
        this.model.terminalForCellChanged(cell, target, false);
      } else {
        this.model.terminalForCellChanged(cell, null, false);
      }
    }

    cell.setTerminal(source, true);
    cell.setTerminal(target, false);

    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      this.connect(cell.getChildAt(i), isConnect);
    }
  }
}

export default ChildChange;
