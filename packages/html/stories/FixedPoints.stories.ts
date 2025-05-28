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
  type Cell,
  CellEditorHandler,
  CellState,
  ConnectionConstraint,
  ConnectionHandler,
  ConstraintHandler,
  type EdgeStyleFunction,
  ElbowEdgeHandler,
  Graph,
  type GraphPluginConstructor,
  type ImageShape,
  type InternalMouseEvent,
  mathUtils,
  Point,
  type Rectangle,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
} from '@maxgraph/core';

import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Connections/FixedPoints',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ ...args }: Record<string, any>) => {
  configureImagesBasePath();
  const container = createGraphContainer(args);

  class MyCustomConstraintHandler extends ConstraintHandler {
    // Snaps to fixed points
    override intersects(
      icon: ImageShape,
      rectangle: Rectangle,
      source: boolean,
      existingEdge: boolean
    ) {
      return (
        !source ||
        existingEdge ||
        // ignore null icon.bounds as in the implementation of the super class
        mathUtils.intersects(icon.bounds!, rectangle)
      );
    }
  }

  class MyCustomConnectionHandler extends ConnectionHandler {
    protected override createConstraintHandler(): ConstraintHandler {
      return new MyCustomConstraintHandler(this.graph);
    }

    override isConnectableCell(_cell: Cell) {
      return false;
    }

    /*
     * Special case: Snaps source of new connections to fixed points
     * Without a connect preview in connectionHandler.createEdgeState mouseMove
     * and getSourcePerimeterPoint should be overridden by setting sourceConstraint
     * sourceConstraint to null in mouseMove and updating it and returning the
     * nearest point (cp) in getSourcePerimeterPoint (see below)
     */
    override updateEdgeState(pt: Point, constraint: ConnectionConstraint | null) {
      if (pt != null && this.previous != null) {
        // the 2nd parameter is ignored in the custom implementation of Graph used in this story
        const constraints = this.graph.getAllConnectionConstraints(this.previous, true);
        let nearestConstraint = null;
        let dist = null;

        for (const referenceConstraint of constraints ?? []) {
          const cp = this.graph.getConnectionPoint(this.previous, referenceConstraint);

          if (cp != null) {
            const tmp = (cp.x - pt.x) * (cp.x - pt.x) + (cp.y - pt.y) * (cp.y - pt.y);

            if (dist == null || tmp < dist) {
              nearestConstraint = referenceConstraint;
              dist = tmp;
            }
          }
        }

        if (nearestConstraint != null) {
          this.sourceConstraint = nearestConstraint;
        }

        // In case the edge style must be changed during the preview:
        // this.edgeState.style.edgeStyle = 'orthogonalEdgeStyle';
        // And to use the new edge style in the new edge inserted into the graph,
        // update the cell style as follows:
        // this.edgeState.cell.style.edgeStyle =  this.edgeState.style.edgeStyle
      }
      super.updateEdgeState(pt, constraint);
    }

    override createEdgeState(_me: InternalMouseEvent) {
      // Connect preview
      const edge = this.graph.createEdge(null, null!, null, null, null, {
        edgeStyle: 'orthogonalEdgeStyle',
      });

      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
    }
  }

  class CustomElbowEdgeHandler extends ElbowEdgeHandler {
    override createConstraintHandler() {
      return new MyCustomConstraintHandler(this.graph);
    }

    // Disables floating connections (only use with no connect image)
    override isConnectableCell(cell: Cell) {
      return this.graph
        .getPlugin<ConnectionHandler>('ConnectionHandler')!
        .isConnectableCell(cell);
    }
  }

  class MyCustomGraph extends Graph {
    // enforce usage of the CustomElbowEdgeHandler (elbow) for all edges
    // this may not be the best way to do this, let's review it later when implementing https://github.com/maxGraph/maxGraph/pull/823
    override createEdgeHandler(state: CellState, _edgeStyle: EdgeStyleFunction | null) {
      return new CustomElbowEdgeHandler(state);
    }

    override getAllConnectionConstraints = (
      terminal: CellState | null,
      _source: boolean
    ): ConnectionConstraint[] | null => {
      if (terminal != null && terminal.cell.isVertex()) {
        return [
          new ConnectionConstraint(new Point(0, 0), true),
          new ConnectionConstraint(new Point(0.5, 0), true),
          new ConnectionConstraint(new Point(1, 0), true),
          new ConnectionConstraint(new Point(0, 0.5), true),
          new ConnectionConstraint(new Point(1, 0.5), true),
          new ConnectionConstraint(new Point(0, 1), true),
          new ConnectionConstraint(new Point(0.5, 1), true),
          new ConnectionConstraint(new Point(1, 1), true),
        ];
      }
      return null;
    };
  }

  // Creates the graph inside the given container
  const plugins: GraphPluginConstructor[] = [
    CellEditorHandler,
    MyCustomConnectionHandler,
    SelectionCellsHandler,
    SelectionHandler,
  ];
  // Enables rubberband selection
  if (args.rubberBand) plugins.push(RubberBandHandler);

  const graph = new MyCustomGraph(container, undefined, plugins);
  graph.setConnectable(true);

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      value: 'Hello,',
      position: [20, 20],
      size: [80, 60],
      style: {
        shape: 'triangle',
        perimeter: 'trianglePerimeter',
      },
    });
    const v2 = graph.insertVertex({
      value: 'World!',
      position: [200, 150],
      size: [80, 60],
      style: { shape: 'ellipse', perimeter: 'ellipsePerimeter' },
    });
    const v3 = graph.insertVertex({
      value: 'Hello,',
      position: [200, 20],
      size: [80, 30],
    });
    graph.insertEdge({
      value: '',
      source: v1,
      target: v2,
      style: {
        edgeStyle: 'elbowEdgeStyle',
        elbow: 'horizontal',
        exitX: 0.5,
        exitY: 1,
        exitPerimeter: true,
        entryX: 0,
        entryY: 0,
        entryPerimeter: true,
      },
    });
    graph.insertEdge({
      value: '',
      source: v3,
      target: v2,
      style: {
        edgeStyle: 'elbowEdgeStyle',
        elbow: 'horizontal',
        orthogonal: false,
        entryX: 0,
        entryY: 0,
        entryPerimeter: true,
      },
    });
  });

  // Note for the future
  // The following could be enabled with Storybook args to demonstrate a second use-case.

  // Use this code to snap the source point for new connections without a connect preview,
  // ie. without an overridden graph.getPlugin('ConnectionHandler').createEdgeState
  /*
    let mxConnectionHandlerMouseMove = ConnectionHandler.prototype.mouseMove;
    ConnectionHandler.prototype.mouseMove = function(sender, me)
    {
        this.sourceConstraint = null;

        mxConnectionHandlerMouseMove.apply(this, arguments);
    };

    let mxConnectionHandlerGetSourcePerimeterPoint = ConnectionHandler.prototype.getSourcePerimeterPoint;
    ConnectionHandler.prototype.getSourcePerimeterPoint = function(state, pt, me)
    {
        let result = null;

        if (this.previous != null && pt != null)
        {
            let constraints = this.graph.getAllConnectionConstraints(this.previous);
            let nearestConstraint = null;
            let nearest = null;
            let dist = null;

            for (let i = 0; i < constraints.length; i++)
            {
                let cp = this.graph.getConnectionPoint(this.previous, constraints[i]);

                if (cp != null)
                {
                    let tmp = (cp.x - pt.x) * (cp.x - pt.x) + (cp.y - pt.y) * (cp.y - pt.y);

                    if (dist == null || tmp < dist)
                    {
                        nearestConstraint = constraints[i];
                        nearest = cp;
                        dist = tmp;
                    }
                }
            }

            if (nearestConstraint != null)
            {
                this.sourceConstraint = nearestConstraint;
                result = nearest;
            }
        }

        if (result == null)
        {
            result = mxConnectionHandlerGetSourcePerimeterPoint.apply(this, arguments);
        }

        return result;
    };
    */

  return container;
};

export const Default = Template.bind({});
