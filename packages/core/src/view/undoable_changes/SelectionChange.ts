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

import EventObject from '../event/EventObject';
import Translations from '../../util/Translations';
import InternalEvent from '../event/InternalEvent';
import CellArray from '../cell/CellArray';

import type { UndoableChange } from '../../types';
import type { Graph } from '../Graph';

/**
 * @class SelectionChange
 * Action to change the current root in a view.
 */
class SelectionChange implements UndoableChange {
  constructor(
    graph: Graph,
    added: CellArray = new CellArray(),
    removed: CellArray = new CellArray()
  ) {
    this.graph = graph;
    this.added = added.slice();
    this.removed = removed.slice();
  }

  graph: Graph;

  added: CellArray;

  removed: CellArray;

  /**
   * Changes the current root of the view.
   */
  execute() {
    const selectionModel = this.graph.getSelectionModel();
    window.status =
      Translations.get(selectionModel.updatingSelectionResource) ||
      selectionModel.updatingSelectionResource;

    for (const removed of this.removed) {
      this.graph.getSelectionModel().cellRemoved(removed);
    }

    for (const added of this.added) {
      this.graph.getSelectionModel().cellAdded(added);
    }

    [this.added, this.removed] = [this.removed, this.added];

    window.status =
      Translations.get(selectionModel.doneResource) || selectionModel.doneResource;

    this.graph.fireEvent(
      new EventObject(InternalEvent.CHANGE, { added: this.added, removed: this.removed })
    );
  }
}

export default SelectionChange;
