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

import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';

import type { UndoableChange } from '../../types.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type Cell from '../cell/Cell.js';

/**
 * Action to add and remove cells to/from the selection of a {@link GraphSelectionModel}.
 *
 * @category Change
 */
class SelectionChange implements UndoableChange {
  constructor(graph: AbstractGraph, added: Cell[] = [], removed: Cell[] = []) {
    this.graph = graph;
    this.added = added.slice();
    this.removed = removed.slice();
  }

  graph: AbstractGraph;

  added: Cell[];

  removed: Cell[];

  /**
   * Applies the change to the selection model: calls {@link GraphSelectionModel.cellRemoved} for each cell
   * in {@link removed}, then {@link GraphSelectionModel.cellAdded} for each cell in {@link added}. Swaps
   * {@link added} and {@link removed} so a subsequent call undoes the change, then fires
   * {@link InternalEvent.CHANGE} on the selection model.
   *
   * **WARN**: because of the swap, the `added` and `removed` properties of the fired event refer to the
   * post-swap arrays — the event's `added` contains the cells just removed from the selection, and
   * vice-versa. This naming is preserved for historical reasons.
   */
  execute(): void {
    const selectionModel = this.graph.getSelectionModel();

    for (const removed of this.removed) {
      selectionModel.cellRemoved(removed);
    }

    for (const added of this.added) {
      selectionModel.cellAdded(added);
    }

    [this.added, this.removed] = [this.removed, this.added];

    selectionModel.fireEvent(
      new EventObject(InternalEvent.CHANGE, { added: this.added, removed: this.removed })
    );
  }
}

export default SelectionChange;
