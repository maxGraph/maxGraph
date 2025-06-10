/*
Copyright 2024-present The maxGraph project Contributors

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
  type ConnectionHandler,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  Point,
  RubberBandHandler,
  StyleDefaultsConfig,
} from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
import '@maxgraph/core/css/common.css'; // style required by RubberBand

export default {
  title: 'Styles/CustomStyleDefaults',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
    customStyleDefaults: {
      type: 'boolean',
      defaultValue: true,
    },
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
    ...rubberBandValues,
    customStyleDefaults: true,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Toggle custom handle defaults with storybook args
  if (args.customStyleDefaults) {
    StyleDefaultsConfig.shadowColor = 'orange';
    StyleDefaultsConfig.shadowOffsetX = 4;
    StyleDefaultsConfig.shadowOffsetY = -4;
    StyleDefaultsConfig.shadowOpacity = 0.5;
  }

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container and apply configuration
  const graph = new Graph(container, undefined, plugins);
  graph.setConnectable(true);
  graph.setAllowDanglingEdges(false);
  graph.setVertexLabelsMovable(true);
  graph.setEdgeLabelsMovable(true);

  const connectionHandler = graph.getPlugin<ConnectionHandler>('ConnectionHandler')!;
  connectionHandler.outlineConnect = true;

  // Changes default styles to increase the contrast
  const defaultEdgeStyle = graph.getStylesheet().getDefaultEdgeStyle();
  defaultEdgeStyle.shadow = true;
  defaultEdgeStyle.strokeColor = '#c7cad0';
  const defaultVertexStyle = graph.getStylesheet().getDefaultVertexStyle();
  defaultVertexStyle.shadow = true;
  defaultVertexStyle.fillColor = '#eaebef';
  defaultVertexStyle.strokeColor = '#c7cad0';

  // Gets the default parent for inserting new cells. This is normally the first child of the root (i.e. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'A1', 20, 20, 40, 80, { shape: 'and' });
    const v2 = graph.insertVertex(parent, null, 'A2', 20, 220, 40, 80, { shape: 'and' });
    const v3 = graph.insertVertex(parent, null, 'X1', 160, 110, 80, 80, { shape: 'xor' });
    const e1 = graph.insertEdge(parent, null, 'Edge from A1 to X1', v1, v3);
    e1.geometry!.points = [new Point(90, 60), new Point(90, 130)];
    const e2 = graph.insertEdge(parent, null, 'Edge from A2 to X1', v2, v3);
    e2.geometry!.points = [new Point(90, 260), new Point(90, 170)];

    const v4 = graph.insertVertex(parent, null, 'A3', 520, 20, 40, 80, {
      shape: 'customShape',
      flipH: true,
    });
    const v5 = graph.insertVertex(parent, null, 'A4', 520, 220, 40, 80, {
      shape: 'and',
      flipH: true,
    });
    const v6 = graph.insertVertex(parent, null, 'X2', 340, 110, 80, 80, {
      shape: 'xor',
      flipH: true,
    });
    const e3 = graph.insertEdge(parent, null, 'Edge from A3 to X2', v4, v6, {
      edgeStyle: 'orthogonalEdgeStyle',
    });
    e3.geometry!.points = [new Point(490, 60), new Point(130, 130)];
    const e4 = graph.insertEdge(parent, null, 'Edge from A4 to X2', v5, v6);
    e4.geometry!.points = [new Point(490, 260), new Point(350, 220)];

    const v7 = graph.insertVertex(parent, null, 'O1', 250, 260, 80, 60, {
      shape: 'or',
      direction: 'south',
    });
    const e5 = graph.insertEdge(parent, null, '', v6, v7);
    e5.geometry!.points = [new Point(310, 150)];
    const e6 = graph.insertEdge(parent, null, '', v3, v7);
    e6.geometry!.points = [new Point(270, 150)];

    const e7 = graph.insertEdge(parent, null, 'Edge from O1 to A4', v7, v5);
    e7.geometry!.points = [
      new Point(290, 370),
      new Point(350, 470),
      new Point(480, 410),
      new Point(590, 390),
      new Point(630, 290),
    ];
  });

  return div;
};

export const Default = Template.bind({});
