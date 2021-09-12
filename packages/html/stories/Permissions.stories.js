import {
  Graph,
  ConnectionHandler,
  ImageBox,
  RubberBand,
  mxKeyHandler,
  mxDomHelpers,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Misc/Permissions',
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
  ConnectionHandler.prototype.connectImage = new ImageBox('images/connector.gif', 16, 16);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enable tooltips, disables mutligraphs, enable loops
  graph.setMultigraph(false);
  graph.setAllowLoops(true);

  // Enables rubberband selection and key handling
  if (args.rubberBand) new RubberBand(graph);

  const keyHandler = new mxKeyHandler(graph);

  // Assigns the delete key
  keyHandler.bindKey(46, function (evt) {
    if (graph.isEnabled()) {
      graph.removeCells();
    }
  });

  // Shared variable between child function scopes
  // aka "private" variable
  let currentPermission = null;

  const apply = function (permission) {
    graph.clearSelection();
    permission.apply(graph);
    graph.setEnabled(true);
    graph.setTooltips(true);

    // Updates the icons on the shapes - rarely
    // needed and very slow for large graphs
    graph.refresh();
    currentPermission = permission;
  };

  apply(new Permission());

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  let button = mxDomHelpers.button('Allow All', function (evt) {
    apply(new Permission());
  });
  buttons.appendChild(button);

  button = mxDomHelpers.button('Connect Only', function (evt) {
    apply(new Permission(false, true, false, false, true));
  });
  buttons.appendChild(button);

  button = mxDomHelpers.button('Edges Only', function (evt) {
    apply(new Permission(false, false, true, false, false));
  });
  buttons.appendChild(button);

  button = mxDomHelpers.button('Vertices Only', function (evt) {
    apply(new Permission(false, false, false, true, false));
  });
  buttons.appendChild(button);

  button = mxDomHelpers.button('Select Only', function (evt) {
    apply(new Permission(false, false, false, false, false));
  });
  buttons.appendChild(button);

  button = mxDomHelpers.button('Locked', function (evt) {
    apply(new Permission(true, false));
  });
  buttons.appendChild(button);

  button = mxDomHelpers.button('Disabled', function (evt) {
    graph.clearSelection();
    graph.setEnabled(false);
    graph.setTooltips(false);
  });
  buttons.appendChild(button);

  // Extends hook functions to use permission object. This could
  // be done by assigning the respective switches (eg.
  // setMovable), but this approach is more flexible, doesn't
  // override any existing behaviour or settings, and allows for
  // dynamic conditions to be used in the functions. See the
  // specification for more functions to extend (eg.
  // isSelectable).
  const oldDisconnectable = graph.isCellDisconnectable;
  graph.isCellDisconnectable = function (cell, terminal, source) {
    return oldDisconnectable.apply(this, arguments) && currentPermission.editEdges;
  };

  const oldTerminalPointMovable = graph.isTerminalPointMovable;
  graph.isTerminalPointMovable = function (cell) {
    return oldTerminalPointMovable.apply(this, arguments) && currentPermission.editEdges;
  };

  const oldBendable = graph.isCellBendable;
  graph.isCellBendable = function (cell) {
    return oldBendable.apply(this, arguments) && currentPermission.editEdges;
  };

  const oldLabelMovable = graph.isLabelMovable;
  graph.isLabelMovable = function (cell) {
    return oldLabelMovable.apply(this, arguments) && currentPermission.editEdges;
  };

  const oldMovable = graph.isCellMovable;
  graph.isCellMovable = function (cell) {
    return oldMovable.apply(this, arguments) && currentPermission.editVertices;
  };

  const oldResizable = graph.isCellResizable;
  graph.isCellResizable = function (cell) {
    return oldResizable.apply(this, arguments) && currentPermission.editVertices;
  };

  const oldEditable = graph.isCellEditable;
  graph.isCellEditable = function (cell) {
    return (
      (oldEditable.apply(this, arguments) &&
        cell.isVertex() &&
        currentPermission.editVertices) ||
      (cell.isEdge() && currentPermission.editEdges)
    );
  };

  const oldDeletable = graph.isCellDeletable;
  graph.isCellDeletable = function (cell) {
    return (
      (oldDeletable.apply(this, arguments) &&
        cell.isVertex() &&
        currentPermission.editVertices) ||
      (cell.isEdge() && currentPermission.editEdges)
    );
  };

  const oldCloneable = graph.isCellCloneable;
  graph.isCellCloneable = function (cell) {
    return oldCloneable.apply(this, arguments) && currentPermission.cloneCells;
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'Hello,', 200, 20, 80, 30);
    const v3 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const e1 = graph.insertEdge(parent, null, 'Connection', v1, v3);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  return div;
};

class Permission {
  constructor(locked, createEdges, editEdges, editVertices, cloneCells) {
    this.locked = locked != null ? locked : false;
    this.createEdges = createEdges != null ? createEdges : true;
    this.editEdges = editEdges != null ? editEdges : true;
    this.editVertices = editVertices != null ? editVertices : true;
    this.cloneCells = cloneCells != null ? cloneCells : true;
  }

  apply(graph) {
    graph.setConnectable(this.createEdges);
    graph.setCellsLocked(this.locked);
  }
}

export const Default = Template.bind({});
