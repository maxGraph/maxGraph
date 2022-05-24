/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Client from '../Client';
import {
  ALIGN,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  FONT,
  LINE_HEIGHT,
} from './Constants';
import Point from '../view/geometry/Point';
import Dictionary from './Dictionary';
import CellPath from '../view/cell/CellPath';
import Rectangle from '../view/geometry/Rectangle';
import Cell from '../view/cell/Cell';
import GraphDataModel from '../view/GraphDataModel';
import CellArray from '../view/cell/CellArray';


/**
 * Removes the cursors from the style of the given DOM node and its
 * descendants.
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
   * Function: getCurrentStyle
   *
   * Returns the current style of the specified element.
   *
   * @param element DOM node whose current style should be returned.
   */
  export const getCurrentStyle = (element: HTMLElement) => {
    return element ? window.getComputedStyle(element, '') : null;
  };

  /**
   * Function: parseCssNumber
   *
   * Parses the given CSS numeric value adding handling for the values thin,
   * medium and thick (2, 4 and 6).
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
   * Function: setPrefixedStyle
   *
   * Adds the given style with the standard name and an optional vendor prefix for the current
   * browser.
   *
   * ```javascript
   * mxUtils.setPrefixedStyle(node.style, 'transformOrigin', '0% 0%');
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
 * Makes sure the given node is inside the visible area of the window. This
 * is done by setting the left and top in the style.
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
 * Returns the offset for the specified container as an {@link Point}. The
 * offset is the distance from the top left corner of the container to the
 * top left corner of the document.
 *
 * @param container DOM node to return the offset for.
 * @param scollOffset Optional boolean to add the scroll offset of the document.
 * Default is false.
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
 * Returns the scroll origin of the given document or the current document
 * if no document is given.
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
 * Returns the top, left corner of the viewrect as an {@link Point}.
 *
 * @param node DOM node whose scroll origin should be returned.
 * @param includeAncestors Whether the scroll origin of the ancestors should be
 * included. Default is false.
 * @param includeDocument Whether the scroll origin of the document should be
 * included. Default is true.
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
 * Converts the specified point (x, y) using the offset of the specified
 * container and returns a new {@link Point} with the result.
 *
 * ```javascript
 * let pt = mxUtils.convertPoint(graph.container,
 *   mxEvent.getClientX(evt), mxEvent.getClientY(evt));
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
 * Returns the stylename in a style of the form [(stylename|key=value);] or
 * an empty string if the given style does not contain a stylename.
 *
 * @param style String of the form [(stylename|key=value);].
 */
 export const getStylename = (style: string) => {
  const pairs = style.split(';');
  const stylename = pairs[0];

  if (stylename.indexOf('=') < 0) {
    return stylename;
  }

  return '';
};

/**
 * Returns the stylenames in a style of the form [(stylename|key=value);]
 * or an empty array if the given style does not contain any stylenames.
 *
 * @param style String of the form [(stylename|key=value);].
 */
export const getStylenames = (style: string) => {
  const result = [];

  const pairs = style.split(';');

  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i].indexOf('=') < 0) {
      result.push(pairs[i]);
    }
  }

  return result;
};

/**
 * Returns the index of the given stylename in the given style. This
 * returns -1 if the given stylename does not occur (as a stylename) in the
 * given style, otherwise it returns the index of the first character.
 */
export const indexOfStylename = (style: string, stylename: string) => {
  const tokens = style.split(';');
  let pos = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] == stylename) {
      return pos;
    }

    pos += tokens[i].length + 1;
  }

  return -1;
};

/**
 * Adds the specified stylename to the given style if it does not already
 * contain the stylename.
 */
export const addStylename = (style: string, stylename: string) => {
  if (indexOfStylename(style, stylename) < 0) {
    if (style == null) {
      style = '';
    } else if (style.length > 0 && style.charAt(style.length - 1) != ';') {
      style += ';';
    }

    style += stylename;
  }

  return style;
};

/**
 * Removes all occurrences of the specified stylename in the given style
 * and returns the updated style. Trailing semicolons are not preserved.
 */
export const removeStylename = (style: string, stylename: string) => {
  const result = [];

  const tokens = style.split(';');

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] != stylename) {
      result.push(tokens[i]);
    }
  }

  return result.join(';');
};

