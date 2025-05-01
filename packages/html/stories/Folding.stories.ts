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
  EdgeStyle,
  EntityRelationConnectorConfig,
  Graph,
  LayoutManager,
  StackLayout,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import {
  configureExpandedAndCollapsedImages,
  configureImagesBasePath,
  createGraphContainer,
} from './shared/configure.js';

export default {
  title: 'Layouts/Folding',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();
  const container = createGraphContainer(args);

  // Override default values
  EntityRelationConnectorConfig.segment = 20;

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setDropEnabled(true);

  // Disables global features
  graph.options.collapseToPreferredSize = false;
  configureExpandedAndCollapsedImages(graph);

  graph.constrainChildren = false;
  graph.cellsSelectable = false;
  graph.extendParentsOnAdd = false;
  graph.extendParents = false;
  graph.border = 10;

  // Sets global styles
  let style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edgeStyle = EdgeStyle.EntityRelation;
  style.rounded = true;

  style = graph.getStylesheet().getDefaultVertexStyle();
  style.fillColor = '#ffffff';
  style.shape = 'swimlane';
  style.startSize = 30;

  style = {};
  style.shape = 'rectangle';
  style.strokeColor = 'none';
  style.fillColor = 'none';
  style.foldable = false;
  graph.getStylesheet().putCellStyle('column', style);

  // Installs auto layout for all levels
  const layout = new StackLayout(graph, true);
  layout.border = graph.border;
  const layoutMgr = new LayoutManager(graph);
  layoutMgr.getLayout = function (cell) {
    if (cell && !cell.collapsed) {
      if (cell.parent !== graph.model.root) {
        layout.resizeParent = true;
        layout.horizontal = false;
        layout.spacing = 10;
      } else {
        layout.resizeParent = true;
        layout.horizontal = true;
        layout.spacing = 40;
      }

      return layout;
    }

    return null;
  };

  // Resizes the container
  graph.setResizeContainer(true);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const col1 = graph.insertVertex(parent, null, '', 0, 0, 120, 0, {
      baseStyleNames: ['column'],
    });

    const v1 = graph.insertVertex(col1, null, '1', 0, 0, 100, 30);
    v1.collapsed = true;

    const v11 = graph.insertVertex(v1, null, '1.1', 0, 0, 80, 30);
    v11.collapsed = true;

    const v111 = graph.insertVertex(v11, null, '1.1.1', 0, 0, 60, 30);
    const v112 = graph.insertVertex(v11, null, '1.1.2', 0, 0, 60, 30);

    const v12 = graph.insertVertex(v1, null, '1.2', 0, 0, 80, 30);

    const col2 = graph.insertVertex(parent, null, '', 0, 0, 120, 0, {
      baseStyleNames: ['column'],
    });

    const v2 = graph.insertVertex(col2, null, '2', 0, 0, 100, 30);
    v2.collapsed = true;

    const v21 = graph.insertVertex(v2, null, '2.1', 0, 0, 80, 30);
    v21.collapsed = true;

    const v211 = graph.insertVertex(v21, null, '2.1.1', 0, 0, 60, 30);
    const v212 = graph.insertVertex(v21, null, '2.1.2', 0, 0, 60, 30);

    const v22 = graph.insertVertex(v2, null, '2.2', 0, 0, 80, 30);

    const v3 = graph.insertVertex(col2, null, '3', 0, 0, 100, 30);
    v3.collapsed = true;

    const v31 = graph.insertVertex(v3, null, '3.1', 0, 0, 80, 30);
    v31.collapsed = true;

    const v311 = graph.insertVertex(v31, null, '3.1.1', 0, 0, 60, 30);
    const v312 = graph.insertVertex(v31, null, '3.1.2', 0, 0, 60, 30);

    const v32 = graph.insertVertex(v3, null, '3.2', 0, 0, 80, 30);

    graph.insertEdge(parent, null, '', v111, v211);
    graph.insertEdge(parent, null, '', v112, v212);
    graph.insertEdge(parent, null, '', v112, v22);

    graph.insertEdge(parent, null, '', v12, v311);
    graph.insertEdge(parent, null, '', v12, v312);
    graph.insertEdge(parent, null, '', v12, v32);
  });

  return container;
};

export const Default = Template.bind({});
