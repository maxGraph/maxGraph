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
  KeyHandler,
  getDefaultPlugins,
} from '@maxgraph/core';

import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';
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

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(`
  This example demonstrates the guides feature which aligns the current selection to the existing vertices in the graph.
  <br>
  Creating a grid using a canvas and installing a key handler for cursor keys is also demonstrated here, as well as snapping waypoints to terminals.
  `);

  const container = createGraphContainer(args);
  // Ensure focusable for keyboard events (some containers default to tabIndex -1) - not enough to make KeyHandler work in Storybook
  if (container.tabIndex < 0) container.tabIndex = 0;
  div.appendChild(container);

  // TODO provide a change default value of GUIDE_COLOR and GUIDE_STROKEWIDTH, see https://github.com/maxGraph/maxGraph/issues/192
  // Defines the guides to be red (default)
  // constants.GUIDE_COLOR = '#FF0000';

  // Defines the guides to be 1 pixel (default)
  // constants.GUIDE_STROKEWIDTH = 1;

  // Enables snapping waypoints to terminals
  EdgeHandler.prototype.snapToTerminals = true;

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new Graph(container, undefined, plugins);
  graph.setConnectable(true);
  graph.gridSize = 30;

  // Enables guides
  const selectionHandler = graph.getPlugin<SelectionHandler>('SelectionHandler');
  if (selectionHandler) {
    selectionHandler.guidesEnabled = true;
    // Alt disables guides (may not be needed, seems to work out of the box)
    selectionHandler.useGuidesForEvent = function (me) {
      return !eventUtils.isAltDown(me.getEvent());
    };
  }

  // Changes the default style for edges "in-place" and assigns an alternate edge style which is applied in Graph.flip
  // when the user double-clicks on the adjustment control point of the edge.
  // The ElbowConnector edge style switches to TopToBottom if the horizontal style is true.
  const style = graph.getStylesheet().getDefaultEdgeStyle();
  style.rounded = true;
  style.edgeStyle = EdgeStyle.ElbowConnector;
  graph.alternateEdgeStyle = { elbow: 'vertical' };

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      value: 'Hello,',
      x: 20,
      y: 40,
      width: 80,
      height: 70,
    });
    const v2 = graph.insertVertex({
      value: 'World!',
      x: 200,
      y: 140,
      width: 80,
      height: 40,
    });
    graph.insertEdge({ source: v1, target: v2 });
  });

  // Handles cursor keys
  const moveSelectedCellsWithKeyboard = function (keyCode: number) {
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
  };

  // Transfer initial focus to graph container for keystroke handling
  graph.container.focus();

  // TODO not working in storybook, work in vanilla example. This is probably due to events already installed by storybook
  // Handles keystroke events
  // Scope to container to avoid Storybook-level key handling conflicts (not working)
  const keyHandler = new KeyHandler(graph, graph.container);

  // Ignores enter keystroke. Remove this line if you want the enter keystroke to stop editing
  // keyHandler.enter = function () {};

  [37, 38, 39, 40].forEach((key) =>
    keyHandler.bindKey(key, () => moveSelectedCellsWithKeyboard(key))
  );

  return div;
};

export const Default = Template.bind({});
