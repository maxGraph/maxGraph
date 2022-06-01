import { Graph, EdgeStyle, constants, KeyHandler } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Icon_Images/Indicators',
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
 

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setConnectable(true);
  new KeyHandler(graph);

  // Enables moving of vertex labels
  graph.vertexLabelsMovable = true;

  // Creates a style with an indicator
  let style = graph.getStylesheet().getDefaultVertexStyle();

  style.shape = 'label';
  style.fillColor= 'none';
  style.strokeColor= 'none';
  style.verticalAlign = 'bottom';
  style.indicatorShape = 'ellipse';
  style.indicatorWidth = 34;
  style.indicatorHeight = 34;
  style.imageVerticalAlign = 'top'; // indicator v-alignment
  style.imageAlign = 'center';
  style.indicatorColor = 'green';
  // delete style.strokeColor; // transparent
  // delete style.fillColor; // transparent

  // Creates a style with an indicator
  style = graph.getStylesheet().getDefaultEdgeStyle();

  style.edgeStyle = EdgeStyle.ElbowConnector;
  style.elbow = constants.ELBOW.VERTICAL;
  style.rounded = true;
  style.bendable = true;

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    graph.insertVertex(parent, null, 'Bottom Label', 80, 80, 80, 60);
    graph.insertVertex(parent, null, 'Top Label', 200, 80, 60, 60, {
      indicatorShape: 'actor',
      indicatorWidth: 28,
      indicatorColor: 'blue',
      imageVerticalAlign: 'bottom',
      verticalAlign: 'top',
    });
    graph.insertVertex(parent, null, 'Right Label', 300, 80, 120, 60, {
      indicatorShape: 'cloud',
      indicatorWidth: 40,
      indicatorColor: '#00FFFF',
      imageVerticalAlign: 'center',
      verticalAlign: 'middle',
      imageAlign: 'left',
      align: 'left',
      spacingLeft: 44,
    });
  });

  return container;
};

export const Default = Template.bind({});
