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
import { AbstractGraph } from '../AbstractGraph.js';
import Cell from '../cell/Cell.js';

/**
 * Action to change the current root in a view.
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
   * Changes the current root of the view.
   */
  execute() {
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
