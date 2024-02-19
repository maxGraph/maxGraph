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

import { Graph, InternalEvent, RubberBandHandler } from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Basic/HelloWorld',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...contextMenuValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  const graph = new Graph(container);

  if (args.rubberBand) new RubberBandHandler(graph);

  const parent = graph.getDefaultParent();

  graph.batchUpdate(() => {
    // Add cells to the model in a single step
    const vertex1 = graph.insertVertex({
      parent,
      value: 'Hello',
      position: [20, 20],
      size: [80, 30],
      relative: false,
    });

    const vertex2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
      relative: false,
    });

    const edge = graph.insertEdge({
      parent,
      source: vertex1,
      target: vertex2,
    });
  });

  return container;
};

export const Default = Template.bind({});
