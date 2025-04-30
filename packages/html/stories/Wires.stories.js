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

/*
====================
README
====================

- Edge-to-edge connections: We store the point where the mouse
was released in the terminal points of the edge geometry and
use that point to find the nearest segment on the target edge
and the connection point between the two edges in
mxGraphView.updateFixedTerminalPoint.

- The orthogonal router, which is implemented as an edge style,
computes its result based on the output of mxGraphView.
updateFixedTerminalPoint, which computes all connection points
for edge-to-edge connections and constrained ports and vertices
and stores them in state.absolutePoints.

- Routing directions are stored in the 'portConstraint' style.
Possible values for this style horizontal and vertical. Note
that this may have other values depending on the edge style.

- For edge-to-edge connections, a 'source-/targetConstraint'
style is added in updateFixedTerminalPoint that contains the
orientation of the segment that the edge connects to. Possible
values are horizontal, vertical.

- An alternative solution for connection points via connection
constraints is demonstrated. In this setup, the edge is connected
to the parent cell directly. There are no child cells that act
as "ports". Instead, the connection information is stored as a
relative point in the connecting edge. (See also: portrefs.html
for storing references to ports.)

*/

import {
  domUtils,
  styleUtils,
  mathUtils,
  cloneUtils,
  eventUtils,
  Graph,
  InternalEvent,
  RubberBandHandler,
  ConnectionHandler,
  ConnectionConstraint,
  Point,
  CylinderShape,
  CellRenderer,
  DomHelpers,
  Rectangle,
  EdgeHandler,
  StyleRegistry,
  EdgeSegmentHandler,
  UndoManager,
  CellEditorHandler,
  ConstraintHandler,
  Guide,
  ImageBox,
  GraphView,
  SelectionHandler,
  PanningHandler,
  TooltipHandler,
  SelectionCellsHandler,
  PopupMenuHandler,
  cellArrayUtils,
  StyleDefaultsConfig,
} from '@maxgraph/core';

import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
import '@maxgraph/core/css/common.css'; // style required by RubberBand

export default {
  title: 'Connections/Wires',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
    ...rubberBandValues,
  },
};

// TODO apply this settings to the container used by the Graph
const HTML_TEMPLATE = `
<body onload="main(document.getElementById('graphContainer'))">
  <div id="graphContainer"
    style="overflow:auto;position:relative;width:800px;height:600px;border:1px solid gray;background:url('images/wires-grid.gif');background-position:-1px 0px;cursor:crosshair;">
  </div>
</body>
</html>
`;

