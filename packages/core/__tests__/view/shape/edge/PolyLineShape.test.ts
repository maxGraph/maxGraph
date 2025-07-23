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

import { afterEach, expect } from '@jest/globals';
import PolylineShape from '../../../../src/view/shape/edge/PolylineShape';
import AbstractCanvas2D from '../../../../src/view/canvas/AbstractCanvas2D';

afterEach(() => {
  jest.clearAllMocks();
});

test('paintLine uses correct arc size', () => {
  const polylineShape = new PolylineShape([], 'red');
  const addPoints = jest.spyOn(polylineShape, 'addPoints');
  // Mock only the methods used by PolylineShape.paintLine
  const canvas2D = {
    begin: jest.fn(),
    stroke: jest.fn(),
  } as unknown as AbstractCanvas2D;

  polylineShape.paintLine(canvas2D, [], true);

  const expectedUsedArcSize = 10; // no style set, so the value is derived from the default
  expect(addPoints).toHaveBeenCalledWith(canvas2D, [], true, expectedUsedArcSize, false);
});
