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
  InternalEvent,
  CellRenderer,
  EdgeHandler,
  HierarchicalLayout,
  constants,
  CellOverlay,
  getDefaultPlugins,
  ImageBox,
  Client,
  Morphing,
  EventObject,
  eventUtils,
  styleUtils,
  type Cell,
  type CellState,
  type ConnectionHandler,
  type EdgeStyleFunction,
  type InternalMouseEvent,
  type PopupMenuHandler,
  type Rectangle,
  type Shape,
  type GraphPluginConstructor,
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
  title: 'Layouts/AutoLayout',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...contextMenuValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const container = createGraphContainer(args);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  class MyCustomCellRenderer extends CellRenderer {
    installCellOverlayListeners(state: CellState, overlay: CellOverlay, shape: Shape) {
      super.installCellOverlayListeners(state, overlay, shape);

      InternalEvent.addListener(
        shape.node,
        Client.IS_POINTER ? 'pointerdown' : 'mousedown',
        (evt: MouseEvent | KeyboardEvent) => {
          overlay.fireEvent(new EventObject('pointerdown', { event: evt, state }));
        }
      );

      if (!Client.IS_POINTER && Client.IS_TOUCH) {
        InternalEvent.addListener(
          shape.node,
          'touchstart',
          (evt: MouseEvent | KeyboardEvent) => {
            overlay.fireEvent(new EventObject('pointerdown', { event: evt, state }));
          }
        );
      }
    }
  }

  class MyCustomEdgeHandler extends EdgeHandler {
    connect(
      edge: Cell,
      terminal: Cell,
      isSource: boolean,
      _isClone: boolean,
      _me: InternalMouseEvent
    ): Cell {
      const cell = super.connect(edge, terminal, isSource, _isClone, _me);
      executeLayout();
      return cell;
    }
  }

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement, plugins: GraphPluginConstructor[]) {
      super(container, undefined, plugins);
    }

    createEdgeHandler(
      state: CellState,
      _edgeStyle: EdgeStyleFunction | null
    ): EdgeHandler {
      return new MyCustomEdgeHandler(state);
    }

    createCellRenderer() {
      return new MyCustomCellRenderer();
    }

    resizeCell = (cell: Cell, bounds: Rectangle, recurse?: boolean): Cell => {
      const resizedCell = super.resizeCell(cell, bounds, recurse);
      executeLayout();
      return resizedCell;
    };
  }

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container, plugins);
  graph.setPanning(true);

  graph.setAllowDanglingEdges(false);

  const connectionHandler = graph.getPlugin<ConnectionHandler>('ConnectionHandler');
  connectionHandler.select = false;

  graph.view.setTranslate(20, 20);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  const layout = new HierarchicalLayout(graph, constants.DIRECTION.WEST);

  let vertex1: Cell;
  const executeLayout = (change?: () => void, post?: () => void) => {
    graph.getDataModel().beginUpdate();
    try {
      change?.();
      layout.execute(graph.getDefaultParent(), vertex1);
    } finally {
      // New API for animating graph layout results asynchronously
      const morph = new Morphing(graph);
      morph.addListener(InternalEvent.DONE, () => {
        graph.getDataModel().endUpdate();
        post?.();
      });
      morph.startAnimation();
    }
  };

  const addOverlay = (cell: Cell) => {
    // Creates a new overlay with an image and a tooltip
    const overlay = new CellOverlay(
      new ImageBox('images/add.png', 24, 24),
      'Add outgoing'
    );
    overlay.cursor = 'hand';

    // Installs a handler for clicks on the overlay
    overlay.addListener(InternalEvent.CLICK, (_name: string, _funct: Function) => {
      graph.clearSelection();

      let vertex: Cell;
      executeLayout(
        () => {
          const geo = cell.getGeometry();
          vertex = graph.insertVertex({
            parent,
            value: 'World!',
            position: [geo!.x, geo!.y],
            size: [80, 30],
          });
          addOverlay(vertex);
          graph.view.refresh();
          graph.insertEdge({
            parent,
            source: cell,
            target: vertex,
          });
        },
        () => {
          graph.scrollCellToVisible(vertex);
        }
      );
    });

    // Special CMS event, automatically connect the new vertex to its predecessor
    overlay.addListener('pointerdown', (_sender: EventTarget, eo: EventObject) => {
      const evt2 = eo.getProperty('event');
      const state = eo.getProperty('state');

      const popupMenuHandler = graph.getPlugin<PopupMenuHandler>('PopupMenuHandler');
      popupMenuHandler.hideMenu();

      graph.stopEditing(false);

      const pt = styleUtils.convertPoint(
        graph.container,
        eventUtils.getClientX(evt2),
        eventUtils.getClientY(evt2)
      );

      connectionHandler.start(state, pt.x, pt.y);

      graph.isMouseDown = true;
      graph.isMouseTrigger = eventUtils.isMouseEvent(evt2);
      InternalEvent.consume(evt2);
    });

    // Sets the overlay for the cell in the graph
    graph.addCellOverlay(cell, overlay);
  };

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    vertex1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [0, 0],
      size: [80, 30],
    });
    addOverlay(vertex1);
  });

  // TODO remove
  // graph.resizeCell = function () {
  //   Graph.prototype.resizeCell.apply(this, arguments);
  //   executeLayout();
  // };

  connectionHandler.addListener(InternalEvent.CONNECT, function () {
    executeLayout();
  });

  return container;
};

export const Default = Template.bind({});
