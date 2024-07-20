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

import { type Cell, type CellStyle, Graph, Rectangle } from '@maxgraph/core';

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

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();
  const container = createGraphContainer(args);

  const graph = new Graph(container);
  const parent = graph.getDefaultParent();
  configureExpandedAndCollapsedImages(graph);

  // Extends Cell.getStyle to show an image when collapsed
  const getStyle = function (this: Cell): CellStyle {
    if (!this.isCollapsed()) {
      return this.style;
    }
    return {
      // Need to create a copy the original style as we don't want to change the original style stored in the Cell
      // Otherwise, when expanding the cell, the style will be incorrect
      ...this.style,
      shape: 'image',
      image: './images/package.png',
      noLabel: true,
      imageBackground: '#e7e9ef',
      imageBorder: '#6482B9',
    };
  };

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Container',
      position: [20, 20],
      size: [200, 200],
      style: { shape: 'swimlane', startSize: 20 },
    });
    v1.geometry!.alternateBounds = new Rectangle(0, 0, 110, 70);
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
