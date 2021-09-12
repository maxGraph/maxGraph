import { Graph, InternalEvent, GraphHandler, RubberBand } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/Constituent',
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

  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  class MyCustomGraphHandler extends GraphHandler {
    /**
     * Redirects start drag to parent.
     */
    getInitialCellForEvent(me) {
      let cell = super.getInitialCellForEvent(me);
      if (this.graph.isPart(cell)) {
        cell = cell.getParent();
      }
      return cell;
    }
  }

  class MyCustomGraph extends Graph {
    foldingEnabled = false;

    recursiveResize = true;

    isPart(cell) {
      // Helper method to mark parts with constituent=1 in the style
      return this.getCurrentCellStyle(cell).constituent == '1';
    }

    selectCellForEvent(cell, evt) {
      // Redirects selection to parent
      if (this.isPart(cell)) {
        cell = cell.getParent();
      }
      super.selectCellForEvent(cell, evt);
    }

    createGraphHandler() {
      return new MyCustomGraphHandler(this);
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);

  // Enables rubberband selection
  new RubberBand(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      position: [20, 20],
      size: [120, 70],
    });
    const v2 = graph.insertVertex({
      parent: v1,
      value: 'Constituent',
      position: [20, 20],
      size: [80, 30],
      style: 'constituent=1;',
    });
  });

  return container;
};

export const Default = Template.bind({});
