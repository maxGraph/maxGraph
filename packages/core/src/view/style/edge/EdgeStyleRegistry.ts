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

import type {
  EdgeStyleFunction,
  EdgeStyleHandlerKind,
  EdgeStyleMetaData,
} from '../../../types';
import { isNullish } from '../../../internal/utils';
import { BaseRegistry } from '../../../util/BaseRegistry';

/**
 * Implementation of the {@link EdgeStyleRegistry}.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export class EdgeStyleRegistryImpl extends BaseRegistry<EdgeStyleFunction> {
  private handlerMapping = new Map<EdgeStyleFunction, EdgeStyleHandlerKind>();
  private orthogonalStates = new Map<EdgeStyleFunction, boolean>();

  add(name: string, edgeStyle: EdgeStyleFunction, metaData?: EdgeStyleMetaData): void {
    super.add(name, edgeStyle);
    metaData?.handlerKind && this.handlerMapping.set(edgeStyle, metaData.handlerKind);
    !isNullish(metaData?.isOrthogonal) &&
      this.orthogonalStates.set(edgeStyle, metaData.isOrthogonal);
  }

  /**
   * Retrieves the orthogonal state of the specified `edgeStyle` as it was registered.
   *
   * If the `edgeStyle` is not registered or the orthogonal state was not set during registration, this method returns `false`.
   */
  isOrthogonal(edgeStyle: EdgeStyleFunction): boolean {
    return this.orthogonalStates.get(edgeStyle) ?? false;
  }

  /**
   * Retrieves the handler kind of the specified `edgeStyle` as it was registered.
   *
   * If the `edgeStyle` is not registered or the `handlerKind` was not set during registration, this method returns  `'default'`.
   */
  getHandlerKind(edgeStyle: EdgeStyleFunction): EdgeStyleHandlerKind {
    return this.handlerMapping.get(edgeStyle) ?? 'default';
  }

  /**
   * **WARNING**: this method should not be called directly. Call the {@link unregisterAllEdgeStyles} function instead.
   * @private
   */
  clear(): void {
    super.clear();
    this.handlerMapping.clear();
    this.orthogonalStates.clear();
  }
}

/**
 * A registry that stores the {@link EdgeStyle}s and their configuration.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export const EdgeStyleRegistry = new EdgeStyleRegistryImpl();
