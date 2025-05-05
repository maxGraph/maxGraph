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

import Cell from '../cell/Cell';
import GraphDataModel from '../GraphDataModel';

import type { UndoableChange } from '../../types';

/**
 * Action to change the root in a model.
 *
 * @category Change
 */
export class RootChange implements UndoableChange {
  model: GraphDataModel;
  root: Cell | null;
  previous: Cell | null;

  constructor(model: GraphDataModel, root: Cell | null) {
    this.model = model;
    this.root = root;
    this.previous = root;
  }

  /**
   * Carries out a change of the root using {@link GraphDataModel.rootChanged}.
   */
  execute() {
    this.root = this.previous;
    this.previous = this.model.rootChanged(this.previous);
  }
}

export default RootChange;
