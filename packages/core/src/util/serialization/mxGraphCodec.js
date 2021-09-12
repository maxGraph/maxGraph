/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { Graph } from '../../view/Graph';
import mxCodecRegistry from './mxCodecRegistry';
import mxObjectCodec from './mxObjectCodec';

/**
 * Class: mxGraphCodec
 *
 * Codec for <mxGraph>s. This class is created and registered
 * dynamically at load time and used implicitly via <mxCodec>
 * and the <mxCodecRegistry>.
 *
 * Transient Fields:
 *
 * - graphListeners
 * - eventListeners
 * - view
 * - container
 * - cellRenderer
 * - editor
 * - selection
 */
class mxGraphCodec extends mxObjectCodec {
  constructor() {
    super(new Graph(), [
      'graphListeners',
      'eventListeners',
      'view',
      'container',
      'cellRenderer',
      'editor',
      'selection',
    ]);
  }
}

// mxCodecRegistry.register(new mxGraphCodec());
export default mxGraphCodec;
