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

import { isNullish, matchBinaryMask } from '../../internal/utils';
import { mod } from '../../util/mathUtils';
import { getAlignmentAsPoint } from '../../util/styleUtils';
import Client from '../../Client';
import {
  ABSOLUTE_LINE_HEIGHT,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  FONT_STYLE_FLAG,
  LINE_HEIGHT,
  NONE,
  NS_SVG,
  NS_XLINK,
  WORD_WRAP,
} from '../../util/Constants';
import Rectangle from '../geometry/Rectangle';
import AbstractCanvas2D from './AbstractCanvas2D';
import { getXml } from '../../util/xmlUtils';
import { isNode, write } from '../../util/domUtils';
import { htmlEntities, trim } from '../../util/StringUtils';
import {
  AlignValue,
  ColorValue,
  DirectionValue,
  Gradient,
  GradientMap,
  OverflowValue,
  TextDirectionValue,
  VAlignValue,
} from '../../types';

// Activates workaround for gradient ID resolution if base tag is used.
const useAbsoluteIds =
  typeof DOMParser === 'function' &&
  !Client.IS_CHROMEAPP &&
  !Client.IS_EDGE &&
  document.getElementsByTagName('base').length > 0;

/**
 * Extends {@link AbstractCanvas2D} to implement a canvas for SVG.
 * This canvas writes all calls as SVG output to the given SVG root node.
 *
 * ```javascript
 * const svgDoc = mxUtils.createXmlDocument();
 * const root = (svgDoc.createElementNS != null) ?
 * 		svgDoc.createElementNS(mxConstants.NS_SVG, 'svg') : svgDoc.createElement('svg');
 *
 * if (svgDoc.createElementNS == null) {
 *   root.setAttribute('xmlns', constants.NS_SVG);
 *   root.setAttribute('xmlns:xlink', constants.NS_XLINK);
 * } else {
 *   root.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', constants.NS_XLINK);
 * }
 *
 * var bounds = graph.getGraphBounds();
 * root.setAttribute('width', (bounds.x + bounds.width + 4) + 'px');
 * root.setAttribute('height', (bounds.y + bounds.height + 4) + 'px');
 * root.setAttribute('version', '1.1');
 *
 * svgDoc.appendChild(root);
 *
 * var svgCanvas = new mxSvgCanvas2D(root);
 * ```
 *
 *
 * To disable anti-aliasing in the output, use the following code.
 * ```javascript
 * graph.view.canvas.ownerSVGElement.setAttribute('shape-rendering', 'crispEdges');
 * ```
 * Or set the respective attribute in the SVG element directly.
 */
class SvgCanvas2D extends AbstractCanvas2D {
  constructor(root: SVGElement, styleEnabled: boolean) {
    super();

    /**
     * Reference to the container for the SVG content.
     */
    this.root = root;

    /**
     * Local cache of gradients for quick lookups.
     */
    this.gradients = {};

    /**
     * Reference to the defs section of the SVG document. Only for export.
     */
    this.defs = null;

    /**
     * Stores the value of styleEnabled passed to the constructor.
     */
    this.styleEnabled = styleEnabled != null ? styleEnabled : false;

    let svg = null;

    // Adds optional defs section for export
    if (root.ownerDocument !== document) {
      let node: HTMLElement | SVGElement | null = root;

      // Finds owner SVG element in XML DOM
      while (node && node.nodeName !== 'svg') {
        node = node.parentElement;
      }

      svg = node;
    }

    if (svg) {
      // Tries to get existing defs section
      const tmp = svg.getElementsByTagName('defs');

      if (tmp.length > 0) {
        this.defs = svg.getElementsByTagName('defs')[0];
      }

      // Adds defs section if none exists
      if (!this.defs) {
        this.defs = this.createElement('defs') as SVGDefsElement;

        if (svg.firstChild != null) {
          svg.insertBefore(this.defs, svg.firstChild);
        } else {
          svg.appendChild(this.defs);
        }
      }

      // Adds stylesheet
      if (this.styleEnabled) {
        this.defs.appendChild(this.createStyle());
      }
    }
  }

  root: SVGElement | null;

  gradients: GradientMap;

  defs: SVGDefsElement | null = null;

  styleEnabled = true;

  /**
   * Holds the current DOM node.
   */
  node: SVGElement | null = null;

  /**
   * Specifies if plain text output should match the vertical HTML alignment.
   * @default true.
   */
  matchHtmlAlignment = true;

  /**
   * Specifies if text output should be enabled.
   * @default true
   */
  textEnabled = true;

  /**
   * Specifies if use of foreignObject for HTML markup is allowed.
   * @default true
   */
  foEnabled = true;

  /**
   * Specifies the fallback text for unsupported foreignObjects in exported documents.
   * If this is set to `null` then no fallback text is added to the exported document.
   * @default [Object]
   */
  foAltText = '[Object]';

  /**
   * Offset to be used for foreignObjects.
   * @default 0
   */
  foOffset = 0;

  /**
   * Offset to be used for text elements.
   * @default 0
   */
  textOffset = 0;

  /**
   * Offset to be used for image elements.
   * @default 0
   */
  imageOffset = 0;

  /**
   * Adds transparent paths for strokes.
   * @default 0
   */
  strokeTolerance = 0;

  /**
   * Minimum stroke width for output.
   * @default 1
   */
  minStrokeWidth = 1;

  /**
   * Local counter for references in SVG export.
   * @default 0
   */
  refCount = 0;

  /**
   * Correction factor for {@link LINE_HEIGHT} in HTML output.
   * @default 1
   */
  lineHeightCorrection = 1;

  /**
   * Default value for active pointer events.
   * @default all
   */
  pointerEventsValue = 'all';

  /**
   * Padding to be added for text that is not wrapped to account for differences in font metrics on different platforms in pixels.
   * @default 10.
   */
  fontMetricsPadding = 10;

  /**
   * Specifies if offsetWidth and offsetHeight should be cached. This is used to speed up repaint of text in {@link updateText}.
   * @default true
   */
  cacheOffsetSize = true;

