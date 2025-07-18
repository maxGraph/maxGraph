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

import Client from '../Client.js';
import {
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  FONT_STYLE_MASK,
  LINE_HEIGHT,
} from './Constants.js';
import Point from '../view/geometry/Point.js';
import CellPath from '../view/cell/CellPath.js';
import Rectangle from '../view/geometry/Rectangle.js';
import Cell from '../view/cell/Cell.js';
import GraphDataModel from '../view/GraphDataModel.js';
import type {
  AlignValue,
  CellStateStyle,
  CellStyle,
  NumericCellStateStyleKeys,
  VAlignValue,
} from '../types.js';
import { matchBinaryMask } from '../internal/utils.js';

/**
 * Removes the cursors from the style of the given DOM node and its descendants.
 *
 * @param element DOM node to remove the cursor style from.
 */
export const removeCursors = (element: HTMLElement) => {
  if (element.style) {
    element.style.cursor = '';
  }

  const children = element.children;

  if (children) {
    const childCount = children.length;

    for (let i = 0; i < childCount; i += 1) {
      removeCursors(children[i] as HTMLElement);
    }
  }
};

/**
 * Returns the current style of the specified element.
 *
 * @param element DOM node whose current style should be returned.
 */
export const getCurrentStyle = (element: HTMLElement) => {
  return !element || element.toString() === '[object ShadowRoot]'
    ? null
    : window.getComputedStyle(element, '');
};

/**
 * Parses the given CSS numeric value adding handling for the values thin, medium and thick (2, 4 and 6).
 */
export const parseCssNumber = (value: string) => {
  if (value === 'thin') {
    value = '2';
  } else if (value === 'medium') {
    value = '4';
  } else if (value === 'thick') {
    value = '6';
  }

  let n = parseFloat(value);

  if (Number.isNaN(n)) {
    n = 0;
  }

  return n;
};

/**
 * Adds the given style with the standard name and an optional vendor prefix for the current browser.
 *
 * ```javascript
 * styleUtils.setPrefixedStyle(node.style, 'transformOrigin', '0% 0%');
 * ```
 */
export const setPrefixedStyle = (
  style: CSSStyleDeclaration,
  name: string,
  value: string
) => {
  let prefix = null;

  if (Client.IS_SF || Client.IS_GC) {
    prefix = 'Webkit';
  } else if (Client.IS_MT) {
    prefix = 'Moz';
  }

  style.setProperty(name, value);

  if (prefix !== null && name.length > 0) {
    name = prefix + name.substring(0, 1).toUpperCase() + name.substring(1);
    style.setProperty(name, value);
  }
};

/**
 * Function: hasScrollbars
 *
 * Returns true if the overflow CSS property of the given node is either
 * scroll or auto.
 *
 * @param node DOM node whose style should be checked for scrollbars.
 */
export const hasScrollbars = (node: HTMLElement) => {
  const style = getCurrentStyle(node);

  return !!style && (style.overflow === 'scroll' || style.overflow === 'auto');
};

/**
 * Returns the client size for the current document as an {@link Rectangle}.
 */
export const getDocumentSize = () => {
  const b = document.body;
  const d = document.documentElement;

  try {
    return new Rectangle(
      0,
      0,
      b.clientWidth ?? d.clientWidth,
      Math.max(b.clientHeight ?? 0, d.clientHeight)
    );
  } catch (e) {
    return new Rectangle();
  }
};

/**
 * Makes sure the given node is inside the visible area of the window.
 * This is done by setting the left and top in the style.
 */
export const fit = (node: HTMLElement) => {
  const ds = getDocumentSize();
  const left = node.offsetLeft;
  const width = node.offsetWidth;

  const offset = getDocumentScrollOrigin(node.ownerDocument);
  const sl = offset.x;
  const st = offset.y;
  const right = sl + ds.width;

  if (left + width > right) {
    node.style.left = `${Math.max(sl, right - width)}px`;
  }

  const top = node.offsetTop;
  const height = node.offsetHeight;
  const bottom = st + ds.height;

  if (top + height > bottom) {
    node.style.top = `${Math.max(st, bottom - height)}px`;
  }
};

/**
 * Returns the offset for the specified container as an {@link Point}.
 * The offset is the distance from the top left corner of the container to the top left corner of the document.
 *
 * @param container DOM node to return the offset for.
 * @param scrollOffset Optional boolean to add the scroll offset of the document. Default is `false`.
 */
export const getOffset = (container: HTMLElement, scrollOffset = false) => {
  let offsetLeft = 0;
  let offsetTop = 0;

  // Ignores document scroll origin for fixed elements
  let fixed = false;
  let node: HTMLElement | null = container;
  const b = document.body;
  const d = document.documentElement;

  while (node != null && node != b && node != d && !fixed) {
    const style = getCurrentStyle(node);

    if (style != null) {
      fixed = fixed || style.position == 'fixed';
    }

    node = node.parentNode as HTMLElement;
  }

  if (!scrollOffset && !fixed) {
    const offset = getDocumentScrollOrigin(container.ownerDocument);
    offsetLeft += offset.x;
    offsetTop += offset.y;
  }

  const r = container.getBoundingClientRect();

  if (r != null) {
    offsetLeft += r.left;
    offsetTop += r.top;
  }

  return new Point(offsetLeft, offsetTop);
};

