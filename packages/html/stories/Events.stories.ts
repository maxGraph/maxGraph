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
  type Cell,
  Client,
  ConnectionHandler,
  EdgeStyle,
  Graph,
  type GraphLayout,
  ImageBox,
  InternalEvent,
  LayoutManager,
  ParallelEdgeLayout,
  type PopupMenuHandler,
  type MaxPopupMenu,
  RubberBandHandler,
  getDefaultPlugins,
  type GraphPluginConstructor,
  type TooltipHandler,
} from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import {
  configureImagesBasePath,
  createGraphContainer,
  createMainDiv,
} from './shared/configure.js';
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

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();

  const div = createMainDiv(`
  Creating a graph container and using interaction on the graph, including marquee selection, custom tooltips, context menu.
  <p>
  It also demonstrates how to use an edge style in the default stylesheet, and handle the double click on the adjustment point.
  <br>
   See also the <code>Overlays</code> Story for click event handling.
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

  // Disables the built-in context menu
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement, plugins: GraphPluginConstructor[]) {
      super(container, undefined, plugins);
    }
  }

  // Enables rubberband (marquee) selection.
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the DOM node.
  const graph = new MyCustomGraph(container, plugins);

  // Sets the image to be used for creating new connections
  const connectionHandler = graph.getPlugin<ConnectionHandler>('ConnectionHandler')!;
  connectionHandler.connectImage = new ImageBox(
    `${Client.imageBasePath}/green-dot.gif`,
    14,
    14
  );

  // Enables tooltips, new connections and panning
  graph.setPanning(true);
  graph.setTooltips(true);
  graph.setConnectable(true);

  // Custom tooltip
  const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler')!;
  tooltipHandler.getTooltipForCell = function () {
    return 'Double-click and right- or shift-click';
  };

  // Automatically handle parallel edges
  const layout = new ParallelEdgeLayout(graph);
  const layoutMgr = new LayoutManager(graph);
  layoutMgr.getLayout = function (cell, _eventName: string): GraphLayout | null {
    if ((cell?.getChildCount() ?? 0) > 0) {
      return layout;
    }
    return null;
  };

  // Changes the default style for edges "in-place" and assigns an alternate edge style which is applied in Graph.flipEdge
  // when the user double-clicks on the adjustment control point of the edge.
  // The ElbowConnector edge style switches to TopToBottom if the horizontal style is true.
  const style = graph.getStylesheet().getDefaultEdgeStyle();
  style.rounded = true;
  style.edgeStyle = EdgeStyle.ElbowConnector;
  graph.alternateEdgeStyle = { elbow: 'vertical' };

  const popupMenuHandler = graph.getPlugin<PopupMenuHandler>('PopupMenuHandler')!;
  // Installs a popupmenu handler using local function (see below).
  popupMenuHandler.factoryMethod = (menu, cell, evt) => {
    return createPopupMenu(graph, menu, cell, evt);
  };

  // Gets the default parent for inserting new cells. This is normally the first child of the root (i.e. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Double-click', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'Right-/Shift-click', 200, 150, 120, 30);
    const v3 = graph.insertVertex(parent, null, 'Connect/Reconnect', 200, 20, 120, 30);
    graph.insertVertex(parent, null, 'Control-Drag', 20, 150, 100, 30);
    graph.insertEdge(parent, null, 'Tooltips', v1, v2);
    graph.insertEdge(parent, null, '', v2, v3);
  });

  return div;
};

function createPopupMenu(
  graph: Graph,
  menu: MaxPopupMenu,
  cell: Cell | null,
  _evt: MouseEvent
) {
  // Function to create the entries in the popupmenu
  if (cell != null) {
    menu.addItem('Cell Item', `${Client.imageBasePath}/image.gif`, () => {
      alert('MenuItem1');
    });
  } else {
    menu.addItem('No-Cell Item', `${Client.imageBasePath}/image.gif`, () => {
      alert('MenuItem2');
    });
  }
  menu.addSeparator();
  menu.addItem('MenuItem3', `${Client.imageBasePath}/warning.gif`, () => {
    alert(`MenuItem3: ${graph.getSelectionCount()} selected`);
  });
}

export const Default = Template.bind({});
