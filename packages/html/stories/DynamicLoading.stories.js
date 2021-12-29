import {
  Graph,
  TextShape,
  Effects,
  InternalEvent,
  constants,
  Perimeter,
  Codec,
  xmlUtils,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Misc/DynamicLoading',
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

  let requestId = 0;

  // Speedup the animation
  TextShape.prototype.enableBoundingBox = false;

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Disables all built-in interactions
  graph.setEnabled(false);

  // Handles clicks on cells
  graph.addListener(InternalEvent.CLICK, function (sender, evt) {
    const cell = evt.getProperty('cell');

    if (cell != null) {
      load(graph, cell);
    }
  });

  // Changes the default vertex style in-place
  const style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = constants.SHAPE.ELLIPSE;
  style.perimiter = Perimeter.EllipsePerimeter;
  style.gradientColor = 'white';

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  const cx = graph.container.clientWidth / 2;
  const cy = graph.container.clientHeight / 2;

  const cell = graph.insertVertex(parent, '0-0', '0-0', cx - 20, cy - 15, 60, 40);

  // Animates the changes in the graph model
  graph.getDataModel().addListener(InternalEvent.CHANGE, function (sender, evt) {
    const { changes } = evt.getProperty('edit');
    Effects.animateChanges(graph, changes);
  });

  // Loads the links for the given cell into the given graph
  // by requesting the respective data in the server-side
  // (implemented for this demo using the server-function)
  function load(graph, cell) {
    if (cell.isVertex()) {
      const cx = graph.container.clientWidth / 2;
      const cy = graph.container.clientHeight / 2;

      // Gets the default parent for inserting new cells. This
      // is normally the first child of the root (ie. layer 0).
      const parent = graph.getDefaultParent();

      // Adds cells to the model in a single step
      graph.getDataModel().beginUpdate();
      try {
        const xml = server(cell.id);
        const doc = xmlUtils.parseXml(xml);
        const dec = new Codec(doc);
        const model = dec.decode(doc.documentElement);

        // Removes all cells which are not in the response
        for (var key in graph.getDataModel().cells) {
          const tmp = graph.getDataModel().getCell(key);

          if (tmp != cell && tmp.isVertex()) {
            graph.removeCells([tmp]);
          }
        }

        // Merges the response model with the client model
        graph.getDataModel().mergeChildren(graph.getDataModel().getRoot().getChildAt(0), parent);

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

        for (var key in graph.getDataModel().cells) {
          const tmp = graph.getDataModel().getCell(key);

          if (tmp != cell && tmp.isVertex()) {
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
        const r = Math.min(
          graph.container.clientWidth / 4,
          graph.container.clientHeight / 4
        );

        for (let i = 0; i < cellCount; i++) {
          let geo = vertices[i].getGeometry();

          if (geo != null) {
            geo = geo.clone();
            geo.x += r * Math.sin(i * phi);
            geo.y += r * Math.cos(i * phi);

            graph.getDataModel().setGeometry(vertices[i], geo);
          }
        }
      } finally {
        // Updates the display
        graph.getDataModel().endUpdate();
      }
    }
  }

  // Simulates the existence of a server that can crawl the
  // big graph with a certain depth and create a graph model
  // for the traversed cells, which is then sent to the client
  function server(cellId) {
    // Increments the request ID as a prefix for the cell IDs
    requestId++;

    // Creates a local graph with no display
    const graph = new Graph();

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    const parent = graph.getDefaultParent();

    // Adds cells to the model in a single step
    graph.getDataModel().beginUpdate();
    try {
      const v0 = graph.insertVertex(parent, cellId, 'Dummy', 0, 0, 60, 40);
      const cellCount = parseInt(Math.random() * 16) + 4;

      // Creates the random links and cells for the response
      for (let i = 0; i < cellCount; i++) {
        const id = `${requestId}-${i}`;
        const v = graph.insertVertex(parent, id, id, 0, 0, 60, 40);
        const e = graph.insertEdge(parent, null, `Link ${i}`, v0, v);
      }
    } finally {
      // Updates the display
      graph.getDataModel().endUpdate();
    }

    const enc = new Codec();
    const node = enc.encode(graph.getDataModel());

    return xmlUtils.getXml(node);
  }

  load(graph, cell);

  return container;
};

export const Default = Template.bind({});