/**
 * Returns the scroll origin of the given document or the current document if no document is given.
 */
export const getDocumentScrollOrigin = (doc: Document) => {
  // @ts-ignore 'parentWindow' is an unknown property.
  const wnd = doc.defaultView || doc.parentWindow;

  const x =
    wnd != null && window.pageXOffset !== undefined
      ? window.pageXOffset
      : (document.documentElement || document.body.parentNode || document.body)
          .scrollLeft;
  const y =
    wnd != null && window.pageYOffset !== undefined
      ? window.pageYOffset
      : (document.documentElement || document.body.parentNode || document.body).scrollTop;

  return new Point(x, y);
};

/**
 * Returns the top, left corner of the view rectangle as an {@link Point}.
 *
 * @param node DOM node whose scroll origin should be returned.
 * @param includeAncestors Whether the scroll origin of the ancestors should be included. Default is `false`.
 * @param includeDocument Whether the scroll origin of the document should be included. Default is `true`.
 */
export const getScrollOrigin = (
  node: HTMLElement | null = null,
  includeAncestors = false,
  includeDocument = true
) => {
  const doc = node != null ? node.ownerDocument : document;
  const b = doc.body;
  const d = doc.documentElement;
  const result = new Point();
  let fixed = false;

  while (node != null && node != b && node != d) {
    if (!Number.isNaN(node.scrollLeft) && !Number.isNaN(node.scrollTop)) {
      result.x += node.scrollLeft;
      result.y += node.scrollTop;
    }

    const style = getCurrentStyle(node);

    if (style != null) {
      fixed = fixed || style.position == 'fixed';
    }

    node = includeAncestors ? (node.parentNode as HTMLElement) : null;
  }

  if (!fixed && includeDocument) {
    const origin = getDocumentScrollOrigin(doc);

    result.x += origin.x;
    result.y += origin.y;
  }

  return result;
};

/**
 * Converts the specified point (x, y) using the offset of the specified container and returns a new {@link Point} with the result.
 *
 * ```javascript
 * const pt = styleUtils.convertPoint(graph.container, eventUtils.getClientX(evt), eventUtils.getClientY(evt));
 * ```
 *
 * @param container DOM node to use for the offset.
 * @param x X-coordinate of the point to be converted.
 * @param y Y-coordinate of the point to be converted.
 */
export const convertPoint = (container: HTMLElement, x: number, y: number) => {
  const origin = getScrollOrigin(container, false);
  const offset = getOffset(container);

  offset.x -= origin.x;
  offset.y -= origin.y;

  return new Point(x - offset.x, y - offset.y);
};

/**
 * Assigns the value for the given key in the styles of the given cells, or removes the key from the styles if the value is `null`.
 *
 * @param model {@link GraphDataModel} to execute the transaction in.
 * @param cells Array of {@link Cell}s to be updated.
 * @param key Key of the style to be changed.
 * @param value New value for the given key.
 */
export const setCellStyles = (
  model: GraphDataModel,
  cells: Cell[],
  key: keyof CellStateStyle,
  value: any
) => {
  if (cells.length > 0) {
    model.batchUpdate(() => {
      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];

        if (cell) {
          // Currently, the style object must be cloned, otherwise model.setStyle does not trigger the change event and the cell state in the view is not updated
          const style = cell.getClonedStyle();
          style[key] = value;

          model.setStyle(cell, style);
        }
      }
    });
  }
};

/**
 * Sets or toggles the flag bit for the given key in the cell's styles.
 * If the `value` parameter is not set, then the flag is toggled.
 *
 * Example that toggles the bold font style:
 *
 * ```javascript
 * const cells = graph.getSelectionCells();
 * setCellStyleFlags(graph.model,
 *       cells,
 *       'fontStyle',
 *       constants.FONT_STYLE_FLAG.BOLD);
 * ```
 *
 * @param model {@link GraphDataModel} that contains the cells.
 * @param cells Array of {@link Cell}s to change the style for.
 * @param key Key of the style to be changed.
 * @param flag Integer for the bit to be changed.
 * @param value Optional boolean value for the flag.
 */
export const setCellStyleFlags = (
  model: GraphDataModel,
  cells: Cell[],
  key: NumericCellStateStyleKeys,
  flag: number,
  value?: boolean
) => {
  if (cells.length > 0) {
    model.batchUpdate(() => {
      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];

        if (cell) {
          // Currently, the style object must be cloned, otherwise model.setStyle does not trigger the change event and the cell state in the view is not updated
          const style = setStyleFlag(cell.getClonedStyle(), key, flag, value);
          model.setStyle(cell, style);
        }
      }
    });
  }
};

/**
 * Sets or toggles the flag bit for the given key in the cell's style.
 * If the `value` parameter is not set, then the flag is toggled.
 *
 * @param style The style of the Cell.
 * @param key Key of the style to be changed.
 * @param flag Integer for the bit to be changed.
 * @param value Optional boolean value for the given flag.
 */
