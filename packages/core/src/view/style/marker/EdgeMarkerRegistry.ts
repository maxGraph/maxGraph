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

import type {
  EdgeMarkerRegistryInterface,
  MarkerFactoryFunction,
  MarkerFunction,
  StyleArrowValue,
} from '../../../types.js';
import type AbstractCanvas2D from '../../canvas/AbstractCanvas2D.js';
import type Point from '../../geometry/Point.js';
import type Shape from '../../shape/Shape.js';
import { BaseRegistry } from '../../../internal/BaseRegistry.js';

class EdgeMarkerRegistryImpl
  extends BaseRegistry<MarkerFactoryFunction>
  implements EdgeMarkerRegistryInterface
{
  createMarker(
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
  ): MarkerFunction | null {
    const markerFunction = this.get(type);
    return markerFunction
      ? markerFunction(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled)
      : null;
  }
}

/**
 * A registry that stores the {@link MarkerFactoryFunction}s and their configuration to let generate {@link MarkerFunction}.
 *
 * The name used to register the marker is the marker type. It is then used to create the marker with {@link createMarker}.
 *
 * @category Configuration
 * @category Style
 * @since 0.20.0
 */
export const EdgeMarkerRegistry: EdgeMarkerRegistryInterface =
  new EdgeMarkerRegistryImpl();
