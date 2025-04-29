/*
Copyright 2024-present The maxGraph project Contributors

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

import { EdgeStyle, EdgeMarker, Perimeter } from './builtin-style-elements';
import StyleRegistry from './StyleRegistry';
import MarkerShape from './marker/EdgeMarkerRegistry';
import type {
  ArrowValue,
  EdgeStyleFunction,
  EdgeStyleValue,
  MarkerFactoryFunction,
  PerimeterFunction,
  PerimeterValue,
} from '../../types';

let isDefaultEdgeStylesRegistered = false;

/**
 * Register default builtin {@link EdgeStyle}s in {@link StyleRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const registerDefaultEdgeStyles = (): void => {
  if (!isDefaultEdgeStylesRegistered) {
    const edgeStylesToRegister: [EdgeStyleValue, EdgeStyleFunction][] = [
      ['elbowEdgeStyle', EdgeStyle.ElbowConnector],
      ['entityRelationEdgeStyle', EdgeStyle.EntityRelation],
      ['loopEdgeStyle', EdgeStyle.Loop],
      ['manhattanEdgeStyle', EdgeStyle.ManhattanConnector],
      ['orthogonalEdgeStyle', EdgeStyle.OrthConnector],
      ['segmentEdgeStyle', EdgeStyle.SegmentConnector],
      ['sideToSideEdgeStyle', EdgeStyle.SideToSide],
      ['topToBottomEdgeStyle', EdgeStyle.TopToBottom],
    ];
    for (const [name, edgeStyle] of edgeStylesToRegister) {
      StyleRegistry.putValue(name, edgeStyle);
    }

    isDefaultEdgeStylesRegistered = true;
  }
};

let isDefaultPerimetersRegistered = false;

/**
 * Register default builtin {@link Perimeter}s in {@link StyleRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const registerDefaultPerimeters = (): void => {
  if (!isDefaultPerimetersRegistered) {
    const perimetersToRegister: [PerimeterValue, PerimeterFunction][] = [
      ['ellipsePerimeter', Perimeter.EllipsePerimeter],
      ['hexagonPerimeter', Perimeter.HexagonPerimeter],
      ['rectanglePerimeter', Perimeter.RectanglePerimeter],
      ['rhombusPerimeter', Perimeter.RhombusPerimeter],
      ['trianglePerimeter', Perimeter.TrianglePerimeter],
    ];
    for (const [name, perimeter] of perimetersToRegister) {
      StyleRegistry.putValue(name, perimeter);
    }

    isDefaultPerimetersRegistered = true;
  }
};

/**
 * Unregister all {@link EdgeStyle}s and {@link Perimeter}s from {@link StyleRegistry}.
 *
 * **NOTE**: in the future, this function will be replaced by dedicated functions to remove `Perimeter` and `EdgeStyle` individually.
 * For more details, see [Issue #767](https://github.com/maxGraph/maxGraph/issues/767).
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const unregisterAllEdgeStylesAndPerimeters = (): void => {
  StyleRegistry.values = {};
  isDefaultEdgeStylesRegistered = false;
  isDefaultPerimetersRegistered = false;
};

let isDefaultMarkersRegistered = false;
/**
 *
 * Register default builtin {@link MarkerFactoryFunction}s in {@link MarkerShape}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const registerDefaultEdgeMarkers = (): void => {
  if (!isDefaultMarkersRegistered) {
    const markersToRegister: [ArrowValue, MarkerFactoryFunction][] = [
      ['classic', EdgeMarker.createArrow(2)],
      ['classicThin', EdgeMarker.createArrow(3)],
      ['block', EdgeMarker.createArrow(2)],
      ['blockThin', EdgeMarker.createArrow(3)],
      ['open', EdgeMarker.createOpenArrow(2)],
      ['openThin', EdgeMarker.createOpenArrow(3)],
      ['oval', EdgeMarker.oval],
      ['diamond', EdgeMarker.diamond],
      ['diamondThin', EdgeMarker.diamond],
    ];
    for (const [type, factory] of markersToRegister) {
      MarkerShape.addMarker(type, factory);
    }

    isDefaultMarkersRegistered = true;
  }
};
/**
 * Unregister all {@link MarkerFactoryFunction}s from {@link MarkerShape}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const unregisterAllEdgeMarkers = (): void => {
  MarkerShape.markers = {};
  isDefaultMarkersRegistered = false;
};
