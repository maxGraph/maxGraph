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

import Client from '../../../Client';
import {
  ABSOLUTE_LINE_HEIGHT,
  ALIGN,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DEFAULT_FONTSTYLE,
  DEFAULT_TEXT_DIRECTION,
  DIALECT,
  FONT,
  NONE,
  TEXT_DIRECTION,
  WORD_WRAP,
  LINE_HEIGHT,
} from '../../../util/Constants';
import { getBoundingBox } from '../../../util/mathUtils';
import { getAlignmentAsPoint, matchBinaryMask } from '../../../util/styleUtils';
import Point from '../Point';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import Shape from '../Shape';
import Rectangle from '../Rectangle';
import CellState from '../../cell/CellState';
import { htmlEntities, replaceTrailingNewlines, trim } from '../../../util/StringUtils';
import { isNode } from '../../../util/domUtils';
import {
  AlignValue,
  ColorValue,
  OverflowValue,
  TextDirectionValue,
  VAlignValue,
} from '../../../types';
import SvgCanvas2D from '../../canvas/SvgCanvas2D';

/**
 * Extends {@link Shape} to implement a text shape.
 *
 * To change vertical text from "bottom to top" to "top to bottom", the following code can be used:
 * ```javascript
 * TextShape.prototype.verticalTextRotation = 90;
 * ```
 *
 * @category Vertex Shapes
 */
class TextShape extends Shape {
  constructor(
    value: string | HTMLElement | SVGGElement,
    bounds: Rectangle,
    align: AlignValue = ALIGN.CENTER,
    valign: VAlignValue = ALIGN.MIDDLE,
    color = 'black',
    family = DEFAULT_FONTFAMILY,
    size = DEFAULT_FONTSIZE,
    fontStyle = DEFAULT_FONTSTYLE,
    spacing = 2,
    spacingTop = 0,
    spacingRight = 0,
    spacingBottom = 0,
    spacingLeft = 0,
    horizontal = true,
    background = NONE,
    border = NONE,
    wrap = false,
    clipped = false,
    overflow: OverflowValue = 'visible',
    labelPadding = 0,
    textDirection: TextDirectionValue = DEFAULT_TEXT_DIRECTION
  ) {
    super();

    this.value = value;
    this.bounds = bounds;
    this.color = color ?? 'black';
    this.align = align ?? ALIGN.CENTER;
    this.valign = valign ?? ALIGN.MIDDLE;
    this.family = family ?? DEFAULT_FONTFAMILY;
    this.size = size ?? DEFAULT_FONTSIZE;
    this.fontStyle = fontStyle ?? DEFAULT_FONTSTYLE;
    this.spacing = spacing ?? 2;
    this.spacingTop = this.spacing + (spacingTop ?? 0);
    this.spacingRight = this.spacing + (spacingRight ?? 0);
    this.spacingBottom = this.spacing + (spacingBottom ?? 0);
    this.spacingLeft = this.spacing + (spacingLeft ?? 0);
    this.horizontal = horizontal ?? true;
    this.background = background;
    this.border = border;
    this.wrap = wrap ?? false;
    this.clipped = clipped ?? false;
    this.overflow = overflow ?? 'visible';
    this.labelPadding = labelPadding ?? 0;
    this.textDirection = textDirection;
    this.rotation = 0;

    this.updateMargin();
  }

  value: string | HTMLElement | SVGGElement;
  bounds: Rectangle;
  align: AlignValue;
  valign: VAlignValue;
  color: ColorValue;
  family: string;
  size: number;
  fontStyle: number;
  spacing: number;
  spacingTop: number;
  spacingRight: number;
  spacingBottom: number;
  spacingLeft: number;
  horizontal: boolean;
  background: ColorValue;
  border: ColorValue;
  wrap: boolean;
  clipped: boolean;
  overflow: OverflowValue;
  labelPadding: number;
  textDirection: TextDirectionValue;
  margin: Point | null = null;
  unrotatedBoundingBox: Rectangle | null = null;
  flipH = false;
  flipV = false;

