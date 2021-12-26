import Geometry from '../geometry/Geometry';
import Cell from '../cell/Cell';
import Model from '../other/Model';
import CodecRegistry from '../../serialization/CodecRegistry';
import GenericChangeCodec from './GenericChangeCodec';

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
   * Changes the geometry of {@link cell}` ro {@link previous}` using
   * <Transactions.geometryForCellChanged>.
   */
  execute() {
    this.geometry = this.previous;
    this.previous = this.model.geometryForCellChanged(this.cell, this.previous);
  }
}

CodecRegistry.register(
  new GenericChangeCodec(new GeometryChange(), 'geometry')
);
export default GeometryChange;
