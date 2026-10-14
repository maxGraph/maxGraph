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

import { afterEach, beforeEach, expect, test } from '@jest/globals';
import { BaseGraph } from '../../../src';
import Multiplicity from '../../../src/view/other/Multiplicity';

let graph: BaseGraph;

beforeEach(() => {
  graph = new BaseGraph();
});

afterEach(() => {
  graph.destroy();
});

test.each([
  ['the first valid neighbor', 'first', true],
  ['the last valid neighbor', 'last', true],
  ['no valid neighbor', 'other', false],
])('checkNeighbors with a target matching %s', (_description, targetValue, expected) => {
  const multiplicity = new Multiplicity(
    true,
    'source',
    null,
    null,
    0,
    1,
    ['first', 'last'],
    null,
    null
  );
  const source = graph.insertVertex({ value: 'source' });
  const target = graph.insertVertex({ value: targetValue });
  const edge = graph.insertEdge({ source, target });

  expect(multiplicity.checkNeighbors(graph, edge, source, target)).toBe(expected);
});
