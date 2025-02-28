/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2013, JGraph Ltd

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

/*
Menustyle

This example demonstrates using CSS to style the mxPopupMenu.
*/

import {
  Client,
  CellOverlay,
  CellRenderer,
  type CellState,
  EventObject,
  ImageBox,
  InternalEvent,
  InternalMouseEvent,
  RubberBandHandler,
  Graph,
  PopupMenuHandler,
  CellEditorHandler,
  TooltipHandler,
  SelectionCellsHandler,
  ConnectionHandler,
  SelectionHandler,
  PanningHandler,
  type Shape,
  VertexHandlerConfig,
  HandleConfig,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';
// style required by RubberBand and MaxPopupMenu
import '@maxgraph/core/css/common.css';
// custom style for Popup Menu
import './css/menu-style.css';

export default {
  title: 'Misc/MenuStyle',
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

  // Disables built-in context menu
  InternalEvent.disableContextMenu(container);

  // Changes some default colors
  HandleConfig.fillColor = '#99ccff';
  HandleConfig.strokeColor = '#0088cf';
  VertexHandlerConfig.selectionColor = '#00a8ff';

  class MyCustomCellRenderer extends CellRenderer {
    installCellOverlayListeners(state: CellState, overlay: CellOverlay, shape: Shape) {
      super.installCellOverlayListeners(state, overlay, shape);
      const graph = state.view.graph;

      InternalEvent.addGestureListeners(
        shape.node,
        function (evt) {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_DOWN,
            new InternalMouseEvent(evt, state)
          );
        },
        function (evt) {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_MOVE,
            new InternalMouseEvent(evt, state)
          );
        },
        function (_evt) {}
      );

      if (!Client.IS_TOUCH) {
        InternalEvent.addListener(shape.node, 'mouseup', function (evt: MouseEvent) {
          overlay.fireEvent(
            new EventObject(InternalEvent.CLICK, 'event', evt, 'cell', state.cell)
          );
        });
      }
    }
  }

  class MyCustomPopupMenuHandler extends PopupMenuHandler {
    constructor(graph: Graph) {
      super(graph);
      // Configures automatic expand on mouseover
      this.autoExpand = true; // TODO autoExpand is not working

      // Installs context menu
      this.factoryMethod = function (menu, _cell, _evt) {
        menu.addItem('Item 1', null, function () {
          alert('Item 1');
        });
        menu.addItem('Item 2', null, function () {
          alert('Item 2');
        });
        menu.addSeparator();

        const submenu1 = menu.addItem('Submenu 1');
        menu.addItem(
          'Subitem 1',
          null,
          function () {
            alert('Subitem 1');
          },
          submenu1
        );
        menu.addItem(
          'Subitem 2',
          null,
          function () {
            alert('Subitem 2');
          },
          submenu1
        );
      };
    }
  }

  class MyCustomGraph extends Graph {
    createCellRenderer() {
      return new MyCustomCellRenderer();
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container, undefined, [
    CellEditorHandler,
    TooltipHandler,
    SelectionCellsHandler,
    MyCustomPopupMenuHandler,
    ConnectionHandler,
    SelectionHandler,
    PanningHandler,
    RubberBandHandler,
  ]);
  graph.setTooltips(true);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  let v1;
  graph.batchUpdate(() => {
    v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    graph.insertEdge(parent, null, '', v1, v2);
  });

  // Creates a new overlay with an image and a tooltip and makes it "transparent" to events
  // and sets the overlay for the cell in the graph
  const overlay = new CellOverlay(
    new ImageBox('images/overlays/check.png', 16, 16),
    'Overlay tooltip'
  );
  graph.addCellOverlay(v1!, overlay);

  return container;
};

export const Default = Template.bind({});
