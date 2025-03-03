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
  type AlignValue,
  CellOverlay,
  CellRenderer,
  type CellState,
  CellTracker,
  EllipseShape,
  type EventObject,
  Graph,
  ImageBox,
  InternalEvent,
  Rectangle,
  RectangleShape,
  type Shape,
  type VAlignValue,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import {
  configureImagesBasePath,
  createGraphContainer,
  createMainDiv,
} from './shared/configure.js';
// required by the custom code (see CustomCellRenderer)
import './css/overlays.css';

export default {
  title: 'Effects/Overlays',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();

  const div = createMainDiv(`<h3>Overlays</h3>
  Demonstrate usage of standard overlays (using an image) and custom overlays (using custom shapes and DOM content).
  <p>
  Add an overlay when clicking on a vertex or an edge. The shape and the position of the overlay are random.
  The circle overlay has a pulsating effect.
  <br>
  Click again to remove the overlay.
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

  let overlayCount = 0;

  class CustomCellRenderer extends CellRenderer {
    protected createOverlayShape(_state: CellState, _cellOverlay: CellOverlay): Shape {
      overlayCount++;
      switch (overlayCount % 3) {
        case 0:
          // colors are overridden in the CSS
          return new EllipseShape(new Rectangle(), 'orange', 'orange');
        case 1:
          return new RectangleShape(new Rectangle(), 'red', 'red');
        default:
          return super.createOverlayShape(_state, _cellOverlay);
      }
    }

    protected configureOverlayShape(
      state: CellState,
      cellOverlay: CellOverlay,
      overlayShape: Shape
    ): void {
      super.configureOverlayShape(state, cellOverlay, overlayShape);

      overlayShape.node.classList.add('overlay-custom');
      overlayShape.node.dataset.cellId = state.cell.id ?? undefined;
    }
  }

  class CustomGraph extends Graph {
    createCellRenderer() {
      return new CustomCellRenderer();
    }
  }

  // Creates the graph inside the given container
  const graph = new CustomGraph(container);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Highlights the vertices when the mouse enters
  new CellTracker(graph, '#00FF00');

  // Enables tooltips for the overlays
  graph.setTooltips(true);

  function pickAlignValueRandomly(): AlignValue {
    return (['left', 'center', 'right'] as AlignValue[])[Math.floor(Math.random() * 3)];
  }

  function pickVerticalAlignValueRandomly(): VAlignValue {
    return (['top', 'bottom'] as VAlignValue[])[Math.floor(Math.random() * 2)];
  }

  // Installs a handler for click events in the graph that toggles the overlay for the respective cell
  graph.addListener(InternalEvent.CLICK, (_sender: EventTarget, evt: EventObject) => {
    const cell = evt.getProperty('cell');

    if (cell) {
      const overlays = graph.getCellOverlays(cell);
      if (overlays.length === 0) {
        // Creates a new overlay with an image and a tooltip
        const overlay = new CellOverlay(
          new ImageBox('images/check.png', 16, 16),
          `Overlay tooltip for cell #${cell.getId()}`,
          pickAlignValueRandomly(),
          pickVerticalAlignValueRandomly()
        );

        // Installs a handler for clicks on the overlay
        overlay.addListener(
          InternalEvent.CLICK,
          (_sender: EventTarget, _evt: EventObject) => {
            window.alert('Overlay clicked');
          }
        );

        // Sets the overlay for the cell in the graph
        graph.addCellOverlay(cell, overlay);
      } else {
        graph.removeCellOverlays(cell);
      }
    }
  });

  // Installs a handler for double click events in the graph
  // that shows an alert box
  graph.addListener(
    InternalEvent.DOUBLE_CLICK,
    (_sender: EventTarget, evt: EventObject) => {
      const cell = evt.getProperty('cell');
      alert(`Double-click: ${cell != null ? 'Cell' : 'Graph'}`);
      evt.consume();
    }
  );

  // Gets the default parent for inserting new cells. This is normally the first child of the root (i.e. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Click',
      position: [20, 20],
      size: [60, 40],
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'Double Click',
      position: [200, 150],
      size: [100, 40],
    });
    graph.insertEdge({
      parent,
      source: v1,
      target: v2,
    });
    const v3 = graph.insertVertex({
      parent,
      value: 'Another',
      position: [330, 60],
      size: [50, 50],
      style: {
        shape: 'ellipse',
        perimeter: 'ellipsePerimeter',
      },
    });
    graph.insertEdge({
      parent,
      source: v1,
      target: v3,
    });
    graph.insertEdge({
      parent,
      source: v2,
      target: v3,
    });
  });

  return div;
};

export const Default = Template.bind({});
