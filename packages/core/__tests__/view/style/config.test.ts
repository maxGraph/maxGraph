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

import { describe, expect, test } from '@jest/globals';
import {
  ManhattanConnectorConfig,
  OrthogonalConnectorConfig,
  resetManhattanConnectorConfig,
  resetOrthogonalConnectorConfig,
} from '../../../src';
import { DIRECTION } from '../../../src/util/Constants';

test('resetOrthogonalConnectorConfig', () => {
  // Keep track of original default values
  const originalConfig = { ...OrthogonalConnectorConfig };

  // Change some values
  OrthogonalConnectorConfig.buffer = 18;
  OrthogonalConnectorConfig.pointsFallback = false;

  resetOrthogonalConnectorConfig();

  // Ensure that the values have correctly been reset
  expect(OrthogonalConnectorConfig.buffer).toBe(10);
  expect(OrthogonalConnectorConfig.pointsFallback).toBeTruthy();
  expect(OrthogonalConnectorConfig).toStrictEqual(originalConfig);
});

describe('resetManhattanConnectorConfig', () => {
  test('simple values', () => {
    // Keep track of original default values
    const originalConfig = { ...ManhattanConnectorConfig };

    // Change some values
    ManhattanConnectorConfig.maxLoops = 100;
    ManhattanConnectorConfig.step = 60;

    resetManhattanConnectorConfig();

    // Ensure that the values have correctly been reset
    expect(ManhattanConnectorConfig.maxLoops).toBe(2000);
    expect(ManhattanConnectorConfig.step).toBe(12);
    expect(ManhattanConnectorConfig).toStrictEqual(originalConfig);
  });
  test('original direction arrays are kept untouched', () => {
    const originalEndDirections = [...ManhattanConnectorConfig.endDirections];
    const originalStartDirections = [...ManhattanConnectorConfig.startDirections];

    // Change some values
    ManhattanConnectorConfig.endDirections = [DIRECTION.NORTH, DIRECTION.SOUTH];
    ManhattanConnectorConfig.startDirections.push(DIRECTION.NORTH, DIRECTION.SOUTH);

    resetManhattanConnectorConfig();

    expect(ManhattanConnectorConfig.endDirections).toEqual(originalEndDirections);
    expect(ManhattanConnectorConfig.startDirections).toEqual(originalStartDirections);
  });
});