const Template = ({ label, ...args }) => {
  const parentContainer = document.createElement('div');
  const container = createGraphContainer(args);
  parentContainer.appendChild(container);

  // Changes some default colors
  StyleDefaultsConfig.shadowColor = '#C0C0C0';

  let joinNodeSize = 7;
  let strokeWidth = 2;

  class MyCustomGraph extends Graph {
    resetEdgesOnConnect = false;

    createEdgeSegmentHandler(state) {
      return new MyCustomEdgeSegmentHandler(state);
    }

    createGraphView() {
      return new MyCustomGraphView(this);
    }

    createEdgeHandler(state) {
      return new MyCustomEdgeHandler(state);
    }

    createHandler(state) {
      let result = null;

      if (state != null) {
        if (state.cell.isEdge()) {
          let style = this.view.getEdgeStyle(state);

          if (style == WireConnector) {
            return new EdgeSegmentHandler(state);
          }
        }
      }

      return super.createHandler.apply(this, arguments);
    }

    // Adds oval markers for edge-to-edge connections.
    getCellStyle(cell) {
      let style = super.getCellStyle.apply(this, arguments);

      if (style != null && cell?.isEdge()) {
        style = cloneUtils.clone(style);

        if (cell.getTerminal(true)?.isEdge()) {
          style.startArrow = 'oval';
        }

        if (cell.getTerminal(false)?.isEdge()) {
          style.endArrow = 'oval';
        }
      }
      return style;
    }

    getTooltipForCell(cell) {
      let tip = '';

      if (cell != null) {
        let src = cell.getTerminal(true);
        if (src != null) {
          tip += this.getTooltipForCell(src) + ' ';
        }

        let parent = cell.getParent();
        if (parent.isVertex()) {
          tip += this.getTooltipForCell(parent) + '.';
        }

        tip += super.getTooltipForCell.apply(this, arguments);

        let trg = cell.getTerminal(false);
        if (trg != null) {
          tip += ' ' + this.getTooltipForCell(trg);
        }
      }
      return tip;
    }

    // Alternative solution for implementing connection points without child cells.
    // This can be extended as shown in portrefs.html example to allow for per-port
    // incoming/outgoing direction.
    getAllConnectionConstraints(terminal) {
      let geo = terminal != null ? terminal.cell.getGeometry() : null;

      if (
        (geo != null ? !geo.relative : false) &&
        terminal.cell.isVertex() &&
        terminal.cell.getChildCount() === 0
      ) {
        return [
          new ConnectionConstraint(new Point(0, 0.5), false),
          new ConnectionConstraint(new Point(1, 0.5), false),
        ];
      }
      return null;
    }
  }

  // FIXME: Provide means to make EdgeHandler and ConnectionHandler instantiate this subclass!
  class MyCustomConstraintHandler extends ConstraintHandler {
    // Replaces the port image
    pointImage = new ImageBox('images/dot.gif', 10, 10);
  }

  class MyCustomGuide extends Guide {
    // Alt disables guides
    isEnabledForEvent(evt) {
      return !eventUtils.isAltDown(evt);
    }
  }

  class MyCustomEdgeHandler extends EdgeHandler {
    // Enables snapping waypoints to terminals
    snapToTerminals = true;

    isConnectableCell(cell) {
      return graph.getPlugin('ConnectionHandler').isConnectableCell(cell);
    }

    connect(edge, terminal, isSource, isClone, me) {
      let result = null;
      let model = this.graph.getDataModel();
      let parent = model.getParent(edge);

      model.beginUpdate();
      try {
        result = super.connect.apply(this, arguments);
        let geo = model.getGeometry(result);

        if (geo != null) {
          geo = geo.clone();
          let pt = null;

          if (terminal.isEdge()) {
            pt = this.abspoints[this.isSource ? 0 : this.abspoints.length - 1];
            pt.x = pt.x / this.graph.view.scale - this.graph.view.translate.x;
            pt.y = pt.y / this.graph.view.scale - this.graph.view.translate.y;

            let pstate = this.graph.getView().getState(edge.getParent());

            if (pstate != null) {
              pt.x -= pstate.origin.x;
              pt.y -= pstate.origin.y;
            }

            pt.x -= this.graph.panDx / this.graph.view.scale;
            pt.y -= this.graph.panDy / this.graph.view.scale;
          }

          geo.setTerminalPoint(pt, isSource);
          model.setGeometry(edge, geo);
        }
      } finally {
        model.endUpdate();
      }

      return result;
    }

    createMarker() {
      let marker = super.createMarker.apply(this, arguments);
      // Adds in-place highlighting when reconnecting existing edges
      marker.highlight.highlight =
        this.graph.getPlugin('ConnectionHandler').marker.highlight.highlight;
      return marker;
    }
  }

  // Switch for black background and bright styles
  let invert = false;
  let MyCustomCellEditorHandler;

  if (invert) {
    container.style.backgroundColor = 'black';

    // White in-place editor text color
    MyCustomCellEditorHandler = class extends CellEditorHandler {
      startEditing(cell, trigger) {
        super.startEditing.apply(this, arguments);

        if (this.textarea != null) {
          this.textarea.style.color = '#FFFFFF';
        }
      }
    };
  } else {
    MyCustomCellEditorHandler = CellEditorHandler;
  }

  class MyCustomSelectionHandler extends SelectionHandler {
    previewColor = invert ? 'white' : 'black';
    // Enables guides
    guidesEnabled = true;

    createGuide() {
      return new MyCustomGuide(this.graph, this.getGuideStates());
    }
  }

  class MyCustomPanningHandler extends PanningHandler {
    // Panning handler consumed right click so this must be
    // disabled if right click should stop connection handler.
    isPopupTrigger() {
      return false;
    }
  }

  class MyCustomConnectionHandler extends ConnectionHandler {
    // If connect preview is not moved away then getCellAt is used to detect the cell under
    // the mouse if the mouse is over the preview shape in IE (no event transparency), ie.
    // the built-in hit-detection of the HTML document will not be used in this case.
    movePreviewAway = false;
    waypointsEnabled = true;

    // Starts connections on the background in wire-mode
    isStartEvent(me) {
      return checkbox.checked || super.isStartEvent.apply(this, arguments);
    }

    // Avoids any connections for gestures within tolerance except when in wire-mode
    // or when over a port
    mouseUp(sender, me) {
      if (this.first != null && this.previous != null) {
        let point = styleUtils.convertPoint(this.graph.container, me.getX(), me.getY());
        let dx = Math.abs(point.x - this.first.x);
        let dy = Math.abs(point.y - this.first.y);

        if (dx < this.graph.tolerance && dy < this.graph.tolerance) {
          // Selects edges in non-wire mode for single clicks, but starts
          // connecting for non-edges regardless of wire-mode
          if (!checkbox.checked && this.previous.cell.isEdge()) {
            this.reset();
          }
          return;
        }
      }
      super.mouseUp.apply(this, arguments);
    }

    // Overrides methods to preview and create new edges.

    // Sets source terminal point for edge-to-edge connections.
    createEdgeState(me) {
      let edge = this.graph.createEdge();

      if (this.sourceConstraint != null && this.previous != null) {
        edge.style =
          'exitX' +
          '=' +
          this.sourceConstraint.point.x +
          ';' +
          'exitY' +
          '=' +
          this.sourceConstraint.point.y +
          ';';
      } else if (me.getCell().isEdge()) {
        let scale = this.graph.view.scale;
        let tr = this.graph.view.translate;
        let pt = new Point(
          this.graph.snap(me.getGraphX() / scale) - tr.x,
          this.graph.snap(me.getGraphY() / scale) - tr.y
        );
        edge.geometry.setTerminalPoint(pt, true);
      }

      return this.graph.view.createState(edge);
    }

    // Uses right mouse button to create edges on background (see also: lines 67 ff)
    isStopEvent(me) {
      return me.getState() != null || eventUtils.isRightMouseButton(me.getEvent());
    }

    // Updates target terminal point for edge-to-edge connections.
    updateCurrentState(me, point) {
      super.updateCurrentState.apply(this, arguments);

      if (this.edgeState != null) {
        this.edgeState.cell.geometry.setTerminalPoint(null, false);

        if (
          this.shape != null &&
          this.currentState != null &&
          this.currentState.cell.isEdge()
        ) {
          let scale = this.graph.view.scale;
          let tr = this.graph.view.translate;
          let pt = new Point(
            this.graph.snap(me.getGraphX() / scale) - tr.x,
            this.graph.snap(me.getGraphY() / scale) - tr.y
          );
          this.edgeState.cell.geometry.setTerminalPoint(pt, false);
        }
      }
    }

    // Adds in-place highlighting for complete cell area (no hotspot).
    createMarker() {
      let marker = super.createMarker.apply(this, arguments);

      // Uses complete area of cell for new connections (no hotspot)
      marker.intersects = function (state, evt) {
        return true;
      };

      // Adds in-place highlighting
      //const mxCellHighlightHighlight = mxCellHighlight.prototype.highlight;
      marker.highlight.highlight = function (state) {
        // TODO: Should this be a subclass of marker rather than assigning directly?
        if (this.state != state) {
          if (this.state != null) {
            this.state.style = this.lastStyle;

            // Workaround for shape using current stroke width if no strokewidth defined
            this.state.style.strokeWidth = this.state.style.strokeWidth || '1';
            this.state.style.strokeColor = this.state.style.strokeColor || 'none';

            if (this.state.shape != null) {
              this.state.view.graph.cellRenderer.configureShape(this.state);
              this.state.shape.redraw();
            }
          }

          if (state != null) {
            this.lastStyle = state.style;
            state.style = cloneUtils.clone(state.style);
            state.style.strokeColor = '#00ff00';
            state.style.strokeWidth = '3';

            if (state.shape != null) {
              state.view.graph.cellRenderer.configureShape(state);
              state.shape.redraw();
            }
          }
          this.state = state;
        }
      };

      return marker;
    }

    // Makes sure non-relative cells can only be connected via constraints
    isConnectableCell(cell) {
      if (cell.isEdge()) {
        return true;
      } else {
        let geo = cell != null ? cell.getGeometry() : null;
        return geo != null ? geo.relative : false;
      }
    }
  }

  // Updates connection points before the routing is called.

  class MyCustomGraphView extends GraphView {
    // Computes the position of edge to edge connection points.
    updateFixedTerminalPoint(edge, terminal, source, constraint) {
      let pt = null;

      if (constraint != null) {
        pt = this.graph.getConnectionPoint(terminal, constraint);
      }

      if (source) {
        edge.sourceSegment = null;
      } else {
        edge.targetSegment = null;
      }

      if (pt == null) {
        let s = this.scale;
        let tr = this.translate;
        let orig = edge.origin;
        let geo = edge.cell.getGeometry();
        pt = geo.getTerminalPoint(source);

        // Computes edge-to-edge connection point
        if (pt != null) {
          pt = new Point(s * (tr.x + pt.x + orig.x), s * (tr.y + pt.y + orig.y));

          // Finds nearest segment on edge and computes intersection
          if (terminal != null && terminal.absolutePoints != null) {
            let seg = mathUtils.findNearestSegment(terminal, pt.x, pt.y);

            // Finds orientation of the segment
            let p0 = terminal.absolutePoints[seg];
            let pe = terminal.absolutePoints[seg + 1];
            let horizontal = p0.x - pe.x === 0;

            // Stores the segment in the edge state
            let key = source ? 'sourceConstraint' : 'targetConstraint';
            let value = horizontal ? 'horizontal' : 'vertical';
            edge.style[key] = value;

            // Keeps the coordinate within the segment bounds
            if (horizontal) {
              pt.x = p0.x;
              pt.y = Math.min(pt.y, Math.max(p0.y, pe.y));
              pt.y = Math.max(pt.y, Math.min(p0.y, pe.y));
            } else {
              pt.y = p0.y;
              pt.x = Math.min(pt.x, Math.max(p0.x, pe.x));
              pt.x = Math.max(pt.x, Math.min(p0.x, pe.x));
            }
          }
        }
        // Computes constraint connection points on vertices and ports
        else if (terminal != null && terminal.cell.geometry.relative) {
          pt = new Point(
            this.getRoutingCenterX(terminal),
            this.getRoutingCenterY(terminal)
          );
        }

        // Snaps point to grid
        /*if (pt != null)
        {
          let tr = this.graph.view.translate;
          let s = this.graph.view.scale;

          pt.x = (this.graph.snap(pt.x / s - tr.x) + tr.x) * s;
          pt.y = (this.graph.snap(pt.y / s - tr.y) + tr.y) * s;
        }*/
      }

      edge.setAbsoluteTerminalPoint(pt, source);
    }
  }

  // Updates the terminal and control points in the cloned preview.
  class MyCustomEdgeSegmentHandler extends EdgeSegmentHandler {
    clonePreviewState(point, terminal) {
      let clone = super.clonePreviewState.apply(this, arguments);
      clone.cell = clone.cell.clone();

      if (this.isSource || this.isTarget) {
        clone.cell.geometry = clone.cell.geometry.clone();

        // Sets the terminal point of an edge if we're moving one of the endpoints
        if (clone.cell.isEdge()) {
          // TODO: Only set this if the target or source terminal is an edge
          clone.cell.geometry.setTerminalPoint(point, this.isSource);
        } else {
          clone.cell.geometry.setTerminalPoint(null, this.isSource);
        }
      }

      return clone;
    }
  }

  // Imlements a custom resistor shape. Direction currently ignored here.

  class ResistorShape extends CylinderShape {
    constructor() {
      // TODO: The original didn't seem to call the super
      super(null, null, null, null);
    }

    redrawPath(path, x, y, w, h, isForeground) {
      let dx = w / 16;

      if (isForeground) {
        path.moveTo(0, h / 2);
        path.lineTo(2 * dx, h / 2);
        path.lineTo(3 * dx, 0);
        path.lineTo(5 * dx, h);
        path.lineTo(7 * dx, 0);
        path.lineTo(9 * dx, h);
        path.lineTo(11 * dx, 0);
        path.lineTo(13 * dx, h);
        path.lineTo(14 * dx, h / 2);
        path.lineTo(16 * dx, h / 2);
        path.end();
      }
    }
  }

  CellRenderer.registerShape('resistor', ResistorShape);

  // Implements a custom resistor shape. Direction currently ignored here.

  const WireConnector = function (state, source, target, hints, result) {
    // Creates array of all way- and terminal points
    let pts = state.absolutePoints;
    let horizontal = true;
    let hint = null;

    // Gets the initial connection from the source terminal or edge
    if (source != null && source.cell.isEdge()) {
      horizontal = state.style.sourceConstraint == 'horizontal';
    } else if (source != null) {
      horizontal = source.style.portConstraint != 'vertical';

      // Checks the direction of the shape and rotates
      let direction = source.style.direction;

      if (direction == 'north' || direction == 'south') {
        horizontal = !horizontal;
      }
    }

    // Adds the first point
    // TODO: Should move along connected segment
    let pt = pts[0];

    if (pt == null && source != null) {
      pt = new Point(
        state.view.getRoutingCenterX(source),
        state.view.getRoutingCenterY(source)
      );
    } else if (pt != null) {
      pt = pt.clone();
    }

    let first = pt;

    // Adds the waypoints
    if (hints != null && hints.length > 0) {
      // FIXME: First segment not movable
      /*hint = state.view.transformControlPoint(state, hints[0]);
      MaxLog.show();
      MaxLog.debug(hints.length,'hints0.y='+hint.y, pt.y)

      if (horizontal && Math.floor(hint.y) != Math.floor(pt.y))
      {
        MaxLog.show();
        MaxLog.debug('add waypoint');

        pt = new Point(pt.x, hint.y);
        result.push(pt);
        pt = pt.clone();
        //horizontal = !horizontal;
      }*/

      for (let i = 0; i < hints.length; i++) {
        horizontal = !horizontal;
        hint = state.view.transformControlPoint(state, hints[i]);

        if (horizontal) {
          if (pt.y !== hint.y) {
            pt.y = hint.y;
            result.push(pt.clone());
          }
        } else if (pt.x !== hint.x) {
          pt.x = hint.x;
          result.push(pt.clone());
        }
      }
    } else {
      hint = pt;
    }

    // Adds the last point
    pt = pts[pts.length - 1];

    // TODO: Should move along connected segment
    if (pt == null && target != null) {
      pt = new Point(
        state.view.getRoutingCenterX(target),
        state.view.getRoutingCenterY(target)
      );
    }

    if (horizontal) {
      if (pt.y !== hint.y && first.x !== pt.x) {
        result.push(new Point(pt.x, hint.y));
      }
    } else if (pt.x !== hint.x && first.y !== pt.y) {
      result.push(new Point(hint.x, pt.y));
    }
  };

  StyleRegistry.putValue('wireEdgeStyle', WireConnector);

  let graph = new MyCustomGraph(container, null, [
    MyCustomCellEditorHandler,
    TooltipHandler,
    SelectionCellsHandler,
    PopupMenuHandler,
    MyCustomConnectionHandler,
    MyCustomSelectionHandler,
    MyCustomPanningHandler,
  ]);

  let labelBackground = invert ? '#000000' : '#FFFFFF';
  let fontColor = invert ? '#FFFFFF' : '#000000';
  let strokeColor = invert ? '#C0C0C0' : '#000000';
  let fillColor = invert ? 'none' : '#FFFFFF';

  graph.view.scale = 1;
  graph.setPanning(true);
  graph.setConnectable(true);
  graph.setConnectableEdges(true);
  graph.setDisconnectOnMove(false);
  graph.options.foldingEnabled = false;

  //Maximum size
  graph.maximumGraphBounds = new Rectangle(0, 0, 800, 600);
  graph.border = 50;

  // Enables return key to stop editing (use shift-enter for newlines)
  graph.setEnterStopsCellEditing(true);

  // Adds rubberband selection
  new RubberBandHandler(graph);

  // Adds a special tooltip for edges
  graph.setTooltips(true);

  let style = graph.getStylesheet().getDefaultEdgeStyle();
  delete style.endArrow;
  style.strokeColor = strokeColor;
  style.labelBackgroundColor = labelBackground;
  style.edgeStyle = 'wireEdgeStyle';
  style.fontColor = fontColor;
  style.fontSize = '9';
  style.movable = '0';
  style.strokeWidth = strokeWidth;
  //style.rounded = '1';

  // Sets join node size
  style.startSize = joinNodeSize;
  style.endSize = joinNodeSize;

  style = graph.getStylesheet().getDefaultVertexStyle();
  style.gradientDirection = 'south';
  //style.gradientColor = '#909090';
  style.strokeColor = strokeColor;
  //style.fillColor = '#e0e0e0';
  style.fillColor = 'none';
  style.fontColor = fontColor;
  style.fontStyle = '1';
  style.fontSize = '12';
  style.resizable = '0';
  style.rounded = '1';
  style.strokeWidth = strokeWidth;

  let parent = graph.getDefaultParent();

  graph.batchUpdate(() => {
    let v1 = graph.insertVertex(parent, null, 'J1', 80, 40, 40, 80, {
      verticalLabelPosition: 'top',
      verticalAlign: 'bottom',
      shadow: true,
      fillColor,
    });
    v1.setConnectable(false);

    let v11 = graph.insertVertex(v1, null, '1', 0, 0, 10, 16, {
      shape: 'line',
      align: 'left',
      verticalAlign: 'middle',
      fontSize: 10,
      routingCenterX: -0.5,
      spacingLeft: 12,
      fontColor,
      strokeColor,
    });
    v11.geometry.relative = true;
    v11.geometry.offset = new Point(-v11.geometry.width, 2);
    let v12 = v11.clone();
    v12.value = '2';
    v12.geometry.offset = new Point(-v11.geometry.width, 22);
    v1.insert(v12);
    let v13 = v11.clone();
    v13.value = '3';
    v13.geometry.offset = new Point(-v11.geometry.width, 42);
    v1.insert(v13);
    let v14 = v11.clone();
    v14.value = '4';
    v14.geometry.offset = new Point(-v11.geometry.width, 62);
    v1.insert(v14);

    let v15 = v11.clone();
    v15.value = '5';
    v15.geometry.x = 1;
    v15.style = {
      shape: 'line',
      align: 'right',
      verticalAlign: 'middle',
      fontSize: 10,
      routingCenterX: 0.5,
      spacingRight: 12,
      fontColor,
      strokeColor,
    };
    v15.geometry.offset = new Point(0, 2);
    v1.insert(v15);
    let v16 = v15.clone();
    v16.value = '6';
    v16.geometry.offset = new Point(0, 22);
    v1.insert(v16);
    let v17 = v15.clone();
    v17.value = '7';
    v17.geometry.offset = new Point(0, 42);
    v1.insert(v17);
    let v18 = v15.clone();
    v18.value = '8';
    v18.geometry.offset = new Point(0, 62);
    v1.insert(v18);

    let v19 = v15.clone();
    v19.value = 'clk';
    v19.geometry.x = 0.5;
    v19.geometry.y = 1;
    v19.geometry.width = 10;
    v19.geometry.height = 4;
    // NOTE: portConstraint is defined for east direction, so must be inverted here
    v19.style = {
      shape: 'triangle',
      direction: 'north',
      spacingBottom: 12,
      align: 'center',
      portConstraint: 'horizontal',
      fontSize: 8,
      strokeColor,
      routingCenterY: 0.5,
    };
    v19.geometry.offset = new Point(-4, -4);
    v1.insert(v19);

    let v2 = graph.insertVertex(parent, null, 'R1', 220, 220, 80, 20, {
      shape: 'resistor',
      verticalLabelPosition: 'top',
      verticalAlign: 'bottom',
    });

    // Uses implementation of connection points via constraints (see above)
    //v2.setConnectable(false);

    /*let v21 = graph.insertVertex(v2, null, 'A', 0, 0.5, 10, 1,
        'shape=none;spacingBottom=11;spacingLeft=1;align=left;fontSize=8;'+
        'fontColor=#4c4c4c;strokeColor=#909090;');
      v21.geometry.relative = true;
      v21.geometry.offset = new Point(0, -1);

      let v22 = graph.insertVertex(v2, null, 'B', 1, 0.5, 10, 1,
        'spacingBottom=11;spacingLeft=1;align=left;fontSize=8;'+
        'fontColor=#4c4c4c;strokeColor=#909090;');
      v22.geometry.relative = true;
      v22.geometry.offset = new Point(-10, -1);*/

    let v3 = graph.addCell(cellArrayUtils.cloneCell(v1));
    v3.value = 'J3';
    v3.geometry.x = 420;
    v3.geometry.y = 340;

    // Connection constraints implemented in edges, alternatively this
    // can be implemented using references, see: portrefs.html
    let e1 = graph.insertEdge(parent, null, 'e1', v1.getChildAt(7), v2, {
      entryX: 0,
      entryY: 0.5,
      entryPerimeter: 0,
    });
    e1.geometry.points = [new Point(180, 110)];

    let e2 = graph.insertEdge(parent, null, 'e2', v1.getChildAt(4), v2, {
      entryX: 1,
      entryY: 0.5,
      entryPerimeter: 0,
    });
    e2.geometry.points = [new Point(320, 50), new Point(320, 230)];

    let e3 = graph.insertEdge(parent, null, 'crossover', e1, e2);
    e3.geometry.setTerminalPoint(new Point(180, 140), true);
    e3.geometry.setTerminalPoint(new Point(320, 140), false);

    //  let e1 = graph.insertEdge(parent, null, 'e1', v1.getChildAt(7), v2.getChildAt(0));
    //  e1.geometry.points = [new Point(180, 140)];

    //  let e2 = graph.insertEdge(parent, null, '', v1.getChildAt(4), v2.getChildAt(1));
    //  e2.geometry.points = [new Point(320, 80)];

    //  let e3 = graph.insertEdge(parent, null, 'crossover', e1, e2);
    //  e3.geometry.setTerminalPoint(new Point(180, 160), true);
    //  e3.geometry.setTerminalPoint(new Point(320, 160), false);

    let e4 = graph.insertEdge(parent, null, 'e4', v2, v3.getChildAt(0), {
      exitX: 1,
      exitY: 0.5,
      entryPerimeter: 0,
    });
    e4.geometry.points = [new Point(380, 230)];

    let e5 = graph.insertEdge(parent, null, 'e5', v3.getChildAt(5), v1.getChildAt(0));
    e5.geometry.points = [new Point(500, 310), new Point(500, 20), new Point(50, 20)];

    let e6 = graph.insertEdge(parent, null, '');
    e6.geometry.setTerminalPoint(new Point(100, 500), true);
    e6.geometry.setTerminalPoint(new Point(600, 500), false);

    let e7 = graph.insertEdge(parent, null, 'e7', v3.getChildAt(7), e6);
    e7.geometry.setTerminalPoint(new Point(500, 500), false);
    e7.geometry.points = [new Point(500, 350)];
  });

  parentContainer.appendChild(
    DomHelpers.button('Zoom In', function () {
      graph.zoomIn();
    })
  );

  parentContainer.appendChild(
    DomHelpers.button('Zoom Out', function () {
      graph.zoomOut();
    })
  );

  // Undo/redo
  let undoManager = new UndoManager();
  let listener = function (sender, evt) {
    undoManager.undoableEditHappened(evt.getProperty('edit'));
  };
  graph.getDataModel().addListener(InternalEvent.UNDO, listener);
  graph.getView().addListener(InternalEvent.UNDO, listener);

  parentContainer.appendChild(
    DomHelpers.button('Undo', function () {
      undoManager.undo();
    })
  );

  parentContainer.appendChild(
    DomHelpers.button('Redo', function () {
      undoManager.redo();
    })
  );

  // Shows XML for debugging the actual model
  parentContainer.appendChild(
    DomHelpers.button('Delete', function () {
      graph.removeCells();
    })
  );

  // Wire-mode
  let checkbox = document.createElement('input');
  checkbox.setAttribute('type', 'checkbox');

  parentContainer.appendChild(checkbox);
  domUtils.write(parentContainer, 'Wire Mode');

  // Grid
  let checkbox2 = document.createElement('input');
  checkbox2.setAttribute('type', 'checkbox');
  checkbox2.setAttribute('checked', 'true');

  parentContainer.appendChild(checkbox2);
  domUtils.write(parentContainer, 'Grid');

  InternalEvent.addListener(checkbox2, 'click', function (evt) {
    if (checkbox2.checked) {
      container.style.background = 'url(./images/grid.gif)';
    } else {
      container.style.background = '';
    }
    container.style.backgroundColor = invert ? 'black' : 'white';
  });
  InternalEvent.disableContextMenu(container);

  return parentContainer;
};

export const Default = Template.bind({});
