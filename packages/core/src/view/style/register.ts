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

import { EDGESTYLE, PERIMETER } from '../../util/Constants';
import { EdgeStyle } from './edge';
import { Perimeter } from './perimeter';
import StyleRegistry from './StyleRegistry';
import MarkerShape from './marker/EdgeMarkerRegistry';
import { createArrow, createOpenArrow, diamond, oval } from './marker/edge-markers';
import type {
  EdgeStyleFunction,
  MarkerFactoryFunction,
  PerimeterFunction,
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
    const edgeStylesToRegister: [string, EdgeStyleFunction][] = [
      [EDGESTYLE.ELBOW, EdgeStyle.ElbowConnector],
      [EDGESTYLE.ENTITY_RELATION, EdgeStyle.EntityRelation],
      [EDGESTYLE.LOOP, EdgeStyle.Loop],
      [EDGESTYLE.MANHATTAN, EdgeStyle.ManhattanConnector],
      [EDGESTYLE.ORTHOGONAL, EdgeStyle.OrthConnector],
      [EDGESTYLE.SEGMENT, EdgeStyle.SegmentConnector],
      [EDGESTYLE.SIDETOSIDE, EdgeStyle.SideToSide],
      [EDGESTYLE.TOPTOBOTTOM, EdgeStyle.TopToBottom],
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
    const perimetersToRegister: [string, PerimeterFunction][] = [
      [PERIMETER.ELLIPSE, Perimeter.EllipsePerimeter],
      [PERIMETER.HEXAGON, Perimeter.HexagonPerimeter],
      [PERIMETER.RECTANGLE, Perimeter.RectanglePerimeter],
      [PERIMETER.RHOMBUS, Perimeter.RhombusPerimeter],
      [PERIMETER.TRIANGLE, Perimeter.TrianglePerimeter],
    ];
    for (const [name, edgeStyle] of perimetersToRegister) {
      StyleRegistry.putValue(name, edgeStyle);
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
    const markersToRegister: [string, MarkerFactoryFunction][] = [
      ['classic', createArrow(2)],
      ['classicThin', createArrow(3)],
      ['block', createArrow(2)],
      ['blockThin', createArrow(3)],
      ['open', createOpenArrow(2)],
      ['openThin', createOpenArrow(3)],
      ['oval', oval],
      ['diamond', diamond],
      ['diamondThin', diamond],
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
