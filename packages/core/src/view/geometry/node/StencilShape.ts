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

import ConnectionConstraint from '../../other/ConnectionConstraint';
import Rectangle from '../Rectangle';
import Shape from '../Shape';
import Translations from '../../../util/Translations';
import { isNotNullish } from '../../../util/Utils';
import {
  ALIGN,
  DIRECTION,
  NODETYPE,
  NONE,
  RECTANGLE_ROUNDING_FACTOR,
  TEXT_DIRECTION,
} from '../../../util/Constants';
import StencilShapeRegistry from './StencilShapeRegistry';
import { getChildNodes, getTextContent } from '../../../util/domUtils';
import Point from '../Point';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import { AlignValue, ColorValue, VAlignValue } from '../../../types';

/**
 * Configure global settings for stencil shapes.
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.11.0
 * @category Configuration
 */
export const StencilShapeConfig = {
  /**
   * Specifies if the use of eval is allowed for evaluating text content and images.
   * Set this to `true` if stencils can not contain user input.
   * @default false
   */
  allowEval: false,

  /**
   * Specifies the default value for the localized attribute of the text element.
   * @default false
   */
  defaultLocalized: false,
};

/**
 * Implements a generic shape which is based on an XML node as a description.
 */
class StencilShape extends Shape {
  constructor(desc: Element) {
    super();
    this.desc = desc;
    this.parseDescription();
    this.parseConstraints();
  }

  /**
   * Holds the XML node with the stencil description.
   */
  desc: Element;

  /**
   * Holds an array of {@link ConnectionConstraint}s as defined in the shape.
   */
  constraints: ConnectionConstraint[] = [];

  /**
   * Holds the aspect of the shape. Default is 'auto'.
   */
  aspect = 'auto';

  /**
   * Holds the width of the shape. Default is 100.
   */
  w0 = 100;

  /**
   * Holds the height of the shape. Default is 100.
   */
  h0 = 100;

  /**
   * Holds the XML node with the stencil description.
   */
  // bgNode: Element;
  bgNode: Element | null = null;

  /**
   * Holds the XML node with the stencil description.
   */
  fgNode: Element | null = null;

  /**
   * Holds the strokewidth direction from the description.
   */
  strokeWidthValue: string | null = null;

  /**
   * Reads <w0>, <h0>, <aspect>, <bgNodes> and <fgNodes> from <desc>.
   */
  parseDescription() {
    // LATER: Preprocess nodes for faster painting
    this.fgNode = this.desc.getElementsByTagName('foreground')[0];
    this.bgNode = this.desc.getElementsByTagName('background')[0];
    this.w0 = Number(this.desc.getAttribute('w') || 100);
    this.h0 = Number(this.desc.getAttribute('h') || 100);

    // Possible values for aspect are: variable and fixed where
    // variable means fill the available space and fixed means
    // use w0 and h0 to compute the aspect.
    const aspect = this.desc.getAttribute('aspect');
    this.aspect = aspect ?? 'variable';

    // Possible values for strokewidth are all numbers and "inherit"
    // where the inherit means take the value from the style (ie. the
    // user-defined stroke-width). Note that the strokewidth is scaled
    // by the minimum scaling that is used to draw the shape (sx, sy).
    const sw = this.desc.getAttribute('strokewidth');
    this.strokeWidthValue = isNotNullish(sw) ? sw : '1';
  }

  /**
   * Reads the constraints from {@link desc} into {@link constraints} using {@link parseConstraint}.
   */
  parseConstraints() {
    const conns = this.desc.getElementsByTagName('connections')[0];

    if (conns) {
      const tmp = getChildNodes(conns);

      if (tmp.length > 0) {
        this.constraints = [];

        for (let i = 0; i < tmp.length; i += 1) {
          this.constraints.push(this.parseConstraint(tmp[i] as Element));
        }
      }
    }
  }

  /**
   * Parses the given XML node and returns its {@link ConnectionConstraint}.
   */
  parseConstraint(node: Element) {
    const x = Number(node.getAttribute('x'));
    const y = Number(node.getAttribute('y'));
    const perimeter = node.getAttribute('perimeter') === '1';
    const name = node.getAttribute('name');

    return new ConnectionConstraint(new Point(x, y), perimeter, name);
  }

  /**
   * Gets the given attribute as a text. The return value from <evaluateAttribute>
   * is used as a key to {@link Resources#get} if the localized attribute in the text
   * node is 1 or if <defaultLocalized> is true.
   */
  evaluateTextAttribute(node: Element, attribute: string, shape: Shape) {
    let result = this.evaluateAttribute(node, attribute, shape);
    const loc = node.getAttribute('localized');

    if ((StencilShapeConfig.defaultLocalized && !loc) || loc === '1') {
      result = Translations.get(<string>result);
    }
    return result;
  }

