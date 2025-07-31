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
  CylinderShape,
  DomHelpers,
  Point,
  Rectangle,
  VertexHandler,
  InternalEvent,
  RubberBandHandler,
  VertexHandle,
  type AbstractCanvas2D,
  type CellStateStyle,
  VertexHandlerConfig,
  getDefaultPlugins,
  type GraphPluginConstructor,
  ShapeRegistry,
  type SelectionCellsHandler,
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
import '@maxgraph/core/css/common.css'; // style required by RubberBand

export default {
  title: 'Layouts/Handles',
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

  const defaultPos1 = 20,
    defaultPos2 = 60;

  class MyShape extends CylinderShape {
    override getLabelBounds(rect: Rectangle) {
      const style: CustomCellStateStyle = this.style!;
      const pos1 = (style.pos1 ?? defaultPos1) * this.scale;
      const pos2 = (style.pos2 ?? defaultPos2) * this.scale;
      return new Rectangle(
        rect.x,
        rect.y + pos1,
        rect.width,
        Math.min(rect.height, pos2) - Math.max(0, pos1)
      );
    }

    override redrawPath(
      path: AbstractCanvas2D,
      _x: number,
      _y: number,
      w: number,
      h: number,
      isForeground = false
    ) {
      const style: CustomCellStateStyle = this.style!;
      const pos1 = style.pos1 ?? defaultPos1;
      const pos2 = style.pos2 ?? defaultPos2;

      if (isForeground) {
        if (pos1 < h) {
          path.moveTo(0, pos1);
          path.lineTo(w, pos1);
        }

        if (pos2 < h) {
          path.moveTo(0, pos2);
          path.lineTo(w, pos2);
        }
      } else {
        path.rect(0, 0, w, h);
      }
    }
  }
  ShapeRegistry.add('myShape', MyShape);

  // Enable rotation handle
  VertexHandlerConfig.rotationEnabled = true;

  type CustomCellStateStyle = CellStateStyle & {
    pos1?: number;
    pos2?: number;
  };

  class MyCustomVertexHandler extends VertexHandler {
    override livePreview = true;

    override createCustomHandles() {
      if (this.state.style.shape === 'myShape') {
        // Implements the handle for the first divider
        const firstHandle = new VertexHandle(this.state);

        firstHandle.getPosition = function (bounds) {
          if (!bounds) return new Point(0, 0);

          const style: CustomCellStateStyle = this.state.style!;
          const pos2 = Math.max(0, Math.min(bounds.height, style.pos2 ?? defaultPos2));
          const pos1 = Math.max(0, Math.min(pos2, style.pos1 ?? defaultPos1));

          return new Point(bounds.getCenterX(), bounds.y + pos1);
        };

        firstHandle.setPosition = function (bounds, pt) {
          if (!bounds) return;

          const style: CustomCellStateStyle = this.state.style!;
          const pos2 = Math.max(0, Math.min(bounds.height, style.pos2 ?? defaultPos2));

          style.pos1 = Math.round(Math.max(0, Math.min(pos2, pt.y - bounds.y)));
        };

        firstHandle.execute = function () {
          // @ts-ignore
          this.copyStyle('pos1');
        };

        firstHandle.ignoreGrid = true;

        // Implements the handle for the second divider
        const secondHandle = new VertexHandle(this.state);

        secondHandle.getPosition = function (bounds) {
          if (!bounds) return new Point(0, 0);

          const style: CustomCellStateStyle = this.state.style!;
          const pos1 = Math.max(0, Math.min(bounds.height, style.pos1 ?? defaultPos1));
          const pos2 = Math.max(pos1, Math.min(bounds.height, style.pos2 ?? defaultPos2));

          return new Point(bounds.getCenterX(), bounds.y + pos2);
        };

        secondHandle.setPosition = function (bounds, pt) {
          if (!bounds) return;

          const style: CustomCellStateStyle = this.state.style!;
          const pos1 = Math.max(0, Math.min(bounds.height, style.pos1 ?? defaultPos1));

          style.pos2 = Math.round(
            Math.max(pos1, Math.min(bounds.height, pt.y - bounds.y))
          );
        };

        secondHandle.execute = function () {
          // @ts-ignore
          this.copyStyle('pos2');
        };

        secondHandle.ignoreGrid = true;

        return [firstHandle, secondHandle];
      }

      return [];
    }
  }

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement, plugins: GraphPluginConstructor[]) {
      super(container, undefined, plugins);
    }
  }

  // Disables the built-in context menu
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container, plugins);
  graph.setCellsCloneable(true);
  graph.setHtmlLabels(true);
  graph.setPanning(true);
  graph.centerZoom = false;

  const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>(
    'SelectionCellsHandler'
  )!; // we know that this plugin is always available
  selectionCellsHandler.configureVertexHandler((state) => {
    return new MyCustomVertexHandler(state);
  });

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    graph.insertVertex(
      parent,
      null,
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      20,
      20,
      240,
      120,
      {
        shape: 'myShape',
        whiteSpace: 'wrap',
        overflow: 'hidden',
        pos1: 30,
        pos2: 80,
      } as CustomCellStateStyle
    );
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);

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
