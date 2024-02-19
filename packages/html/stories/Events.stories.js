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
  RubberBandHandler,
  ConnectionHandler,
  LayoutManager,
  ParallelEdgeLayout,
  ImageBox,
  KeyHandler,
  EdgeStyle,
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
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Events/Events',
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

  class MyCustomConnectionHandler extends ConnectionHandler {
    // Sets the image to be used for creating new connections
    connectImage = new ImageBox('images/green-dot.gif', 14, 14);
  }

  // Disables built-in context menu
  InternalEvent.disableContextMenu(container);

  class MyCustomGraph extends Graph {
    alternateEdgeStyle = 'elbow=vertical';

    getTooltipForCell(cell) {
      // Installs a custom tooltip for cells
      return 'Doubleclick and right- or shiftclick';
    }

    createConnectionHandler() {
      return new MyCustomConnectionHandler(this);
    }
  }

  // Creates the graph inside the DOM node.
  // Optionally you can enable panning, tooltips and connections
  // using graph.setPanning(), setTooltips() & setConnectable().
  // To enable rubberband selection and basic keyboard events,
  // use new RubberBandHandler(graph) and new KeyHandler(graph).
  const graph = new MyCustomGraph(container);

  // Enables tooltips, new connections and panning
  graph.setPanning(true);
  graph.setTooltips(true);
  graph.setConnectable(true);

  // Automatically handle parallel edges
  const layout = new ParallelEdgeLayout(graph);
  const layoutMgr = new LayoutManager(graph);

  layoutMgr.getLayout = function (cell) {
    if (cell.getChildCount() > 0) {
      return layout;
    }
  };

  // Enables rubberband (marquee) selection and a handler
  // for basic keystrokes (eg. return, escape during editing).
  const rubberband = new RubberBandHandler(graph);
  const keyHandler = new KeyHandler(graph);

  // Changes the default style for edges "in-place" and assigns
  // an alternate edge style which is applied in Graph.flip
  // when the user double clicks on the adjustment control point
  // of the edge. The ElbowConnector edge style switches to TopToBottom
  // if the horizontal style is true.
  const style = graph.getStylesheet().getDefaultEdgeStyle();
  style.rounded = true;
  style.edge = EdgeStyle.ElbowConnector;

  const popupMenuHandler = graph.getPlugin('PopupMenuHandler');

  // Installs a popupmenu handler using local function (see below).
  popupMenuHandler.factoryMethod = (menu, cell, evt) => {
    return createPopupMenu(graph, menu, cell, evt);
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Doubleclick', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'Right-/Shiftclick', 200, 150, 120, 30);
    const v3 = graph.insertVertex(parent, null, 'Connect/Reconnect', 200, 20, 120, 30);
    const v4 = graph.insertVertex(parent, null, 'Control-Drag', 20, 150, 100, 30);
    const e1 = graph.insertEdge(parent, null, 'Tooltips', v1, v2);
    const e2 = graph.insertEdge(parent, null, '', v2, v3);
  });

  return container;
};

function createPopupMenu(graph, menu, cell, evt) {
  // Function to create the entries in the popupmenu
  if (cell != null) {
    menu.addItem('Cell Item', 'images/image.gif', () => {
      alert('MenuItem1');
    });
  } else {
    menu.addItem('No-Cell Item', 'images/image.gif', () => {
      alert('MenuItem2');
    });
  }
  menu.addSeparator();
  menu.addItem('MenuItem3', 'images/warning.gif', () => {
    alert(`MenuItem3: ${graph.getSelectionCount()} selected`);
  });
}

export const Default = Template.bind({});
