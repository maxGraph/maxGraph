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
import { type Graph, SwimlaneLayout, type VertexParameters } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

const insertSwimlane = (graph: Graph, value: string, y: number) =>
  graph.insertVertex({
    value,
    position: [0, y],
    size: [300, 100],
    style: { shape: 'swimlane' },
  });

/**
 * Inserts `laneCount` swimlanes, then a vertex for each key of `vertexLanes`, in the swimlane whose index is its value,
 * then an edge for each value of `edgeValues`, going from the vertex of its first letter to the
 * vertex of its second one.
 */
const insertSwimlaneGraph = (
  graph: Graph,
  laneCount: number,
  vertexLanes: Record<string, number>,
  edgeValues: string[]
) => {
  const swimlanes = Array.from({ length: laneCount }, (_, index) =>
    insertSwimlane(graph, `swimlane${index}`, index * 100)
  );
  const vertices = new Map(
    Object.entries(vertexLanes).map(([value, lane]) => [
      value,
      graph.insertVertex({ parent: swimlanes[lane], value, size: [40, 20] }),
    ])
  );
  for (const value of edgeValues) {
    const [source, target] = value.split('');
    graph.insertEdge({
      value,
      source: vertices.get(source),
      target: vertices.get(target),
    });
  }
  return swimlanes;
};

describe('execute', () => {
  test('lays out the vertices of every swimlane, and routes every edge', () => {
    const graph = createGraphWithoutContainer();
    const swimlane1 = insertSwimlane(graph, 'swimlane1', 0);
    const swimlane2 = insertSwimlane(graph, 'swimlane2', 100);
    const vertices1 = insertCells(graph, 'ab', ['ab'], swimlane1);
    const vertices2 = insertCells(graph, 'cd', ['cd'], swimlane2);
    graph.insertEdge({
      value: 'bc',
      source: vertices1.get('b'),
      target: vertices2.get('c'),
    });
    graph.insertEdge({
      value: 'ad',
      source: vertices1.get('a'),
      target: vertices2.get('d'),
    });

    graph.batchUpdate(() => {
      new SwimlaneLayout(graph, null).execute(graph.getDefaultParent(), [
        swimlane1,
        swimlane2,
      ]);
    });

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      swimlane1: [0, 0], a: [25, 0], b: [0, 120], ab: [[37.5, 32], [20, 108]],
      swimlane2: [0, 100], c: [0, 140], d: [25, 260], cd: [[20, 172], [37.5, 248]],
      bc: [[20, 152], [20, 228]],
      ad: [[52.5, 32], [70, 70], [70, 190], [70, 190], [70, 310], [52.5, 348]],
    });
  });

  test('gives a temporary vertex to every empty swimlane', () => {
    const graph = createGraphWithoutContainer();
    const swimlanes = [
      insertSwimlane(graph, 'swimlane1', 0),
      insertSwimlane(graph, 'swimlane2', 100),
      insertSwimlane(graph, 'swimlane3', 200),
    ];
    insertCells(graph, 'ab', ['ab'], swimlanes[1]);
    const insertVertexSpy = jest.spyOn(graph, 'insertVertex');

    graph.batchUpdate(() => {
      new SwimlaneLayout(graph, null).execute(graph.getDefaultParent(), swimlanes);
    });

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      swimlane1: [0, 0],
      swimlane2: [0, 100], a: [5, 0], b: [5, 120], ab: [[25, 32], [25, 108]],
      swimlane3: [0, 200],
    });
    const parentsOfInsertedVertices = insertVertexSpy.mock.calls.map(
      ([parameters]) => (parameters as VertexParameters).parent
    );
    expect(parentsOfInsertedVertices).toEqual([swimlanes[0], swimlanes[2]]);
    // The temporary vertices are removed once the layout is done
    expect(swimlanes.map((swimlane) => swimlane.getChildCount())).toEqual([0, 3, 0]);
  });

  // Found by laying out random graphs, these graphs change when a single vertex or edge is skipped while looking for the
  // roots, traversing the graph, or ranking the vertices
  test.each<{
    laneCount: number;
    vertexLanes: Record<string, number>;
    edges: string[];
    expected: ReturnType<typeof getPositions>;
  }>([
    {
      laneCount: 3,
      vertexLanes: { a: 1, b: 2, c: 2, d: 1, e: 2, f: 2 },
      edges: ['fb', 'bf', 'ac', 'ef'],
      // prettier-ignore
      expected: {
        swimlane0: [0, 0],
        swimlane1: [0, 100], a: [0, 0], d: [70, 0],
        swimlane2: [0, 200], b: [68.91, 260], c: [0, 20], e: [70, 20], f: [68.91, 140],
        fb: [[81.41, 172], [81.41, 248]],
        bf: [[96.41, 248], [96.41, 172]],
        ef: [[90, 52], [88.91, 128]],
        ac: [[20, 132], [20, 208]],
      },
    },
    {
      laneCount: 2,
      vertexLanes: { a: 0, b: 1, c: 0, d: 1, e: 1, f: 0, g: 0, h: 1, i: 1 },
      edges: ['dh', 'hf', 'fc', 'ei', 'bi', 'ab', 'gb'],
      // prettier-ignore
      expected: {
        swimlane0: [0, 0], a: [85, 0], c: [15, 120], f: [15, 0], g: [155, 0],
        swimlane1: [0, 100], b: [100, 140], d: [30, 140], e: [170, 140], h: [5, 260], i: [135, 260],
        fc: [[27.5, 32], [35, 108]],
        dh: [[50, 172], [32.5, 248]],
        ei: [[190, 172], [162.5, 248]],
        bi: [[120, 172], [147.5, 248]],
        hf: [[17.5, 348], [0, 310], [0, 190], [85, 190], [85, 70], [42.5, 32]],
        ab: [[105, 32], [115, 70], [115, 190], [112.5, 228]],
        gb: [[175, 32], [147.5, 70], [147.5, 190], [127.5, 228]],
      },
    },
  ])(
    'lays out the vertices of $laneCount swimlanes connected by $edges',
    ({ laneCount, vertexLanes, edges, expected }) => {
      const graph = createGraphWithoutContainer();
      const swimlanes = insertSwimlaneGraph(graph, laneCount, vertexLanes, edges);

      graph.batchUpdate(() => {
        new SwimlaneLayout(graph, null).execute(graph.getDefaultParent(), swimlanes);
      });

      expect(getPositions(graph)).toEqual(expected);
    }
  );
});
