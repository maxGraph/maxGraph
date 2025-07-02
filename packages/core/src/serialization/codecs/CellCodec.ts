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

import CodecRegistry from '../CodecRegistry.js';
import ObjectCodec from '../ObjectCodec.js';
import Cell from '../../view/cell/Cell.js';
import type Codec from '../Codec.js';
import { importNode } from '../../util/domUtils.js';
import { removeWhitespace } from '../../util/StringUtils.js';
import { isElement } from '../../internal/utils.js';

/**
 * Codec for {@link Cell}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * Transient Fields:
 *
 * - children
 * - edges
 * - overlays
 * - mxTransient
 *
 * Reference Fields:
 *
 * - parent
 * - source
 * - target
 *
 * Transient fields can be added using the following code: `CodecRegistry.getCodec(Cell).exclude.push('name_of_field');`
 *
 * To subclass {@link Cell}, replace the template and add an alias as follows:
 *
 * ```javascript
 * // Given 'CustomCell' extends 'Cell'
 * CodecRegistry.getCodec(Cell).template = new CustomCell();
 * CodecRegistry.addAlias('CustomCell', 'Cell');
 * ```
 *
 * @category Serialization with Codecs
 */
export class CellCodec extends ObjectCodec {
  constructor() {
    super(
      new Cell(),
      ['children', 'edges', 'overlays', 'mxTransient'],
      ['parent', 'source', 'target']
    );
    this.setName('Cell');
  }

  /**
   * Returns `true` since this is a cell codec.
   */
  isCellCodec() {
    return true;
  }

  /**
   * Overridden to disable conversion of value to number.
   */
  isNumericAttribute(dec: Codec, attr: Element, obj: any) {
    return attr.nodeName !== 'value' && super.isNumericAttribute(dec, attr, obj);
  }

  /**
   * Excludes user objects that are XML nodes.
   */
  isExcluded(obj: any, attr: string, value: Element, isWrite: boolean) {
    return (
      super.isExcluded(obj, attr, value, isWrite) ||
      (isWrite && attr === 'value' && isElement(value))
    );
  }

  /**
   * Encodes a {@link Cell} and wraps the XML up inside the XML of the user object (inversion).
   */
  afterEncode(enc: Codec, obj: Cell, node: Element) {
    if (isElement(obj.value)) {
      // Wraps the graphical annotation up in the user object (inversion)
      // by putting the result of the default encoding into a clone of the
      // user object (node type 1) and returning this cloned user object.
      const tmp = node;
      node = importNode(enc.document, obj.value, true);
      node.appendChild(tmp);

      // Moves the id attribute to the outermost XML node, namely the
      // node which denotes the object boundaries in the file.
      const id = tmp.getAttribute('id');
      node.setAttribute('id', String(id));
      tmp.removeAttribute('id');
    }

    return node;
  }

  /**
   * Decodes an {@link Cell} and uses the enclosing XML node as the user object for the cell (inversion).
   */
  beforeDecode(dec: Codec, node: Element, obj: Cell): Element | null {
    let inner: Element | null = <Element>node.cloneNode(true);
    const classname = this.getName();

    if (node.nodeName !== classname) {
      // Passes the inner graphical annotation node to the
      // object codec for further processing of the cell.
      const tmp = node.getElementsByTagName(classname)[0];

      if (tmp != null && tmp.parentNode === node) {
        removeWhitespace(<HTMLElement>tmp, true);
        removeWhitespace(<HTMLElement>tmp, false);
        tmp.parentNode.removeChild(tmp);
        inner = tmp;
      } else {
        inner = null;
      }

      // Creates the user object out of the XML node
      obj.value = node.cloneNode(true);
      const id = obj.value.getAttribute('id');

      if (id != null) {
        obj.setId(id);
        obj.value.removeAttribute('id');
      }
    } else {
      // Uses ID from XML file as ID for cell in model
      obj.setId(<string>node.getAttribute('id'));
    }

    // Preprocesses and removes all Id-references in order to use the
    // correct encoder (this) for the known references to cells (all).
    if (inner != null) {
      for (let i = 0; i < this.idrefs.length; i += 1) {
        const attr = this.idrefs[i];
        const ref = inner.getAttribute(attr);

        if (ref != null) {
          inner.removeAttribute(attr);
          let object = dec.objects[ref] || dec.lookup(ref);

          if (object == null) {
            // Needs to decode forward reference
            const element = dec.getElementById(ref);

            if (element != null) {
              const decoder = CodecRegistry.codecs[element.nodeName] || this;
              object = decoder.decode(dec, element);
            }
          }

          // @ts-ignore dynamic assignment was in original implementation
          obj[attr] = object;
        }
      }
    }

    return inner;
  }
}
