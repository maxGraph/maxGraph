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
  RubberBandHandler,
  Rectangle,
  LabelShape,
  StyleDefaultsConfig,
} from '@maxgraph/core';

import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Icon_Images/FixedIcons',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Overrides the image bounds code to change the position
  LabelShape.prototype.getImageBounds = function (x, y, w, h) {
    const iw = this.style.imageWidth ?? StyleDefaultsConfig.imageSize;
    const ih = this.style.imageHeight ?? StyleDefaultsConfig.imageSize;

    // Places the icon
    const ix = (w - iw) / 2;
    const iy = h - ih;

    return new Rectangle(x + ix, y + iy, iw, ih);
  };

  // Makes the shadow brighter
  StyleDefaultsConfig.shadowColor = '#C0C0C0';

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
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Fixed icon', 20, 20, 80, 50, {
      shape: 'label',
      image: 'images/plus.png',
      imageWidth: 16,
      imageHeight: 16,
      spacingBottom: 10,
      fillColor: '#adc5ff',
      gradientColor: '#7d85df',
      glass: true,
      rounded: true,
      shadow: true,
    });
  });

  return container;
};

export const Default = Template.bind({});
