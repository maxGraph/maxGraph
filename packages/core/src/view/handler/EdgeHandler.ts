/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import CellMarker from '../cell/CellMarker';
import Point from '../geometry/Point';
import {
  CURSOR,
  DEFAULT_HOTSPOT,
  DEFAULT_INVALID_COLOR,
  DEFAULT_VALID_COLOR,
  DIALECT,
  HIGHLIGHT_STROKEWIDTH,
  LOCKED_HANDLE_FILLCOLOR,
  NONE,
  OUTLINE_HIGHLIGHT_COLOR,
  OUTLINE_HIGHLIGHT_STROKEWIDTH,
} from '../../util/Constants';
import {
  contains,
  findNearestSegment,
  intersects,
  ptSegDistSq,
} from '../../util/mathUtils';
import { convertPoint, getOffset, setOpacity } from '../../util/styleUtils';
import EllipseShape from '../geometry/node/EllipseShape';
import ImageShape from '../geometry/node/ImageShape';
import RectangleShape from '../geometry/node/RectangleShape';
import ConnectionConstraint from '../other/ConnectionConstraint';
import InternalEvent from '../event/InternalEvent';
import ConstraintHandler from './ConstraintHandler';
import Rectangle from '../geometry/Rectangle';
import Client from '../../Client';
import EdgeStyle from '../style/EdgeStyle';
import {
  getClientX,
  getClientY,
  isAltDown,
  isMouseEvent,
  isShiftDown,
} from '../../util/EventUtils';
import type { AbstractGraph } from '../AbstractGraph';
import CellState from '../cell/CellState';
import Shape from '../geometry/Shape';
import { CellHandle, ColorValue, Listenable } from '../../types';
import InternalMouseEvent from '../event/InternalMouseEvent';
import Cell from '../cell/Cell';
import ImageBox from '../image/ImageBox';
import EventSource from '../event/EventSource';
import type SelectionHandler from '../plugins/SelectionHandler';
import { equalPoints } from '../../util/arrayUtils';
import { EdgeHandlerConfig, HandleConfig } from './config';

/**
 * Graph event handler that reconnects edges, modifies control points and the edge label location.
 *
 * Uses {@link CellMarker} for finding and highlighting new source and target vertices.
 *
 * This handler is automatically created in {@link Graph.createHandler} for each selected edge.
 *
 * Some elements of this handler and its subclasses can be configured using {@link EdgeHandlerConfig}.
 */
class EdgeHandler {
  /**
   * Reference to the enclosing {@link Graph}.
   */
  graph: AbstractGraph;

  /**
   * Reference to the {@link CellState} being modified.
   */
  state: CellState;

  /**
   * Holds the {@link CellMarker} which is used for highlighting terminals.
   */
  marker: CellMarker;

  /**
   * Holds the {@link ConstraintHandler} used for drawing and highlighting
   * constraints.
   */
  constraintHandler: ConstraintHandler;

  /**
   * Holds the current validation error while a connection is being changed.
   */
  error: string | null = null;

  /**
   * Holds the {@link Shape} that represents the preview edge.
   */
  shape: Shape;

  /**
   * Holds the {@link Shape}s that represent the points.
   */
  bends: Shape[] = [];

  virtualBends: Shape[] | undefined;

  /**
   * Holds the {@link Shape} that represents the label position.
   */
  labelShape: Shape;

  /**
   * Specifies if cloning by control-drag is enabled.
   * @default true
   */
  cloneEnabled = true;

  /**
   * Specifies if removing bends by double click is enabled.
   * @default false
   */
  dblClickRemoveEnabled = false;

  /**
   * Specifies if removing bends by dropping them on other bends is enabled.
   * @default false
   */
  mergeRemoveEnabled = false;

  /**
   * Specifies if removing bends by creating straight segments should be enabled.
   * If enabled, this can be overridden by holding down the alt key while moving.
   * @default false
   */
  straightRemoveEnabled = false;

  /**
   * Specifies if the parent should be highlighted if a child cell is selected.
   * @default false
   */
  parentHighlightEnabled = false;

  /**
   * Specifies if bends should be added to the graph container.
   * This is updated in {@link constructor} based on whether the edge or one of its terminals has an HTML label in the container.
   */
  preferHtml = false;

  /**
   * Specifies if the bounds of handles should be used for hit-detection in IE.
   * @default true
   */
  allowHandleBoundsCheck = true;

  /**
   * Specifies if waypoints should snap to the routing centers of terminals.
   * @default false
   */
  snapToTerminals = false;

  /**
   * Optional {@link Image} to be used as handles.
   * @default null
   */
  handleImage: ImageBox | null = null;

  labelHandleImage: ImageBox | null = null;

  /**
   * Optional tolerance for hit-detection in {@link getHandleForEvent}.
   * @default 0
   */
  tolerance = 0;

  /**
   * Specifies if connections to the outline of a highlighted target should be
   * enabled. This will allow to place the connection point along the outline of
   * the highlighted target.
   * @default false
   */
  outlineConnect = false;

  /**
   * Specifies if the label handle should be moved if it intersects with another
   * handle. Uses {@link checkLabelHandle} for checking and moving.
   * @default false
   */
  manageLabelHandle = false;

  escapeHandler: (sender: Listenable, evt: Event) => void;

  currentPoint: Point | null = null;

  parentHighlight: RectangleShape | null = null;

  index: number | null = null;

  isSource = false;

  isTarget = false;

  label: Point;

  isLabel = false;

  points: Point[] = [];

  snapPoint: Point | null = null;

  abspoints: (Point | null)[] = [];

  customHandles: CellHandle[] | undefined;

  startX = 0;
  startY = 0;

  outline = true;

  active = true;

  constructor(state: CellState) {
    // `state.shape` must exists.
    this.state = state;

    this.graph = this.state.view.graph;
    this.marker = this.createMarker();
    this.constraintHandler = new ConstraintHandler(this.graph);

    // Clones the original points from the cell
    // and makes sure at least one point exists
    this.points = [];

    // Uses the absolute points of the state
    // for the initial configuration and preview
    this.abspoints = this.getSelectionPoints(this.state);
    this.shape = this.createSelectionShape(this.abspoints);
    this.shape.dialect =
      this.graph.dialect !== DIALECT.SVG ? DIALECT.MIXEDHTML : DIALECT.SVG;
    this.shape.init(this.graph.getView().getOverlayPane());
    this.shape.pointerEvents = false;
    this.shape.setCursor(CURSOR.MOVABLE_EDGE);
    InternalEvent.redirectMouseEvents(this.shape.node, this.graph, this.state);

    // Updates preferHtml
    this.preferHtml =
      this.state.text != null && this.state.text.node.parentNode === this.graph.container;

    if (!this.preferHtml) {
      // Checks source terminal
      const sourceState = this.state.getVisibleTerminalState(true);

      if (sourceState != null) {
        this.preferHtml =
          sourceState.text != null &&
          sourceState.text.node.parentNode === this.graph.container;
      }

      if (!this.preferHtml) {
        // Checks target terminal
        const targetState = this.state.getVisibleTerminalState(false);

        if (targetState != null) {
          this.preferHtml =
            targetState.text != null &&
            targetState.text.node.parentNode === this.graph.container;
        }
      }
    }

    const selectionHandler = this.graph.getPlugin<SelectionHandler>('SelectionHandler');

    // Creates bends for the non-routed absolute points
    // or bends that don't correspond to points
    if (
      selectionHandler &&
      (this.graph.getSelectionCount() < selectionHandler.maxCells ||
        selectionHandler.maxCells <= 0)
    ) {
      this.bends = this.createBends();

      if (this.isVirtualBendsEnabled()) {
        this.virtualBends = this.createVirtualBends();
      }
    }

    // Adds a rectangular handle for the label position
    this.label = new Point(this.state.absoluteOffset.x, this.state.absoluteOffset.y);
    this.labelShape = this.createLabelHandleShape();
    this.initBend(this.labelShape);
    this.labelShape.setCursor(CURSOR.LABEL_HANDLE);

    this.customHandles = this.createCustomHandles();

    this.updateParentHighlight();
    this.redraw();

    // Handles escape keystrokes
    this.escapeHandler = (_sender: Listenable, _evt: Event) => {
      const dirty = this.index != null;
      this.reset();

      if (dirty) {
        this.graph.cellRenderer.redraw(this.state, false, state.view.isRendering());
      }
    };

    this.state.view.graph.addListener(InternalEvent.ESCAPE, this.escapeHandler);
  }

