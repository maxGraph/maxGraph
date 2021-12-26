import { Graph, InternalEvent, RubberBandHandler } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Basic/HelloWorld',
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

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  const graph = new Graph(container);

  if (args.rubberBand) new RubberBandHandler(graph);

  const parent = graph.getDefaultParent();

  graph.batchUpdate(() => {
    // Add cells to the model in a single step
    const vertex1 = graph.insertVertex({
      parent,
      value: 'Hello',
      position: [20, 20],
      size: [80, 30],
      relative: false,
    });

    const vertex2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
      relative: false,
    });

    const edge = graph.insertEdge({
      parent,
      source: vertex1,
      target: vertex2,
    });
  });

  return container;
};

export const Default = Template.bind({});
