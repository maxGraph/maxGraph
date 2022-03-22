import {
  Graph,
  InternalEvent,
  RubberBandHandler,
  ConnectionHandler,
  ConnectionConstraint,
  Shape,
  PolylineShape,
  Point,
  CellState,
  Client
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

import SelectionCellsHandler from '../../core/src/view/handler/SelectionCellsHandler';

import SelectionHandler from '../../core/src/view/handler/SelectionHandler';
import PanningHandler from '../../core/src/view/handler/PanningHandler';
import PopupMenuHandler from '../../core/src/view/handler/PopupMenuHandler';
import CellEditorHandler from '../../core/src/view/handler/CellEditorHandler';
import TooltipHandler from '../../core/src/view/handler/TooltipHandler';


export default {
  title: 'Connections/Anchors',
  argTypes: {
    ...globalTypes,
    rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },
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

  Client.imageBasePath = '../../../images'
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  class MyCustomConnectionHandler extends ConnectionHandler {
    // Enables connect preview for the default edge style
    createEdgeState(me) {
      const edge = graph.createEdge(null, null, null, null, null);
      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
    }    
  }

    // Defines the default constraints for the vertices
    Shape.prototype.constraints = [
      new ConnectionConstraint(new Point(0.25, 0), true),
      new ConnectionConstraint(new Point(0.5, 0), true),
      new ConnectionConstraint(new Point(0.75, 0), true),
      new ConnectionConstraint(new Point(0, 0.25), true),
      new ConnectionConstraint(new Point(0, 0.5), true),
      new ConnectionConstraint(new Point(0, 0.75), true),
      new ConnectionConstraint(new Point(1, 0.25), true),
      new ConnectionConstraint(new Point(1, 0.5), true),
      new ConnectionConstraint(new Point(1, 0.75), true),
      new ConnectionConstraint(new Point(0.25, 1), true),
      new ConnectionConstraint(new Point(0.5, 1), true),
      new ConnectionConstraint(new Point(0.75, 1), true),
    ];
  class MyCustomGraph extends Graph {
    getAllConnectionConstraints(terminal, source) {
      // Overridden to define per-shape connection points
      if (terminal != null && terminal.shape != null) {
        if (terminal.shape.stencil != null) {
          if (terminal.shape.stencil.constraints != null) {
            return terminal.shape.stencil.constraints;
          }
        } else if (terminal.shape.constraints != null) {
          return terminal.shape.constraints;
        }
      }
      return null;
    }

    createConnectionHandler() {
      return new MyCustomConnectionHandler(this);
    }
  }

  const plugins = [
    CellEditorHandler,
    TooltipHandler,
    SelectionCellsHandler,
    PopupMenuHandler,
    MyCustomConnectionHandler,
    SelectionHandler,
    PanningHandler,
  ];
  
  // Edges have no connection points
  PolylineShape.prototype.constraints = null;

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container, null, plugins);
  graph.setConnectable(true);

  // Specifies the default edge style
  graph.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle';
  graph.getStylesheet().getDefaultEdgeStyle().bendable = true;



  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [20, 20],
      size: [80, 30],
//      geometryClass: MyCustomGeometryClass,
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
//      geometryClass: MyCustomGeometryClass,
    });
    const e1 = graph.insertEdge({
      parent,
      value: '',
      source: v1,
      target: v2,
    });
  });

  return container;
};

export const Default = Template.bind({});
