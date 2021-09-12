import { Graph } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Labels/LabelPosition',
  argTypes: {
    ...globalTypes,
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

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Defines the common part of all cell styles as a string-prefix
  const prefix = 'shape=image;image=images/icons48/keys.png;';

  // Adds cells to the model in a single step and set the vertex
  // label positions using the label position styles. Vertical
  // and horizontal label position styles can be combined.
  // Note: Alternatively, vertex labels can be set be overriding
  // CellRenderer.getLabelBounds.
  graph.getModel().beginUpdate();
  try {
    graph.insertVertex(
      parent,
      null,
      'Bottom',
      60,
      60,
      60,
      60,
      `${prefix}verticalLabelPosition=bottom;verticalAlign=top`
    );
    graph.insertVertex(
      parent,
      null,
      'Top',
      140,
      60,
      60,
      60,
      `${prefix}verticalLabelPosition=top;verticalAlign=bottom`
    );
    graph.insertVertex(
      parent,
      null,
      'Left',
      60,
      160,
      60,
      60,
      `${prefix}labelPosition=left;align=right`
    );
    graph.insertVertex(
      parent,
      null,
      'Right',
      140,
      160,
      60,
      60,
      `${prefix}labelPosition=right;align=left`
    );
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  return container;
};

export const Default = Template.bind({});
