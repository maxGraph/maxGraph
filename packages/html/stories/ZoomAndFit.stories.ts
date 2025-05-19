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

import { DomHelpers, type FitPlugin, Graph, InternalEvent } from '@maxgraph/core';
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
    graphWithLargeHeight: {
      type: 'boolean',
      defaultValue: true,
    },
    containerWithScrollbar: {
      type: 'boolean',
      defaultValue: false,
    },
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
    ...rubberBandValues,
    graphWithLargeHeight: false,
    containerWithScrollbar: false,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const mainContainer = document.createElement('div');
  const container = createGraphContainer(args);
  if (args.containerWithScrollbar) {
    container.style.overflow = 'auto';
  }

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

  const fitPlugin = graph.getPlugin<FitPlugin>('fit');

  addControlButton('Zoom Actual', function () {
    graph.zoomActual();
  });
  addControlButton('Zoom In', function () {
    graph.zoomIn();
  });
  addControlButton('Zoom Out', function () {
    graph.zoomOut();
  });
  const margin = 20;
  addControlButton('Fit', function () {
    fitPlugin?.fit({ margin });
  });
  addControlButton('Fit Center', function () {
    fitPlugin?.fitCenter({ margin });
  });
  addControlButton('Fit Horizontal', function () {
    fitPlugin?.fit({ margin, ignoreHeight: true });
  });
  addControlButton('Fit Vertical', function () {
    fitPlugin?.fit({ margin, ignoreWidth: true });
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
      position: [60, args.graphWithLargeHeight ? 410 : 210],
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