/**
 * Removes all stylenames from the given style and returns the updated
 * style.
 */
export const removeAllStylenames = (style: string) => {
  const result = [];

  const tokens = style.split(';');

  for (let i = 0; i < tokens.length; i += 1) {
    // Keeps the key, value assignments
    if (tokens[i].indexOf('=') >= 0) {
      result.push(tokens[i]);
    }
  }

  return result.join(';');
};

/**
 * Assigns the value for the given key in the styles of the given cells, or
 * removes the key from the styles if the value is null.
 *
 * @param model <Transactions> to execute the transaction in.
 * @param cells Array of {@link Cells} to be updated.
 * @param key Key of the style to be changed.
 * @param value New value for the given key.
 */
export const setCellStyles = (
  model: GraphDataModel,
  cells: CellArray,
  key: string,
  value: any
) => {
  if (cells.length > 0) {
    model.beginUpdate();
    try {
      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];

        if (cell) {
          const style = setStyle(cell.getStyle(), key, value);
          model.setStyle(cell, style);
        }
      }
    } finally {
      model.endUpdate();
    }
  }
};

/**
 * Adds or removes the given key, value pair to the style and returns the
 * new style. If value is null or zero length then the key is removed from
 * the style. This is for cell styles, not for CSS styles.
 *
 * @param style String of the form [(stylename|key=value);].
 * @param key Key of the style to be changed.
 * @param value New value for the given key.
 */
export const setStyle = (style: string | null, key: string, value: any) => {
  const isValue =
    value != null && (typeof value.length === 'undefined' || value.length > 0);

  if (style == null || style.length == 0) {
    if (isValue) {
      style = `${key}=${value};`;
    }
  } else if (style.substring(0, key.length + 1) == `${key}=`) {
    const next = style.indexOf(';');

    if (isValue) {
      style = `${key}=${value}${next < 0 ? ';' : style.substring(next)}`;
    } else {
      style = next < 0 || next == style.length - 1 ? '' : style.substring(next + 1);
    }
  } else {
    const index = style.indexOf(`;${key}=`);

    if (index < 0) {
      if (isValue) {
        const sep = style.charAt(style.length - 1) == ';' ? '' : ';';
        style = `${style + sep + key}=${value};`;
      }
    } else {
      const next = style.indexOf(';', index + 1);

      if (isValue) {
        style = `${style.substring(0, index + 1) + key}=${value}${
          next < 0 ? ';' : style.substring(next)
        }`;
      } else {
        
        style = style.substring(0, index) + (next < 0 ? ';' : style.substring(next));
      }
    }
  }

  return style;
};

/**
 * Sets or toggles the flag bit for the given key in the cell's styles.
 * If value is null then the flag is toggled.
 *
 * Example:
 *
 * ```javascript
 * let cells = graph.getSelectionCells();
 * mxUtils.setCellStyleFlags(graph.model,
 *       cells,
 *       mxConstants.STYLE_FONTSTYLE,
 *       mxConstants.FONT_BOLD);
 * ```
 *
 * Toggles the bold font style.
 *
 * @param model <Transactions> that contains the cells.
 * @param cells Array of {@link Cells} to change the style for.
 * @param key Key of the style to be changed.
 * @param flag Integer for the bit to be changed.
 * @param value Optional boolean value for the flag.
 */
export const setCellStyleFlags = (
  model: GraphDataModel,
  cells: CellArray,
  key: string,
  flag: number,
  value: boolean
) => {
  if (cells.length > 0) {
    model.beginUpdate();
    try {
      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];

        if (cell) {
          const style = setStyleFlag(cell.getStyle(), key, flag, value);
          model.setStyle(cell, style);
        }
      }
    } finally {
      model.endUpdate();
    }
  }
};

/**
 * Sets or removes the given key from the specified style and returns the
 * new style. If value is null then the flag is toggled.
 *
 * @param style String of the form [(stylename|key=value);].
 * @param key Key of the style to be changed.
 * @param flag Integer for the bit to be changed.
 * @param value Optional boolean value for the given flag.
 */
