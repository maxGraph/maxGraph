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
import { HierarchicalLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';

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
});
