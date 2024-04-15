/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2020, JGraph Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Graph, Rectangle } from '@maxgraph/core';

import { globalTypes, globalValues } from './shared/args.js';
import {
  configureExpandedAndCollapsedImages,
  configureImagesBasePath,
  createGraphContainer,
} from './shared/configure.js';

export default {
  title: 'Layouts/Collapse',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  configureImagesBasePath();
  const container = createGraphContainer(args);

  const graph = new Graph(container);
  const parent = graph.getDefaultParent();
  configureExpandedAndCollapsedImages(graph);

  const getStyle = function () {
    // Extends Transactions.getStyle to show an image when collapsed
    // TODO cannot use super without a parent class
    // let style = super.getStyle();
    let style = '';
    if (this.isCollapsed()) {
      style = {
        ...style,
        shape: 'image',
        image: 'http://www.jgraph.com/images/mxgraph.gif',
        noLabel: 1,
        imageBackground: '#C3D9FF',
        imageBorder: '#6482B9',
      };
    }
    return style;
  };

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Container',
      position: [20, 20],
      size: [200, 200],
      style: { shape: 'swimlane', startSize: 20 },
    });
    v1.geometry.alternateBounds = new Rectangle(0, 0, 110, 70);
    // v1.getStyle = getStyle;

    const v11 = graph.insertVertex({
      parent: v1,
      value: 'Hello,',
      position: [10, 40],
      size: [120, 80],
    });
    // v11.getStyle = getStyle;
  });

  return container;
};

export const Default = Template.bind({});
