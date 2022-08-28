/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import { ALIGN, ARROW, SHAPE } from '../../util/Constants';
import Perimeter from './Perimeter';
import { clone } from '../../util/cloneUtils';
import { isNumeric } from '../../util/mathUtils';
import CodecRegistry from '../../serialization/CodecRegistry';
import { NODETYPE } from '../../util/Constants';
import MaxLog from '../../gui/MaxLog';
import StyleRegistry from './StyleRegistry';
import ObjectCodec from '../../serialization/ObjectCodec';
import { getTextContent } from '../../util/domUtils';
import Codec from '../../serialization/Codec';

import type { CellStateStyle, CellStyle } from '../../types';

/**
 * @class Stylesheet
 *
 * Defines the appearance of the cells in a graph. See {@link putCellStyle} for an
 * example of creating a new cell style. It is recommended to use objects, not
 * arrays for holding cell styles. Existing styles can be cloned using
 * {@link clone} and turned into a string for debugging using
 * {@link toString}.
 *
 * ### Default Styles
 *
 * The stylesheet contains two built-in styles, which are used if no style is
 * defined for a cell:
 *
 * - defaultVertex Default style for vertices
 * - defaultEdge Default style for edges
 *
 * ### Example
 *
 * ```javascript
 * var vertexStyle = stylesheet.getDefaultVertexStyle();
 * vertexStyle.rounded = true;
 * var edgeStyle = stylesheet.getDefaultEdgeStyle();
 * edgeStyle.edge = mxEdgeStyle.EntityRelation;
 * ```
 *
 * Modifies the built-in default styles.
 *
 * To avoid the default style for a cell, add a leading semicolon
 * to the style definition, eg.
 *
 * ```javascript
 * ;shadow=1
 * ```
 *
 * ### Removing keys
 *
 * For removing a key in a cell style of the form [stylename;|key=value;] the
 * special value none can be used, eg. highlight;fillColor=none
 *
 * See also the helper methods in mxUtils to modify strings of this format,
 * namely {@link setStyle}, {@link indexOfStylename},
 * {@link addStylename}, {@link removeStylename},
 * {@link removeAllStylenames} and {@link setStyleFlag}.
 *
 * Constructor: mxStylesheet
 *
 * Constructs a new stylesheet and assigns default styles.
 */
export class Stylesheet {
  constructor() {
    this.styles = new Map();

    this.putDefaultVertexStyle(this.createDefaultVertexStyle());
    this.putDefaultEdgeStyle(this.createDefaultEdgeStyle());
  }

  /**
   * Maps from names to cell styles. Each cell style is a map of key,
   * value pairs.
   */
  styles: Map<string, CellStateStyle>;

  /**
   * Creates and returns the default vertex style.
   */
  createDefaultVertexStyle() {
    const style = {} as CellStateStyle;
    style.shape = SHAPE.RECTANGLE;
    style.perimeter = Perimeter.RectanglePerimeter;
    style.verticalAlign = ALIGN.MIDDLE;
    style.align = ALIGN.CENTER;
    style.fillColor = '#C3D9FF';
    style.strokeColor = '#6482B9';
    style.fontColor = '#774400';

    return style;
  }

  /**
   * Creates and returns the default edge style.
   */
  createDefaultEdgeStyle() {
    const style = {} as CellStateStyle;
    style.shape = SHAPE.CONNECTOR;
    style.endArrow = ARROW.CLASSIC;
    style.verticalAlign = ALIGN.MIDDLE;
    style.align = ALIGN.CENTER;
    style.strokeColor = '#6482B9';
    style.fontColor = '#446299';

    return style;
  }

  /**
   * Sets the default style for vertices using defaultVertex as the
   * stylename.
   * @param style Key, value pairs that define the style.
   */
  putDefaultVertexStyle(style: CellStateStyle) {
    this.putCellStyle('defaultVertex', style);
  }

  /**
   * Sets the default style for edges using defaultEdge as the stylename.
   */
  putDefaultEdgeStyle(style: CellStateStyle) {
    this.putCellStyle('defaultEdge', style);
  }

