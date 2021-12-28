/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import AbstractCanvas2D from './AbstractCanvas2D';
import {
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  NONE,
  SHADOWCOLOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  SHADOW_OPACITY,
} from '../../util/constants';
import { getOuterHtml, isNode } from '../../util/domUtils';
import { DirectionValue, TextDirectionValue } from '../../types';

/**
 * Base class for all canvases. The following methods make up the public
 * interface of the canvas 2D for all painting in mxGraph:
 *
 * - <save>, <restore>
 * - <scale>, <translate>, <rotate>
 * - <setAlpha>, <setFillAlpha>, <setStrokeAlpha>, <setFillColor>, <setGradient>,
 *   <setStrokeColor>, <setStrokeWidth>, <setDashed>, <setDashPattern>, <setLineCap>,
 *   <setLineJoin>, <setMiterLimit>
 * - <setFontColor>, <setFontBackgroundColor>, <setFontBorderColor>, <setFontSize>,
 *   <setFontFamily>, <setFontStyle>
 * - <setShadow>, <setShadowColor>, <setShadowAlpha>, <setShadowOffset>
 * - <rect>, <roundrect>, <ellipse>, <image>, <text>
 * - <begin>, <moveTo>, <lineTo>, <quadTo>, <curveTo>
 * - <stroke>, <fill>, <fillAndStroke>
 *
 * <AbstractCanvas2D.arcTo> is an additional method for drawing paths. This is
 * a synthetic method, meaning that it is turned into a sequence of curves by
 * default. Subclassers may add native support for arcs.
 *
 * Constructor: D
 *
 * Constructs a new abstract canvas.
 */
class mxXmlCanvas2D extends AbstractCanvas2D {
  constructor(root: SVGElement) {
    super();

    /**
     * Variable: root
     *
     * Reference to the container for the SVG content.
     */
    this.root = root;

    // Writes default settings;
    this.writeDefaults();
  }

  root: SVGElement;

  /**
   * Specifies if text output should be enabled.
   * @default true
   */
  textEnabled: boolean = true;

  /**
   * Specifies if the output should be compressed by removing redundant calls.
   * @default true
   */
  compressed: boolean = true;

  /**
   * Writes the rendering defaults to {@link root}:
   */
  writeDefaults(): void {
    let elem;

    // Writes font defaults
    elem = this.createElement('fontfamily');
    elem.setAttribute('family', DEFAULT_FONTFAMILY);
    this.root.appendChild(elem);

    elem = this.createElement('fontsize');
    elem.setAttribute('size', String(DEFAULT_FONTSIZE));
    this.root.appendChild(elem);

    // Writes shadow defaults
    elem = this.createElement('shadowcolor');
    elem.setAttribute('color', SHADOWCOLOR);
    this.root.appendChild(elem);

    elem = this.createElement('shadowalpha');
    elem.setAttribute('alpha', String(SHADOW_OPACITY));
    this.root.appendChild(elem);

    elem = this.createElement('shadowoffset');
    elem.setAttribute('dx', String(SHADOW_OFFSET_X));
    elem.setAttribute('dy', String(SHADOW_OFFSET_Y));
    this.root.appendChild(elem);
  }

  /**
   * Returns a formatted number with 2 decimal places.
   */
  format(value: string | number): number {
    if (typeof value === 'string') {
      return parseFloat(parseFloat(value).toFixed(2));
    } else {
      return parseFloat(value.toFixed(2));
    }
  }

  /**
   * Creates the given element using the owner document of {@link root}.
   */
  createElement(name: string): Element {
    return this.root.ownerDocument.createElement(name);
  }

  /**
   * Saves the drawing state.
   */
  save(): void {
    if (this.compressed) {
      super.save();
    }
    this.root.appendChild(this.createElement('save'));
  }

  /**
   * Restores the drawing state.
   */
  restore(): void {
    if (this.compressed) {
      super.restore();
    }
    this.root.appendChild(this.createElement('restore'));
  }

