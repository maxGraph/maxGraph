import {
  Graph,
  RubberBandHandler,
  ConnectionHandler,
  ImageBox,
  MaxToolbar,
  Model,
  KeyHandler,
  Cell,
  Geometry,
  InternalEvent,
  utils,
  gestureUtils,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Toolbars/DynamicToolbar',
  argTypes: {
    ...globalTypes,
    rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },
  },
};

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  // Defines an icon for creating new connections in the connection handler.
  // This will automatically disable the highlighting of the source vertex.
  ConnectionHandler.prototype.connectImage = new ImageBox(
    '/images/connector.gif',
    16,
    16
  );

  // Creates the div for the toolbar
  const tbContainer = document.createElement('div');
  tbContainer.style.position = 'absolute';
  tbContainer.style.overflow = 'hidden';
  tbContainer.style.padding = '2px';
  tbContainer.style.left = '0px';
  tbContainer.style.top = '0px';
  tbContainer.style.width = '24px';
  tbContainer.style.bottom = '0px';

  div.appendChild(tbContainer);

  // Creates new toolbar without event processing
  const toolbar = new MaxToolbar(tbContainer);
  toolbar.enabled = false;

  // Creates the model and the graph inside the container
  // using the fastest rendering available on the browser
  const model = new Model();
  const graph = new Graph(container, model);

  // Enables new connections in the graph
  graph.setConnectable(true);
  graph.setMultigraph(false);

  // Stops editing on enter or escape keypress
  const keyHandler = new KeyHandler(graph);

  if (args.rubberBand) new RubberBandHandler(graph);

  addVertex('/images/rectangle.gif', 100, 40, '');
  addVertex('/images/rounded.gif', 100, 40, 'shape=rounded');
  addVertex('/images/ellipse.gif', 40, 40, 'shape=ellipse');
  addVertex('/images/rhombus.gif', 40, 40, 'shape=rhombus');
  addVertex('/images/triangle.gif', 40, 40, 'shape=triangle');
  addVertex('/images/cylinder.gif', 40, 40, 'shape=cylinder');
  addVertex('/images/actor.gif', 30, 40, 'shape=actor');

  function addVertex(icon, w, h, style) {
    const vertex = new Cell(null, new Geometry(0, 0, w, h), style);
    vertex.setVertex(true);

    const img = addToolbarItem(graph, toolbar, vertex, icon);
    img.enabled = true;

    graph.getSelectionModel().addListener(InternalEvent.CHANGE, () => {
      const tmp = graph.isSelectionEmpty();
      utils.setOpacity(img, tmp ? 100 : 20);
      img.enabled = tmp;
    });
  }

  function addToolbarItem(graph, toolbar, prototype, image) {
    // Function that is executed when the image is dropped on
    // the graph. The cell argument points to the cell under
    // the mousepointer if there is one.
    const funct = (graph, evt, cell, x, y) => {
      graph.stopEditing(false);

      const vertex = graph.getModel().cloneCell(prototype);
      vertex.geometry.x = x;
      vertex.geometry.y = y;

      graph.addCell(vertex);
      graph.setSelectionCell(vertex);
    };

    // Creates the image which is used as the drag icon (preview)
    const img = toolbar.addMode(null, image, (evt, cell) => {
      const pt = graph.getPointForEvent(evt);
      funct(graph, evt, cell, pt.x, pt.y);
    });

    // Disables dragging if element is disabled. This is a workaround
    // for wrong event order in IE. Following is a dummy listener that
    // is invoked as the last listener in IE.
    InternalEvent.addListener(img, 'mousedown', (evt) => {
      // do nothing
    });

    // This listener is always called first before any other listener
    // in all browsers.
    InternalEvent.addListener(img, 'mousedown', (evt) => {
      if (img.enabled == false) {
        InternalEvent.consume(evt);
      }
    });

    gestureUtils.makeDraggable(img, graph, funct);
    return img;
  }

  return div;
};

export const Default = Template.bind({});
