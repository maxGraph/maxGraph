import {
  Graph,
  MaxWindow,
  mxKeyHandler,
  RubberBand,
  InternalEvent,
  MaxLog,
  DomUtils,
  Client,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Windows/Windows',
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
  Client.setImageBasePath('/images');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

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

  if (args.rubberBand) new RubberBand(graph);

  new mxKeyHandler(graph);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  wnd.setMaximizable(true);
  wnd.setResizable(true);
  wnd.setVisible(true);

  const lorem =
    'Lorem ipsum dolor sit amet, consectetur adipisici elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ';
  let content = document.createElement('div');
  DomUtils.write(content, lorem + lorem + lorem);

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
