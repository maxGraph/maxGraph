/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import ObjectCodec from '../../serialization/ObjectCodec';
import ValueChange from './ValueChange';
import StyleChange from './StyleChange';
import GeometryChange from './GeometryChange';
import CollapseChange from './CollapseChange';
import VisibleChange from './VisibleChange';
import CellAttributeChange from './CellAttributeChange';
import CodecRegistry from '../../serialization/CodecRegistry';
import { isNode } from '../../util/domUtils';

/**
 * Codec for <mxValueChange>s, <mxStyleChange>s, <mxGeometryChange>s,
 * <mxCollapseChange>s and <mxVisibleChange>s. This class is created
 * and registered dynamically at load time and used implicitly
 * via <Codec> and the <CodecRegistry>.
 *
 * Transient Fields:
 *
 * - model
 * - previous
 *
 * Reference Fields:
 *
 * - cell
 *
 * Constructor: GenericChangeCodec
 *
 * Factory function that creates a <ObjectCodec> for
 * the specified change and fieldname.
 *
 * @param obj An instance of the change object.
 * @param variable The fieldname for the change data.
 */
class GenericChangeCodec extends ObjectCodec {
  constructor(obj, variable) {
    super(obj, ['model', 'previous'], ['cell']);
    this.variable = variable;
  }

  /**
   * Restores the state by assigning the previous value.
   */
  afterDecode(dec, node, obj) {
    // Allows forward references in sessions. This is a workaround
    // for the sequence of edits in mxGraph.moveCells and cellsAdded.
    if (isNode(obj.cell)) {
      obj.cell = dec.decodeCell(obj.cell, false);
    }

    obj.previous = obj[this.variable];
    return obj;
  }
}

// Registers the codecs
CodecRegistry.register(
  new GenericChangeCodec(new ValueChange(), 'value')
);
CodecRegistry.register(
  new GenericChangeCodec(new StyleChange(), 'style')
);
CodecRegistry.register(
  new GenericChangeCodec(new GeometryChange(), 'geometry')
);
CodecRegistry.register(
  new GenericChangeCodec(new CollapseChange(), 'collapsed')
);
CodecRegistry.register(
  new GenericChangeCodec(new VisibleChange(), 'visible')
);
CodecRegistry.register(
  new GenericChangeCodec(new CellAttributeChange(), 'value')
);

export default GenericChangeCodec;
