/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Stylesheet from './Stylesheet';
import { isNumeric } from '../../util/mathUtils';
import CodecRegistry from '../../serialization/CodecRegistry';
import { NODETYPE } from '../../util/constants';
import MaxLog from '../../gui/MaxLog';
import StyleRegistry from './StyleRegistry';
import ObjectCodec from '../../serialization/ObjectCodec';
import { getTextContent } from '../../util/domUtils';
import { clone } from '../../util/cloneUtils';

/**
 * Codec for <mxStylesheet>s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec>
 * and the <CodecRegistry>.
 */
class StylesheetCodec extends ObjectCodec {
  constructor() {
    super(new Stylesheet());
  }

  /**
   * Static global switch that specifies if the use of eval is allowed for
   * evaluating text content. Default is true. Set this to false if stylesheets
   * may contain user input.
   */
  static allowEval = true;

  /**
   * Encodes a stylesheet. See <decode> for a description of the
   * format.
   */
  encode(enc, obj) {
    const node = enc.document.createElement(this.getName());

    for (const i in obj.styles) {
      const style = obj.styles[i];
      const styleNode = enc.document.createElement('add');

      if (i != null) {
        styleNode.setAttribute('as', i);

        for (const j in style) {
          const value = this.getStringValue(j, style[j]);

          if (value != null) {
            const entry = enc.document.createElement('add');
            entry.setAttribute('value', value);
            entry.setAttribute('as', j);
            styleNode.appendChild(entry);
          }
        }

        if (styleNode.childNodes.length > 0) {
          node.appendChild(styleNode);
        }
      }
    }

    return node;
  }

  /**
   * Returns the string for encoding the given value.
   */
  getStringValue(key, value) {
    const type = typeof value;

    if (type === 'function') {
      value = mxStyleRegistry.getName(value);
    } else if (type === 'object') {
      value = null;
    }

    return value;
  }

  /**
   * Reads a sequence of the following child nodes
   * and attributes:
   *
   * Child Nodes:
   *
   * add - Adds a new style.
   *
   * Attributes:
   *
   * as - Name of the style.
   * extend - Name of the style to inherit from.
   *
   * Each node contains another sequence of add and remove nodes with the following
   * attributes:
   *
   * as - Name of the style (see <mxConstants>).
   * value - Value for the style.
   *
   * Instead of the value-attribute, one can put Javascript expressions into
   * the node as follows if <StylesheetCodec.allowEval> is true:
   * <add as="perimeter">mxPerimeter.RectanglePerimeter</add>
   *
   * A remove node will remove the entry with the name given in the as-attribute
   * from the style.
   *
   * Example:
   *
   * ```javascript
   * <mxStylesheet as="stylesheet">
   *   <add as="text">
   *     <add as="fontSize" value="12"/>
   *   </add>
   *   <add as="defaultVertex" extend="text">
   *     <add as="shape" value="rectangle"/>
   *   </add>
   * </mxStylesheet>
   * ```
   */
  decode(dec: Codec, node: Element, into: any): any {
    const obj = into || new this.template.constructor();
    const id = node.getAttribute('id');

    if (id != null) {
      dec.objects[id] = obj;
    }

    node = node.firstChild;

    while (node != null) {
      if (!this.processInclude(dec, node, obj) && node.nodeName === 'add') {
        const as = node.getAttribute('as');

        if (as != null) {
          const extend = node.getAttribute('extend');
          let style = extend != null ? clone(obj.styles[extend]) : null;

          if (style == null) {
            if (extend != null) {
              MaxLog.warn(
                `StylesheetCodec.decode: stylesheet ${extend} not found to extend`
              );
            }

            style = {};
          }

          let entry = node.firstChild;

          while (entry != null) {
            if (entry.nodeType === NODETYPE.ELEMENT) {
              const key = entry.getAttribute('as');

              if (entry.nodeName === 'add') {
                const text = getTextContent(entry);
                let value = null;

                if (text != null && text.length > 0 && StylesheetCodec.allowEval) {
                  value = eval(text);
                } else {
                  value = entry.getAttribute('value');

                  if (isNumeric(value)) {
                    value = parseFloat(value);
                  }
                }

                if (value != null) {
                  style[key] = value;
                }
              } else if (entry.nodeName === 'remove') {
                delete style[key];
              }
            }

            entry = entry.nextSibling;
          }

          obj.putCellStyle(as, style);
        }
      }

      node = node.nextSibling;
    }

    return obj;
  }
}

// CodecRegistry.register(new StylesheetCodec());
export default StylesheetCodec;