  originalRoot: SVGElement | null = null;

  /**
   * Updates existing DOM nodes for text rendering.
   */
  static createCss = (
    w: number,
    h: number,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    overflow: string,
    clip: boolean,
    bg: ColorValue | null,
    border: ColorValue | null,
    flex: string,
    block: string,
    scale: number,
    callback: (
      dx: number,
      dy: number,
      flex: string,
      item: string,
      block: string,
      ofl: string
    ) => void
  ) => {
    let item = `box-sizing: border-box; font-size: 0; text-align: ${
      align === 'left' ? 'left' : align === 'right' ? 'right' : 'center'
    }; `;
    const pt = getAlignmentAsPoint(align, valign);
    let ofl = 'overflow: hidden; ';
    let fw = 'width: 1px; ';
    let fh = 'height: 1px; ';
    let dx = pt.x * w;
    let dy = pt.y * h;

    if (clip) {
      fw = `width: ${Math.round(w)}px; `;
      item += `max-height: ${Math.round(h)}px; `;
      dy = 0;
    } else if (overflow === 'fill') {
      fw = `width: ${Math.round(w)}px; `;
      fh = `height: ${Math.round(h)}px; `;
      block += 'width: 100%; height: 100%; ';
      item += fw + fh;
    } else if (overflow === 'width') {
      fw = `width: ${Math.round(w)}px; `;
      block += 'width: 100%; ';
      item += fw;
      dy = 0;

      if (h > 0) {
        item += `max-height: ${Math.round(h)}px; `;
      }
    } else {
      ofl = '';
      dy = 0;
    }

    let bgc = '';

    if (bg) {
      bgc += `background-color: ${bg}; `;
    }

    if (border) {
      bgc += `border: 1px solid ${border}; `;
    }

    if (ofl == '' || clip) {
      block += bgc;
    } else {
      item += bgc;
    }

    if (wrap && w > 0) {
      block += `white-space: normal; word-wrap: ${WORD_WRAP}; `;
      fw = `width: ${Math.round(w)}px; `;

      if (ofl !== '' && overflow !== 'fill') {
        dy = 0;
      }
    } else {
      block += 'white-space: nowrap; ';

      if (ofl === '') {
        dx = 0;
      }
    }

    callback(dx, dy, flex + fw + fh, item + ofl, block, ofl);
  };

  /**
   * Rounds all numbers to 2 decimal points.
   */
  format(value: number) {
    return parseFloat(value.toFixed(2));
  }

  /**
   * Returns the URL of the page without the hash part. This needs to use href to
   * include any search part with no params (ie question mark alone). This is a
   * workaround for the fact that window.location.search is empty if there is
   * no search string behind the question mark.
   */
  getBaseUrl() {
    let { href } = window.location;
    const hash = href.lastIndexOf('#');

    if (hash > 0) {
      href = href.substring(0, hash);
    }

    return href;
  }

  /**
   * Returns any offsets for rendering pixels.
   */
  reset() {
    super.reset();
    this.gradients = {};
  }

  end(): void {
    return;
  }

  /**
   * Creates the optional style section.
   */
  createStyle() {
    const style = this.createElement('style');
    style.setAttribute('type', 'text/css');
    write(
      style,
      `svg{font-family:${DEFAULT_FONTFAMILY};font-size:${DEFAULT_FONTSIZE};fill:none;stroke-miterlimit:10}`
    );
    return style;
  }

  /**
   * Private helper function to create SVG elements
   */
  createElement(tagName: string, namespace?: string) {
    return this.root?.ownerDocument.createElementNS(
      namespace || NS_SVG,
      tagName
    ) as SVGElement;
  }

  /**
   * Returns the alternate text string for the given foreignObject.
   */
  getAlternateText(
    fo: SVGForeignObjectElement,
    x: number,
    y: number,
    w: number,
    h: number,
    str: Element | string,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    format: string,
    overflow: OverflowValue,
    clip: boolean,
    rotation: number
  ) {
    return !isNullish(str) ? this.foAltText : null;
  }

  /**
   * Returns the alternate content for the given foreignObject.
   */
  createAlternateContent(
    fo: SVGForeignObjectElement,
    x: number,
    y: number,
    w: number,
    h: number,
    str: string,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    format: string,
    overflow: OverflowValue,
    clip: boolean,
    rotation: number
  ) {
    const text = this.getAlternateText(
      fo,
      x,
      y,
      w,
      h,
      str,
      align,
      valign,
      wrap,
      format,
      overflow,
      clip,
      rotation
    );
    const s = this.state;

    if (!isNullish(text) && s.fontSize > 0) {
      const dy = valign === 'top' ? 1 : valign === 'bottom' ? 0 : 0.3;
      const anchor = align === 'right' ? 'end' : align === 'left' ? 'start' : 'middle';

      const alt = this.createElement('text');
      alt.setAttribute('x', String(Math.round(x + s.dx)));
      alt.setAttribute('y', String(Math.round(y + s.dy + dy * s.fontSize)));
      alt.setAttribute('fill', s.fontColor || 'black');
      alt.setAttribute('font-family', s.fontFamily);
      alt.setAttribute('font-size', `${Math.round(s.fontSize)}px`);

      // Text-anchor start is default in SVG
      anchor !== 'start' && alt.setAttribute('text-anchor', anchor);
      const fontStyle = s.fontStyle;
      matchBinaryMask(fontStyle, FONT_STYLE_FLAG.BOLD) &&
        alt.setAttribute('font-weight', 'bold');
      matchBinaryMask(fontStyle, FONT_STYLE_FLAG.ITALIC) &&
        alt.setAttribute('font-style', 'italic');

      const txtDecor = [];
      matchBinaryMask(fontStyle, FONT_STYLE_FLAG.UNDERLINE) && txtDecor.push('underline');
      matchBinaryMask(fontStyle, FONT_STYLE_FLAG.STRIKETHROUGH) &&
        txtDecor.push('line-through');
      txtDecor.length > 0 && alt.setAttribute('text-decoration', txtDecor.join(' '));

      write(alt, <string>text);
      return alt;
    }
    return null;
  }

