import { Graph, constants, RubberBandHandler, cloneUtils } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Styles/HoverStyle',
  argTypes: {
    ...globalTypes,
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

  // Creates the graph inside the given container
  const graph = new Graph(container);

  function updateStyle(state, hover) {
    if (hover) {
      state.style.fillColor = '#ff0000';
    }

    // Sets rounded style for both cases since the rounded style
    // is not set in the default style and is therefore inherited
    // once it is set, whereas the above overrides the default value
    state.style.rounded = hover ? '1' : '0';
    state.style.strokeWidth = hover ? '4' : '1';
    state.style.fontStyle = hover ? constants.FONT.BOLD : '0';
  }

  // Changes fill color to red on mouseover
  graph.addMouseListener({
    currentState: null,
    previousStyle: null,
    mouseDown(sender, me) {
      if (this.currentState != null) {
        this.dragLeave(me.getEvent(), this.currentState);
        this.currentState = null;
      }
    },
    mouseMove(sender, me) {
      if (this.currentState != null && me.getState() == this.currentState) {
        return;
      }

      let tmp = graph.view.getState(me.getCell());

      // Ignores everything but vertices
      if (graph.isMouseDown || (tmp != null && !tmp.cell.isVertex())) {
        tmp = null;
      }

      if (tmp != this.currentState) {
        if (this.currentState != null) {
          this.dragLeave(me.getEvent(), this.currentState);
        }

        this.currentState = tmp;

        if (this.currentState != null) {
          this.dragEnter(me.getEvent(), this.currentState);
        }
      }
    },
    mouseUp(sender, me) {},
    dragEnter(evt, state) {
      if (state != null) {
        this.previousStyle = state.style;
        state.style = cloneUtils.clone(state.style);
        updateStyle(state, true);
        state.shape.apply(state);
        state.shape.redraw();

        if (state.text != null) {
          state.text.apply(state);
          state.text.redraw();
        }
      }
    },
    dragLeave(evt, state) {
      if (state != null) {
        state.style = this.previousStyle;
        updateStyle(state, false);
        state.shape.apply(state);
        state.shape.redraw();

        if (state.text != null) {
          state.text.apply(state);
          state.text.redraw();
        }
      }
    },
  });

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  return container;
};

export const Default = Template.bind({});