  /**
   * Specifies the spacing to be added to the top spacing. Default is 0. Use the
   * value 5 here to get the same label positions as in mxGraph 1.x.
   */
  baseSpacingTop = 0;

  /**
   * Specifies the spacing to be added to the bottom spacing. Default is 0. Use the
   * value 1 here to get the same label positions as in mxGraph 1.x.
   */
  baseSpacingBottom = 0;

  /**
   * Specifies the spacing to be added to the left spacing. Default is 0.
   */
  baseSpacingLeft = 0;

  /**
   * Specifies the spacing to be added to the right spacing. Default is 0.
   */
  baseSpacingRight = 0;

  /**
   * Specifies if linefeeds in HTML labels should be replaced with BR tags.
   * Default is true.
   */
  replaceLinefeeds = true;

  /**
   * Rotation for vertical text. Default is -90 (bottom to top).
   */
  verticalTextRotation = -90;

  /**
   * Specifies if the string size should be measured in <updateBoundingBox> if
   * the label is clipped and the label position is center and middle. If this is
   * true, then the bounding box will be set to <bounds>. Default is true.
   * <ignoreStringSize> has precedence over this switch.
   */
  ignoreClippedStringSize = true;

  /**
   * Specifies if the actual string size should be measured. If disabled the
   * boundingBox will not ignore the actual size of the string, otherwise
   * <bounds> will be used instead. Default is false.
   */
  ignoreStringSize = false;

  /**
   * Contains the last rendered text value. Used for caching.
   */
  lastValue: string | HTMLElement | SVGGElement | null = null;

  /**
   * Specifies if caching for HTML labels should be enabled. Default is true.
   */
  cacheEnabled = true;

  /**
   * Disables offset in IE9 for crisper image output.
   */
  getSvgScreenOffset() {
    return 0;
  }

  /**
   * Returns true if the bounds are not null and all of its variables are numeric.
   */
  checkBounds() {
    return (
      !isNaN(this.scale) &&
      isFinite(this.scale) &&
      this.scale > 0 &&
      this.bounds &&
      !isNaN(this.bounds.x) &&
      !isNaN(this.bounds.y) &&
      !isNaN(this.bounds.width) &&
      !isNaN(this.bounds.height)
    );
  }

  /**
   * Generic rendering code.
   */
  paint(c: AbstractCanvas2D, update = false): void {
    // Scale is passed-through to canvas
    const s = this.scale;
    const x = this.bounds.x / s;
    const y = this.bounds.y / s;
    const w = this.bounds.width / s;
    const h = this.bounds.height / s;

    this.updateTransform(c, x, y, w, h);
    this.configureCanvas(c, x, y, w, h);

    if (update) {
      c.updateText(
        x,
        y,
        w,
        h,
        this.align,
        this.valign,
        this.wrap,
        this.overflow,
        this.clipped,
        this.getTextRotation(),
        this.node
      );
    } else {
      // Checks if text contains HTML markup
      const realHtml = isNode(this.value) || this.dialect === DIALECT.STRICTHTML;

      // Always renders labels as HTML in VML
      const fmt = realHtml ? 'html' : '';
      let val = this.value as string;

      if (!realHtml && fmt === 'html') {
        // @ts-ignore
        val = htmlEntities(val, false);
      }

      if (fmt === 'html' && !isNode(this.value)) {
        val = replaceTrailingNewlines(val, '<div><br></div>');
      }

      // Handles trailing newlines to make sure they are visible in rendering output
      val =
        !isNode(this.value) && this.replaceLinefeeds && fmt === 'html'
          ? replaceLineFeedsForInnerHtml(<string>val)
          : val;

      let dir: TextDirectionValue = this.textDirection;

      if (dir === TEXT_DIRECTION.AUTO && !realHtml) {
        dir = this.getAutoDirection();
      }

      if (dir !== TEXT_DIRECTION.LTR && dir !== TEXT_DIRECTION.RTL) {
        dir = TEXT_DIRECTION.DEFAULT;
      }

      c.text(
        x,
        y,
        w,
        h,
        val,
        this.align,
        this.valign,
        this.wrap,
        fmt,
        this.overflow,
        this.clipped,
        this.getTextRotation(),
        dir
      );
    }
  }

