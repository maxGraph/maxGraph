/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Model from '../../view/model/Model';
import mxObjectCodec from './mxObjectCodec';
import mxCodecRegistry from './mxCodecRegistry';

/**
 * Class: mxModelCodec
 *
 * Codec for <Transactions>s. This class is created and registered
 * dynamically at load time and used implicitly via <mxCodec>
 * and the <mxCodecRegistry>.
 */
class mxModelCodec extends mxObjectCodec {
  constructor() {
    super(new Model());
  }

  /**
   * Function: encodeObject
   *
   * Encodes the given <Transactions> by writing a (flat) XML sequence of
   * cell nodes as produced by the <mxCellCodec>. The sequence is
   * wrapped-up in a node with the name root.
   */
  encodeObject(enc, obj, node) {
    const rootNode = enc.document.createElement('root');
    enc.encodeCell(obj.getRoot(), rootNode);
    node.appendChild(rootNode);
  }

  /**
   * Function: decodeChild
   *
   * Overrides decode child to handle special child nodes.
   */
  decodeChild(dec, child, obj) {
    if (child.nodeName === 'root') {
      this.decodeRoot(dec, child, obj);
    } else {
      decodeChild.apply(this, [dec, child, obj]);
    }
  }

  /**
   * Function: decodeRoot
   *
   * Reads the cells into the graph model. All cells
   * are children of the root element in the node.
   */
  decodeRoot(dec, root, model) {
    let rootCell = null;
    let tmp = root.firstChild;

    while (tmp != null) {
      const cell = dec.decodeCell(tmp);

      if (cell != null && cell.getParent() == null) {
        rootCell = cell;
      }

      tmp = tmp.nextSibling;
    }

    // Sets the root on the model if one has been decoded
    if (rootCell != null) {
      model.setRoot(rootCell);
    }
  }
}

// mxCodecRegistry.register(new mxModelCodec());
export default mxModelCodec;
