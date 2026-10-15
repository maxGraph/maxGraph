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
import { StackLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('execute', () => {
  test('stacks every child of the parent', () => {
    const graph = createGraphWithoutContainer();
    insertCells(graph, 'abc', []);

    graph.batchUpdate(() => {
      new StackLayout(graph).execute(graph.getDefaultParent());
    });

    expect(getPositions(graph)).toEqual({ a: [0, 0], b: [40, 0], c: [80, 0] });
  });
});
