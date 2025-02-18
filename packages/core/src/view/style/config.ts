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

import { DIRECTION, ENTITY_SEGMENT } from '../../util/Constants';
import { shallowCopy } from '../../util/cloneUtils';
import type { DirectionValue } from '../../types';

/**
 * Configure the {@link EdgeStyle.EntityRelation} connector.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.15.0
 * @category Configuration
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
 */
export const resetEntityRelationConnectorConfig = (): void => {
  // implement the reset manually as there are a few properties for now
  EntityRelationConnectorConfig.segment = ENTITY_SEGMENT;
};

/**
 * Configure the {@link EdgeStyle.OrthConnector}.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 */
export const OrthConnectorConfig = {
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

const originalOrthConnectorConfig = { ...OrthConnectorConfig };
/**
 * Resets {@link OrthConnectorConfig} to default values.
 *
 * @experimental Subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 */
export const resetOrthConnectorConfig = (): void => {
  shallowCopy(originalOrthConnectorConfig, OrthConnectorConfig);
};

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

/**
 * Configure the {@link EdgeStyle.ManhattanConnector}.
 *
 * @experimental subject to change or removal. maxGraph's global configuration may be modified in the future without prior notice.
 * @since 0.16.0
 * @category Configuration
 */
export const ManhattanConnectorConfig: ManhattanConnectorConfigType = {
  maxAllowedDirectionChange: 90,
  maxLoops: 2000,
  endDirections: Object.values(DIRECTION),
  startDirections: Object.values(DIRECTION),
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
 */
export const resetManhattanConnectorConfig = (): void => {
  shallowCopy(originalManhattanConnectorConfig, ManhattanConnectorConfig);
};
