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
  Graph,
  InternalEvent,
  ManhattanConnectorConfig,
  type SelectionHandler,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
import EventObject from '@maxgraph/core/lib/view/event/EventObject.ts';

export default {
  title: 'Connections/Manhattan',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const container = createGraphContainer(args);

  // Allow end of edge to come only from west
  ManhattanConnectorConfig.endDirections = ['west'];

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enables guides
  graph.getPlugin<SelectionHandler>('SelectionHandler').guidesEnabled = true;

  // Hack to rerender edge on any node move
  graph.model.addListener(InternalEvent.CHANGE, (_sender: any, evt: EventObject) => {
    const changes = evt.getProperty('changes');
    const hasMoveEdits = changes?.some(
      // checks for the existence of the geometry and previous properties which are characteristic of GeometryChange in the model
      (c: any) => typeof c.geometry !== 'undefined' && typeof c.previous !== 'undefined'
    );
    // If detected GeometryChange event, call graph.view.refresh(), which will reroute edge
    if (hasMoveEdits) {
      graph.view.refresh();
    }
  });
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const style = graph.getStylesheet().getDefaultEdgeStyle();
    style.labelBackgroundColor = '#FFFFFF';
    style.strokeWidth = 2;
    style.rounded = true;
    style.entryPerimeter = true;
    style.entryY = 0.25;
    style.entryX = 0;
    // After move of "obstacles" nodes, move "finish" node - edge route will be recalculated
    style.edgeStyle = 'manhattanEdgeStyle';

    const v1 = graph.insertVertex(parent, null, 'start', 50, 50, 140, 70);
    const v2 = graph.insertVertex(parent, null, 'finish', 500, 450, 140, 72);
    graph.insertVertex(parent, null, 'obstacle 1', 450, 50, 140, 80);
    graph.insertVertex(parent, null, 'obstacle 2', 250, 350, 140, 80);
    graph.insertEdge(parent, null, 'route', v1, v2);
  });

  return container;
};

export const Default = Template.bind({});
