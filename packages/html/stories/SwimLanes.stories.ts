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
  type ConnectionHandler,
  ImageBox,
  Perimeter,
  Point,
  constants,
  cloneUtils,
  InternalEvent,
  SwimlaneManager,
  StackLayout,
  LayoutManager,
  Graph,
  type Cell,
  type EdgeParameters,
  type EventObject,
  type SelectionHandler,
  type VertexParameters,
  Client,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import {
  configureExpandedAndCollapsedImages,
  configureImagesBasePath,
  createGraphContainer,
} from './shared/configure.js';

export default {
  title: 'Layouts/SwimLanes',
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
  container.style.background = ''; // no grid

  InternalEvent.disableContextMenu(container);

  // Creates a wrapper editor around a new graph inside
  // the given container using an XML config for the
  // keyboard bindings
  // const config = utils
  //   .load('editors/config/keyhandler-commons.xml')
  //   .getDocumentElement();
  // const editor = new Editor(config);
  // const editor = new Editor(null);
  // editor.setGraphContainer(container);
  // const { graph } = editor;
  type CustomGraph = Graph & {
    isPool(cell: Cell | null): boolean;
  };

  const graph = new Graph(container);
  const model = graph.getDataModel();

  // Auto-resizes the container
  graph.border = 80;
  graph.getView().translate = new Point(graph.border / 2, graph.border / 2);
  graph.setResizeContainer(true);
  configureExpandedAndCollapsedImages(graph);

  const graphHandler = graph.getPlugin('SelectionHandler') as SelectionHandler;
  graphHandler.setRemoveCellsFromParent(false);

  // Defines an icon for creating new connections in the connection handler.
  // This will automatically disable the highlighting of the source vertex.
  const connectionHandler = graph.getPlugin('ConnectionHandler') as ConnectionHandler;
  connectionHandler.connectImage = new ImageBox(
    `${Client.imageBasePath}/connector.gif`,
    16,
    16
  );

  // Changes the default vertex style in-place
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = constants.SHAPE.SWIMLANE;
  style.verticalAlign = 'middle';
  style.labelBackgroundColor = 'white';
  style.fontSize = 11;
  style.startSize = 22;
  style.horizontal = false;
  style.fontColor = 'black';
  style.strokeColor = 'black';
  delete style.fillColor;
  style.foldable = true;

  style = cloneUtils.clone(style);
  style.shape = constants.SHAPE.RECTANGLE;
  style.fontSize = 10;
  style.rounded = true;
  style.horizontal = true;
  style.verticalAlign = 'middle';
  delete style.startSize;
  style.labelBackgroundColor = 'none';
  graph.getStylesheet().putCellStyle('process', style);

  style = cloneUtils.clone(style);
  style.shape = constants.SHAPE.ELLIPSE;
  style.perimeter = Perimeter.EllipsePerimeter;
  delete style.rounded;
  graph.getStylesheet().putCellStyle('state', style);

  style = cloneUtils.clone(style);
  style.shape = constants.SHAPE.RHOMBUS;
  style.perimeter = Perimeter.RhombusPerimeter;
  style.verticalAlign = 'top';
  style.spacingTop = 40;
  style.spacingRight = 64;
  graph.getStylesheet().putCellStyle('condition', style);

  style = cloneUtils.clone(style);
  style.shape = constants.SHAPE.DOUBLE_ELLIPSE;
  style.perimeter = Perimeter.EllipsePerimeter;
  style.spacingTop = 28;
  style.fontSize = 14;
  style.fontStyle = 1;
  delete style.spacingRight;
  graph.getStylesheet().putCellStyle('end', style);

  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edgeStyle = constants.EDGESTYLE.ELBOW;
  style.endArrow = constants.ARROW.BLOCK;
  style.rounded = true;
  style.fontColor = 'black';
  style.strokeColor = 'black';

  style = cloneUtils.clone(style);
  style.dashed = true;
  style.endArrow = constants.ARROW.OPEN;
  style.startArrow = constants.ARROW.OVAL;
  graph.getStylesheet().putCellStyle('crossover', style);

  // Installs double click on middle control point and
  // changes style of edges between empty and this value
  graph.alternateEdgeStyle = { elbow: 'vertical' };

  // Adds automatic layout and various switches if the
  // graph is enabled
  if (graph.isEnabled()) {
    // Allows new connections but no dangling edges
    graph.setConnectable(true);
    graph.setAllowDanglingEdges(false);

    // End-states are no valid sources
    const previousIsValidSource = graph.isValidSource;
    graph.isValidSource = function (cell) {
      if (previousIsValidSource.apply(this, [cell]) && cell) {
        const style = cell.getStyle();
        return style == null || !style.baseStyleNames?.includes('end');
      }
      return false;
    };

    // Start-states are no valid targets, we do not
    // perform a call to the superclass function because
    // this would call isValidSource
    // Note: All states are start states in
    // the example below, so we use the state
    // style below
    graph.isValidTarget = function (cell) {
      if (!cell) return false;
      const style = cell.getStyle();
      return (
        !cell.isEdge() &&
        !this.isSwimlane(cell) &&
        (style == null || !!style.baseStyleNames?.includes('state'))
      );
    };

    // Allows dropping cells into new lanes and
    // lanes into new pools, but disallows dropping
    // cells on edges to split edges
    graph.setDropEnabled(true);
    graph.setSplitEnabled(false);

    // Returns true for valid drop operations
    graph.isValidDropTarget = function (this: CustomGraph, target, cells, evt) {
      if (this.isSplitEnabled() && this.isSplitTarget(target, cells, evt)) {
        return true;
      }

      let lane = false;
      let pool = false;
      let cell = false;

      // Checks if any lanes or pools are selected
      cells ??= [];
      for (let i = 0; i < cells.length; i++) {
        const tmp = cells[i].getParent();
        lane = lane || this.isPool(tmp);
        pool = pool || this.isPool(cells[i]);

        cell = cell || !(lane || pool);
      }

      return (
        !pool &&
        cell != lane &&
        ((lane && this.isPool(target)) || (cell && this.isPool(target.getParent())))
      );
    };

    // Adds new method for identifying a pool
    (graph as CustomGraph).isPool = function (cell: Cell | null) {
      const model = this.getDataModel();
      const parent = cell?.getParent();

      return parent?.getParent() == model.getRoot();
    };

    // Keeps widths on collapse/expand
    const foldingHandler = function (_sender: any, evt: EventObject) {
      const cells = evt.getProperty('cells');

      for (let i = 0; i < cells.length; i++) {
        const geo = cells[i].getGeometry();

        if (geo.alternateBounds != null) {
          geo.width = geo.alternateBounds.width;
        }
      }
    };

    graph.addListener(InternalEvent.FOLD_CELLS, foldingHandler);
  }

  // Changes swimlane orientation while collapsed
  const getStyle = function (this: Cell) {
    if (!this.isCollapsed()) {
      return this.style;
    }
    // Need to create a copy the original style as we don't want to change the original style stored in the Cell
    // Otherwise, when expanding the cell, the style will be incorrect
    const style = { ...this.style };
    style.horizontal = true;
    style.align = 'left';
    style.spacingLeft = 14;
    return style;
  };

  // Applies size changes to siblings and parents
  new SwimlaneManager(graph);

  // Creates a stack depending on the orientation of the swimlane
  const layout = new StackLayout(graph, false);

  // Makes sure all children fit into the parent swimlane
  layout.resizeParent = true;

  // Applies the size to children if parent size changes
  layout.fill = true;

  // Only update the size of swimlanes
  layout.isVertexIgnored = function (vertex) {
    return !graph.isSwimlane(vertex);
  };

  // Keeps the lanes and pools stacked
  const layoutMgr = new LayoutManager(graph);

  layoutMgr.getLayout = function (cell) {
    if (
      cell &&
      !cell.isEdge() &&
      cell.getChildCount() > 0 &&
      (cell.getParent() == model.getRoot() || (graph as CustomGraph).isPool(cell))
    ) {
      layout.fill = (graph as CustomGraph).isPool(cell);

      return layout;
    }

    return null;
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  const insertVertex = (options: VertexParameters) => {
    const v = graph.insertVertex(options);
    v.getStyle = getStyle;
    return v;
  };

  const insertEdge = (options: EdgeParameters) => {
    const e = graph.insertEdge(options);
    e.getStyle = getStyle;
    return e;
  };

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const pool1 = insertVertex({
      parent,
      value: 'Pool 1',
      position: [0, 0],
      size: [640, 0],
    });
    pool1.setConnectable(false);

    const lane1a = insertVertex({
      parent: pool1,
      value: 'Lane A',
      position: [0, 0],
      size: [640, 110],
    });
    lane1a.setConnectable(false);

    const lane1b = insertVertex({
      parent: pool1,
      value: 'Lane B',
      position: [0, 0],
      size: [640, 110],
    });
    lane1b.setConnectable(false);

    const pool2 = insertVertex({
      parent,
      value: 'Pool 2',
      position: [0, 0],
      size: [640, 0],
    });
    pool2.setConnectable(false);

    const lane2a = insertVertex({
      parent: pool2,
      value: 'Lane A',
      position: [0, 0],
      size: [640, 140],
    });
    lane2a.setConnectable(false);

    const lane2b = insertVertex({
      parent: pool2,
      value: 'Lane B',
      position: [0, 0],
      size: [640, 110],
    });
    lane2b.setConnectable(false);

    const start1 = insertVertex({
      parent: lane1a,
      position: [40, 40],
      size: [30, 30],
      style: { baseStyleNames: ['state'] },
    });
    const end1 = insertVertex({
      parent: lane1a,
      value: 'A',
      position: [560, 40],
      size: [30, 30],
      style: { baseStyleNames: ['end'] },
    });

    const step1 = insertVertex({
      parent: lane1a,
      value: 'Contact\nProvider',
      position: [90, 30],
      size: [80, 50],
      style: { baseStyleNames: ['process'] },
    });
    const step11 = insertVertex({
      parent: lane1a,
      value: 'Complete\nAppropriate\nRequest',
      position: [190, 30],
      size: [80, 50],
      style: { baseStyleNames: ['process'] },
    });
    const step111 = insertVertex({
      parent: lane1a,
      value: 'Receive and\nAcknowledge',
      position: [385, 30],
      size: [80, 50],
      style: { baseStyleNames: ['process'] },
    });

    const start2 = insertVertex({
      parent: lane2b,
      position: [40, 40],
      size: [30, 30],
      style: { baseStyleNames: ['state'] },
    });

    const step2 = insertVertex({
      parent: lane2b,
      value: 'Receive\nRequest',
      position: [90, 30],
      size: [80, 50],
      style: { baseStyleNames: ['process'] },
    });
    const step22 = insertVertex({
      parent: lane2b,
      value: 'Refer to Tap\nSystems\nCoordinator',
      position: [190, 30],
      size: [80, 50],
      style: { baseStyleNames: ['process'] },
    });

    const step3 = insertVertex({
      parent: lane1b,
      value: 'Request 1st-\nGate\nInformation',
      position: [190, 30],
      size: [80, 50],
      style: { baseStyleNames: ['process'] },
    });
    const step33 = insertVertex({
      parent: lane1b,
      value: 'Receive 1st-\nGate\nInformation',
      position: [290, 30],
      size: [80, 50],
      style: { baseStyleNames: ['process'] },
    });

    const step4 = insertVertex({
      parent: lane2a,
      value: 'Receive and\nAcknowledge',
      position: [290, 20],
      size: [80, 50],
      style: { baseStyleNames: ['process'] },
    });
    const step44 = insertVertex({
      parent: lane2a,
      value: 'Contract\nConstraints?',
      position: [400, 20],
      size: [50, 50],
      style: { baseStyleNames: ['condition'] },
    });
    const step444 = insertVertex({
      parent: lane2a,
      value: 'Tap for gas\ndelivery?',
      position: [480, 20],
      size: [50, 50],
      style: { baseStyleNames: ['condition'] },
    });

    const end2 = insertVertex({
      parent: lane2a,
      value: 'B',
      position: [560, 30],
      size: [30, 30],
      style: { baseStyleNames: ['end'] },
    });
    const end3 = insertVertex({
      parent: lane2a,
      value: 'C',
      position: [560, 84],
      size: [30, 30],
      style: { baseStyleNames: ['end'] },
    });

    insertEdge({
      parent: lane1a,
      source: start1,
      target: step1,
    });
    insertEdge({
      parent: lane1a,
      source: step1,
      target: step11,
    });
    insertEdge({
      parent: lane1a,
      source: step11,
      target: step111,
    });

    insertEdge({
      parent: lane2b,
      source: start2,
      target: step2,
    });
    insertEdge({
      parent: lane2b,
      source: step2,
      target: step22,
    });
    insertEdge({
      parent,
      source: step22,
      target: step3,
    });

    insertEdge({
      parent: lane1b,
      source: step3,
      target: step33,
    });
    insertEdge({
      parent: lane2a,
      source: step4,
      target: step44,
    });
    insertEdge({
      parent: lane2a,
      value: 'No',
      source: step44,
      target: step444,
      style: { verticalAlign: 'bottom' },
    });
    insertEdge({
      parent,
      value: 'Yes',
      source: step44,
      target: step111,
      style: {
        verticalAlign: 'bottom',
        horizontal: false,
        labelBackgroundColor: 'white',
      },
    });

    insertEdge({
      parent: lane2a,
      value: 'Yes',
      source: step444,
      target: end2,
      style: { verticalAlign: 'bottom' },
    });
    let e = insertEdge({
      parent: lane2a,
      value: 'No',
      source: step444,
      target: end3,
      style: { verticalAlign: 'top' },
    });

    e.geometry!.points = [
      new Point(
        step444.geometry!.x + step444.geometry!.width / 2,
        end3.geometry!.y + end3.geometry!.height / 2
      ),
    ];

    insertEdge({
      parent,
      source: step1,
      target: step2,
      style: { baseStyleNames: ['crossover'] },
    });
    insertEdge({
      parent,
      source: step3,
      target: step11,
      style: { baseStyleNames: ['crossover'] },
    });
    e = insertEdge({
      parent: lane1a,
      source: step11,
      target: step33,
      style: { baseStyleNames: ['crossover'] },
    });

    e.geometry!.points = [
      new Point(
        step33.geometry!.x + step33.geometry!.width / 2 + 20,
        step11.geometry!.y + (step11.geometry!.height * 4) / 5
      ),
    ];

    insertEdge({
      parent,
      source: step33,
      target: step4,
    });
    insertEdge({
      parent: lane1a,
      source: step111,
      target: end1,
    });
  });

  return container;
};

export const Default = Template.bind({});
