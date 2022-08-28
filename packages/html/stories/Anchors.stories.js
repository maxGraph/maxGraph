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
  InternalEvent,
  RubberBandHandler,
  ConnectionHandler,
  ConnectionConstraint,
  Geometry,
  PolylineShape,
  Point,
  CellState,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

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
  Client.setImageBasePath('/images');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  class MyCustomConnectionHandler extends ConnectionHandler {
    // Enables connect preview for the default edge style
    createEdgeState(me) {
      const edge = graph.createEdge(null, null, null, null, null);
      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
    }
  }

  class MyCustomGraph extends Graph {
    getAllConnectionConstraints(terminal, source) {
      // Overridden to define per-geometry connection points
      if (terminal && terminal.cell) {
        if (terminal.shape.stencil) {
          if (terminal.shape.stencil.constraints) {
            return terminal.shape.stencil.constraints;
          }
        } else if (terminal.cell.geometry.constraints) {
          return terminal.cell.geometry.constraints;
        }
      }

      return null;
    }

    createConnectionHandler() {
      return new MyCustomConnectionHandler(this);
    }
  }

  class MyCustomGeometryClass extends Geometry {
    // Defines the default constraints for the vertices
    constraints = [
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
  }

  // Edges have no connection points
  PolylineShape.prototype.constraints = null;

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  graph.setConnectable(true);

  // Specifies the default edge style
  graph.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle';

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
      geometryClass: MyCustomGeometryClass,
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
      geometryClass: MyCustomGeometryClass,
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