export const setStyleFlag = (
  style: CellStyle,
  key: NumericCellStateStyleKeys,
  flag: number,
  value?: boolean
) => {
  const v = style[key];

  if (v === undefined) {
    style[key] = value === undefined || value ? flag : 0;
  } else {
    if (value === undefined) {
      style[key] = v ^ flag;
    } else if (value) {
      style[key] = v | flag;
    } else {
      style[key] = v & ~flag;
    }
  }

  return style;
};

/**
 * Sets the opacity of the specified DOM node to the given value in %.
 *
 * @param node DOM node to set the opacity for.
 * @param value Opacity in %. Possible values are between 0 and 100.
 */
export const setOpacity = (node: HTMLElement | SVGElement, value: number) => {
  node.style.opacity = String(value / 100);
};

/**
 * Returns an {@link Rectangle} with the size (width and height in pixels) of the given string.
 * The string may contain HTML markup.
 * Newlines should be converted to `<br>` before calling this method.
 * The caller is responsible for sanitizing the HTML markup.
 *
 * Example:
 *
 * ```javascript
 * const label = graph.getLabel(cell).replace(/\n/g, "<br>");
 * const size = graph.getSizeForString(label);
 * ```
 *
 * @param text String whose size should be returned.
 * @param fontSize Integer that specifies the font size in pixels. Default is {@link DEFAULT_FONTSIZE}.
 * @param fontFamily String that specifies the name of the font family. Default is {@link DEFAULT_FONTFAMILY}.
 * @param textWidth Optional width for text wrapping.
 * @param fontStyle Optional font style, value generally taken from {@link CellStateStyle.fontStyle}.
 */
export const getSizeForString = (
  text: string,
  fontSize = DEFAULT_FONTSIZE,
  fontFamily = DEFAULT_FONTFAMILY,
  textWidth: number | null = null,
  fontStyle: number | null = null
) => {
  const div = document.createElement('div');

  // Sets the font size and family
  div.style.fontFamily = fontFamily;
  div.style.fontSize = `${Math.round(fontSize)}px`;
  div.style.lineHeight = `${Math.round(fontSize * LINE_HEIGHT)}px`;

  // Sets the font style
  if (fontStyle !== null) {
    matchBinaryMask(fontStyle, FONT_STYLE_MASK.BOLD) && (div.style.fontWeight = 'bold');
    matchBinaryMask(fontStyle, FONT_STYLE_MASK.ITALIC) &&
      (div.style.fontStyle = 'italic');

    const txtDecor = [];
    matchBinaryMask(fontStyle, FONT_STYLE_MASK.UNDERLINE) && txtDecor.push('underline');
    matchBinaryMask(fontStyle, FONT_STYLE_MASK.STRIKETHROUGH) &&
      txtDecor.push('line-through');
    txtDecor.length > 0 && (div.style.textDecoration = txtDecor.join(' '));
  }

  // Disables block layout and outside wrapping and hides the div
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.display = 'inline-block';

  if (textWidth !== null) {
    div.style.width = `${textWidth}px`;
    div.style.whiteSpace = 'normal';
  } else {
    div.style.whiteSpace = 'nowrap';
  }

  // Adds the text and inserts into DOM for updating of size
  div.innerHTML = text;
  document.body.appendChild(div);

  // Gets the size and removes from DOM
  const size = new Rectangle(0, 0, div.offsetWidth, div.offsetHeight);
  document.body.removeChild(div);

  return size;
};

/**
 * Sorts the given cells according to the order in the cell hierarchy.
 * Ascending is optional and defaults to `true`.
 */
export const sortCells = (cells: Cell[], ascending = true): Cell[] => {
  const lookup = new Map<Cell, string[]>();

  cells.sort((o1, o2) => {
    let p1 = lookup.get(o1);

    if (p1 == null) {
      p1 = CellPath.create(o1).split(CellPath.PATH_SEPARATOR);
      lookup.set(o1, p1);
    }

    let p2 = lookup.get(o2);

    if (p2 == null) {
      p2 = CellPath.create(o2).split(CellPath.PATH_SEPARATOR);
      lookup.set(o2, p2);
    }

    const comp = CellPath.compare(p1, p2);

    return comp == 0 ? 0 : comp > 0 == ascending ? 1 : -1;
  });

  return cells;
};

/**
 * Returns an {@link Point} that represents the horizontal and vertical alignment for numeric computations.
 *
 * X is -0.5 for center, -1 for right and 0 for left alignment.
 * Y is -0.5 for middle, -1 for bottom and 0 for top alignment.
 *
 * Default values for missing arguments is center and middle.
 */
export const getAlignmentAsPoint = (align: AlignValue, valign: VAlignValue) => {
  let dx = -0.5;
  let dy = -0.5;

  // Horizontal alignment
  if (align === 'left') {
    dx = 0;
  } else if (align === 'right') {
    dx = -1;
  }

  // Vertical alignment
  if (valign === 'top') {
    dy = 0;
  } else if (valign === 'bottom') {
    dy = -1;
  }

  return new Point(dx, dy);
};
