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

import { expect, test } from '@jest/globals';
import { resetStyleDefaultsConfig, StyleDefaultsConfig } from '../../src';

test('resetStyleDefaultsConfig', () => {
  // Keep track of original default values
  const originalStyleDefaultsConfig = { ...StyleDefaultsConfig };

  // Change some values
  StyleDefaultsConfig.shadowColor = 'pink';
  StyleDefaultsConfig.shadowOffsetX = 20;

  resetStyleDefaultsConfig();

  // Ensure that the values are correctly reset
  expect(StyleDefaultsConfig.shadowColor).toBe('gray');
  expect(StyleDefaultsConfig.shadowOffsetX).toBe(2);
  expect(StyleDefaultsConfig).toStrictEqual(originalStyleDefaultsConfig);
});
