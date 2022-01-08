import GraphDataModel from '../GraphDataModel';
import Cell from '../cell/Cell';
import ObjectCodec from '../../serialization/ObjectCodec';
import CodecRegistry from '../../serialization/CodecRegistry';
import { NODETYPE } from '../../util/constants';

import type { UndoableChange } from '../../types';
import Codec from '../../serialization/Codec';

/**
 * Action to add or remove a child in a model.
 *
 * Constructor: mxChildChange
 *
 * Constructs a change of a child in the
 * specified model.
 *
 * @class ChildChange
 */
export class ChildChange implements UndoableChange {
  model: GraphDataModel;
  parent: Cell | null;
  child: Cell;
  previous: Cell | null;
  index: number;
  previousIndex: number;

  constructor(
    model: GraphDataModel,
    parent: Cell | null,
    child: Cell,
    index: number = 0
  ) {
    this.model = model;
    this.parent = parent;
    this.previous = parent;
    this.child = child;
    this.index = index;
    this.previousIndex = index;
  }

  /**
   * Changes the parent of {@link child}` using
   * <Transactions.parentForCellChanged> and
   * removes or restores the cell's
   * connections.
   */
  execute() {
    let tmp = this.child.getParent();
    const tmp2 = tmp ? tmp.getIndex(this.child) : 0;

    if (!this.previous) {
      this.connect(this.child, false);
    }

    tmp = this.model.parentForCellChanged(
      this.child,
      this.previous,
      this.previousIndex
    );

    if (this.previous) {
      this.connect(this.child, true);
    }

    this.parent = this.previous;
    this.previous = tmp;
    this.index = this.previousIndex;
    this.previousIndex = tmp2;
  }

  /**
   * Disconnects the given cell recursively from its
   * terminals and stores the previous terminal in the
   * cell's terminals.
   *
   * @warning doc from mxGraph source code is incorrect
   */
  connect(cell: Cell, isConnect: boolean = true) {
    const source = cell.getTerminal(true);
    const target = cell.getTerminal(false);

    if (source) {
      if (isConnect) {
        this.model.terminalForCellChanged(cell, source, true);
      } else {
        this.model.terminalForCellChanged(cell, null, true);
      }
    }

    if (target) {
      if (isConnect) {
        this.model.terminalForCellChanged(cell, target, false);
      } else {
        this.model.terminalForCellChanged(cell, null, false);
      }
    }

    cell.setTerminal(source, true);
    cell.setTerminal(target, false);

    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      this.connect(cell.getChildAt(i), isConnect);
    }
  }
}

/**
 * Codec for {@link ChildChange}s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec> and
 * the <CodecRegistry>.
 *
 * Transient Fields:
 *
 * - model
 * - previous
 * - previousIndex
 * - child
 *
 * Reference Fields:
 *
 * - parent
 */
export class ChildChangeCodec extends ObjectCodec {
  constructor() {
    const __dummy: any = undefined;
    super(
      new ChildChange(__dummy, __dummy, __dummy),
      ['model', 'child', 'previousIndex'],
      ['parent', 'previous']
    );
  }

  /**
   * Returns true for the child attribute if the child
   * cell had a previous parent or if we're reading the
   * child as an attribute rather than a child node, in
   * which case it's always a reference.
   */
  isReference(obj: any, attr: string, value: any, isWrite: boolean) {
    if (attr === 'child' && (!isWrite || obj.model.contains(obj.previous))) {
      return true;
    }
    return this.idrefs.indexOf(attr) >= 0;
  }

  /**
   * Excludes references to parent or previous if not in the model.
   */
  isExcluded(obj: any, attr: string, value: any, write: boolean) {
    return (
      super.isExcluded(obj, attr, value, write) ||
      (write &&
        value != null &&
        (attr === 'previous' || attr === 'parent') &&
        !obj.model.contains(value))
    );
  }

  /**
   * Encodes the child recusively and adds the result
   * to the given node.
   */
  afterEncode(enc: Codec, obj: any, node: Element) {
    if (this.isReference(obj, 'child', obj.child, true)) {
      // Encodes as reference (id)
      node.setAttribute('child', enc.getId(obj.child));
    } else {
      // At this point, the encoder is no longer able to know which cells
      // are new, so we have to encode the complete cell hierarchy and
      // ignore the ones that are already there at decoding time. Note:
      // This can only be resolved by moving the notify event into the
      // execute of the edit.
      enc.encodeCell(obj.child, node);
    }
    return node;
  }

  /**
   * Decodes the any child nodes as using the respective
   * codec from the registry.
   */
  beforeDecode(dec: Codec, _node: Element, obj: any): any {
    if (
      _node.firstChild != null &&
      _node.firstChild.nodeType === NODETYPE.ELEMENT
    ) {
      // Makes sure the original node isn't modified
      let node = _node.cloneNode(true);

      let tmp = <Element>node.firstChild;
      obj.child = dec.decodeCell(tmp, false);

      let tmp2 = <Element>tmp.nextSibling;
      (<Element>tmp.parentNode).removeChild(tmp);
      tmp = tmp2;

      while (tmp != null) {
        tmp2 = <Element>tmp.nextSibling;

        if (tmp.nodeType === NODETYPE.ELEMENT) {
          // Ignores all existing cells because those do not need to
          // be re-inserted into the model. Since the encoded version
          // of these cells contains the new parent, this would leave
          // to an inconsistent state on the model (ie. a parent
          // change without a call to parentForCellChanged).
          const id = <string>tmp.getAttribute('id');

          if (dec.lookup(id) == null) {
            dec.decodeCell(tmp);
          }
        }

        (<Element>tmp.parentNode).removeChild(tmp);
        tmp = tmp2;
      }

      return node;
    } else {
      const childRef = <string>_node.getAttribute('child');
      obj.child = dec.getObject(childRef);
      return _node;
    }
  }

  /**
   * Restores object state in the child change.
   */
  afterDecode(dec: Codec, node: Element, obj: any): any {
    // Cells are decoded here after a complete transaction so the previous
    // parent must be restored on the cell for the case where the cell was
    // added. This is needed for the local model to identify the cell as a
    // new cell and register the ID.
    if (obj.child != null) {
      if (
        obj.child.parent != null &&
        obj.previous != null &&
        obj.child.parent !== obj.previous
      ) {
        obj.previous = obj.child.parent;
      }

      obj.child.parent = obj.previous;
      obj.previous = obj.parent;
      obj.previousIndex = obj.index;
    }
    return obj;
  }
}

CodecRegistry.register(new ChildChangeCodec());
export default ChildChange;
