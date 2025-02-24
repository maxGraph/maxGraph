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

import { expect, test } from '@jest/globals';
import { TranslationsConfig, resetTranslationsConfig } from '../../src';

function getTranslationsConfigValues() {
  return {
    defaultLanguage: TranslationsConfig.getDefaultLanguage(),
    language: TranslationsConfig.getLanguage(),
    languages: TranslationsConfig.getLanguages(),
  };
}

test('resetTranslationsConfig', () => {
  // Keep track of original default values
  const originalConfigValues = getTranslationsConfigValues();

  // Change some values
  TranslationsConfig.setDefaultLanguage('ja');
  TranslationsConfig.setLanguage('se');
  TranslationsConfig.setLanguages(['es', 'it', 'fr']);

  resetTranslationsConfig();

  // Ensure that the values have correctly been reset
  const newConfigValues = getTranslationsConfigValues();
  expect(newConfigValues).toStrictEqual(originalConfigValues);
});
