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

import Geometry from '../geometry/Geometry';
import Cell from '../cell/Cell';
import GraphDataModel from '../GraphDataModel';

import type { UndoableChange } from '../../types';

/**
 * Action to change a cell's geometry in a model.
 *
 * Constructor: mxGeometryChange
 *
 * Constructs a change of a geometry in the
 * specified model.
 */
class GeometryChange implements UndoableChange {
  model: GraphDataModel;
  cell: Cell;
  geometry: Geometry | null;
  previous: Geometry | null;

  constructor(model: GraphDataModel, cell: Cell, geometry: Geometry | null) {
    this.model = model;
    this.cell = cell;
    this.geometry = geometry;
    this.previous = geometry;
  }

  /**
   * Changes the geometry of {@link cell}` ro {@link previous}` using
   * <Transactions.geometryForCellChanged>.
   */
  execute() {
    this.geometry = this.previous;
    this.previous = this.model.geometryForCellChanged(this.cell, this.previous);
  }
}

export default GeometryChange;
