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

import type { MarkerFactoryFunction, StyleArrowValue } from '../../../types';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D';
import type Point from '../../geometry/Point';
import type Shape from '../../geometry/Shape';

/**
 * A registry that stores the factory functions that create edge markers.
 *
 * NOTE: The signature and the name of in this class will change.
 */
class MarkerShape {
  /**
   * Maps from markers names to functions to paint the markers.
   *
   * Mapping: the attribute name on the object is the marker type, the associated value is the function to paint the marker
   */
  static markers: Record<string, MarkerFactoryFunction> = {};

  /**
   * Adds a factory method that updates a given endpoint and returns a
   * function to paint the marker onto the given canvas.
   */
  static addMarker(type: string, funct: MarkerFactoryFunction) {
    MarkerShape.markers[type] = funct;
  }

  /**
   * Returns a function to paint the given marker.
   */
  static createMarker(
    canvas: AbstractCanvas2D,
    shape: Shape,
    type: StyleArrowValue,
    pe: Point,
    unitX: number,
    unitY: number,
    size: number,
    source: boolean,
    sw: number,
    filled: boolean
  ) {
    const markerFunction = MarkerShape.markers[type];
    return markerFunction
      ? markerFunction(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
      : null;
  }
}

export default MarkerShape;
