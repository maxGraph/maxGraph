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
  type AbstractGraph,
  Cell,
  CellOverlay,
  Client,
  CompactTreeLayout,
  EdgeStyle,
  type FitPlugin,
  Graph,
  ImageBox,
  InternalEvent,
  LayoutManager,
  type MaxPopupMenu,
  MaxToolbar,
  Outline,
  type PanningHandler,
  Point,
  PopupMenuHandler,
  PrintPreview,
  printUtils,
  treeTraversalUtils,
  StyleDefaultsConfig,
} from '@maxgraph/core';
import { contextMenuTypes, contextMenuValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Layouts/OrgChart',
  // The graph container takes all the available space, as in the mxGraph example
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    ...contextMenuTypes,
  },
  args: {
    ...contextMenuValues,
  },
};

// Returns null when the user cancels the prompt or does not enter a number
const promptForPageCount = (): number | null => {
  const pageCount = Number.parseInt(window.prompt('Enter maximum page count', '1') ?? '');
  return Number.isNaN(pageCount) ? null : pageCount;
};

const Template = ({ label, ...args }: Record<string, string>) => {
  // Positioned area holding the graph container, with the toolbar and the outline displayed over it
  const div = document.createElement('div');
  div.style.position = 'relative';
  div.style.height = '100vh';

  const container = createGraphContainer(args);
  container.style.cursor = 'unset';
  container.style.width = '100%';
  container.style.height = '100%';
  div.appendChild(container);

  // The mxGraph example displays the toolbar in a floating MaxWindow, it is fixed in the top left corner here
  const tbContainer = document.createElement('div');
  tbContainer.style.position = 'absolute';
  tbContainer.style.top = '10px';
  tbContainer.style.left = '10px';
  tbContainer.style.cursor = 'pointer';
  div.appendChild(tbContainer);

  // Makes the shadow brighter
  StyleDefaultsConfig.shadowColor = '#C0C0C0';

  const outlineContainer = document.createElement('div');
  const outlineContainerStyle = outlineContainer.style;
  outlineContainerStyle.position = 'absolute';
  outlineContainerStyle.overflow = 'hidden';
  outlineContainerStyle.top = '0px';
  outlineContainerStyle.right = '10px';
  outlineContainerStyle.width = '160px';
  outlineContainerStyle.height = '120px';
  outlineContainerStyle.background = 'transparent';
  outlineContainerStyle.borderStyle = 'solid';
  outlineContainerStyle.borderColor = 'lightgray';
  div.appendChild(outlineContainer);

  if (!args.contextMenu) InternalEvent.disableContextMenu(div);
  // if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Sets a gradient background
  container.style.background = 'linear-gradient(#FFFFFF, #E7E7E7)';

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enables automatic sizing for vertices after editing and
  // panning by using the left mouse button.
  graph.setCellsMovable(false);

  // Edges and the root vertex cannot be selected: there is no action available on edges, and the root cannot be changed
  const isCellSelectable = graph.isCellSelectable;
  graph.isCellSelectable = function (cell: Cell): boolean {
    return cell.isVertex() && cell.id !== 'treeRoot' && isCellSelectable.call(this, cell);
  };
  graph.setAutoSizeCells(true);
  graph.setPanning(true);
  graph.centerZoom = false;

  const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
  panningHandler.useLeftButtonForPanning = true;
  // The right button opens the popup menu, so it must not start panning
  panningHandler.usePopupTrigger = false;
  // Creates the outline (navigator, overview) for moving around the graph in the top, right corner of the window.
  const outline = new Outline(graph, outlineContainer);
  outline.outline!.labelsVisible = true; // disabled by default for performance reasons, but enabled here to demonstrate the feature.
  outline.updateOnPan = true;

  // Disables tooltips on touch devices
  graph.setTooltips(!Client.IS_TOUCH);

  // Set some stylesheet options for the visual appearance of vertices
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = 'label';

  style.verticalAlign = 'middle';
  style.align = 'left';
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
  style.editable = false; // edges have no label
  style.strokeWidth = 3;
  style.exitX = 0.5; // center
  style.exitY = 1.0; // bottom
  style.exitPerimeter = false; // disabled
  style.entryX = 0.5; // center
  style.entryY = 0; // top
  style.entryPerimeter = false; // disabled

  // Disable the following for straight lines
  style.edgeStyle = EdgeStyle.TopToBottom;

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

  const popupMenuHandler = graph.getPlugin<PopupMenuHandler>('PopupMenuHandler')!;
  // Installs a popupmenu handler using local function (see below).
  popupMenuHandler.factoryMethod = function (
    menu: MaxPopupMenu,
    cell: Cell | null,
    evt: MouseEvent
  ) {
    return createPopupMenu(graph, menu, cell, evt);
  };

  // Fix for wrong preferred size
  const oldGetPreferredSizeForCell = graph.getPreferredSizeForCell;
  graph.getPreferredSizeForCell = function (cell: Cell, textWidth?: number | null) {
    const result = oldGetPreferredSizeForCell.call(this, cell, textWidth);

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

  // Adds the root vertex of the tree, centered horizontally.
  // The story element is attached to the page after this function returns, so the container has no size yet.
  requestAnimationFrame(() => {
    graph.batchUpdate(() => {
      const w = graph.container.offsetWidth;
      const v1 = graph.insertVertex({
        id: 'treeRoot',
        value: 'Organization',
        position: [w / 2 - 30, 20],
        size: [140, 60],
        // The root can neither be resized nor have its label changed
        style: { image: 'images/house.png', editable: false, resizable: false },
      });
      graph.updateCellSize(v1);
      addOverlays(graph, v1, false);
    });
  });

  const tb = new MaxToolbar(tbContainer);

  tb.addItem('Zoom In', 'images/zoom_in32.png', () => {
    graph.zoomIn();
  });

  tb.addItem('Zoom Out', 'images/zoom_out32.png', () => {
    graph.zoomOut();
  });

  tb.addItem('Actual Size', 'images/view_1_132.png', () => {
    graph.zoomActual();
  });

  tb.addItem('Fit Center', 'images/fit_to_size.png', () => {
    graph.getPlugin<FitPlugin>('fit')?.fitCenter({ margin: 50 });
  });

  const printItem = tb.addItem('Print', 'images/print32.png', () => {
    const preview = new PrintPreview(graph, 1);
    preview.open();
  });
  // Separates the print items from the zoom items
  printItem.style.marginLeft = '16px';

  tb.addItem('Poster Print', 'images/press32.png', () => {
    const pageCount = promptForPageCount();

    if (pageCount != null) {
      const scale = printUtils.getScaleForPageCount(pageCount, graph);
      const preview = new PrintPreview(graph, scale);
      preview.open();
    }
  });

  // Function to create the entries in the popupmenu
  function createPopupMenu(
    graph: AbstractGraph,
    menu: MaxPopupMenu,
    cell: Cell | null,
    _evt: MouseEvent
  ) {
    if (cell != null) {
      if (cell.isVertex()) {
        menu.addItem('Add child', 'images/overlays/check.png', function () {
          addChild(graph, cell);
        });
      }

      // startEditingAtCell does not check if the cell is editable when the cell is passed
      if (graph.isCellEditable(cell)) {
        menu.addItem('Edit label', 'images/text.gif', function () {
          graph.startEditingAtCell(cell);
        });
      }

      if (cell.id != 'treeRoot' && cell.isVertex()) {
        menu.addItem('Delete', 'images/delete.gif', function () {
          deleteSubtree(graph, cell);
        });
      }

      menu.addSeparator();
    }

    menu.addItem('Fit', 'images/zoom.gif', function () {
      graph.getPlugin<FitPlugin>('fit')?.fit();
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
      const pageCount = promptForPageCount();

      if (pageCount != null) {
        const scale = printUtils.getScaleForPageCount(pageCount, graph);
        const preview = new PrintPreview(graph, scale);
        preview.open();
      }
    });
  }

  function addOverlays(graph: AbstractGraph, cell: Cell, addDeleteIcon: boolean) {
    let overlay = new CellOverlay(new ImageBox('images/add.png', 24, 24), 'Add child');
    overlay.cursor = 'hand';
    overlay.align = 'center';
    overlay.addListener(InternalEvent.CLICK, () => {
      addChild(graph, cell);
    });

    graph.addCellOverlay(cell, overlay);

    if (addDeleteIcon) {
      overlay = new CellOverlay(new ImageBox('images/close.png', 30, 30), 'Delete');
      overlay.cursor = 'hand';
      overlay.offset = new Point(-4, 8);
      overlay.align = 'right';
      overlay.verticalAlign = 'top';
      overlay.addListener(InternalEvent.CLICK, () => {
        deleteSubtree(graph, cell);
      });

      graph.addCellOverlay(cell, overlay);
    }
  }

  function addChild(graph: AbstractGraph, cell: Cell): void {
    graph.batchUpdate(() => {
      const vertex = graph.insertVertex({ value: 'Double click to set name' });
      const geometry = vertex.getGeometry()!;

      // Updates the geometry of the vertex with the
      // preferred size computed in the graph
      const size = graph.getPreferredSizeForCell(vertex)!;
      geometry.width = size.width;
      geometry.height = size.height;

      // Adds the edge between the existing cell
      // and the new vertex and executes the
      // automatic layout on the parent
      const edge = graph.insertEdge({ source: cell, target: vertex });

      // Configures the edge label "in-place" to reside
      // at the end of the edge (x = 1) and with an offset
      // of 20 pixels in negative, vertical direction.
      const edgeGeometry = edge.geometry!;
      edgeGeometry.x = 1;
      edgeGeometry.y = 0;
      edgeGeometry.offset = new Point(0, -20);

      addOverlays(graph, vertex, true);
    });
  }

  function deleteSubtree(graph: AbstractGraph, cell: Cell) {
    // Gets the subtree from cell downwards
    const cells: Cell[] = [];

    treeTraversalUtils.traverse(cell, true, function (vertex: Cell) {
      cells.push(vertex);
      return true;
    });

    graph.removeCells(cells);
  }

  return div;
};

export const Default = Template.bind({});
