import {
  Graph,
  InternalEvent,
  RubberBand,
  Point,
  GraphHandler,
  utils,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Events/Boundary',
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
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  class MyCustomGraph extends Graph {
    // Enables moving of relative children
    isCellLocked(cell) {
      return false;
    }

    // Removes folding icon for relative children
    isCellFoldable(cell, collapse) {
      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i++) {
        const child = cell.getChildAt(i);
        const geo = child.getGeometry();

        if (geo != null && geo.relative) {
          return false;
        }
      }

      return childCount > 0;
    }

    // Returns the relative position of the given child
    getRelativePosition(state, dx, dy) {
      if (state != null) {
        const model = graph.getModel();
        const geo = state.cell.getGeometry();

        if (geo != null && geo.relative && !state.cell.isEdge()) {
          const parent = state.cell.getParent();

          if (parent.isVertex()) {
            const pstate = graph.view.getState(parent);

            if (pstate != null) {
              const { scale } = graph.view;
              let x = state.x + dx;
              let y = state.y + dy;

              if (geo.offset != null) {
                x -= geo.offset.x * scale;
                y -= geo.offset.y * scale;
              }

              x = (x - pstate.x) / pstate.width;
              y = (y - pstate.y) / pstate.height;

              if (Math.abs(y - 0.5) <= Math.abs((x - 0.5) / 2)) {
                x = x > 0.5 ? 1 : 0;
                y = Math.min(1, Math.max(0, y));
              } else {
                x = Math.min(1, Math.max(0, x));
                y = y > 0.5 ? 1 : 0;
              }

              return new Point(x, y);
            }
          }
        }
      }

      return null;
    }

    // Replaces translation for relative children
    translateCell(cell, dx, dy) {
      const rel = this.getRelativePosition(
        this.view.getState(cell),
        dx * graph.view.scale,
        dy * graph.view.scale
      );

      if (rel != null) {
        let geo = cell.getGeometry();

        if (geo != null && geo.relative) {
          geo = geo.clone();
          geo.x = rel.x;
          geo.y = rel.y;

          this.model.setGeometry(cell, geo);
        }
      } else {
        Graph.prototype.translateCell.apply(this, arguments);
      }
    }
  }

  // Creates the graph inside the given this.el
  const graph = new MyCustomGraph(container);

  // Sets the base style for all vertices
  const style = graph.getStylesheet().getDefaultVertexStyle();
  style.rounded = true;
  style.fillColor = '#ffffff';
  style.strokeColor = '#000000';
  style.strokeWidth = '2';
  style.fontColor = '#000000';
  style.fontSize = '12';
  style.fontStyle = 1;
  graph.getStylesheet().putDefaultVertexStyle(style);

  const graphHandler = graph.getPlugin('GraphHandler');

  // Replaces move preview for relative children
  graphHandler.getDelta = function (me) {
    const point = utils.convertPoint(this.graph.container, me.getX(), me.getY());
    let delta = new Point(point.x - this.first.x, point.y - this.first.y);

    if (this.cells != null && this.cells.length > 0 && this.cells[0] != null) {
      const state = this.graph.view.getState(this.cells[0]);
      const rel = graph.getRelativePosition(state, delta.x, delta.y);

      if (rel != null) {
        const pstate = this.graph.view.getState(state.cell.getParent());

        if (pstate != null) {
          delta = new Point(
            pstate.x + pstate.width * rel.x - state.getCenterX(),
            pstate.y + pstate.height * rel.y - state.getCenterY()
          );
        }
      }
    }

    return delta;
  };

  // Relative children cannot be removed from parent
  graphHandler.shouldRemoveCellsFromParent = function (parent, cells, evt) {
    return (
      cells.length === 0 &&
      !cells[0].geometry.relative &&
      GraphHandler.prototype.shouldRemoveCellsFromParent.apply(this, arguments)
    );
  };

  // Enables rubberband selection
  if (args.rubberBand) new RubberBand(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Process',
      position: [60, 60],
      size: [90, 40],
    });

    const v2 = graph.insertVertex({
      parent: v1,
      value: 'in',
      position: [0, 0.5],
      size: [20, 20],
      style: 'fontSize=9;shape=ellipse;resizable=0;',
    });
    v2.geometry.offset = new Point(-10, -10);
    v2.geometry.relative = true;

    const v3 = graph.insertVertex({
      parent: v1,
      value: 'out',
      position: [1, 0.5],
      size: [20, 20],
      style: 'fontSize=9;shape=ellipse;resizable=0;',
    });
    v3.geometry.offset = new Point(-10, -10);
    v3.geometry.relative = true;
  });

  return container;
};

export const Default = Template.bind({});
