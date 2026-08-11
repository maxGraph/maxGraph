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
import { createGraphWithoutPlugins, expectGeometryBounds } from '../../utils';
import type { Cell, Graph } from '../../../src';

const childSize = { width: 80, height: 40 };

const insertChildren = (graph: Graph, x: number, y: number): [Cell, Cell] => [
  graph.insertVertex({
    value: 'A',
    position: [x, y],
    size: [childSize.width, childSize.height],
  }),
  graph.insertVertex({
    value: 'B',
    position: [x + 100, y + 100],
    size: [childSize.width, childSize.height],
  }),
];

describe('groupCells', () => {
  // The children are moved to be relative to the group, so they are always expected at the same
  // coordinates whatever the coordinates they had in their former parent.
  test.each([
    ['positive coordinates', 200, 200],
    // https://github.com/maxGraph/maxGraph/issues/1045
    ['negative coordinates', -200, -200],
  ])('children keep their geometry when they are at %s', (_title, x, y) => {
    const graph = createGraphWithoutPlugins();
    const [child1, child2] = insertChildren(graph, x, y);
    // Same group as the one created by groupCells when no group is passed, but the type of the
    // parameter does not allow null, contrary to what its documentation states.
    const cells = [child1, child2];

    const group = graph.groupCells(graph.createGroupCell(cells), 0, cells);

    expect(group.getChildCount()).toBe(2);
    expectGeometryBounds(child1, { x: 0, y: 0, ...childSize });
    expectGeometryBounds(child2, { x: 100, y: 100, ...childSize });
  });
});
