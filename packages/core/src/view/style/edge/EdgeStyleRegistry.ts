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
  EdgeStyleRegistryInterface,
} from '../../../types.js';
import { isNullish } from '../../../internal/utils.js';
import { BaseRegistry } from '../../../internal/BaseRegistry.js';

/**
 * @private
 */
class EdgeStyleRegistryImpl
  extends BaseRegistry<EdgeStyleFunction>
  implements EdgeStyleRegistryInterface
{
  private readonly handlerMapping = new Map<EdgeStyleFunction, EdgeStyleHandlerKind>();
  private readonly orthogonalStates = new Map<EdgeStyleFunction, boolean>();
  private readonly intermediateHandlesStates = new Map<EdgeStyleFunction, boolean>();

  override add(
    name: string,
    edgeStyle: EdgeStyleFunction,
    metaData?: EdgeStyleMetaData
  ): void {
    super.add(name, edgeStyle);
    metaData?.handlerKind && this.handlerMapping.set(edgeStyle, metaData.handlerKind);
    !isNullish(metaData?.isOrthogonal) &&
      this.orthogonalStates.set(edgeStyle, metaData.isOrthogonal);
    !isNullish(metaData?.allowIntermediateHandles) &&
      this.intermediateHandlesStates.set(edgeStyle, metaData.allowIntermediateHandles);
  }

  isOrthogonal(edgeStyle?: EdgeStyleFunction | null): boolean {
    return this.orthogonalStates.get(edgeStyle!) ?? false;
  }

  getHandlerKind(edgeStyle?: EdgeStyleFunction | null): EdgeStyleHandlerKind {
    return this.handlerMapping.get(edgeStyle!) ?? 'default';
  }

  allowsIntermediateHandles(edgeStyle?: EdgeStyleFunction | null): boolean {
    return this.intermediateHandlesStates.get(edgeStyle!) ?? true;
  }

  override clear(): void {
    super.clear();
    this.handlerMapping.clear();
    this.orthogonalStates.clear();
    this.intermediateHandlesStates.clear();
  }
}

/**
 * A registry that stores the {@link EdgeStyle}s and their configuration.
 *
 * @since 0.20.0
 * @category Style
 * @category Configuration
 */
export const EdgeStyleRegistry: EdgeStyleRegistryInterface = new EdgeStyleRegistryImpl();