  /**
   * Renders the text using the given DOM nodes.
   */
  redraw(): void {
    if (
      this.visible &&
      this.checkBounds() &&
      this.cacheEnabled &&
      this.lastValue === this.value &&
      (isNode(this.value) || this.dialect === DIALECT.STRICTHTML)
    ) {
      if (this.node.nodeName === 'DIV') {
        this.redrawHtmlShape();
        this.updateBoundingBox();
      } else {
        const canvas = this.createCanvas();

        if (canvas) {
          // Specifies if events should be handled
          canvas.pointerEvents = this.pointerEvents;

          this.paint(canvas, true);
          this.destroyCanvas(canvas);
          this.updateBoundingBox();
        }
      }
    } else {
      super.redraw();

      if (isNode(this.value) || this.dialect === DIALECT.STRICTHTML) {
        this.lastValue = this.value;
      } else {
        this.lastValue = null;
      }
    }
  }

  /**
   * Resets all styles.
   */
  resetStyles(): void {
    super.resetStyles();

    this.color = 'black';
    this.align = ALIGN.CENTER;
    this.valign = ALIGN.MIDDLE;
    this.family = DEFAULT_FONTFAMILY;
    this.size = DEFAULT_FONTSIZE;
    this.fontStyle = DEFAULT_FONTSTYLE;
    this.spacing = 2;
    this.spacingTop = 2;
    this.spacingRight = 2;
    this.spacingBottom = 2;
    this.spacingLeft = 2;
    this.horizontal = true;
    this.background = NONE;
    this.border = NONE;
    this.textDirection = DEFAULT_TEXT_DIRECTION;
    this.margin = null;
  }

  /**
   * Extends mxShape to update the text styles.
   *
   * @param state <CellState> of the corresponding cell.
   */
  apply(state: CellState): void {
    const old = this.spacing;
    super.apply(state);

    if (this.style) {
      this.fontStyle = this.style.fontStyle ?? this.fontStyle;
      this.family = this.style.fontFamily ?? this.family;
      this.size = this.style.fontSize ?? this.size;
      this.color = this.style.fontColor ?? this.color;
      this.align = this.style.align ?? this.align;
      this.valign = this.style.verticalAlign ?? this.valign;
      this.spacing = this.style.spacing ?? this.spacing;
      this.spacingTop = (this.style.spacingTop ?? this.spacingTop - old) + this.spacing;
      this.spacingRight =
        (this.style.spacingRight ?? this.spacingRight - old) + this.spacing;
      this.spacingBottom =
        (this.style.spacingBottom ?? this.spacingBottom - old) + this.spacing;
      this.spacingLeft =
        (this.style.spacingLeft ?? this.spacingLeft - old) + this.spacing;
      this.horizontal = this.style.horizontal ?? this.horizontal;
      this.background = this.style.labelBackgroundColor ?? this.background;
      this.border = this.style.labelBorderColor ?? this.border;
      this.textDirection = this.style.textDirection ?? DEFAULT_TEXT_DIRECTION;
      this.opacity = this.style.textOpacity ?? 100;

      this.updateMargin();
    }

    this.flipV = false;
    this.flipH = false;
  }

  /**
   * Used to determine the automatic text direction. Returns
   * {@link Constants#TEXT_DIRECTION_LTR} or {@link Constants#TEXT_DIRECTION_RTL}
   * depending on the contents of <value>. This is not invoked for HTML, wrapped
   * content or if <value> is a DOM node.
   */
  getAutoDirection() {
    // Looks for strong (directional) characters
    const tmp =
      /[A-Za-z\u05d0-\u065f\u066a-\u06ef\u06fa-\u07ff\ufb1d-\ufdff\ufe70-\ufefc]/.exec(
        String(this.value)
      );

    // Returns the direction defined by the character
    return tmp && tmp.length > 0 && tmp[0] > 'z'
      ? TEXT_DIRECTION.RTL
      : TEXT_DIRECTION.LTR;
  }

