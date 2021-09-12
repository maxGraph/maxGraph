/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxObjectCodec from './mxObjectCodec';
import TerminalChange from '../../view/cell/edge/TerminalChange';
import mxCodecRegistry from './mxCodecRegistry';

/**
 * Class: mxTerminalChangeCodec
 *
 * Codec for <mxTerminalChange>s. This class is created and registered
 * dynamically at load time and used implicitly via <mxCodec> and
 * the <mxCodecRegistry>.
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
class mxTerminalChangeCodec extends mxObjectCodec {
  constructor() {
    super(new TerminalChange(), ['model', 'previous'], ['cell', 'terminal']);
  }

  /**
   * Function: afterDecode
   *
   * Restores the state by assigning the previous value.
   */
  afterDecode(dec, node, obj) {
    obj.previous = obj.terminal;

    return obj;
  }
}

// mxCodecRegistry.register(new mxTerminalChangeCodec());
export default mxTerminalChangeCodec;
