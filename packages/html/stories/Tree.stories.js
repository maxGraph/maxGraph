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
  Client,
  Graph,
  CylinderShape,
  CellRenderer,
  GraphView,
  ImageBox,
  EdgeStyle,
  KeyHandler,
  CompactTreeLayout,
  LayoutManager,
  Rectangle,
  Point,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';

export default {
  title: 'Layouts/Tree',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  configureImagesBasePath();
  const container = createGraphContainer(args);

  /*
    Defines a custom shape for the tree node that includes the
    upper half of the outgoing edge(s).
  */
  class TreeNodeShape extends CylinderShape {
    // Defines the length of the upper edge segment.
    static segment = 20;

    constructor(bounds, fill, stroke, strokewidth) {
      super(bounds, fill, stroke, strokewidth);
    }

    // Needs access to the cell state for rendering
    apply(state) {
      super.apply(state);
      this.state = state;
    }

    redrawPath(path, x, y, w, h, isForeground) {
      const { graph } = this.state.view;
      const hasChildren = graph.getOutgoingEdges(this.state.cell).length > 0;

      if (isForeground) {
        if (hasChildren) {
          // Painting outside of vertex bounds is used here
          path.moveTo(w / 2, h + this.segment);
          path.lineTo(w / 2, h);
          path.end();
        }
      } else {
        path.moveTo(0, 0);
        path.lineTo(w, 0);
        path.lineTo(w, h);
        path.lineTo(0, h);
        path.close();
      }
    }
  }
  CellRenderer.registerShape('treenode', TreeNodeShape);

  class MyCustomGraphView extends GraphView {
    updateFloatingTerminalPoint(edge, start, end, source) {
      // Defines a custom perimeter for the nodes in the tree
      let pt = null;

      if (source) {
        pt = new Point(
          start.x + start.width / 2,
          start.y + start.height + TreeNodeShape.segment
        );
      } else {
        pt = new Point(start.x + start.width / 2, start.y);
      }

      edge.setAbsoluteTerminalPoint(pt, source);
    }
  }

  class MyCustomCellRenderer extends CellRenderer {
    getControlBounds(state) {
      // Defines the position of the folding icon
      if (state.control != null) {
        const oldScale = state.control.scale;
        const w = state.control.bounds.width / oldScale;
        const h = state.control.bounds.height / oldScale;
        const s = state.view.scale;

        return new Rectangle(
          state.x + state.width / 2 - (w / 2) * s,
          state.y + state.height + TreeNodeShape.segment * s - (h / 2) * s,
          w * s,
          h * s
        );
      }
      return null;
    }
  }

  // Make the layout instance accessible by MyCustomGraph
  let layout;

  class MyCustomGraph extends Graph {
    // Sets the collapse and expand icons. The values below are the default
    // values, but this is how to replace them if you need to.
    collapsedImage = new ImageBox(`${Client.imageBasePath}/collapsed.gif`, 9, 9);

    expandedImage = new ImageBox(`${Client.imageBasePath}/expanded.gif`, 9, 9);

    isCellFoldable(cell) {
      // Defines the condition for showing the folding icon
      return this.getOutgoingEdges(cell).length > 0;
    }

    createCellRenderer() {
      return new MyCustomCellRenderer();
    }

    createGraphView() {
      return new MyCustomGraphView(this);
    }

    foldCells(collapse, recurse, cells) {
      // Implements the click on a folding icon
      this.model.beginUpdate();
      try {
        this.toggleSubtree(this, cells[0], !collapse);
        this.model.setCollapsed(cells[0], collapse);

        // Executes the layout for the new graph since
        // changes to visiblity and collapsed state do
        // not trigger a layout in the current manager.
        layout.execute(this.getDefaultParent());
      } finally {
        this.model.endUpdate();
      }
    }

    toggleSubtree(cell, show) {
      // Updates the visible state of a given subtree taking into
      // account the collapsed state of the traversed branches
      show = show != null ? show : true;
      const cells = [];

      this.traverse(cell, true, function (vertex) {
        if (vertex !== cell) {
          cells.push(vertex);
        }

        // Stops recursion if a collapsed cell is seen
        return vertex === cell || !this.isCellCollapsed(vertex);
      });

      this.toggleCells(show, cells, true);
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);

  // Disallow any selections
  graph.setCellsSelectable(false);

  // Avoids overlap of edges and collapse icons
  graph.keepEdgesInBackground = true;

  // Set some stylesheet options for the visual appearance
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = 'treenode';
  style.gradientColor = 'white';
  style.shadow = true;

  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edge = EdgeStyle.TopToBottom;
  style.rounded = true;

  // Enables automatic sizing for vertices after editing and
  // panning by using the left mouse button.
  graph.setAutoSizeCells(true);
  graph.setPanning(true);

  const panningHandler = graph.getPlugin('PanningHandler');
  panningHandler.useLeftButtonForPanning = true;

  // Stops editing on enter or escape keypress
  const keyHandler = new KeyHandler(graph);

  // Enables automatic layout on the graph and installs
  // a tree layout for all groups who's children are
  // being changed, added or removed.
  layout = new CompactTreeLayout(graph, false);
  layout.useBoundingBox = false;
  layout.edgeRouting = false;
  layout.levelDistance = 30;
  layout.nodeDistance = 10;

  const layoutMgr = new LayoutManager(graph);

  layoutMgr.getLayout = function (cell) {
    if (cell.getChildCount() > 0) {
      return layout;
    }
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds the root vertex of the tree
  graph.batchUpdate(() => {
    const w = graph.container.offsetWidth;
    const root = graph.insertVertex(parent, 'treeRoot', 'Root', w / 2 - 30, 20, 60, 40);

    const v1 = graph.insertVertex(parent, 'v1', 'Child 1', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', root, v1);

    const v2 = graph.insertVertex(parent, 'v2', 'Child 2', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', root, v2);

    const v3 = graph.insertVertex(parent, 'v3', 'Child 3', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', root, v3);

    const v11 = graph.insertVertex(parent, 'v11', 'Child 1.1', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', v1, v11);

    const v12 = graph.insertVertex(parent, 'v12', 'Child 1.2', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', v1, v12);

    const v21 = graph.insertVertex(parent, 'v21', 'Child 2.1', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', v2, v21);

    const v22 = graph.insertVertex(parent, 'v22', 'Child 2.2', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', v2, v22);

    const v221 = graph.insertVertex(parent, 'v221', 'Child 2.2.1', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', v22, v221);

    const v222 = graph.insertVertex(parent, 'v222', 'Child 2.2.2', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', v22, v222);

    const v31 = graph.insertVertex(parent, 'v31', 'Child 3.1', 0, 0, 60, 40);
    graph.insertEdge(parent, null, '', v3, v31);
  });

  return container;
};

export const Default = Template.bind({});