  /**
   * Returns the node that contains the rendered input.
   */
  getContentNode() {
    let result = this.node;

    if (result) {
      // Rendered with no foreignObject
      if (!result.ownerSVGElement) {
        // @ts-ignore
        result = this.node.firstChild.firstChild;
      } else {
        // Innermost DIV that contains the actual content
        // @ts-ignore
        result = result.firstChild.firstChild.firstChild.firstChild.firstChild;
      }
    }

    return result;
  }

  /**
   * Updates the <boundingBox> for this shape using the given node and position.
   */
  updateBoundingBox() {
    let { node } = this;
    this.boundingBox = this.bounds.clone();
    const rot = this.getTextRotation();

    const h = this.style?.labelPosition ?? ALIGN.CENTER;
    const v = this.style?.verticalLabelPosition ?? ALIGN.MIDDLE;

    if (
      !this.ignoreStringSize &&
      node &&
      this.overflow !== 'fill' &&
      (!this.clipped ||
        !this.ignoreClippedStringSize ||
        h !== ALIGN.CENTER ||
        v !== ALIGN.MIDDLE)
    ) {
      let ow = null;
      let oh = null;

      if (
        node.firstChild &&
        node.firstChild.firstChild &&
        node.firstChild.firstChild.nodeName === 'foreignObject'
      ) {
        // Uses second inner DIV for font metrics
        // @ts-ignore
        node = node.firstChild.firstChild.firstChild.firstChild;
        // @ts-ignore
        oh = node.offsetHeight * this.scale;

        if (this.overflow === 'width') {
          ow = this.boundingBox.width;
        } else {
          // @ts-ignore
          ow = node.offsetWidth * this.scale;
        }
      } else {
        try {
          const b = node.getBBox();

          // Workaround for bounding box of empty string
          if (typeof this.value === 'string' && trim(this.value)?.length === 0) {
            this.boundingBox = null;
          } else if (b.width === 0 && b.height === 0) {
            this.boundingBox = null;
          } else {
            this.boundingBox = new Rectangle(b.x, b.y, b.width, b.height);
          }

          return;
        } catch (e) {
          // Ignores NS_ERROR_FAILURE in FF if container display is none.
        }
      }

      if (ow && oh) {
        this.boundingBox = new Rectangle(this.bounds.x, this.bounds.y, ow, oh);
      }
    }

    if (this.boundingBox) {
      const margin = <Rectangle>this.margin;

      if (rot !== 0) {
        // Accounts for pre-rotated x and y
        const bbox = <Rectangle>(
          getBoundingBox(
            new Rectangle(
              margin.x * this.boundingBox.width,
              margin.y * this.boundingBox.height,
              this.boundingBox.width,
              this.boundingBox.height
            ),
            rot,
            new Point(0, 0)
          )
        );

        this.unrotatedBoundingBox = Rectangle.fromRectangle(this.boundingBox);
        this.unrotatedBoundingBox.x += margin.x * this.unrotatedBoundingBox.width;
        this.unrotatedBoundingBox.y += margin.y * this.unrotatedBoundingBox.height;

        this.boundingBox.x += bbox.x;
        this.boundingBox.y += bbox.y;
        this.boundingBox.width = bbox.width;
        this.boundingBox.height = bbox.height;
      } else {
        this.boundingBox.x += margin.x * this.boundingBox.width;
        this.boundingBox.y += margin.y * this.boundingBox.height;
        this.unrotatedBoundingBox = null;
      }
    }
  }

  /**
   * Returns 0 to avoid using rotation in the canvas via updateTransform.
   */
  getShapeRotation() {
    return 0;
  }

  /**
   * Returns the rotation for the text label of the corresponding shape.
   */
  getTextRotation() {
    return this.state && this.state.shape ? this.state.shape.getTextRotation() : 0;
  }

