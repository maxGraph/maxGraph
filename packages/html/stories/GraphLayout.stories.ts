/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2013, JGraph Ltd

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

/*
  Graph Layout

  This example demonstrates using automatic graph layouts and listening to changes of the graph size
  to keep the container size in sync.
*/

import {
  CircleLayout,
  DomHelpers,
  FastOrganicLayout,
  Graph,
  InternalEvent,
  Morphing,
} from '@maxgraph/core';

import { globalTypes, globalValues } from './shared/args.js';

export default {
  title: 'Layouts/GraphLayout',
  argTypes: {
    ...globalTypes,
    animate: {
      type: 'boolean',
      defaultValue: false,
    },
  },
  args: {
    ...globalValues,
    animate: true,
  },
};

const Template = ({ label, ...args }: Record<string, any>) => {
  const mainContainer = document.createElement('div');
  const container = document.createElement('div');

  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Changes the default vertex style in-place
  const style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = 'ellipse';
  style.perimeter = 'ellipsePerimeter';
  style.gradientColor = 'white';
  style.fontSize = 10;

  // Updates the size of the container to match
  // the size of the graph when it changes. If
  // this is commented-out, and the DIV style's
  // overflow is set to "auto", then scrollbars
  // will appear for the diagram. If overflow is
  // set to "visible", then the diagram will be
  // visible even when outside the parent DIV.
  // With the code below, the parent DIV will be
  // resized to contain the complete graph.
  //graph.setResizeContainer(true);

  // Larger grid size yields cleaner layout result
  graph.gridSize = 40;

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Creates a layout algorithm to be used
  // with the graph
  const layout = new FastOrganicLayout(graph);

  // Moves stuff wider apart than usual
  layout.forceConstant = 80;

  // Adds a button to execute the layout
  mainContainer.appendChild(
    DomHelpers.button('Circle Layout', () => {
      graph.getDataModel().beginUpdate();
      try {
        // Creates a layout algorithm to be used with the graph
        const circleLayout = new CircleLayout(graph);
        circleLayout.execute(parent);
      } finally {
        if (args.animate) {
          const morph = new Morphing(graph, 6, 1.5, 20);
          morph.addListener(InternalEvent.DONE, function () {
            graph.getDataModel().endUpdate();
          });
          morph.startAnimation();
        } else {
          graph.getDataModel().endUpdate();
        }
      }
    })
  );

  // Adds a button to execute the layout
  mainContainer.appendChild(
    DomHelpers.button('Organic Layout', () => {
      graph.getDataModel().beginUpdate();
      try {
        layout.execute(parent);
      } finally {
        if (args.animate) {
          // Default values are 6, 1.5, 20
          const morph = new Morphing(graph, 10, 1.7, 20);
          morph.addListener(InternalEvent.DONE, function () {
            graph.getDataModel().endUpdate();
          });
          morph.startAnimation();
        } else {
          graph.getDataModel().endUpdate();
        }
      }
    })
  );

  mainContainer.appendChild(container);

  // Adds cells to the model in a single step
  const w = 30;
  const h = 30;

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'A', 0, 0, w, h);
    const v2 = graph.insertVertex(parent, null, 'B', 0, 0, w, h);
    const v3 = graph.insertVertex(parent, null, 'C', 0, 0, w, h);
    const v4 = graph.insertVertex(parent, null, 'D', 0, 0, w, h);
    const v5 = graph.insertVertex(parent, null, 'E', 0, 0, w, h);
    const v6 = graph.insertVertex(parent, null, 'F', 0, 0, w, h);
    const v7 = graph.insertVertex(parent, null, 'G', 0, 0, w, h);
    const v8 = graph.insertVertex(parent, null, 'H', 0, 0, w, h);
    graph.insertEdge(parent, null, 'ab', v1, v2);
    graph.insertEdge(parent, null, 'ac', v1, v3);
    graph.insertEdge(parent, null, 'cd', v3, v4);
    graph.insertEdge(parent, null, 'be', v2, v5);
    graph.insertEdge(parent, null, 'cf', v3, v6);
    graph.insertEdge(parent, null, 'ag', v1, v7);
    graph.insertEdge(parent, null, 'gh', v7, v8);
    graph.insertEdge(parent, null, 'gc', v7, v3);
    graph.insertEdge(parent, null, 'gd', v7, v4);
    graph.insertEdge(parent, null, 'eh', v5, v8);

    // Executes the layout
    layout.execute(parent);
  });

  return mainContainer;
};

export const Default = Template.bind({});