  /**
   * Returns true if the parent highlight should be visible. This implementation
   * always returns true.
   */
  isParentHighlightVisible() {
    const parent = this.state.cell.getParent();
    return parent ? !this.graph.isCellSelected(parent) : null;
  }

  /**
   * Updates the highlight of the parent if {@link parentHighlightEnabled} is true.
   */
  updateParentHighlight() {
    if (!this.isDestroyed()) {
      const visible = this.isParentHighlightVisible();
      const parent = this.state.cell.getParent();
      const pstate = parent ? this.graph.view.getState(parent) : null;

      if (this.parentHighlight) {
        if (parent && parent.isVertex() && visible) {
          const b = this.parentHighlight.bounds;

          if (
            pstate &&
            b &&
            (b.x !== pstate.x ||
              b.y !== pstate.y ||
              b.width !== pstate.width ||
              b.height !== pstate.height)
          ) {
            this.parentHighlight.bounds = Rectangle.fromRectangle(pstate);
            this.parentHighlight.redraw();
          }
        } else {
          if (pstate && pstate.parentHighlight === this.parentHighlight) {
            pstate.parentHighlight = null;
          }

          this.parentHighlight.destroy();
          this.parentHighlight = null;
        }
      } else if (this.parentHighlightEnabled && visible) {
        if (parent && parent.isVertex() && pstate && !pstate.parentHighlight) {
          this.parentHighlight = this.createParentHighlightShape(pstate);
          // VML dialect required here for event transparency in IE
          this.parentHighlight.dialect = DIALECT.SVG;
          this.parentHighlight.pointerEvents = false;
          if (pstate.style.rotation) {
            this.parentHighlight.rotation = pstate.style.rotation;
          }
          this.parentHighlight.init(this.graph.getView().getOverlayPane());
          this.parentHighlight.redraw();

          // Shows highlight once per parent
          pstate.parentHighlight = this.parentHighlight;
        }
      }
    }
  }

  /**
   * Returns an array of custom handles. This implementation returns an empty array.
   */
  createCustomHandles(): CellHandle[] {
    return [];
  }

  /**
   * Returns true if virtual bends should be added. This returns true if
   * {@link virtualBendsEnabled} is true and the current style allows and
   * renders custom waypoints.
   */
  isVirtualBendsEnabled(evt?: Event) {
    return (
      EdgeHandlerConfig.virtualBendsEnabled &&
      (this.state.style.edgeStyle == null ||
        this.state.style.edgeStyle === NONE ||
        this.state.style.noEdgeStyle) &&
      this.state.style.shape !== 'arrow'
    );
  }

  /**
   * Returns true if the given cell allows new connections to be created. This implementation
   * always returns true.
   */
  isCellEnabled(cell: Cell) {
    return true;
  }

  /**
   * Returns true if the given event is a trigger to add a new Point. This
   * implementation returns true if shift is pressed.
   */
  isAddPointEvent(evt: MouseEvent) {
    return isShiftDown(evt);
  }

  /**
   * Returns true if the given event is a trigger to remove a point. This
   * implementation returns true if shift is pressed.
   */
  isRemovePointEvent(evt: MouseEvent) {
    return isShiftDown(evt);
  }

  /**
   * Returns the list of points that defines the selection stroke.
   */
  getSelectionPoints(state: CellState) {
    return state.absolutePoints;
  }

  /**
   * Creates the shape used to draw the selection border.
   */
  createParentHighlightShape(bounds: Rectangle) {
    const shape = new RectangleShape(
      Rectangle.fromRectangle(bounds),
      NONE,
      this.getSelectionColor()
    );
    shape.strokeWidth = this.getSelectionStrokeWidth();
    shape.isDashed = this.isSelectionDashed();

    return shape;
  }

  /**
   * Creates the shape used to draw the selection border.
   */
  createSelectionShape(points: (Point | null)[]) {
    const c = this.state.shape!.constructor as new () => Shape;

    const shape = new c();
    shape.outline = true;
    shape.apply(this.state);

    shape.isDashed = this.isSelectionDashed();
    shape.stroke = this.getSelectionColor();
    shape.isShadow = false;

    return shape;
  }

  /**
   * Returns {@link EdgeHandlerConfig.selectionColor}.
   */
  getSelectionColor() {
    return EdgeHandlerConfig.selectionColor;
  }

  /**
   * Returns {@link EdgeHandlerConfig.selectionStrokeWidth}.
   */
  getSelectionStrokeWidth() {
    return EdgeHandlerConfig.selectionStrokeWidth;
  }

  /**
   * Returns {@link EdgeHandlerConfig.selectionDashed}.
   */
  isSelectionDashed() {
    return EdgeHandlerConfig.selectionDashed;
  }

  /**
   * Returns true if the given cell is connectable. This is a hook to
   * disable floating connections. This implementation returns true.
   */
  isConnectableCell(cell: Cell) {
    return true;
  }

  /**
   * Creates and returns the {@link CellMarker} used in {@link marker}.
   */
  getCellAt(x: number, y: number) {
    return !this.outlineConnect ? this.graph.getCellAt(x, y) : null;
  }

  /**
   * Creates and returns the {@link CellMarker} used in {@link marker}.
   */
  createMarker() {
    return new EdgeHandlerCellMarker(this.graph, this);
  }

  /**
   * Returns the error message or an empty string if the connection for the
   * given source, target pair is not valid. Otherwise, it returns null. This
   * implementation uses {@link Graph#getEdgeValidationError}.
   *
   * @param source {@link Cell} that represents the source terminal.
   * @param target {@link Cell} that represents the target terminal.
   */
  validateConnection(source: Cell | null, target: Cell | null) {
    return this.graph.getEdgeValidationError(this.state.cell, source, target);
  }

  /**
   * Creates and returns the bends used for modifying the edge. This is
   * typically an array of {@link RectangleShape}.
   */
  createBends() {
    const { cell } = this.state;
    const bends = [];

    for (let i = 0; i < this.abspoints.length; i += 1) {
      if (this.isHandleVisible(i)) {
        const source = i === 0;
        const target = i === this.abspoints.length - 1;
        const terminal = source || target;

        if (terminal || this.graph.isCellBendable(cell)) {
          ((index) => {
            const bend = this.createHandleShape(index);
            this.initBend(bend, () => {
              if (this.dblClickRemoveEnabled) {
                this.removePoint(this.state, index);
              }
            });

            if (this.isHandleEnabled(i)) {
              bend.setCursor(terminal ? CURSOR.TERMINAL_HANDLE : CURSOR.BEND_HANDLE);
            }

            bends.push(bend);

            if (!terminal) {
              this.points.push(new Point(0, 0));
              bend.node.style.visibility = 'hidden';
            }
          })(i);
        }
      }
    }

    return bends;
  }

  /**
   * Creates and returns the bends used for modifying the edge. This is
   * typically an array of {@link RectangleShape}.
   */
  createVirtualBends() {
    const { cell } = this.state;
    const last = this.abspoints[0];
    const bends = [];

    if (this.graph.isCellBendable(cell)) {
      for (let i = 1; i < this.abspoints.length; i += 1) {
        ((bend) => {
          this.initBend(bend);
          bend.setCursor(CURSOR.VIRTUAL_BEND_HANDLE);
          bends.push(bend);
        })(this.createHandleShape());
      }
    }

    return bends;
  }

  /**
   * Creates the shape used to display the given bend.
   */
  isHandleEnabled(index: number) {
    return true;
  }

  /**
   * Returns true if the handle at the given index is visible.
   */
  isHandleVisible(index: number) {
    const source = this.state.getVisibleTerminalState(true);
    const target = this.state.getVisibleTerminalState(false);
    const geo = this.state.cell.getGeometry();
    const edgeStyle = geo
      ? this.graph.view.getEdgeStyle(this.state, geo.points || undefined, source, target)
      : null;

    return (
      edgeStyle !== EdgeStyle.EntityRelation ||
      index === 0 ||
      index === this.abspoints.length - 1
    );
  }

