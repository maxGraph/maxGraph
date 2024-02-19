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
  SelectionHandler,
  eventUtils,
  EdgeHandler,
  EdgeStyle,
  RubberBandHandler,
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
  title: 'Misc/Guides',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Alt disables guides
  SelectionHandler.prototype.useGuidesForEvent = function (me) {
    return !eventUtils.isAltDown(me.getEvent());
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

  // Enables guides
  const selectionHandler = graph.getPlugin('SelectionHandler');
  if (selectionHandler) selectionHandler.guidesEnabled = true;

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
  graph.batchUpdate(() => {
    let v1;
    v1 = graph.insertVertex(parent, null, 'Hello,', 20, 40, 80, 70);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 140, 80, 40);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

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
