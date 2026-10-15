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
import { type CellState, ParallelEdgeLayout, Point } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

describe('execute', () => {
  test('spreads the parallel edges and the loops', () => {
    const graph = createGraphWithoutContainer();
    const vertices = insertCells(graph, 'ab', ['ab1', 'ba2', 'ab3', 'aa4', 'aa5']);
    graph.batchUpdate(() => {
      graph.moveCells([vertices.get('b')!], 200, 0);
    });

    graph.batchUpdate(() => {
      new ParallelEdgeLayout(graph).execute(graph.getDefaultParent());
    });

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      a: [0, 0], b: [200, 0],
      ab1: [[120, -10]], ba2: [[120, 10]], ab3: [[120, 30]],
      aa4: [[60, 10]], aa5: [[80, 10]],
    });
  });
});

describe('getEdgeId', () => {
  test('appends every point of the edge when checking the overlap', () => {
    const graph = createGraphWithoutContainer();
    insertCells(graph, 'ab', ['ab']);
    const edge = graph.getDefaultParent().getChildAt(2);
    const layout = new ParallelEdgeLayout(graph);
    const idWithoutPoints = layout.getEdgeId(edge);
    jest.spyOn(graph.view, 'getState').mockReturnValue({
      absolutePoints: [new Point(1, 2), new Point(3, 4), new Point(5, 6)],
    } as CellState);

    layout.checkOverlap = true;

    expect(layout.getEdgeId(edge)).toBe(`${idWithoutPoints}1,2,3,4,5,6`);
  });
});
