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
import {
  EdgeHandlerConfig,
  HandleConfig,
  resetEdgeHandlerConfig,
  resetHandleConfig,
  resetVertexHandlerConfig,
  VertexHandlerConfig,
} from '../../../src';

test('resetEdgeHandlerConfig', () => {
  // Keep track of original default values
  const originalEdgeHandlerConfig = { ...EdgeHandlerConfig };

  // Change some values
  EdgeHandlerConfig.connectFillColor = 'red';
  EdgeHandlerConfig.selectionStrokeWidth = 4;

  resetEdgeHandlerConfig();

  // Ensure that the values have correctly been reset
  expect(EdgeHandlerConfig.connectFillColor).toBe('#0000FF');
  expect(EdgeHandlerConfig.selectionStrokeWidth).toBe(1);
  expect(EdgeHandlerConfig).toStrictEqual(originalEdgeHandlerConfig);
});

test('resetHandleConfig', () => {
  // Keep track of original default values
  const originalHandleConfig = { ...HandleConfig };

  // Change some values
  HandleConfig.labelSize = 12;
  HandleConfig.strokeColor = 'chartreuse';

  resetHandleConfig();

  // Ensure that the values have correctly been reset
  expect(HandleConfig.labelSize).toBe(4);
  expect(HandleConfig.strokeColor).toBe('black');
  expect(HandleConfig).toStrictEqual(originalHandleConfig);
});

test('resetVertexHandlerConfig', () => {
  // Keep track of original default values
  const originalVertexHandlerConfig = { ...VertexHandlerConfig };

  // Change some values
  VertexHandlerConfig.rotationEnabled = true;
  VertexHandlerConfig.selectionColor = 'chartreuse';

  resetVertexHandlerConfig();

  // Ensure that the values have correctly been reset
  expect(VertexHandlerConfig.rotationEnabled).toBe(false);
  expect(VertexHandlerConfig.selectionColor).toBe('#00FF00');
  expect(VertexHandlerConfig).toStrictEqual(originalVertexHandlerConfig);
});
