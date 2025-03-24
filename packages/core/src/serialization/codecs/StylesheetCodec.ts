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

import ObjectCodec from '../ObjectCodec';
import { Stylesheet } from '../../view/style/Stylesheet';
import type Codec from '../Codec';
import StyleRegistry from '../../view/style/StyleRegistry';
import { clone } from '../../util/cloneUtils';
import { GlobalConfig } from '../../util/config';
import { isNumeric } from '../../util/mathUtils';
import { getTextContent, isElement } from '../../util/domUtils';

/**
 * Codec for {@link Stylesheet}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * @category Serialization with Codecs
 */
export class StylesheetCodec extends ObjectCodec {
  constructor() {
    super(new Stylesheet());
  }

  /**
   * Static global switch that specifies if the use of eval is allowed for evaluating text content.
   * Set this to `false` if stylesheets may contain user input.
   * @default true
   */
  static allowEval = true;

  /**
   * Encodes a stylesheet. See {@link decode} for a description of the format.
   */
  encode(enc: Codec, obj: any): Element {
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
  getStringValue(key: string, value: any): string | null {
    const type = typeof value;

    if (type === 'function') {
      value = StyleRegistry.getName(value);
    } else if (type === 'object') {
      value = null;
    }

    return value;
  }

  /**
   * Reads a sequence of the following child nodes and attributes:
   *
   * Child Nodes:
   * - `add` - Adds a new style.
   *
   * Attributes:
   * - `as` - Name of the style.
   * - `extend` - Name of the style to inherit from.
   *
   * Each node contains another sequence of add and remove nodes with the following attributes:
   * - `as` - Name of the style (see properties of {@link CellStateStyle}).
   * - `value` - Value for the style.
   *
   * Instead of the value-attribute, one can put Javascript expressions into the node as follows if {@link allowEval} is `true`:
   * <add as="perimeter">Perimeter.RectanglePerimeter</add>
   *
   * A remove node will remove the entry with the name given in the as-attribute from the style.
   *
   * Example:
   *
   * ```javascript
   * <Stylesheet as="stylesheet">
   *   <add as="text">
   *     <add as="fontSize" value="12"/>
   *   </add>
   *   <add as="defaultVertex" extend="text">
   *     <add as="shape" value="rectangle"/>
   *   </add>
   * </Stylesheet>
   * ```
   */
  decode(dec: Codec, _node: Element, into: any): any {
    const obj = into || new this.template.constructor();
    const id = _node.getAttribute('id');

    if (id) {
      dec.objects[id] = obj;
    }

    let node: Element | ChildNode | null = _node.firstChild;

    while (node) {
      if (!this.processInclude(dec, <Element>node, obj) && node.nodeName === 'add') {
        const as = (<Element>node).getAttribute('as');

        if (as) {
          const extend = (<Element>node).getAttribute('extend');
          let style = extend ? clone(obj.styles[extend]) : null;

          if (!style) {
            if (extend) {
              GlobalConfig.logger.warn(
                `StylesheetCodec.decode: stylesheet ${extend} not found to extend`
              );
            }

            style = {};
          }

          let entry = node.firstChild;
          while (entry) {
            if (isElement(entry)) {
              const key = entry.getAttribute('as')!;

              if (entry.nodeName === 'add') {
                const text = getTextContent(<Text>(<unknown>entry));
                let value = null;

                if (text && StylesheetCodec.allowEval) {
                  value = eval(text);
                } else {
                  value = entry.getAttribute('value');

                  if (isNumeric(value)) {
                    value = parseFloat(value);
                  }
                }

                if (value) {
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
