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
    window.status =
      Translations.get(this.graph.getUpdatingSelectionResource()) ||
      this.graph.getUpdatingSelectionResource();

    for (const removed of this.removed) {
      this.graph.cellRemoved(removed);
    }

    for (const added of this.added) {
      this.graph.cellAdded(added);
    }

    [this.added, this.removed] = [this.removed, this.added];

    window.status =
      Translations.get(this.graph.getDoneResource()) || this.graph.getDoneResource();

    this.graph.fireEvent(
      new EventObject(InternalEvent.CHANGE, { added: this.added, removed: this.removed })
    );
  }
}

export default SelectionChange;
