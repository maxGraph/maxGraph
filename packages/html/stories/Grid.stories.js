import {
  Graph,
  InternalEvent,
  RubberBandHandler,
  MaxLog,
  GraphView,
  Point,
  DomHelpers,
  eventUtils,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Backgrounds/Grid',
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
  container.style.cursor = 'default';
  div.appendChild(container);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  var graph = new Graph(container);
  const graphHandler = graph.getPlugin('SelectionHandler');
  graphHandler.scaleGrid = true;
  graph.setPanning(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  let repaintGrid;

  // Create grid dynamically (requires canvas)
  (function () {
    try {
      var canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0px';
      canvas.style.left = '0px';
      canvas.style.zIndex = -1;
      graph.container.appendChild(canvas);

      var ctx = canvas.getContext('2d');

      // Modify event filtering to accept canvas as container
      var mxGraphViewIsContainerEvent = GraphView.prototype.isContainerEvent;
      GraphView.prototype.isContainerEvent = function (evt) {
        return (
          mxGraphViewIsContainerEvent.apply(this, arguments) ||
          eventUtils.getSource(evt) == canvas
        );
      };

      var s = 0;
      var gs = 0;
      var tr = new Point();
      var w = 0;
      var h = 0;

      repaintGrid = function () {
        if (ctx != null) {
          var bounds = graph.getGraphBounds();
          var width = Math.max(bounds.x + bounds.width, graph.container.clientWidth);
          var height = Math.max(bounds.y + bounds.height, graph.container.clientHeight);
          var sizeChanged = width != w || height != h;

          if (
            graph.view.scale != s ||
            graph.view.translate.x != tr.x ||
            graph.view.translate.y != tr.y ||
            gs != graph.gridSize ||
            sizeChanged
          ) {
            tr = graph.view.translate.clone();
            s = graph.view.scale;
            gs = graph.gridSize;
            w = width;
            h = height;

            // Clears the background if required
            if (!sizeChanged) {
              ctx.clearRect(0, 0, w, h);
            } else {
              canvas.setAttribute('width', w);
              canvas.setAttribute('height', h);
            }

            var tx = tr.x * s;
            var ty = tr.y * s;

            // Sets the distance of the grid lines in pixels
            var minStepping = graph.gridSize;
            var stepping = minStepping * s;

            if (stepping < minStepping) {
              var count = Math.round(Math.ceil(minStepping / stepping) / 2) * 2;
              stepping = count * stepping;
            }

            var xs = Math.floor((0 - tx) / stepping) * stepping + tx;
            var xe = Math.ceil(w / stepping) * stepping;
            var ys = Math.floor((0 - ty) / stepping) * stepping + ty;
            var ye = Math.ceil(h / stepping) * stepping;

            xe += Math.ceil(stepping);
            ye += Math.ceil(stepping);

            var ixs = Math.round(xs);
            var ixe = Math.round(xe);
            var iys = Math.round(ys);
            var iye = Math.round(ye);

            // Draws the actual grid
            ctx.strokeStyle = '#f6f6f6';
            ctx.beginPath();

            for (var x = xs; x <= xe; x += stepping) {
              x = Math.round((x - tx) / stepping) * stepping + tx;
              var ix = Math.round(x);

              ctx.moveTo(ix + 0.5, iys + 0.5);
              ctx.lineTo(ix + 0.5, iye + 0.5);
            }

            for (var y = ys; y <= ye; y += stepping) {
              y = Math.round((y - ty) / stepping) * stepping + ty;
              var iy = Math.round(y);

              ctx.moveTo(ixs + 0.5, iy + 0.5);
              ctx.lineTo(ixe + 0.5, iy + 0.5);
            }

            ctx.closePath();
            ctx.stroke();
          }
        }
      };
    } catch (e) {
      MaxLog.show();
      MaxLog.debug('Using background image');

      container.style.backgroundImage = "url('editors/images/grid.gif')";
    }

    var mxGraphViewValidateBackground = GraphView.prototype.validateBackground;
    GraphView.prototype.validateBackground = function () {
      mxGraphViewValidateBackground.apply(this, arguments);
      repaintGrid();
    };
  })();

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  var parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    var e1 = graph.insertEdge(parent, null, '', v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  graph.centerZoom = false;

  const controller = document.createElement('div');
  div.appendChild(controller);

  controller.appendChild(
    DomHelpers.button('+', function () {
      graph.zoomIn();
    })
  );

  controller.appendChild(
    DomHelpers.button('-', function () {
      graph.zoomOut();
    })
  );

  return div;
};

export const Default = Template.bind({});
