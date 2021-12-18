/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import ObjectCodec from '../../util/serialization/ObjectCodec';
import TerminalChange from './TerminalChange';
import CodecRegistry from '../../util/serialization/CodecRegistry';

/**
 * Codec for <mxTerminalChange>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec> and
 * the <CodecRegistry>.
 *
 * Transient Fields:
 *
 * - model
 * - previous
 *
 * Reference Fields:
 *
 * - cell
 * - terminal
 */
class TerminalChangeCodec extends ObjectCodec {
  constructor() {
    super(new TerminalChange(), ['model', 'previous'], ['cell', 'terminal']);
  }

  /**
   * Restores the state by assigning the previous value.
   */
  afterDecode(dec, node, obj) {
    obj.previous = obj.terminal;

    return obj;
  }
}

// CodecRegistry.register(new TerminalChangeCodec());
export default TerminalChangeCodec;
