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

import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import { type AbstractGraph, BaseGraph, type Cell } from '../../src';
import { findTreeRoots } from '../../src/util/treeTraversal';

describe('findTreeRoots', () => {
  let graph: AbstractGraph;

  beforeEach(() => {
    graph = new BaseGraph();
  });

  afterEach(() => {
    graph.destroy();
  });

  const insertVertices = (count: number): Cell[] =>
    Array.from({ length: count }, () =>
      graph.insertVertex({ position: [0, 0], size: [10, 10] })
    );

  const insertEdges = (...sourceAndTargets: [Cell, Cell][]): void => {
    for (const [source, target] of sourceAndTargets) {
      graph.insertEdge({ source, target });
    }
  };

  test('return the vertices with outgoing edges only', () => {
    const [a, b, c, d] = insertVertices(4);
    insertEdges([a, b], [a, c], [d, b]);
    const isolatedVertices = insertVertices(1);

    const roots = findTreeRoots(graph, graph.getDefaultParent());

    expect(roots).toEqual([a, d]);
    expect(roots).not.toContain(isolatedVertices[0]);
  });

  test('return the vertices with incoming edges only when inverted', () => {
    const [a, b, c, d] = insertVertices(4);
    insertEdges([a, b], [a, c], [d, b]);

    expect(findTreeRoots(graph, graph.getDefaultParent(), false, true)).toEqual([b, c]);
  });

  test('return the vertex with the most outgoing edges compared to incoming ones when there is no root', () => {
    const [a, b, c] = insertVertices(3);
    insertEdges([a, b], [b, a], [a, c], [c, a], [a, b]);

    expect(findTreeRoots(graph, graph.getDefaultParent())).toEqual([a]);
  });
});
