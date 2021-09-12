/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxAbstractCanvas2D from './AbstractCanvas2D';
import {
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  NONE,
  SHADOWCOLOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  SHADOW_OPACITY,
} from '../Constants';
import { getOuterHtml } from '../DomUtils';

/**
 * Class: mxXmlCanvas2D
 *
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
 * <mxAbstractCanvas2D.arcTo> is an additional method for drawing paths. This is
 * a synthetic method, meaning that it is turned into a sequence of curves by
 * default. Subclassers may add native support for arcs.
 *
 * Constructor: D
 *
 * Constructs a new abstract canvas.
 */
class mxXmlCanvas2D extends mxAbstractCanvas2D {
  constructor(root) {
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

  /**
   * Specifies if text output should be enabled.
   * @default true
   */
  // textEnabled: boolean;
  textEnabled = true;

  /**
   * Specifies if the output should be compressed by removing redundant calls.
   * @default true
   */
  // compressed: boolean;
  compressed = true;

  /**
   * Writes the rendering defaults to {@link root}:
   */
  // writeDefaults(): void;
  writeDefaults() {
    let elem;

    // Writes font defaults
    elem = this.createElement('fontfamily');
    elem.setAttribute('family', DEFAULT_FONTFAMILY);
    this.root.appendChild(elem);

    elem = this.createElement('fontsize');
    elem.setAttribute('size', DEFAULT_FONTSIZE);
    this.root.appendChild(elem);

    // Writes shadow defaults
    elem = this.createElement('shadowcolor');
    elem.setAttribute('color', SHADOWCOLOR);
    this.root.appendChild(elem);

    elem = this.createElement('shadowalpha');
    elem.setAttribute('alpha', SHADOW_OPACITY);
    this.root.appendChild(elem);

    elem = this.createElement('shadowoffset');
    elem.setAttribute('dx', SHADOW_OFFSET_X);
    elem.setAttribute('dy', SHADOW_OFFSET_Y);
    this.root.appendChild(elem);
  }

  /**
   * Returns a formatted number with 2 decimal places.
   */
  // format(value: string): number;
  format(value) {
    return parseFloat(parseFloat(value).toFixed(2));
  }

  /**
   * Creates the given element using the owner document of {@link root}.
   */
  // createElement(name: string): Element;
  createElement(name) {
    return this.root.ownerDocument.createElement(name);
  }

  /**
   * Saves the drawing state.
   */
  // save(): void;
  save() {
    if (this.compressed) {
      super.save();
    }
    this.root.appendChild(this.createElement('save'));
  }

  /**
   * Restores the drawing state.
   */
  // restore(): void;
  restore() {
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
  // scale(value: number): void;
  scale(value) {
    const elem = this.createElement('scale');
    elem.setAttribute('scale', value);
    this.root.appendChild(elem);
  }

  /**
   * Translates the output.
   *
   * @param dx Number that specifies the horizontal translation.
   * @param dy Number that specifies the vertical translation.
   */
  // translate(dx: number, dy: number): void;
  translate(dx, dy) {
    const elem = this.createElement('translate');
    elem.setAttribute('dx', this.format(dx));
    elem.setAttribute('dy', this.format(dy));
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
  // rotate(theta: number, flipH: boolean, flipV: boolean, cx: number, cy: number): void;
  rotate(theta, flipH, flipV, cx, cy) {
    const elem = this.createElement('rotate');

    if (theta !== 0 || flipH || flipV) {
      elem.setAttribute('theta', this.format(theta));
      elem.setAttribute('flipH', flipH ? '1' : '0');
      elem.setAttribute('flipV', flipV ? '1' : '0');
      elem.setAttribute('cx', this.format(cx));
      elem.setAttribute('cy', this.format(cy));
      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current alpha.
   *
   * @param value Number that represents the new alpha. Possible values are between
   * 1 (opaque) and 0 (transparent).
   */
  // setAlpha(value: number): void;
  setAlpha(value) {
    if (this.compressed) {
      if (this.state.alpha === value) {
        return;
      }
      super.setAlpha(value);
    }

    const elem = this.createElement('alpha');
    elem.setAttribute('alpha', this.format(value));
    this.root.appendChild(elem);
  }

  /**
   * Sets the current fill alpha.
   *
   * @param value Number that represents the new fill alpha. Possible values are between
   * 1 (opaque) and 0 (transparent).
   */
  // setFillAlpha(value: number): void;
  setFillAlpha(value) {
    if (this.compressed) {
      if (this.state.fillAlpha === value) {
        return;
      }
      super.setFillAlpha(value);
    }

    const elem = this.createElement('fillalpha');
    elem.setAttribute('alpha', this.format(value));
    this.root.appendChild(elem);
  }

  /**
   * Sets the current stroke alpha.
   *
   * @param value Number that represents the new stroke alpha. Possible values are between
   * 1 (opaque) and 0 (transparent).
   */
  // setStrokeAlpha(value: number): void;
  setStrokeAlpha(value) {
    if (this.compressed) {
      if (this.state.strokeAlpha === value) {
        return;
      }
      super.setStrokeAlpha(value);
    }

    const elem = this.createElement('strokealpha');
    elem.setAttribute('alpha', this.format(value));
    this.root.appendChild(elem);
  }

  /**
   * Sets the current fill color.
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  // setFillColor(value: string): void;
  setFillColor(value) {
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
   * Function: setGradient
   *
   * Sets the gradient. Note that the coordinates may be ignored by some implementations.
   *
   * Parameters:
   *
   * color1 - Hexadecimal representation of the start color.
   * color2 - Hexadecimal representation of the end color.
   * x - X-coordinate of the gradient region.
   * y - y-coordinate of the gradient region.
   * w - Width of the gradient region.
   * h - Height of the gradient region.
   * direction - One of <mxConstants.DIRECTION_NORTH>, <mxConstants.DIRECTION_EAST>,
   * <mxConstants.DIRECTION_SOUTH> or <mxConstants.DIRECTION_WEST>.
   * alpha1 - Optional alpha of the start color. Default is 1. Possible values
   * are between 1 (opaque) and 0 (transparent).
   * alpha2 - Optional alpha of the end color. Default is 1. Possible values
   * are between 1 (opaque) and 0 (transparent).
   */
  setGradient(color1, color2, x, y, w, h, direction, alpha1, alpha2) {
    if (color1 != null && color2 != null) {
      super.setGradient(color1, color2, x, y, w, h, direction, alpha1, alpha2);

      const elem = this.createElement('gradient');
      elem.setAttribute('c1', color1);
      elem.setAttribute('c2', color2);
      elem.setAttribute('x', this.format(x));
      elem.setAttribute('y', this.format(y));
      elem.setAttribute('w', this.format(w));
      elem.setAttribute('h', this.format(h));

      // Default direction is south
      if (direction != null) {
        elem.setAttribute('direction', direction);
      }

      if (alpha1 != null) {
        elem.setAttribute('alpha1', alpha1);
      }

      if (alpha2 != null) {
        elem.setAttribute('alpha2', alpha2);
      }

      this.root.appendChild(elem);
    }
  }

  /**
   * Sets the current stroke color.
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  // setStrokeColor(value: string): void;
  setStrokeColor(value) {
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
  // setStrokeWidth(value: number): void;
  setStrokeWidth(value) {
    if (this.compressed) {
      if (this.state.strokeWidth === value) {
        return;
      }
      super.setStrokeWidth(value);
    }

    const elem = this.createElement('strokewidth');
    elem.setAttribute('width', this.format(value));
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
  // setDashed(value: boolean, fixDash: boolean): void;
  setDashed(value, fixDash) {
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
  // setDashPattern(value: string): void;
  setDashPattern(value) {
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
  // setLineCap(value: string): void;
  setLineCap(value) {
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
  // setLineJoin(value: string): void;
  setLineJoin(value) {
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
  // setMiterLimit(value: number): void;
  setMiterLimit(value) {
    if (this.compressed) {
      if (this.state.miterLimit === value) {
        return;
      }
      super.setMiterLimit(value);
    }

    const elem = this.createElement('miterlimit');
    elem.setAttribute('limit', value);
    this.root.appendChild(elem);
  }

  /**
   * Sets the current font color.
   * @default '#000000'
   *
   * @param value Hexadecimal representation of the color or 'none'.
   */
  // setFontColor(value: string): void;
  setFontColor(value) {
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
  // setFontBackgroundColor(value: string): void;
  setFontBackgroundColor(value) {
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
  // setFontBorderColor(value: string): void;
  setFontBorderColor(value) {
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
  // setFontSize(value: number): void;
  setFontSize(value) {
    if (this.textEnabled) {
      if (this.compressed) {
        if (this.state.fontSize === value) {
          return;
        }
        super.setFontSize(value);
      }

      const elem = this.createElement('fontsize');
      elem.setAttribute('size', value);
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
  // setFontFamily(value: string): void;
  setFontFamily(value) {
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
  // setFontStyle(value: string): void;
  setFontStyle(value) {
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
      elem.setAttribute('style', value);
      this.root.appendChild(elem);
    }
  }

  /**
   * Enables or disables shadows.
   *
   * @param value Boolean that specifies if shadows should be enabled.
   */
  // setShadow(value: boolean): void;
  setShadow(value) {
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
  // setShadowColor(value: string): void;
  setShadowColor(value) {
    if (this.compressed) {
      if (value === NONE) {
        value = null;
      }

      if (this.state.shadowColor === value) {
        return;
      }

      this.mxAbstractCanvas2setShadowColor(value);
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
  // setShadowAlpha(value: number): void;
  setShadowAlpha(value) {
    if (this.compressed) {
      if (this.state.shadowAlpha === value) {
        return;
      }
      this.mxAbstractCanvas2setShadowAlpha(value);
    }

    const elem = this.createElement('shadowalpha');
    elem.setAttribute('alpha', value);
    this.root.appendChild(elem);
  }

  /**
   * Sets the current shadow offset.
   *
   * @param dx Number that represents the horizontal offset of the shadow.
   * @param dy Number that represents the vertical offset of the shadow.
   */
  // setShadowOffset(dx: number, dy: number): void;
  setShadowOffset(dx, dy) {
    if (this.compressed) {
      if (this.state.shadowDx === dx && this.state.shadowDy === dy) {
        return;
      }
      this.mxAbstractCanvas2setShadowOffset(dx, dy);
    }

    const elem = this.createElement('shadowoffset');
    elem.setAttribute('dx', dx);
    elem.setAttribute('dy', dy);
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
  // rect(x: number, y: number, w: number, h: number): void;
  rect(x, y, w, h) {
    const elem = this.createElement('rect');
    elem.setAttribute('x', this.format(x));
    elem.setAttribute('y', this.format(y));
    elem.setAttribute('w', this.format(w));
    elem.setAttribute('h', this.format(h));
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
  // roundrect(x: number, y: number, w: number, h: number, dx: number, dy: number): void;
  roundrect(x, y, w, h, dx, dy) {
    const elem = this.createElement('roundrect');
    elem.setAttribute('x', this.format(x));
    elem.setAttribute('y', this.format(y));
    elem.setAttribute('w', this.format(w));
    elem.setAttribute('h', this.format(h));
    elem.setAttribute('dx', this.format(dx));
    elem.setAttribute('dy', this.format(dy));
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
  // ellipse(x: number, y: number, w: number, h: number): void;
  ellipse(x, y, w, h) {
    const elem = this.createElement('ellipse');
    elem.setAttribute('x', this.format(x));
    elem.setAttribute('y', this.format(y));
    elem.setAttribute('w', this.format(w));
    elem.setAttribute('h', this.format(h));
    this.root.appendChild(elem);
  }

  /**
   * Function: image
   *
   * Paints an image.
   *
   * Parameters:
   *
   * x - Number that represents the x-coordinate of the image.
   * y - Number that represents the y-coordinate of the image.
   * w - Number that represents the width of the image.
   * h - Number that represents the height of the image.
   * src - String that specifies the URL of the image.
   * aspect - Boolean indicating if the aspect of the image should be preserved.
   * flipH - Boolean indicating if the image should be flipped horizontally.
   * flipV - Boolean indicating if the image should be flipped vertically.
   */
  image(x, y, w, h, src, aspect, flipH, flipV) {
    src = this.converter.convert(src);

    // LATER: Add option for embedding images as base64.
    const elem = this.createElement('image');
    elem.setAttribute('x', this.format(x));
    elem.setAttribute('y', this.format(y));
    elem.setAttribute('w', this.format(w));
    elem.setAttribute('h', this.format(h));
    elem.setAttribute('src', src);
    elem.setAttribute('aspect', aspect ? '1' : '0');
    elem.setAttribute('flipH', flipH ? '1' : '0');
    elem.setAttribute('flipV', flipV ? '1' : '0');
    this.root.appendChild(elem);
  }

  /**
   * Starts a new path and puts it into the drawing buffer.
   */
  // begin(): void;
  begin() {
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
  // moveTo(x: number, y: number): void;
  moveTo(x, y) {
    const elem = this.createElement('move');
    elem.setAttribute('x', this.format(x));
    elem.setAttribute('y', this.format(y));
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
  // lineTo(x: number, y: number): void;
  lineTo(x, y) {
    const elem = this.createElement('line');
    elem.setAttribute('x', this.format(x));
    elem.setAttribute('y', this.format(y));
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
  // quadTo(x1: number, y1: number, x2: number, y2: number): void;
  quadTo(x1, y1, x2, y2) {
    const elem = this.createElement('quad');
    elem.setAttribute('x1', this.format(x1));
    elem.setAttribute('y1', this.format(y1));
    elem.setAttribute('x2', this.format(x2));
    elem.setAttribute('y2', this.format(y2));
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
  // curveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
  curveTo(x1, y1, x2, y2, x3, y3) {
    const elem = this.createElement('curve');
    elem.setAttribute('x1', this.format(x1));
    elem.setAttribute('y1', this.format(y1));
    elem.setAttribute('x2', this.format(x2));
    elem.setAttribute('y2', this.format(y2));
    elem.setAttribute('x3', this.format(x3));
    elem.setAttribute('y3', this.format(y3));
    this.root.appendChild(elem);
    this.lastX = x3;
    this.lastY = y3;
  }

  /**
   * Closes the current path.
   */
  // close(): void;
  close() {
    this.root.appendChild(this.createElement('close'));
  }

  /**
   * Function: text
   *
   * Paints the given text. Possible values for format are empty string for
   * plain text and html for HTML markup. Background and border color as well
   * as clipping is not available in plain text labels for VML. HTML labels
   * are not available as part of shapes with no foreignObject support in SVG
   * (eg. IE9, IE10).
   *
   * Parameters:
   *
   * x - Number that represents the x-coordinate of the text.
   * y - Number that represents the y-coordinate of the text.
   * w - Number that represents the available width for the text or 0 for automatic width.
   * h - Number that represents the available height for the text or 0 for automatic height.
   * str - String that specifies the text to be painted.
   * align - String that represents the horizontal alignment.
   * valign - String that represents the vertical alignment.
   * wrap - Boolean that specifies if word-wrapping is enabled. Requires w > 0.
   * format - Empty string for plain text or 'html' for HTML markup.
   * overflow - Specifies the overflow behaviour of the label. Requires w > 0 and/or h > 0.
   * clip - Boolean that specifies if the label should be clipped. Requires w > 0 and/or h > 0.
   * rotation - Number that specifies the angle of the rotation around the anchor point of the text.
   * dir - Optional string that specifies the text direction. Possible values are rtl and lrt.
   */
  text(x, y, w, h, str, align, valign, wrap, format, overflow, clip, rotation, dir) {
    if (this.textEnabled && str != null) {
      if (isNode(str)) {
        str = getOuterHtml(str);
      }

      const elem = this.createElement('text');
      elem.setAttribute('x', this.format(x));
      elem.setAttribute('y', this.format(y));
      elem.setAttribute('w', this.format(w));
      elem.setAttribute('h', this.format(h));
      elem.setAttribute('str', str);

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
        elem.setAttribute('rotation', rotation);
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
  // stroke(): void;
  stroke() {
    this.root.appendChild(this.createElement('stroke'));
  }

  /**
   * Fills the current drawing buffer.
   */
  // fill(): void;
  fill() {
    this.root.appendChild(this.createElement('fill'));
  }

  /**
   * Fills the current drawing buffer and its outline.
   */
  // fillAndStroke(): void;
  fillAndStroke() {
    this.root.appendChild(this.createElement('fillstroke'));
  }
}

export default mxXmlCanvas2D;
