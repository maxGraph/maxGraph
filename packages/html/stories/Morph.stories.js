import {
  Graph,
  mxDomHelpers,
  mxMorphing,
  InternalEvent,
  RubberBand,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Effects/Morph',
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
  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  // Disables the built-in context menu
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBand(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  let v1;
  var v2;
  try {
    v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  let mult = 1;

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    mxDomHelpers.button('Morph', function () {
      graph.clearSelection();

      graph.getModel().beginUpdate();
      try {
        let geo = graph.getCellGeometry(v1);
        geo = geo.clone();
        geo.x += 180 * mult;
        graph.getModel().setGeometry(v1, geo);

        geo = graph.getCellGeometry(v2);
        geo = geo.clone();
        geo.x -= 180 * mult;
        graph.getModel().setGeometry(v2, geo);
      } finally {
        // Arguments are number of steps, ease and delay
        const morph = new mxMorphing(graph, 20, 1.2, 20);
        morph.addListener(InternalEvent.DONE, function () {
          graph.getModel().endUpdate();
        });
        morph.startAnimation();
      }

      mult *= -1;
    })
  );

  return div;
};

export const Default = Template.bind({});
