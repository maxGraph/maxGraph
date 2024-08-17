/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2020, JGraph Ltd

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

import {
  DomHelpers,
  FastOrganicLayout,
  getDefaultPlugins,
  Graph,
  HierarchicalLayout,
  InternalEvent,
  RubberBandHandler,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Layouts/HierarchicalLayout',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, any>) => {
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  InternalEvent.disableContextMenu(container);

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new Graph(container, undefined, plugins);

  // Changes the default vertex style in-place
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.gradientColor = 'white';
  style.gradientDirection = 'south';
  style.perimeterSpacing = 6;
  style.rounded = true;
  style.shadow = true;

  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.rounded = true;

  // Creates a layout algorithm to be used with the graph
  const hierarchicalLayout = new HierarchicalLayout(graph);
  const organicLayout = new FastOrganicLayout(graph);
  organicLayout.forceConstant = 120;

  const parent = graph.getDefaultParent();

  // Adds buttons to execute the layout
  const buttons = document.createElement('div');
  div.appendChild(buttons);
  buttons.appendChild(
    DomHelpers.button('Hierarchical', () => {
      hierarchicalLayout.execute(parent);
    })
  );
  buttons.appendChild(
    DomHelpers.button('Organic', () => {
      organicLayout.execute(parent);
    })
  );

  // Load cells and layouts the graph
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

    // Executes the layout
    hierarchicalLayout.execute(parent);
  });

  return div;
};

export const Default = Template.bind({});
