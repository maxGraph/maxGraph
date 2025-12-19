/*
Copyright 2024-present The maxGraph project Contributors

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

import { describe, expect, test } from '@jest/globals';
import {
  ConsoleLogger,
  GlobalConfig,
  resetGlobalConfig,
  resetStyleDefaultsConfig,
  StyleDefaultsConfig,
  TranslationsAsI18n,
} from '../../src';

test('resetGlobalConfig', () => {
  // Keep track of original default values
  const originalConfig = { ...GlobalConfig };
  const originalLogger = GlobalConfig.logger;
  const originalI18n = GlobalConfig.i18n;

  // Change some values
  GlobalConfig.logger = new ConsoleLogger();
  GlobalConfig.i18n = new TranslationsAsI18n();

  expect(GlobalConfig.logger).not.toBe(originalLogger);
  expect(GlobalConfig.i18n).not.toBe(originalI18n);

  resetGlobalConfig();

  // Ensure that the values are correctly reset
  expect(GlobalConfig.logger).toBe(originalLogger);
  expect(GlobalConfig.i18n).toBe(originalI18n);
  expect(GlobalConfig).toStrictEqual(originalConfig);
});

test('resetStyleDefaultsConfig', () => {
  // Keep track of original default values
  const originalConfig = { ...StyleDefaultsConfig };

  // Change some values
  StyleDefaultsConfig.shadowColor = 'pink';
  StyleDefaultsConfig.shadowOffsetX = 20;

  resetStyleDefaultsConfig();

  // Ensure that the values are correctly reset
  expect(StyleDefaultsConfig.shadowColor).toBe('gray');
  expect(StyleDefaultsConfig.shadowOffsetX).toBe(2);
  expect(StyleDefaultsConfig).toStrictEqual(originalConfig);
});
