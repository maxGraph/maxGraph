import {
  Graph,
  CellOverlay,
  InternalEvent,
  CellTracker,
  utils,
  ImageBox,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Effects/Overlays',
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

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Highlights the vertices when the mouse enters
  const highlight = new CellTracker(graph, '#00FF00');

  // Enables tooltips for the overlays
  graph.setTooltips(true);

  // Installs a handler for click events in the graph
  // that toggles the overlay for the respective cell
  graph.addListener(InternalEvent.CLICK, (sender, evt) => {
    const cell = evt.getProperty('cell');

    if (cell != null) {
      const overlays = graph.getCellOverlays(cell);

      if (overlays.length==0) {
        // Creates a new overlay with an image and a tooltip
        const overlay = new CellOverlay(
          new ImageBox('/images/check.png', 16, 16),
          'Overlay tooltip'
        );

        // Installs a handler for clicks on the overlay
        overlay.addListener(InternalEvent.CLICK, (sender, evt2) => {
          alert('Overlay clicked');
        });

        // Sets the overlay for the cell in the graph
        graph.addCellOverlay(cell, overlay);
      } else {
        graph.removeCellOverlays(cell);
      }
    }
  });

  // Installs a handler for double click events in the graph
  // that shows an alert box
  graph.addListener(InternalEvent.DOUBLE_CLICK, (sender, evt) => {
    const cell = evt.getProperty('cell');
    alert(`Doubleclick: ${cell != null ? 'Cell' : 'Graph'}`);
    evt.consume();
  });

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Click,',
      position: [20, 20],
      size: [60, 40],
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'Doubleclick',
      position: [200, 150],
      size: [100, 40],
    });
    const e1 = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
    });
  });

  return container;
};

export const Default = Template.bind({});
