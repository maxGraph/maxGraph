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

import { TranslationsConfig } from '../i18n/config';
import Translations from '../i18n/Translations';
import { GlobalConfig } from '../util/config';

/**
 * @internal
 */
export const doEval = (expression: string): any => {
  // eslint-disable-next-line no-eval -- valid here as we want this function to be the only place in the codebase that uses eval
  return eval(expression);
};

/**
 * @internal
 */
export function isI18nEnabled(): boolean {
  return GlobalConfig.i18n.isEnabled();
}

/**
 * @internal
 */
export function translate(
  key?: string | null,
  params?: any[] | null,
  defaultValue?: string
): string | null {
  return GlobalConfig.i18n.get(key, params, defaultValue);
}
