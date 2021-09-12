import { Graph, Perimeter, Constants, RubberBand } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Misc/Merge',
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

  // Should we allow overriding constants?
  // Constants.SHADOWCOLOR = '#c0c0c0';

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // No size handles, please...
  graph.setCellsResizable(false);

  // Makes all cells round with a white, bold label
  let style = graph.stylesheet.getDefaultVertexStyle();
  style.shape = Constants.SHAPE_ELLIPSE;
  style.perimiter = Perimeter.EllipsePerimeter;
  style.fontColor = 'white';
  style.gradientColor = 'white';
  style.fontStyle = Constants.FONT_BOLD;
  style.fontSize = 14;
  style.shadow = true;

  // Makes all edge labels gray with a white background
  style = graph.stylesheet.getDefaultEdgeStyle();
  style.fontColor = 'gray';
  style.fontStyle = Constants.FONT_BOLD;
  style.fontColor = 'black';
  style.strokeWidth = 2;

  // Enables rubberband selection
  if (args.rubberBand) new RubberBand(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the target model in a single step
  // using custom ids for the vertices and edges
  const w = 40;
  const h = 40;

  graph.getModel().beginUpdate();
  try {
    const a = graph.insertVertex(parent, 'a', 'A', 20, 20, w, h, 'fillColor=blue');
    const b = graph.insertVertex(parent, 'b', 'B', 20, 200, w, h, 'fillColor=blue');
    const c = graph.insertVertex(parent, 'c', 'C', 200, 20, w, h, 'fillColor=red');
    const d = graph.insertVertex(parent, 'd', 'D', 200, 200, w, h, 'fillColor=red');
    const ac = graph.insertEdge(
      parent,
      'ac',
      'ac',
      a,
      c,
      'strokeColor=blue;verticalAlign=bottom'
    );
    const ad = graph.insertEdge(
      parent,
      'ad',
      'ad',
      a,
      d,
      'strokeColor=blue;align=left;verticalAlign=bottom'
    );
    const bd = graph.insertEdge(
      parent,
      'bd',
      'bd',
      b,
      d,
      'strokeColor=blue;verticalAlign=bottom'
    );
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  // Creates the second graph model (without a container)
  const graph2 = new Graph();

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent2 = graph2.getDefaultParent();

  // Adds cells to the target model in a single step
  // using custom ids for the vertices
  graph2.getModel().beginUpdate();
  try {
    const c = graph2.insertVertex(parent2, 'c', 'C', 200, 20, w, h, 'fillColor=green');
    const d = graph2.insertVertex(parent2, 'd', 'D', 200, 200, w, h, 'fillColor=green');
    const e = graph2.insertVertex(parent2, 'e', 'E', 400, 20, w, h, 'fillColor=green');
    const f = graph2.insertVertex(parent2, 'f', 'F', 400, 200, w, h, 'fillColor=green');
    const ce = graph2.insertEdge(
      parent2,
      'ce',
      'ce',
      c,
      e,
      'strokeColor=green;verticalAlign=bottom'
    );
    const ed = graph2.insertEdge(
      parent2,
      'ed',
      'ed',
      e,
      d,
      'strokeColor=green;align=right;verticalAlign=bottom'
    );
    const fd = graph2.insertEdge(
      parent2,
      'bd',
      'fd',
      f,
      d,
      'strokeColor=green;verticalAlign=bottom'
    );
  } finally {
    // Updates the display
    graph2.getModel().endUpdate();
  }

  // Merges the model from the second graph into the model of
  // the first graph. Note: If you add a false to the parameter
  // list then _not_ all edges will be cloned, that is, the
  // edges are assumed to have an identity, and hence the edge
  // "bd" will be changed to point from f to d, as specified in
  // the edge for the same id in the second graph.
  graph.getModel().mergeChildren(parent2, parent /* , false */);

  return container;
};

export const Default = Template.bind({});
