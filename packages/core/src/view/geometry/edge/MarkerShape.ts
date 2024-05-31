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

import { ArrowValue } from '../../../types';
import AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import { ARROW } from '../../../util/Constants';
import Point from '../Point';
import Shape from '../Shape';

/**
 * A registry that stores all edge markers using .
 *
 * NOTE: The signatures in this class will change.
 */
class MarkerShape {
  /**
   * Maps from markers names to functions to paint the markers.
   *
   * Mapping: the attribute name on the object is the marker type, the associated value is the function to paint the marker
   */
  static markers: Record<string, Function> = {};

  /**
   * Adds a factory method that updates a given endpoint and returns a
   * function to paint the marker onto the given canvas.
   */
  static addMarker(type: string, funct: Function) {
    MarkerShape.markers[type] = funct;
  }

  /**
   * Returns a function to paint the given marker.
   */
  static createMarker(
    canvas: AbstractCanvas2D,
    shape: Shape,
    type: ArrowValue | string,
    pe: Point,
    unitX: number,
    unitY: number,
    size: number,
    source: boolean,
    sw: number,
    filled: boolean
  ) {
    const funct = MarkerShape.markers[type];
    return funct
      ? funct(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
      : null;
  }
}

/**
 * Adds the classic and block marker factory method.
 */
(() => {
  function createArrow(widthFactor = 2) {
    return (
      canvas: AbstractCanvas2D,
      shape: Shape,
      type: ArrowValue,
      pe: Point,
      unitX: number,
      unitY: number,
      size: number,
      source: boolean,
      sw: number,
      filled: boolean
    ) => {
      // The angle of the forward facing arrow sides against the x axis is
      // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
      // only half the strokewidth is processed ).
      const endOffsetX = unitX * sw * 1.118;
      const endOffsetY = unitY * sw * 1.118;

      unitX *= size + sw;
      unitY *= size + sw;

      const pt = pe.clone();
      pt.x -= endOffsetX;
      pt.y -= endOffsetY;

      const f = type !== ARROW.CLASSIC && type !== ARROW.CLASSIC_THIN ? 1 : 3 / 4;
      pe.x += -unitX * f - endOffsetX;
      pe.y += -unitY * f - endOffsetY;

      return () => {
        canvas.begin();
        canvas.moveTo(pt.x, pt.y);
        canvas.lineTo(
          pt.x - unitX - unitY / widthFactor,
          pt.y - unitY + unitX / widthFactor
        );

        if (type === ARROW.CLASSIC || type === ARROW.CLASSIC_THIN) {
          canvas.lineTo(pt.x - (unitX * 3) / 4, pt.y - (unitY * 3) / 4);
        }

        canvas.lineTo(
          pt.x + unitY / widthFactor - unitX,
          pt.y - unitY - unitX / widthFactor
        );
        canvas.close();

        if (filled) {
          canvas.fillAndStroke();
        } else {
          canvas.stroke();
        }
      };
    };
  }

  MarkerShape.addMarker('classic', createArrow(2));
  MarkerShape.addMarker('classicThin', createArrow(3));
  MarkerShape.addMarker('block', createArrow(2));
  MarkerShape.addMarker('blockThin', createArrow(3));

  function createOpenArrow(widthFactor = 2) {
    return (
      canvas: AbstractCanvas2D,
      shape: Shape,
      type: ArrowValue,
      pe: Point,
      unitX: number,
      unitY: number,
      size: number,
      source: boolean,
      sw: number,
      filled: boolean
    ) => {
      // The angle of the forward facing arrow sides against the x axis is
      // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
      // only half the strokewidth is processed ).
      const endOffsetX = unitX * sw * 1.118;
      const endOffsetY = unitY * sw * 1.118;

      unitX *= size + sw;
      unitY *= size + sw;

      const pt = pe.clone();
      pt.x -= endOffsetX;
      pt.y -= endOffsetY;

      pe.x += -endOffsetX * 2;
      pe.y += -endOffsetY * 2;

      return () => {
        canvas.begin();
        canvas.moveTo(
          pt.x - unitX - unitY / widthFactor,
          pt.y - unitY + unitX / widthFactor
        );
        canvas.lineTo(pt.x, pt.y);
        canvas.lineTo(
          pt.x + unitY / widthFactor - unitX,
          pt.y - unitY - unitX / widthFactor
        );
        canvas.stroke();
      };
    };
  }

  MarkerShape.addMarker('open', createOpenArrow(2));
  MarkerShape.addMarker('openThin', createOpenArrow(3));

  MarkerShape.addMarker(
    'oval',
    (
      canvas: AbstractCanvas2D,
      shape: Shape,
      type: ArrowValue,
      pe: Point,
      unitX: number,
      unitY: number,
      size: number,
      source: boolean,
      sw: number,
      filled: boolean
    ) => {
      const a = size / 2;

      const pt = pe.clone();
      pe.x -= unitX * a;
      pe.y -= unitY * a;

      return () => {
        canvas.ellipse(pt.x - a, pt.y - a, size, size);

        if (filled) {
          canvas.fillAndStroke();
        } else {
          canvas.stroke();
        }
      };
    }
  );

  function diamond(
    canvas: AbstractCanvas2D,
    shape: Shape,
    type: ArrowValue,
    pe: Point,
    unitX: number,
    unitY: number,
    size: number,
    source: boolean,
    sw: number,
    filled: boolean
  ) {
    // The angle of the forward facing arrow sides against the x axis is
    // 45 degrees, 1/sin(45) = 1.4142 / 2 = 0.7071 ( / 2 allows for
    // only half the strokewidth is processed ). Or 0.9862 for thin diamond.
    // Note these values and the tk variable below are dependent, update
    // both together (saves trig hard coding it).
    const swFactor = type === ARROW.DIAMOND ? 0.7071 : 0.9862;
    const endOffsetX = unitX * sw * swFactor;
    const endOffsetY = unitY * sw * swFactor;

    unitX *= size + sw;
    unitY *= size + sw;

    const pt = pe.clone();
    pt.x -= endOffsetX;
    pt.y -= endOffsetY;

    pe.x += -unitX - endOffsetX;
    pe.y += -unitY - endOffsetY;

    // thickness factor for diamond
    const tk = type === ARROW.DIAMOND ? 2 : 3.4;

    return () => {
      canvas.begin();
      canvas.moveTo(pt.x, pt.y);
      canvas.lineTo(pt.x - unitX / 2 - unitY / tk, pt.y + unitX / tk - unitY / 2);
      canvas.lineTo(pt.x - unitX, pt.y - unitY);
      canvas.lineTo(pt.x - unitX / 2 + unitY / tk, pt.y - unitY / 2 - unitX / tk);
      canvas.close();

      if (filled) {
        canvas.fillAndStroke();
      } else {
        canvas.stroke();
      }
    };
  }

  MarkerShape.addMarker('diamond', diamond);
  MarkerShape.addMarker('diamondThin', diamond);
})();

export default MarkerShape;
