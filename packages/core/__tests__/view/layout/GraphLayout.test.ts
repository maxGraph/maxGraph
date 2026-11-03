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
import { type CellStyle, type Graph, GraphLayout, Point } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('setEdgePoints', () => {
  test('makes every point relative to the parent of the edge', () => {
    const graph = createGraphWithoutContainer();
    const group = graph.insertVertex({
      value: 'group',
      position: [100, 50],
      size: [200, 100],
    });
    insertCells(graph, 'ab', ['ab'], group);
    const layout = new GraphLayout(graph);
    layout.parent = graph.getDefaultParent();

    layout.setEdgePoints(group.getChildAt(2), [new Point(110, 60), new Point(130, 80)]);

    expect(getPositions(graph, group).ab).toEqual([
      [10, 10],
      [30, 30],
    ]);
  });
});

const insertEdgeWithView = (graph: Graph, style?: CellStyle) => {
  const source = graph.insertVertex({ position: [0, 0], size: [20, 20] });
  const target = graph.insertVertex({ position: [100, 50], size: [20, 20] });
  const edge = graph.insertEdge({ source, target, style });
  return { edge, getEdgeState: () => graph.getView().getState(edge)! };
};

describe('setEdgeStyleEnabled', () => {
  test.each([
    ['uses', true, false],
    ['ignores', false, true],
  ])('%s the edge style when called with %s', (_name, value, expectedNoEdgeStyle) => {
    const graph = createGraphWithoutContainer();
    const { edge, getEdgeState } = insertEdgeWithView(graph, {
      edgeStyle: 'orthogonalEdgeStyle',
    });

    new GraphLayout(graph).setEdgeStyleEnabled(edge, value);

    expect(edge.style.noEdgeStyle).toBe(expectedNoEdgeStyle);
    expect(graph.getView().getEdgeStyle(getEdgeState()) !== null).toBe(value);
  });
});

describe('setOrthogonalEdge', () => {
  test.each([true, false])(
    'makes the edge orthogonal or not when called with %s',
    (value) => {
      const graph = createGraphWithoutContainer();
      const { edge, getEdgeState } = insertEdgeWithView(graph);

      new GraphLayout(graph).setOrthogonalEdge(edge, value);

      expect(edge.style.orthogonal).toBe(value);
      expect(graph.isOrthogonal(getEdgeState())).toBe(value);
    }
  );
});
