import {
  Graph,
  RectangleShape,
  DomHelpers,
  TextShape,
  Point,
  Rectangle,
  constants,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Labels/SecondLabel',
  argTypes: {
    ...globalTypes,
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

  // Simple solution to add additional text to the rectangle shape definition:
  (function () {
    const mxRectangleShapeIsHtmlAllowed = RectangleShape.prototype.isHtmlAllowed;
    RectangleShape.prototype.isHtmlAllowed = function () {
      return mxRectangleShapeIsHtmlAllowed.apply(this, arguments) && this.state == null;
    };

    const mxRectangleShapePaintForeground = RectangleShape.prototype.paintForeground;
    RectangleShape.prototype.paintForeground = function (c, x, y, w, h) {
      if (
        this.state != null &&
        this.state.cell.geometry != null &&
        !this.state.cell.geometry.relative
      ) {
        c.setFontColor('#a0a0a0');
        c.text(x + 2, y, 0, 0, this.state.cell.id, 'left', 'top');
      }

      mxRectangleShapePaintForeground.apply(this, arguments);
    };
  })();

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Disables the folding icon
  graph.isCellFoldable = function (cell) {
    return false;
  };

  let secondLabelVisible = true;

  // Hook for returning shape number for a given cell
  graph.getSecondLabel = function (cell) {
    if (!cell.isEdge()) {
      // Possible to return any string here
      return `The ID of this cell is ${cell.id}`;
    }

    return null;
  };

  let relativeChildVerticesVisible = true;

  // Overrides method to hide relative child vertices
  // TODO this function is not used
  const isVisible = function () {
    return (
      !cell.isVertex() ||
      cell.geometry == null ||
      !cell.geometry.relative ||
      cell.geometry.relative == relativeChildVerticesVisible
    );
  };

  // Creates the shape for the shape number and puts it into the draw pane
  const { redrawShape } = graph.cellRenderer;
  graph.cellRenderer.redrawShape = function (state, force, rendering) {
    const result = redrawShape.apply(this, arguments);

    if (
      result &&
      secondLabelVisible &&
      state.cell.geometry != null &&
      !state.cell.geometry.relative
    ) {
      const secondLabel = graph.getSecondLabel(state.cell);

      if (secondLabel != null && state.shape != null && state.secondLabel == null) {
        state.secondLabel = new TextShape(
          secondLabel,
          new Rectangle(),
          constants.ALIGN_LEFT,
          constants.ALIGN_BOTTOM
        );

        // Styles the label
        state.secondLabel.color = 'black';
        state.secondLabel.family = 'Verdana';
        state.secondLabel.size = 8;
        state.secondLabel.fontStyle = constants.FONT_ITALIC;
        state.secondLabel.background = 'yellow';
        state.secondLabel.border = 'black';
        state.secondLabel.valign = 'bottom';
        state.secondLabel.dialect = state.shape.dialect;
        state.secondLabel.dialect = constants.DIALECT_STRICTHTML;
        state.secondLabel.wrap = true;
        graph.cellRenderer.initializeLabel(state, state.secondLabel);
      }
    }

    if (state.secondLabel != null) {
      const scale = graph.getView().getScale();
      const bounds = new Rectangle(
        state.x + state.width - 8 * scale,
        state.y + 8 * scale,
        35,
        0
      );
      state.secondLabel.state = state;
      state.secondLabel.value = graph.getSecondLabel(state.cell);
      state.secondLabel.scale = scale;
      state.secondLabel.bounds = bounds;
      state.secondLabel.redraw();
    }

    return result;
  };

  // Destroys the shape number
  const { destroy } = graph.cellRenderer;
  graph.cellRenderer.destroy = function (state) {
    destroy.apply(this, arguments);

    if (state.secondLabel != null) {
      state.secondLabel.destroy();
      state.secondLabel = null;
    }
  };

  graph.cellRenderer.getShapesForState = function (state) {
    return [state.shape, state.text, state.secondLabel, state.control];
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 30, 40, 80, 30);
    // Alternative solution of creating a second label by creating a realtive child vertex
    // with size (0, 0). This will not be selectable and only the label colors can be used
    // for coloring as the actual shape will have zero size.
    const v11 = graph.insertVertex(
      v1,
      null,
      'World',
      1,
      1,
      0,
      0,
      'align=left;verticalAlign=top;labelBackgroundColor=red;labelBorderColor=black',
      true
    );
    v11.geometry.offset = new Point(-8, -8);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    // Another alternative solution of creating a second label as a relative child vertex
    // but this time with an automatic size so that the cell is actually selectable and
    // the background is painted as a shape.
    const v21 = graph.insertVertex(
      v2,
      null,
      'World',
      1,
      1,
      0,
      0,
      'align=left;verticalAlign=top;fillColor=red;rounded=1;spacingLeft=4;spacingRight=4',
      true
    );
    v21.geometry.offset = new Point(-8, -8);
    graph.updateCellSize(v21);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  // Adds a button to execute the layout
  buttons.appendChild(
    DomHelpers.button('Toggle Child Vertices', function (evt) {
      relativeChildVerticesVisible = !relativeChildVerticesVisible;
      graph.refresh();
    })
  );

  // Adds a button to execute the layout
  buttons.appendChild(
    DomHelpers.button('Toggle IDs', function (evt) {
      secondLabelVisible = !secondLabelVisible;
      graph.refresh();
    })
  );

  return div;
};

export const Default = Template.bind({});
