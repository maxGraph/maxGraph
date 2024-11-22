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
  // Ensure that some default values are correctly set
  expect(EdgeHandlerConfig.connectFillColor).toBe('#0000FF');
  expect(EdgeHandlerConfig.selectionStrokeWidth).toBe(1);

  // Change the default values
  EdgeHandlerConfig.connectFillColor = 'red';
  EdgeHandlerConfig.selectionStrokeWidth = 4;

  // Ensure that the values are correctly reset
  resetEdgeHandlerConfig();
  expect(EdgeHandlerConfig.connectFillColor).toBe('#0000FF');
  expect(EdgeHandlerConfig.selectionStrokeWidth).toBe(1);
});

test('resetHandleConfig', () => {
  // Ensure that some default values are correctly set
  expect(HandleConfig.labelSize).toBe(4);
  expect(HandleConfig.strokeColor).toBe('black');

  // Change the default values
  HandleConfig.labelSize = 12;
  HandleConfig.strokeColor = 'chartreuse';

  // Ensure that the values are correctly reset
  resetHandleConfig();
  expect(HandleConfig.labelSize).toBe(4);
  expect(HandleConfig.strokeColor).toBe('black');
});

test('resetVertexHandlerConfig', () => {
  // Ensure that some default values are correctly set
  expect(VertexHandlerConfig.rotationEnabled).toBe(false);
  expect(VertexHandlerConfig.selectionColor).toBe('#00FF00');

  // Change the default values
  VertexHandlerConfig.rotationEnabled = true;
  VertexHandlerConfig.selectionColor = 'chartreuse';

  // Ensure that the values are correctly reset
  resetVertexHandlerConfig();
  expect(VertexHandlerConfig.rotationEnabled).toBe(false);
  expect(VertexHandlerConfig.selectionColor).toBe('#00FF00');
});
