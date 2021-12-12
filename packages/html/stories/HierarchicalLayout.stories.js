import {
  Graph,
  DomUtils,
  FastOrganicLayout,
  HierarchicalLayout,
  Perimeter,
  InternalEvent,
  RubberBand,
  Constants,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/HierarchicalLayout',
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

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Adds rubberband selection
  if (args.rubberBand) new RubberBand(graph);

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
  const layout = new HierarchicalLayout(graph);
  const organic = new FastOrganicLayout(graph);
  organic.forceConstant = 120;

  const parent = graph.getDefaultParent();

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  // Adds a button to execute the layout
  let button = document.createElement('button');
  DomUtils.write(button, 'Hierarchical');
  InternalEvent.addListener(button, 'click', function (evt) {
    layout.execute(parent);
  });
  buttons.appendChild(button);

  // Adds a button to execute the layout
  button = document.createElement('button');
  DomUtils.write(button, 'Organic');

  InternalEvent.addListener(button, 'click', function (evt) {
    organic.execute(parent);
  });

  buttons.appendChild(button);

  // Load cells and layouts the graph
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, '1', 0, 0, 80, 30);
    const v2 = graph.insertVertex(parent, null, '2', 0, 0, 80, 30);
    const v3 = graph.insertVertex(parent, null, '3', 0, 0, 80, 30);
    const v4 = graph.insertVertex(parent, null, '4', 0, 0, 80, 30);
    const v5 = graph.insertVertex(parent, null, '5', 0, 0, 80, 30);
    const v6 = graph.insertVertex(parent, null, '6', 0, 0, 80, 30);
    const v7 = graph.insertVertex(parent, null, '7', 0, 0, 80, 30);
    const v8 = graph.insertVertex(parent, null, '8', 0, 0, 80, 30);
    const v9 = graph.insertVertex(parent, null, '9', 0, 0, 80, 30);

    const e1 = graph.insertEdge(parent, null, '', v1, v2);
    const e2 = graph.insertEdge(parent, null, '', v1, v3);
    const e3 = graph.insertEdge(parent, null, '', v3, v4);
    const e4 = graph.insertEdge(parent, null, '', v2, v5);
    const e5 = graph.insertEdge(parent, null, '', v1, v6);
    const e6 = graph.insertEdge(parent, null, '', v2, v3);
    const e7 = graph.insertEdge(parent, null, '', v6, v4);
    const e8 = graph.insertEdge(parent, null, '', v6, v1);
    const e9 = graph.insertEdge(parent, null, '', v6, v7);
    const e10 = graph.insertEdge(parent, null, '', v7, v8);
    const e11 = graph.insertEdge(parent, null, '', v7, v9);
    const e12 = graph.insertEdge(parent, null, '', v7, v6);
    const e13 = graph.insertEdge(parent, null, '', v7, v5);

    // Executes the layout
    layout.execute(parent);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  return div;
};

export const Default = Template.bind({});
