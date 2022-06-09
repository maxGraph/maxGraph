import { Graph } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Labels/Wrapping',
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

  // Enables HTML labels as wrapping is only available for those
  graph.setHtmlLabels(true);

  // Disables in-place editing for edges
  graph.isCellEditable = function (cell) {
    return !cell.isEdge();
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Cum Caesar vidisset, portum plenum esse, iuxta navigavit.',
      position: [20, 20],
      size: [100, 70],
      style: { whiteSpace: 'wrap' },
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'Cum Caesar vidisset, portum plenum esse, iuxta navigavit.',
      position: [220, 150],
      size: [80, 70],
      style: { whiteSpace: 'wrap' },
    });
    const e1 = graph.insertEdge({
      parent,
      value: 'Cum Caesar vidisset, portum plenum esse, iuxta navigavit.',
      source: v1,
      target: v2,
      style: { whiteSpace: 'wrap' },
    });
    e1.geometry.width = 100;
  });

  return container;
};

export const Default = Template.bind({});
