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
  type AbstractCanvas2D,
  type AbstractGraph,
  type Cell,
  cellArrayUtils,
  CellEditorHandler,
  CellHighlight,
  type CellState,
  type CellStateStyle,
  cloneUtils,
  ConnectionConstraint,
  ConnectionHandler,
  ConnectionHandlerCellMarker,
  ConstraintHandler,
  CylinderShape,
  DomHelpers,
  domUtils,
  EdgeSegmentHandler,
  type EdgeStyleFunction,
  EdgeStyleRegistry,
  type EventObject,
  EventSource,
  eventUtils,
  Graph,
  type GraphPluginConstructor,
  GraphView,
  Guide,
  ImageBox,
  InternalEvent,
  InternalMouseEvent,
  mathUtils,
  PanningHandler,
  Point,
  PopupMenuHandler,
  Rectangle,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
  ShapeRegistry,
  StyleDefaultsConfig,
  styleUtils,
  TooltipHandler,
  UndoManager,
} from '@maxgraph/core';

import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import {
  configureImagesBasePath,
  createGraphContainer,
  createMainDiv,
} from './shared/configure.js';
import '@maxgraph/core/css/common.css'; // style required by RubberBand

export default {
  title: 'Connections/Wires',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    darkMode: {
      type: 'boolean',
      defaultValue: false,
    },
    ...rubberBandTypes,
    snapToGrid: {
      type: 'boolean',
      defaultValue: true,
    },
  },
  args: {
    ...contextMenuValues,
    ...globalValues,
    height: 640, // overrides global values to ensure no scrollbar is displayed when loading the example
    darkMode: false,
    ...rubberBandValues,
    snapToGrid: true,
  },
};

