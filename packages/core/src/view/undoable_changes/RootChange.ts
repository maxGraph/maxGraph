import Cell from '../cell/Cell';
import Model from '../other/Model';
import CodecRegistry from '../../serialization/CodecRegistry';
import { NODETYPE } from '../../util/constants';
import ObjectCodec from '../../serialization/ObjectCodec';

import type { UndoableChange } from '../../types';
import Codec from 'src/serialization/Codec';

/**
 * Action to change the root in a model.
 *
 * Constructor: mxRootChange
 *
 * Constructs a change of the root in the
 * specified model.
 *
 * @class RootChange
 */
export class RootChange implements UndoableChange {
  model: Model;
  root: Cell | null;
  previous: Cell | null;

  constructor(model: Model, root: Cell | null) {
    this.model = model;
    this.root = root;
    this.previous = root;
  }

  /**
   * Carries out a change of the root using
   * <Transactions.rootChanged>.
   */
  execute() {
    this.root = this.previous;
    this.previous = this.model.rootChanged(this.previous);
  }
}

/**
 * Codec for <mxRootChange>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec> and
 * the <CodecRegistry>.
 *
 * Transient Fields:
 *
 * - model
 * - previous
 * - root
 */
export class RootChangeCodec extends ObjectCodec {
  constructor() {
    super(new RootChange(), ['model', 'previous', 'root']);
  }

  /**
   * Encodes the child recursively.
   */
  afterEncode(enc, obj, node) {
    enc.encodeCell(obj.root, node);

    return node;
  }

  /**
   * Decodes the optional children as cells
   * using the respective decoder.
   */
  beforeDecode(dec: Codec, node: Element, obj: any): any {
    if (node.firstChild != null && node.firstChild.nodeType === NODETYPE.ELEMENT) {
      // Makes sure the original node isn't modified
      node = node.cloneNode(true);

      let tmp = node.firstChild;
      obj.root = dec.decodeCell(tmp, false);

      let tmp2 = tmp.nextSibling;
      tmp.parentNode.removeChild(tmp);
      tmp = tmp2;

      while (tmp != null) {
        tmp2 = tmp.nextSibling;
        dec.decodeCell(tmp);
        tmp.parentNode.removeChild(tmp);
        tmp = tmp2;
      }
    }

    return node;
  }

  /**
   * Restores the state by assigning the previous value.
   */
  afterDecode(dec: Codec, node: Element, obj: any): any {
    obj.previous = obj.root;

    return obj;
  }
}

CodecRegistry.register(new RootChangeCodec());
export default RootChange;
