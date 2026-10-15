/*
Copyright 2023-present The maxGraph project Contributors

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
import { type Graph, HierarchicalLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';
import { getPositions, insertCells } from './utils';

const executeLayout = (graph: Graph): void => {
  graph.batchUpdate(() => {
    new HierarchicalLayout(graph).execute(graph.getDefaultParent());
  });
};

describe('layout execute', () => {
  test('Circular layout graph is created successfully', () => {
    // prepare test
    const graph = createGraphWithoutContainer();
    const parent = graph.getDefaultParent();
    const layout = new HierarchicalLayout(graph);

    // execute test
    graph.batchUpdate(() => {
      const size: [number, number] = [80, 30];
      const v1 = graph.insertVertex({
        parent,
        value: '1',
        size,
      });
      const v2 = graph.insertVertex({
        parent,
        value: '2',
        size,
      });
      const v3 = graph.insertVertex({
        parent,
        id: 'v3',
        value: '3',
        size,
      });
      const v4 = graph.insertVertex({
        parent,
        value: '4',
        size,
      });
      const v5 = graph.insertVertex({
        parent,
        value: '5',
        size,
      });
      const v6 = graph.insertVertex({
        parent,
        value: '6',
        size,
      });
      const v7 = graph.insertVertex({
        parent,
        id: 'v7',
        value: '7',
        size,
      });
      const v8 = graph.insertVertex({
        parent,
        value: '8',
        size,
      });
      const v9 = graph.insertVertex({
        parent,
        id: 'v9',
        value: '9',
        size,
      });

      graph.insertEdge({ parent, value: '', source: v1, target: v2 });
      graph.insertEdge({ parent, value: '', source: v2, target: v3 });
      graph.insertEdge({ parent, value: '', source: v3, target: v4 });
      graph.insertEdge({ parent, value: '', source: v4, target: v5 });
      graph.insertEdge({ parent, value: '', source: v5, target: v3 }); // this introduces the circular path
      graph.insertEdge({ parent, value: '', source: v5, target: v6 });
      graph.insertEdge({ parent, value: '', source: v6, target: v7 });
      graph.insertEdge({ parent, value: '', source: v7, target: v8 });
      graph.insertEdge({ parent, value: '', source: v8, target: v9 });

      // Execute the layout
      layout.execute(parent);
    });

    // Verify that the position of cells changed when applying the layout
    const vertex3 = graph.model.getCell('v3');
    // geometry "_x": 33.51851851851852, "_y": 260
    expect(vertex3?.geometry?.x).toBeCloseTo(33.518);
    expect(vertex3?.geometry?.y).toBe(260);
    const vertex7 = graph.model.getCell('v7');
    // geometry "_x": 23.657407407407412, "_y": 780
    expect(vertex7?.geometry?.x).toBeCloseTo(23.657);
    expect(vertex7?.geometry?.y).toBe(780);
    const vertex9 = graph.model.getCell('v9');
    // geometry "_x": 22.002314814814824, "_y": 1040
    expect(vertex9?.geometry?.x).toBeCloseTo(22);
    expect(vertex9?.geometry?.y).toBe(1040);
  });

  test('Non-circular layout graph is created successfully', () => {
    // prepare test
    const graph = createGraphWithoutContainer();
    const parent = graph.getDefaultParent();
    const layout = new HierarchicalLayout(graph);

    // execute test - graph is based on HierarchicalLayout.stories.js
    graph.batchUpdate(() => {
      const size: [number, number] = [80, 30];
      const v1 = graph.insertVertex({
        parent,
        id: 'v1',
        value: '1',
        size,
      });
      const v2 = graph.insertVertex({
        parent,
        value: '2',
        size,
      });
      const v3 = graph.insertVertex({
        parent,
        value: '3',
        size,
      });
      const v4 = graph.insertVertex({
        parent,
        value: '4',
        size,
      });
      const v5 = graph.insertVertex({
        parent,
        value: '5',
        size,
      });
      const v6 = graph.insertVertex({
        parent,
        id: 'v6',
        value: '6',
        size,
      });
      const v7 = graph.insertVertex({
        parent,
        value: '7',
        size,
      });
      const v8 = graph.insertVertex({
        parent,
        id: 'v8',
        value: '8',
        size,
      });
      const v9 = graph.insertVertex({
        parent,
        value: '9',
        size,
      });

      graph.insertEdge({ parent, value: '', source: v1, target: v2 });
      graph.insertEdge({ parent, value: '', source: v1, target: v3 });
      graph.insertEdge({ parent, value: '', source: v3, target: v4 });
      graph.insertEdge({ parent, value: '', source: v2, target: v5 });
      graph.insertEdge({ parent, value: '', source: v1, target: v6 });
      graph.insertEdge({ parent, value: '', source: v2, target: v3 });
      graph.insertEdge({ parent, value: '', source: v6, target: v4 });
      graph.insertEdge({ parent, value: '', source: v6, target: v1 });
      graph.insertEdge({ parent, value: '', source: v6, target: v7 });
      graph.insertEdge({ parent, value: '', source: v7, target: v8 });
      graph.insertEdge({ parent, value: '', source: v7, target: v9 });
      graph.insertEdge({ parent, value: '', source: v7, target: v6 });
      graph.insertEdge({ parent, value: '', source: v7, target: v5 });

      // Execute the layout
      layout.execute(parent);
    });

    // Verify that the position of cells changed when applying the layout
    const vertex1 = graph.model.getCell('v1');
    // geometry "_x": 125, "_y": 260
    expect(vertex1?.geometry?.x).toBe(125);
    expect(vertex1?.geometry?.y).toBe(260);
    const vertex6 = graph.model.getCell('v6');
    // geometry "_x": 220, "_y": 130
    expect(vertex6?.geometry?.x).toBe(220);
    expect(vertex6?.geometry?.y).toBe(130);
    const vertex8 = graph.model.getCell('v8');
    // geometry "_x": 0, "_y": 130
    expect(vertex8?.geometry?.x).toBe(0);
    expect(vertex8?.geometry?.y).toBe(130);
  });

  test('every vertex and every edge of a graph with crossings, cycles and long edges', () => {
    const graph = createGraphWithoutContainer();
    // a, b and c are the sources of crossing edges, some of them spanning several ranks.
    // b -> g is doubled and i -> b closes a cycle. j to n form a second hierarchy, in which
    // j, k, l and m make a cycle
    // prettier-ignore
    insertCells(graph, 'abcdefghijklmn', [
      'ad', 'ae', 'bd', 'bf', 'ce', 'cf', 'dg', 'eh', 'fg', 'fh', 'gi', 'hi', 'ai', 'bg', 'bg2', 'ib',
      'jk', 'kl', 'lm', 'mj', 'jn',
    ]);

    executeLayout(graph);

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      a: [45, 0],
      b: [50, 480],
      c: [140, 0],
      d: [15, 120],
      e: [115, 120],
      f: [50, 600],
      g: [15, 240],
      h: [100, 720],
      i: [100, 360],
      j: [330, 0],
      k: [260, 120],
      l: [290, 240],
      m: [320, 360],
      n: [330, 120],
      ad: [[55, 32], [35, 108]],
      ae: [[75, 32], [127.5, 108]],
      bd: [[73.75, 466], [70, 430], [70, 310], [85, 310], [85, 190], [42.5, 152]],
      bf: [[70, 512], [70, 586]],
      ce: [[152.5, 32], [142.5, 108]],
      cf: [[167.5, 32], [200, 70], [200, 190], [200, 190], [200, 310], [200, 310], [200, 430], [200, 430], [200, 550], [80, 588]],
      dg: [[27.5, 152], [35, 228]],
      eh: [[135, 152], [170, 190], [170, 310], [170, 310], [170, 430], [170, 430], [170, 550], [170, 550], [170, 670], [130, 708]],
      fg: [[60, 588], [0, 550], [0, 430], [0, 430], [0, 310], [23.75, 272]],
      fh: [[70, 632], [110, 708]],
      gi: [[46.25, 274], [112.5, 348]],
      hi: [[120, 706], [120, 670], [120, 550], [120, 550], [120, 430], [127.5, 392]],
      ai: [[65, 34], [85, 70], [85, 190], [115, 190], [115, 310], [127.5, 348]],
      bg: [[58.75, 468], [35, 430], [35, 310], [31.25, 274]],
      bg2: [[66.25, 468], [45, 430], [45, 310], [38.75, 274]],
      ib: [[112.5, 392], [81.25, 466]],
      jk: [[340, 32], [280, 108]],
      kl: [[280, 152], [310, 228]],
      lm: [[310, 272], [332.5, 348]],
      mj: [[347.5, 348], [400, 310], [400, 190], [400, 190], [400, 70], [360, 32]],
      jn: [[350, 34], [350, 108]],
    });
  });

  test('every root is moved down next to its highest target', () => {
    const graph = createGraphWithoutContainer();
    // d comes first, as a vertex that is not a root. r and t are the first and the last
    // roots, both above vertices of a lower rank than the top one. r has 2 targets, c is the
    // highest one and comes last
    const vertices = insertCells(graph, 'dracbt', ['ab', 'bc', 'cd', 'rd', 'rc', 'td']);

    executeLayout(graph);

    const rows = Object.fromEntries(
      [...vertices].map(([value, vertex]) => [value, vertex.geometry!.y])
    );
    expect(rows).toEqual({ a: 0, b: 120, c: 240, d: 360, r: 120, t: 240 });
  });

  test('an isolated vertex is laid out on the top rank', () => {
    const graph = createGraphWithoutContainer();
    const vertex = graph.insertVertex({
      value: 'isolated',
      position: [50, 50],
      size: [40, 20],
    });

    executeLayout(graph);

    expect([vertex.geometry!.x, vertex.geometry!.y]).toEqual([0, 0]);
  });

  test('every vertex and every edge of a graph where the heuristics change the result', () => {
    const graph = createGraphWithoutContainer();
    // Found by a search among random graphs: the crossing reduction and the coordinate
    // assignment go through several attempts, keeping the best one
    // prettier-ignore
    insertCells(graph, 'abcdefgh', ['ce', 'ac', 'gh', 'bd', 'gd', 'ga', 'fb', 'bh', 'cf', 'ec']);

    executeLayout(graph);

    // prettier-ignore
    expect(getPositions(graph)).toEqual({
      a: [65, 120],
      b: [65, 480],
      c: [65, 240],
      d: [100, 600],
      e: [30, 360],
      f: [100, 360],
      g: [65, 0],
      h: [30, 600],
      ce: [[75, 272], [42.5, 348]],
      ac: [[85, 152], [85, 228]],
      gh: [[75, 32], [0, 70], [0, 190], [0, 190], [0, 310], [0, 310], [0, 430], [0, 430], [0, 550], [42.5, 588]],
      bd: [[92.5, 512], [112.5, 588]],
      gd: [[95, 32], [170, 70], [170, 190], [170, 190], [170, 310], [170, 310], [170, 430], [170, 430], [170, 550], [127.5, 588]],
      ga: [[85, 34], [85, 108]],
      fb: [[120, 392], [85, 468]],
      bh: [[77.5, 512], [57.5, 588]],
      cf: [[95, 274], [120, 348]],
      ec: [[57.5, 348], [85, 272]],
    });
  });

  test('every root passed to execute is laid out', () => {
    const graph = createGraphWithoutContainer();
    const layout = new HierarchicalLayout(graph);
    const size: [number, number] = [80, 30];
    const chains = ['a', 'b', 'c'].map((name) => {
      const top = graph.insertVertex({ value: `${name}1`, size });
      const bottom = graph.insertVertex({ value: `${name}2`, size });
      graph.insertEdge({ source: top, target: bottom });
      return [top, bottom];
    });

    graph.batchUpdate(() => {
      layout.execute(
        graph.getDefaultParent(),
        chains.map(([top]) => top)
      );
    });

    // A chain whose root is ignored keeps both of its vertices at their initial position,
    // on the same row
    for (const [top, bottom] of chains) {
      expect(bottom.geometry!.y).toBeGreaterThan(top.geometry!.y);
    }
  });
});

describe('findRoots', () => {
  test('returns the vertices having outgoing edges only', () => {
    const graph = createGraphWithoutContainer();
    const layout = new HierarchicalLayout(graph);
    // a -> b -> c, d -> c: b has an incoming edge, followed by an outgoing one
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((value) =>
      graph.insertVertex({ value, size: [80, 30] })
    );
    graph.insertEdge({ source: a, target: b });
    graph.insertEdge({ source: b, target: c });
    graph.insertEdge({ source: d, target: c });

    const roots = layout.findRoots(graph.getDefaultParent(), [a, b, c, d]);

    expect(roots.map((root) => root.value)).toEqual(['a', 'd']);
  });
});