  /**
   * Gets the attribute for the given name from the given node. If the attribute
   * does not exist then the text content of the node is evaluated and if it is
   * a function it is invoked with <shape> as the only argument and the return
   * value is used as the attribute value to be returned.
   */
  evaluateAttribute(node: Element, attribute: string, shape: Shape) {
    let result = node.getAttribute(attribute);

    if (!result) {
      const text = getTextContent(<Text>(<unknown>node));

      if (text && StencilShapeConfig.allowEval) {
        const funct = eval(text);

        if (typeof funct === 'function') {
          result = funct(shape);
        }
      }
    }
    return result;
  }

  /**
   * Draws this stencil inside the given bounds.
   */
  drawShape(
    canvas: AbstractCanvas2D,
    shape: Shape,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const stack = canvas.states.slice();

    // TODO: Internal structure (array of special structs?), relative and absolute
    // coordinates (eg. note shape, process vs star, actor etc.), text rendering
    // and non-proportional scaling, how to implement pluggable edge shapes
    // (start, segment, end blocks), pluggable markers, how to implement
    // swimlanes (title area) with this API, add icon, horizontal/vertical
    // label, indicator for all shapes, rotation
    const direction = shape.style?.direction;
    const aspect = this.computeAspect(shape, x, y, w, h, direction);
    const minScale = Math.min(aspect.width, aspect.height);
    const sw =
      this.strokeWidthValue === 'inherit'
        ? (shape.style?.strokeWidth ?? 1)
        : Number(this.strokeWidthValue) * minScale;
    canvas.setStrokeWidth(sw);

    // Draws a transparent rectangle for catching events
    if (shape.style?.pointerEvents ?? false) {
      canvas.setStrokeColor(NONE);
      canvas.rect(x, y, w, h);
      canvas.stroke();
      canvas.setStrokeColor(shape.stroke);
    }

    this.drawChildren(canvas, shape, x, y, w, h, this.bgNode, aspect, false, true);
    this.drawChildren(
      canvas,
      shape,
      x,
      y,
      w,
      h,
      this.fgNode,
      aspect,
      true,
      !shape.outline || shape.style == null || !(shape.style.backgroundOutline ?? false)
    );

    // Restores stack for unequal count of save/restore calls
    if (canvas.states.length != stack.length) {
      canvas.states = stack;
    }
  }

  /**
   * Draws this stencil inside the given bounds.
   */
  drawChildren(
    canvas: AbstractCanvas2D,
    shape: Shape,
    x: number,
    y: number,
    w: number,
    h: number,
    node: Element | null,
    aspect: Rectangle,
    disableShadow: boolean,
    paint: boolean
  ) {
    if (node && w > 0 && h > 0) {
      let tmp = node.firstChild as Element;

      while (tmp) {
        if (tmp.nodeType === NODETYPE.ELEMENT) {
          this.drawNode(canvas, shape, tmp, aspect, disableShadow, paint);
        }

        tmp = tmp.nextSibling as Element;
      }
    }
  }

  /**
   * Returns a rectangle that contains the offset in x and y and the horizontal
   * and vertical scale in width and height used to draw this shape inside the
   * given {@link Rectangle}.
   *
   * @param shape {@link Shape} to be drawn.
   * @param bounds {@link Rectangle} that should contain the stencil.
   * @param direction Optional direction of the shape to be darwn.
   */
  computeAspect(
    shape: Shape | null = null,
    x: number,
    y: number,
    w: number,
    h: number,
    direction?: string
  ) {
    let x0 = x;
    let y0 = y;
    let sx = w / this.w0;
    let sy = h / this.h0;

    const inverse = direction === DIRECTION.NORTH || direction === DIRECTION.SOUTH;

    if (inverse) {
      sy = w / this.h0;
      sx = h / this.w0;

      const delta = (w - h) / 2;

      x0 += delta;
      y0 -= delta;
    }

    if (this.aspect === 'fixed') {
      sy = Math.min(sx, sy);
      sx = sy;

      // Centers the shape inside the available space
      if (inverse) {
        x0 += (h - this.w0 * sx) / 2;
        y0 += (w - this.h0 * sy) / 2;
      } else {
        x0 += (w - this.w0 * sx) / 2;
        y0 += (h - this.h0 * sy) / 2;
      }
    }

    return new Rectangle(x0, y0, sx, sy);
  }

