import { Graph, Rectangle,Client } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/Collapse',
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

  Client.imageBasePath = '/images'

  const graph = new Graph(container);
  const parent = graph.getDefaultParent();

  const getStyle = function () {
    // Extends Transactions.getStyle to show an image when collapsed
    // TODO cannot use super without a parent class
    // let style = super.getStyle();
    let style = this.style;
    if (this.isCollapsed()) {
      style =
        `${style};shape=image;image=http://www.jgraph.com/images/mxgraph.gif;` +
        `noLabel=1;imageBackground=#C3D9FF;imageBorder=#6482B9`;
    }
    return style;
  };

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Container',
      position: [20, 20],
      size: [200, 200],
      style: 'shape=swimlane;startSize=20;foldable=true',
    });
    v1.geometry.alternateBounds = new Rectangle(0, 0, 110, 70);
    v1.getStyle = getStyle;

    const v11 = graph.insertVertex({
      parent: v1,
      value: 'Hello,',
      position: [10, 40],
      size: [120, 80],
    });
    v11.getStyle = getStyle;
  });

  return container;
};

export const Default = Template.bind({});
