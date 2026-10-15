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

import { describe, expect, test } from '@jest/globals';
import { CompactTreeLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('execute', () => {
  test('lays out every vertex of the tree, and routes every edge', () => {
    const graph = createGraphWithoutContainer();
    insertCells(graph, 'rabcd', ['ra', 'rb', 'ac', 'ad']);

    graph.batchUpdate(() => {
      new CompactTreeLayout(graph).execute(graph.getDefaultParent());
    });

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      r: [0, 75], a: [70, 30], b: [70, 120], c: [140, 0], d: [140, 60],
      ra: [[40, 80], [44, 80], [44, 40]],
      rb: [[40, 90], [48, 90], [48, 130]],
      ac: [[110, 35], [114, 35], [114, 10]],
      ad: [[110, 45], [118, 45], [118, 70]],
    });
  });
});