const backgroundImageWiresGrid = 'url("./images/wires-grid.gif")';

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();

  const parentContainer = createMainDiv(`<h3>Wires</h3>
    Drawing electrical and digital circuits with devices and wires.
    Demonstrate usage of custom Shapes, Edge Handlers and dark mode (use storybook controls).
    <br>
    To add a new edge,
    <ul>
    <li>To hover the source cell and left-click at the position you want to start the edge.</li>
    <li>To add bend/control points during the edge creation, left-click at the position you want to add the point.</li>
    <li>Then left-click at the target cell to finish the edge.</li>
    </ul>
  `);

  const container = createGraphContainer(args);
  parentContainer.appendChild(container);
  InternalEvent.disableContextMenu(container);
  container.style.overflow = 'hidden';
  container.style.cursor = 'crosshair';
  container.style.backgroundImage = backgroundImageWiresGrid;

  // Changes some default colors
  StyleDefaultsConfig.shadowColor = '#C0C0C0';

  const joinNodeSize = 7;
  const strokeWidth = 2;

  class MyCustomGraph extends Graph {
    override resetEdgesOnConnect = false;

    override createGraphView() {
      return new MyCustomGraphView(this);
    }

    // The mxGraph example was overriding the prototype of EdgeHandler, so it did not do this trick (https://github.com/jgraph/mxgraph/blob/v4.2.2/javascript/examples/wires.html)
    override createEdgeHandler(state: CellState, edgeStyle: EdgeStyleFunction | null) {
      const handlerKind = EdgeStyleRegistry.getHandlerKind(edgeStyle);
      if (handlerKind == 'wire') {
        return new WireEdgeHandler(state);
      }

      return super.createEdgeHandler(state, edgeStyle);
    }

    // Adds oval markers for edge-to-edge connections.
    override getCellStyle = (cell: Cell) => {
      let style = super.getCellStyle(cell);

      if (style && cell?.isEdge()) {
        style = cloneUtils.clone(style);

        if (cell.getTerminal(true)?.isEdge()) {
          style.startArrow = 'oval';
        }

        if (cell.getTerminal(false)?.isEdge()) {
          style.endArrow = 'oval';
        }
      }
      return style;
    };

    override getTooltipForCell(cell: Cell) {
      let tip = '';

      if (cell) {
        const src = cell.getTerminal(true);
        if (src) {
          tip += this.getTooltipForCell(src) + ' ';
        }

        const parent = cell.getParent();
        if (parent?.isVertex()) {
          tip += this.getTooltipForCell(parent) + '.';
        }

        tip += super.getTooltipForCell(cell);

        const trg = cell.getTerminal(false);
        if (trg != null) {
          tip += ' ' + this.getTooltipForCell(trg);
        }
      }
      return tip;
    }

    // Alternative solution for implementing connection points without child cells.
    // This can be extended as shown in the "PortRefs" story to allow for per-port incoming/outgoing direction.
    override getAllConnectionConstraints = (
      terminal: CellState | null,
      _source: boolean
    ): ConnectionConstraint[] | null => {
      const geo = terminal?.cell.getGeometry();
      if (
        geo &&
        !geo.relative &&
        terminal?.cell.isVertex() &&
        terminal?.cell.getChildCount() === 0
      ) {
        return [
          new ConnectionConstraint(new Point(0, 0.5), false),
          new ConnectionConstraint(new Point(1, 0.5), false),
        ];
      }
      return null;
    };
  }

  class MyCustomConstraintHandler extends ConstraintHandler {
    constructor(graph: AbstractGraph) {
      super(graph);
      // Replaces the port image
      this.pointImage = new ImageBox('./images/dot.gif', 10, 10);
    }
  }

  class MyCustomGuide extends Guide {
    // Alt disables guides
    override isEnabledForEvent(evt: any) {
      return !eventUtils.isAltDown(evt);
    }
  }

  // Switch for black background and bright styles
  const darkMode = args.darkMode ?? false;
  let MyCustomCellEditorHandler;

  if (darkMode) {
    container.style.backgroundColor = 'black';

    // White in-place editor text color
    MyCustomCellEditorHandler = class extends CellEditorHandler {
      override startEditing(cell: Cell, trigger: MouseEvent | null) {
        super.startEditing(cell, trigger);

        if (this.textarea != null) {
          this.textarea.style.color = '#FFFFFF';
        }
      }
    };
  } else {
    MyCustomCellEditorHandler = CellEditorHandler;
  }

  class MyCustomSelectionHandler extends SelectionHandler {
    override previewColor = darkMode ? 'white' : 'black';
    // Enables guides
    override guidesEnabled = true;

    override createGuide() {
      return new MyCustomGuide(this.graph, this.getGuideStates());
    }
  }

  class MyCustomCellHighlight extends CellHighlight {
    lastStyle: CellStateStyle = {};

    override highlight(state: CellState | null = null) {
      if (this.state != state) {
        if (this.state) {
          this.state.style = this.lastStyle;

          // Workaround for shape using current stroke width if no strokewidth defined
          this.state.style.strokeWidth ??= 1;
          this.state.style.strokeColor ??= 'none';

          if (this.state.shape) {
            this.state.view.graph.cellRenderer.configureShape(this.state);
            this.state.shape.redraw();
          }
        }

        if (state) {
          this.lastStyle = state.style;
          state.style = cloneUtils.clone(state.style);
          state.style.strokeColor = '#00ff00';
          state.style.strokeWidth = 3;

          if (state.shape) {
            state.view.graph.cellRenderer.configureShape(state);
            state.shape.redraw();
          }
        }
        this.state = state ?? null;
      }
    }
  }

  class MyCustomConnectionHandlerCellMarker extends ConnectionHandlerCellMarker {
    protected override createCellHighlight(graph: AbstractGraph): CellHighlight {
      return new MyCustomCellHighlight(graph);
    }

    // Uses complete area of cell for new connections (no hotspot)
    override intersects(_state: CellState, _evt: InternalMouseEvent): boolean {
      return true;
    }
  }

  class MyCustomConnectionHandler extends ConnectionHandler {
    // If connect preview is not moved away then getCellAt is used to detect the cell under
    // the mouse if the mouse is over the preview shape in IE (no event transparency), ie.
    // the built-in hit-detection of the HTML document will not be used in this case.
    override movePreviewAway = false;
    override waypointsEnabled = true;

    // Starts connections on the background in wire-mode
    override isStartEvent(me: InternalMouseEvent): boolean {
      return checkboxWireMode.checked || super.isStartEvent(me);
    }

    // Avoids any connections for gestures within tolerance except when in wire-mode or when over a port
    override mouseUp(sender: EventSource, me: InternalMouseEvent) {
      if (this.first != null && this.previous != null) {
        const point = styleUtils.convertPoint(this.graph.container, me.getX(), me.getY());
        const dx = Math.abs(point.x - this.first.x);
        const dy = Math.abs(point.y - this.first.y);

        if (dx < this.graph.tolerance && dy < this.graph.tolerance) {
          // Selects edges in non-wire mode for single clicks, but starts
          // connecting for non-edges regardless of wire-mode
          if (!checkboxWireMode.checked && this.previous.cell.isEdge()) {
            this.reset();
          }
          return;
        }
      }
      super.mouseUp(sender, me);
    }

    // Overrides methods to preview and create new edges.
    // Sets source terminal point for edge-to-edge connections.
    override createEdgeState(me?: InternalMouseEvent): CellState | null {
      const edge = this.graph.createEdge();

      if (this.sourceConstraint?.point && this.previous) {
        edge.style.exitX = this.sourceConstraint.point.x;
        edge.style.exitY = this.sourceConstraint.point.y;
      } else if (me?.getCell()?.isEdge()) {
        const scale = this.graph.view.scale;
        const tr = this.graph.view.translate;
        const pt = new Point(
          this.graph.snap(me.getGraphX() / scale) - tr.x,
          this.graph.snap(me.getGraphY() / scale) - tr.y
        );
        edge.geometry?.setTerminalPoint(pt, true);
      }

      return this.graph.view.createState(edge);
    }

    // Uses right mouse button to create edges on background (see also: lines 67 ff)
    override isStopEvent(me: InternalMouseEvent) {
      return me.getState() != null || eventUtils.isRightMouseButton(me.getEvent());
    }

    // Updates target terminal point for edge-to-edge connections.
    override updateCurrentState(me: InternalMouseEvent, point: Point) {
      super.updateCurrentState(me, point);

      if (this.edgeState) {
        this.edgeState.cell.geometry?.setTerminalPoint(null, false);

        if (this.shape && this.currentState?.cell.isEdge()) {
          const scale = this.graph.view.scale;
          const tr = this.graph.view.translate;
          const pt = new Point(
            this.graph.snap(me.getGraphX() / scale) - tr.x,
            this.graph.snap(me.getGraphY() / scale) - tr.y
          );
          this.edgeState.cell.geometry?.setTerminalPoint(pt, false);
        }
      }
    }

    // Adds in-place highlighting for complete cell area (no hotspot).
    override createMarker() {
      return new MyCustomConnectionHandlerCellMarker(this.graph, this);
    }

    override createConstraintHandler() {
      return new MyCustomConstraintHandler(this.graph);
    }

    // Makes sure non-relative cells can only be connected via constraints
    override isConnectableCell(cell: Cell) {
      if (cell.isEdge()) {
        return true;
      } else {
        const geo = cell.getGeometry();
        return geo?.relative ?? false;
      }
    }
  }

  // Updates connection points before the routing is called.
  type CustomCellStateStyle = CellStateStyle & {
    sourceConstraint?: 'horizontal' | 'vertical';
    targetConstraint?: 'horizontal' | 'vertical';
  };

  class MyCustomGraphView extends GraphView {
    // Computes the position of edge to edge connection points.
    override updateFixedTerminalPoint(
      edge: CellState,
      terminal: CellState | null,
      source: boolean,
      constraint: ConnectionConstraint | null
    ) {
      let pt = null;

      // add check for terminal which didn't exist in the mxGraph example
      // otherwise sometimes in the story, it can be undefined and generate an error like this:
      // Uncaught TypeError: can't access property "style", terminal is null
      //   getPerimeterBounds GraphView.js:1249
      //   getConnectionPoint ConnectionsMixin.js:135
      //   updateFixedTerminalPoint Wires.stories.ts:260
      if (constraint && terminal) {
        pt = this.graph.getConnectionPoint(terminal, constraint);
      }

      if (!pt) {
        const s = this.scale;
        const tr = this.translate;
        const orig = edge.origin;
        const geo = edge.cell.getGeometry()!;
        pt = geo.getTerminalPoint(source);

        // Computes edge-to-edge connection point
        if (pt) {
          pt = new Point(s * (tr.x + pt.x + orig.x), s * (tr.y + pt.y + orig.y));

          // Finds nearest segment on edge and computes intersection
          if (terminal?.absolutePoints) {
            const seg = mathUtils.findNearestSegment(terminal, pt.x, pt.y);

            // Finds orientation of the segment
            const p0 = terminal.absolutePoints[seg];
            const pe = terminal.absolutePoints[seg + 1];
            const horizontal = p0!.x - pe!.x === 0;

            // Stores the segment in the edge state
            const key = source ? 'sourceConstraint' : 'targetConstraint';
            (edge.style as CustomCellStateStyle)[key] = horizontal
              ? 'horizontal'
              : 'vertical';

            // Keeps the coordinate within the segment bounds
            if (horizontal) {
              pt.x = p0!.x;
              pt.y = Math.min(pt.y, Math.max(p0!.y, pe!.y));
              pt.y = Math.max(pt.y, Math.min(p0!.y, pe!.y));
            } else {
              pt.y = p0!.y;
              pt.x = Math.min(pt.x, Math.max(p0!.x, pe!.x));
              pt.x = Math.max(pt.x, Math.min(p0!.x, pe!.x));
            }
          }
        }
        // Computes constraint connection points on vertices and ports
        else if (terminal?.cell.geometry?.relative) {
          pt = new Point(
            this.getRoutingCenterX(terminal),
            this.getRoutingCenterY(terminal)
          );
        }

        // Snaps point to grid
        if (args.snapToGrid) {
          if (pt != null) {
            const tr = this.graph.view.translate;
            const s = this.graph.view.scale;

            pt.x = (this.graph.snap(pt.x / s - tr.x) + tr.x) * s;
            pt.y = (this.graph.snap(pt.y / s - tr.y) + tr.y) * s;
          }
        }
      }

      edge.setAbsoluteTerminalPoint(pt, source);
    }
  }

  // Updates the terminal and control points in the cloned preview.
  class WireEdgeHandler extends EdgeSegmentHandler {
    constructor(state: CellState) {
      super(state);
      // updateConstraintHandlerPointImage(this);
      // Enables snapping waypoints to terminals
      this.snapToTerminals = true;
    }

    protected override createConstraintHandler(): ConstraintHandler {
      return new MyCustomConstraintHandler(this.graph);
    }

    override clonePreviewState(point: Point, terminal: Cell | null) {
      const clone = super.clonePreviewState(point, terminal);
      clone.cell = clone.cell.clone();

      if (this.isSource || this.isTarget) {
        clone.cell.geometry = clone.cell.geometry?.clone() ?? null;

        // Sets the terminal point of an edge if we're moving one of the endpoints
        if (clone.cell.isEdge()) {
          // TODO: Only set this if the target or source terminal is an edge
          clone.cell.geometry?.setTerminalPoint(point, this.isSource);
        } else {
          clone.cell.geometry?.setTerminalPoint(null, this.isSource);
        }
      }

      return clone;
    }

    override isConnectableCell(cell: Cell) {
      return (
        this.graph
          .getPlugin<ConnectionHandler>('ConnectionHandler')
          ?.isConnectableCell(cell) ?? true
      );
    }

    override connect(
      edge: Cell,
      terminal: Cell,
      isSource: boolean,
      isClone: boolean,
      me: InternalMouseEvent
    ): Cell {
      let result: Cell | null = null;
      const model = this.graph.getDataModel();

      model.beginUpdate();
      try {
        result = super.connect(edge, terminal, isSource, isClone, me);
        let geo = result.getGeometry();

        if (geo) {
          geo = geo.clone();
          let pt: Point | null = null;

          if (terminal.isEdge()) {
            pt = this.abspoints[this.isSource ? 0 : this.abspoints.length - 1]!; // here, we know that the point exists in the array
            pt.x = pt.x / this.graph.view.scale - this.graph.view.translate.x;
            pt.y = pt.y / this.graph.view.scale - this.graph.view.translate.y;

            const pstate = this.graph.getView().getState(edge.getParent()!); // here, we know that the edge has a parent

            if (pstate) {
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

    override createMarker() {
      const marker = super.createMarker();
      // Adds in-place highlighting when reconnecting existing edges
      marker.highlight.highlight =
        this.graph.getPlugin<ConnectionHandler>(
          'ConnectionHandler'
        )!.marker.highlight.highlight;
      return marker;
    }
  }

  /**
   * Implements a custom resistor shape. Direction currently ignored here.
   */
  class ResistorShape extends CylinderShape {
    override redrawPath(
      c: AbstractCanvas2D,
      _x: number,
      _y: number,
      w: number,
      h: number,
      isForeground = false
    ) {
      const dx = w / 16;

      if (isForeground) {
        c.moveTo(0, h / 2);
        c.lineTo(2 * dx, h / 2);
        c.lineTo(3 * dx, 0);
        c.lineTo(5 * dx, h);
        c.lineTo(7 * dx, 0);
        c.lineTo(9 * dx, h);
        c.lineTo(11 * dx, 0);
        c.lineTo(13 * dx, h);
        c.lineTo(14 * dx, h / 2);
        c.lineTo(16 * dx, h / 2);
        c.end();
      }
    }
  }

  ShapeRegistry.add('resistor', ResistorShape);

  const WireConnector: EdgeStyleFunction = function (
    state,
    source,
    target,
    hints,
    result
  ) {
    // Creates array of all way- and terminal points
    const pts = state.absolutePoints;
    let horizontal = true;

    // Gets the initial connection from the source terminal or edge
    if (source) {
      if (source.cell.isEdge()) {
        horizontal =
          (state.style as CustomCellStateStyle).sourceConstraint == 'horizontal';
      } else {
        // mxGraph implementation originally uses an existing property for a different purpose, we should use a dedicated routing property
        // @ts-expect-error portConstraint used with a different purpose here
        horizontal = source.style.portConstraint != 'vertical';

        // Checks the direction of the shape and rotates
        const direction = source.style.direction;

        if (direction == 'north' || direction == 'south') {
          horizontal = !horizontal;
        }
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

    const first = pt;

    // Adds the waypoints
    let hint: Point | null = null;
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

      for (const hintElem of hints) {
        horizontal = !horizontal;
        hint = state.view.transformControlPoint(state, hintElem);

        if (horizontal) {
          if (pt!.y !== hint!.y) {
            pt!.y = hint!.y;
            result.push(pt!.clone());
          }
        } else if (pt!.x !== hint!.x) {
          pt!.x = hint!.x;
          result.push(pt!.clone());
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
      if (pt!.y !== hint!.y && first!.x !== pt!.x) {
        result.push(new Point(pt!.x, hint!.y));
      }
    } else if (pt!.x !== hint!.x && first!.y !== pt!.y) {
      result.push(new Point(hint!.x, pt!.y));
    }
  };

  EdgeStyleRegistry.add('wireEdgeStyle', WireConnector, {
    isOrthogonal: true,
    handlerKind: 'wire',
  });

  const plugins: GraphPluginConstructor[] = [
    MyCustomCellEditorHandler,
    TooltipHandler,
    SelectionCellsHandler,
    PopupMenuHandler,
    MyCustomConnectionHandler,
    MyCustomSelectionHandler,
    PanningHandler,
  ];
  // Adds rubberband selection
  if (args.rubberBand) plugins.push(RubberBandHandler);

  const graph = new MyCustomGraph(container, undefined, plugins);

  const labelBackground = darkMode ? '#000000' : '#FFFFFF';
  const fontColor = darkMode ? '#FFFFFF' : '#000000';
  const strokeColor = darkMode ? '#C0C0C0' : '#000000';
  const fillColor = darkMode ? 'none' : '#FFFFFF';

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

  // Adds a special tooltip for edges
  graph.setTooltips(true);

  let style = graph.getStylesheet().getDefaultEdgeStyle();
  delete style.endArrow;
  style.strokeColor = strokeColor;
  style.labelBackgroundColor = labelBackground;
  style.edgeStyle = 'wireEdgeStyle';
  style.fontColor = fontColor;
  style.fontSize = 9;
  style.movable = false;
  style.strokeWidth = strokeWidth;

  // Sets join node size
  style.startSize = joinNodeSize;
  style.endSize = joinNodeSize;

  style = graph.getStylesheet().getDefaultVertexStyle();
  style.gradientDirection = 'south';
  style.strokeColor = strokeColor;
  style.fillColor = 'none';
  style.fontColor = fontColor;
  style.fontStyle = 1;
  style.fontSize = 12;
  style.resizable = false;
  style.rounded = true;
  style.strokeWidth = strokeWidth;

  const parent = graph.getDefaultParent();

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'J1', 80, 40, 40, 80, {
      verticalLabelPosition: 'top',
      verticalAlign: 'bottom',
      shadow: true,
      fillColor,
    });
    v1.setConnectable(false);

    const v11 = graph.insertVertex(v1, null, '1', 0, 0, 10, 16, {
      shape: 'line',
      align: 'left',
      verticalAlign: 'middle',
      fontSize: 10,
      routingCenterX: -0.5,
      spacingLeft: 12,
      fontColor,
      strokeColor,
    });
    v11.geometry!.relative = true;
    v11.geometry!.offset = new Point(-v11.geometry!.width, 2);
    const v12 = v11.clone();
    v12.value = '2';
    v12.geometry!.offset = new Point(-v11.geometry!.width, 22);
    v1.insert(v12);
    const v13 = v11.clone();
    v13.value = '3';
    v13.geometry!.offset = new Point(-v11.geometry!.width, 42);
    v1.insert(v13);
    const v14 = v11.clone();
    v14.value = '4';
    v14.geometry!.offset = new Point(-v11.geometry!.width, 62);
    v1.insert(v14);

    const v15 = v11.clone();
    v15.value = '5';
    v15.geometry!.x = 1;
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
    v15.geometry!.offset = new Point(0, 2);
    v1.insert(v15);
    const v16 = v15.clone();
    v16.value = '6';
    v16.geometry!.offset = new Point(0, 22);
    v1.insert(v16);
    const v17 = v15.clone();
    v17.value = '7';
    v17.geometry!.offset = new Point(0, 42);
    v1.insert(v17);
    const v18 = v15.clone();
    v18.value = '8';
    v18.geometry!.offset = new Point(0, 62);
    v1.insert(v18);

    const v19 = v15.clone();
    v19.value = 'clk';
    if (v19.geometry) {
      v19.geometry.x = 0.5;
      v19.geometry.y = 1;
      v19.geometry.width = 10;
      v19.geometry.height = 4;
    }
    // NOTE: portConstraint is defined for east direction, so must be inverted here
    v19.style = {
      shape: 'triangle',
      direction: 'north',
      spacingBottom: 12,
      align: 'center',
      // @ts-expect-error - portConstraint not used as usual, we should use a dedicated routing property
      portConstraint: 'horizontal',
      fontSize: 8,
      strokeColor,
      routingCenterY: 0.5,
    };
    v19.geometry!.offset = new Point(-4, -4);
    v1.insert(v19);

    const v2 = graph.insertVertex(parent, null, 'R1', 220, 220, 80, 20, {
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

    const v3 = graph.addCell(cellArrayUtils.cloneCell(v1)!); // cloneCell returns null only if the cell is null, which is not the case here
    v3.value = 'J3';
    v3.geometry!.x = 420;
    v3.geometry!.y = 340;

    // Connection constraints implemented in edges, alternatively this
    // can be implemented using references, see: portrefs.html
    const e1 = graph.insertEdge(parent, null, 'e1', v1.getChildAt(7), v2, {
      entryX: 0,
      entryY: 0.5,
      entryPerimeter: false,
    });
    e1.geometry!.points = [new Point(180, 110)];

    const e2 = graph.insertEdge(parent, null, 'e2', v1.getChildAt(4), v2, {
      entryX: 1,
      entryY: 0.5,
      entryPerimeter: false,
    });
    e2.geometry!.points = [new Point(320, 50), new Point(320, 230)];

    const e3 = graph.insertEdge(parent, null, 'crossover', e1, e2);
    e3.geometry!.setTerminalPoint(new Point(180, 140), true);
    e3.geometry!.setTerminalPoint(new Point(320, 140), false);

    //  let e1 = graph.insertEdge(parent, null, 'e1', v1.getChildAt(7), v2.getChildAt(0));
    //  e1.geometry.points = [new Point(180, 140)];

    //  let e2 = graph.insertEdge(parent, null, '', v1.getChildAt(4), v2.getChildAt(1));
    //  e2.geometry.points = [new Point(320, 80)];

    //  let e3 = graph.insertEdge(parent, null, 'crossover', e1, e2);
    //  e3.geometry.setTerminalPoint(new Point(180, 160), true);
    //  e3.geometry.setTerminalPoint(new Point(320, 160), false);

    const e4 = graph.insertEdge(parent, null, 'e4', v2, v3.getChildAt(0), {
      exitX: 1,
      exitY: 0.5,
      entryPerimeter: false,
    });
    e4.geometry!.points = [new Point(380, 230)];

    const e5 = graph.insertEdge(parent, null, 'e5', v3.getChildAt(5), v1.getChildAt(0));
    e5.geometry!.points = [new Point(500, 310), new Point(500, 20), new Point(50, 20)];

    const e6 = graph.insertEdge(parent, null, '');
    e6.geometry!.setTerminalPoint(new Point(100, 500), true);
    e6.geometry!.setTerminalPoint(new Point(600, 500), false);

    const e7 = graph.insertEdge(parent, null, 'e7', v3.getChildAt(7), e6);
    e7.geometry!.setTerminalPoint(new Point(500, 500), false);
    e7.geometry!.points = [new Point(500, 350)];
  });

  // Controls
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
  const undoManager = new UndoManager();
  const listener = function (_sender: any, evt: EventObject) {
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
  const checkboxWireMode = document.createElement('input');
  checkboxWireMode.setAttribute('type', 'checkbox');
  checkboxWireMode.setAttribute(
    'title',
    'Starts connections on the background in wire-mode'
  );

  parentContainer.appendChild(checkboxWireMode);
  domUtils.write(parentContainer, 'Wire Mode');

  // Grid
  const checkboxGrid = document.createElement('input');
  checkboxGrid.setAttribute('type', 'checkbox');
  checkboxGrid.setAttribute('title', 'Display grid in the background (click to toggle)');
  checkboxGrid.setAttribute('checked', 'true');

  parentContainer.appendChild(checkboxGrid);
  domUtils.write(parentContainer, 'Grid');

  InternalEvent.addListener(checkboxGrid, 'click', function () {
    if (checkboxGrid.checked) {
      container.style.background = backgroundImageWiresGrid;
    } else {
      container.style.background = '';
    }
    container.style.backgroundColor = darkMode ? 'black' : 'white';
  });

  return parentContainer;
};

export const Default = Template.bind({});
