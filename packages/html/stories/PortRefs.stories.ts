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
  type Cell,
  type CellStyle,
  CellEditorHandler,
  CellRenderer,
  type CellState,
  ConnectionHandler,
  Graph,
  type GraphPluginConstructor,
  RubberBandHandler,
  Point,
  EdgeHandler,
  ConstraintHandler,
  ImageBox,
  SelectionHandler,
  SelectionCellsHandler,
  type Shape,
  ConnectionConstraint,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import {
  configureImagesBasePath,
  createGraphContainer,
  createMainDiv,
} from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Connections/PortRefs',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  // Type definitions for port configuration
  interface PortDefinition {
    x: number;
    y: number;
    perimeter: boolean;
    constraint: string;
  }

  type PortsKey = 'w' | 'e' | 'n' | 's' | 'nw' | 'ne' | 'sw' | 'se';
  type Ports2Key = 'in1' | 'in2' | 'in3' | 'in4' | 'in5' | 'out1' | 'out2' | 'out3';

  interface PortsDefinitions {
    ports: Record<PortsKey, PortDefinition>;
    ports2: Record<Ports2Key, PortDefinition>;
  }

  interface ShapeWithPorts extends Shape {
    getPorts?(): Record<string, PortDefinition>;
  }

  // Store ports definitions for access by custom renderer
  // Ports are equal for all shapes...
  // NOTE: Constraint is used later for orthogonal edge routing (currently ignored)
  const PORTS_DEFS: PortsDefinitions = {
    ports: {
      w: { x: 0, y: 0.5, perimeter: true, constraint: 'west' },
      e: { x: 1, y: 0.5, perimeter: true, constraint: 'east' },
      n: { x: 0.5, y: 0, perimeter: true, constraint: 'north' },
      s: { x: 0.5, y: 1, perimeter: true, constraint: 'south' },
      nw: { x: 0, y: 0, perimeter: true, constraint: 'north west' },
      ne: { x: 1, y: 0, perimeter: true, constraint: 'north east' },
      sw: { x: 0, y: 1, perimeter: true, constraint: 'south west' },
      se: { x: 1, y: 1, perimeter: true, constraint: 'south east' },
    },
    // ... except for triangles
    // NOTE: Constraint is used later for orthogonal edge routing (currently ignored)
    ports2: {
      in1: { x: 0, y: 0, perimeter: true, constraint: 'west' },
      in2: { x: 0, y: 0.25, perimeter: true, constraint: 'west' },
      in3: { x: 0, y: 0.5, perimeter: true, constraint: 'west' },
      in4: { x: 0, y: 0.75, perimeter: true, constraint: 'west' },
      in5: { x: 0, y: 1, perimeter: true, constraint: 'west' },
      out1: { x: 1, y: 0, perimeter: true, constraint: 'north east' },
      out2: { x: 1, y: 0.5, perimeter: true, constraint: 'east' },
      out3: { x: 0.5, y: 1, perimeter: true, constraint: 'south east' },
    },
  };

  class PortRefsCellRenderer extends CellRenderer {
    override createShape(state: CellState): Shape {
      const shape = super.createShape(state) as ShapeWithPorts;

      // Inject getPorts based on cell style
      const portsKey = (state.style as Record<string, any>)['ports'];
      if (portsKey && portsKey in PORTS_DEFS) {
        const portsDef = PORTS_DEFS[portsKey as keyof typeof PORTS_DEFS];
        shape.getPorts = () => portsDef;
      }

      return shape;
    }
  }

  class PortRefsGraph extends Graph {
    override createCellRenderer(): CellRenderer {
      return new PortRefsCellRenderer();
    }
  }

  configureImagesBasePath();
  const div =
    createMainDiv(`This example demonstrates referencing connection points by ID. The main difference to the
  implementation where the connection point is stored in the connecting edge is that changes to the original port will
  be reflected in all existing connections since they reference that port.
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

  class MyCustomConstraintHandler extends ConstraintHandler {
    constructor(graph: AbstractGraph) {
      super(graph);
      // Replaces the port image
      this.pointImage = new ImageBox('./images/dot.gif', 10, 10);
    }
  }

  class MyCustomConnectionHandler extends ConnectionHandler {
    override createConstraintHandler() {
      return new MyCustomConstraintHandler(this.graph);
    }
  }

  const plugins: GraphPluginConstructor[] = [
    CellEditorHandler,
    SelectionCellsHandler,
    MyCustomConnectionHandler,
    SelectionHandler,
  ];
  // Adds rubberband selection
  if (args.rubberBand) plugins.push(RubberBandHandler);

  const graph = new PortRefsGraph(container, undefined, plugins);
  graph.setConnectable(true);

  // Disables automatic handling of ports. This disables the reset of the
  // respective style in Graph.cellConnected. Note that this feature may
  // be useful if floating and fixed connections are combined.
  graph.setPortsEnabled(false);

  const connectionHandler = graph.getPlugin<ConnectionHandler>('ConnectionHandler')!;

  // Disables floating connections (only connections via ports allowed)
  connectionHandler.isConnectableCell = function () {
    return false;
  };

  class CustomEdgeHandler extends EdgeHandler {
    protected override createConstraintHandler(): ConstraintHandler {
      return new MyCustomConstraintHandler(this.graph);
    }

    override isConnectableCell(cell: Cell) {
      return connectionHandler.isConnectableCell(cell);
    }
  }

  const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>(
    'SelectionCellsHandler'
  )!; // we know that this plugin is always available
  selectionCellsHandler.setEdgeHandlerFactory('default', (state) => {
    return new CustomEdgeHandler(state);
  });

  // Disables existing port functionality
  graph.view.getTerminalPort = function (_state, terminal) {
    return terminal;
  };

  // Returns all possible ports for a given terminal
  graph.getAllConnectionConstraints = function (terminal) {
    // for stencils with existing constraints...
    if (terminal?.shape?.stencil) {
      return terminal.shape.stencil.constraints;
    }

    const portsDef = terminal?.cell.isVertex()
      ? (terminal.shape as ShapeWithPorts | null)?.getPorts?.()
      : undefined;
    if (portsDef) {
      return Object.entries(portsDef).map(
        ([id, port]) =>
          new ConnectionConstraint(new Point(port.x, port.y), port.perimeter, id)
      );
    }

    return null;
  };

  // Sets the port for the given connection
  graph.setConnectionConstraint = function (edge, _terminal, source, constraint) {
    if (constraint) {
      const key = source ? 'sourcePort' : 'targetPort';
      this.setCellStyles(key, constraint.name ?? null, [edge]);
    }
  };

  // Returns the port for the given connection
  graph.getConnectionConstraint = function (edge, _terminal, source) {
    const key = source ? 'sourcePort' : 'targetPort';
    const id = edge.style[key];

    if (id != null) {
      return new ConnectionConstraint(null, undefined, id);
    }

    // TODO the API should be updated to declare it can return null. All client code check if the returned value is not null
    return null!;
  };

  // Returns the actual point for a port by redirecting the constraint to the port
  const graphGetConnectionPoint = graph.getConnectionPoint;
  graph.getConnectionPoint = function (vertex, constraint) {
    const port = constraint.name
      ? (vertex?.shape as ShapeWithPorts | null)?.getPorts?.()?.[constraint.name]
      : undefined;
    if (port) {
      constraint = new ConnectionConstraint(new Point(port.x, port.y), port.perimeter);
    }

    return graphGetConnectionPoint.apply(this, [vertex, constraint]);
  };

  // In an application, you would typically use module augmentation to add the ports property to CellStateStyle
  // Here we don't do that to prevent leaking this change to other stories
  interface PortRefsCellStyle extends CellStyle {
    ports?: string;
  }

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      value: 'A',
      position: [20, 20],
      size: [100, 40],
      style: { ports: 'ports' } as PortRefsCellStyle,
    });
    const v2 = graph.insertVertex({
      value: 'B',
      position: [80, 100],
      size: [100, 100],
      style: {
        shape: 'ellipse',
        perimeter: 'ellipsePerimeter',
        ports: 'ports',
      } as PortRefsCellStyle,
    });
    const v3 = graph.insertVertex({
      value: 'C',
      position: [190, 30],
      size: [100, 60],
      style: {
        shape: 'triangle',
        perimeter: 'trianglePerimeter',
        direction: 'south',
        ports: 'ports2',
      } as PortRefsCellStyle,
    });
    graph.insertEdge({
      source: v1,
      target: v2,
      style: { sourcePort: 's', targetPort: 'nw' },
    });
    graph.insertEdge({
      source: v1,
      target: v3,
      style: { sourcePort: 'e', targetPort: 'out3' },
    });
  });

  // Comming soon... Integration with orthogonal edge style
  // Sets default edge style to use port constraints (needs to be moved up when uncommented)
  // graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';
  /* let mxUtilsGetPortConstraints = utils.getPortConstraints;
    utils.getPortConstraints = function(terminal, edge, source, defaultValue)
    {
      let key = (source) ? constants.STYLE_SOURCE_PORT : constants.STYLE_TARGET_PORT;
      let id = edge.style[key];

      let port = terminal.shape.getPorts()[id];

      // TODO: Add support for rotation, direction
      if (port != null)
      {
        return port.constraint;
      }

      return mxUtilsGetPortConstraints.apply(this, arguments);
    };
    // Connect preview
    graph.getPlugin('ConnectionHandler').createEdgeState = function(me)
    {
      let edge = graph.createEdge(null, null, null, null, null);

      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
    };
    */

  return div;
};

export const Default = Template.bind({});