  /**
   * Creates the shape used to display the given bend.
   * Note that the index
   * - may be `null` for special cases, such as when called from {@link ElbowEdgeHandler.createVirtualBend}.
   * - is `null` for virtual handles.
   *
   * Only images and rectangles should be returned if support for HTML labels with not foreign objects is required.
   */
  createHandleShape(_index?: number): Shape {
    if (this.handleImage) {
      const shape = new ImageShape(
        new Rectangle(0, 0, this.handleImage.width, this.handleImage.height),
        this.handleImage.src
      );

      // Allows HTML rendering of the images
      shape.preserveImageAspect = false;

      return shape;
    }
    let s = HandleConfig.size;

    if (this.preferHtml) {
      s -= 1;
    }

    const shapeConstructor =
      EdgeHandlerConfig.handleShape === 'circle' ? EllipseShape : RectangleShape;
    return new shapeConstructor(
      new Rectangle(0, 0, s, s),
      HandleConfig.fillColor,
      HandleConfig.strokeColor
    );
  }

  /**
   * Creates the shape used to display the label handle.
   */
  createLabelHandleShape() {
    if (this.labelHandleImage) {
      const shape = new ImageShape(
        new Rectangle(0, 0, this.labelHandleImage.width, this.labelHandleImage.height),
        this.labelHandleImage.src
      );

      // Allows HTML rendering of the images
      shape.preserveImageAspect = false;

      return shape;
    }
    const s = HandleConfig.labelSize;
    return new RectangleShape(
      new Rectangle(0, 0, s, s),
      HandleConfig.labelFillColor,
      HandleConfig.strokeColor
    );
  }

  /**
   * Helper method to initialize the given bend.
   *
   * @param bend {@link Shape} that represents the bend to be initialized.
   * @param dblClick Optional function to be called on double click.
   */
  initBend(bend: Shape, dblClick?: (evt: MouseEvent) => void) {
    if (this.preferHtml) {
      bend.dialect = DIALECT.STRICTHTML;
      bend.init(this.graph.container);
    } else {
      bend.dialect = this.graph.dialect !== DIALECT.SVG ? DIALECT.MIXEDHTML : DIALECT.SVG;
      bend.init(this.graph.getView().getOverlayPane());
    }

    InternalEvent.redirectMouseEvents(
      bend.node,
      this.graph,
      this.state,
      null,
      null,
      null,
      dblClick
    );

    if (Client.IS_TOUCH) {
      bend.node.setAttribute('pointer-events', 'none');
    }
  }

  /**
   * Returns the index of the handle for the given event.
   */
  getHandleForEvent(me: InternalMouseEvent) {
    let result = null;

    // Connection highlight may consume events before they reach sizer handle
    const tol = !isMouseEvent(me.getEvent()) ? this.tolerance : 1;
    const hit =
      this.allowHandleBoundsCheck && tol > 0
        ? new Rectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol)
        : null;
    let minDistSq = Number.POSITIVE_INFINITY;

    function checkShape(shape: Shape | null) {
      if (
        shape &&
        shape.bounds &&
        shape.node &&
        shape.node.style.display !== 'none' &&
        shape.node.style.visibility !== 'hidden' &&
        (me.isSource(shape) || (hit && intersects(shape.bounds, hit)))
      ) {
        const dx = me.getGraphX() - shape.bounds.getCenterX();
        const dy = me.getGraphY() - shape.bounds.getCenterY();
        const tmp = dx * dx + dy * dy;

        if (tmp <= minDistSq) {
          minDistSq = tmp;

          return true;
        }
      }

      return false;
    }

    if (this.isCustomHandleEvent(me) && this.customHandles) {
      // Inverse loop order to match display order
      for (let i = this.customHandles.length - 1; i >= 0; i--) {
        if (checkShape(this.customHandles[i].shape)) {
          // LATER: Return reference to active shape
          return InternalEvent.CUSTOM_HANDLE - i;
        }
      }
    }

    if (me.isSource(this.state.text) || checkShape(this.labelShape)) {
      result = InternalEvent.LABEL_HANDLE;
    }

    for (let i = 0; i < this.bends.length; i += 1) {
      if (checkShape(this.bends[i])) {
        result = i;
      }
    }

    if (this.virtualBends && this.isAddVirtualBendEvent(me)) {
      for (let i = 0; i < this.virtualBends.length; i += 1) {
        if (checkShape(this.virtualBends[i])) {
          result = InternalEvent.VIRTUAL_HANDLE - i;
        }
      }
    }

