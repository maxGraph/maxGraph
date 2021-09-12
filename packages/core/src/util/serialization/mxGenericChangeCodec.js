/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxObjectCodec from './mxObjectCodec';
import ValueChange from '../../view/cell/ValueChange';
import StyleChange from '../../view/style/StyleChange';
import GeometryChange from '../../view/geometry/GeometryChange';
import CollapseChange from '../../view/folding/CollapseChange';
import VisibleChange from '../../view/style/VisibleChange';
import CellAttributeChange from '../../view/cell/CellAttributeChange';
import mxCodecRegistry from './mxCodecRegistry';
import { isNode } from '../DomUtils';

/**
 * Class: mxGenericChangeCodec
 *
 * Codec for <mxValueChange>s, <mxStyleChange>s, <mxGeometryChange>s,
 * <mxCollapseChange>s and <mxVisibleChange>s. This class is created
 * and registered dynamically at load time and used implicitly
 * via <mxCodec> and the <mxCodecRegistry>.
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
 * Constructor: mxGenericChangeCodec
 *
 * Factory function that creates a <mxObjectCodec> for
 * the specified change and fieldname.
 *
 * Parameters:
 *
 * obj - An instance of the change object.
 * variable - The fieldname for the change data.
 */
class mxGenericChangeCodec extends mxObjectCodec {
  constructor(obj, variable) {
    super(obj, ['model', 'previous'], ['cell']);
    this.variable = variable;
  }

  /**
   * Function: afterDecode
   *
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
mxCodecRegistry.register(
  new mxGenericChangeCodec(new ValueChange(), 'value')
);
mxCodecRegistry.register(
  new mxGenericChangeCodec(new StyleChange(), 'style')
);
mxCodecRegistry.register(
  new mxGenericChangeCodec(new GeometryChange(), 'geometry')
);
mxCodecRegistry.register(
  new mxGenericChangeCodec(new CollapseChange(), 'collapsed')
);
mxCodecRegistry.register(
  new mxGenericChangeCodec(new VisibleChange(), 'visible')
);
mxCodecRegistry.register(
  new mxGenericChangeCodec(new CellAttributeChange(), 'value')
);

export default mxGenericChangeCodec;
