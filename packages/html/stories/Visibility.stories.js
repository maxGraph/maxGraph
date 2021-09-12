import { Graph, RubberBand, mxDomHelpers } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Misc/Visibility',
  argTypes: {
    ...globalTypes,
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

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBand(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  let showOne = true;
  let showTwo = true;
  let showThree = true;

  // Overridden to implement dynamic conditions
  const isVisible = function () {
    // TODO super cannot be used here
    // let result = super.isVisible();
    let result;
    if (result && this.value != null) {
      result =
        (showOne && this.value == '1') ||
        (showTwo && this.value == '2') ||
        (showThree && this.value == '3');
    }
    return result;
  };

  // Adds cells to the model in a single step
  let v1;
  graph.batchUpdate(() => {
    v1 = graph.insertVertex({
      parent,
      value: '1',
      position: [20, 20],
      size: [80, 30],
    });
    v1.isVisible = isVisible;

    const v2 = graph.insertVertex({
      parent,
      value: '2',
      position: [200, 150],
      size: [80, 30],
    });
    v2.isVisible = isVisible;

    const e1 = graph.insertEdge({
      parent,
      value: '3',
      source: v1,
      target: v2,
    });
    e1.isVisible = isVisible;
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  // Dynamic conditions (requires refresh)
  buttons.appendChild(
    mxDomHelpers.button('Cond 1', function () {
      showOne = !showOne;
      graph.refresh();
    })
  );
  buttons.appendChild(
    mxDomHelpers.button('Cond 2', function () {
      showTwo = !showTwo;
      graph.refresh();
    })
  );
  buttons.appendChild(
    mxDomHelpers.button('Cond 3', function () {
      showThree = !showThree;
      graph.refresh();
    })
  );

  // Explicit show/hide
  buttons.appendChild(
    mxDomHelpers.button('Toggle cell', function () {
      graph.toggleCells(!v1.isVisible(), [v1], true);
    })
  );

  // Explicit remove/add
  let removed = null;

  buttons.appendChild(
    mxDomHelpers.button('Add/remove cell', function () {
      if (removed != null) {
        graph.addCells(removed);
        removed = null;
      } else {
        removed = graph.removeCells([v1]);
      }
    })
  );

  return div;
};

export const Default = Template.bind({});
