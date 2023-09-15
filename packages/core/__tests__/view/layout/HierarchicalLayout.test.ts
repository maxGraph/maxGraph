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
import { Graph, HierarchicalLayout } from '../../../src';

function createGraph(): Graph {
  // @ts-ignore - no need for a container, we don't check the view here
  return new Graph(null);
}

describe('layout execute', () => {
  test('Circular layout graph is created successfully', () => {
    // prepare test
    const graph: Graph = createGraph();
    const parent = graph.getDefaultParent();
    const layout = new HierarchicalLayout(graph);

    // execute test
    graph.batchUpdate(() => {
      const v1 = graph.insertVertex(parent, null, '1', 0, 0, 80, 30);
      const v2 = graph.insertVertex(parent, null, '2', 0, 0, 80, 30);
      const v3 = graph.insertVertex(parent, 'v3', '3', 0, 0, 80, 30);
      const v4 = graph.insertVertex(parent, null, '4', 0, 0, 80, 30);
      const v5 = graph.insertVertex(parent, null, '5', 0, 0, 80, 30);
      const v6 = graph.insertVertex(parent, null, '6', 0, 0, 80, 30);
      const v7 = graph.insertVertex(parent, 'v7', '7', 0, 0, 80, 30);
      const v8 = graph.insertVertex(parent, null, '8', 0, 0, 80, 30);
      const v9 = graph.insertVertex(parent, 'v9', '9', 0, 0, 80, 30);

      graph.insertEdge(parent, null, '', v1, v2);
      graph.insertEdge(parent, null, '', v2, v3);
      graph.insertEdge(parent, null, '', v3, v4);
      graph.insertEdge(parent, null, '', v4, v5);
      graph.insertEdge(parent, null, '', v5, v3); // this introduces the circular path
      graph.insertEdge(parent, null, '', v5, v6);
      graph.insertEdge(parent, null, '', v6, v7);
      graph.insertEdge(parent, null, '', v7, v8);
      graph.insertEdge(parent, null, '', v8, v9);

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
    const graph: Graph = createGraph();
    const parent = graph.getDefaultParent();
    const layout = new HierarchicalLayout(graph);

    // execute test - graph is based on HierarchicalLayout.stories.js
    graph.batchUpdate(() => {
      const v1 = graph.insertVertex(parent, 'v1', '1', 0, 0, 80, 30);
      const v2 = graph.insertVertex(parent, null, '2', 0, 0, 80, 30);
      const v3 = graph.insertVertex(parent, null, '3', 0, 0, 80, 30);
      const v4 = graph.insertVertex(parent, null, '4', 0, 0, 80, 30);
      const v5 = graph.insertVertex(parent, null, '5', 0, 0, 80, 30);
      const v6 = graph.insertVertex(parent, 'v6', '6', 0, 0, 80, 30);
      const v7 = graph.insertVertex(parent, null, '7', 0, 0, 80, 30);
      const v8 = graph.insertVertex(parent, 'v8', '8', 0, 0, 80, 30);
      const v9 = graph.insertVertex(parent, null, '9', 0, 0, 80, 30);

      graph.insertEdge(parent, null, '', v1, v2);
      graph.insertEdge(parent, null, '', v1, v3);
      graph.insertEdge(parent, null, '', v3, v4);
      graph.insertEdge(parent, null, '', v2, v5);
      graph.insertEdge(parent, null, '', v1, v6);
      graph.insertEdge(parent, null, '', v2, v3);
      graph.insertEdge(parent, null, '', v6, v4);
      graph.insertEdge(parent, null, '', v6, v1);
      graph.insertEdge(parent, null, '', v6, v7);
      graph.insertEdge(parent, null, '', v7, v8);
      graph.insertEdge(parent, null, '', v7, v9);
      graph.insertEdge(parent, null, '', v7, v6);
      graph.insertEdge(parent, null, '', v7, v5);

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
});
