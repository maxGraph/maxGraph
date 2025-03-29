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

import { I18nProvider } from '../types';
import { TranslationsConfig } from './config';
import Translations from './Translations';

/**
 * A {@link I18nProvider} that does nothing.
 *
 * @experimental subject to change or removal. The I18n system may be modified in the future without prior notice.
 * @since 0.17.0
 * @category I18n
 */
export class NoOpI18n implements I18nProvider {
  isEnabled() {
    return false;
  }

  get() {
    return null;
  }

  addResource(
    _basename: string,
    _language: string | null,
    _callback: Function | null
  ): void {
    // do nothing
  }
}

/**
 * A {@link I18nProvider} that uses {@link Translations} to manage translations.
 *
 * The configuration is done using {@link TranslationsConfig}.
 *
 * @experimental subject to change or removal. The I18n system may be modified in the future without prior notice.
 * @category I18n
 * @since 0.17.0
 */
export class TranslationsAsI18n implements I18nProvider {
  isEnabled(): boolean {
    return TranslationsConfig.isEnabled();
  }

  get(
    key?: string | null,
    params?: any[] | null,
    defaultValue?: string | null
  ): string | null {
    return Translations.get(key, params, defaultValue);
  }

  addResource(
    basename: string,
    language: string | null,
    callback: Function | null
  ): void {
    Translations.add(basename, language, callback);
  }
}
