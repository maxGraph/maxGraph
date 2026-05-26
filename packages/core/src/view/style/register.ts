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

import { EdgeStyle, EdgeMarker, Perimeter } from './builtin-style-elements.js';
import { EdgeStyleRegistry } from './edge/EdgeStyleRegistry.js';
import { EdgeMarkerRegistry } from './marker/EdgeMarkerRegistry.js';
import { PerimeterRegistry } from './perimeter/PerimeterRegistry.js';
import type {
  ArrowValue,
  MarkerFactoryFunction,
  PerimeterFunction,
  PerimeterValue,
} from '../../types.js';

/**
 * Register the {@link ElbowConnector} with its metadata.
 *
 * @category Configuration
 * @category Style
 * @since 0.24.0
 */
export const registerElbowEdgeStyle = (): void => {
  EdgeStyleRegistry.add('elbowEdgeStyle', EdgeStyle.ElbowConnector, {
    handlerKind: 'elbow',
    isOrthogonal: true,
  });
};

/**
 * Register the {@link EntityRelation} edge style with its metadata.
 *
 * @category Configuration
 * @category Style
 * @since 0.24.0
 */
export const registerEntityRelationEdgeStyle = (): void => {
  EdgeStyleRegistry.add('entityRelationEdgeStyle', EdgeStyle.EntityRelation, {
    allowIntermediateHandles: false,
    isOrthogonal: true,
  });
};

/**
 * Register the {@link Loop} edge style with its metadata.
 *
 * @category Configuration
 * @category Style
 * @since 0.24.0
 */
export const registerLoopEdgeStyle = (): void => {
  EdgeStyleRegistry.add('loopEdgeStyle', EdgeStyle.Loop, {
    handlerKind: 'elbow',
    isOrthogonal: false,
  });
};

/**
 * Register the {@link ManhattanConnector} edge style with its metadata.
 *
 * @category Configuration
 * @category Style
 * @since 0.24.0
 */
export const registerManhattanEdgeStyle = (): void => {
  EdgeStyleRegistry.add('manhattanEdgeStyle', EdgeStyle.ManhattanConnector, {
    handlerKind: 'segment',
    isOrthogonal: true,
  });
};

/**
 * Register the {@link OrthConnector} edge style with its metadata.
 *
 * @category Configuration
 * @category Style
 * @since 0.24.0
 */
export const registerOrthogonalEdgeStyle = (): void => {
  EdgeStyleRegistry.add('orthogonalEdgeStyle', EdgeStyle.OrthConnector, {
    handlerKind: 'segment',
    isOrthogonal: true,
  });
};

/**
 * Register the {@link SegmentConnector} edge style with its metadata.
 *
 * @category Configuration
 * @category Style
 * @since 0.24.0
 */
export const registerSegmentEdgeStyle = (): void => {
  EdgeStyleRegistry.add('segmentEdgeStyle', EdgeStyle.SegmentConnector, {
    handlerKind: 'segment',
    isOrthogonal: true,
  });
};

/**
 * Register the {@link SideToSide} edge style with its metadata.
 *
 * @category Configuration
 * @category Style
 * @since 0.24.0
 */
export const registerSideToSideEdgeStyle = (): void => {
  EdgeStyleRegistry.add('sideToSideEdgeStyle', EdgeStyle.SideToSide, {
    handlerKind: 'elbow',
    isOrthogonal: true,
  });
};

/**
 * Register the {@link TopToBottom} edge style with its metadata.
 *
 * @category Configuration
 * @category Style
 * @since 0.24.0
 */
export const registerTopToBottomEdgeStyle = (): void => {
  EdgeStyleRegistry.add('topToBottomEdgeStyle', EdgeStyle.TopToBottom, {
    handlerKind: 'elbow',
    isOrthogonal: true,
  });
};

let isDefaultEdgeStylesRegistered = false;

/**
 * Register default builtin {@link EdgeStyle}s in {@link EdgeStyleRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const registerDefaultEdgeStyles = (): void => {
  if (!isDefaultEdgeStylesRegistered) {
    registerElbowEdgeStyle();
    registerEntityRelationEdgeStyle();
    registerLoopEdgeStyle();
    registerManhattanEdgeStyle();
    registerOrthogonalEdgeStyle();
    registerSegmentEdgeStyle();
    registerSideToSideEdgeStyle();
    registerTopToBottomEdgeStyle();

    isDefaultEdgeStylesRegistered = true;
  }
};

let isDefaultPerimetersRegistered = false;

/**
 * Register default builtin {@link Perimeter}s in {@link PerimeterRegistry}.
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
      PerimeterRegistry.add(name, perimeter);
    }

    isDefaultPerimetersRegistered = true;
  }
};

/**
 * Unregister all {@link EdgeStyle}s and {@link Perimeter}s from their registries.
 *
 * @see unregisterAllEdgeStyles
 * @see unregisterAllPerimeters
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const unregisterAllEdgeStylesAndPerimeters = (): void => {
  unregisterAllEdgeStyles();
  unregisterAllPerimeters();
};

/**
 * Unregister all {@link EdgeStyle}s from {@link EdgeStyleRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.20.0
 */
export const unregisterAllEdgeStyles = (): void => {
  EdgeStyleRegistry.clear();
  isDefaultEdgeStylesRegistered = false;
};

/**
 * Unregister all {@link Perimeter}s from {@link PerimeterRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.20.0
 */
export const unregisterAllPerimeters = (): void => {
  PerimeterRegistry.clear();
  isDefaultPerimetersRegistered = false;
};

let isDefaultMarkersRegistered = false;
/**
 *
 * Register default builtin {@link MarkerFactoryFunction}s in {@link EdgeMarkerRegistry}.
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
      EdgeMarkerRegistry.add(type, factory);
    }

    isDefaultMarkersRegistered = true;
  }
};
/**
 * Unregister all {@link MarkerFactoryFunction}s from {@link EdgeMarkerRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export const unregisterAllEdgeMarkers = (): void => {
  EdgeMarkerRegistry.clear();
  isDefaultMarkersRegistered = false;
};
