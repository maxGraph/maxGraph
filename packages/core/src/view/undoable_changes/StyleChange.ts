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

import type { CellStyle, UndoableChange } from '../../types';

/**
 * Action to change a cell's style in a model.
 *
 * @category Change
 */
class StyleChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  style: CellStyle;
  previous: CellStyle;

  constructor(model: GraphDataModel, cell: Cell, style: CellStyle) {
    this.model = model;
    this.cell = cell;
    this.style = style;
    this.previous = style;
  }

  /**
   * Changes the style of {@link cell} to {@link previous} using {@link GraphDataModel.styleForCellChanged}.
   */
  execute() {
    this.style = this.previous;
    this.previous = this.model.styleForCellChanged(this.cell, this.previous);
  }
}

export default StyleChange;
