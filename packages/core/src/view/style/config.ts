/*
Copyright 2025-present The maxGraph project Contributors

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

import { ENTITY_SEGMENT } from '../../util/Constants.js';
import { shallowCopy } from '../../internal/clone-utils.js';
import type { DirectionValue } from '../../types.js';

/**
 * Configure the {@link EntityRelation} connector.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.15.0
 * @category Configuration
 * @category EdgeStyle
 */
export const EntityRelationConnectorConfig = {
  /**
   * Defines the length of the horizontal segment of an `Entity Relation`.
   * This can be overridden using {@link CellStateStyle.segment} style.
   * @default {@link ENTITY_SEGMENT}
   */
  segment: ENTITY_SEGMENT,
};

/**
 * Resets {@link EntityRelationConnectorConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.15.0
 * @category Configuration
 * @category EdgeStyle
 */
export const resetEntityRelationConnectorConfig = (): void => {
  // implement the reset manually as there are a few properties for now
  EntityRelationConnectorConfig.segment = ENTITY_SEGMENT;
};

/**
 * Configure the {@link OrthConnector}.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 * @category EdgeStyle
 */
export const OrthogonalConnectorConfig = {
  /**
   * If the value is not set in {@link CellStateStyle.jettySize}, defines the jetty size of the connector.
   *
   * If the computed value of the jetty size coming from {@link CellStateStyle} is 'auto', it is used in the computation of the automatic jetty size.
   * See the implementation of {@link OrthConnector} for more details.
   *
   * @default 10
   */
  buffer: 10,

  /**
   * See the implementation of {@link OrthConnector} for more details.
   * @default true
   */
  pointsFallback: true,
};

const originalOrthogonalConnectorConfig = { ...OrthogonalConnectorConfig };
/**
 * Resets {@link OrthogonalConnectorConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 * @category EdgeStyle
 */
export const resetOrthogonalConnectorConfig = (): void => {
  shallowCopy(originalOrthogonalConnectorConfig, OrthogonalConnectorConfig);
};

/**
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 * @category EdgeStyle
 */
export type ManhattanConnectorConfigType = {
  /**
   * Limit for directions change when searching route.
   * @default 90
   */
  maxAllowedDirectionChange: number;
  /**
   * If number of route finding loops exceed the maximum, stops searching and returns fallback route
   */
  maxLoops: number;
  /**
   * Possible ending directions from an element.
   *
   * @default all directions
   */
  endDirections: DirectionValue[];
  /**
   * Possible starting directions from an element.
   *
   * @default all directions
   */
  startDirections: DirectionValue[];
  /**
   * Size of the step to find a route.
   *
   * @default 12
   */
  step: number;
};

const allDirections = (): DirectionValue[] => {
  return ['north', 'south', 'east', 'west'];
};

/**
 * Configure the {@link ManhattanConnector}.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 * @category EdgeStyle
 */
export const ManhattanConnectorConfig: ManhattanConnectorConfigType = {
  maxAllowedDirectionChange: 90,
  maxLoops: 2000,
  endDirections: allDirections(),
  startDirections: allDirections(),
  step: 12,
};

const originalManhattanConnectorConfig = {} as typeof ManhattanConnectorConfig;
shallowCopy(ManhattanConnectorConfig, originalManhattanConnectorConfig);
/**
 * Resets {@link ManhattanConnectorConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 * @category EdgeStyle
 */
export const resetManhattanConnectorConfig = (): void => {
  shallowCopy(originalManhattanConnectorConfig, ManhattanConnectorConfig);
};