  /**
   * Returns the default style for vertices.
   */
  getDefaultVertexStyle() {
    return this.styles.get('defaultVertex');
  }

  /**
   * Sets the default style for edges.
   */
  getDefaultEdgeStyle() {
    return this.styles.get('defaultEdge');
  }

  /**
   * Stores the given map of key, value pairs under the given name in
   * {@link styles}.
   *
   * Example:
   *
   * The following example adds a new style called 'rounded' into an
   * existing stylesheet:
   *
   * ```javascript
   * var style = new Object();
   * style.shape = mxConstants.SHAPE_RECTANGLE;
   * style.perimiter = mxPerimeter.RectanglePerimeter;
   * style.rounded = true;
   * graph.getStylesheet().putCellStyle('rounded', style);
   * ```
   *
   * In the above example, the new style is an object. The possible keys of
   * the object are all the constants in {@link mxConstants} that start with STYLE
   * and the values are either JavaScript objects, such as
   * {@link Perimeter.RightAngleRectanglePerimeter} (which is in fact a function)
   * or expressions, such as true. Note that not all keys will be
   * interpreted by all shapes (eg. the line shape ignores the fill color).
   * The final call to this method associates the style with a name in the
   * stylesheet. The style is used in a cell with the following code:
   *
   * ```javascript
   * model.setStyle(cell, 'rounded');
   * ```
   *
   * @param name Name for the style to be stored.
   * @param style Key, value pairs that define the style.
   */
  putCellStyle(name: string, style: CellStateStyle) {
    this.styles.set(name, style);
  }

  /**
   * Returns the cell style for the specified baseStyleNames or the given
   * defaultStyle if no style can be found for the given baseStyleNames.
   *
   * @param cellStyle An object that represents the style.
   * @param defaultStyle Default style to be returned if no style can be found.
   */
  getCellStyle(cellStyle: CellStyle, defaultStyle: CellStateStyle) {
    let style: CellStateStyle;

    if (cellStyle.baseStyleNames && cellStyle.baseStyleNames.length > 0) {
      // creates style with the given baseStyleNames. (merges from left to right)
      style = cellStyle.baseStyleNames.reduce((acc, styleName) => {
        return (acc = {
          ...acc,
          ...this.styles.get(styleName),
        });
      }, {});
    } else if (cellStyle.baseStyleNames && cellStyle.baseStyleNames.length === 0) {
      // baseStyleNames is explicitly an empty array, so don't use any default styles.
      style = {};
    } else {
      style = { ...defaultStyle };
    }

    // Merges cellStyle into style
    style = {
      ...style,
      ...cellStyle,
    };

    return style;
  }
}

/**
 * Codec for {@link Stylesheet}s. This class is created and registered
 * dynamically at load time and used implicitly via <Codec>
 * and the <CodecRegistry>.
 */
export class StylesheetCodec extends ObjectCodec {
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
   * as - Name of the style (see {@link Constants}).
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
  decode(dec: Codec, _node: Element, into: any): any {
    const obj = into || new this.template.constructor();
    const id = _node.getAttribute('id');

    if (id != null) {
      dec.objects[id] = obj;
    }

    let node: Element | ChildNode | null = _node.firstChild;

    while (node != null) {
      if (!this.processInclude(dec, <Element>node, obj) && node.nodeName === 'add') {
        const as = (<Element>node).getAttribute('as');

        if (as != null) {
          const extend = (<Element>node).getAttribute('extend');
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
              const key = <string>(<Element>entry).getAttribute('as');

              if (entry.nodeName === 'add') {
                const text = getTextContent(<Text>(<unknown>entry));
                let value = null;

                if (text != null && text.length > 0 && StylesheetCodec.allowEval) {
                  value = eval(text);
                } else {
                  value = (<Element>entry).getAttribute('value');

                  if (isNumeric(value)) {
                    value = parseFloat(<string>value);
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

CodecRegistry.register(new StylesheetCodec());
export default Stylesheet;
