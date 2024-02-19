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

import { Graph } from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';

export default {
  title: 'Misc/Thread',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  configureImagesBasePath();
  const container = createGraphContainer(args);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();
  let v1;
  let v2;
  let e1;

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  // Function to switch the overlay every 5 secs
  const f = () => {
    const overlays = graph.getCellOverlays(v1);

    if (overlays.length == 0) {
      graph.removeCellOverlays(v2);
      graph.setCellWarning(v1, 'Tooltip');
    } else {
      graph.removeCellOverlays(v1);
      graph.setCellWarning(v2, 'Tooltip');
    }
  };

  window.setInterval(f, 1000);
  f();

  return container;
};

export const Default = Template.bind({});
