/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { getCurrentStyle } from '../Utils';

/**
 * Maintains the size of a div element in Internet Explorer. This is a
 * workaround for the right and bottom style being ignored in IE.
 *
 * If you need a div to cover the scrollwidth and -height of a document,
 * then you can use this class as follows:
 *
 * @example
 * ```javascript
 * var resizer = new mxDivResizer(background);
 * resizer.getDocumentHeight()
 * {
 *   return document.body.scrollHeight;
 * }
 * resizer.getDocumentWidth()
 * {
 *   return document.body.scrollWidth;
 * }
 * resizer.resize();
 * ```
 *
 * @class mxDivResizer
 */
class mxDivResizer {
  constructor(div, container) {
    if (div.nodeName.toLowerCase() == 'div') {
      if (container == null) {
        container = window;
      }

      this.div = div;
      const style = getCurrentStyle(div);

      if (style != null) {
        this.resizeWidth = style.width == 'auto';
        this.resizeHeight = style.height == 'auto';
      }

      mxEvent.addListener(container, 'resize', evt => {
        if (!this.handlingResize) {
          this.handlingResize = true;
          this.resize();
          this.handlingResize = false;
        }
      });

      this.resize();
    }
  }

  /**
   * Boolean specifying if the width should be updated.
   */
  // resizeWidth: boolean;
  resizeWidth = true;

  /**
   * Boolean specifying if the height should be updated.
   */
  // resizeHeight: boolean;
  resizeHeight = true;

  /**
   * Boolean specifying if the width should be updated.
   */
  // handlingResize: boolean;
  handlingResize = false;

  /**
   * Updates the style of the DIV after the window has been resized.
   */
  // resize(): void;
  resize() {
    const w = this.getDocumentWidth();
    const h = this.getDocumentHeight();

    const l = parseInt(this.div.style.left);
    const r = parseInt(this.div.style.right);
    const t = parseInt(this.div.style.top);
    const b = parseInt(this.div.style.bottom);

    if (
      this.resizeWidth &&
      !isNaN(l) &&
      !isNaN(r) &&
      l >= 0 &&
      r >= 0 &&
      w - r - l > 0
    ) {
      this.div.style.width = `${w - r - l}px`;
    }

    if (
      this.resizeHeight &&
      !isNaN(t) &&
      !isNaN(b) &&
      t >= 0 &&
      b >= 0 &&
      h - t - b > 0
    ) {
      this.div.style.height = `${h - t - b}px`;
    }
  }

  /**
   * Hook for subclassers to return the width of the document (without
   * scrollbars).
   */
  // getDocumentWidth(): number;
  getDocumentWidth() {
    return document.body.clientWidth;
  }

  /**
   * Hook for subclassers to return the height of the document (without
   * scrollbars).
   */
  // getDocumentHeight(): number;
  getDocumentHeight() {
    return document.body.clientHeight;
  }
}

export default mxDivResizer;
