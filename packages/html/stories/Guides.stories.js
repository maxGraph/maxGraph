import {
  Graph,
  GraphHandler,
  InternalEvent,
  constants,
  EdgeHandler,
  EdgeStyle,
  RubberBandHandler,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Misc/Guides',
  argTypes: {
    ...globalTypes,
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

  // Enables guides
  GraphHandler.prototype.guidesEnabled = true;

  // Alt disables guides
  GraphHandler.prototype.useGuidesForEvent = function (me) {
    return !InternalEvent.isAltDown(me.getEvent());
  };

  // Defines the guides to be red (default)
  // constants.GUIDE_COLOR = '#FF0000';

  // Defines the guides to be 1 pixel (default)
  // constants.GUIDE_STROKEWIDTH = 1;

  // Enables snapping waypoints to terminals
  EdgeHandler.prototype.snapToTerminals = true;

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setConnectable(true);
  graph.gridSize = 30;

  // Changes the default style for edges "in-place" and assigns
  // an alternate edge style which is applied in Graph.flip
  // when the user double clicks on the adjustment control point
  // of the edge. The ElbowConnector edge style switches to TopToBottom
  // if the horizontal style is true.
  const style = graph.getStylesheet().getDefaultEdgeStyle();
  style.rounded = true;
  style.edge = EdgeStyle.ElbowConnector;
  graph.alternateEdgeStyle = 'elbow=vertical';

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  let v1;
  try {
    v1 = graph.insertVertex(parent, null, 'Hello,', 20, 40, 80, 70);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 140, 80, 40);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  // Handles cursor keys
  const nudge = function (keyCode) {
    if (!graph.isSelectionEmpty()) {
      let dx = 0;
      let dy = 0;

      if (keyCode === 37) {
        dx = -1;
      } else if (keyCode === 38) {
        dy = -1;
      } else if (keyCode === 39) {
        dx = 1;
      } else if (keyCode === 40) {
        dy = 1;
      }

      graph.moveCells(graph.getSelectionCells(), dx, dy);
    }

    // Transfer initial focus to graph container for keystroke handling
    graph.container.focus();

    // Handles keystroke events
    const keyHandler = new KeyHandler(graph);

    // Ignores enter keystroke. Remove this line if you want the
    // enter keystroke to stop editing
    keyHandler.enter = function () {};

    keyHandler.bindKey(37, function () {
      nudge(37);
    });

    keyHandler.bindKey(38, function () {
      nudge(38);
    });

    keyHandler.bindKey(39, function () {
      nudge(39);
    });

    keyHandler.bindKey(40, function () {
      nudge(40);
    });
  };

  return container;
};

export const Default = Template.bind({});