    return result;
  }

  /**
   * Returns true if the given event allows virtual bends to be added. This
   * implementation returns true.
   */

  isAddVirtualBendEvent(me: InternalMouseEvent) {
    return true;
  }

  /**
   * Returns true if the given event allows custom handles to be changed. This
   * implementation returns true.
   */
  isCustomHandleEvent(me: InternalMouseEvent) {
    return true;
  }

  /**
   * Handles the event by checking if a special element of the handler
   * was clicked, in which case the index parameter is non-null. The
   * indices may be one of {@link InternalEvent.LABEL_HANDLE} or the number of the respective
   * control point. The source and target points are used for reconnecting
   * the edge.
   */
  mouseDown(sender: EventSource, me: InternalMouseEvent) {
    const handle = this.getHandleForEvent(me);

    if (handle !== null && this.bends[handle]) {
      const b = this.bends[handle].bounds;
      if (b) this.snapPoint = new Point(b.getCenterX(), b.getCenterY());
    }

    if (
      EdgeHandlerConfig.addBendOnShiftClickEnabled &&
      handle === null &&
      this.isAddPointEvent(me.getEvent())
    ) {
      this.addPoint(this.state, me.getEvent());
      me.consume();
    } else if (handle !== null && !me.isConsumed() && this.graph.isEnabled()) {
      const cell = me.getCell();

      if (
        EdgeHandlerConfig.removeBendOnShiftClickEnabled &&
        this.isRemovePointEvent(me.getEvent())
      ) {
        this.removePoint(this.state, handle);
      } else if (
        handle !== InternalEvent.LABEL_HANDLE ||
        (cell && this.graph.isLabelMovable(cell))
      ) {
        if (this.virtualBends && handle <= InternalEvent.VIRTUAL_HANDLE) {
          setOpacity(this.virtualBends[InternalEvent.VIRTUAL_HANDLE - handle].node, 100);
        }
        this.start(me.getX(), me.getY(), handle);
      }
      me.consume();
    }
  }

  /**
   * Starts the handling of the mouse gesture.
   */
  start(x: number, y: number, index: number) {
    this.startX = x;
    this.startY = y;

    this.isSource = this.bends.length === 0 ? false : index === 0;
    this.isTarget = this.bends.length === 0 ? false : index === this.bends.length - 1;
    this.isLabel = index === InternalEvent.LABEL_HANDLE;

    if (this.isSource || this.isTarget) {
      const { cell } = this.state;
      const terminal = cell.getTerminal(this.isSource);

      if (
        (terminal == null && this.graph.isTerminalPointMovable(cell, this.isSource)) ||
        (terminal != null &&
          this.graph.isCellDisconnectable(cell, terminal, this.isSource))
      ) {
        this.index = index;
      }
    } else {
      this.index = index;
    }

    // Hides other custom handles
    if (
      this.index !== null &&
      this.index <= InternalEvent.CUSTOM_HANDLE &&
      this.index > InternalEvent.VIRTUAL_HANDLE
    ) {
      if (this.customHandles != null) {
        for (let i = 0; i < this.customHandles.length; i += 1) {
          if (i !== InternalEvent.CUSTOM_HANDLE - this.index) {
            this.customHandles[i].setVisible(false);
          }
        }
      }
    }
  }

  /**
   * Returns a clone of the current preview state for the given point and terminal.
   */
  clonePreviewState(point: Point, terminal: Cell | null) {
    return this.state.clone();
  }

  /**
   * Returns the tolerance for the guides. Default value is
   * gridSize * scale / 2.
   */
  getSnapToTerminalTolerance() {
    return (this.graph.getGridSize() * this.graph.getView().scale) / 2;
  }

  /**
   * Hook for subclassers do show details while the handler is active.
   */

  updateHint(me: InternalMouseEvent, point: Point) {
    return;
  }

  /**
   * Hooks for subclassers to hide details when the handler gets inactive.
   */
  removeHint() {
    return;
  }

  /**
   * Hook for rounding the unscaled width or height. This uses Math.round.
   */
  roundLength(length: number) {
    return Math.round(length);
  }

  /**
   * Returns true if {@link snapToTerminals} is true and if alt is not pressed.
   */
  isSnapToTerminalsEvent(me: InternalMouseEvent) {
    return this.snapToTerminals && !isAltDown(me.getEvent());
  }

  /**
   * Returns the point for the given event.
   */
  getPointForEvent(me: InternalMouseEvent) {
    const view = this.graph.getView();
    const { scale } = view;
    const point = new Point(
      this.roundLength(me.getGraphX() / scale) * scale,
      this.roundLength(me.getGraphY() / scale) * scale
    );

    const tt = this.getSnapToTerminalTolerance();
    let overrideX = false;
    let overrideY = false;

    if (tt > 0 && this.isSnapToTerminalsEvent(me)) {
      const snapToPoint = (pt: Point | null) => {
        if (pt) {
          const { x } = pt;
          if (Math.abs(point.x - x) < tt) {
            point.x = x;
            overrideX = true;
          }

          const { y } = pt;
          if (Math.abs(point.y - y) < tt) {
            point.y = y;
            overrideY = true;
          }
        }
      };

      // Temporary function
      const snapToTerminal = (terminal: CellState | null) => {
        if (terminal) {
          snapToPoint(
            new Point(view.getRoutingCenterX(terminal), view.getRoutingCenterY(terminal))
          );
        }
      };

      snapToTerminal(this.state.getVisibleTerminalState(true));
      snapToTerminal(this.state.getVisibleTerminalState(false));

      for (let i = 0; i < this.state.absolutePoints.length; i += 1) {
        snapToPoint(this.state.absolutePoints[i]);
      }
    }

    if (this.graph.isGridEnabledEvent(me.getEvent())) {
      const tr = view.translate;

      if (!overrideX) {
        point.x = (this.graph.snap(point.x / scale - tr.x) + tr.x) * scale;
      }
      if (!overrideY) {
        point.y = (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale;
      }
    }
    return point;
  }

  /**
   * Updates the given preview state taking into account the state of the constraint handler.
   */
  getPreviewTerminalState(me: InternalMouseEvent) {
    this.constraintHandler.update(
      me,
      this.isSource,
      true,
      me.isSource(this.marker.highlight.shape) ? null : this.currentPoint
    );

    if (this.constraintHandler.currentFocus && this.constraintHandler.currentConstraint) {
      // Handles special case where grid is large and connection point is at actual point in which
      // case the outline is not followed as long as we're < gridSize / 2 away from that point
      if (
        this.marker.highlight &&
        this.marker.highlight.shape &&
        this.marker.highlight.state &&
        this.marker.highlight.state.cell === this.constraintHandler.currentFocus.cell
      ) {
        // Direct repaint needed if cell already highlighted
        if (this.marker.highlight.shape.stroke !== 'transparent') {
          this.marker.highlight.shape.stroke = 'transparent';
          this.marker.highlight.repaint();
        }
      } else {
        this.marker.markCell(this.constraintHandler.currentFocus.cell, 'transparent');
      }

      const other = this.graph.view.getTerminalPort(
        this.state,
        this.graph.view.getState(
          this.state.cell.getTerminal(!this.isSource) as Cell
        ) as CellState,
        !this.isSource
      );
      const otherCell = other ? other.cell : null;
      const source = this.isSource ? this.constraintHandler.currentFocus.cell : otherCell;
      const target = this.isSource ? otherCell : this.constraintHandler.currentFocus.cell;

      // Updates the error message of the handler
      this.error = this.validateConnection(source, target);
      let result = null;

      if (this.error === null) {
        result = this.constraintHandler.currentFocus;
      }

      if (this.error !== null || (result && !this.isCellEnabled(result.cell))) {
        this.constraintHandler.reset();
      }

      return result;
    }
    if (!this.graph.isIgnoreTerminalEvent(me.getEvent())) {
      this.marker.process(me);
      const state = this.marker.getValidState();

      if (state && !this.isCellEnabled(state.cell)) {
        this.constraintHandler.reset();
        this.marker.reset();
      }

      return this.marker.getValidState();
    }
    this.marker.reset();

    return null;
  }

  /**
   * Updates the given preview state taking into account the state of the constraint handler.
   *
   * @param pt {@link Point} that contains the current pointer position.
   * @param me Optional {@link MouseEvent} that contains the current event.
   */
  getPreviewPoints(pt: Point, me?: InternalMouseEvent) {
    const geometry = this.state.cell.getGeometry();

    if (!geometry) return null;

    let points = (geometry.points || []).slice();
    const point = new Point(pt.x, pt.y);
    let result: Point[] | null = null;

    if (!this.isSource && !this.isTarget && this.index !== null) {
      this.convertPoint(point, false);

      // Adds point from virtual bend
      if (this.index <= InternalEvent.VIRTUAL_HANDLE) {
        points.splice(InternalEvent.VIRTUAL_HANDLE - this.index, 0, point);
      }

      // Removes point if dragged on terminal point
      if (!this.isSource && !this.isTarget) {
        for (let i = 0; i < this.bends.length; i += 1) {
          if (i !== this.index) {
            const bend = this.bends[i];

            if (bend && contains(bend.bounds as Rectangle, pt.x, pt.y)) {
              if (this.index <= InternalEvent.VIRTUAL_HANDLE) {
                points.splice(InternalEvent.VIRTUAL_HANDLE - this.index, 1);
              } else {
                points.splice(this.index - 1, 1);
              }

              result = points;
            }
          }
        }

        // Removes point if user tries to straighten a segment
        if (!result && this.straightRemoveEnabled && (!me || !isAltDown(me.getEvent()))) {
          const tol = this.graph.getEventTolerance() * this.graph.getEventTolerance();
          const abs = this.state.absolutePoints.slice();
          abs[this.index] = pt;

          // Handes special case where removing waypoint affects tolerance (flickering)
          const src = this.state.getVisibleTerminalState(true);

          if (src != null) {
            const c = this.graph.getConnectionConstraint(this.state, src, true);

            // Checks if point is not fixed
            if (c == null || this.graph.getConnectionPoint(src, c) == null) {
              abs[0] = new Point(
                src.view.getRoutingCenterX(src),
                src.view.getRoutingCenterY(src)
              );
            }
          }

          const trg = this.state.getVisibleTerminalState(false);

          if (trg != null) {
            const c = this.graph.getConnectionConstraint(this.state, trg, false);

            // Checks if point is not fixed
            if (c == null || this.graph.getConnectionPoint(trg, c) == null) {
              abs[abs.length - 1] = new Point(
                trg.view.getRoutingCenterX(trg),
                trg.view.getRoutingCenterY(trg)
              );
            }
          }

          const checkRemove = (idx: number, tmp: Point) => {
            if (
              idx > 0 &&
              idx < abs.length - 1 &&
              ptSegDistSq(
                abs[idx - 1]!.x,
                abs[idx - 1]!.y,
                abs[idx + 1]!.x,
                abs[idx + 1]!.y,
                tmp.x,
                tmp.y
              ) < tol
            ) {
              points.splice(idx - 1, 1);
              result = points;
            }
          };

          // LATER: Check if other points can be removed if a segment is made straight
          checkRemove(this.index, pt);
        }
      }

      // Updates existing point
      if (result == null && this.index > InternalEvent.VIRTUAL_HANDLE) {
        points[this.index - 1] = point;
      }
    } else if (this.graph.isResetEdgesOnConnect()) {
      points = [];
    }

    return result != null ? result : points;
  }

  /**
   * Returns true if {@link outlineConnect} is true and the source of the event is the outline shape
   * or shift is pressed.
   */
  isOutlineConnectEvent(me: InternalMouseEvent) {
    if (!this.currentPoint) return false;

    const offset = getOffset(this.graph.container);
    const evt = me.getEvent();

    const clientX = getClientX(evt);
    const clientY = getClientY(evt);

    const doc = document.documentElement;
    const left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
    const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);

    const gridX = this.currentPoint.x - this.graph.container.scrollLeft + offset.x - left;
    const gridY = this.currentPoint.y - this.graph.container.scrollTop + offset.y - top;

    return (
      this.outlineConnect &&
      !isShiftDown(me.getEvent()) &&
      (me.isSource(this.marker.highlight.shape) ||
        (isAltDown(me.getEvent()) && me.getState() != null) ||
        this.marker.highlight.isHighlightAt(clientX, clientY) ||
        ((gridX !== clientX || gridY !== clientY) &&
          me.getState() == null &&
          this.marker.highlight.isHighlightAt(gridX, gridY)))
    );
  }

  /**
   * Updates the given preview state taking into account the state of the constraint handler.
   */
  updatePreviewState(
    edgeState: CellState,
    point: Point,
    terminalState: CellState | null,
    me: InternalMouseEvent,
    outline = false
  ) {
    // Computes the points for the edge style and terminals
    const sourceState = this.isSource
      ? terminalState
      : this.state.getVisibleTerminalState(true);
    const targetState = this.isTarget
      ? terminalState
      : this.state.getVisibleTerminalState(false);

    let sourceConstraint = this.graph.getConnectionConstraint(
      edgeState,
      sourceState,
      true
    );
    let targetConstraint = this.graph.getConnectionConstraint(
      edgeState,
      targetState,
      false
    );

    let constraint = this.constraintHandler.currentConstraint;

    if (constraint == null && outline) {
      if (terminalState != null) {
        // Handles special case where mouse is on outline away from actual end point
        // in which case the grid is ignored and mouse point is used instead
        if (me.isSource(this.marker.highlight.shape)) {
          point = new Point(me.getGraphX(), me.getGraphY());
        }

        constraint = this.graph.getOutlineConstraint(point, terminalState, me);
        this.constraintHandler.setFocus(me, terminalState, this.isSource);
        this.constraintHandler.currentConstraint = constraint;
        this.constraintHandler.currentPoint = point;
      } else {
        constraint = new ConnectionConstraint(null);
      }
    }

    if (
      this.outlineConnect &&
      this.marker.highlight != null &&
      this.marker.highlight.shape != null
    ) {
      const s = this.graph.view.scale;

      if (
        this.constraintHandler.currentConstraint != null &&
        this.constraintHandler.currentFocus != null
      ) {
        this.marker.highlight.shape.stroke = outline
          ? OUTLINE_HIGHLIGHT_COLOR
          : 'transparent';
        this.marker.highlight.shape.strokeWidth = OUTLINE_HIGHLIGHT_STROKEWIDTH / s / s;
        this.marker.highlight.repaint();
      } else if (this.marker.hasValidState()) {
        const cell = me.getCell();

        this.marker.highlight.shape.stroke =
          cell && cell.isConnectable() && this.marker.getValidState() !== me.getState()
            ? 'transparent'
            : DEFAULT_VALID_COLOR;
        this.marker.highlight.shape.strokeWidth = HIGHLIGHT_STROKEWIDTH / s / s;
        this.marker.highlight.repaint();
      }
    }

    if (this.isSource) {
      sourceConstraint = constraint!;
    } else if (this.isTarget) {
      targetConstraint = constraint!;
    }

    if (this.isSource || this.isTarget) {
      if (constraint != null && constraint.point != null) {
        edgeState.style[this.isSource ? 'exitX' : 'entryX'] = constraint.point.x;
        edgeState.style[this.isSource ? 'exitY' : 'entryY'] = constraint.point.y;
      } else {
        delete edgeState.style[this.isSource ? 'exitX' : 'entryX'];
        delete edgeState.style[this.isSource ? 'exitY' : 'entryY'];
      }
    }

    edgeState.setVisibleTerminalState(sourceState, true);
    edgeState.setVisibleTerminalState(targetState, false);

    if (!this.isSource || sourceState != null) {
      edgeState.view.updateFixedTerminalPoint(
        edgeState,
        sourceState,
        true,
        sourceConstraint
      );
    }

    if (!this.isTarget || targetState != null) {
      edgeState.view.updateFixedTerminalPoint(
        edgeState,
        targetState,
        false,
        targetConstraint
      );
    }

    if ((this.isSource || this.isTarget) && terminalState == null) {
      edgeState.setAbsoluteTerminalPoint(point, this.isSource);

      if (this.marker.getMarkedState() == null) {
        this.error = this.graph.isAllowDanglingEdges() ? null : '';
      }
    }

    edgeState.view.updatePoints(edgeState, this.points, sourceState, targetState);
    edgeState.view.updateFloatingTerminalPoints(edgeState, sourceState, targetState);
  }

  /**
   * Handles the event by updating the preview.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    if (this.index != null && this.marker != null) {
      this.currentPoint = this.getPointForEvent(me);
      this.error = null;

      // Uses the current point from the constraint handler if available
      if (
        !this.graph.isIgnoreTerminalEvent(me.getEvent()) &&
        isShiftDown(me.getEvent()) &&
        this.snapPoint != null
      ) {
        if (
          Math.abs(this.snapPoint.x - this.currentPoint.x) <
          Math.abs(this.snapPoint.y - this.currentPoint.y)
        ) {
          this.currentPoint.x = this.snapPoint.x;
        } else {
          this.currentPoint.y = this.snapPoint.y;
        }
      }

      if (
        this.index <= InternalEvent.CUSTOM_HANDLE &&
        this.index > InternalEvent.VIRTUAL_HANDLE
      ) {
        if (this.customHandles != null) {
          this.customHandles[InternalEvent.CUSTOM_HANDLE - this.index].processEvent(me);
          this.customHandles[InternalEvent.CUSTOM_HANDLE - this.index].positionChanged();

          if (this.shape != null && this.shape.node != null) {
            this.shape.node.style.display = 'none';
          }
        }
      } else if (this.isLabel && this.label) {
        this.label.x = this.currentPoint.x;
        this.label.y = this.currentPoint.y;
      } else {
        this.points = this.getPreviewPoints(this.currentPoint, me) as Point[];
        let terminalState =
          this.isSource || this.isTarget ? this.getPreviewTerminalState(me) : null;

        if (
          this.constraintHandler.currentConstraint != null &&
          this.constraintHandler.currentFocus != null &&
          this.constraintHandler.currentPoint != null
        ) {
          this.currentPoint = this.constraintHandler.currentPoint.clone();
        } else if (this.outlineConnect) {
          // Need to check outline before cloning terminal state
          const outline =
            this.isSource || this.isTarget ? this.isOutlineConnectEvent(me) : false;

          if (outline) {
            terminalState = this.marker.highlight.state;
          } else if (
            terminalState != null &&
            terminalState !== me.getState() &&
            me.getCell()?.isConnectable() &&
            this.marker.highlight.shape != null
          ) {
            this.marker.highlight.shape.stroke = 'transparent';
            this.marker.highlight.repaint();
            terminalState = null;
          }
        }

        if (terminalState != null && !this.isCellEnabled(terminalState.cell)) {
          terminalState = null;
          this.marker.reset();
        }

        if (this.currentPoint) {
          const clone = this.clonePreviewState(
            this.currentPoint,
            terminalState != null ? terminalState.cell : null
          );
          this.updatePreviewState(
            clone,
            this.currentPoint,
            terminalState,
            me,
            this.outline
          );

          // Sets the color of the preview to valid or invalid, updates the
          // points of the preview and redraws
          const color =
            this.error == null ? this.marker.validColor : this.marker.invalidColor;
          this.setPreviewColor(color);
          this.abspoints = clone.absolutePoints;
          this.active = true;
          this.updateHint(me, this.currentPoint);
        }
      }

      // This should go before calling isOutlineConnectEvent above. As a workaround
      // we add an offset of gridSize to the hint to avoid problem with hit detection
      // in highlight.isHighlightAt (which uses comonentFromPoint)
      this.drawPreview();
      InternalEvent.consume(me.getEvent());
      me.consume();
    }
  }

  /**
   * Handles the event to applying the previewed changes on the edge by
   * using {@link moveLabel}, {@link connect} or {@link changePoints}.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    // Workaround for wrong event source in Webkit
    if (this.index != null && this.marker != null) {
      if (this.shape != null && this.shape.node != null) {
        this.shape.node.style.display = '';
      }

      let edge = this.state.cell;
      const { index } = this;
      this.index = null;

      // Ignores event if mouse has not been moved
      if (me.getX() !== this.startX || me.getY() !== this.startY) {
        const clone =
          !this.graph.isIgnoreTerminalEvent(me.getEvent()) &&
          this.graph.isCloneEvent(me.getEvent()) &&
          this.cloneEnabled &&
          this.graph.isCellsCloneable();

        // Displays the reason for not carriying out the change
        // if there is an error message with non-zero length
        if (this.error != null) {
          if (this.error.length > 0) {
            this.graph.validationAlert(this.error);
          }
        } else if (
          index <= InternalEvent.CUSTOM_HANDLE &&
          index > InternalEvent.VIRTUAL_HANDLE
        ) {
          if (this.customHandles != null) {
            const model = this.graph.getDataModel();

            model.beginUpdate();
            try {
              this.customHandles[InternalEvent.CUSTOM_HANDLE - index].execute(me);

              if (this.shape != null && this.shape.node != null) {
                this.shape.apply(this.state);
                this.shape.redraw();
              }
            } finally {
              model.endUpdate();
            }
          }
        } else if (this.isLabel && this.label) {
          this.moveLabel(this.state, this.label.x, this.label.y);
        } else if (this.isSource || this.isTarget) {
          let terminal: Cell | null = null;

          if (
            this.constraintHandler.currentConstraint != null &&
            this.constraintHandler.currentFocus != null
          ) {
            terminal = this.constraintHandler.currentFocus.cell;
          }

          if (
            !terminal &&
            this.marker.hasValidState() &&
            this.marker.highlight != null &&
            this.marker.highlight.shape != null &&
            this.marker.highlight.shape.stroke !== 'transparent' &&
            this.marker.highlight.shape.stroke !== 'white'
          ) {
            terminal = this.marker.validState!.cell;
          }

          if (terminal) {
            const model = this.graph.getDataModel();
            const parent = edge.getParent();

            model.beginUpdate();
            try {
              // Clones and adds the cell
              if (clone) {
                let geo = edge.getGeometry();
                const cloned = this.graph.cloneCell(edge);
                model.add(parent, cloned, parent!.getChildCount());

                if (geo != null) {
                  geo = geo.clone();
                  model.setGeometry(cloned, geo);
                }

                const other = edge.getTerminal(!this.isSource) as Cell;
                this.graph.connectCell(cloned, other, !this.isSource);

                edge = cloned;
              }

              edge = this.connect(edge, terminal, this.isSource, clone, me);
            } finally {
              model.endUpdate();
            }
          } else if (this.graph.isAllowDanglingEdges()) {
            const pt = this.abspoints[
              this.isSource ? 0 : this.abspoints.length - 1
            ] as Point;
            pt.x = this.roundLength(
              pt.x / this.graph.view.scale - this.graph.view.translate.x
            );
            pt.y = this.roundLength(
              pt.y / this.graph.view.scale - this.graph.view.translate.y
            );

            const parent = edge.getParent();
            const pstate = parent ? this.graph.getView().getState(parent) : null;

            if (pstate != null) {
              pt.x -= pstate.origin.x;
              pt.y -= pstate.origin.y;
            }

            pt.x -= this.graph.getPanDx() / this.graph.view.scale;
            pt.y -= this.graph.getPanDy() / this.graph.view.scale;

            // Destroys and recreates this handler
            edge = this.changeTerminalPoint(edge, pt, this.isSource, clone);
          }
        } else if (this.active) {
          edge = this.changePoints(edge, this.points, clone);
        } else {
          this.graph.getView().invalidate(this.state.cell);
          this.graph.getView().validate(this.state.cell);
        }
      } else if (this.graph.isToggleEvent(me.getEvent())) {
        this.graph.selectCellForEvent(this.state.cell, me.getEvent());
      }

      // Resets the preview color the state of the handler if this
      // handler has not been recreated
      if (this.marker != null) {
        this.reset();

        // Updates the selection if the edge has been cloned
        if (edge !== this.state.cell) {
          this.graph.setSelectionCell(edge);
        }
      }

      me.consume();
    }
  }

  /**
   * Resets the state of this handler.
   */
  reset() {
    if (this.active) {
      this.refresh();
    }

    this.error = null;
    this.index = null;
    this.points = [];
    this.snapPoint = null;
    this.isLabel = false;
    this.isSource = false;
    this.isTarget = false;
    this.active = false;

    if (this.marker) {
      this.marker.reset();
    }

    this.constraintHandler.reset();

    if (this.customHandles) {
      for (let i = 0; i < this.customHandles.length; i += 1) {
        this.customHandles[i].reset();
      }
    }

    this.setPreviewColor(EdgeHandlerConfig.selectionColor);
    this.removeHint();
    this.redraw();
  }

  /**
   * Sets the color of the preview to the given value.
   */
  setPreviewColor(color: ColorValue) {
    this.shape.stroke = color;
  }

  /**
   * Converts the given point in-place from screen to unscaled, untranslated
   * graph coordinates and applies the grid. Returns the given, modified
   * point instance.
   *
   * @param point {@link Point} to be converted.
   * @param gridEnabled Boolean that specifies if the grid should be applied.
   */
  convertPoint(point: Point, gridEnabled: boolean) {
    const scale = this.graph.getView().getScale();
    const tr = this.graph.getView().getTranslate();

    if (gridEnabled) {
      point.x = this.graph.snap(point.x);
      point.y = this.graph.snap(point.y);
    }

    point.x = Math.round(point.x / scale - tr.x);
    point.y = Math.round(point.y / scale - tr.y);

    const parent = this.state.cell.getParent();
    const pstate = parent ? this.graph.getView().getState(parent) : parent;

    if (pstate) {
      point.x -= pstate.origin.x;
      point.y -= pstate.origin.y;
    }

    return point;
  }

  /**
   * Changes the coordinates for the label of the given edge.
   *
   * @param edge {@link Cell} that represents the edge.
   * @param x Integer that specifies the x-coordinate of the new location.
   * @param y Integer that specifies the y-coordinate of the new location.
   */
  moveLabel(edgeState: CellState, x: number, y: number) {
    const model = this.graph.getDataModel();
    let geometry = edgeState.cell.getGeometry();

    if (geometry != null) {
      const { scale } = this.graph.getView();
      geometry = geometry.clone();

      if (geometry.relative) {
        // Resets the relative location stored inside the geometry
        let pt = this.graph.getView().getRelativePoint(edgeState, x, y);
        geometry.x = Math.round(pt.x * 10000) / 10000;
        geometry.y = Math.round(pt.y);

        // Resets the offset inside the geometry to find the offset
        // from the resulting point
        geometry.offset = new Point(0, 0);
        pt = this.graph.view.getPoint(edgeState, geometry);
        geometry.offset = new Point(
          Math.round((x - pt.x) / scale),
          Math.round((y - pt.y) / scale)
        );
      } else {
        const points = edgeState.absolutePoints;
        const p0 = points[0];
        const pe = points[points.length - 1];

        if (p0 != null && pe != null) {
          const cx = p0.x + (pe.x - p0.x) / 2;
          const cy = p0.y + (pe.y - p0.y) / 2;

          geometry.offset = new Point(
            Math.round((x - cx) / scale),
            Math.round((y - cy) / scale)
          );
          geometry.x = 0;
          geometry.y = 0;
        }
      }

      model.setGeometry(edgeState.cell, geometry);
    }
  }

  /**
   * Changes the terminal or terminal point of the given edge in the graph model.
   *
   * @param edge {@link Cell} that represents the edge to be reconnected.
   * @param terminal {@link Cell} that represents the new terminal.
   * @param isSource Boolean indicating if the new terminal is the source or target terminal.
   * @param _isClone Boolean indicating if the new connection should be a clone of the old edge.
   * @param _me {@link MouseEvent} that contains the mouse up event.
   */
  connect(
    edge: Cell,
    terminal: Cell,
    isSource: boolean,
    _isClone: boolean,
    _me: InternalMouseEvent
  ) {
    const parent = edge.getParent();

    this.graph.batchUpdate(() => {
      let constraint = this.constraintHandler.currentConstraint;

      if (constraint == null) {
        constraint = new ConnectionConstraint(null);
      }

      this.graph.connectCell(edge, terminal, isSource, constraint);
    });

    return edge;
  }

  /**
   * Changes the terminal point of the given edge.
   */
  changeTerminalPoint(edge: Cell, point: Point, isSource: boolean, clone: boolean) {
    const model = this.graph.getDataModel();

    model.batchUpdate(() => {
      if (clone) {
        const parent = edge.getParent();
        const terminal = edge.getTerminal(!isSource);
        edge = this.graph.cloneCell(edge);
        model.add(parent, edge, parent!.getChildCount());
        model.setTerminal(edge, terminal, !isSource);
      }

      let geo = edge.getGeometry();

      if (geo != null) {
        geo = geo.clone();
        geo.setTerminalPoint(point, isSource);
        model.setGeometry(edge, geo);
        this.graph.connectCell(edge, null, isSource, new ConnectionConstraint(null));
      }
    });

    return edge;
  }

  /**
   * Changes the control points of the given edge in the graph model.
   */
  changePoints(edge: Cell, points: Point[], clone: boolean) {
    const model = this.graph.getDataModel();
    model.batchUpdate(() => {
      if (clone) {
        const parent = edge.getParent();
        const source = edge.getTerminal(true);
        const target = edge.getTerminal(false);
        edge = this.graph.cloneCell(edge);
        model.add(parent, edge, parent!.getChildCount());
        model.setTerminal(edge, source, true);
        model.setTerminal(edge, target, false);
      }

      let geo = edge.getGeometry();

      if (geo != null) {
        geo = geo.clone();
        geo.points = points;

        model.setGeometry(edge, geo);
      }
    });

    return edge;
  }

  /**
   * Adds a control point for the given state and event.
   */
  addPoint(state: CellState, evt: MouseEvent) {
    const pt = convertPoint(this.graph.container, getClientX(evt), getClientY(evt));
    const gridEnabled = this.graph.isGridEnabledEvent(evt);
    this.convertPoint(pt, gridEnabled);
    this.addPointAt(state, pt.x, pt.y);
    InternalEvent.consume(evt);
  }

  /**
   * Adds a control point at the given point.
   */
  addPointAt(state: CellState, x: number, y: number) {
    let geo = state.cell.getGeometry();
    const pt = new Point(x, y);

    if (geo != null) {
      geo = geo.clone();
      const t = this.graph.view.translate;
      const s = this.graph.view.scale;
      let offset = new Point(t.x * s, t.y * s);

      const parent = this.state.cell.getParent();

      if (parent && parent.isVertex()) {
        const pState = this.graph.view.getState(parent);

        if (pState) offset = new Point(pState.x, pState.y);
      }

      const index = findNearestSegment(state, pt.x * s + offset.x, pt.y * s + offset.y);

      if (geo.points == null) {
        geo.points = [pt];
      } else {
        geo.points.splice(index, 0, pt);
      }

      this.graph.getDataModel().setGeometry(state.cell, geo);
      this.refresh();
      this.redraw();
    }
  }

  /**
   * Removes the control point at the given index from the given state.
   */
  removePoint(state: CellState, index: number) {
    if (index > 0 && index < this.abspoints.length - 1) {
      let geo = this.state.cell.getGeometry();

      if (geo != null && geo.points != null) {
        geo = geo.clone();
        (geo.points || []).splice(index - 1, 1);
        this.graph.getDataModel().setGeometry(state.cell, geo);
        this.refresh();
        this.redraw();
      }
    }
  }

  /**
   * Returns the fillcolor for the handle at the given index.
   */
  getHandleFillColor(index: number) {
    const isSource = index === 0;
    const { cell } = this.state;
    const terminal = cell.getTerminal(isSource);
    let color = HandleConfig.fillColor;

    if (
      (terminal != null && !this.graph.isCellDisconnectable(cell, terminal, isSource)) ||
      (terminal == null && !this.graph.isTerminalPointMovable(cell, isSource))
    ) {
      color = LOCKED_HANDLE_FILLCOLOR;
    } else if (
      terminal != null &&
      this.graph.isCellDisconnectable(cell, terminal, isSource)
    ) {
      color = EdgeHandlerConfig.connectFillColor;
    }

    return color;
  }

  /**
   * Redraws the preview, and the bends- and label control points.
   */
  redraw(ignoreHandles?: boolean) {
    this.abspoints = this.state.absolutePoints.slice();
    const g = this.state.cell.getGeometry();

    if (g) {
      const pts = g.points;

      if (this.bends != null && this.bends.length > 0) {
        if (pts != null) {
          if (this.points == null) {
            this.points = [];
          }

          for (let i = 1; i < this.bends.length - 1; i += 1) {
            if (this.bends[i] != null && this.abspoints[i] != null) {
              this.points[i - 1] = pts[i - 1];
            }
          }
        }
      }
    }

    this.drawPreview();

    if (!ignoreHandles) {
      this.redrawHandles();
    }
  }

  /**
   * Redraws the handles.
   */
  redrawHandles() {
    const { cell } = this.state;

    // Updates the handle for the label position
    let b = this.labelShape.bounds as Rectangle;

    this.label = new Point(this.state.absoluteOffset.x, this.state.absoluteOffset.y);
    this.labelShape.bounds = new Rectangle(
      Math.round(this.label.x - b.width / 2),
      Math.round(this.label.y - b.height / 2),
      b.width,
      b.height
    );

    // Shows or hides the label handle depending on the label
    const lab = this.graph.getLabel(cell);
    this.labelShape.visible =
      lab != null && lab.length > 0 && this.graph.isLabelMovable(cell);

    if (this.bends != null && this.bends.length > 0) {
      const n = this.abspoints.length - 1;

      const p0 = this.abspoints[0] as Point;
      const x0 = p0.x;
      const y0 = p0.y;

      b = this.bends[0].bounds as Rectangle;

      this.bends[0].bounds = new Rectangle(
        Math.floor(x0 - b.width / 2),
        Math.floor(y0 - b.height / 2),
        b.width,
        b.height
      );
      this.bends[0].fill = this.getHandleFillColor(0);
      this.bends[0].redraw();

      if (this.manageLabelHandle) {
        this.checkLabelHandle(this.bends[0].bounds);
      }

      const pe = this.abspoints[n] as Point;
      const xn = pe.x;
      const yn = pe.y;

      const bn = this.bends.length - 1;
      b = this.bends[bn].bounds as Rectangle;
      this.bends[bn].bounds = new Rectangle(
        Math.floor(xn - b.width / 2),
        Math.floor(yn - b.height / 2),
        b.width,
        b.height
      );
      this.bends[bn].fill = this.getHandleFillColor(bn);
      this.bends[bn].redraw();

      if (this.manageLabelHandle) {
        this.checkLabelHandle(this.bends[bn].bounds as Rectangle);
      }

      this.redrawInnerBends(p0, pe);
    }

    if (this.virtualBends && this.virtualBends.length > 0) {
      let last = this.abspoints[0] as Point;

      for (let i = 0; i < this.virtualBends.length; i += 1) {
        if (this.virtualBends[i] != null && this.abspoints[i + 1] != null) {
          const pt = this.abspoints[i + 1] as Point;
          const b = this.virtualBends[i];
          const x = last.x + (pt.x - last.x) / 2;
          const y = last.y + (pt.y - last.y) / 2;

          if (b.bounds) {
            b.bounds = new Rectangle(
              Math.floor(x - b.bounds.width / 2),
              Math.floor(y - b.bounds.height / 2),
              b.bounds.width,
              b.bounds.height
            );
            b.redraw();
          }

          setOpacity(b.node, EdgeHandlerConfig.virtualBendOpacity);
          last = pt;

          if (this.manageLabelHandle) {
            this.checkLabelHandle(b.bounds as Rectangle);
          }
        }
      }
    }

    this.labelShape.redraw();
    if (this.customHandles) {
      for (let i = 0; i < this.customHandles.length; i += 1) {
        const shape = this.customHandles[i].shape;

        if (shape) {
          const temp = shape.node.style.display;
          this.customHandles[i].redraw();
          shape.node.style.display = temp;

          // Hides custom handles during text editing
          shape.node.style.visibility = this.isCustomHandleVisible(this.customHandles[i])
            ? ''
            : 'hidden';
        }
      }
    }
  }

  /**
   * Returns true if the given custom handle is visible.
   */
  isCustomHandleVisible(handle: CellHandle) {
    return !this.graph.isEditing() && this.state.view.graph.getSelectionCount() === 1;
  }

  /**
   * Shortcut to {@link hideSizers}.
   */
  setHandlesVisible(visible: boolean) {
    for (let i = 0; i < this.bends.length; i += 1) {
      this.bends[i].node.style.display = visible ? '' : 'none';
    }

    if (this.virtualBends) {
      for (let i = 0; i < this.virtualBends.length; i += 1) {
        this.virtualBends[i].node.style.display = visible ? '' : 'none';
      }
    }

    this.labelShape.node.style.display = visible ? '' : 'none';

    if (this.customHandles) {
      for (let i = 0; i < this.customHandles.length; i += 1) {
        this.customHandles[i].setVisible(visible);
      }
    }
  }

  /**
   * Updates and redraws the inner bends.
   *
   * @param p0 {@link Point} that represents the location of the first point.
   * @param pe {@link Point} that represents the location of the last point.
   */
  redrawInnerBends(p0: Point, pe: Point) {
    for (let i = 1; i < this.bends.length - 1; i += 1) {
      if (this.bends[i] != null) {
        if (this.abspoints[i] != null) {
          const { x } = this.abspoints[i] as Point;
          const { y } = this.abspoints[i] as Point;

          const b = this.bends[i].bounds as Rectangle;
          this.bends[i].node.style.visibility = 'visible';
          this.bends[i].bounds = new Rectangle(
            Math.round(x - b.width / 2),
            Math.round(y - b.height / 2),
            b.width,
            b.height
          );

          if (this.manageLabelHandle) {
            this.checkLabelHandle(this.bends[i].bounds as Rectangle);
          } else if (
            this.handleImage == null &&
            this.labelShape.visible &&
            intersects(
              this.bends[i].bounds as Rectangle,
              this.labelShape.bounds as Rectangle
            )
          ) {
            const w = HandleConfig.size + 3;
            const h = w;
            this.bends[i].bounds = new Rectangle(
              Math.round(x - w / 2),
              Math.round(y - h / 2),
              w,
              h
            );
          }

          this.bends[i].redraw();
        } else {
          this.bends[i].destroy();
        }
      }
    }
  }

  /**
   * Checks if the label handle intersects the given bounds and moves it if it
   * intersects.
   */
  checkLabelHandle(b: Rectangle) {
    const b2 = this.labelShape.bounds as Rectangle;

    if (intersects(b, b2)) {
      if (b.getCenterY() < b2.getCenterY()) {
        b2.y = b.y + b.height;
      } else {
        b2.y = b.y - b2.height;
      }
    }
  }

  /**
   * Redraws the preview.
   */
  drawPreview() {
    try {
      if (this.isLabel) {
        const b = this.labelShape.bounds as Rectangle;
        const bounds = new Rectangle(
          Math.round(this.label.x - b.width / 2),
          Math.round(this.label.y - b.height / 2),
          b.width,
          b.height
        );

        if (!b.equals(bounds)) {
          this.labelShape.bounds = bounds;
          this.labelShape.redraw();
        }
      }

      if (this.shape != null && !equalPoints(this.shape.points, this.abspoints)) {
        this.shape.apply(this.state);
        this.shape.points = this.abspoints.slice();
        this.shape.scale = this.state.view.scale;
        this.shape.isDashed = this.isSelectionDashed();
        this.shape.stroke = this.getSelectionColor();
        this.shape.strokeWidth =
          this.getSelectionStrokeWidth() / this.shape.scale / this.shape.scale;
        this.shape.isShadow = false;
        this.shape.redraw();
      }

      this.updateParentHighlight();
    } catch (e) {
      // ignore
    }
  }

  /**
   * Refreshes the bends of this handler.
   */
  refresh() {
    if (this.state != null) {
      this.abspoints = this.getSelectionPoints(this.state);
      this.points = [];

      this.destroyBends(this.bends);
      this.bends = this.createBends();

      if (this.virtualBends) {
        this.destroyBends(this.virtualBends);
        this.virtualBends = this.createVirtualBends();
      }

      if (this.customHandles) {
        this.destroyBends(this.customHandles);
        this.customHandles = this.createCustomHandles();
      }

      // Puts label node on top of bends
      if (
        this.labelShape != null &&
        this.labelShape.node != null &&
        this.labelShape.node.parentNode != null
      ) {
        this.labelShape.node.parentNode.appendChild(this.labelShape.node);
      }
    }
  }

  /**
   * Returns true if {@link destroy} was called.
   */
  isDestroyed() {
    return this.shape == null;
  }

  /**
   * Destroys all elements in {@link bends}.
   */
  destroyBends(bends: Shape[] | CellHandle[]) {
    if (bends != null) {
      for (let i = 0; i < bends.length; i += 1) {
        if (bends[i] != null) {
          bends[i].destroy();
        }
      }
    }
  }

  /**
   * Destroys the handler and all its resources and DOM nodes. This does
   * normally not need to be called as handlers are destroyed automatically
   * when the corresponding cell is deselected.
   */
  onDestroy() {
    this.state.view.graph.removeListener(this.escapeHandler);

    this.marker.destroy();
    // @ts-expect-error Can be null when destroyed.
    this.marker = null;

    this.shape.destroy();
    // @ts-expect-error Can be null when destroyed.
    this.shape = null;

    if (this.parentHighlight) {
      const parent = this.state.cell.getParent();
      const pstate = parent ? this.graph.view.getState(parent) : null;

      if (pstate && pstate.parentHighlight === this.parentHighlight) {
        pstate.parentHighlight = null;
      }

      this.parentHighlight.destroy();
      this.parentHighlight = null;
    }

    this.labelShape.destroy();
    // @ts-expect-error Can be null when destroyed.
    this.labelShape = null;

    this.constraintHandler.onDestroy();
    // @ts-expect-error Can be null when destroyed.
    this.constraintHandler = null;

    if (this.virtualBends) {
      this.destroyBends(this.virtualBends);
      this.virtualBends = [];
    }

    if (this.customHandles) {
      this.destroyBends(this.customHandles);
      this.customHandles = [];
    }

    this.destroyBends(this.bends);
    this.bends = [];

    this.removeHint();
  }
}

