/*
Copyright 2025-present The maxGraph project Contributors

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

import { expect, test } from '@jest/globals';
import {
  BaseGraph,
  GraphView,
  registerCoreCodecs,
  unregisterAllCodecs,
} from '../../../src';
import { exportObject } from './shared';
import Rectangle from '../../../src/view/geometry/Rectangle';

function createGraphView(): GraphView {
  const graph = new BaseGraph();
  return graph.view;
}

// Prevents side effects between tests
beforeAll(() => {
  unregisterAllCodecs();
});
beforeEach(() => {
  registerCoreCodecs();
});
afterEach(() => {
  unregisterAllCodecs();
});

// GraphViewCodec only supports export, not import, so we only test export here.
test('export', () => {
  const view = createGraphView();
  view.setGraphBounds(new Rectangle(10, 10, 400, 300));

  const graph = view.graph;
  graph.batchUpdate(() => {
    const vertex01 = graph.insertVertex({
      position: [10.5, 10.5],
      size: [100.2, 100.2],
      value: 'rectangle',
    });
    const vertex02 = graph.insertVertex({
      position: [350, 90],
      size: [50, 50],
      style: {
        baseStyleNames: ['style1', 'style2'],
        fillColor: 'orange',
        perimeter: 'ellipsePerimeter',
        shape: 'ellipse',
        verticalAlign: 'top',
        verticalLabelPosition: 'bottom',
      },
      value: 'ellipse',
    });
    // child of vertex01
    graph.insertVertex({
      parent: vertex01,
      position: [10, 20],
      size: [10, 10],
      style: {
        shape: 'cloud',
        strokeColor: 'red',
      },
      value: 'child',
    });
    graph.insertEdge({
      source: vertex01,
      target: vertex02,
      value: 'edge',
      style: {
        edgeStyle: 'orthogonalEdgeStyle',
        rounded: true,
      },
    });
  });

  const xml = exportObject(view);
  expect(xml).toEqual(
    `<graph label="" x="10" y="10" width="391" height="182" scale="1">
  <layer label="">
    <group label="rectangle" shape="rectangle" perimeter="rectanglePerimeter" verticalAlign="middle" align="center" fillColor="#C3D9FF" strokeColor="#6482B9" fontColor="#774400" x="11" y="11" width="100" height="100">
      <vertex label="child" shape="cloud" perimeter="rectanglePerimeter" verticalAlign="middle" align="center" fillColor="#C3D9FF" strokeColor="red" fontColor="#774400" x="21" y="31" width="10" height="10" />
    </group>
    <vertex label="ellipse" shape="ellipse" perimeter="ellipsePerimeter" verticalAlign="top" align="center" fillColor="orange" strokeColor="#6482B9" fontColor="#774400" verticalLabelPosition="bottom" x="350" y="90" width="50" height="50" dy="50" />
    <edge label="edge" shape="connector" endArrow="classic" verticalAlign="middle" align="center" strokeColor="#6482B9" fontColor="#446299" edgeStyle="orthogonalEdgeStyle" rounded="true" points="111,61 230,61 230,115 350,115" dx="230" dy="88" />
  </layer>
</graph>
`
  );
});
