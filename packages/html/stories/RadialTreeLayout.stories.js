import {
  Graph,
  RubberBandHandler,
  constants,
  RadialTreeLayout,
  Perimeter,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/RadialTreeLayout',
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

  // Adds rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Changes the default vertex style in-place
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.perimiter = Perimeter.RectanglePerimeter;
  style.gradientColor = 'white';
  style.perimeterSpacing = 6;
  style.rounded = true;
  style.shadow = true;

  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.rounded = true;

  // Creates a layout algorithm to be used
  // with the graph
  const layout = new RadialTreeLayout(graph);

  const parent = graph.getDefaultParent();

  // Load cells and layouts the graph
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, '1', 500, 500, 80, 30);
    const v2 = graph.insertVertex(parent, null, '2.1', 0, 0, 80, 30);
    const v3 = graph.insertVertex(parent, null, '2.2', 0, 0, 80, 30);
    const v4 = graph.insertVertex(parent, null, '3.1', 0, 0, 80, 30);
    const v4_1 = graph.insertVertex(parent, null, '3.2', 0, 0, 80, 30);
    const v4_2 = graph.insertVertex(parent, null, '3.3', 0, 0, 80, 30);
    const v4_3 = graph.insertVertex(parent, null, '3.6', 0, 0, 80, 30);
    const v4_4 = graph.insertVertex(parent, null, '3.7', 0, 0, 80, 30);
    const v5 = graph.insertVertex(parent, null, '3.4', 0, 0, 80, 30);
    const v6 = graph.insertVertex(parent, null, '2.3', 0, 0, 80, 30);
    const v7 = graph.insertVertex(parent, null, '4.1', 0, 0, 80, 30);
    const v7_1 = graph.insertVertex(parent, null, '4.2', 0, 0, 80, 30);
    const v7_2 = graph.insertVertex(parent, null, '4.3', 0, 0, 80, 30);
    const v7_3 = graph.insertVertex(parent, null, '4.4', 0, 0, 80, 30);
    const v7_4 = graph.insertVertex(parent, null, '4.5', 0, 0, 80, 30);
    const v7_5 = graph.insertVertex(parent, null, '4.6', 0, 0, 80, 30);
    const v7_6 = graph.insertVertex(parent, null, '4.7', 0, 0, 80, 30);

    const e1 = graph.insertEdge(parent, null, '', v1, v2);
    const e2 = graph.insertEdge(parent, null, '', v1, v3);
    const e3 = graph.insertEdge(parent, null, '', v3, v4);
    const e3_1 = graph.insertEdge(parent, null, '', v3, v4_1);
    const e3_2 = graph.insertEdge(parent, null, '', v3, v4_2);
    const e3_3 = graph.insertEdge(parent, null, '', v3, v4_3);
    const e3_4 = graph.insertEdge(parent, null, '', v3, v4_4);
    const e4 = graph.insertEdge(parent, null, '', v2, v5);
    const e5 = graph.insertEdge(parent, null, '', v1, v6);
    const e6 = graph.insertEdge(parent, null, '', v4_3, v7);
    var e6_1 = graph.insertEdge(parent, null, '', v4_4, v7_4);
    var e6_2 = graph.insertEdge(parent, null, '', v4_4, v7_5);
    var e6_3 = graph.insertEdge(parent, null, '', v4_4, v7_6);
    var e6_1 = graph.insertEdge(parent, null, '', v4_3, v7_1);
    var e6_2 = graph.insertEdge(parent, null, '', v4_3, v7_2);
    var e6_3 = graph.insertEdge(parent, null, '', v4_3, v7_3);

    // Executes the layout
    layout.execute(parent);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  return container;
};

export const Default = Template.bind({});
