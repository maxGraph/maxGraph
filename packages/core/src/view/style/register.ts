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
import EdgeStyle from './EdgeStyle';
import Perimeter from './Perimeter';
import StyleRegistry from './StyleRegistry';
import MarkerShape from './EdgeMarkerRegistry';
import { createArrow, createOpenArrow, diamond, oval } from './edge-markers';

let isDefaultEdgeStylesRegistered = false;

/**
 * Register default builtin {@link EdgeStyle}s in {@link StyleRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const registerDefaultEdgeStyles = (): void => {
  registerDefaultPerimeters();

  if (!isDefaultEdgeStylesRegistered) {
    StyleRegistry.putValue(EDGESTYLE.ELBOW, EdgeStyle.ElbowConnector);
    StyleRegistry.putValue(EDGESTYLE.ENTITY_RELATION, EdgeStyle.EntityRelation);
    StyleRegistry.putValue(EDGESTYLE.LOOP, EdgeStyle.Loop);
    StyleRegistry.putValue(EDGESTYLE.MANHATTAN, EdgeStyle.ManhattanConnector);
    StyleRegistry.putValue(EDGESTYLE.ORTHOGONAL, EdgeStyle.OrthConnector);
    StyleRegistry.putValue(EDGESTYLE.SEGMENT, EdgeStyle.SegmentConnector);
    StyleRegistry.putValue(EDGESTYLE.SIDETOSIDE, EdgeStyle.SideToSide);
    StyleRegistry.putValue(EDGESTYLE.TOPTOBOTTOM, EdgeStyle.TopToBottom);

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
    StyleRegistry.putValue(PERIMETER.ELLIPSE, Perimeter.EllipsePerimeter);
    StyleRegistry.putValue(PERIMETER.HEXAGON, Perimeter.HexagonPerimeter);
    StyleRegistry.putValue(PERIMETER.RECTANGLE, Perimeter.RectanglePerimeter);
    StyleRegistry.putValue(PERIMETER.RHOMBUS, Perimeter.RhombusPerimeter);
    StyleRegistry.putValue(PERIMETER.TRIANGLE, Perimeter.TrianglePerimeter);

    isDefaultPerimetersRegistered = true;
  }
};

/**
 * Unregister all {@link EdgeStyle}s and {@link Perimeter}s from {@link StyleRegistry}.
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
    MarkerShape.addMarker('classic', createArrow(2));
    MarkerShape.addMarker('classicThin', createArrow(3));
    MarkerShape.addMarker('block', createArrow(2));
    MarkerShape.addMarker('blockThin', createArrow(3));

    MarkerShape.addMarker('open', createOpenArrow(2));
    MarkerShape.addMarker('openThin', createOpenArrow(3));

    MarkerShape.addMarker('oval', oval);

    MarkerShape.addMarker('diamond', diamond);
    MarkerShape.addMarker('diamondThin', diamond);

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
