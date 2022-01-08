import { Graph, CellTracker, constants, InternalEvent } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Zoom_OffPage/OffPage',
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

  // Use complete cell as highlight region
  constants.ACTIVE_REGION = 1;

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setEnabled(false);

  // Highlights offpage connectors
  const highlight = new CellTracker(graph, null, function (me) {
    const cell = me.getCell();

    if (cell != null && cell.value != null && typeof cell.value.create === 'function') {
      return cell;
    }

    return null;
  });

  // Handles clicks on offpage connectors and
  // executes function in user object
  graph.addListener(InternalEvent.CLICK, function (source, evt) {
    const cell = evt.getProperty('cell');

    if (cell != null && cell.value != null && typeof cell.value.create === 'function') {
      cell.value.create();
    }
  });

  // Handles clicks on offpage connectors and
  // executes function in user object
  graph.getCursorForCell = function (cell) {
    if (cell != null && cell.value != null && typeof cell.value.create === 'function') {
      return 'pointer';
    }
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  let first = null;
  let second = null;

  first = function () {
    const value = {
      toString() {
        return 'Next';
      },
      create: second,
    };

    // Adds cells to the model in a single step
    graph.batchUpdate(() => {
      graph.getDataModel().setRoot(graph.getDataModel().createRoot());
      const parent = graph.getDefaultParent();

      const v1 = graph.insertVertex(
        parent,
        null,
        'Click',
        30,
        20,
        80,
        30,
        'fillColor=#FFFF88;strokeColor=#FF1A00'
      );
      const v2 = graph.insertVertex(
        parent,
        null,
        'Next',
        20,
        150,
        100,
        30,
        'fillColor=#FFFF88;strokeColor=#FF1A00'
      );
      const v3 = graph.insertVertex(
        parent,
        null,
        value,
        200,
        150,
        40,
        40,
        'shape=triangle;align=left;fillColor=#C3D9FF;strokeColor=#4096EE'
      );
      const e1 = graph.insertEdge(parent, null, null, v1, v2, 'strokeColor=#FF1A00');
    });
  };

  second = function () {
    const value = {
      toString() {
        return 'Prev';
      },
      create: first,
    };

    // Adds cells to the model in a single step
    graph.batchUpdate(() => {
      graph.getDataModel().setRoot(graph.getDataModel().createRoot());
      const parent = graph.getDefaultParent();

      const v1 = graph.insertVertex(
        parent,
        null,
        'Click',
        30,
        20,
        80,
        30,
        'fillColor=#CDEB8B;strokeColor=#008C00'
      );
      const v2 = graph.insertVertex(
        parent,
        null,
        'Prev',
        220,
        20,
        100,
        30,
        'fillColor=#CDEB8B;strokeColor=#008C00'
      );
      const v3 = graph.insertVertex(
        parent,
        null,
        value,
        30,
        150,
        40,
        40,
        'shape=triangle;align=right;fillColor=#C3D9FF;strokeColor=#4096EE;direction=west'
      );
      const e1 = graph.insertEdge(parent, null, null, v1, v2, 'strokeColor=#008C00');
    });
  };

  first();

  return container;
};

export const Default = Template.bind({});
