/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import ObjectCodec from '../../serialization/ObjectCodec';
import { isNode } from '../../util/DomUtils';
import Codec from '../../serialization/Codec';

/**
 * Codec for {@link ValueChange}s, {@link StyleChange}s, {@link GeometryChange}s,
 * {@link CollapseChange}s and {@link VisibleChange}s. This class is created
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
  constructor(obj: any, variable: string) {
    super(obj, ['model', 'previous'], ['cell']);
    this.variable = variable;
  }

  variable: string;

  /**
   * Restores the state by assigning the previous value.
   */
  afterDecode(dec: Codec, node: Element, obj: any): any {
    // Allows forward references in sessions. This is a workaround
    // for the sequence of edits in mxGraph.moveCells and cellsAdded.
    if (isNode(obj.cell)) {
      obj.cell = dec.decodeCell(obj.cell, false);
    }

    obj.previous = obj[this.variable];
    return obj;
  }
}

export default GenericChangeCodec;
