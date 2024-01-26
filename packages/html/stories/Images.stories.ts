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

import {
  Graph,
  cloneUtils,
  ImageBox,
  Rectangle,
  constants,
  CellStateStyle,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';

export default {
  title: 'Icon_Images/Images',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, any>) => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
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
    graph.insertVertex(parent, null, 'First Line\nSecond Line', 20, 10, 80, 100, {
      baseStyleNames: ['bottom'],
    });
    graph.insertVertex(parent, null, 'First Line\nSecond Line', 130, 10, 80, 100, {
      baseStyleNames: ['top'],
    });
    graph.insertVertex(parent, null, '', 230, 10, 100, 100, {
      baseStyleNames: ['image'],
    });
    graph.insertVertex(parent, null, 'First Line\nSecond Line', 20, 130, 140, 60, {
      baseStyleNames: ['right'],
    });
    graph.insertVertex(parent, null, 'First Line\nSecond Line', 180, 130, 140, 60, {
      baseStyleNames: ['left'],
    });
  });

  function configureStylesheet(graph: Graph) {
    let style: CellStateStyle = {};
    style.shape = constants.SHAPE.IMAGE;
    style.image = 'images/icons48/keys.png';
    style.fontColor = '#FFFFFF';
    graph.getStylesheet().putCellStyle('image', style);

    style = cloneUtils.clone(style);
    style.shape = constants.SHAPE.LABEL;
    style.strokeColor = '#000000';
    style.align = constants.ALIGN.CENTER;
    style.verticalAlign = constants.ALIGN.TOP;
    style.imageAlign = constants.ALIGN.CENTER;
    // TODO missing 'imageVerticalAlign' property in CellStateStyle
    style.imageVerticalAlign = constants.ALIGN.TOP;
    style.image = 'images/icons48/gear.png';
    style.imageWidth = '48';
    style.imageHeight = '48';
    style.spacingTop = '56';
    style.spacing = '8';
    graph.getStylesheet().putCellStyle('bottom', style);

    style = cloneUtils.clone(style);
    // TODO missing 'imageVerticalAlign' property in CellStateStyle
    style.imageVerticalAlign = constants.ALIGN.BOTTOM;
    style.image = 'images/icons48/server.png';
    delete style.spacingTop;
    graph.getStylesheet().putCellStyle('top', style);

    style = cloneUtils.clone(style);
    style.align = constants.ALIGN.LEFT;
    style.verticalAlign = constants.ALIGN.MIDDLE;
    // TODO missing 'imageVerticalAlign' property in CellStateStyle
    style.imageVerticalAlign = constants.ALIGN.MIDDLE;
    style.image = 'images/icons48/earth.png';
    style.spacingLeft = '55';
    style.spacing = '4';
    graph.getStylesheet().putCellStyle('right', style);

    style = cloneUtils.clone(style);
    style.align = constants.ALIGN.RIGHT;
    style.imageAlign = constants.ALIGN.RIGHT;
    delete style.spacingLeft;
    style.spacingRight = '55';
    graph.getStylesheet().putCellStyle('left', style);
  }

  return container;
};

export const Default = Template.bind({});
