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
  CellOverlay,
  InternalEvent,
  CellTracker,
  utils,
  ImageBox,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';

export default {
  title: 'Effects/Overlays',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
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

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Highlights the vertices when the mouse enters
  const highlight = new CellTracker(graph, '#00FF00');

  // Enables tooltips for the overlays
  graph.setTooltips(true);

  function pickAlignValueRandomly() {
    return ['left', 'center', 'right'][Math.floor(Math.random() * 3)];
  }

  function pickVerticalAlignValueRandomly() {
    return ['top', 'bottom'][Math.floor(Math.random() * 2)];
  }

  // Installs a handler for click events in the graph
  // that toggles the overlay for the respective cell
  graph.addListener(InternalEvent.CLICK, (sender, evt) => {
    const cell = evt.getProperty('cell');

    if (cell != null) {
      const overlays = graph.getCellOverlays(cell);
      if (overlays.length === 0) {
        // Creates a new overlay with an image and a tooltip
        const overlay = new CellOverlay(
          new ImageBox('/images/check.png', 16, 16),
          'Overlay tooltip',
          pickAlignValueRandomly(),
          pickVerticalAlignValueRandomly()
        );

        // Installs a handler for clicks on the overlay
        overlay.addListener(InternalEvent.CLICK, (sender, evt2) => {
          window.alert('Overlay clicked');
        });

        // Sets the overlay for the cell in the graph
        graph.addCellOverlay(cell, overlay);
      } else {
        graph.removeCellOverlays(cell);
      }
    }
  });

  // Installs a handler for double click events in the graph
  // that shows an alert box
  graph.addListener(InternalEvent.DOUBLE_CLICK, (sender, evt) => {
    const cell = evt.getProperty('cell');
    alert(`Doubleclick: ${cell != null ? 'Cell' : 'Graph'}`);
    evt.consume();
  });

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Click,',
      position: [20, 20],
      size: [60, 40],
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'Double Click',
      position: [200, 150],
      size: [100, 40],
    });
    const e1 = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
    });
  });

  return container;
};

export const Default = Template.bind({});
