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

import Cell from '../cell/Cell.js';
import GraphDataModel from '../GraphDataModel.js';

import type { UndoableChange } from '../../types.js';

/**
 * Action to change a user object in a model.
 *
 * @category Change
 */
class ValueChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  value: unknown;
  previous: unknown;

  constructor(model: GraphDataModel, cell: Cell, value: unknown) {
    this.model = model;
    this.cell = cell;
    this.value = value;
    this.previous = value;
  }

  /**
   * Changes the value of {@link cell} to {@link previous} using {@link GraphDataModel.valueForCellChanged}.
   */
  execute() {
    this.value = this.previous;
    this.previous = this.model.valueForCellChanged(this.cell, this.previous);
  }
}

export default ValueChange;
