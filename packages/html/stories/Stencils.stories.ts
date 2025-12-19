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
  type AbstractCanvas2D,
  CellHighlight,
  type CellState,
  ConnectionHandler,
  DomHelpers,
  EdgeHandler,
  getDefaultPlugins,
  Graph,
  HandleConfig,
  InternalEvent,
  requestUtils,
  Point,
  type Rectangle,
  RubberBandHandler,
  Shape,
  ShapeRegistry,
  StencilShape,
  StencilShapeRegistry,
  StyleDefaultsConfig,
  type TooltipHandler,
  VertexHandler,
  VertexHandlerConfig,
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
import { isElement } from './shared/utils.ts';
import '@maxgraph/core/css/common.css'; // style required by RubberBand

export default {
  title: 'Shapes/Stencils',
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
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Sets the global configurations
  StyleDefaultsConfig.shadowColor = '#C0C0C0';
  StyleDefaultsConfig.shadowOpacity = 0.5;
  StyleDefaultsConfig.shadowOffsetX = 4;
  StyleDefaultsConfig.shadowOffsetY = 4;

  HandleConfig.fillColor = '#99ccff';
  HandleConfig.strokeColor = '#0088cf';
  VertexHandlerConfig.selectionColor = '#00a8ff';

  // Enables connections along the outline
  ConnectionHandler.prototype.outlineConnect = true;
  EdgeHandler.prototype.manageLabelHandle = true;
  EdgeHandler.prototype.outlineConnect = true;
  CellHighlight.prototype.keepOnTop = true;

  class CustomVertexHandler extends VertexHandler {
    // Enable rotation handle
    // use an alternate way to enable rotation handle as we already override the VertexHandler for other purposes
    // another way to enable rotation handle is to set `VertexHandlerConfig.rotationEnabled = true`;
    override isRotationEnabled(): boolean {
      return true;
    }

    // Uses the shape for resize previews
    override createSelectionShape(bounds: Rectangle) {
      const stencil = StencilShapeRegistry.get(this.state.style.shape);
      let shape: Shape;

      if (stencil) {
        shape = new Shape(stencil);
        shape.apply(this.state);
      } else {
        // @ts-ignore known to work at runtime
        shape = new this.state.shape.constructor();
      }

      shape.outline = true;
      shape.bounds = bounds;
      shape.stroke = HandleConfig.strokeColor;
      shape.strokeWidth = this.getSelectionStrokeWidth();
      shape.isDashed = this.isSelectionDashed();
      shape.isShadow = false;
      return shape;
    }
  }
  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  class CustomGraph extends Graph {
    constructor(container: HTMLElement) {
      super(container, undefined, plugins);
    }

    override createVertexHandler(state: CellState) {
      return new CustomVertexHandler(state);
    }
  }

  // Defines a custom Shape via the canvas API
  class CustomShape extends Shape {
    override paintBackground(
      c: AbstractCanvas2D,
      x: number,
      y: number,
      w: number,
      h: number
    ) {
      c.translate(x, y);

      // Head
      c.ellipse(w / 4, 0, w / 2, h / 4);
      c.fillAndStroke();

      c.begin();
      c.moveTo(w / 2, h / 4);
      c.lineTo(w / 2, (2 * h) / 3);

      // Arms
      c.moveTo(w / 2, h / 3);
      c.lineTo(0, h / 3);
      c.moveTo(w / 2, h / 3);
      c.lineTo(w, h / 3);

      // Legs
      c.moveTo(w / 2, (2 * h) / 3);
      c.lineTo(0, h);
      c.moveTo(w / 2, (2 * h) / 3);
      c.lineTo(w, h);
      c.end();

      c.stroke();
    }
  }

  // Replaces existing actor shape
  ShapeRegistry.add('customShape', CustomShape);

  // Loads the stencils into the registry
  const req = requestUtils.load('stencils.xml');
  const root = req.getDocumentElement();
  let shape = root!.firstChild; // <shapes> node

  while (shape != null) {
    if (isElement(shape)) {
      StencilShapeRegistry.add(
        shape.getAttribute('name')!, // the "name" attribute is always set
        new StencilShape(shape)
      );
    }

    shape = shape.nextSibling;
  }

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new CustomGraph(container);
  graph.setConnectable(true);
  graph.setTooltips(true);
  graph.setPanning(true);

  const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler')!;
  tooltipHandler.getTooltipForCell = function (cell) {
    return cell ? JSON.stringify(cell.style) : 'Cell without dedicated style';
  };

  // Changes default styles
  let style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edgeStyle = 'orthogonalEdgeStyle';
  style = graph.getStylesheet().getDefaultVertexStyle();
  style.fillColor = '#adc5ff';
  style.gradientColor = '#7d85df';
  style.shadow = true;

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'A1', 20, 20, 40, 80, { shape: 'and' });
    const v2 = graph.insertVertex(parent, null, 'A2', 20, 220, 40, 80, { shape: 'and' });
    const v3 = graph.insertVertex(parent, null, 'X1', 160, 110, 80, 80, { shape: 'xor' });
    const e1 = graph.insertEdge(parent, null, '', v1, v3);
    e1.geometry!.points = [new Point(90, 60), new Point(90, 130)];
    const e2 = graph.insertEdge(parent, null, '', v2, v3);
    e2.geometry!.points = [new Point(90, 260), new Point(90, 170)];

    const v4 = graph.insertVertex(parent, null, 'A3', 520, 20, 40, 80, {
      shape: 'customShape',
      flipH: true,
    });
    const v5 = graph.insertVertex(parent, null, 'A4', 520, 220, 40, 80, {
      shape: 'and',
      flipH: true,
    });
    const v6 = graph.insertVertex(parent, null, 'X2', 340, 110, 80, 80, {
      shape: 'xor',
      flipH: true,
    });
    const e3 = graph.insertEdge(parent, null, '', v4, v6);
    e3.geometry!.points = [new Point(490, 60), new Point(130, 130)];
    const e4 = graph.insertEdge(parent, null, '', v5, v6);
    e4.geometry!.points = [new Point(490, 260), new Point(130, 170)];

    const v7 = graph.insertVertex(parent, null, 'O1', 250, 260, 80, 60, {
      shape: 'or',
      direction: 'south',
    });
    const e5 = graph.insertEdge(parent, null, '', v6, v7);
    e5.geometry!.points = [new Point(310, 150)];
    const e6 = graph.insertEdge(parent, null, '', v3, v7);
    e6.geometry!.points = [new Point(270, 150)];

    const e7 = graph.insertEdge(parent, null, '', v7, v5);
    e7.geometry!.points = [new Point(290, 370)];
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('FlipH', function () {
      graph.toggleCellStyles('flipH');
    })
  );

  buttons.appendChild(
    DomHelpers.button('FlipV', function () {
      graph.toggleCellStyles('flipV');
    })
  );

  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));

  buttons.appendChild(
    DomHelpers.button('Rotate', function () {
      const cell = graph.getSelectionCell();

      if (cell != null) {
        let geo = cell.getGeometry();

        if (geo != null) {
          graph.batchUpdate(() => {
            // Rotates the size and position in the geometry
            geo = geo!.clone();
            geo.x += geo.width / 2 - geo.height / 2;
            geo.y += geo.height / 2 - geo.width / 2;
            const tmp = geo.width;
            geo.width = geo.height;
            geo.height = tmp;
            graph.getDataModel().setGeometry(cell, geo);

            // Reads the current direction and advances by 90 degrees
            const state = graph.view.getState(cell);

            if (state != null) {
              let dir = state.style.direction || 'east'; /* default */

              if (dir === 'east') {
                dir = 'south';
              } else if (dir === 'south') {
                dir = 'west';
              } else if (dir === 'west') {
                dir = 'north';
              } else if (dir === 'north') {
                dir = 'east';
              }

              graph.setCellStyles('direction', dir, [cell]);
            }
          });
        }
      }
    })
  );

  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));

  buttons.appendChild(
    DomHelpers.button('And', function () {
      graph.setCellStyles('shape', 'and');
    })
  );
  buttons.appendChild(
    DomHelpers.button('Or', function () {
      graph.setCellStyles('shape', 'or');
    })
  );
  buttons.appendChild(
    DomHelpers.button('Xor', function () {
      graph.setCellStyles('shape', 'xor');
    })
  );

  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));

  buttons.appendChild(
    DomHelpers.button('Style', function () {
      const cell = graph.getSelectionCell();
      if (!cell) return;

      const newStyle = window.prompt(
        `Style Cell #${cell.getId()}`,
        JSON.stringify(cell.getStyle())
      );
      if (newStyle) {
        graph.getDataModel().setStyle(cell, JSON.parse(newStyle));
      }
    })
  );

  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));

  buttons.appendChild(
    DomHelpers.button('+', function () {
      graph.zoomIn();
    })
  );
  buttons.appendChild(
    DomHelpers.button('-', function () {
      graph.zoomOut();
    })
  );

  return div;
};

export const Default = Template.bind({});
