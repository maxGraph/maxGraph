import {
  Graph,
  RubberBandHandler,
  Rectangle,
  constants,
  utils,
  LabelShape,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Icon_Images/FixedIcons',
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

  // Overrides the image bounds code to change the position
  LabelShape.prototype.getImageBounds = function (x, y, w, h) {
    const iw = utils.getValue(this.style, 'imageWidth', constants.DEFAULT_IMAGESIZE);
    const ih = utils.getValue(this.style, 'imageHeight', constants.DEFAULT_IMAGESIZE);

    // Places the icon
    const ix = (w - iw) / 2;
    const iy = h - ih;

    return new Rectangle(x + ix, y + iy, iw, ih);
  };

  // Should we allow overriding constants?
  // Makes the shadow brighter
  //constants.SHADOWCOLOR = '#C0C0C0';

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Uncomment the following if you want the container
  // to fit the size of the graph
  // graph.setResizeContainer(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getDataModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(
      parent,
      null,
      'Fixed icon',
      20,
      20,
      80,
      50,
      'shape=label;image=images/plus.png;imageWidth=16;imageHeight=16;spacingBottom=10;' +
        'fillColor=#adc5ff;gradientColor=#7d85df;glass=1;rounded=1;shadow=1;'
    );
  } finally {
    // Updates the display
    graph.getDataModel().endUpdate();
  }

  return container;
};

export const Default = Template.bind({});