  /**
   * Scales the output.
   *
   * @param scale Number that represents the scale where 1 is equal to 100%.
   */
  scale(value: number): void {
    const elem = this.createElement('scale');
    elem.setAttribute('scale', String(value));
    this.root.appendChild(elem);
  }

  /**
   * Translates the output.
   *
   * @param dx Number that specifies the horizontal translation.
   * @param dy Number that specifies the vertical translation.
   */
  translate(dx: number, dy: number): void {
    const elem = this.createElement('translate');
    elem.setAttribute('dx', String(this.format(dx)));
    elem.setAttribute('dy', String(this.format(dy)));
    this.root.appendChild(elem);
  }

  /**
   * Rotates and/or flips the output around a given center. (Note: Due to
   * limitations in VML, the rotation cannot be concatenated.)
   *
   * @param theta Number that represents the angle of the rotation (in degrees).
   * @param flipH Boolean indicating if the output should be flipped horizontally.
   * @param flipV Boolean indicating if the output should be flipped vertically.
   * @param cx Number that represents the x-coordinate of the rotation center.
   * @param cy Number that represents the y-coordinate of the rotation center.
   */
  rotate(theta: number, flipH: boolean, flipV: boolean, cx: number, cy: number): void {
    const elem = this.createElement('rotate');

    if (theta !== 0 || flipH || flipV) {
      elem.setAttribute('theta', String(this.format(theta)));
      elem.setAttribute('flipH', flipH ? '1' : '0');
      elem.setAttribute('flipV', flipV ? '1' : '0');
      elem.setAttribute('cx', String(this.format(cx)));
      elem.setAttribute('cy', String(this.format(cy)));
      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current alpha.
   *
   * @param value Number that represents the new alpha. Possible values are between
   * 1 (opaque) and 0 (transparent).
   */
  setAlpha(value: number): void {
    if (this.compressed) {
      if (this.state.alpha === value) {
        return;
      }
      super.setAlpha(value);
    }

    const elem = this.createElement('alpha');
    elem.setAttribute('alpha', String(this.format(value)));
    this.root.appendChild(elem);
  }

  /**
   * Sets the current fill alpha.
   *
   * @param value Number that represents the new fill alpha. Possible values are between
   * 1 (opaque) and 0 (transparent).
   */
  setFillAlpha(value: number): void {
    if (this.compressed) {
      if (this.state.fillAlpha === value) {
        return;
      }
      super.setFillAlpha(value);
    }

    const elem = this.createElement('fillalpha');
    elem.setAttribute('alpha', String(this.format(value)));
    this.root.appendChild(elem);
  }

  /**
   * Sets the current stroke alpha.
   *
   * @param value Number that represents the new stroke alpha. Possible values are between
   * 1 (opaque) and 0 (transparent).
   */
  setStrokeAlpha(value: number): void {
    if (this.compressed) {
      if (this.state.strokeAlpha === value) {
        return;
      }
      super.setStrokeAlpha(value);
    }

    const elem = this.createElement('strokealpha');
    elem.setAttribute('alpha', String(this.format(value)));
    this.root.appendChild(elem);
  }

  /**
   * Sets the current fill color.
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  setFillColor(value: string | null=null): void {
    if (value === NONE) {
      value = null;
    }

    if (this.compressed) {
      if (this.state.fillColor === value) {
        return;
      }
      super.setFillColor(value);
    }

    const elem = this.createElement('fillcolor');
    elem.setAttribute('color', value != null ? value : NONE);
    this.root.appendChild(elem);
  }

  /**
   * Sets the gradient. Note that the coordinates may be ignored by some implementations.
   *
   * @param color1 Hexadecimal representation of the start color.
   * @param color2 Hexadecimal representation of the end color.
   * @param x X-coordinate of the gradient region.
   * @param y y-coordinate of the gradient region.
   * @param w Width of the gradient region.
   * @param h Height of the gradient region.
   * @param direction One of <mxConstants.DIRECTION_NORTH>, <mxConstants.DIRECTION_EAST>,
   * <mxConstants.DIRECTION_SOUTH> or <mxConstants.DIRECTION_WEST>.
   * @param alpha1 Optional alpha of the start color. Default is 1. Possible values
   * are between 1 (opaque) and 0 (transparent).
   * @param alpha2 Optional alpha of the end color. Default is 1. Possible values
   * are between 1 (opaque) and 0 (transparent).
   */
  setGradient(
    color1: string | null, 
    color2: string | null, 
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    direction: DirectionValue, 
    alpha1: number=1.0, 
    alpha2: number=1.0
  ) {
    if (color1 != null && color2 != null) {
      super.setGradient(color1, color2, x, y, w, h, direction, alpha1, alpha2);

      const elem = this.createElement('gradient');
      elem.setAttribute('c1', color1);
      elem.setAttribute('c2', color2);
      elem.setAttribute('x', String(this.format(x)));
      elem.setAttribute('y', String(this.format(y)));
      elem.setAttribute('w', String(this.format(w)));
      elem.setAttribute('h', String(this.format(h)));

      // Default direction is south
      if (direction != null) {
        elem.setAttribute('direction', direction);
      }

      if (alpha1 != null) {
        elem.setAttribute('alpha1', String(alpha1));
      }

      if (alpha2 != null) {
        elem.setAttribute('alpha2', String(alpha2));
      }

      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current stroke color.
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  setStrokeColor(value: string | null=null): void {
    if (value === NONE) {
      value = null;
    }

    if (this.compressed) {
      if (this.state.strokeColor === value) {
        return;
      }
      super.setStrokeColor(value);
    }

    const elem = this.createElement('strokecolor');
    elem.setAttribute('color', value != null ? value : NONE);
    this.root.appendChild(elem);
  }

  /**
   * Sets the current stroke width.
   *
   * @param value Numeric representation of the stroke width.
   */
  setStrokeWidth(value: number): void {
    if (this.compressed) {
      if (this.state.strokeWidth === value) {
        return;
      }
      super.setStrokeWidth(value);
    }

    const elem = this.createElement('strokewidth');
    elem.setAttribute('width', String(this.format(value)));
    this.root.appendChild(elem);
  }

  /**
   * Enables or disables dashed lines.
   *
   * @param value Boolean that specifies if dashed lines should be enabled.
   * @param value Boolean that specifies if the stroke width should be ignored
   * for the dash pattern.
   * @default false
   */
  setDashed(value: boolean, fixDash: boolean): void {
    if (this.compressed) {
      if (this.state.dashed === value) {
        return;
      }
      super.setDashed(value, fixDash);
    }

    const elem = this.createElement('dashed');
    elem.setAttribute('dashed', value ? '1' : '0');

    if (fixDash != null) {
      elem.setAttribute('fixDash', fixDash ? '1' : '0');
    }

    this.root.appendChild(elem);
  }

  /**
   * Sets the current dash pattern.
   * @default '3 3'
   *
   * @param value String that represents the dash pattern, which is a sequence of
   * numbers defining the length of the dashes and the length of the spaces
   * between the dashes. The lengths are relative to the line width - a length
   * of 1 is equals to the line width.
   */
  setDashPattern(value: string): void {
    if (this.compressed) {
      if (this.state.dashPattern === value) {
        return;
      }
      super.setDashPattern(value);
    }

    const elem = this.createElement('dashpattern');
    elem.setAttribute('pattern', value);
    this.root.appendChild(elem);
  }

  /**
   * Sets the line cap.
   * @default 'flat' which corresponds to 'butt' in SVG
   *
   * @param value String that represents the line cap. Possible values are flat, round
   * and square.
   */
  setLineCap(value: string): void {
    if (this.compressed) {
      if (this.state.lineCap === value) {
        return;
      }
      super.setLineCap(value);
    }

    const elem = this.createElement('linecap');
    elem.setAttribute('cap', value);
    this.root.appendChild(elem);
  }

  /**
   * Sets the line join.
   * @default 'miter'
   *
   * @param value String that represents the line join. Possible values are miter,
   * round and bevel.
   */
  setLineJoin(value: string): void {
    if (this.compressed) {
      if (this.state.lineJoin === value) {
        return;
      }
      super.setLineJoin(value);
    }

    const elem = this.createElement('linejoin');
    elem.setAttribute('join', value);
    this.root.appendChild(elem);
  }

  /**
   * Sets the miter limit.
   * @default 10
   *
   * @param value Number that represents the miter limit.
   */
  setMiterLimit(value: number): void {
    if (this.compressed) {
      if (this.state.miterLimit === value) {
        return;
      }
      super.setMiterLimit(value);
    }

    const elem = this.createElement('miterlimit');
    elem.setAttribute('limit', String(value));
    this.root.appendChild(elem);
  }

  /**
   * Sets the current font color.
   * @default '#000000'
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  setFontColor(value: string | null=null): void {
    if (this.textEnabled) {
      if (value === NONE) {
        value = null;
      }

      if (this.compressed) {
        if (this.state.fontColor === value) {
          return;
        }
        super.setFontColor(value);
      }

      const elem = this.createElement('fontcolor');
      elem.setAttribute('color', value != null ? value : NONE);
      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current font background color.
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  setFontBackgroundColor(value: string | null=null): void {
    if (this.textEnabled) {
      if (value === NONE) {
        value = null;
      }

      if (this.compressed) {
        if (this.state.fontBackgroundColor === value) {
          return;
        }
        super.setFontBackgroundColor(value);
      }

      const elem = this.createElement('fontbackgroundcolor');
      elem.setAttribute('color', value != null ? value : NONE);
      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current font border color.
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  setFontBorderColor(value: string | null=null): void {
    if (this.textEnabled) {
      if (value === NONE) {
        value = null;
      }

      if (this.compressed) {
        if (this.state.fontBorderColor === value) {
          return;
        }
        super.setFontBorderColor(value);
      }

      const elem = this.createElement('fontbordercolor');
      elem.setAttribute('color', value != null ? value : NONE);
      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current font size.
   * @default {@link mxConstants.DEFAULT_FONTSIZE}
   *
   * @param value Numeric representation of the font size.
   */
  setFontSize(value: number): void {
    if (this.textEnabled) {
      if (this.compressed) {
        if (this.state.fontSize === value) {
          return;
        }
        super.setFontSize(value);
      }

      const elem = this.createElement('fontsize');
      elem.setAttribute('size', String(value));
      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current font family.
   * @default {@link mxConstants.DEFAULT_FONTFAMILY}
   *
   * @param value String representation of the font family. This handles the same
   * values as the CSS font-family property.
   */
  setFontFamily(value: string): void {
    if (this.textEnabled) {
      if (this.compressed) {
        if (this.state.fontFamily === value) {
          return;
        }
        super.setFontFamily(value);
      }

      const elem = this.createElement('fontfamily');
      elem.setAttribute('family', value);
      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current font style.
   *
   * @param value Numeric representation of the font family. This is the sum of the
   * font styles from {@link mxConstants}.
   */
  setFontStyle(value: number | null=0): void {
    if (this.textEnabled) {
      if (value == null) {
        value = 0;
      }

      if (this.compressed) {
        if (this.state.fontStyle === value) {
          return;
        }
        super.setFontStyle(value);
      }

      const elem = this.createElement('fontstyle');
      elem.setAttribute('style', String(value));
      this.root.appendChild(elem);
    }
  }

  /**
   * Enables or disables shadows.
   *
   * @param value Boolean that specifies if shadows should be enabled.
   */
  setShadow(value: boolean): void {
    if (this.compressed) {
      if (this.state.shadow === value) {
        return;
      }
      super.setShadow(value);
    }

    const elem = this.createElement('shadow');
    elem.setAttribute('enabled', value ? '1' : '0');
    this.root.appendChild(elem);
  }

  /**
   * Sets the current shadow color. Default {@link mxConstants.SHADOWCOLOR}
   *
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  setShadowColor(value: string | null=null): void {
    if (this.compressed) {
      if (value === NONE) {
        value = null;
      }

      if (this.state.shadowColor === value) {
        return;
      }

      super.setShadowColor(value);
    }

    const elem = this.createElement('shadowcolor');
    elem.setAttribute('color', value != null ? value : NONE);
    this.root.appendChild(elem);
  }

  /**
   * Sets the current shadows alpha. Default is {@link mxConstants.SHADOW_OPACITY}
   *
   * @param value Number that represents the new alpha. Possible values are between 1 (opaque) and 0 (transparent).
   */
  setShadowAlpha(value: number): void {
    if (this.compressed) {
      if (this.state.shadowAlpha === value) {
        return;
      }
      super.setShadowAlpha(value);
    }

    const elem = this.createElement('shadowalpha');
    elem.setAttribute('alpha', String(value));
    this.root.appendChild(elem);
  }

  /**
   * Sets the current shadow offset.
   *
   * @param dx Number that represents the horizontal offset of the shadow.
   * @param dy Number that represents the vertical offset of the shadow.
   */
  setShadowOffset(dx: number, dy: number): void {
    if (this.compressed) {
      if (this.state.shadowDx === dx && this.state.shadowDy === dy) {
        return;
      }
      super.setShadowOffset(dx, dy);
    }

    const elem = this.createElement('shadowoffset');
    elem.setAttribute('dx', String(dx));
    elem.setAttribute('dy', String(dy));
    this.root.appendChild(elem);
  }

  /**
   * Puts a rectangle into the drawing buffer.
   *
   * @param x Number that represents the x-coordinate of the rectangle.
   * @param y Number that represents the y-coordinate of the rectangle.
   * @param w Number that represents the width of the rectangle.
   * @param h Number that represents the height of the rectangle.
   */
  rect(x: number, y: number, w: number, h: number): void {
    const elem = this.createElement('rect');
    elem.setAttribute('x', String(this.format(x)));
    elem.setAttribute('y', String(this.format(y)));
    elem.setAttribute('w', String(this.format(w)));
    elem.setAttribute('h', String(this.format(h)));
    this.root.appendChild(elem);
  }

  /**
   * Puts a rounded rectangle into the drawing buffer.
   *
   * @param x Number that represents the x-coordinate of the rectangle.
   * @param y Number that represents the y-coordinate of the rectangle.
   * @param w Number that represents the width of the rectangle.
   * @param h Number that represents the height of the rectangle.
   * @param dx Number that represents the horizontal rounding.
   * @param dy Number that represents the vertical rounding.
   */
  roundrect(x: number, y: number, w: number, h: number, dx: number, dy: number): void {
    const elem = this.createElement('roundrect');
    elem.setAttribute('x', String(this.format(x)));
    elem.setAttribute('y', String(this.format(y)));
    elem.setAttribute('w', String(this.format(w)));
    elem.setAttribute('h', String(this.format(h)));
    elem.setAttribute('dx', String(this.format(dx)));
    elem.setAttribute('dy', String(this.format(dy)));
    this.root.appendChild(elem);
  }

  /**
   * Puts an ellipse into the drawing buffer.
   *
   * @param x Number that represents the x-coordinate of the ellipse.
   * @param y Number that represents the y-coordinate of the ellipse.
   * @param w Number that represents the width of the ellipse.
   * @param h Number that represents the height of the ellipse.
   */
  ellipse(x: number, y: number, w: number, h: number): void {
    const elem = this.createElement('ellipse');
    elem.setAttribute('x', String(this.format(x)));
    elem.setAttribute('y', String(this.format(y)));
    elem.setAttribute('w', String(this.format(w)));
    elem.setAttribute('h', String(this.format(h)));
    this.root.appendChild(elem);
  }

  /**
   * Paints an image.
   *
   * @param x Number that represents the x-coordinate of the image.
   * @param y Number that represents the y-coordinate of the image.
   * @param w Number that represents the width of the image.
   * @param h Number that represents the height of the image.
   * @param src String that specifies the URL of the image.
   * @param aspect Boolean indicating if the aspect of the image should be preserved.
   * @param flipH Boolean indicating if the image should be flipped horizontally.
   * @param flipV Boolean indicating if the image should be flipped vertically.
   */
  image(
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    src: string, 
    aspect: boolean, 
    flipH: boolean, 
    flipV: boolean
  ) {
    src = this.converter.convert(src);

    // LATER: Add option for embedding images as base64.
    const elem = this.createElement('image');
    elem.setAttribute('x', String(this.format(x)));
    elem.setAttribute('y', String(this.format(y)));
    elem.setAttribute('w', String(this.format(w)));
    elem.setAttribute('h', String(this.format(h)));
    elem.setAttribute('src', src);
    elem.setAttribute('aspect', aspect ? '1' : '0');
    elem.setAttribute('flipH', flipH ? '1' : '0');
    elem.setAttribute('flipV', flipV ? '1' : '0');
    this.root.appendChild(elem);
  }

  /**
   * Starts a new path and puts it into the drawing buffer.
   */
  begin(): void {
    this.root.appendChild(this.createElement('begin'));
    this.lastX = 0;
    this.lastY = 0;
  }

  /**
   * Moves the current path the given point.
   *
   * @param x Number that represents the x-coordinate of the point.
   * @param y Number that represents the y-coordinate of the point.
   */
  moveTo(x: number, y: number): void {
    const elem = this.createElement('move');
    elem.setAttribute('x', String(this.format(x)));
    elem.setAttribute('y', String(this.format(y)));
    this.root.appendChild(elem);
    this.lastX = x;
    this.lastY = y;
  }

  /**
   * Draws a line to the given coordinates.
   *
   * @param x Number that represents the x-coordinate of the endpoint.
   * @param y Number that represents the y-coordinate of the endpoint.
   */
  lineTo(x: number, y: number): void {
    const elem = this.createElement('line');
    elem.setAttribute('x', String(this.format(x)));
    elem.setAttribute('y', String(this.format(y)));
    this.root.appendChild(elem);
    this.lastX = x;
    this.lastY = y;
  }

  /**
   * Adds a quadratic curve to the current path.
   *
   * @param x1 Number that represents the x-coordinate of the control point.
   * @param y1 Number that represents the y-coordinate of the control point.
   * @param x2 Number that represents the x-coordinate of the endpoint.
   * @param y2 Number that represents the y-coordinate of the endpoint.
   */
  quadTo(x1: number, y1: number, x2: number, y2: number): void {
    const elem = this.createElement('quad');
    elem.setAttribute('x1', String(this.format(x1)));
    elem.setAttribute('y1', String(this.format(y1)));
    elem.setAttribute('x2', String(this.format(x2)));
    elem.setAttribute('y2', String(this.format(y2)));
    this.root.appendChild(elem);
    this.lastX = x2;
    this.lastY = y2;
  }

  /**
   * Adds a bezier curve to the current path.
   *
   * @param x1 Number that represents the x-coordinate of the first control point.
   * @param y1 Number that represents the y-coordinate of the first control point.
   * @param x2 Number that represents the x-coordinate of the second control point.
   * @param y2 Number that represents the y-coordinate of the second control point.
   * @param x3 Number that represents the x-coordinate of the endpoint.
   * @param y3 Number that represents the y-coordinate of the endpoint.
   */
  curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    const elem = this.createElement('curve');
    elem.setAttribute('x1', String(this.format(x1)));
    elem.setAttribute('y1', String(this.format(y1)));
    elem.setAttribute('x2', String(this.format(x2)));
    elem.setAttribute('y2', String(this.format(y2)));
    elem.setAttribute('x3', String(this.format(x3)));
    elem.setAttribute('y3', String(this.format(y3)));
    this.root.appendChild(elem);
    this.lastX = x3;
    this.lastY = y3;
  }

  /**
   * Closes the current path.
   */
  close(): void {
    this.root.appendChild(this.createElement('close'));
  }

  /**
   * Paints the given text. Possible values for format are empty string for
   * plain text and html for HTML markup. Background and border color as well
   * as clipping is not available in plain text labels for VML. HTML labels
   * are not available as part of shapes with no foreignObject support in SVG
   * (eg. IE9, IE10).
   *
   * @param x Number that represents the x-coordinate of the text.
   * @param y Number that represents the y-coordinate of the text.
   * @param w Number that represents the available width for the text or 0 for automatic width.
   * @param h Number that represents the available height for the text or 0 for automatic height.
   * @param str String that specifies the text to be painted.
   * @param align String that represents the horizontal alignment.
   * @param valign String that represents the vertical alignment.
   * @param wrap Boolean that specifies if word-wrapping is enabled. Requires w > 0.
   * @param format Empty string for plain text or 'html' for HTML markup.
   * @param overflow Specifies the overflow behaviour of the label. Requires w > 0 and/or h > 0.
   * @param clip Boolean that specifies if the label should be clipped. Requires w > 0 and/or h > 0.
   * @param rotation Number that specifies the angle of the rotation around the anchor point of the text.
   * @param dir Optional string that specifies the text direction. Possible values are rtl and ltr.
   */
  text(
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    str: string | HTMLElement, 
    align: string | null=null, 
    valign: string | null=null, 
    wrap: boolean | null=null, 
    format: string | null=null, 
    overflow: string | null=null, 
    clip: boolean | null=null, 
    rotation: number | null=null, 
    dir: TextDirectionValue | null=null
  ): void {
    if (this.textEnabled && str != null) {
      if (isNode(str)) {
        str = getOuterHtml(<HTMLElement>str);
      }

      const elem = this.createElement('text');
      elem.setAttribute('x', String(this.format(x)));
      elem.setAttribute('y', String(this.format(y)));
      elem.setAttribute('w', String(this.format(w)));
      elem.setAttribute('h', String(this.format(h)));
      elem.setAttribute('str', <string>str);

      if (align != null) {
        elem.setAttribute('align', align);
      }

      if (valign != null) {
        elem.setAttribute('valign', valign);
      }

      elem.setAttribute('wrap', wrap ? '1' : '0');

      if (format == null) {
        format = '';
      }

      elem.setAttribute('format', format);

      if (overflow != null) {
        elem.setAttribute('overflow', overflow);
      }

      if (clip != null) {
        elem.setAttribute('clip', clip ? '1' : '0');
      }

      if (rotation != null) {
        elem.setAttribute('rotation', String(rotation));
      }

      if (dir != null) {
        elem.setAttribute('dir', dir);
      }

      this.root.appendChild(elem);
    }
  }

  /**
   * Paints the outline of the current drawing buffer.
   */
  stroke(): void {
    this.root.appendChild(this.createElement('stroke'));
  }

  /**
   * Fills the current drawing buffer.
   */
  fill(): void {
    this.root.appendChild(this.createElement('fill'));
  }

  /**
   * Fills the current drawing buffer and its outline.
   */
  fillAndStroke(): void {
    this.root.appendChild(this.createElement('fillstroke'));
  }
}

export default mxXmlCanvas2D;