export const setStyleFlag = (
  style: string | null,
  key: string,
  flag: number,
  value: boolean
) => {
  if (style == null || style.length == 0) {
    if (value || value == null) {
      style = `${key}=${flag}`;
    } else {
      style = `${key}=0`;
    }
  } else {
    const index = style.indexOf(`${key}=`);

    if (index < 0) {
      const sep = style.charAt(style.length - 1) == ';' ? '' : ';';

      if (value || value == null) {
        style = `${style + sep + key}=${flag}`;
      } else {
        style = `${style + sep + key}=0`;
      }
    } else {
      const cont = style.indexOf(';', index);
      let tmp = '';

      if (cont < 0) {
        tmp = style.substring(index + key.length + 1);
      } else {
        tmp = style.substring(index + key.length + 1, cont);
      }

      if (value == null) {
        tmp = String(parseInt(tmp) ^ flag);
      } else if (value) {
        tmp = String(parseInt(tmp) | flag);
      } else {
        tmp = String(parseInt(tmp) & ~flag);
      }

      style = `${style.substring(0, index) + key}=${tmp}${
        cont >= 0 ? style.substring(cont) : ''
      }`;
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
 * Returns an {@link Rectangle} with the size (width and height in pixels) of
 * the given string. The string may contain HTML markup. Newlines should be
 * converted to <br> before calling this method. The caller is responsible
 * for sanitizing the HTML markup.
 *
 * Example:
 *
 * ```javascript
 * let label = graph.getLabel(cell).replace(/\n/g, "<br>");
 * let size = graph.getSizeForString(label);
 * ```
 *
 * @param text String whose size should be returned.
 * @param fontSize Integer that specifies the font size in pixels. Default is
 * {@link Constants#DEFAULT_FONTSIZE}.
 * @param fontFamily String that specifies the name of the font family. Default
 * is {@link Constants#DEFAULT_FONTFAMILY}.
 * @param textWidth Optional width for text wrapping.
 * @param fontStyle Optional font style.
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
    if ((fontStyle & FONT.BOLD) === FONT.BOLD) {
      div.style.fontWeight = 'bold';
    }

    if ((fontStyle & FONT.ITALIC) === FONT.ITALIC) {
      div.style.fontStyle = 'italic';
    }

    const txtDecor = [];

    if ((fontStyle & FONT.UNDERLINE) == FONT.UNDERLINE) {
      txtDecor.push('underline');
    }

    if ((fontStyle & FONT.STRIKETHROUGH) == FONT.STRIKETHROUGH) {
      txtDecor.push('line-through');
    }

    if (txtDecor.length > 0) {
      div.style.textDecoration = txtDecor.join(' ');
    }
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
 * Ascending is optional and defaults to true.
 */
 export const sortCells = (cells: CellArray, ascending = true): CellArray => {
  const lookup = new Dictionary<Cell, string[]>();

  cells.sort((o1, o2) => {
    let p1 = lookup.get(o1);

    if (p1 == null) {
      p1 = CellPath.create(o1).split(CellPath.PATH_SEPARATOR);
      lookup.put(o1, p1);
    }

    let p2 = lookup.get(o2);

    if (p2 == null) {
      p2 = CellPath.create(o2).split(CellPath.PATH_SEPARATOR);
      lookup.put(o2, p2);
    }

    const comp = CellPath.compare(p1, p2);

    return comp == 0 ? 0 : comp > 0 == ascending ? 1 : -1;
  });

  return cells;
};

/**
 * Returns an {@link Point} that represents the horizontal and vertical alignment
 * for numeric computations. X is -0.5 for center, -1 for right and 0 for
 * left alignment. Y is -0.5 for middle, -1 for bottom and 0 for top
 * alignment. Default values for missing arguments is top, left.
 */
export const getAlignmentAsPoint = (align: string, valign: string) => {
  let dx = -0.5;
  let dy = -0.5;

  // Horizontal alignment
  if (align === ALIGN.LEFT) {
    dx = 0;
  } else if (align === ALIGN.RIGHT) {
    dx = -1;
  }

  // Vertical alignment
  if (valign === ALIGN.TOP) {
    dy = 0;
  } else if (valign === ALIGN.BOTTOM) {
    dy = -1;
  }

  return new Point(dx, dy);
};
