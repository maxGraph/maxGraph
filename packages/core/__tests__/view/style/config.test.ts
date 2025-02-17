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
import { OrthConnectorConfig, resetOrthConnectorConfig } from '../../../src';

test('resetOrthConnectorConfig', () => {
  // Keep track of original default values
  const originalConfig = { ...OrthConnectorConfig };

  // Change some values
  OrthConnectorConfig.buffer = 18;
  OrthConnectorConfig.pointsFallback = false;

  resetOrthConnectorConfig();

  // Ensure that the values have correctly been reset
  expect(OrthConnectorConfig.buffer).toBe(10);
  expect(OrthConnectorConfig.pointsFallback).toBeTruthy();
  expect(OrthConnectorConfig).toStrictEqual(originalConfig);
});
