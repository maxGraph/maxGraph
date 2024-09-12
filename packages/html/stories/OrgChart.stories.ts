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

import { Cell, PopupMenuHandler, PrintPreview } from '@maxgraph/core';

import {
  Graph,
  constants,
  InternalEvent,
  Client,
  Point,
  Outline,
  KeyHandler,
  CompactTreeLayout,
  LayoutManager,
  CellOverlay,
  ImageBox,
  utils,
  MaxToolbar,
  StyleDefaultsConfig,
} from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Layouts/OrgChart',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Makes the shadow brighter
  StyleDefaultsConfig.shadowColor = '#C0C0C0';

  // TODO create the outline container in the DOM
  const outline = document.getElementById('outlineContainer');

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Sets a gradient background
  // TODO use new props for gradient https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/linear-gradient
  if (Client.IS_GC || Client.IS_SF) {
    container.style.background =
      '-webkit-gradient(linear, 0% 0%, 0% 100%, from(#FFFFFF), to(#E7E7E7))';
  } else if (Client.IS_NS) {
    container.style.background = '-moz-linear-gradient(top, #FFFFFF, #E7E7E7)';
  }

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enables automatic sizing for vertices after editing and
  // panning by using the left mouse button.
  graph.setCellsMovable(false);
  graph.setAutoSizeCells(true);
  graph.setPanning(true);
  graph.centerZoom = false;

  const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler');
  panningHandler.useLeftButtonForPanning = true;
  // Displays a popupmenu when the user clicks
  // on a cell (using the left mouse button) but
  // do not select the cell when the popup menu
  // is displayed
  // TODO doesn't work, check the mxGraph code
  // panningHandler.popupMenuHandler = false;

  // Creates the outline (navigator, overview) for moving around the graph in the top, right corner of the window.
  // TODO do we need to keep the constant?
  // const outln = new Outline(graph, outline);
  new Outline(graph, outline);

  // Disables tooltips on touch devices
  graph.setTooltips(!Client.IS_TOUCH);

  // Set some stylesheet options for the visual appearance of vertices
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = 'label';

  style.verticalAlign = constants.ALIGN.MIDDLE;
  style.align = constants.ALIGN.LEFT;
  style.spacingLeft = 54;

  style.gradientColor = '#7d85df';
  style.strokeColor = '#5d65df';
  style.fillColor = '#adc5ff';

  style.fontColor = '#1d258f';
  style.fontFamily = 'Verdana';
  style.fontSize = 12;
  style.fontStyle = 1;

  style.shadow = true;
  style.rounded = true;
  style.glass = true;

  style.image = 'images/dude3.png';
  style.imageWidth = 48;
  style.imageHeight = 48;
  style.spacing = 8;

  // Sets the default style for edges
  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.rounded = true;
  style.strokeWidth = 3;
  style.exitX = 0.5; // center
  style.exitY = 1.0; // bottom
  style.exitPerimeter = false; // disabled
  style.entryX = 0.5; // center
  style.entryY = 0; // top
  style.entryPerimeter = false; // disabled

  // Disable the following for straight lines
  // TODO style.edgeStyle should accept a EdgeStyleFunction
  // style.edgeStyle = EdgeStyle.TopToBottom;
  style.edgeStyle = 'topToBottomEdgeStyle';

  // Stops editing on enter or escape keypress
  // TODO do we need to keep the constant?
  // const keyHandler = new KeyHandler(graph);
  new KeyHandler(graph);

  // Enables automatic layout on the graph and installs
  // a tree layout for all groups whose children are
  // being changed, added or removed.
  const layout = new CompactTreeLayout(graph, false);
  layout.useBoundingBox = false;
  layout.edgeRouting = false;
  layout.levelDistance = 60;
  layout.nodeDistance = 16;

  // Allows the layout to move cells even though cells aren't movable in the graph
  layout.isVertexMovable = function (_cell: Cell) {
    return true;
  };

  const layoutMgr = new LayoutManager(graph);
  layoutMgr.getLayout = function (cell: Cell | null, _eventName: string) {
    return cell && cell.getChildCount() > 0 ? layout : null;
  };

  const popupMenuHandler = graph.getPlugin<PopupMenuHandler>('PopupMenuHandler');
  // Installs a popupmenu handler using local function (see below).
  // TODO https://github.com/maxGraph/maxGraph/issues/308 wrong type for factoryMethod
  // @ts-ignore
  popupMenuHandler.factoryMethod = function (
    menu: PopupMenuHandler,
    cell: Cell | null,
    evt: MouseEvent
  ) {
    return createPopupMenu(graph, menu, cell, evt);
  };

  // Fix for wrong preferred size
  const oldGetPreferredSizeForCell = graph.getPreferredSizeForCell;
  graph.getPreferredSizeForCell = function (cell: Cell, textWidth?: number | null) {
    const result = oldGetPreferredSizeForCell.apply(this, [cell, textWidth]);

    if (result != null) {
      result.width = Math.max(120, result.width - 40);
    }

    return result;
  };

  // Sets the maximum text scale to 1
  graph.cellRenderer.getTextScale = function (state) {
    return Math.min(1, state.view.scale);
  };

  // Dynamically adds text to the label as we zoom in
  // (without affecting the preferred size for new cells)
  graph.cellRenderer.getLabelValue = function (state) {
    let result = state.cell.value;

    if (state.cell.isVertex()) {
      if (state.view.scale > 1) {
        result += '\nDetails 1';
      }

      if (state.view.scale > 1.3) {
        result += '\nDetails 2';
      }
    }

    return result;
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds the root vertex of the tree
  graph.batchUpdate(() => {
    const w = graph.container.offsetWidth;
    const v1 = graph.insertVertex(
      parent,
      'treeRoot',
      'Organization',
      w / 2 - 30,
      20,
      140,
      60,
      { image: 'images/house.png' }
    );
    graph.updateCellSize(v1);
    addOverlays(graph, v1, false);
  });

  const content = document.createElement('div');
  content.style.padding = '4px';
  div.appendChild(content);
  const tb = new MaxToolbar(content);

  tb.addItem('Zoom In', 'images/zoom_in32.png', function (_evt) {
    graph.zoomIn();
  });

  tb.addItem('Zoom Out', 'images/zoom_out32.png', function (evt) {
    graph.zoomOut();
  });

  tb.addItem('Actual Size', 'images/view_1_132.png', function (evt) {
    graph.zoomActual();
  });

  tb.addItem('Print', 'images/print32.png', function (evt) {
    const preview = new PrintPreview(graph, 1);
    preview.open();
  });

  tb.addItem('Poster Print', 'images/press32.png', function (evt) {
    // TODO find a location for this
    const pageCount = utils.prompt('Enter maximum page count', '1');

    if (pageCount != null) {
      const scale = printUtils.getScaleForPageCount(pageCount, graph);
      const preview = new PrintPreview(graph, scale);
      preview.open();
    }
  });

  // Function to create the entries in the popupmenu
  function createPopupMenu(
    graph: Graph,
    menu: PopupMenuHandler,
    cell: Cell | null,
    _evt: MouseEvent
  ) {
    // TODO managed image path when not served in the root context
    // const model = graph.getDataModel();

    if (cell != null) {
      if (cell.isVertex()) {
        menu.addItem('Add child', 'images/overlays/check.png', function () {
          addChild(graph, cell);
        });
      }

      menu.addItem('Edit label', 'images/text.gif', function () {
        graph.startEditingAtCell(cell);
      });

      if (cell.id != 'treeRoot' && cell.isVertex()) {
        menu.addItem('Delete', 'images/delete.gif', function () {
          deleteSubtree(graph, cell);
        });
      }

      menu.addSeparator();
    }

    menu.addItem('Fit', 'images/zoom.gif', function () {
      graph.fit();
    });

    menu.addItem('Actual', 'images/zoomactual.gif', function () {
      graph.zoomActual();
    });

    menu.addSeparator();

    menu.addItem('Print', 'images/print.gif', function () {
      const preview = new PrintPreview(graph, 1);
      preview.open();
    });

    menu.addItem('Poster Print', 'images/print.gif', function () {
      // TODO find a location for this
      const pageCount = utils.prompt('Enter maximum page count', '1');

      if (pageCount != null) {
        const scale = printUtils.getScaleForPageCount(pageCount, graph);
        const preview = new PrintPreview(graph, scale);
        preview.open();
      }
    });
  }

  function addOverlays(graph: Graph, cell: Cell, addDeleteIcon: boolean) {
    let overlay = new CellOverlay(new ImageBox('images/add.png', 24, 24), 'Add child');
    overlay.cursor = 'hand';
    overlay.align = constants.ALIGN.CENTER;
    overlay.addListener(InternalEvent.CLICK, (sender, evt) => {
      addChild(graph, cell);
    });

    graph.addCellOverlay(cell, overlay);

    if (addDeleteIcon) {
      overlay = new CellOverlay(new ImageBox('images/close.png', 30, 30), 'Delete');
      overlay.cursor = 'hand';
      overlay.offset = new Point(-4, 8);
      overlay.align = constants.ALIGN.RIGHT;
      overlay.verticalAlign = constants.ALIGN.TOP;
      overlay.addListener(InternalEvent.CLICK, (sender, evt) => {
        deleteSubtree(graph, cell);
      });

      graph.addCellOverlay(cell, overlay);
    }
  }

  function addChild(graph: Graph, cell: Cell) {
    const model = graph.getDataModel();
    const parent = graph.getDefaultParent();
    let vertex;

    model.beginUpdate();
    try {
      vertex = graph.insertVertex(parent, null, 'Double click to set name');
      const geometry = vertex.getGeometry()!;

      // Updates the geometry of the vertex with the
      // preferred size computed in the graph
      const size = graph.getPreferredSizeForCell(vertex)!;
      geometry.width = size.width;
      geometry.height = size.height;

      // Adds the edge between the existing cell
      // and the new vertex and executes the
      // automatic layout on the parent
      const edge = graph.insertEdge(parent, null, '', cell, vertex);

      // Configures the edge label "in-place" to reside
      // at the end of the edge (x = 1) and with an offset
      // of 20 pixels in negative, vertical direction.
      const edgeGeometry = edge.geometry!;
      edgeGeometry.x = 1;
      edgeGeometry.y = 0;
      edgeGeometry.offset = new Point(0, -20);

      addOverlays(graph, vertex, true);
    } finally {
      model.endUpdate();
    }

    return vertex;
  }

  function deleteSubtree(graph: Graph, cell: Cell) {
    // Gets the subtree from cell downwards
    const cells: Cell[] = [];
    graph.traverse(cell, true, function (vertex: Cell) {
      cells.push(vertex);

      return true;
    });

    graph.removeCells(cells);
  }

  return div;
};

export const Default = Template.bind({});
