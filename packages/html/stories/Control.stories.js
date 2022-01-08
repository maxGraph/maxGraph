import {
  Graph,
  InternalEvent,
  RubberBandHandler,
  DomHelpers,
  ImageShape,
  Rectangle,
  CellRenderer,
  ImageBox,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Icon_Images/Control',
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

  // Specifies the URL and size of the new control
  const deleteImage = new ImageBox('/images/forbidden.png', 16, 16);

  class MyCustomCellRenderer extends CellRenderer {
    createControl(state) {
      super.createControl(state);

      const { graph } = state.view;

      if (state.cell.isVertex()) {
        if (state.deleteControl == null) {
          const b = new Rectangle(0, 0, deleteImage.width, deleteImage.height);
          state.deleteControl = new ImageShape(b, deleteImage.src);
          state.deleteControl.dialect = graph.dialect;
          state.deleteControl.preserveImageAspect = false;

          this.initControl(state, state.deleteControl, false, function (evt) {
            if (graph.isEnabled()) {
              graph.removeCells([state.cell]);
              InternalEvent.consume(evt);
            }
          });
        }
      } else if (state.deleteControl != null) {
        state.deleteControl.destroy();
        state.deleteControl = null;
      }
    }

    getDeleteControlBounds(state) {
      // Helper function to compute the bounds of the control
      if (state.deleteControl != null) {
        const oldScale = state.deleteControl.scale;
        const w = state.deleteControl.bounds.width / oldScale;
        const h = state.deleteControl.bounds.height / oldScale;
        const s = state.view.scale;

        return state.cell.isEdge()
          ? new Rectangle(
              state.x + state.width / 2 - (w / 2) * s,
              state.y + state.height / 2 - (h / 2) * s,
              w * s,
              h * s
            )
          : new Rectangle(state.x + state.width - w * s, state.y, w * s, h * s);
      }
      return null;
    }

    redrawControl(state) {
      // Overridden to update the scale and bounds of the control
      super.redrawControl(state);

      if (state.deleteControl != null) {
        const bounds = this.getDeleteControlBounds(state);
        const s = state.view.scale;

        if (
          state.deleteControl.scale !== s ||
          !state.deleteControl.bounds.equals(bounds)
        ) {
          state.deleteControl.bounds = bounds;
          state.deleteControl.scale = s;
          state.deleteControl.redraw();
        }
      }
    }

    destroy(state) {
      // Overridden to remove the control if the state is destroyed
      super.destroy(state);

      if (state.deleteControl != null) {
        state.deleteControl.destroy();
        state.deleteControl = null;
      }
    }
  }

  class MyCustomGraph extends Graph {
    createCellRenderer() {
      return new MyCustomCellRenderer();
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  graph.setPanning(true);

  // Uncomment the following if you want the container
  // to fit the size of the graph
  // graph.setResizeContainer(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [20, 20],
      size: [80, 30],
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
    });
    const e1 = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
    });
  });

  graph.centerZoom = false;

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('Zoom In', () => {
      graph.zoomIn();
    })
  );

  buttons.appendChild(
    DomHelpers.button('Zoom Out', () => {
      graph.zoomOut();
    })
  );

  return div;
};

export const Default = Template.bind({});
