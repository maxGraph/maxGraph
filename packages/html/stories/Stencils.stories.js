import {
  Graph,
  ConnectionHandler,
  mxDomHelpers,
  EdgeHandler,
  InternalEvent,
  Point,
  CellHighlight,
  Constants,
  VertexHandler,
  RubberBand,
  Shape,
  StencilShape,
  StencilShapeRegistry,
  CellRenderer,
  utils,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Shapes/Stencils',
  argTypes: {
    ...globalTypes,
    contextMenu: {
      type: 'boolean',
      defaultValue: false,
    },
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

  // Allow overriding constants?
  // Sets the global shadow color
  // Constants.SHADOWCOLOR = '#C0C0C0';
  // Constants.SHADOW_OPACITY = 0.5;
  // Constants.SHADOW_OFFSET_X = 4;
  // Constants.SHADOW_OFFSET_Y = 4;
  // Constants.HANDLE_FILLCOLOR = '#99ccff';
  // Constants.HANDLE_STROKECOLOR = '#0088cf';
  // Constants.VERTEX_SELECTION_COLOR = '#00a8ff';

  // Enables connections along the outline
  ConnectionHandler.prototype.outlineConnect = true;
  EdgeHandler.prototype.manageLabelHandle = true;
  EdgeHandler.prototype.outlineConnect = true;
  CellHighlight.prototype.keepOnTop = true;

  // Enable rotation handle
  VertexHandler.prototype.rotationEnabled = true;

  // Uses the shape for resize previews
  VertexHandler.prototype.createSelectionShape = function (bounds) {
    const key = this.state.style.shape;
    const stencil = StencilShapeRegistry.getStencil(key);
    let shape = null;

    if (stencil != null) {
      shape = new Shape(stencil);
      shape.apply(this.state);
    } else {
      shape = new this.state.shape.constructor();
    }

    shape.outline = true;
    shape.bounds = bounds;
    shape.stroke = Constants.HANDLE_STROKECOLOR;
    shape.strokewidth = this.getSelectionStrokeWidth();
    shape.isDashed = this.isSelectionDashed();
    shape.isShadow = false;

    return shape;
  };

  // Defines a custom stencil via the canvas API as defined here:
  // http://jgraph.github.io/mxgraph/docs/js-api/files/util/mxXmlCanvas2D-js.html

  class CustomShape extends Shape {
    paintBackground(c, x, y, w, h) {
      c.translate(x, y);

      // Head
      c.ellipse(w / 4, 0, w / 2, h / 4);
      c.fillAndStroke();

      c.begin();
      c.moveTo(w / 2, h / 4);
      c.lineTo(w / 2, (2 * h) / 3);

      // Arms
      c.moveTo(w / 2, h / 3);
      c.lineTo(0, h / 3);
      c.moveTo(w / 2, h / 3);
      c.lineTo(w, h / 3);

      // Legs
      c.moveTo(w / 2, (2 * h) / 3);
      c.lineTo(0, h);
      c.moveTo(w / 2, (2 * h) / 3);
      c.lineTo(w, h);
      c.end();

      c.stroke();
    }
  }

  // Replaces existing actor shape
  CellRenderer.registerShape('customShape', CustomShape);

  // Loads the stencils into the registry
  const req = load('stencils.xml');
  const root = req.getDocumentElement();
  let shape = root.firstChild;

  while (shape != null) {
    if (shape.nodeType === Constants.NODETYPE_ELEMENT) {
      StencilShapeRegistry.addStencil(
        shape.getAttribute('name'),
        new StencilShape(shape)
      );
    }

    shape = shape.nextSibling;
  }

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setConnectable(true);
  graph.setTooltips(true);
  graph.setPanning(true);

  graph.getTooltipForCell = function (cell) {
    if (cell != null) {
      return cell.style;
    }

    return null;
  };

  // Changes default styles
  let style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edge = 'orthogonalEdgeStyle';
  style = graph.getStylesheet().getDefaultVertexStyle();
  style.fillColor = '#adc5ff';
  style.gradientColor = '#7d85df';
  style.shadow = '1';

  // Enables rubberband selection
  if (args.rubberBand) new RubberBand(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, 'A1', 20, 20, 40, 80, 'shape=and');
    const v2 = graph.insertVertex(parent, null, 'A2', 20, 220, 40, 80, 'shape=and');
    const v3 = graph.insertVertex(parent, null, 'X1', 160, 110, 80, 80, 'shape=xor');
    const e1 = graph.insertEdge(parent, null, '', v1, v3);
    e1.geometry.points = [new Point(90, 60), new Point(90, 130)];
    const e2 = graph.insertEdge(parent, null, '', v2, v3);
    e2.geometry.points = [new Point(90, 260), new Point(90, 170)];

    const v4 = graph.insertVertex(
      parent,
      null,
      'A3',
      520,
      20,
      40,
      80,
      'shape=customShape;flipH=1'
    );
    const v5 = graph.insertVertex(
      parent,
      null,
      'A4',
      520,
      220,
      40,
      80,
      'shape=and;flipH=1'
    );
    const v6 = graph.insertVertex(
      parent,
      null,
      'X2',
      340,
      110,
      80,
      80,
      'shape=xor;flipH=1'
    );
    const e3 = graph.insertEdge(parent, null, '', v4, v6);
    e3.geometry.points = [new Point(490, 60), new Point(130, 130)];
    const e4 = graph.insertEdge(parent, null, '', v5, v6);
    e4.geometry.points = [new Point(490, 260), new Point(130, 170)];

    const v7 = graph.insertVertex(
      parent,
      null,
      'O1',
      250,
      260,
      80,
      60,
      'shape=or;direction=south'
    );
    const e5 = graph.insertEdge(parent, null, '', v6, v7);
    e5.geometry.points = [new Point(310, 150)];
    const e6 = graph.insertEdge(parent, null, '', v3, v7);
    e6.geometry.points = [new Point(270, 150)];

    const e7 = graph.insertEdge(parent, null, '', v7, v5);
    e7.geometry.points = [new Point(290, 370)];
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    mxDomHelpers.button('FlipH', function () {
      graph.toggleCellStyles('flipH');
    })
  );

  buttons.appendChild(
    mxDomHelpers.button('FlipV', function () {
      graph.toggleCellStyles('flipV');
    })
  );

  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));

  buttons.appendChild(
    mxDomHelpers.button('Rotate', function () {
      const cell = graph.getSelectionCell();

      if (cell != null) {
        let geo = graph.getCellGeometry(cell);

        if (geo != null) {
          graph.getModel().beginUpdate();
          try {
            // Rotates the size and position in the geometry
            geo = geo.clone();
            geo.x += geo.width / 2 - geo.height / 2;
            geo.y += geo.height / 2 - geo.width / 2;
            const tmp = geo.width;
            geo.width = geo.height;
            geo.height = tmp;
            graph.getModel().setGeometry(cell, geo);

            // Reads the current direction and advances by 90 degrees
            const state = graph.view.getState(cell);

            if (state != null) {
              let dir = state.style.direction || 'east'; /* default */

              if (dir === 'east') {
                dir = 'south';
              } else if (dir === 'south') {
                dir = 'west';
              } else if (dir === 'west') {
                dir = 'north';
              } else if (dir === 'north') {
                dir = 'east';
              }

              graph.setCellStyles('direction', dir, [cell]);
            }
          } finally {
            graph.getModel().endUpdate();
          }
        }
      }
    })
  );

  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));

  buttons.appendChild(
    mxDomHelpers.button('And', function () {
      graph.setCellStyles('shape', 'and');
    })
  );
  buttons.appendChild(
    mxDomHelpers.button('Or', function () {
      graph.setCellStyles('shape', 'or');
    })
  );
  buttons.appendChild(
    mxDomHelpers.button('Xor', function () {
      graph.setCellStyles('shape', 'xor');
    })
  );

  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));
  buttons.appendChild(document.createTextNode('\u00a0'));

  buttons.appendChild(
    mxDomHelpers.button('Style', function () {
      const cell = graph.getSelectionCell();

      if (cell != null) {
        const style = utils.prompt('Style', cell.getStyle());

        if (style != null) {
          graph.getModel().setStyle(cell, style);
        }
      }
    })
  );

  buttons.appendChild(
    mxDomHelpers.button('+', function () {
      graph.zoomIn();
    })
  );
  buttons.appendChild(
    mxDomHelpers.button('-', function () {
      graph.zoomOut();
    })
  );

  return div;
};

export const Default = Template.bind({});
