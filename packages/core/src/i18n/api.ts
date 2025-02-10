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

// TODO create a new JSDoc category, use it everywhere and configure it for use by typedoc

/**
 * @experimental subject to change or removal. The XXX system may be modified in the future without prior notice.
 * @since 0.xx.0
 */
// TODO find a better name (same for concrete implementations)
// TODO move to the root types.ts file for consistency with other types
export interface I18nProvider {
  /**
   * Returns whether internationalization is enabled.
   */
  isEnabled(): boolean;

  // TODO find a better name for the method
  get(key: string, params?: any[] | null, defaultValue?: string | null): string | null;
}

/**
 * A {@link I18nProvider} that does nothing.
 *
 * @experimental subject to change or removal. The XXX system may be modified in the future without prior notice.
 * @since 0.XXX.0
 * @category YYYY
 */
export class NoOpI18n implements I18nProvider {
  isEnabled() {
    return false;
  }

  get(_key: string) {
    // TODO temp implementation
    console.warn('NoOpI18n.get() called with key' + _key);
    return null;
  }
}
