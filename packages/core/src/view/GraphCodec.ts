/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { Graph } from './Graph';
import CodecRegistry from '../util/serialization/CodecRegistry';
import ObjectCodec from '../util/serialization/ObjectCodec';

/**
 * Class: GraphCodec
 *
 * Codec for <mxGraph>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec>
 * and the <CodecRegistry>.
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
class GraphCodec extends ObjectCodec {
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

// CodecRegistry.register(new GraphCodec());
export default GraphCodec;
