import {
  Graph,
  InternalEvent,
  RubberBandHandler,
  ConnectionHandler,
  LayoutManager,
  ParallelEdgeLayout,
  ImageBox,
  KeyHandler,
  constants,
  EdgeStyle,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Events/Events',
  argTypes: {
    ...globalTypes,
    contextMenu: {
      type: 'boolean',
      defaultValue: false,
    },
    rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },
  },
};

const Template = ({ label, ...args }) => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  class MyCustomConnectionHandler extends ConnectionHandler {
    // Sets the image to be used for creating new connections
    connectImage = new ImageBox('/images/green-dot.gif', 14, 14);
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
    menu.addItem('Cell Item', '/images/image.gif', () => {
      alert('MenuItem1');
    });
  } else {
    menu.addItem('No-Cell Item', '/images/image.gif', () => {
      alert('MenuItem2');
    });
  }
  menu.addSeparator();
  menu.addItem('MenuItem3', '/images/warning.gif', () => {
    alert(`MenuItem3: ${graph.getSelectionCount()} selected`);
  });
}

export const Default = Template.bind({});
