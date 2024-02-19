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
  ImageBox,
  Client,
  Morphing,
  EventObject,
  eventUtils,
  styleUtils,
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

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  class MyCustomCellRenderer extends CellRenderer {
    installCellOverlayListeners(state, overlay, shape) {
      super.installCellOverlayListeners(state, overlay, shape);

      InternalEvent.addListener(
        shape.node,
        Client.IS_POINTER ? 'pointerdown' : 'mousedown',
        (evt) => {
          overlay.fireEvent(new EventObject('pointerdown', { event: evt, state }));
        }
      );

      if (!Client.IS_POINTER && Client.IS_TOUCH) {
        InternalEvent.addListener(shape.node, 'touchstart', (evt) => {
          overlay.fireEvent(new EventObject('pointerdown', { event: evt, state }));
        });
      }
    }
  }

  class MyCustomEdgeHandler extends EdgeHandler {
    connect(edge, terminal, isSource, isClone, me) {
      super.connect(edge, terminal, isSource, isClone, me);
      executeLayout();
    }
  }

  class MyCustomGraph extends Graph {
    createEdgeHandler(state, edgeStyle) {
      return new MyCustomEdgeHandler(state, edgeStyle);
    }

    createCellRenderer() {
      return new MyCustomCellRenderer();
    }
  }

  // Creates the graph inside the given this.el
  const graph = new MyCustomGraph(container);
  graph.setPanning(true);

  graph.setAllowDanglingEdges(false);

  const connectionHandler = graph.getPlugin('ConnectionHandler');
  connectionHandler.select = false;

  graph.view.setTranslate(20, 20);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  const layout = new HierarchicalLayout(graph, constants.DIRECTION.WEST);

  let v1;
  const executeLayout = (change, post) => {
    graph.getDataModel().beginUpdate();
    try {
      if (change != null) {
        change();
      }
      layout.execute(graph.getDefaultParent(), v1);
    } catch (e) {
      throw e;
    } finally {
      // New API for animating graph layout results asynchronously
      const morph = new Morphing(graph);
      morph.addListener(InternalEvent.DONE, () => {
        graph.getDataModel().endUpdate();
        if (post != null) {
          post();
        }
      });
      morph.startAnimation();
    }
  };

  const addOverlay = (cell) => {
    // Creates a new overlay with an image and a tooltip
    const overlay = new CellOverlay(
      new ImageBox('images/add.png', 24, 24),
      'Add outgoing'
    );
    overlay.cursor = 'hand';

    // Installs a handler for clicks on the overlay
    overlay.addListener(InternalEvent.CLICK, (sender, evt2) => {
      graph.clearSelection();
      const geo = cell.getGeometry();

      let v2;

      executeLayout(
        () => {
          v2 = graph.insertVertex({
            parent,
            value: 'World!',
            position: [geo.x, geo.y],
            size: [80, 30],
          });
          addOverlay(v2);
          graph.view.refresh(v2);
          const e1 = graph.insertEdge({
            parent,
            source: cell,
            target: v2,
          });
        },
        () => {
          graph.scrollCellToVisible(v2);
        }
      );
    });

    // Special CMS event
    overlay.addListener('pointerdown', (sender, eo) => {
      const evt2 = eo.getProperty('event');
      const state = eo.getProperty('state');

      const popupMenuHandler = graph.getPlugin('PopupMenuHandler');
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
    v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [0, 0],
      size: [80, 30],
    });
    addOverlay(v1);
  });

  graph.resizeCell = function () {
    Graph.prototype.resizeCell.apply(this, arguments);
    executeLayout();
  };

  connectionHandler.addListener(InternalEvent.CONNECT, function () {
    executeLayout();
  });

  return container;
};

export const Default = Template.bind({});
