import {
  Graph,
  CylinderShape,
  DomHelpers,
  CellRenderer,
  Point,
  Rectangle,
  VertexHandler,
  InternalEvent,
  RubberBandHandler,
  utils,
  VertexHandle,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/Handles',
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

  class MyShape extends CylinderShape {
    defaultPos1 = 20;

    defaultPos2 = 60;

    getLabelBounds(rect) {
      const pos1 = utils.getValue(this.style, 'pos1', this.defaultPos1) * this.scale;
      const pos2 = utils.getValue(this.style, 'pos2', this.defaultPos2) * this.scale;
      return new Rectangle(
        rect.x,
        rect.y + pos1,
        rect.width,
        Math.min(rect.height, pos2) - Math.max(0, pos1)
      );
    }

    redrawPath(path, x, y, w, h, isForeground) {
      const pos1 = utils.getValue(this.style, 'pos1', this.defaultPos1);
      const pos2 = utils.getValue(this.style, 'pos2', this.defaultPos2);

      if (isForeground) {
        if (pos1 < h) {
          path.moveTo(0, pos1);
          path.lineTo(w, pos1);
        }

        if (pos2 < h) {
          path.moveTo(0, pos2);
          path.lineTo(w, pos2);
        }
      } else {
        path.rect(0, 0, w, h);
      }
    }
  }
  CellRenderer.registerShape('myShape', MyShape);

  class MyCustomVertexHandler extends VertexHandler {
    livePreview = true;
    
    rotationEnabled = true;

    createCustomHandles() {
      if (this.state.style.shape === 'myShape') {
        // Implements the handle for the first divider
        const firstHandle = new VertexHandle(this.state);

        firstHandle.getPosition = function (bounds) {
          const pos2 = Math.max(
            0,
            Math.min(
              bounds.height,
              parseFloat(
                utils.getValue(this.state.style, 'pos2', MyShape.prototype.defaultPos2)
              )
            )
          );
          const pos1 = Math.max(
            0,
            Math.min(
              pos2,
              parseFloat(
                utils.getValue(this.state.style, 'pos1', MyShape.prototype.defaultPos1)
              )
            )
          );

          return new Point(bounds.getCenterX(), bounds.y + pos1);
        };

        firstHandle.setPosition = function (bounds, pt) {
          const pos2 = Math.max(
            0,
            Math.min(
              bounds.height,
              parseFloat(
                utils.getValue(this.state.style, 'pos2', MyShape.prototype.defaultPos2)
              )
            )
          );

          this.state.style.pos1 = Math.round(
            Math.max(0, Math.min(pos2, pt.y - bounds.y))
          );
        };

        firstHandle.execute = function () {
          this.copyStyle('pos1');
        };

        firstHandle.ignoreGrid = true;

        // Implements the handle for the second divider
        const secondHandle = new VertexHandle(this.state);

        secondHandle.getPosition = function (bounds) {
          const pos1 = Math.max(
            0,
            Math.min(
              bounds.height,
              parseFloat(
                utils.getValue(this.state.style, 'pos1', MyShape.prototype.defaultPos1)
              )
            )
          );
          const pos2 = Math.max(
            pos1,
            Math.min(
              bounds.height,
              parseFloat(
                utils.getValue(this.state.style, 'pos2', MyShape.prototype.defaultPos2)
              )
            )
          );

          return new Point(bounds.getCenterX(), bounds.y + pos2);
        };

        secondHandle.setPosition = function (bounds, pt) {
          const pos1 = Math.max(
            0,
            Math.min(
              bounds.height,
              parseFloat(
                utils.getValue(this.state.style, 'pos1', MyShape.prototype.defaultPos1)
              )
            )
          );

          this.state.style.pos2 = Math.round(
            Math.max(pos1, Math.min(bounds.height, pt.y - bounds.y))
          );
        };

        secondHandle.execute = function () {
          this.copyStyle('pos2');
        };

        secondHandle.ignoreGrid = true;

        return [firstHandle, secondHandle];
      }

      return null;
    }
  }

  class MyCustomGraph extends Graph {
    createVertexHandler(state) {
      return new MyCustomVertexHandler(state);
    }
  }

  // Disables the built-in context menu
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  graph.setCellsCloneable(true);
  graph.setHtmlLabels(true);
  graph.setPanning(true);
  graph.centerZoom = false;

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(
      parent,
      null,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      20,
      20,
      240,
      120,
      { shape: 'myShape', whiteSpace: 'wrap', overflow: 'hidden', pos1: 30, pos2: 80 }
    );
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('+', function () {
      graph.zoomIn();
    })
  );
  buttons.appendChild(
    DomHelpers.button('-', function () {
      graph.zoomOut();
    })
  );

  return div;
};

export const Default = Template.bind({});
