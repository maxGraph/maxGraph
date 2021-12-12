/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Cell from '../../view/cell/Cell';
import ObjectCodec from './ObjectCodec';
import CodecRegistry from './CodecRegistry';
import { NODETYPE_ELEMENT } from '../constants';
import { removeWhitespace } from '../stringUtils';
import { importNode } from '../domUtils';

/**
 * Class: CellCodec
 *
 * Codec for <mxCell>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec>
 * and the <CodecRegistry>.
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
 * Transient fields can be added using the following code:
 *
 * CodecRegistry.getCodec(mxCell).exclude.push('name_of_field');
 *
 * To subclass <mxCell>, replace the template and add an alias as
 * follows.
 *
 * (code)
 * function CustomCell(value, geometry, style)
 * {
 *   mxCell.apply(this, arguments);
 * }
 *
 * mxUtils.extend(CustomCell, mxCell);
 *
 * CodecRegistry.getCodec(mxCell).template = new CustomCell();
 * CodecRegistry.addAlias('CustomCell', 'mxCell');
 * (end)
 */
class CellCodec extends ObjectCodec {
  constructor() {
    super(
      new Cell(),
      ['children', 'edges', 'overlays', 'mxTransient'],
      ['parent', 'source', 'target']
    );
  }

  /**
   * Function: isCellCodec
   *
   * Returns true since this is a cell codec.
   */
  isCellCodec() {
    return true;
  }

  /**
   * Overidden to disable conversion of value to number.
   */
  isNumericAttribute(dec, attr, obj) {
    return (
      attr.nodeName !== 'value' && super.isNumericAttribute(dec, attr, obj)
    );
  }

  /**
   * Function: isExcluded
   *
   * Excludes user objects that are XML nodes.
   */
  isExcluded(obj, attr, value, isWrite) {
    return (
      super.isExcluded(obj, attr, value, isWrite) ||
      (isWrite && attr === 'value' && value.nodeType === NODETYPE_ELEMENT)
    );
  }

  /**
   * Function: afterEncode
   *
   * Encodes an <mxCell> and wraps the XML up inside the
   * XML of the user object (inversion).
   */
  afterEncode(enc, obj, node) {
    if (obj.value != null && obj.value.nodeType === NODETYPE_ELEMENT) {
      // Wraps the graphical annotation up in the user object (inversion)
      // by putting the result of the default encoding into a clone of the
      // user object (node type 1) and returning this cloned user object.
      const tmp = node;
      node = importNode(enc.document, obj.value, true);
      node.appendChild(tmp);

      // Moves the id attribute to the outermost XML node, namely the
      // node which denotes the object boundaries in the file.
      const id = tmp.getAttribute('id');
      node.setAttribute('id', id);
      tmp.removeAttribute('id');
    }

    return node;
  }

  /**
   * Function: beforeDecode
   *
   * Decodes an <mxCell> and uses the enclosing XML node as
   * the user object for the cell (inversion).
   */
  beforeDecode(dec, node, obj) {
    let inner = node.cloneNode(true);
    const classname = this.getName();

    if (node.nodeName !== classname) {
      // Passes the inner graphical annotation node to the
      // object codec for further processing of the cell.
      const tmp = node.getElementsByTagName(classname)[0];

      if (tmp != null && tmp.parentNode === node) {
        removeWhitespace(tmp, true);
        removeWhitespace(tmp, false);
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
      obj.setId(node.getAttribute('id'));
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

          obj[attr] = object;
        }
      }
    }

    return inner;
  }
}

CodecRegistry.register(new CellCodec());
export default CellCodec;