  /**
   * Private helper function to create SVG elements
   */
  createGradientId(
    start: string,
    end: string,
    alpha1: number,
    alpha2: number,
    direction: DirectionValue
  ) {
    // Removes illegal characters from gradient ID
    if (start.charAt(0) === '#') {
      start = start.substring(1);
    }

    if (end.charAt(0) === '#') {
      end = end.substring(1);
    }

    // Workaround for gradient IDs not working in Safari 5 / Chrome 6
    // if they contain uppercase characters
    start = `${start.toLowerCase()}-${alpha1}`;
    end = `${end.toLowerCase()}-${alpha2}`;

    // Wrong gradient directions possible?
    let dir = null;

    if (direction == null || direction === 'south') {
      dir = 's';
    } else if (direction === 'east') {
      dir = 'e';
    } else {
      const tmp = start;
      start = end;
      end = tmp;

      if (direction === 'north') {
        dir = 's';
      } else if (direction === 'west') {
        dir = 'e';
      }
    }

    return `mx-gradient-${start}-${end}-${dir}`;
  }

  /**
   * Private helper function to create SVG elements
   */
  getSvgGradient(
    start: string,
    end: string,
    alpha1: number,
    alpha2: number,
    direction: DirectionValue
  ) {
    const id = this.createGradientId(start, end, alpha1, alpha2, direction);
    let gradient: Gradient | null = this.gradients[id];

    if (!gradient) {
      const svg = this.root!.ownerSVGElement;

      let counter = 0;
      let tmpId = `${id}-${counter}`;

      if (svg) {
        gradient = <Gradient>(<unknown>svg.ownerDocument.getElementById(tmpId));

        while (gradient && gradient.ownerSVGElement !== svg) {
          tmpId = `${id}-${counter++}`;
          gradient = <Gradient>(<unknown>svg.ownerDocument.getElementById(tmpId));
        }
      } else {
        // Uses shorter IDs for export
        tmpId = `id${++this.refCount}`;
      }

      if (!gradient) {
        gradient = this.createSvgGradient(start, end, alpha1, alpha2, direction);
        gradient.setAttribute('id', tmpId);

        if (this.defs) {
          this.defs.appendChild(gradient);
        } else if (svg) {
          svg.appendChild(gradient);
        }
      }

      this.gradients[id] = gradient;
    }

    return gradient.getAttribute('id');
  }

