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

import { ENTITY_SEGMENT } from '../../util/Constants';

/**
 * Configure the `Entity Relation connector` defaults for maxGraph.
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
