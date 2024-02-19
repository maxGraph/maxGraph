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
  MaxWindow,
  KeyHandler,
  RubberBandHandler,
  InternalEvent,
  MaxLog,
  domUtils,
} from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Windows/Windows',
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
  configureImagesBasePath();
  const container = createGraphContainer(args);

  // Note that we're using the container scrollbars for the graph so that the
  // container extends to the parent div inside the window
  let wnd = new MaxWindow(
    'Scrollable, resizable, given height',
    container,
    50,
    50,
    220,
    224,
    true,
    true
  );

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Adds rubberband selection and keystrokes
  graph.setTooltips(true);
  graph.setPanning(true);

  if (args.rubberBand) new RubberBandHandler(graph);

  new KeyHandler(graph);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  wnd.setMaximizable(true);
  wnd.setResizable(true);
  wnd.setVisible(true);

  const lorem =
    'Lorem ipsum dolor sit amet, consectetur adipisici elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ';
  let content = document.createElement('div');
  domUtils.write(content, lorem + lorem + lorem);

  wnd = new MaxWindow(
    'Scrollable, resizable, auto height',
    content,
    300,
    50,
    200,
    null,
    true,
    true
  );
  wnd.setMaximizable(true);
  wnd.setScrollable(true);
  wnd.setResizable(true);
  wnd.setVisible(true);

  content = content.cloneNode(true);
  content.style.width = '400px';

  wnd = new MaxWindow(
    'Scrollable, resizable, fixed content',
    content,
    520,
    50,
    220,
    200,
    true,
    true
  );
  wnd.setMaximizable(true);
  wnd.setScrollable(true);
  wnd.setResizable(true);
  wnd.setVisible(true);

  MaxLog.show();

  return container;
};

export const Default = Template.bind({});
