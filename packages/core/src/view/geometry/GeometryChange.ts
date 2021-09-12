import Geometry from './Geometry';
import Cell from '../cell/datatypes/Cell';
import Model from '../model/Model';

import type { UndoableChange } from '../../types';

/**
 * Class: mxGeometryChange
 *
 * Action to change a cell's geometry in a model.
 *
 * Constructor: mxGeometryChange
 *
 * Constructs a change of a geometry in the
 * specified model.
 */
class GeometryChange implements UndoableChange {
  model: Model;
  cell: Cell;
  geometry: Geometry | null;
  previous: Geometry | null;

  constructor(model: Model, cell: Cell, geometry: Geometry | null) {
    this.model = model;
    this.cell = cell;
    this.geometry = geometry;
    this.previous = geometry;
  }

  /**
   * Function: execute
   *
   * Changes the geometry of {@link cell}` ro {@link previous}` using
   * <Transactions.geometryForCellChanged>.
   */
  execute() {
    this.geometry = this.previous;
    this.previous = this.model.geometryForCellChanged(this.cell, this.previous);
  }
}

export default GeometryChange;
