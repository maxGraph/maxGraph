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

import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { FastOrganicLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('execute', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('moves every vertex according to the forces of its edges', () => {
    const graph = createGraphWithoutContainer();
    const vertices = insertCells(graph, 'abcd', ['ab', 'ac', 'bc', 'cd']);
    // The layout moves vertices sharing a coordinate by a random distance
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    graph.batchUpdate(() => {
      graph.moveCells([vertices.get('b')!], 30, 40);
      graph.moveCells([vertices.get('c')!], 60, 0);
      graph.moveCells([vertices.get('d')!], 90, 40);
    });

    graph.batchUpdate(() => {
      new FastOrganicLayout(graph).execute(graph.getDefaultParent());
    });

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      a: [1, 61], b: [11, 1], c: [61, 41], d: [131, 51],
      ab: null, ac: null, bc: null, cd: null,
    });
  });
});