  /**
   * Inverts the bounds if {@link Shape#isBoundsInverted} returns true or if the
   * horizontal style is false.
   */
  isPaintBoundsInverted() {
    return !this.horizontal && !!this.state && this.state.cell.isVertex();
  }

  /**
   * Sets the state of the canvas for drawing the shape.
   */
  configureCanvas(c: AbstractCanvas2D, x: number, y: number, w: number, h: number): void {
    super.configureCanvas(c, x, y, w, h);

    c.setFontColor(this.color);
    c.setFontBackgroundColor(this.background);
    c.setFontBorderColor(this.border);
    c.setFontFamily(this.family);
    c.setFontSize(this.size);
    c.setFontStyle(this.fontStyle);
  }

  /**
   * Private helper function to create SVG elements
   */
  getHtmlValue() {
    let val = this.value as string;

    if (this.dialect !== DIALECT.STRICTHTML) {
      // @ts-ignore
      val = htmlEntities(val, false);
    }

    // Handles trailing newlines to make sure they are visible in rendering output
    val = replaceTrailingNewlines(val, '<div><br></div>');
    val = this.replaceLinefeeds ? replaceLineFeedsForInnerHtml(val) : val;

    return val;
  }

  /**
   * Private helper function to create SVG elements
   */
  getTextCss() {
    const lh = ABSOLUTE_LINE_HEIGHT ? `${this.size * LINE_HEIGHT}px` : LINE_HEIGHT;

    let css =
      `display: inline-block; font-size: ${this.size}px; ` +
      `font-family: ${this.family}; color: ${
        this.color
      }; line-height: ${lh}; pointer-events: ${this.pointerEvents ? 'all' : 'none'}; `;

    matchBinaryMask(this.fontStyle, FONT.BOLD) && (css += 'font-weight: bold; ');
    matchBinaryMask(this.fontStyle, FONT.ITALIC) && (css += 'font-style: italic; ');

    const txtDecor = [];
    matchBinaryMask(this.fontStyle, FONT.UNDERLINE) && txtDecor.push('underline');
    matchBinaryMask(this.fontStyle, FONT.STRIKETHROUGH) && txtDecor.push('line-through');
    txtDecor.length > 0 && (css += `text-decoration: ${txtDecor.join(' ')}; `);

    return css;
  }

  /**
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  redrawHtmlShape() {
    const w = Math.max(0, Math.round(this.bounds.width / this.scale));
    const h = Math.max(0, Math.round(this.bounds.height / this.scale));
    const flex =
      `position: absolute; left: ${Math.round(this.bounds.x)}px; ` +
      `top: ${Math.round(this.bounds.y)}px; pointer-events: none; `;
    const block = this.getTextCss();
    const margin = <Point>this.margin;
    const node = this.node;

    SvgCanvas2D.createCss(
      w + 2,
      h,
      this.align,
      this.valign,
      this.wrap,
      this.overflow,
      this.clipped,
      this.background !== NONE ? htmlEntities(this.background, true) : null,
      this.border !== NONE ? htmlEntities(this.border, true) : null,
      flex,
      block,
      this.scale,
      (
        dx: number,
        dy: number,
        flex: string,
        item: string,
        block: string,
        ofl: string
      ) => {
        const r = this.getTextRotation();
        let tr =
          (this.scale !== 1 ? `scale(${this.scale}) ` : '') +
          (r !== 0 ? `rotate(${r}deg) ` : '') +
          (margin.x !== 0 || margin.y !== 0
            ? `translate(${margin.x * 100}%,${margin.y * 100}%)`
            : '');

        if (tr !== '') {
          tr = `transform-origin: 0 0; transform: ${tr}; `;
        }

        if (ofl === '') {
          flex += item;
          item = `display:inline-block; min-width: 100%; ${tr}`;
        } else {
          item += tr;

          if (Client.IS_SF) {
            item += '-webkit-clip-path: content-box;';
          }
        }

        if (this.opacity < 100) {
          block += `opacity: ${<number>this.opacity / 100}; `;
        }

        node.setAttribute('style', flex);

        const html = isNode(this.value)
          ? // @ts-ignore
            this.value.outerHTML
          : this.getHtmlValue();

        if (!node.firstChild) {
          node.innerHTML = `<div><div>${html}</div></div>`;
        }

        // @ts-ignore
        node.firstChild.firstChild.setAttribute('style', block);
        // @ts-ignore
        node.firstChild.setAttribute('style', item);
      }
    );
  }

  /**
   * Sets the inner HTML of the given element to the <value>.
   */
  updateInnerHtml(elt: HTMLElement) {
    if (isNode(this.value)) {
      // @ts-ignore
      elt.innerHTML = this.value.outerHTML;
    } else {
      let val = this.value as string;

      if (this.dialect !== DIALECT.STRICTHTML) {
        // LATER: Can be cached in updateValue
        val = htmlEntities(val, false);
      }

      // Handles trailing newlines to make sure they are visible in rendering output
      val = replaceTrailingNewlines(val, '<div>&nbsp;</div>');
      val = this.replaceLinefeeds ? replaceLineFeedsForInnerHtml(val) : val;
      val = `<div style="display:inline-block;_display:inline;">${val}</div>`;

      elt.innerHTML = val;
    }
  }

