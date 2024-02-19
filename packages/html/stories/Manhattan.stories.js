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

import { EdgeStyle, Graph, InternalEvent, SelectionHandler } from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Connections/Manhattan',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Enables guides
  SelectionHandler.prototype.guidesEnabled = true;

  // Allow end of edge to come only from west
  EdgeStyle.MANHATTAN_END_DIRECTIONS = ['west'];

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Hack to rerender edge on any node move
  graph.model.addListener(InternalEvent.CHANGE, (sender, evt) => {
    const changesList = evt.getProperty('changes');
    const hasMoveEdits =
      changesList && changesList.some((c) => c.constructor.name == 'GeometryChange');
    // If detected GeometryChange event, call graph.view.refresh(), which will reroute edge
    if (hasMoveEdits) {
      graph?.view?.refresh();
    }
  });
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    var style = graph.getStylesheet().getDefaultEdgeStyle();
    style.labelBackgroundColor = '#FFFFFF';
    style.strokeWidth = 2;
    style.rounded = true;
    style.entryPerimeter = true;
    style.entryY = 0.25;
    style.entryX = 0;
    // After move of "obstacles" nodes, move "finish" node - edge route will be recalculated
    style.edgeStyle = 'manhattanEdgeStyle';

    var v1 = graph.insertVertex(parent, null, 'start', 50, 50, 140, 70);
    var v2 = graph.insertVertex(parent, null, 'finish', 500, 450, 140, 72);
    var v3 = graph.insertVertex(parent, null, 'obstacle', 450, 50, 140, 80);
    var v4 = graph.insertVertex(parent, null, 'obstacle', 250, 350, 140, 80);
    var e1 = graph.insertEdge(parent, null, 'route', v1, v2);
  });

  return container;
};

export const Default = Template.bind({});
