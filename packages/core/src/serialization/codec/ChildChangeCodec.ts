/*
Copyright 2023-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import ObjectCodec from '../ObjectCodec.js';
import ChildChange from '../../view/undoable-change/ChildChange.js';
import type Codec from '../Codec.js';
import { isElement } from '../../internal/utils.js';

/**
 * Codec for {@link ChildChange}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
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
 *
 * @category Serialization with Codecs
 */
export class ChildChangeCodec extends ObjectCodec {
  constructor() {
    const __dummy: any = undefined;
    super(
      new ChildChange(__dummy, __dummy, __dummy),
      ['model', 'child', 'previousIndex'] as Array<keyof ChildChange>,
      ['parent', 'previous'] as Array<keyof ChildChange>
    );
  }

  /**
   * Returns `true` for the child attribute if the child cell had a previous parent or if we're reading the
   * child as an attribute rather than a child node, in which case it's always a reference.
   */
  override isReference(obj: any, attr: string | null, value: any, isWrite: boolean) {
    if (attr === 'child' && (!isWrite || obj.model.contains(obj.previous))) {
      return true;
    }
    return super.isReference(obj, attr, value, isWrite);
  }

  /**
   * Excludes references to parent or previous if not in the model.
   */
  override isExcluded(obj: any, attr: string, value: any, write: boolean) {
    return (
      super.isExcluded(obj, attr, value, write) ||
      (write &&
        value != null &&
        (attr === 'previous' || attr === 'parent') &&
        !obj.model.contains(value))
    );
  }

  /**
   * Encodes the child recursively and adds the result to the given node.
   */
  override afterEncode(enc: Codec, obj: any, node: Element) {
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
   * Decodes any child nodes as using the respective codec from the registry.
   */
  override beforeDecode(dec: Codec, _node: Element, obj: any): any {
    if (isElement(_node.firstChild)) {
      // Makes sure the original node isn't modified
      const node = _node.cloneNode(true);

      let tmp = <Element>node.firstChild;
      obj.child = dec.decodeCell(tmp, false);

      let tmp2 = <Element>tmp.nextSibling;
      (<Element>tmp.parentNode).removeChild(tmp);
      tmp = tmp2;

      while (tmp) {
        tmp2 = <Element>tmp.nextSibling;

        if (isElement(tmp)) {
          // Ignores all existing cells because those do not need to
          // be re-inserted into the model. Since the encoded version
          // of these cells contains the new parent, this would leave
          // to an inconsistent state on the model (i.e. a parent
          // change without a call to parentForCellChanged).
          const id = tmp.getAttribute('id')!;

          if (dec.lookup(id) == null) {
            dec.decodeCell(tmp);
          }
        }

        tmp.parentNode?.removeChild(tmp);
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
  override afterDecode(dec: Codec, node: Element, obj: any): any {
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
