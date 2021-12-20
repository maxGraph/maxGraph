/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import {
  ALIGN,
  ARROW,
  NONE,
  SHAPE_CONNECTOR,
  SHAPE_RECTANGLE,
} from '../../util/constants';
import Perimeter from './Perimeter';
import { isNumeric } from '../../util/mathUtils';
import { clone } from '../../util/cloneUtils';

import type { CellStateStyles } from '../../types';

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
class Stylesheet {
  constructor() {
    this.styles = {} as CellStateStyles;

    this.putDefaultVertexStyle(this.createDefaultVertexStyle());
    this.putDefaultEdgeStyle(this.createDefaultEdgeStyle());
  }

  /**
   * Maps from names to cell styles. Each cell style is a map of key,
   * value pairs.
   */
  styles: CellStateStyles;

  /**
   * Creates and returns the default vertex style.
   */
  createDefaultVertexStyle() {
    const style = {} as CellStateStyles;
    style.shape = SHAPE_RECTANGLE;
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
    const style = {} as CellStateStyles;
    style.shape = SHAPE_CONNECTOR;
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
  putDefaultVertexStyle(style: CellStateStyles) {
    this.putCellStyle('defaultVertex', style);
  }

  /**
   * Sets the default style for edges using defaultEdge as the stylename.
   */
  putDefaultEdgeStyle(style: CellStateStyles) {
    this.putCellStyle('defaultEdge', style);
  }

  /**
   * Returns the default style for vertices.
   */
  getDefaultVertexStyle() {
    return this.styles.defaultVertex;
  }

  /**
   * Sets the default style for edges.
   */
  getDefaultEdgeStyle() {
    return this.styles.defaultEdge;
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
  putCellStyle(
    name: keyof CellStateStyles,
    style: CellStateStyles[keyof CellStateStyles]
  ) {
    (this.styles[name] as any) = style;
  }

  /**
   * Returns the cell style for the specified stylename or the given
   * defaultStyle if no style can be found for the given stylename.
   *
   * @param name String of the form [(stylename|key=value);] that represents the style.
   * @param defaultStyle Default style to be returned if no style can be found.
   */
  getCellStyle(name: string, defaultStyle: CellStateStyles) {
    let style = defaultStyle;

    if (name.length > 0) {
      const pairs = name.split(';');

      if (style && name.charAt(0) !== ';') {
        style = clone(style);
      } else {
        style = {} as CellStateStyles;
      }

      // Parses each key, value pair into the existing style
      for (const tmp of pairs) {
        const pos = tmp.indexOf('=');

        if (pos >= 0) {
          const key = tmp.substring(0, pos) as keyof CellStateStyles;
          const value = tmp.substring(pos + 1);

          if (value === NONE) {
            delete style[key];
          } else if (isNumeric(value)) {
            (style[key] as any) = parseFloat(value);
          } else {
            (style[key] as any) = value;
          }
        } else {
          // Merges the entries from a named style
          const tmpStyle = this.styles[tmp as keyof CellStateStyles] as CellStateStyles;

          if (tmpStyle && typeof tmpStyle === 'object') {
            for (const key in tmpStyle) {
              const k = key as keyof CellStateStyles;
              (style[k] as any) = tmpStyle[k];
            }
          }
        }
      }
    }
    return style;
  }
}

export default Stylesheet;
