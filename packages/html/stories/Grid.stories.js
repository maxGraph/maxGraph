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
  InternalEvent,
  RubberBandHandler,
  GlobalConfig,
  GraphView,
  Point,
  DomHelpers,
  eventUtils,
} from '@maxgraph/core';

import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Backgrounds/Grid',
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

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  container.style.background = ''; // no grid
  div.appendChild(container);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);
  const selectionHandler = graph.getPlugin('SelectionHandler');
  selectionHandler.scaleGrid = true;
  graph.setPanning(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  let repaintGrid;

  // Create grid dynamically (requires canvas)
  (function () {
    try {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0px';
      canvas.style.left = '0px';
      canvas.style.zIndex = -1;
      graph.container.appendChild(canvas);

      const ctx = canvas.getContext('2d');

      // Modify event filtering to accept canvas as container
      const mxGraphViewIsContainerEvent = GraphView.prototype.isContainerEvent;
      GraphView.prototype.isContainerEvent = function (evt) {
        return (
          mxGraphViewIsContainerEvent.call(this, evt) ||
          eventUtils.getSource(evt) == canvas
        );
      };

      let s = 0;
      let gs = 0;
      let tr = new Point();
      let w = 0;
      let h = 0;

      repaintGrid = function () {
        if (ctx != null) {
          const bounds = graph.getGraphBounds();
          const width = Math.max(bounds.x + bounds.width, graph.container.clientWidth);
          const height = Math.max(bounds.y + bounds.height, graph.container.clientHeight);
          const sizeChanged = width != w || height != h;

          if (
            graph.view.scale != s ||
            graph.view.translate.x != tr.x ||
            graph.view.translate.y != tr.y ||
            gs != graph.gridSize ||
            sizeChanged
          ) {
            tr = graph.view.translate.clone();
            s = graph.view.scale;
            gs = graph.gridSize;
            w = width;
            h = height;

            // Clears the background if required
            if (!sizeChanged) {
              ctx.clearRect(0, 0, w, h);
            } else {
              canvas.setAttribute('width', w);
              canvas.setAttribute('height', h);
            }

            const tx = tr.x * s;
            const ty = tr.y * s;

            // Sets the distance of the grid lines in pixels
            const minStepping = graph.gridSize;
            let stepping = minStepping * s;

            if (stepping < minStepping) {
              const count = Math.round(Math.ceil(minStepping / stepping) / 2) * 2;
              stepping = count * stepping;
            }

            const xs = Math.floor((0 - tx) / stepping) * stepping + tx;
            let xe = Math.ceil(w / stepping) * stepping;
            const ys = Math.floor((0 - ty) / stepping) * stepping + ty;
            let ye = Math.ceil(h / stepping) * stepping;

            xe += Math.ceil(stepping);
            ye += Math.ceil(stepping);

            const ixs = Math.round(xs);
            const ixe = Math.round(xe);
            const iys = Math.round(ys);
            const iye = Math.round(ye);

            // Draws the actual grid
            ctx.strokeStyle = '#f6f6f6';
            ctx.beginPath();

            for (let x = xs; x <= xe; x += stepping) {
              x = Math.round((x - tx) / stepping) * stepping + tx;
              const ix = Math.round(x);

              ctx.moveTo(ix + 0.5, iys + 0.5);
              ctx.lineTo(ix + 0.5, iye + 0.5);
            }

            for (let y = ys; y <= ye; y += stepping) {
              y = Math.round((y - ty) / stepping) * stepping + ty;
              const iy = Math.round(y);

              ctx.moveTo(ixs + 0.5, iy + 0.5);
              ctx.lineTo(ixe + 0.5, iy + 0.5);
            }

            ctx.closePath();
            ctx.stroke();
          }
        }
      };
    } catch (e) {
      GlobalConfig.logger.show();
      GlobalConfig.logger.debug('Using background image');

      container.style.backgroundImage = "url('./images/grid.gif')";
    }

    const mxGraphViewValidateBackground = GraphView.prototype.validateBackground;
    GraphView.prototype.validateBackground = function () {
      mxGraphViewValidateBackground.call(this);
      repaintGrid();
    };
  })();

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  graph.centerZoom = false;

  const controller = document.createElement('div');
  div.appendChild(controller);

  controller.appendChild(
    DomHelpers.button('+', function () {
      graph.zoomIn();
    })
  );

  controller.appendChild(
    DomHelpers.button('-', function () {
      graph.zoomOut();
    })
  );

  return div;
};

export const Default = Template.bind({});