  /**
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  updateValue() {
    const node = this.node;

    if (isNode(this.value)) {
      node.innerHTML = '';
      node.appendChild(<HTMLElement | SVGGElement>this.value);
    } else {
      let val = this.value as string;

      if (this.dialect !== DIALECT.STRICTHTML) {
        val = htmlEntities(val, false);
      }

      // Handles trailing newlines to make sure they are visible in rendering output
      val = replaceTrailingNewlines(val, '<div><br></div>');
      val = this.replaceLinefeeds ? replaceLineFeedsForInnerHtml(val) : val;
      const bg = this.background !== NONE ? this.background : null;
      const bd = this.border !== NONE ? this.border : null;

      if (this.overflow === 'fill' || this.overflow === 'width') {
        if (bg) {
          node.style.backgroundColor = bg;
        }

        if (bd) {
          node.style.border = `1px solid ${bd}`;
        }
      } else {
        let css = '';

        if (bg) {
          css += `background-color:${htmlEntities(bg, true)};`;
        }

        if (bd) {
          css += `border:1px solid ${htmlEntities(bd, true)};`;
        }

        // Wrapper DIV for background, zoom needed for inline in quirks
        // and to measure wrapped font sizes in all browsers
        // FIXME: Background size in quirks mode for wrapped text
        const lh = ABSOLUTE_LINE_HEIGHT ? `${this.size * LINE_HEIGHT}px` : LINE_HEIGHT;
        val =
          `<div style="zoom:1;${css}display:inline-block;_display:inline;text-decoration:inherit;` +
          `padding-bottom:1px;padding-right:1px;line-height:${lh}">${val}</div>`;
      }

      node.innerHTML = val;

      // Sets text direction
      const divs = node.getElementsByTagName('div');

      if (divs.length > 0) {
        let dir = this.textDirection;

        if (dir === TEXT_DIRECTION.AUTO && this.dialect !== DIALECT.STRICTHTML) {
          dir = this.getAutoDirection();
        }

        if (dir === TEXT_DIRECTION.LTR || dir === TEXT_DIRECTION.RTL) {
          divs[divs.length - 1].setAttribute('dir', dir);
        } else {
          divs[divs.length - 1].removeAttribute('dir');
        }
      }
    }
  }

  /**
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  updateFont(node: HTMLElement | SVGGElement) {
    const { style } = node;

    // @ts-ignore
    style.lineHeight = ABSOLUTE_LINE_HEIGHT
      ? `${this.size * LINE_HEIGHT}px`
      : LINE_HEIGHT;
    style.fontSize = `${this.size}px`;
    style.fontFamily = this.family;
    style.verticalAlign = 'top';
    style.color = this.color;

    matchBinaryMask(this.fontStyle, FONT.BOLD)
      ? (style.fontWeight = 'bold')
      : (style.fontWeight = '');

    matchBinaryMask(this.fontStyle, FONT.ITALIC)
      ? (style.fontStyle = 'italic')
      : (style.fontStyle = '');

    const txtDecor = [];
    matchBinaryMask(this.fontStyle, FONT.UNDERLINE) && txtDecor.push('underline');
    matchBinaryMask(this.fontStyle, FONT.STRIKETHROUGH) && txtDecor.push('line-through');
    txtDecor.length > 0 && (style.textDecoration = txtDecor.join(' '));

    if (this.align === ALIGN.CENTER) {
      style.textAlign = 'center';
    } else if (this.align === ALIGN.RIGHT) {
      style.textAlign = 'right';
    } else {
      style.textAlign = 'left';
    }
  }

  /**
   * Updates the HTML node(s) to reflect the latest bounds and scale.
   */
  updateSize(node: HTMLElement, enableWrap = false) {
    const w = Math.max(0, Math.round(this.bounds.width / this.scale));
    const h = Math.max(0, Math.round(this.bounds.height / this.scale));
    const { style } = node;

    // NOTE: Do not use maxWidth here because wrapping will
    // go wrong if the cell is outside of the viewable area
    if (this.clipped) {
      style.overflow = 'hidden';

      style.maxHeight = `${h}px`;
      style.maxWidth = `${w}px`;
    } else if (this.overflow === 'fill') {
      style.width = `${w + 1}px`;
      style.height = `${h + 1}px`;
      style.overflow = 'hidden';
    } else if (this.overflow === 'width') {
      style.width = `${w + 1}px`;
      style.maxHeight = `${h + 1}px`;
      style.overflow = 'hidden';
    }

    if (this.wrap && w > 0) {
      style.wordWrap = WORD_WRAP;
      style.whiteSpace = 'normal';
      style.width = `${w}px`;

      if (enableWrap && this.overflow !== 'fill' && this.overflow !== 'width') {
        let sizeDiv = node;

        if (sizeDiv.firstChild != null && sizeDiv.firstChild.nodeName === 'DIV') {
          // @ts-ignore
          sizeDiv = sizeDiv.firstChild;

          if (node.style.wordWrap === 'break-word') {
            sizeDiv.style.width = '100%';
          }
        }

        let tmp = sizeDiv.offsetWidth;

        // Workaround for text measuring in hidden containers
        if (tmp === 0) {
          const prev = <HTMLElement>node.parentNode;
          node.style.visibility = 'hidden';
          document.body.appendChild(node);
          tmp = sizeDiv.offsetWidth;
          node.style.visibility = '';
          prev.appendChild(node);
        }

        tmp += 3;

        if (this.clipped) {
          tmp = Math.min(tmp, w);
        }

        style.width = `${tmp}px`;
      }
    } else {
      style.whiteSpace = 'nowrap';
    }
  }

  /**
   * Returns the spacing as an {@link Point}.
   */
  updateMargin() {
    this.margin = getAlignmentAsPoint(this.align, this.valign);
  }

  /**
   * Returns the spacing as an {@link Point}.
   */
  getSpacing() {
    let dx = 0;
    let dy = 0;

    if (this.align === ALIGN.CENTER) {
      dx = (this.spacingLeft - this.spacingRight) / 2;
    } else if (this.align === ALIGN.RIGHT) {
      dx = -this.spacingRight - this.baseSpacingRight;
    } else {
      dx = this.spacingLeft + this.baseSpacingLeft;
    }

    if (this.valign === ALIGN.MIDDLE) {
      dy = (this.spacingTop - this.spacingBottom) / 2;
    } else if (this.valign === ALIGN.BOTTOM) {
      dy = -this.spacingBottom - this.baseSpacingBottom;
    } else {
      dy = this.spacingTop + this.baseSpacingTop;
    }

    return new Point(dx, dy);
  }
}

// TODO use a shared utils function
function replaceLineFeedsForInnerHtml(input: string): string {
  return input.replace(/\n/g, '<br>');
}

export default TextShape;
