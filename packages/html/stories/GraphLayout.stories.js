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
  constants,
  CircleLayout,
  DomHelpers,
  FastOrganicLayout,
  Graph,
  InternalEvent,
  Morphing,
  Perimeter,
} from '@maxgraph/core';

import { globalTypes, globalValues } from './shared/args.js';

// TODO apply this settings to the container used by the Graph
const HTML_TEMPLATE = `
<!-- Page passes the container for the graph to the program -->
<body onload="main(document.getElementById('graphContainer'))">

  <!-- Creates a container for the graph with a grid wallpaper. Make sure to define the position
    and overflow attributes! See comments on the adding of the size-listener on line 54 ff!  -->
  <div id="graphContainer"
    style="position:relative;overflow:auto;width:821px;height:641px;background:url('editors/images/grid.gif');">
  </div>
  <br>
</body>
`;

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

const Template = ({ label, ...args }) => {
  const mainContainer = document.createElement('div');
  const container = document.createElement('div');

  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Creates the graph inside the given container
  let graph = new Graph(container);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Changes the default vertex style in-place
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = constants.SHAPE.ELLIPSE;
  style.perimiter = Perimeter.EllipsePerimeter;
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
  let parent = graph.getDefaultParent();

  // Creates a layout algorithm to be used
  // with the graph
  let layout = new FastOrganicLayout(graph);

  // Moves stuff wider apart than usual
  layout.forceConstant = 80;

  // Adds a button to execute the layout
  mainContainer.appendChild(
    DomHelpers.button('Circle Layout', function (evt) {
      graph.getDataModel().beginUpdate();
      try {
        // Creates a layout algorithm to be used
        // with the graph
        let circleLayout = new CircleLayout(graph);
        circleLayout.execute(parent);
      } finally {
        if (args.animate) {
          let morph = new Morphing(graph, 6, 1.5, 20);
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
    DomHelpers.button('Organic Layout', function (evt) {
      graph.getDataModel().beginUpdate();
      try {
        layout.execute(parent);
      } finally {
        if (args.animate) {
          // Default values are 6, 1.5, 20
          let morph = new Morphing(graph, 10, 1.7, 20);
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
  let w = 30;
  let h = 30;

  graph.batchUpdate(() => {
    let v1 = graph.insertVertex(parent, null, 'A', 0, 0, w, h);
    let v2 = graph.insertVertex(parent, null, 'B', 0, 0, w, h);
    let v3 = graph.insertVertex(parent, null, 'C', 0, 0, w, h);
    let v4 = graph.insertVertex(parent, null, 'D', 0, 0, w, h);
    let v5 = graph.insertVertex(parent, null, 'E', 0, 0, w, h);
    let v6 = graph.insertVertex(parent, null, 'F', 0, 0, w, h);
    let v7 = graph.insertVertex(parent, null, 'G', 0, 0, w, h);
    let v8 = graph.insertVertex(parent, null, 'H', 0, 0, w, h);
    let e1 = graph.insertEdge(parent, null, 'ab', v1, v2);
    let e2 = graph.insertEdge(parent, null, 'ac', v1, v3);
    let e3 = graph.insertEdge(parent, null, 'cd', v3, v4);
    let e4 = graph.insertEdge(parent, null, 'be', v2, v5);
    let e5 = graph.insertEdge(parent, null, 'cf', v3, v6);
    let e6 = graph.insertEdge(parent, null, 'ag', v1, v7);
    let e7 = graph.insertEdge(parent, null, 'gh', v7, v8);
    let e8 = graph.insertEdge(parent, null, 'gc', v7, v3);
    let e9 = graph.insertEdge(parent, null, 'gd', v7, v4);
    let e10 = graph.insertEdge(parent, null, 'eh', v5, v8);

    // Executes the layout
    layout.execute(parent);
  });

  return mainContainer;
};

export const Default = Template.bind({});
