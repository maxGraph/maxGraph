/*
Copyright 2022-present The maxGraph project Contributors

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

import { describe, test } from '@jest/globals';
import { Graph, HierarchicalLayout } from '../../../src';

function createGraph(): Graph {
  // @ts-ignore - no need for a container, we don't check the view here
  return new Graph(null);
}


// Here we just check that the default styles are initialized, and some properties set
// We don't test all properties on purpose
describe('layout execute', () => {
  test('Circular layout graph is greated without throwing an error', () => {

    // prepare test
    const graph: Graph = createGraph();
    const parent = graph.getDefaultParent();
    const layout = new HierarchicalLayout(graph);

    // execute test
    graph.batchUpdate(() => {
      const v1 = graph.insertVertex(parent, null, '1', 0, 0, 80, 30);
      const v2 = graph.insertVertex(parent, null, '2', 0, 0, 80, 30);
      const v3 = graph.insertVertex(parent, null, '3', 0, 0, 80, 30);
      const v4 = graph.insertVertex(parent, null, '4', 0, 0, 80, 30);
      const v5 = graph.insertVertex(parent, null, '5', 0, 0, 80, 30);
      const v6 = graph.insertVertex(parent, null, '6', 0, 0, 80, 30);
      const v7 = graph.insertVertex(parent, null, '7', 0, 0, 80, 30);
      const v8 = graph.insertVertex(parent, null, '8', 0, 0, 80, 30);
      const v9 = graph.insertVertex(parent, null, '9', 0, 0, 80, 30);

      const e1 = graph.insertEdge(parent, null, '', v1, v2);
      const e2 = graph.insertEdge(parent, null, '', v2, v3);
      const e3 = graph.insertEdge(parent, null, '', v3, v4);
      const e4 = graph.insertEdge(parent, null, '', v4, v5);
      const e5 = graph.insertEdge(parent, null, '', v5, v3);
      const e6 = graph.insertEdge(parent, null, '', v5, v6);
      const e7 = graph.insertEdge(parent, null, '', v6, v7);
      const e8 = graph.insertEdge(parent, null, '', v7, v8);
      const e9 = graph.insertEdge(parent, null, '', v8, v9);

      // Executes the layout
      layout.execute(parent);
    });
  });



  test('Non-circular layout graph is greated without throwing an error', () => {

    // prepare test
    const graph: Graph = createGraph();
    const parent = graph.getDefaultParent();
    const layout = new HierarchicalLayout(graph);

    // execute test - graph is based on HierarchicalLayout.stories.js
    graph.batchUpdate(() => {
      const v1 = graph.insertVertex(parent, null, '1', 0, 0, 80, 30);
      const v2 = graph.insertVertex(parent, null, '2', 0, 0, 80, 30);
      const v3 = graph.insertVertex(parent, null, '3', 0, 0, 80, 30);
      const v4 = graph.insertVertex(parent, null, '4', 0, 0, 80, 30);
      const v5 = graph.insertVertex(parent, null, '5', 0, 0, 80, 30);
      const v6 = graph.insertVertex(parent, null, '6', 0, 0, 80, 30);
      const v7 = graph.insertVertex(parent, null, '7', 0, 0, 80, 30);
      const v8 = graph.insertVertex(parent, null, '8', 0, 0, 80, 30);
      const v9 = graph.insertVertex(parent, null, '9', 0, 0, 80, 30);

      const e1 = graph.insertEdge(parent, null, '', v1, v2);
      const e2 = graph.insertEdge(parent, null, '', v1, v3);
      const e3 = graph.insertEdge(parent, null, '', v3, v4);
      const e4 = graph.insertEdge(parent, null, '', v2, v5);
      const e5 = graph.insertEdge(parent, null, '', v1, v6);
      const e6 = graph.insertEdge(parent, null, '', v2, v3);
      const e7 = graph.insertEdge(parent, null, '', v6, v4);
      const e8 = graph.insertEdge(parent, null, '', v6, v1);
      const e9 = graph.insertEdge(parent, null, '', v6, v7);
      const e10 = graph.insertEdge(parent, null, '', v7, v8);
      const e11 = graph.insertEdge(parent, null, '', v7, v9);
      const e12 = graph.insertEdge(parent, null, '', v7, v6);
      const e13 = graph.insertEdge(parent, null, '', v7, v5);

      // Executes the layout
      layout.execute(parent);
    });
  });


});

