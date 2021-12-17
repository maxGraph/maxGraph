/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Model from './Model';
import ObjectCodec from '../../serialization/ObjectCodec';
import CodecRegistry from '../../serialization/CodecRegistry';
import Cell from '../cell/Cell';

/**
 * Class: ModelCodec
 *
 * Codec for <Transactions>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec>
 * and the <CodecRegistry>.
 */
class ModelCodec extends ObjectCodec {
  constructor() {
    super(new Model());
  }

  /**
   * Function: encodeObject
   *
   * Encodes the given <Transactions> by writing a (flat) XML sequence of
   * cell nodes as produced by the <CellCodec>. The sequence is
   * wrapped-up in a node with the name root.
   */
  encodeObject(enc: any, obj: Cell, node: Element) {
    const rootNode = enc.document.createElement('root');
    enc.encodeCell(obj.getRoot(), rootNode);
    node.appendChild(rootNode);
  }

  /**
   * Function: decodeChild
   *
   * Overrides decode child to handle special child nodes.
   */
  decodeChild(dec: any, child: Element, obj: Cell | Model) {
    if (child.nodeName === 'root') {
      this.decodeRoot(dec, child, <Model>obj);
    } else {
      this.decodeChild.apply(this, [dec, child, obj]);
    }
  }

  /**
   * Function: decodeRoot
   *
   * Reads the cells into the graph model. All cells
   * are children of the root element in the node.
   */
  decodeRoot(dec: any, root: Element, model: Model) {
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

// CodecRegistry.register(new ModelCodec());
export default ModelCodec;