class EdgeHandlerCellMarker extends CellMarker {
  edgeHandler: EdgeHandler;

  constructor(
    graph: AbstractGraph,
    edgeHandler: EdgeHandler,
    validColor: ColorValue = DEFAULT_VALID_COLOR,
    invalidColor: ColorValue = DEFAULT_INVALID_COLOR,
    hotspot: number = DEFAULT_HOTSPOT
  ) {
    super(graph, validColor, invalidColor, hotspot);
    this.edgeHandler = edgeHandler;
  }
  // Only returns edges if they are connectable and never returns
  // the edge that is currently being modified
  getCell = (me: InternalMouseEvent) => {
    let cell = super.getCell(me);

    // Checks for cell at preview point (with grid)
    if (
      (cell === this.edgeHandler.state.cell || !cell) &&
      this.edgeHandler.currentPoint
    ) {
      cell = this.edgeHandler.graph.getCellAt(
        this.edgeHandler.currentPoint.x,
        this.edgeHandler.currentPoint.y
      );
    }

    // Uses connectable parent vertex if one exists
    if (cell && !cell.isConnectable()) {
      const parent = cell.getParent();

      if (parent && parent.isVertex() && parent.isConnectable()) {
        cell = parent;
      }
    }

    if (cell) {
      if (
        (this.graph.isSwimlane(cell) &&
          this.edgeHandler.currentPoint &&
          this.graph.hitsSwimlaneContent(
            cell,
            this.edgeHandler.currentPoint.x,
            this.edgeHandler.currentPoint.y
          )) ||
        !this.edgeHandler.isConnectableCell(cell) ||
        cell === this.edgeHandler.state.cell ||
        (cell && !this.edgeHandler.graph.connectableEdges && cell.isEdge()) ||
        this.edgeHandler.state.cell.isAncestor(cell)
      ) {
        cell = null;
      }
    }

    if (cell && !cell.isConnectable()) {
      cell = null;
    }

    return cell;
  };

  // Sets the highlight color according to validateConnection
  isValidState = (state: CellState) => {
    const cell = this.edgeHandler.state.cell.getTerminal(
      !this.edgeHandler.isSource
    ) as Cell;
    const cellState = this.edgeHandler.graph.view.getState(cell) as CellState;
    const other = this.edgeHandler.graph.view.getTerminalPort(
      state,
      cellState,
      !this.edgeHandler.isSource
    );
    const otherCell = other ? other.cell : null;
    const source = this.edgeHandler.isSource ? state.cell : otherCell;
    const target = this.edgeHandler.isSource ? otherCell : state.cell;

    // Updates the error message of the handler
    this.edgeHandler.error = this.edgeHandler.validateConnection(source, target);

    return !this.edgeHandler.error;
  };
}

export default EdgeHandler;
