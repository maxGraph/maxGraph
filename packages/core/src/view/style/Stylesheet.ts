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

import { NONE } from '../../util/Constants.js';
import { clone } from '../../util/cloneUtils.js';
import type { CellStateStyle, CellStyle } from '../../types.js';

/**
 * Defines the appearance of the cells in a graph. See {@link putCellStyle} for an example
 * of creating a new cell style.
 *
 * Existing styles can be cloned using {@link clone} and turned into a string for debugging
 * using {@link toString}.
 *
 * ### Default Styles
 *
 * The stylesheet contains two built-in styles, which are used if no style is defined for
 * a cell:
 *
 * - `defaultVertex`: default style for vertices
 * - `defaultEdge`: default style for edges
 *
 * ### Example
 *
 * ```javascript
 * const defaultVertexStyle = stylesheet.getDefaultVertexStyle();
 * defaultVertexStyle.rounded = true;
 * const defaultEdgeStyle = stylesheet.getDefaultEdgeStyle();
 * defaultEdgeStyle.edgeStyle = EdgeStyle.EntityRelation;
 * ```
 *
 * @category Style
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
    style.shape = 'rectangle';
    style.perimeter = 'rectanglePerimeter';
    style.verticalAlign = 'middle';
    style.align = 'center';
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
    style.shape = 'connector';
    style.endArrow = 'classic';
    style.verticalAlign = 'middle';
    style.align = 'center';
    style.strokeColor = '#6482B9';
    style.fontColor = '#446299';

    return style;
  }

  /**
   * Sets the default style for vertices using `defaultVertex` as the style name.
   * @param style The style to be stored.
   */
  putDefaultVertexStyle(style: CellStateStyle) {
    this.putCellStyle('defaultVertex', style);
  }

  /**
   * Sets the default style for edges using `defaultEdge` as the style name.
   * @param style The style to be stored.
   */
  putDefaultEdgeStyle(style: CellStateStyle) {
    this.putCellStyle('defaultEdge', style);
  }

  /**
   * Returns the default style for vertices.
   */
  getDefaultVertexStyle(): CellStateStyle {
    return this.styles.get('defaultVertex')!;
  }

  /**
   * Returns the default style for edges.
   */
  getDefaultEdgeStyle(): CellStateStyle {
    return this.styles.get('defaultEdge')!;
  }

  /**
   * Stores the given {@link CellStateStyle} under the given name in {@link styles}.
   *
   * ### Example
   *
   * The following example adds a new style called `rounded` into an existing stylesheet:
   *
   * ```javascript
   * const style = {} as CellStateStyle;
   * style.shape = 'rectangle';
   * style.perimeter = 'rectanglePerimeter';
   * style.rounded = true;
   * graph.getStylesheet().putCellStyle('rounded', style);
   * ```
   *
   * ### Description
   *
   * Note that not all properties will be interpreted by all shapes. For example, the 'line' shape ignores the fill color.
   * The final call to this method associates the style with a name in the stylesheet.
   *
   * The style is used in a cell with the following code:
   * ```javascript
   * // model is an instance of GraphDataModel
   * // style is an instance of CellStyle
   * model.setStyle(cell, { baseStyleNames: ['rounded'] });
   * ```
   *
   * @param name Name for the style to be stored.
   * @param style The instance of the style to be stored.
   */
  putCellStyle(name: string, style: CellStateStyle) {
    this.styles.set(name, style);
  }

  /**
   * Returns a {@link CellStateStyle} computed by merging the default style, styles referenced in the specified `baseStyleNames`
   * and the properties of the `cellStyle` parameter.
   *
   * The properties are merged by taking the properties from various styles in the following order:
   *   - default style (if {@link CellStyle.ignoreDefaultStyle} is not set to `true`, otherwise it is ignored)
   *   - registered styles referenced in `baseStyleNames`, in the order of the array
   *   - `cellStyle` parameter
   *
   * To fully unset a style property i.e. the property is not set even if a value is set in the default style or in the referenced styles,
   * set the `cellStyle` property to `none`. For example. `cellStyle.fillColor = 'none'`
   *
   * @param cellStyle An object that represents the style.
   * @param defaultStyle Default style used as reference to compute the returned style.
   */
  getCellStyle(cellStyle: CellStyle, defaultStyle: CellStateStyle) {
    let style = cellStyle.ignoreDefaultStyle ? {} : { ...defaultStyle };
    if (cellStyle.baseStyleNames) {
      // creates style with the given baseStyleNames. (merges from left to right)
      style = cellStyle.baseStyleNames.reduce((acc, styleName) => {
        return {
          ...acc,
          ...this.styles.get(styleName),
        };
      }, style);
    }

    // Merges cellStyle into style
    for (const key of Object.keys(cellStyle)) {
      // @ts-ignore
      if (cellStyle[key] !== undefined) {
        // @ts-ignore
        cellStyle[key] == NONE ? delete style[key] : (style[key] = cellStyle[key]);
      }
    }

    // Remove the specific CellStyle properties that may have been copied from the cellStyle parameter to match the method signature
    'baseStyleNames' in style && delete style.baseStyleNames;
    'ignoreDefaultStyle' in style && delete style.ignoreDefaultStyle;

    return style;
  }
}
