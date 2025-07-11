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

import type { Registry } from '../types.js';

/**
 * Base implementation for all registries storing "style" configuration.
 * @private
 * @since 0.20.0
 */
export class BaseRegistry<V> implements Registry<V> {
  protected readonly values = new Map<string, V>();

  add(name: string, value: V): void {
    this.values.set(name, value);
  }

  get(name: string | null | undefined): V | null {
    return this.values.get(name!) ?? null;
  }

  getName(value: V | null): string | null {
    // Currently, the code performs a linear search through all entries.
    // This implementation is straightforward and works well for small registries, but could become a performance bottleneck if the registry grows large.
    // For the current use case of style registries, this is likely acceptable since the number of registered styles is typically small.
    // If performance becomes an issue, consider maintaining a reverse lookup map.
    for (const [name, style] of this.values.entries()) {
      if (style === value) {
        return name;
      }
    }
    return null;
  }

  clear(): void {
    this.values.clear();
  }
}
