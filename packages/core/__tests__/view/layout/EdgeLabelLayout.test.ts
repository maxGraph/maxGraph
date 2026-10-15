/*
Copyright 2026-present The maxGraph project Contributors

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

import { describe, expect, jest, test } from '@jest/globals';
import { type CellState, EdgeLabelLayout, Rectangle } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';

const createEdgeStateWithLabel = () =>
  ({ text: { boundingBox: new Rectangle(0, 0, 10, 10) } }) as unknown as CellState;

describe('placeLabels', () => {
  test('moves the label of every edge away from every vertex', () => {
    const layout = new EdgeLabelLayout(createGraphWithoutContainer(), 0);
    const avoidSpy = jest.spyOn(layout, 'avoid').mockImplementation(() => {});
    const vertices = [{} as CellState, {} as CellState];
    const edges = [createEdgeStateWithLabel(), createEdgeStateWithLabel()];

    layout.placeLabels(vertices, edges);

    expect(avoidSpy.mock.calls).toEqual([
      [edges[0], vertices[0]],
      [edges[0], vertices[1]],
      [edges[1], vertices[0]],
      [edges[1], vertices[1]],
    ]);
  });
});
