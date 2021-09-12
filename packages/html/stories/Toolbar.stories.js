import {
  Graph,
  RubberBand,
  ConnectionHandler,
  ImageBox,
  mxToolbar,
  Model,
  mxKeyHandler,
  Cell,
  Geometry,
  DragSource,
  mxDomHelpers,
  GestureUtils,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Toolbars/Toolbar',
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
  const toolbar = new mxToolbar(tbContainer);
  toolbar.enabled = false;

  // Creates the model and the graph inside the container
  // using the fastest rendering available on the browser
  const model = new Model();
  const graph = new Graph(container, model);
  graph.dropEnabled = true;

  // Matches DnD inside the graph
  DragSource.prototype.getDropTarget = function (graph, x, y) {
    let cell = graph.getCellAt(x, y);
    if (!graph.isValidDropTarget(cell)) {
      cell = null;
    }
    return cell;
  };

  // Enables new connections in the graph
  graph.setConnectable(true);
  graph.setMultigraph(false);

  // Stops editing on enter or escape keypress
  const keyHandler = new mxKeyHandler(graph);

  if (args.rubberBand) new RubberBand(graph);

  const addVertex = (icon, w, h, style) => {
    const vertex = new Cell(null, new Geometry(0, 0, w, h), style);
    vertex.setVertex(true);

    addToolbarItem(graph, toolbar, vertex, icon);
  };

  addVertex('/images/swimlane.gif', 120, 160, 'shape=swimlane;startSize=20;');
  addVertex('/images/rectangle.gif', 100, 40, '');
  addVertex('/images/rounded.gif', 100, 40, 'shape=rounded');
  addVertex('/images/ellipse.gif', 40, 40, 'shape=ellipse');
  addVertex('/images/rhombus.gif', 40, 40, 'shape=rhombus');
  addVertex('/images/triangle.gif', 40, 40, 'shape=triangle');
  addVertex('/images/cylinder.gif', 40, 40, 'shape=cylinder');
  addVertex('/images/actor.gif', 30, 40, 'shape=actor');
  toolbar.addLine();

  const button = mxDomHelpers.button('Create toolbar entry from selection', (evt) => {
    if (!graph.isSelectionEmpty()) {
      // Creates a copy of the selection array to preserve its state
      const cells = graph.getSelectionCells();
      const bounds = graph.getView().getBounds(cells);

      // Function that is executed when the image is dropped on
      // the graph. The cell argument points to the cell under
      // the mousepointer if there is one.
      const funct = (graph, evt, cell) => {
        graph.stopEditing(false);

        const pt = graph.getPointForEvent(evt);
        const dx = pt.x - bounds.x;
        const dy = pt.y - bounds.y;

        graph.setSelectionCells(graph.importCells(cells, dx, dy, cell));
      };

      // Creates the image which is used as the drag icon (preview)
      const img = toolbar.addMode(null, '/images/outline.gif', funct);
      GestureUtils.makeDraggable(img, graph, funct);
    }
  });

  tbContainer.appendChild(button);

  function addToolbarItem(graph, toolbar, prototype, image) {
    // Function that is executed when the image is dropped on
    // the graph. The cell argument points to the cell under
    // the mousepointer if there is one.
    const funct = (graph, evt, cell) => {
      graph.stopEditing(false);

      const pt = graph.getPointForEvent(evt);
      const vertex = graph.getModel().cloneCell(prototype);
      vertex.geometry.x = pt.x;
      vertex.geometry.y = pt.y;

      graph.setSelectionCells(graph.importCells([vertex], 0, 0, cell));
    };

    // Creates the image which is used as the drag icon (preview)
    const img = toolbar.addMode(null, image, funct);
    GestureUtils.makeDraggable(img, graph, funct);
  }

  return div;
};

export const Default = Template.bind({});
