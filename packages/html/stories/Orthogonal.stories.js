import {
  Graph,
  RubberBandHandler,
  ConnectionHandler,
  SelectionHandler,
  Guide,
  Point,
  CellState,
  EdgeHandler,
  GraphView,
  InternalEvent,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Connections/Orthogonal',
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

  // Enables guides
  SelectionHandler.prototype.guidesEnabled = true;

  // Alt disables guides
  Guide.prototype.isEnabledForEvent = function (evt) {
    return !InternalEvent.isAltDown(evt);
  };

  // Enables snapping waypoints to terminals
  EdgeHandler.prototype.snapToTerminals = true;

  // Enables orthogonal connect preview in IE
  ConnectionHandler.prototype.movePreviewAway = false;

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.disconnectOnMove = false;
  graph.foldingEnabled = false;
  graph.cellsResizable = false;
  graph.extendParents = false;
  graph.setConnectable(true);

  // Implements perimeter-less connection points as fixed points (computed before the edge style).
  graph.view.updateFixedTerminalPoint = function (edge, terminal, source, constraint) {
    GraphView.prototype.updateFixedTerminalPoint.apply(this, arguments);

    const pts = edge.absolutePoints;
    const pt = pts[source ? 0 : pts.length - 1];

    if (terminal != null && pt == null && this.getPerimeterFunction(terminal) == null) {
      edge.setAbsoluteTerminalPoint(
        new Point(this.getRoutingCenterX(terminal), this.getRoutingCenterY(terminal)),
        source
      );
    }
  };

  // Changes the default edge style
  graph.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle';
  delete graph.getStylesheet().getDefaultEdgeStyle().endArrow;

  const connectionHandler = graph.getPlugin('ConnectionHandler');

  // Implements the connect preview
  connectionHandler.createEdgeState = function (me) {
    const edge = graph.createEdge(null, null, null, null, null);

    return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
  };

  // Uncomment the following if you want the container
  // to fit the size of the graph
  // graph.setResizeContainer(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, '', 40, 40, 40, 30);
    v1.setConnectable(false);
    const v11 = graph.insertVertex(
      v1,
      null,
      '',
      0.5,
      0,
      10,
      40,
      { portConstraint: 'northsouth' },
      true
    );
    v11.geometry.offset = new Point(-5, -5);
    const v12 = graph.insertVertex(
      v1,
      null,
      '',
      0,
      0.5,
      10,
      10,
      {
        portConstraint: 'west',
        shape: 'triangle',
        direction: 'west',
        perimeter: 'none',
        routingCenterX: -0.5,
        routingCenterY: 0,
      },
      true
    );
    v12.geometry.offset = new Point(-10, -5);
    const v13 = graph.insertVertex(
      v1,
      null,
      '',
      1,
      0.5,
      10,
      10,
      {
        portConstraint: 'east',
        shape: 'triangle',
        direction: 'east',
        perimeter: 'none',
        routingCenterX: 0.5,
        routingCenterY: 0,
      },
      true
    );
    v13.geometry.offset = new Point(0, -5);

    const v2 = graph.addCell(graph.getDataModel().cloneCell(v1));
    v2.geometry.x = 200;
    v2.geometry.y = 60;

    const v3 = graph.addCell(graph.getDataModel().cloneCell(v1));
    v3.geometry.x = 40;
    v3.geometry.y = 150;

    const v4 = graph.addCell(graph.getDataModel().cloneCell(v1));
    v4.geometry.x = 200;
    v4.geometry.y = 170;

    graph.insertEdge(parent, null, '', v1.getChildAt(2), v2.getChildAt(1));
    graph.insertEdge(parent, null, '', v2.getChildAt(2), v3.getChildAt(1));
    graph.insertEdge(parent, null, '', v3.getChildAt(2), v4.getChildAt(1));
  });

  return container;
};

export const Default = Template.bind({});