  /**
   * Draws this stencil inside the given bounds.
   */
  drawNode(
    canvas: AbstractCanvas2D,
    shape: Shape,
    node: Element,
    aspect: Rectangle,
    disableShadow: boolean,
    paint: boolean
  ) {
    const name = node.nodeName;
    const x0 = aspect.x;
    const y0 = aspect.y;
    const sx = aspect.width;
    const sy = aspect.height;
    const minScale = Math.min(sx, sy);

    if (name === 'save') {
      canvas.save();
    } else if (name === 'restore') {
      canvas.restore();
    } else if (paint) {
      if (name === 'path') {
        canvas.begin();

        let parseRegularly = true;

        if (node.getAttribute('rounded') == '1') {
          parseRegularly = false;

          const arcSize = Number(node.getAttribute('arcSize'));
          let pointCount = 0;
          const segs: Point[][] = [];

          // Renders the elements inside the given path
          let childNode = node.firstChild as Element;

          while (childNode != null) {
            if (childNode.nodeType === NODETYPE.ELEMENT) {
              const childName = childNode.nodeName;

              if (childName === 'move' || childName === 'line') {
                if (childName === 'move' || segs.length === 0) {
                  segs.push([]);
                }

                segs[segs.length - 1].push(
                  new Point(
                    x0 + Number(childNode.getAttribute('x')) * sx,
                    y0 + Number(childNode.getAttribute('y')) * sy
                  )
                );
                pointCount++;
              } else {
                // We only support move and line for rounded corners
                parseRegularly = true;
                break;
              }
            }

            childNode = childNode.nextSibling as Element;
          }

          if (!parseRegularly && pointCount > 0) {
            for (let i = 0; i < segs.length; i += 1) {
              let close = false;
              const ps = segs[i][0];
              const pe = segs[i][segs[i].length - 1];

              if (ps.x === pe.x && ps.y === pe.y) {
                segs[i].pop();
                close = true;
              }

              this.addPoints(canvas, segs[i], true, arcSize, close);
            }
          } else {
            parseRegularly = true;
          }
        }

        if (parseRegularly) {
          // Renders the elements inside the given path
          let childNode = node.firstChild as Element;

          while (childNode) {
            if (childNode.nodeType === NODETYPE.ELEMENT) {
              this.drawNode(canvas, shape, childNode, aspect, disableShadow, paint);
            }

            childNode = childNode.nextSibling as Element;
          }
        }
      } else if (name === 'close') {
        canvas.close();
      } else if (name === 'move') {
        canvas.moveTo(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy
        );
      } else if (name === 'line') {
        canvas.lineTo(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy
        );
      } else if (name === 'quad') {
        canvas.quadTo(
          x0 + Number(node.getAttribute('x1')) * sx,
          y0 + Number(node.getAttribute('y1')) * sy,
          x0 + Number(node.getAttribute('x2')) * sx,
          y0 + Number(node.getAttribute('y2')) * sy
        );
      } else if (name === 'curve') {
        canvas.curveTo(
          x0 + Number(node.getAttribute('x1')) * sx,
          y0 + Number(node.getAttribute('y1')) * sy,
          x0 + Number(node.getAttribute('x2')) * sx,
          y0 + Number(node.getAttribute('y2')) * sy,
          x0 + Number(node.getAttribute('x3')) * sx,
          y0 + Number(node.getAttribute('y3')) * sy
        );
      } else if (name === 'arc') {
        canvas.arcTo(
          Number(node.getAttribute('rx')) * sx,
          Number(node.getAttribute('ry')) * sy,
          Number(node.getAttribute('x-axis-rotation')),
          Boolean(node.getAttribute('large-arc-flag')),
          Boolean(node.getAttribute('sweep-flag')),
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy
        );
      } else if (name === 'rect') {
        canvas.rect(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          Number(node.getAttribute('w')) * sx,
          Number(node.getAttribute('h')) * sy
        );
      } else if (name === 'roundrect') {
        let arcsize = Number(node.getAttribute('arcsize'));

        if (arcsize === 0) {
          arcsize = RECTANGLE_ROUNDING_FACTOR * 100;
        }

        const w = Number(node.getAttribute('w')) * sx;
        const h = Number(node.getAttribute('h')) * sy;
        const factor = Number(arcsize) / 100;
        const r = Math.min(w * factor, h * factor);

        canvas.roundrect(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          w,
          h,
          r,
          r
        );
      } else if (name === 'ellipse') {
        canvas.ellipse(
          x0 + Number(node.getAttribute('x')) * sx,
          y0 + Number(node.getAttribute('y')) * sy,
          Number(node.getAttribute('w')) * sx,
          Number(node.getAttribute('h')) * sy
        );
      } else if (name === 'image') {
        if (!shape.outline) {
          const src = this.evaluateAttribute(node, 'src', shape) as string;

          canvas.image(
            x0 + Number(node.getAttribute('x')) * sx,
            y0 + Number(node.getAttribute('y')) * sy,
            Number(node.getAttribute('w')) * sx,
            Number(node.getAttribute('h')) * sy,
            src,
            false,
            node.getAttribute('flipH') === '1',
            node.getAttribute('flipV') === '1'
          );
        }
      } else if (name === 'text') {
        if (!shape.outline) {
          const str = this.evaluateTextAttribute(node, 'str', shape) as string;
          let rotation = node.getAttribute('vertical') == '1' ? -90 : 0;

          if (node.getAttribute('align-shape') === '0') {
            const dr = shape.rotation;

            // Depends on flipping
            const flipH = shape.style?.flipH ?? false;
            const flipV = shape.style?.flipV ?? false;

            if (flipH && flipV) {
              rotation -= dr;
            } else if (flipH || flipV) {
              rotation += dr;
            } else {
              rotation -= dr;
            }
          }

          rotation -= Number(node.getAttribute('rotation'));

          canvas.text(
            x0 + Number(node.getAttribute('x')) * sx,
            y0 + Number(node.getAttribute('y')) * sy,
            0,
            0,
            str,
            (node.getAttribute('align') as AlignValue) || ALIGN.LEFT,
            (node.getAttribute('valign') as VAlignValue) || ALIGN.TOP,
            false,
            '',
            'auto',
            false,
            rotation,
            TEXT_DIRECTION.AUTO
          );
        }
      } else if (name === 'include-shape') {
        const stencil = StencilShapeRegistry.getStencil(
          node.getAttribute('name') as string
        );

        if (stencil) {
          const x = x0 + Number(node.getAttribute('x')) * sx;
          const y = y0 + Number(node.getAttribute('y')) * sy;
          const w = Number(node.getAttribute('w')) * sx;
          const h = Number(node.getAttribute('h')) * sy;

          stencil.drawShape(canvas, shape, x, y, w, h);
        }
      } else if (name === 'fillstroke') {
        canvas.fillAndStroke();
      } else if (name === 'fill') {
        canvas.fill();
      } else if (name === 'stroke') {
        canvas.stroke();
      } else if (name === 'strokewidth') {
        const s = node.getAttribute('fixed') === '1' ? 1 : minScale;
        canvas.setStrokeWidth(Number(node.getAttribute('width')) * s);
      } else if (name === 'dashed') {
        canvas.setDashed(node.getAttribute('dashed') === '1');
      } else if (name === 'dashpattern') {
        let value = node.getAttribute('pattern');

        if (value != null) {
          const tmp = value.split(' ');
          const pat = [];

          for (let i = 0; i < tmp.length; i += 1) {
            if (tmp[i].length > 0) {
              pat.push(Number(tmp[i]) * minScale);
            }
          }

          value = pat.join(' ');
          canvas.setDashPattern(value);
        }
      } else if (name === 'strokecolor') {
        canvas.setStrokeColor(node.getAttribute('color') as ColorValue);
      } else if (name === 'linecap') {
        canvas.setLineCap(node.getAttribute('cap') as string);
      } else if (name === 'linejoin') {
        canvas.setLineJoin(node.getAttribute('join') as string);
      } else if (name === 'miterlimit') {
        canvas.setMiterLimit(Number(node.getAttribute('limit')));
      } else if (name === 'fillcolor') {
        canvas.setFillColor(node.getAttribute('color') as ColorValue);
      } else if (name === 'alpha') {
        canvas.setAlpha(Number(node.getAttribute('alpha')));
      } else if (name === 'fillalpha') {
        canvas.setAlpha(Number(node.getAttribute('alpha')));
      } else if (name === 'strokealpha') {
        canvas.setAlpha(Number(node.getAttribute('alpha')));
      } else if (name === 'fontcolor') {
        canvas.setFontColor(node.getAttribute('color') as ColorValue);
      } else if (name === 'fontstyle') {
        canvas.setFontStyle(Number(node.getAttribute('style')));
      } else if (name === 'fontfamily') {
        canvas.setFontFamily(node.getAttribute('family') as string);
      } else if (name === 'fontsize') {
        canvas.setFontSize(Number(node.getAttribute('size')) * minScale);
      }

      if (
        disableShadow &&
        (name === 'fillstroke' || name === 'fill' || name === 'stroke')
      ) {
        disableShadow = false;
        canvas.setShadow(false);
      }
    }
  }
}

export default StencilShape;
