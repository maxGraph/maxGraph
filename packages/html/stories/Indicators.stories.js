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

import { Graph, EdgeStyle, constants, KeyHandler } from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Icon_Images/Indicators',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setConnectable(true);
  new KeyHandler(graph);

  // Enables moving of vertex labels
  graph.vertexLabelsMovable = true;

  // Creates a style with an indicator
  let style = graph.getStylesheet().getDefaultVertexStyle();

  style.shape = 'label';
  style.verticalAlign = 'bottom';
  style.indicatorShape = 'ellipse';
  style.indicatorWidth = 34;
  style.indicatorHeight = 34;
  style.imageVerticalAlign = 'top'; // indicator v-alignment
  style.imageAlign = 'center';
  style.indicatorColor = 'green';
  // delete style.strokeColor; // transparent
  // delete style.fillColor; // transparent

  // Creates a style with an indicator
  style = graph.getStylesheet().getDefaultEdgeStyle();

  style.edge = EdgeStyle.ElbowConnector;
  style.elbow = constants.ELBOW.VERTICAL;
  style.rounded = true;

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    graph.insertVertex(parent, null, 'Bottom Label', 80, 80, 80, 60);
    graph.insertVertex(parent, null, 'Top Label', 200, 80, 60, 60, {
      indicatorShape: 'actor',
      indicatorWidth: 28,
      indicatorColor: 'blue',
      imageVerticalAlign: 'bottom',
      verticalAlign: 'top',
    });
    graph.insertVertex(parent, null, 'Right Label', 300, 80, 120, 60, {
      indicatorShape: 'cloud',
      indicatorWidth: 40,
      indicatorColor: '#00FFFF',
      imageVerticalAlign: 'center',
      verticalAlign: 'middle',
      imageAlign: 'left',
      align: 'left',
      spacingLeft: 44,
    });
  });

  return container;
};

export const Default = Template.bind({});
