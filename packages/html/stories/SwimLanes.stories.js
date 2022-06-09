import {
  Editor,
  ConnectionHandler,
  ImageBox,
  Perimeter,
  Point,
  constants,
  cloneUtils,
  EdgeStyle,
  InternalEvent,
  SwimlaneManager,
  StackLayout,
  LayoutManager,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/SwimLanes',
  argTypes: {
    ...globalTypes,
  },
};

const Template = ({ label, ...args }) => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Defines an icon for creating new connections in the connection handler.
  // This will automatically disable the highlighting of the source vertex.
  ConnectionHandler.prototype.connectImage = new ImageBox('images/connector.gif', 16, 16);

  // Creates a wrapper editor around a new graph inside
  // the given container using an XML config for the
  // keyboard bindings
  // const config = utils
  //   .load('editors/config/keyhandler-commons.xml')
  //   .getDocumentElement();
  // const editor = new Editor(config);
  const editor = new Editor(null);
  editor.setGraphContainer(container);
  const { graph } = editor;
  const model = graph.getDataModel();

  // Auto-resizes the container
  graph.border = 80;
  graph.getView().translate = new Point(graph.border / 2, graph.border / 2);
  graph.setResizeContainer(true);

  const graphHandler = graph.getPlugin('SelectionHandler');
  graphHandler.setRemoveCellsFromParent(false);

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
  // delete style.fillColor;

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
  style.perimiter = Perimeter.EllipsePerimeter;
  delete style.rounded;
  graph.getStylesheet().putCellStyle('state', style);

  style = cloneUtils.clone(style);
  style.shape = constants.SHAPE.RHOMBUS;
  style.perimiter = Perimeter.RhombusPerimeter;
  style.verticalAlign = 'top';
  style.spacingTop = 40;
  style.spacingRight = 64;
  graph.getStylesheet().putCellStyle('condition', style);

  style = cloneUtils.clone(style);
  style.shape = constants.SHAPE.DOUBLE_ELLIPSE;
  style.perimiter = Perimeter.EllipsePerimeter;
  style.spacingTop = 28;
  style.fontSize = 14;
  style.fontStyle = 1;
  delete style.spacingRight;
  graph.getStylesheet().putCellStyle('end', style);

  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edge = EdgeStyle.ElbowConnector;
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
  graph.alternateEdgeStyle = 'elbow=vertical';

  // Adds automatic layout and various switches if the
  // graph is enabled
  if (graph.isEnabled()) {
    // Allows new connections but no dangling edges
    graph.setConnectable(true);
    graph.setAllowDanglingEdges(false);

    // End-states are no valid sources
    const previousIsValidSource = graph.isValidSource;

    graph.isValidSource = function (cell) {
      if (previousIsValidSource.apply(this, arguments)) {
        const style = cell.getStyle();

        return style == null || !(style == 'end' || style.indexOf('end') == 0);
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
      const style = cell.getStyle();

      return (
        !cell.isEdge() &&
        !this.isSwimlane(cell) &&
        (style == null || !(style == 'state' || style.indexOf('state') == 0))
      );
    };

    // Allows dropping cells into new lanes and
    // lanes into new pools, but disallows dropping
    // cells on edges to split edges
    graph.setDropEnabled(true);
    graph.setSplitEnabled(false);

    // Returns true for valid drop operations
    graph.isValidDropTarget = function (target, cells, evt) {
      if (this.isSplitEnabled() && this.isSplitTarget(target, cells, evt)) {
        return true;
      }

      const model = this.getDataModel();
      let lane = false;
      let pool = false;
      let cell = false;

      // Checks if any lanes or pools are selected
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
    graph.isPool = function (cell) {
      const model = this.getDataModel();
      const parent = cell.getParent();

      return parent != null && parent.getParent() == model.getRoot();
    };

    // Keeps widths on collapse/expand
    const foldingHandler = function (sender, evt) {
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
  const getStyle = function () {
    // TODO super cannot be used here
    // let style = super.getStyle();
    let style = {};

    if (this.isCollapsed()) {
      style.horizontal = 1;
      style.align = 'left';
      style.spacingLeft = 14;
    }

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
      !cell.isEdge() &&
      cell.getChildCount() > 0 &&
      (cell.getParent() == model.getRoot() || graph.isPool(cell))
    ) {
      layout.fill = graph.isPool(cell);

      return layout;
    }

    return null;
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  const insertVertex = (options) => {
    const v = graph.insertVertex(options);
    v.getStyle = getStyle;
    return v;
  };

  const insertEdge = (options) => {
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

    let e = null;

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
      style: { verticalAlign: 'bottom', horizontal: 0, labelBackgroundColor: 'white' },
    });

    insertEdge({
      parent: lane2a,
      value: 'Yes',
      source: step444,
      target: end2,
      style: { verticalAlign: 'bottom' },
    });
    e = insertEdge({
      parent: lane2a,
      value: 'No',
      source: step444,
      target: end3,
      style: { verticalAlign: 'top' },
    });

    e.geometry.points = [
      new Point(
        step444.geometry.x + step444.geometry.width / 2,
        end3.geometry.y + end3.geometry.height / 2
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

    e.geometry.points = [
      new Point(
        step33.geometry.x + step33.geometry.width / 2 + 20,
        step11.geometry.y + (step11.geometry.height * 4) / 5
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
