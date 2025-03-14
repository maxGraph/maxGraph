/*
Copyright 2025-present The maxGraph project Contributors

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

import { DomHelpers, Graph, InternalEvent } from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
import '@maxgraph/core/css/common.css'; // style required by RubberBand and MaxWindow/MaxLog

export default {
  title: 'Zoom_OffPage/ZoomAndFit',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const mainContainer = document.createElement('div');
  const container = createGraphContainer(args);
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);
  const graph = new Graph(container);
  graph.setPanning(true);

  // Creates the div for the controls button
  const controlsContainer = document.createElement('div');
  controlsContainer.style.display = 'flex';
  controlsContainer.style.marginBottom = '1rem';
  mainContainer.appendChild(controlsContainer);

  function addControlButton(label: string, action: () => void) {
    const button = DomHelpers.button(label, action);
    button.style.marginRight = '.5rem';
    controlsContainer.appendChild(button);
  }

  addControlButton('Zoom Actual', function () {
    graph.zoomActual();
  });
  addControlButton('Zoom In', function () {
    graph.zoomIn();
  });
  addControlButton('Zoom Out', function () {
    graph.zoomOut();
  });
  const border = 10;
  addControlButton('Fit', function () {
    graph.fit(border);
  });
  addControlButton('Fit Horizontal', function () {
    // This is a pain to use so many parameters when lot of them are the same as default values
    // Consider having a method with a single object. See https://github.com/maxGraph/maxGraph/pull/715#discussion_r1993871475
    graph.fit(border, false, 0, true, false, true);
  });
  addControlButton('Fit Vertical', function () {
    graph.fit(border, false, 0, true, true, false);
  });

  mainContainer.appendChild(container);

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      position: [20, 20],
      size: [80, 30],
      style: { perimeter: 'ellipsePerimeter', shape: 'ellipse' },
      value: 'ellipse',
    });
    const v2 = graph.insertVertex({
      position: [200, 150],
      size: [120, 30],
      value: 'rectangle 1',
    });
    const v3 = graph.insertVertex({
      position: [240, 40],
      size: [120, 30],
      style: { shape: 'hexagon' },
      value: 'hexagon',
    });
    const v4 = graph.insertVertex({
      position: [60, 210],
      size: [100, 30],
      value: 'rectangle 2',
    });
    graph.insertEdge({ value: 'edge', source: v1, target: v2 });
    graph.insertEdge({ source: v2, target: v3 });
    graph.insertEdge({ source: v4, target: v1 });
  });

  return mainContainer;
};

export const Default = Template.bind({});
