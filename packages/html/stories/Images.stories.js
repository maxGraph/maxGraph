import {
  Graph,
  cloneUtils,
  ImageBox,
  Rectangle,
  constants,
  Perimeter,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Icon_Images/Images',
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

  // Sets a background image and restricts child movement to its bounds
  graph.setBackgroundImage(new ImageBox('images/gradient_background.jpg', 360, 200));
  graph.maximumGraphBounds = new Rectangle(0, 0, 360, 200);

  // Resizes the container but never make it bigger than the background
  graph.minimumContainerSize = new Rectangle(0, 0, 360, 200);
  graph.setResizeContainer(true);

  // Disables basic selection and cell handling
  // graph.setEnabled(false);
  configureStylesheet(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    var v1 = graph.insertVertex(
      parent,
      null,
      'First Line\nSecond Line',
      20,
      10,
      80,
      100,
      { baseStyleNames: ['bottom'] }
    );
    var v1 = graph.insertVertex(
      parent,
      null,
      'First Line\nSecond Line',
      130,
      10,
      80,
      100,
      { baseStyleNames: ['top'] }
    );
    var v1 = graph.insertVertex(parent, null, '', 230, 10, 100, 100, {
      baseStyleNames: ['image'],
    });
    var v2 = graph.insertVertex(
      parent,
      null,
      'First Line\nSecond Line',
      20,
      130,
      140,
      60,
      { baseStyleNames: ['right'] }
    );
    var v2 = graph.insertVertex(
      parent,
      null,
      'First Line\nSecond Line',
      180,
      130,
      140,
      60,
      { baseStyleNames: ['left'] }
    );
  });

  function configureStylesheet(graph) {
    let style = {};
    style.shape = constants.SHAPE.IMAGE;
    style.perimeter = Perimeter.RectanglePerimeter;
    style.image = 'images/keys.png';
    style.fontColor = '#FFFFFF';
    graph.getStylesheet().putCellStyle('image', style);

    style = cloneUtils.clone(style);
    style.shape = constants.SHAPE.LABEL;
    style.strokeColor = '#000000';
    style.align = constants.ALIGN.CENTER;
    style.verticalAlign = constants.ALIGN.TOP;
    style.imageAlign = constants.ALIGN.CENTER;
    style.imageVerticalAlign = constants.ALIGN.TOP;
    style.image = 'images/gear.png';
    style.imageWidth = 48;
    style.imageHeight = 48;
    style.spacingTop = 56;
    style.spacing = 8;
    graph.getStylesheet().putCellStyle('bottom', style);

    style = cloneUtils.clone(style);
    style.imageVerticalAlign = constants.ALIGN.BOTTOM;
    style.image = 'images/server.png';
    delete style.spacingTop;
    graph.getStylesheet().putCellStyle('top', style);

    style = cloneUtils.clone(style);
    style.align = constants.ALIGN.LEFT;
    style.imageAlign = constants.ALIGN.LEFT;
    style.verticalAlign = constants.ALIGN.MIDDLE;
    style.imageVerticalAlign = constants.ALIGN.MIDDLE;
    style.image = 'images/earth.png';
    style.spacingLeft = 55;
    style.spacing = 4;
    graph.getStylesheet().putCellStyle('right', style);

    style = cloneUtils.clone(style);
    style.align = constants.ALIGN.RIGHT;
    style.imageAlign = constants.ALIGN.RIGHT;
    delete style.spacingLeft;
    style.spacingRight = 55;
    graph.getStylesheet().putCellStyle('left', style);
  }

  return container;
};

export const Default = Template.bind({});
