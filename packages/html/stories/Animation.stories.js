import { Graph, Point } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

import './css/animation.css';

export default {
  title: 'Effects/Animation',
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

  const graph = new Graph(container);
  graph.setEnabled(false);
  const parent = graph.getDefaultParent();

  const vertexStyle = {
    shape: 'cylinder',
    strokeWidth: 2,
    fillColor: '#ffffff',
    strokeColor: 'black',
    gradientColor: '#a0a0a0',
    fontColor: 'black',
    fontStyle: 1,
    spacingTop: 14,
  };

  let e1;
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Pump',
      position: [20, 20],
      size: [60, 60],
      style: vertexStyle,
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'Tank',
      position: [200, 150],
      size: [60, 60],
      style: vertexStyle,
    });
    e1 = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
      style: {
        strokeWidth: 3,
        endArrow: 'block',
        endSize: 2,
        endFill: 1,
        strokeColor: 'black',
        rounded: 1,
      },
    });
    e1.geometry.points = [new Point(230, 50)];
    graph.orderCells(true, [e1]);
  });

  // Adds animation to edge shape and makes "pipe" visible
  const state = graph.view.getState(e1);
  state.shape.node.getElementsByTagName('path')[0].removeAttribute('visibility');
  state.shape.node.getElementsByTagName('path')[0].setAttribute('stroke-width', '6');
  state.shape.node.getElementsByTagName('path')[0].setAttribute('stroke', 'lightGray');
  state.shape.node.getElementsByTagName('path')[1].setAttribute('class', 'flow');

  return container;
};

export const Default = Template.bind({});