  /**
   * Creates the given SVG gradient.
   */
  createSvgGradient(
    start: string,
    end: string,
    alpha1: number,
    alpha2: number,
    direction: DirectionValue
  ) {
    const gradient = <Gradient>this.createElement('linearGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '0%');

    if (direction == null || direction === 'south') {
      gradient.setAttribute('y2', '100%');
    } else if (direction === 'east') {
      gradient.setAttribute('x2', '100%');
    } else if (direction === 'north') {
      gradient.setAttribute('y1', '100%');
    } else if (direction === 'west') {
      gradient.setAttribute('x1', '100%');
    }

    let op = alpha1 < 1 ? `;stop-opacity:${alpha1}` : '';

    let stop = this.createElement('stop');
    stop.setAttribute('offset', '0%');
    stop.setAttribute('style', `stop-color:${start}${op}`);
    gradient.appendChild(stop);

    op = alpha2 < 1 ? `;stop-opacity:${alpha2}` : '';

    stop = this.createElement('stop');
    stop.setAttribute('offset', '100%');
    stop.setAttribute('style', `stop-color:${end}${op}`);
    gradient.appendChild(stop);

    return gradient;
  }

  /**
   * Private helper function to create SVG elements
   */
  addNode(filled: boolean, stroked: boolean) {
    const { node } = this;
    const s = this.state;

    if (node) {
      if (node.nodeName === 'path') {
        // Checks if the path is not empty
        if (this.path && this.path.length > 0) {
          node.setAttribute('d', this.path.join(' '));
        } else {
          return;
        }
      }

      if (filled && s.fillColor !== NONE) {
        this.updateFill();
      } else if (!this.styleEnabled) {
        // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=814952
        if (node.nodeName === 'ellipse' && Client.IS_FF) {
          node.setAttribute('fill', 'transparent');
        } else {
          node.setAttribute('fill', NONE);
        }

        // Sets the actual filled state for stroke tolerance
        filled = false;
      }

      if (stroked && s.strokeColor !== NONE) {
        this.updateStroke();
      } else if (!this.styleEnabled) {
        node.setAttribute('stroke', NONE);
      }

      if (s.transform && s.transform.length > 0) {
        node.setAttribute('transform', s.transform);
      }

      if (s.shadow) {
        this.root!.appendChild(this.createShadow(node));
      }

      // Adds stroke tolerance
      if (this.strokeTolerance > 0 && !filled) {
        this.root!.appendChild(this.createTolerance(node));
      }

      // Adds pointer events
      if (this.pointerEvents) {
        node.setAttribute('pointer-events', this.pointerEventsValue);
      }
      // Enables clicks for nodes inside a link element
      else if (!this.pointerEvents && !this.originalRoot) {
        node.setAttribute('pointer-events', NONE);
      }

      // Removes invisible nodes from output if they don't handle events
      if (
        (node.nodeName !== 'rect' &&
          node.nodeName !== 'path' &&
          node.nodeName !== 'ellipse') ||
        (node.getAttribute('fill') !== NONE &&
          node.getAttribute('fill') !== 'transparent') ||
        node.getAttribute('stroke') !== NONE ||
        node.getAttribute('pointer-events') !== NONE
      ) {
        // LATER: Update existing DOM for performance
        this.root!.appendChild(node);
      }

      this.node = null;
    }
  }

  /**
   * Transfers the stroke attributes from <state> to <node>.
   */
  updateFill() {
    const s = this.state;

    if (s.alpha < 1 || s.fillAlpha < 1) {
      this.node!.setAttribute('fill-opacity', String(s.alpha * s.fillAlpha));
    }

    if (s.fillColor !== NONE) {
      if (s.gradientColor !== NONE) {
        const id = this.getSvgGradient(
          s.fillColor,
          s.gradientColor,
          s.gradientFillAlpha,
          s.gradientAlpha,
          s.gradientDirection
        );

        if (this.root?.ownerDocument === document && useAbsoluteIds) {
          // Workaround for no fill with base tag in page (escape brackets)
          const base = this.getBaseUrl().replace(/([()])/g, '\\$1');
          this.node!.setAttribute('fill', `url(${base}#${id})`);
        } else {
          this.node!.setAttribute('fill', `url(#${id})`);
        }
      } else {
        this.node!.setAttribute('fill', s.fillColor.toLowerCase());
      }
    }
  }

  /**
   * Returns the current stroke width (>= 1), ie. max(1, this.format(this.state.strokeWidth * this.state.scale)).
   */
  getCurrentStrokeWidth() {
    return Math.max(
      this.minStrokeWidth,
      Math.max(0.01, this.format(this.state.strokeWidth * this.state.scale))
    );
  }

  /**
   * Transfers the stroke attributes from {@link mxAbstractCanvas2D.state} to {@link node}.
   */
  updateStroke() {
    const s = this.state;

    if (s.strokeColor && s.strokeColor !== NONE) {
      this.node!.setAttribute('stroke', s.strokeColor.toLowerCase());
    }

    if (s.alpha < 1 || s.strokeAlpha < 1) {
      this.node!.setAttribute('stroke-opacity', String(s.alpha * s.strokeAlpha));
    }

    const sw = this.getCurrentStrokeWidth();
    if (sw !== 1) {
      this.node!.setAttribute('stroke-width', String(sw));
    }

    if (this.node!.nodeName === 'path') {
      this.updateStrokeAttributes();
    }

    if (s.dashed) {
      this.node!.setAttribute(
        'stroke-dasharray',
        this.createDashPattern((s.fixDash ? 1 : s.strokeWidth) * s.scale)
      );
    }
  }

  /**
   * Transfers the stroke attributes from {@link mxAbstractCanvas2D.state} to {@link node}.
   */
  updateStrokeAttributes() {
    const s = this.state;

    // Linejoin miter is default in SVG
    if (s.lineJoin && s.lineJoin !== 'miter') {
      this.node!.setAttribute('stroke-linejoin', s.lineJoin);
    }

    if (s.lineCap) {
      // flat is called butt in SVG
      let value = s.lineCap;

      if (value === 'flat') {
        value = 'butt';
      }

      // Linecap butt is default in SVG
      if (value !== 'butt') {
        this.node!.setAttribute('stroke-linecap', value);
      }
    }

    // Miterlimit 10 is default in our document
    if (s.miterLimit != null && (!this.styleEnabled || s.miterLimit !== 10)) {
      this.node!.setAttribute('stroke-miterlimit', String(s.miterLimit));
    }
  }

  /**
   * Creates the SVG dash pattern for the given state.
   */
  createDashPattern(scale: number) {
    const pat = [];

    if (typeof this.state.dashPattern === 'string') {
      const dash = this.state.dashPattern.split(' ');

      if (dash.length > 0) {
        for (let i = 0; i < dash.length; i += 1) {
          pat[i] = Number(dash[i]) * scale;
        }
      }
    }

    return pat.join(' ');
  }

  /**
   * Creates a hit detection tolerance shape for the given node.
   */
  createTolerance(node: SVGElement) {
    const tol = node.cloneNode(true) as SVGElement;
    const sw = parseFloat(tol.getAttribute('stroke-width') || '1') + this.strokeTolerance;
    tol.setAttribute('pointer-events', 'stroke');
    tol.setAttribute('visibility', 'hidden');
    tol.removeAttribute('stroke-dasharray');
    tol.setAttribute('stroke-width', String(sw));
    tol.setAttribute('fill', 'none');
    tol.setAttribute('stroke', 'white');
    return tol;
  }

  /**
   * Creates a shadow for the given node.
   */
  createShadow(node: SVGElement) {
    const shadow = node.cloneNode(true) as SVGElement;
    const s = this.state;

    // Firefox uses transparent for no fill in ellipses
    if (
      shadow.getAttribute('fill') !== 'none' &&
      (!Client.IS_FF || shadow.getAttribute('fill') !== 'transparent')
    ) {
      shadow.setAttribute('fill', s.shadowColor);
    }

    if (
      shadow.getAttribute('stroke') !== 'none' &&
      s.shadowColor &&
      s.shadowColor !== NONE
    ) {
      shadow.setAttribute('stroke', s.shadowColor);
    }

    shadow.setAttribute(
      'transform',
      `translate(${this.format(s.shadowDx * s.scale)},${this.format(
        s.shadowDy * s.scale
      )})${s.transform || ''}`
    );
    shadow.setAttribute('opacity', String(s.shadowAlpha));

    return shadow;
  }

  /**
   * Experimental implementation for hyperlinks.
   */
  setLink(link: string) {
    if (!link) {
      this.root = this.originalRoot;
    } else {
      this.originalRoot = this.root;

      const node = this.createElement('a');

      // Workaround for implicit namespace handling in HTML5 export, IE adds NS1 namespace so use code below
      // in all IE versions except quirks mode. KNOWN: Adds xlink namespace to each image tag in output.
      if (node.setAttributeNS == null || this.root!.ownerDocument !== document) {
        node.setAttribute('xlink:href', link);
      } else {
        node.setAttributeNS(NS_XLINK, 'xlink:href', link);
      }

      this.root!.appendChild(node);
      this.root = node;
    }
  }

  /**
   * Sets the rotation of the canvas. Note that rotation cannot be concatenated.
   */
  rotate(theta: number, flipH: boolean, flipV: boolean, cx: number, cy: number) {
    if (theta !== 0 || flipH || flipV) {
      const s = this.state;
      cx += s.dx;
      cy += s.dy;

      cx *= s.scale;
      cy *= s.scale;

      s.transform = s.transform || '';

      // This implementation uses custom scale/translate and built-in rotation
      // Rotation state is part of the AffineTransform in state.transform
      if (flipH && flipV) {
        theta += 180;
      } else if (flipH !== flipV) {
        const tx = flipH ? cx : 0;
        const sx = flipH ? -1 : 1;

        const ty = flipV ? cy : 0;
        const sy = flipV ? -1 : 1;

        s.transform +=
          `translate(${this.format(tx)},${this.format(ty)})` +
          `scale(${this.format(sx)},${this.format(sy)})` +
          `translate(${this.format(-tx)},${this.format(-ty)})`;
      }

      if (flipH ? !flipV : flipV) {
        theta *= -1;
      }

      if (theta !== 0) {
        s.transform += `rotate(${this.format(theta)},${this.format(cx)},${this.format(
          cy
        )})`;
      }

      s.rotation += theta;
      s.rotationCx = cx;
      s.rotationCy = cy;
    }
  }

  /**
   * Extends superclass to create path.
   */
  begin() {
    super.begin();
    this.node = this.createElement('path');
  }

  /**
   * Private helper function to create SVG elements
   */
  rect(x: number, y: number, w: number, h: number) {
    const s = this.state;
    const n = this.createElement('rect');
    n.setAttribute('x', String(this.format((x + s.dx) * s.scale)));
    n.setAttribute('y', String(this.format((y + s.dy) * s.scale)));
    n.setAttribute('width', String(this.format(w * s.scale)));
    n.setAttribute('height', String(this.format(h * s.scale)));

    this.node = n;
  }

  /**
   * Private helper function to create SVG elements
   */
  roundrect(x: number, y: number, w: number, h: number, dx: number, dy: number) {
    this.rect(x, y, w, h);

    if (dx > 0) {
      this.node!.setAttribute('rx', String(this.format(dx * this.state.scale)));
    }

    if (dy > 0) {
      this.node!.setAttribute('ry', String(this.format(dy * this.state.scale)));
    }
  }

  /**
   * Private helper function to create SVG elements
   */
  ellipse(x: number, y: number, w: number, h: number) {
    const s = this.state;
    const n = this.createElement('ellipse');
    // No rounding for consistent output with 1.x
    n.setAttribute('cx', String(this.format((x + w / 2 + s.dx) * s.scale)));
    n.setAttribute('cy', String(this.format((y + h / 2 + s.dy) * s.scale)));
    n.setAttribute('rx', String((w / 2) * s.scale));
    n.setAttribute('ry', String((h / 2) * s.scale));
    this.node = n;
  }

  /**
   * Private helper function to create SVG elements
   */
  image(
    x: number,
    y: number,
    w: number,
    h: number,
    src: string,
    aspect = true,
    flipH = false,
    flipV = false
  ) {
    src = this.converter.convert(src);

    const s = this.state;
    x += s.dx;
    y += s.dy;

    const node = this.createElement('image');
    node.setAttribute('x', String(this.format(x * s.scale) + this.imageOffset));
    node.setAttribute('y', String(this.format(y * s.scale) + this.imageOffset));
    node.setAttribute('width', String(this.format(w * s.scale)));
    node.setAttribute('height', String(this.format(h * s.scale)));

    // Workaround for missing namespace support
    if (!node.setAttributeNS) {
      node.setAttribute('xlink:href', src);
    } else {
      node.setAttributeNS(NS_XLINK, 'xlink:href', src);
    }

    if (!aspect) {
      node.setAttribute('preserveAspectRatio', 'none');
    }

    if (s.alpha < 1 || s.fillAlpha < 1) {
      node.setAttribute('opacity', String(s.alpha * s.fillAlpha));
    }

    let tr = this.state.transform || '';

    if (flipH || flipV) {
      let sx = 1;
      let sy = 1;
      let dx = 0;
      let dy = 0;

      if (flipH) {
        sx = -1;
        dx = -w - 2 * x;
      }

      if (flipV) {
        sy = -1;
        dy = -h - 2 * y;
      }

      // Adds image transformation to existing transform
      tr += `scale(${sx},${sy})translate(${dx * s.scale},${dy * s.scale})`;
    }

    if (tr.length > 0) {
      node.setAttribute('transform', tr);
    }

    if (!this.pointerEvents) {
      node.setAttribute('pointer-events', 'none');
    }

    this.root!.appendChild(node);
  }

  /**
   * Converts the given HTML string to XHTML.
   */
  convertHtml(val: string) {
    const doc = new DOMParser().parseFromString(val, 'text/html');

    if (doc != null) {
      val = new XMLSerializer().serializeToString(doc.body);

      // Extracts body content from DOM
      if (val.substring(0, 5) === '<body') {
        val = val.substring(val.indexOf('>', 5) + 1);
      }

      if (val.substring(val.length - 7, val.length) === '</body>') {
        val = val.substring(0, val.length - 7);
      }
    }

    return val;
  }

  /**
   * Private helper function to create SVG elements
   * Note: signature changed in mxgraph 4.1.0
   */
  createDiv(str: string | HTMLElement) {
    let val = str;

    if (!isNode(val)) {
      val = `<div><div>${this.convertHtml(val as string)}</div></div>`;
    }

    if (document.createElementNS) {
      const div = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');

      if (isNode(val)) {
        const n = val as HTMLElement;

        const div2 = document.createElement('div');
        const div3 = div2.cloneNode(false);

        // Creates a copy for export
        if (this.root!.ownerDocument !== document) {
          div2.appendChild(n.cloneNode(true));
        } else {
          div2.appendChild(n);
        }

        div3.appendChild(div2);
        div.appendChild(div3);
      } else {
        div.innerHTML = val as string;
      }

      return div;
    }
    if (isNode(val)) {
      val = `<div><div>${getXml(<Element>val)}</div></div>`;
    }

    val = `<div xmlns="http://www.w3.org/1999/xhtml">${val}</div>`;

    // NOTE: FF 3.6 crashes if content CSS contains "height:100%"
    return new DOMParser().parseFromString(val, 'text/xml').documentElement;
  }

  /**
   * Updates existing DOM nodes for text rendering. LATER: Merge common parts with text function below.
   */
  updateText(
    x: number,
    y: number,
    w: number,
    h: number,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    overflow: OverflowValue,
    clip: boolean,
    rotation: number,
    node: SVGElement
  ) {
    if (node && node.firstChild && node.firstChild.firstChild) {
      this.updateTextNodes(
        x,
        y,
        w,
        h,
        align,
        valign,
        wrap,
        overflow,
        clip,
        rotation,
        node.firstChild as SVGElement
      );
    }
  }

  /**
   * Creates a foreignObject for the given string and adds it to the given root.
   */
  addForeignObject(
    x: number,
    y: number,
    w: number,
    h: number,
    str: string,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    format: string,
    overflow: OverflowValue,
    clip: boolean,
    rotation: number,
    dir: TextDirectionValue,
    div: HTMLElement,
    root: SVGElement
  ) {
    const group = this.createElement('g');
    const fo = this.createElement('foreignObject') as SVGForeignObjectElement;

    // Workarounds for print clipping and static position in Safari
    fo.setAttribute('style', 'overflow: visible; text-align: left;');
    fo.setAttribute('pointer-events', 'none');

    fo.appendChild(div);
    group.appendChild(fo);

    this.updateTextNodes(
      x,
      y,
      w,
      h,
      align,
      valign,
      wrap,
      overflow,
      clip,
      rotation,
      group
    );

    // Alternate content if foreignObject not supported
    if (this.root?.ownerDocument !== document) {
      const alt = this.createAlternateContent(
        fo,
        x,
        y,
        w,
        h,
        str,
        align,
        valign,
        wrap,
        format,
        overflow,
        clip,
        rotation
      );

      if (alt != null) {
        fo.setAttribute(
          'requiredFeatures',
          'http://www.w3.org/TR/SVG11/feature#Extensibility'
        );
        const sw = this.createElement('switch');
        sw.appendChild(fo);
        sw.appendChild(alt);
        group.appendChild(sw);
      }
    }

    root.appendChild(group);
  }

  /**
   * Updates existing DOM nodes for text rendering.
   */
  updateTextNodes(
    x: number,
    y: number,
    w: number,
    h: number,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    overflow: OverflowValue,
    clip: boolean,
    rotation: number,
    g: SVGElement
  ) {
    const s = this.state.scale;

    SvgCanvas2D.createCss(
      w + 2,
      h,
      align,
      valign,
      wrap,
      overflow,
      clip,
      this.state.fontBackgroundColor != null ? this.state.fontBackgroundColor : null,
      this.state.fontBorderColor != null ? this.state.fontBorderColor : null,
      `display: flex; align-items: unsafe ${
        valign === 'top' ? 'flex-start' : valign === 'bottom' ? 'flex-end' : 'center'
      }; ` +
        `justify-content: unsafe ${
          align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
        }; `,
      this.getTextCss(),
      s,
      (dx, dy, flex, item, block) => {
        x += this.state.dx;
        y += this.state.dy;

        const fo = g.firstChild as SVGElement;
        const div = fo.firstChild as SVGElement;
        const box = div.firstChild as SVGElement;
        const text = box.firstChild as SVGElement;
        const r =
          (this.rotateHtml ? this.state.rotation : 0) + (rotation != null ? rotation : 0);
        let t =
          (this.foOffset !== 0 ? `translate(${this.foOffset} ${this.foOffset})` : '') +
          (s !== 1 ? `scale(${s})` : '');

        text.setAttribute('style', block);
        box.setAttribute('style', item);

        // Workaround for clipping in Webkit with scrolling and zoom
        fo.setAttribute('width', `${Math.ceil((1 / Math.min(1, s)) * 100)}%`);
        fo.setAttribute('height', `${Math.ceil((1 / Math.min(1, s)) * 100)}%`);
        const yp = Math.round(y + dy);

        // Allows for negative values which are causing problems with
        // transformed content where the top edge of the foreignObject
        // limits the text box being moved further up in the diagram.
        // KNOWN: Possible clipping problems with zoom and scrolling
        // but this is normally not used with scrollbars as the
        // coordinates are always positive with scrollbars.
        // Margin-top is ignored in Safari and no negative values allowed
        // for padding.
        if (yp < 0) {
          fo.setAttribute('y', String(yp));
        } else {
          fo.removeAttribute('y');
          flex += `padding-top: ${yp}px; `;
        }

        div.setAttribute('style', `${flex}margin-left: ${Math.round(x + dx)}px;`);
        t += r !== 0 ? `rotate(${r} ${x} ${y})` : '';

        // Output allows for reflow but Safari cannot use absolute position,
        // transforms or opacity. https://bugs.webkit.org/show_bug.cgi?id=23113
        if (t !== '') {
          g.setAttribute('transform', t);
        } else {
          g.removeAttribute('transform');
        }

        if (this.state.alpha !== 1) {
          g.setAttribute('opacity', String(this.state.alpha));
        } else {
          g.removeAttribute('opacity');
        }
      }
    );
  }

  /**
   * Private helper function to create SVG elements
   */
  getTextCss() {
    const s = this.state;
    const lh = ABSOLUTE_LINE_HEIGHT
      ? `${s.fontSize * LINE_HEIGHT}px`
      : LINE_HEIGHT * this.lineHeightCorrection;
    let css =
      `display: inline-block; font-size: ${s.fontSize}px; ` +
      `font-family: ${s.fontFamily}; color: ${
        s.fontColor
      }; line-height: ${lh}; pointer-events: ${
        this.pointerEvents ? this.pointerEventsValue : 'none'
      }; `;

    const fontStyle = s.fontStyle;
    matchBinaryMask(fontStyle, FONT_STYLE_FLAG.BOLD) && (css += 'font-weight: bold; ');
    matchBinaryMask(fontStyle, FONT_STYLE_FLAG.ITALIC) && (css += 'font-style: italic; ');

    const txtDecor = [];
    matchBinaryMask(fontStyle, FONT_STYLE_FLAG.UNDERLINE) && txtDecor.push('underline');
    matchBinaryMask(fontStyle, FONT_STYLE_FLAG.STRIKETHROUGH) &&
      txtDecor.push('line-through');
    txtDecor.length > 0 && (css += `text-decoration: ${txtDecor.join(' ')}; `);

    return css;
  }

  /**
   * Paints the given text. Possible values for format are empty string for plain
   * text and html for HTML markup. Note that HTML markup is only supported if
   * foreignObject is supported and <foEnabled> is true. (This means IE9 and later
   * does currently not support HTML text as part of shapes.)
   */
  text(
    x: number,
    y: number,
    w: number,
    h: number,
    str: string,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    format: string,
    overflow: OverflowValue,
    clip: boolean,
    rotation = 0,
    dir: TextDirectionValue
  ) {
    if (this.textEnabled && str != null) {
      rotation = rotation != null ? rotation : 0;

      if (this.foEnabled && format === 'html') {
        const div = this.createDiv(str);

        // Ignores invalid XHTML labels
        if (div != null) {
          if (dir != null) {
            div.setAttribute('dir', dir);
          }

          this.addForeignObject(
            x,
            y,
            w,
            h,
            str,
            align,
            valign,
            wrap,
            format,
            overflow,
            clip,
            rotation,
            dir,
            div,
            this.root!
          );
        }
      } else {
        this.plainText(
          x + this.state.dx,
          y + this.state.dy,
          w,
          h,
          str,
          align,
          valign,
          wrap,
          overflow,
          clip,
          rotation,
          dir
        );
      }
    }
  }

  /**
   * Creates a clip for the given coordinates.
   */
  createClip(x: number, y: number, w: number, h: number) {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);

    const id = `mx-clip-${x}-${y}-${w}-${h}`;

    let counter = 0;
    let tmp = `${id}-${counter}`;

    // Resolves ID conflicts
    while (document.getElementById(tmp) != null) {
      tmp = `${id}-${++counter}`;
    }

    const clip = this.createElement('clipPath');
    clip.setAttribute('id', tmp);

    const rect = this.createElement('rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(h));

    clip.appendChild(rect);

    return clip;
  }

  /**
   * Paints the given text. Possible values for format are empty string for
   * plain text and html for HTML markup.
   */
  plainText(
    x: number,
    y: number,
    w: number,
    h: number,
    str: string,
    align: AlignValue,
    valign: VAlignValue,
    wrap: boolean,
    overflow: OverflowValue,
    clip: boolean,
    rotation = 0,
    dir: TextDirectionValue
  ) {
    const s = this.state;
    const size = s.fontSize;
    const node = this.createElement('g');
    let tr = s.transform || '';
    this.updateFont(node);

    // Ignores pointer events
    if (!this.pointerEvents && this.originalRoot == null) {
      node.setAttribute('pointer-events', 'none');
    }

    // Non-rotated text
    if (rotation !== 0) {
      tr += `rotate(${rotation},${this.format(x * s.scale)},${this.format(y * s.scale)})`;
    }

    if (dir != null) {
      node.setAttribute('direction', dir);
    }

    if (clip && w > 0 && h > 0) {
      let cx = x;
      let cy = y;

      if (align === 'center') {
        cx -= w / 2;
      } else if (align === 'right') {
        cx -= w;
      }

      if (overflow !== 'fill') {
        if (valign === 'middle') {
          cy -= h / 2;
        } else if (valign === 'bottom') {
          cy -= h;
        }
      }

      // LATER: Remove spacing from clip rectangle
      const c = this.createClip(
        cx * s.scale - 2,
        cy * s.scale - 2,
        w * s.scale + 4,
        h * s.scale + 4
      );

      if (this.defs != null) {
        this.defs.appendChild(c);
      } else {
        // Makes sure clip is removed with referencing node
        this.root!.appendChild(c);
      }

      if (
        !Client.IS_CHROMEAPP &&
        !Client.IS_EDGE &&
        this.root!.ownerDocument === document
      ) {
        // Workaround for potential base tag
        const base = this.getBaseUrl().replace(/([()])/g, '\\$1');
        node.setAttribute('clip-path', `url(${base}#${c.getAttribute('id')})`);
      } else {
        node.setAttribute('clip-path', `url(#${c.getAttribute('id')})`);
      }
    }

    // Default is left
    const anchor = align === 'right' ? 'end' : align === 'center' ? 'middle' : 'start';

    // Text-anchor start is default in SVG
    if (anchor !== 'start') {
      node.setAttribute('text-anchor', anchor);
    }

    if (!this.styleEnabled || size !== DEFAULT_FONTSIZE) {
      node.setAttribute('font-size', `${size * s.scale}px`);
    }

    if (tr.length > 0) {
      node.setAttribute('transform', tr);
    }

    if (s.alpha < 1) {
      node.setAttribute('opacity', String(s.alpha));
    }

    const lines = str.split('\n');
    const lh = Math.round(size * LINE_HEIGHT);
    const textHeight = size + (lines.length - 1) * lh;

    let cy = y + size - 1;

    if (valign === 'middle') {
      if (overflow === 'fill') {
        cy -= h / 2;
      } else {
        const dy =
          (this.matchHtmlAlignment && clip && h > 0
            ? Math.min(textHeight, h)
            : textHeight) / 2;
        cy -= dy;
      }
    } else if (valign === 'bottom') {
      if (overflow === 'fill') {
        cy -= h;
      } else {
        const dy =
          this.matchHtmlAlignment && clip && h > 0 ? Math.min(textHeight, h) : textHeight;
        cy -= dy + 1;
      }
    }

    for (let i = 0; i < lines.length; i += 1) {
      const line = trim(lines[i]);

      // Workaround for bounding box of empty lines and spaces
      if (line) {
        const text = this.createElement('text');
        // LATER: Match horizontal HTML alignment
        text.setAttribute('x', String(this.format(x * s.scale) + this.textOffset));
        text.setAttribute('y', String(this.format(cy * s.scale) + this.textOffset));

        write(text, line);
        node.appendChild(text);
      }

      cy += lh;
    }

    this.root!.appendChild(node);
    this.addTextBackground(
      node,
      str,
      x,
      y,
      w,
      overflow === 'fill' ? h : textHeight,
      align,
      valign,
      overflow
    );
  }

  /**
   * Updates the text properties for the given node. (NOTE: For this to work in
   * IE, the given node must be a text or tspan element.)
   */
  updateFont(node: SVGElement) {
    const s = this.state;

    if (s.fontColor && s.fontColor !== NONE) {
      node.setAttribute('fill', s.fontColor);
    }

    if (!this.styleEnabled || s.fontFamily !== DEFAULT_FONTFAMILY) {
      node.setAttribute('font-family', s.fontFamily);
    }

    const fontStyle = s.fontStyle;
    matchBinaryMask(fontStyle, FONT_STYLE_FLAG.BOLD) &&
      node.setAttribute('font-weight', 'bold');
    matchBinaryMask(fontStyle, FONT_STYLE_FLAG.ITALIC) &&
      node.setAttribute('font-style', 'italic');

    const txtDecor = [];
    matchBinaryMask(fontStyle, FONT_STYLE_FLAG.UNDERLINE) && txtDecor.push('underline');
    matchBinaryMask(fontStyle, FONT_STYLE_FLAG.STRIKETHROUGH) &&
      txtDecor.push('line-through');
    txtDecor.length > 0 && node.setAttribute('text-decoration', txtDecor.join(' '));
  }

  /**
   * Background color and border
   */
  addTextBackground(
    node: SVGElement,
    str: string,
    x: number,
    y: number,
    w: number,
    h: number,
    align: AlignValue,
    valign: VAlignValue,
    overflow: OverflowValue
  ) {
    const s = this.state;

    if (s.fontBackgroundColor != null || s.fontBorderColor != null) {
      let bbox = null;

      if (overflow === 'fill' || overflow === 'width') {
        if (align === 'center') {
          x -= w / 2;
        } else if (align === 'right') {
          x -= w;
        }

        if (valign === 'middle') {
          y -= h / 2;
        } else if (valign === 'bottom') {
          y -= h;
        }

        bbox = new Rectangle(
          (x + 1) * s.scale,
          y * s.scale,
          (w - 2) * s.scale,
          (h + 2) * s.scale
        );
        // @ts-ignore check for getBBox
      } else if (node.getBBox != null && this.root.ownerDocument === document) {
        // Uses getBBox only if inside document for correct size
        try {
          // @ts-ignore getBBox exists
          bbox = node.getBBox();
          bbox = new Rectangle(bbox.x, bbox.y + 1, bbox.width, bbox.height + 0);
        } catch (e) {
          // Ignores NS_ERROR_FAILURE in FF if container display is none.
        }
      }

      if (bbox == null || bbox.width === 0 || bbox.height === 0) {
        // Computes size if not in document or no getBBox available
        const div = document.createElement('div');

        // Wrapping and clipping can be ignored here
        div.style.lineHeight = ABSOLUTE_LINE_HEIGHT
          ? `${s.fontSize * LINE_HEIGHT}px`
          : String(LINE_HEIGHT);
        div.style.fontSize = `${s.fontSize}px`;
        div.style.fontFamily = s.fontFamily;
        div.style.whiteSpace = 'nowrap';
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.display = 'inline-block';

        matchBinaryMask(s.fontStyle, FONT_STYLE_FLAG.BOLD) &&
          (div.style.fontWeight = 'bold');
        matchBinaryMask(s.fontStyle, FONT_STYLE_FLAG.ITALIC) &&
          (div.style.fontStyle = 'italic');

        str = htmlEntities(str, false);
        div.innerHTML = str.replace(/\n/g, '<br/>');

        document.body.appendChild(div);
        const w = div.offsetWidth;
        const h = div.offsetHeight;
        document.body.removeChild(div);

        if (align === 'center') {
          x -= w / 2;
        } else if (align === 'right') {
          x -= w;
        }

        if (valign === 'middle') {
          y -= h / 2;
        } else if (valign === 'bottom') {
          y -= h;
        }

        bbox = new Rectangle(
          (x + 1) * s.scale,
          (y + 2) * s.scale,
          w * s.scale,
          (h + 1) * s.scale
        );
      }

      if (bbox != null) {
        const n = this.createElement('rect');
        n.setAttribute('fill', s.fontBackgroundColor || 'none');
        n.setAttribute('stroke', s.fontBorderColor || 'none');
        n.setAttribute('x', String(Math.floor(bbox.x - 1)));
        n.setAttribute('y', String(Math.floor(bbox.y - 1)));
        n.setAttribute('width', String(Math.ceil(bbox.width + 2)));
        n.setAttribute('height', String(Math.ceil(bbox.height)));

        const sw = s.fontBorderColor ? Math.max(1, this.format(s.scale)) : 0;
        n.setAttribute('stroke-width', String(sw));

        // Workaround for crisp rendering - only required if not exporting
        if (this.root?.ownerDocument === document && mod(sw, 2) === 1) {
          n.setAttribute('transform', 'translate(0.5, 0.5)');
        }

        node.insertBefore(n, node.firstChild);
      }
    }
  }

  /**
   * Paints the outline of the current path.
   */
  stroke() {
    this.addNode(false, true);
  }

  /**
   * Fills the current path.
   */
  fill() {
    this.addNode(true, false);
  }

  /**
   * Fills and paints the outline of the current path.
   */
  fillAndStroke() {
    this.addNode(true, true);
  }
}

export default SvgCanvas2D;
