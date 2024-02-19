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

import { Graph, DomHelpers } from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Zoom_OffPage/LoD',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.centerZoom = false;

  // Links level of detail to zoom level but can be independent of zoom
  const isVisible = function () {
    return this.lod == null || this.lod / 2 < graph.view.scale;
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, '1', 20, 20, 80, 30);
    v1.lod = 1;
    v1.isVisible = isVisible;

    const v2 = graph.insertVertex(parent, null, '1', 200, 150, 80, 30);
    v2.lod = 1;
    v2.isVisible = isVisible;

    const v3 = graph.insertVertex(parent, null, '2', 20, 150, 40, 20);
    v3.lod = 2;
    v3.isVisible = isVisible;

    const v4 = graph.insertVertex(parent, null, '3', 200, 10, 20, 20);
    v4.lod = 3;
    v4.isVisible = isVisible;

    const e1 = graph.insertEdge(parent, null, '2', v1, v2, { strokeWidth: 2 });
    e1.lod = 2;
    e1.isVisible = isVisible;

    const e2 = graph.insertEdge(parent, null, '2', v3, v4, { strokeWidth: 2 });
    e2.lod = 2;
    e2.isVisible = isVisible;

    const e3 = graph.insertEdge(parent, null, '3', v1, v4, { strokeWidth: 1 });
    e3.lod = 3;
    e3.isVisible = isVisible;
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('+', function () {
      graph.zoomIn();
    })
  );

  buttons.appendChild(
    DomHelpers.button('-', function () {
      graph.zoomOut();
    })
  );

  return div;
};

export const Default = Template.bind({});
