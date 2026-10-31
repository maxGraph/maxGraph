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

import { beforeEach, expect, test } from '@jest/globals';
import { BaseGraph, type CellState, Point, Rectangle } from '../../../src';
import Guide from '../../../src/view/other/Guide';
import { createBaseGraph } from '../../utils';

let graph: BaseGraph;

beforeEach(() => {
  graph = createBaseGraph();
});

test.each([
  ['the first state', 1, -1],
  ['the last state', 299, 1],
])('move snaps the bounds to %s', (_description, boundsX, expectedDeltaX) => {
  const states = [
    graph.insertVertex({ position: [0, 0], size: [40, 40] }),
    graph.insertVertex({ position: [300, 300], size: [40, 40] }),
  ].map((cell) => graph.view.getState(cell)!);
  const guide = new Guide(graph, states as CellState[]);

  const delta = guide.move(new Rectangle(boundsX, 150, 40, 40), new Point(0, 0));

  expect(delta.x).toBe(expectedDeltaX);
});
