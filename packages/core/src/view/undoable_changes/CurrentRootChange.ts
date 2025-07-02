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

import type GraphView from '../GraphView.js';
import EventObject from '../event/EventObject.js';
import Point from '../geometry/Point.js';
import type Cell from '../cell/Cell.js';
import InternalEvent from '../event/InternalEvent.js';
import type { UndoableChange } from '../../types.js';

/**
 * Action to change the current root in a view.
 *
 * @category Change
 */
class CurrentRootChange implements UndoableChange {
  view: GraphView;
  root: Cell | null;
  previous: Cell | null;
  isUp: boolean;

  constructor(view: GraphView, root: Cell | null) {
    this.view = view;
    this.root = root;
    this.previous = root;
    this.isUp = root === null;

    if (!this.isUp) {
      let tmp = this.view.currentRoot;

      while (tmp) {
        if (tmp === root) {
          this.isUp = true;
          break;
        }
        tmp = tmp.getParent();
      }
    }
  }

  /**
   * Changes the current root of the view.
   */
  execute() {
    const tmp = this.view.currentRoot;
    this.view.currentRoot = this.previous;
    this.previous = tmp;

    const translate = this.view.graph.getTranslateForRoot(this.view.currentRoot);

    if (translate) {
      this.view.translate = new Point(-translate.x, -translate.y);
    }

    if (this.isUp) {
      this.view.clear(this.view.currentRoot, true, true);
      this.view.validate(null);
    } else {
      this.view.refresh();
    }

    const name = this.isUp ? InternalEvent.UP : InternalEvent.DOWN;

    this.view.fireEvent(
      new EventObject(name, { root: this.view.currentRoot, previous: this.previous })
    );

    this.isUp = !this.isUp;
  }
}

export default CurrentRootChange;
