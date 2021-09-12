import { Graph, mxClient } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Misc/Thread',
  argTypes: {
    ...globalTypes,
  },
};

const Template = ({ label, ...args }) => {
  mxClient.setImageBasePath('/images');

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

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();
  let v1;
  let v2;
  let e1;

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    e1 = graph.insertEdge(parent, null, '', v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  // Function to switch the overlay every 5 secs
  const f = () => {
    const overlays = graph.getCellOverlays(v1);

    if (overlays == null) {
      graph.removeCellOverlays(v2);
      graph.setCellWarning(v1, 'Tooltip');
    } else {
      graph.removeCellOverlays(v1);
      graph.setCellWarning(v2, 'Tooltip');
    }
  };

  window.setInterval(f, 1000);
  f();

  return container;
};

export const Default = Template.bind({});
