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
  Effects,
  Graph,
  GraphDataModel,
  InternalEvent,
  ModelXmlSerializer,
  Perimeter,
  TextShape,
} from '@maxgraph/core';
import type { Cell } from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Misc/DynamicLoading',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, any>) => {
  const container = createGraphContainer(args);

  let requestId = 0;

  // Speedup the animation
  TextShape.prototype.useSvgBoundingBox = false;

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Disables all built-in interactions
  graph.setEnabled(false);

  // Handles clicks on cells
  graph.addListener(InternalEvent.CLICK, function (_sender, eventObject) {
    const cell = eventObject.getProperty('cell');

    if (cell != null) {
      load(graph, cell);
    }
  });

  // Changes the default vertex style in-place
  const style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = 'ellipse';
  style.perimeter = Perimeter.EllipsePerimeter;
  style.gradientColor = 'white';

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  const cx = args.width / 2;
  const cy = args.height / 2;

  const cell = graph.insertVertex(parent, '0-0', '0-0', cx - 20, cy - 15, 60, 40);

  // Animates the changes in the graph model
  graph.getDataModel().addListener(InternalEvent.CHANGE, function (_sender, eventObject) {
    const { changes } = eventObject.getProperty('edit');
    Effects.animateChanges(graph, changes);
  });

  // Loads the links for the given cell into the given graph
  // by requesting the respective data in the server-side
  // (implemented for this demo using the server-function)
  function load(graph: Graph, cell: Cell) {
    if (cell.isVertex()) {
      const cx = args.width / 2;
      const cy = args.height / 2;

      // Gets the default parent for inserting new cells. This
      // is normally the first child of the root (ie. layer 0).
      const parent = graph.getDefaultParent();

      // Adds cells to the model in a single step
      graph.batchUpdate(() => {
        const xml = server(cell.id);

        const model = new GraphDataModel();
        new ModelXmlSerializer(model).import(xml);

        // Removes all cells which are not in the response
        for (const key in graph.getDataModel().cells) {
          const tmp = graph.getDataModel().getCell(key);

          if (tmp != null && tmp != cell && tmp.isVertex()) {
            graph.removeCells([tmp]);
          }
        }

        // Merges the response model with the client model
        // Here we know that the root is not null
        graph
          .getDataModel()
          .mergeChildren((model.getRoot() as Cell).getChildAt(0), parent);

        // Moves the given cell to the center
        let geo = cell.getGeometry();

        if (geo != null) {
          geo = geo.clone();
          geo.x = cx - geo.width / 2;
          geo.y = cy - geo.height / 2;

          graph.getDataModel().setGeometry(cell, geo);
        }

        // Creates a list of the new vertices, if there is more
        // than the center vertex which might have existed
        // previously, then this needs to be changed to analyze
        // the target model before calling mergeChildren above
        const vertices = [];

        for (const key in graph.getDataModel().cells) {
          const tmp = graph.getDataModel().getCell(key);

          if (tmp != null && tmp != cell && tmp.isVertex()) {
            vertices.push(tmp);

            // Changes the initial location "in-place"
            // to get a nice animation effect from the
            // center to the radius of the circle
            const geo = tmp.getGeometry();

            if (geo != null) {
              geo.x = cx - geo.width / 2;
              geo.y = cy - geo.height / 2;
            }
          }
        }

        // Arranges the response in a circle
        const cellCount = vertices.length;
        const phi = (2 * Math.PI) / cellCount;
        const r = Math.min(args.width / 4, args.height / 4);

        for (let i = 0; i < cellCount; i++) {
          let geo = vertices[i].getGeometry();

          if (geo != null) {
            geo = geo.clone();
            geo.x += r * Math.sin(i * phi);
            geo.y += r * Math.cos(i * phi);

            graph.getDataModel().setGeometry(vertices[i], geo);
          }
        }
      });
    }
  }

  // Simulates the existence of a server that can crawl the
  // big graph with a certain depth and create a graph model
  // for the traversed cells, which is then sent to the client
  function server(cellId: string | null) {
    // Increments the request ID as a prefix for the cell IDs
    requestId++;

    // Creates a local graph with no display (pass null as container)
    const graph = new Graph(null!);

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    const parent = graph.getDefaultParent();

    // Adds cells to the model in a single step
    graph.batchUpdate(() => {
      const v0 = graph.insertVertex(parent, cellId, 'Dummy', 0, 0, 60, 40);
      const cellCount = Math.floor(Math.random() * 16) + 4;

      // Creates the random links and cells for the response
      for (let i = 0; i < cellCount; i++) {
        const id = `${requestId}-${i}`;
        const v = graph.insertVertex(parent, id, id, 0, 0, 60, 40);
        graph.insertEdge(parent, null, `Link ${i}`, v0, v);
      }
    });

    return new ModelXmlSerializer(graph.getDataModel()).export();
  }

  load(graph, cell);

  return container;
};

export const Default = Template.bind({});
