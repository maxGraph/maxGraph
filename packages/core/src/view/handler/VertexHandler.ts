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

import Rectangle from '../geometry/Rectangle';
import { CURSOR, DIALECT, NONE } from '../../util/Constants';
import InternalEvent from '../event/InternalEvent';
import RectangleShape from '../geometry/node/RectangleShape';
import ImageShape from '../geometry/node/ImageShape';
import EllipseShape from '../geometry/node/EllipseShape';
import Point from '../geometry/Point';
import { getRotatedPoint, intersects, mod, toRadians } from '../../util/mathUtils';
import Client from '../../Client';
import { isMouseEvent, isShiftDown } from '../../util/EventUtils';
import { Graph } from '../Graph';
import CellState from '../cell/CellState';
import Image from '../image/ImageBox';
import Cell from '../cell/Cell';
import type { CellHandle, Listenable } from '../../types';
import Shape from '../geometry/Shape';
import InternalMouseEvent from '../event/InternalMouseEvent';
import EdgeHandler from './EdgeHandler';
import EventSource from '../event/EventSource';
import SelectionHandler from './SelectionHandler';
import SelectionCellsHandler from './SelectionCellsHandler';
import { HandleConfig, VertexHandlerConfig } from './config';

/**
 * Event handler for resizing cells.
 *
 * This handler is automatically created in {@link Graph#createHandler}.
 *
 * Some elements of this handler and its subclasses can be configured using {@link EdgeHandlerConfig}.
 */
class VertexHandler {
  escapeHandler: (sender: Listenable, evt: Event) => void;
  selectionBounds: Rectangle;
  bounds: Rectangle;
  selectionBorder: RectangleShape;

  /**
   * Reference to the enclosing {@link Graph}.
   */
  graph: Graph;

  /**
   * Reference to the {@link CellState} being modified.
   */
  state: CellState;

  sizers: Shape[] = [];

  /**
   * Specifies if only one sizer handle at the bottom, right corner should be used.
   * @default false
   */
  singleSizer = false;

  /**
   * Holds the index of the current handle.
   */
  index: number | null = null;

  /**
   * Specifies if the bounds of handles should be used for hit-detection in IE or if {@link tolerance} > 0.
   * @default true
   */
  allowHandleBoundsCheck = true;

  /**
   * Optional {@link Image} to be used as handles.
   * @default null
   */
  handleImage: Image | null = null;

  /**
   * If handles are currently visible.
   * @default true
   */
  handlesVisible = true;

  /**
   * Optional tolerance for hit-detection in {@link getHandleForEvent}.
   * @default 0
   */
  tolerance = 0;

  /**
   * Specifies if a rotation handle should be visible.
   *
   * This implementation returns {@link VertexHandlerConfig.rotationEnabled}.
   * @since 0.12.0
   */
  protected isRotationEnabled(): boolean {
    return VertexHandlerConfig.rotationEnabled;
  }

  /**
   * Specifies if the parent should be highlighted if a child cell is selected.
   * @default false
   */
  parentHighlightEnabled = false;

  /**
   * Specifies if rotation steps should be "rasterized" depending on the distance to the handle.
   * @default true
   */
  rotationRaster = true;

  /**
   * Specifies the cursor for the rotation handle.
   * @default 'crosshair'.
   */
  rotationCursor = 'crosshair';

  /**
   * Specifies if resize should change the cell in-place. This is an experimental
   * feature for non-touch devices.
   * @default false
   */
  livePreview = false;

  /**
   * Specifies if the live preview should be moved to the front.
   * @default false
   */
  movePreviewToFront = false;

  /**
   * Specifies if sizers should be hidden and spaced if the vertex is small.
   * @default false
   */
  manageSizers = false;

  /**
   * Specifies if the size of groups should be constrained by the children.
   * @default false
   */
  constrainGroupByChildren = false;

  /**
   * Vertical spacing for rotation icon.
   * @default -16
   */
  rotationHandleVSpacing = -16;

  /**
   * The horizontal offset for the handles. This is updated in {@link redrawHandles}
   * if {@link manageSizers} is `true` and the sizers are offset horizontally.
   */
  horizontalOffset = 0;

  /**
   * The horizontal offset for the handles. This is updated in <redrawHandles>
   * if {@link manageSizers} is true and the sizers are offset vertically.
   */
  verticalOffset = 0;

  minBounds: Rectangle | null = null;

  x0 = 0;
  y0 = 0;

  customHandles: CellHandle[] = [];

  inTolerance = false;

  startX = 0;
  startY = 0;

  rotationShape: Shape | null = null;

  currentAlpha = 100;
  startAngle = 0;
  startDist = 0;

  ghostPreview: Shape | null = null;

  livePreviewActive = false;

  childOffsetX = 0;
  childOffsetY = 0;

  parentState: CellState | null = null;
  parentHighlight: RectangleShape | null = null;

  unscaledBounds: Rectangle | null = null;

  preview: Shape | null = null;

  labelShape: Shape | null = null;

  edgeHandlers: EdgeHandler[] = [];

  EMPTY_POINT = new Point();

  /**
   * Constructs an event handler that allows to resize vertices and groups.
   *
   * @param state {@link CellState} of the cell to be resized.
   */
  constructor(state: CellState) {
    this.state = state;
    this.graph = this.state.view.graph;
    this.selectionBounds = this.getSelectionBounds(this.state);
    this.bounds = new Rectangle(
      this.selectionBounds.x,
      this.selectionBounds.y,
      this.selectionBounds.width,
      this.selectionBounds.height
    );
    this.selectionBorder = this.createSelectionShape(this.bounds);
    // VML dialect required here for event transparency in IE
    this.selectionBorder.dialect = DIALECT.SVG;
    this.selectionBorder.pointerEvents = false;
    this.selectionBorder.rotation = this.state.style.rotation ?? 0;
    this.selectionBorder.init(this.graph.getView().getOverlayPane());
    InternalEvent.redirectMouseEvents(this.selectionBorder.node, this.graph, this.state);

    if (this.graph.isCellMovable(this.state.cell)) {
      this.selectionBorder.setCursor(CURSOR.MOVABLE_VERTEX);
    }

    const selectionHandler = this.graph.getPlugin<SelectionHandler>('SelectionHandler');

    // Adds the sizer handles
    if (
      selectionHandler &&
      (selectionHandler.maxCells <= 0 ||
        this.graph.getSelectionCount() < selectionHandler.maxCells)
    ) {
      const resizable = this.graph.isCellResizable(this.state.cell);
      this.sizers = [];

      if (
        resizable ||
        (this.graph.isLabelMovable(this.state.cell) &&
          this.state.width >= 2 &&
          this.state.height >= 2)
      ) {
        let i = 0;

        if (resizable) {
          if (!this.singleSizer) {
            this.sizers.push(this.createSizer('nw-resize', i++));
            this.sizers.push(this.createSizer('n-resize', i++));
            this.sizers.push(this.createSizer('ne-resize', i++));
            this.sizers.push(this.createSizer('w-resize', i++));
            this.sizers.push(this.createSizer('e-resize', i++));
            this.sizers.push(this.createSizer('sw-resize', i++));
            this.sizers.push(this.createSizer('s-resize', i++));
          }

          this.sizers.push(this.createSizer('se-resize', i++));
        }

        const geo = this.state.cell.getGeometry();

        if (
          geo != null &&
          !geo.relative &&
          //!this.graph.isSwimlane(this.state.cell) &&      disable for now
          this.graph.isLabelMovable(this.state.cell)
        ) {
          // Marks this as the label handle for getHandleForEvent
          this.labelShape = this.createSizer(
            CURSOR.LABEL_HANDLE,
            InternalEvent.LABEL_HANDLE,
            HandleConfig.labelSize,
            HandleConfig.labelFillColor
          );
          this.sizers.push(this.labelShape);
        }
      } else if (
        this.graph.isCellMovable(this.state.cell) &&
        !this.graph.isCellResizable(this.state.cell) &&
        this.state.width < 2 &&
        this.state.height < 2
      ) {
        this.labelShape = this.createSizer(
          CURSOR.MOVABLE_VERTEX,
          InternalEvent.LABEL_HANDLE,
          undefined,
          HandleConfig.labelFillColor
        );
        this.sizers.push(this.labelShape);
      }
    }

    // Adds the rotation handler
    if (this.isRotationHandleVisible()) {
      this.rotationShape = this.createSizer(
        this.rotationCursor,
        InternalEvent.ROTATION_HANDLE,
        HandleConfig.size + 3,
        HandleConfig.fillColor
      );
      this.sizers.push(this.rotationShape);
    }

    this.customHandles = this.createCustomHandles();
    this.redraw();

    if (this.constrainGroupByChildren) {
      this.updateMinBounds();
    }

    // Handles escape keystrokes
    this.escapeHandler = (_sender: Listenable, _evt: Event) => {
      if (this.livePreview && this.index != null) {
        // Redraws the live preview
        (<Graph>this.state.view.graph).cellRenderer.redraw(this.state, true);

        // Redraws connected edges
        this.state.view.invalidate(this.state.cell);
        this.state.invalid = false;
        this.state.view.validate();
      }

      this.reset();
    };

    (<Graph>this.state.view.graph).addListener(InternalEvent.ESCAPE, this.escapeHandler);
  }

  /**
   * Returns `true` if the rotation handle should be showing.
   */
  isRotationHandleVisible() {
    const selectionHandler = this.graph.getPlugin<SelectionHandler>('SelectionHandler');
    const selectionHandlerCheck = selectionHandler
      ? selectionHandler.maxCells <= 0 ||
        this.graph.getSelectionCount() < selectionHandler.maxCells
      : true;

    return (
      this.graph.isEnabled() &&
      this.isRotationEnabled() &&
      this.graph.isCellRotatable(this.state.cell) &&
      selectionHandlerCheck
    );
  }

  /**
   * Returns `true` if the aspect ratio if the cell should be maintained.
   */
  isConstrainedEvent(me: InternalMouseEvent) {
    return isShiftDown(me.getEvent()) || this.state.style.aspect === 'fixed';
  }

  /**
   * Returns `true` if the center of the vertex should be maintained during the resize.
   */
  isCenteredEvent(state: CellState, me: InternalMouseEvent) {
    return false;
  }

  /**
   * Returns an array of custom handles.
   *
   * This implementation returns an empty array.
   */
  createCustomHandles(): CellHandle[] {
    return [];
  }

  /**
   * Initializes the shapes required for this vertex handler.
   */
  updateMinBounds() {
    const children = this.graph.getChildCells(this.state.cell);

    if (children.length > 0) {
      this.minBounds = this.graph.view.getBounds(children);

      if (this.minBounds) {
        const s = this.state.view.scale;
        const t = this.state.view.translate;

        this.minBounds.x -= this.state.x;
        this.minBounds.y -= this.state.y;
        this.minBounds.x /= s;
        this.minBounds.y /= s;
        this.minBounds.width /= s;
        this.minBounds.height /= s;
        this.x0 = this.state.x / s - t.x;
        this.y0 = this.state.y / s - t.y;
      }
    }
  }

  /**
   * Returns the Rectangle that defines the bounds of the selection border.
   */
  getSelectionBounds(state: CellState) {
    return new Rectangle(
      Math.round(state.x),
      Math.round(state.y),
      Math.round(state.width),
      Math.round(state.height)
    );
  }

  /**
   * Creates the shape used to draw the selection border.
   */
  createParentHighlightShape(bounds: Rectangle) {
    return this.createSelectionShape(bounds);
  }

  /**
   * Creates the shape used to draw the selection border.
   */
  createSelectionShape(bounds: Rectangle) {
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
   * Returns {@link VertexHandlerConfig.selectionColor}.
   */
  getSelectionColor() {
    return VertexHandlerConfig.selectionColor;
  }

  /**
   * Returns {@link VertexHandlerConfig.selectionStrokeWidth}.
   */
  getSelectionStrokeWidth() {
    return VertexHandlerConfig.selectionStrokeWidth;
  }

  /**
   * Returns {@link VertexHandlerConfig.selectionDashed}.
   */
  isSelectionDashed() {
    return VertexHandlerConfig.selectionDashed;
  }

  /**
   * Creates a sizer handle for the specified cursor and index and returns
   * the new {@link RectangleShape} that represents the handle.
   */
  createSizer(
    cursor: string,
    index: number,
    size = HandleConfig.size,
    fillColor = HandleConfig.fillColor
  ) {
    const bounds = new Rectangle(0, 0, size, size);
    const sizer = this.createSizerShape(bounds, index, fillColor);

    if (
      sizer.bounds &&
      sizer.isHtmlAllowed() &&
      this.state.text &&
      this.state.text.node.parentNode === this.graph.container
    ) {
      sizer.bounds.height -= 1;
      sizer.bounds.width -= 1;
      sizer.dialect = DIALECT.STRICTHTML;
      sizer.init(this.graph.container);
    } else {
      sizer.dialect =
        this.graph.dialect !== DIALECT.SVG ? DIALECT.MIXEDHTML : DIALECT.SVG;
      sizer.init(this.graph.getView().getOverlayPane());
    }

    InternalEvent.redirectMouseEvents(sizer.node, this.graph, this.state);

    if (this.graph.isEnabled()) {
      sizer.setCursor(cursor);
    }

    if (!this.isSizerVisible(index)) {
      sizer.visible = false;
    }

    return sizer;
  }

  /**
   * Returns `true` if the sizer for the given index is visible.
   *
   * This implementation returns `true` for all given indices.
   */
  isSizerVisible(_index: number) {
    return true;
  }

  /**
   * Creates the shape used for the sizer handle for the specified bounds an
   * index. Only images and rectangles should be returned if support for HTML
   * labels with not foreign objects is required.
   */
  createSizerShape(bounds: Rectangle, index: number, fillColor = HandleConfig.fillColor) {
    if (this.handleImage) {
      bounds = new Rectangle(
        bounds.x,
        bounds.y,
        this.handleImage.width,
        this.handleImage.height
      );
      const shape = new ImageShape(bounds, this.handleImage.src);

      // Allows HTML rendering of the images
      shape.preserveImageAspect = false;

      return shape;
    }
    const strokeColor = HandleConfig.strokeColor;
    if (index === InternalEvent.ROTATION_HANDLE) {
      return new EllipseShape(bounds, fillColor, strokeColor);
    }
    return new RectangleShape(bounds, fillColor, strokeColor);
  }

  /**
   * Helper method to create an {@link Rectangle} around the given center point
   * with a width and height of 2*s or 6, if no s is given.
   */
  moveSizerTo(shape: Shape, x: number, y: number) {
    if (shape && shape.bounds) {
      shape.bounds.x = Math.floor(x - shape.bounds.width / 2);
      shape.bounds.y = Math.floor(y - shape.bounds.height / 2);

      // Fixes visible inactive handles in VML
      if (shape.node && shape.node.style.display !== 'none') {
        shape.redraw();
      }
    }
  }

  /**
   * Returns the index of the handle for the given event. This returns the index
   * of the sizer from where the event originated or {@link InternalEvent.LABEL_HANDLE}.
   */
  getHandleForEvent(me: InternalMouseEvent) {
    // Connection highlight may consume events before they reach sizer handle
    const tol = !isMouseEvent(me.getEvent()) ? this.tolerance : 1;
    const hit =
      this.allowHandleBoundsCheck && tol > 0
        ? new Rectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol)
        : null;

    const checkShape = (shape: Shape | null) => {
      const st =
        shape && shape.constructor !== ImageShape && this.allowHandleBoundsCheck
          ? shape.strokeWidth + shape.svgStrokeTolerance
          : null;
      const real = st
        ? new Rectangle(
            me.getGraphX() - Math.floor(st / 2),
            me.getGraphY() - Math.floor(st / 2),
            st,
            st
          )
        : hit;

      return (
        shape &&
        shape.bounds &&
        (me.isSource(shape) ||
          (real &&
            intersects(shape.bounds, real) &&
            shape.node.style.display !== 'none' &&
            shape.node.style.visibility !== 'hidden'))
      );
    };

    if (checkShape(this.rotationShape)) {
      return InternalEvent.ROTATION_HANDLE;
    }
    if (checkShape(this.labelShape)) {
      return InternalEvent.LABEL_HANDLE;
    }

    for (let i = 0; i < this.sizers.length; i += 1) {
      if (checkShape(this.sizers[i])) {
        return i;
      }
    }

    if (this.customHandles != null && this.isCustomHandleEvent(me)) {
      // Inverse loop order to match display order
      for (let i = this.customHandles.length - 1; i >= 0; i--) {
        if (checkShape(this.customHandles[i].shape)) {
          // LATER: Return reference to active shape
          return InternalEvent.CUSTOM_HANDLE - i;
        }
      }
    }

    return null;
  }

  /**
   * Returns `true` if the given event allows custom handles to be changed.
   *
   * This implementation returns `true`.
   */
  isCustomHandleEvent(me: InternalMouseEvent) {
    return true;
  }

  /**
   * Handles the event if a handle has been clicked. By consuming the
   * event all subsequent events of the gesture are redirected to this
   * handler.
   */
  mouseDown(sender: EventSource, me: InternalMouseEvent) {
    if (!me.isConsumed() && this.graph.isEnabled()) {
      const handle = this.getHandleForEvent(me);

      if (handle) {
        this.start(me.getGraphX(), me.getGraphY(), handle);
        me.consume();
      }
    }
  }

  /**
   * Called if {@link livePreview} is enabled to check if a border should be painted.
   *
   * This implementation returns `true` if the shape is transparent.
   */
  isLivePreviewBorder() {
    return (
      this.state.shape &&
      this.state.shape.fill === NONE &&
      this.state.shape.stroke === NONE
    );
  }

  /**
   * Starts the handling of the mouse gesture.
   */
  start(x: number, y: number, index: number) {
    this.livePreviewActive = this.livePreview && this.state.cell.getChildCount() === 0;
    this.inTolerance = true;
    this.childOffsetX = 0;
    this.childOffsetY = 0;
    this.index = index;
    this.startX = x;
    this.startY = y;

    if (this.index <= InternalEvent.CUSTOM_HANDLE && this.isGhostPreview()) {
      this.ghostPreview = this.createGhostPreview();
    } else {
      // Saves reference to parent state
      const { model } = <Graph>this.state.view.graph;
      const parent = this.state.cell.getParent();

      if (
        this.state.view.currentRoot !== parent &&
        parent &&
        (parent.isVertex() || parent.isEdge())
      ) {
        this.parentState = (<Graph>this.state.view.graph).view.getState(parent);
      }

      // Creates a preview that can be on top of any HTML label
      this.selectionBorder.node.style.display =
        index === InternalEvent.ROTATION_HANDLE ? 'inline' : 'none';

      // Creates the border that represents the new bounds
      if (!this.livePreviewActive || this.isLivePreviewBorder()) {
        this.preview = this.createSelectionShape(this.bounds);

        if (
          !(Client.IS_SVG && Number(this.state.style.rotation || '0') !== 0) &&
          this.state.text != null &&
          this.state.text.node.parentNode === this.graph.container
        ) {
          this.preview.dialect = DIALECT.STRICTHTML;
          this.preview.init(this.graph.container);
        } else {
          this.preview.dialect = DIALECT.SVG;
          this.preview.init(this.graph.view.getOverlayPane());
        }
      }

      if (index === InternalEvent.ROTATION_HANDLE) {
        // With the rotation handle in a corner, need the angle and distance
        const pos = this.getRotationHandlePosition();

        const dx = pos.x - this.state.getCenterX();
        const dy = pos.y - this.state.getCenterY();

        this.startAngle = dx !== 0 ? (Math.atan(dy / dx) * 180) / Math.PI + 90 : 0;
        this.startDist = Math.sqrt(dx * dx + dy * dy);
      }

      // Prepares the handles for live preview
      if (this.livePreviewActive) {
        this.hideSizers();

        if (index === InternalEvent.ROTATION_HANDLE && this.rotationShape) {
          this.rotationShape.node.style.display = '';
        } else if (index === InternalEvent.LABEL_HANDLE && this.labelShape) {
          this.labelShape.node.style.display = '';
        } else if (this.sizers[index]) {
          this.sizers[index].node.style.display = '';
        } else if (index <= InternalEvent.CUSTOM_HANDLE) {
          this.customHandles[InternalEvent.CUSTOM_HANDLE - index].setVisible(true);
        }

        // Gets the array of connected edge handlers for redrawing
        const edges = this.state.cell.getEdges();
        this.edgeHandlers = [];

        const selectionCellsHandler = this.graph.getPlugin<SelectionCellsHandler>(
          'SelectionCellsHandler'
        );

        for (let i = 0; i < edges.length; i += 1) {
          const handler = selectionCellsHandler?.getHandler(edges[i]);
          if (handler) {
            this.edgeHandlers.push(handler as EdgeHandler);
          }
        }
      }
    }
  }

  /**
   * Starts the handling of the mouse gesture.
   */
  createGhostPreview() {
    const shape = this.graph.cellRenderer.createShape(this.state);
    shape.init(this.graph.view.getOverlayPane());
    shape.scale = this.state.view.scale;
    shape.bounds = this.bounds;
    shape.outline = true;

    return shape;
  }

  /**
   * Shortcut to {@link hideSizers}.
   */
  setHandlesVisible(visible: boolean) {
    this.handlesVisible = visible;

    for (let i = 0; i < this.sizers.length; i += 1) {
      this.sizers[i].node.style.display = visible ? '' : 'none';
    }

    for (let i = 0; i < this.customHandles.length; i += 1) {
      this.customHandles[i].setVisible(visible);
    }
  }

  /**
   * Hides all sizers except.
   *
   * Starts the handling of the mouse gesture.
   */
  hideSizers() {
    this.setHandlesVisible(false);
  }

  /**
   * Checks if the coordinates for the given event are within the
   * {@link Graph#tolerance}. If the event is a mouse event then the tolerance is
   * ignored.
   */
  checkTolerance(me: InternalMouseEvent) {
    if (this.inTolerance && this.startX !== null && this.startY !== null) {
      if (
        isMouseEvent(me.getEvent()) ||
        Math.abs(me.getGraphX() - this.startX) > this.graph.getEventTolerance() ||
        Math.abs(me.getGraphY() - this.startY) > this.graph.getEventTolerance()
      ) {
        this.inTolerance = false;
      }
    }
  }

  /**
   * Hook for subclasses do show details while the handler is active.
   */
  updateHint(me: InternalMouseEvent) {
    return;
  }

  /**
   * Hooks for subclasses to hide details when the handler gets inactive.
   */
  removeHint() {
    return;
  }

  /**
   * Hook for rounding the angle. This uses {@link Math.round}.
   */
  roundAngle(angle: number) {
    return Math.round(angle * 10) / 10;
  }

  /**
   * Hook for rounding the unscaled width or height. This uses {@link Math.round}.
   */
  roundLength(length: number) {
    return Math.round(length * 100) / 100;
  }

  /**
   * Handles the event by updating the preview.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    if (!me.isConsumed() && this.index != null) {
      // Checks tolerance for ignoring single clicks
      this.checkTolerance(me);

      if (!this.inTolerance) {
        if (this.index <= InternalEvent.CUSTOM_HANDLE) {
          if (this.customHandles != null) {
            this.customHandles[InternalEvent.CUSTOM_HANDLE - this.index].processEvent(me);
            this.customHandles[InternalEvent.CUSTOM_HANDLE - this.index].active = true;

            if (this.ghostPreview != null) {
              this.ghostPreview.apply(this.state);
              this.ghostPreview.strokeWidth =
                this.getSelectionStrokeWidth() /
                this.ghostPreview.scale /
                this.ghostPreview.scale;
              this.ghostPreview.isDashed = this.isSelectionDashed();
              this.ghostPreview.stroke = this.getSelectionColor();
              this.ghostPreview.redraw();

              if (this.selectionBounds != null) {
                this.selectionBorder.node.style.display = 'none';
              }
            } else {
              if (this.movePreviewToFront) {
                this.moveToFront();
              }

              this.customHandles[
                InternalEvent.CUSTOM_HANDLE - this.index
              ].positionChanged();
            }
          }
        } else if (this.index === InternalEvent.LABEL_HANDLE) {
          this.moveLabel(me);
        } else {
          if (this.index === InternalEvent.ROTATION_HANDLE) {
            this.rotateVertex(me);
          } else {
            this.resizeVertex(me);
          }

          this.updateHint(me);
        }
      }

      me.consume();
    }
    // Workaround for disabling the connect highlight when over handle
    else if (!this.graph.isMouseDown && this.getHandleForEvent(me)) {
      me.consume(false);
    }
  }

  /**
   * Returns `true` if a ghost preview should be used for custom handles.
   */
  isGhostPreview() {
    return this.state.cell.getChildCount() > 0;
  }

  /**
   * Moves the vertex.
   */
  moveLabel(me: InternalMouseEvent) {
    const point = new Point(me.getGraphX(), me.getGraphY());
    const tr = this.graph.view.translate;
    const { scale } = this.graph.view;

    if (this.graph.isGridEnabledEvent(me.getEvent())) {
      point.x = (this.graph.snap(point.x / scale - tr.x) + tr.x) * scale;
      point.y = (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale;
    }

    const index = this.rotationShape ? this.sizers.length - 2 : this.sizers.length - 1;
    this.moveSizerTo(this.sizers[index], point.x, point.y);
  }

  /**
   * Rotates the vertex.
   */
  rotateVertex(me: InternalMouseEvent) {
    const point = new Point(me.getGraphX(), me.getGraphY());
    let dx = this.state.x + this.state.width / 2 - point.x;
    let dy = this.state.y + this.state.height / 2 - point.y;
    this.currentAlpha =
      dx !== 0 ? (Math.atan(dy / dx) * 180) / Math.PI + 90 : dy < 0 ? 180 : 0;

    if (dx > 0) {
      this.currentAlpha -= 180;
    }

    this.currentAlpha -= this.startAngle;

    // Rotation raster
    if (this.rotationRaster && this.graph.isGridEnabledEvent(me.getEvent())) {
      let raster;
      dx = point.x - this.state.getCenterX();
      dy = point.y - this.state.getCenterY();
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist - this.startDist < 2) {
        raster = 15;
      } else if (dist - this.startDist < 25) {
        raster = 5;
      } else {
        raster = 1;
      }

      this.currentAlpha = Math.round(this.currentAlpha / raster) * raster;
    } else {
      this.currentAlpha = this.roundAngle(this.currentAlpha);
    }

    this.selectionBorder.rotation = this.currentAlpha;
    this.selectionBorder.redraw();

    if (this.livePreviewActive) {
      this.redrawHandles();
    }
  }

  /**
   * Resizes the vertex.
   */
  resizeVertex(me: InternalMouseEvent) {
    const ct = new Point(this.state.getCenterX(), this.state.getCenterY());
    const alpha = toRadians(this.state.style.rotation ?? 0);
    const point = new Point(me.getGraphX(), me.getGraphY());
    const tr = this.graph.view.translate;
    const { scale } = this.graph.view;
    let cos = Math.cos(-alpha);
    let sin = Math.sin(-alpha);

    let dx = point.x - this.startX;
    let dy = point.y - this.startY;

    // Rotates vector for mouse gesture
    const tx = cos * dx - sin * dy;
    const ty = sin * dx + cos * dy;

    dx = tx;
    dy = ty;

    const geo = this.state.cell.getGeometry();
    if (geo && this.index !== null) {
      this.unscaledBounds = this.union(
        geo,
        dx / scale,
        dy / scale,
        this.index,
        this.graph.isGridEnabledEvent(me.getEvent()),
        1,
        new Point(0, 0),
        this.isConstrainedEvent(me),
        this.isCenteredEvent(this.state, me)
      );
    }

    // Keeps vertex within maximum graph or parent bounds
    if (geo && !geo.relative) {
      let max = this.graph.getMaximumGraphBounds();

      // Handles child cells
      if (max != null && this.parentState != null) {
        max = Rectangle.fromRectangle(max);

        max.x -= (this.parentState.x - tr.x * scale) / scale;
        max.y -= (this.parentState.y - tr.y * scale) / scale;
      }

      if (this.graph.isConstrainChild(this.state.cell)) {
        let tmp = this.graph.getCellContainmentArea(this.state.cell);

        if (tmp != null) {
          const overlap = this.graph.getOverlap(this.state.cell);

          if (overlap > 0) {
            tmp = Rectangle.fromRectangle(tmp);

            tmp.x -= tmp.width * overlap;
            tmp.y -= tmp.height * overlap;
            tmp.width += 2 * tmp.width * overlap;
            tmp.height += 2 * tmp.height * overlap;
          }

          if (!max) {
            max = tmp;
          } else {
            max = Rectangle.fromRectangle(max);
            max.intersect(tmp);
          }
        }
      }

      if (max && this.unscaledBounds) {
        if (this.unscaledBounds.x < max.x) {
          this.unscaledBounds.width -= max.x - this.unscaledBounds.x;
          this.unscaledBounds.x = max.x;
        }

        if (this.unscaledBounds.y < max.y) {
          this.unscaledBounds.height -= max.y - this.unscaledBounds.y;
          this.unscaledBounds.y = max.y;
        }

        if (this.unscaledBounds.x + this.unscaledBounds.width > max.x + max.width) {
          this.unscaledBounds.width -=
            this.unscaledBounds.x + this.unscaledBounds.width - max.x - max.width;
        }

        if (this.unscaledBounds.y + this.unscaledBounds.height > max.y + max.height) {
          this.unscaledBounds.height -=
            this.unscaledBounds.y + this.unscaledBounds.height - max.y - max.height;
        }
      }
    }

    if (this.unscaledBounds) {
      const old = this.bounds;

      this.bounds = new Rectangle(
        (this.parentState ? this.parentState.x : tr.x * scale) +
          this.unscaledBounds.x * scale,
        (this.parentState ? this.parentState.y : tr.y * scale) +
          this.unscaledBounds.y * scale,
        this.unscaledBounds.width * scale,
        this.unscaledBounds.height * scale
      );

      if (geo && geo.relative && this.parentState) {
        this.bounds.x += this.state.x - this.parentState.x;
        this.bounds.y += this.state.y - this.parentState.y;
      }

      cos = Math.cos(alpha);
      sin = Math.sin(alpha);

      const c2 = new Point(this.bounds.getCenterX(), this.bounds.getCenterY());

      dx = c2.x - ct.x;
      dy = c2.y - ct.y;

      const dx2 = cos * dx - sin * dy;
      const dy2 = sin * dx + cos * dy;

      const dx3 = dx2 - dx;
      const dy3 = dy2 - dy;

      const dx4 = this.bounds.x - this.state.x;
      const dy4 = this.bounds.y - this.state.y;

      const dx5 = cos * dx4 - sin * dy4;
      const dy5 = sin * dx4 + cos * dy4;

      this.bounds.x += dx3;
      this.bounds.y += dy3;

      // Rounds unscaled bounds to int
      this.unscaledBounds.x = this.roundLength(this.unscaledBounds.x + dx3 / scale);
      this.unscaledBounds.y = this.roundLength(this.unscaledBounds.y + dy3 / scale);
      this.unscaledBounds.width = this.roundLength(this.unscaledBounds.width);
      this.unscaledBounds.height = this.roundLength(this.unscaledBounds.height);

      // Shifts the children according to parent offset
      if (!this.state.cell.isCollapsed() && (dx3 !== 0 || dy3 !== 0)) {
        this.childOffsetX = this.state.x - this.bounds.x + dx5;
        this.childOffsetY = this.state.y - this.bounds.y + dy5;
      } else {
        this.childOffsetX = 0;
        this.childOffsetY = 0;
      }

      if (!old.equals(this.bounds)) {
        if (this.livePreviewActive) {
          this.updateLivePreview(me);
        }

        if (this.preview != null) {
          this.drawPreview();
        } else {
          this.updateParentHighlight();
        }
      }
    }
  }

  /**
   * Repaints the live preview.
   */
  updateLivePreview(me: InternalMouseEvent) {
    // TODO: Apply child offset to children in live preview
    const { scale } = this.graph.view;
    const tr = this.graph.view.translate;

    // Saves current state
    const tempState = this.state.clone();

    // Temporarily changes size and origin
    this.state.x = this.bounds.x;
    this.state.y = this.bounds.y;
    this.state.origin = new Point(
      this.state.x / scale - tr.x,
      this.state.y / scale - tr.y
    );
    this.state.width = this.bounds.width;
    this.state.height = this.bounds.height;

    // Redraws cell and handles
    let off = this.state.absoluteOffset;
    off = new Point(off.x, off.y);

    // Required to store and reset absolute offset for updating label position
    this.state.absoluteOffset.x = 0;
    this.state.absoluteOffset.y = 0;
    const geo = this.state.cell.getGeometry();

    if (geo != null) {
      const offset = geo.offset || this.EMPTY_POINT;

      if (offset != null && !geo.relative) {
        this.state.absoluteOffset.x = this.state.view.scale * offset.x;
        this.state.absoluteOffset.y = this.state.view.scale * offset.y;
      }

      this.state.view.updateVertexLabelOffset(this.state);
    }

    // Draws the live preview
    (<Graph>this.state.view.graph).cellRenderer.redraw(this.state, true);

    // Redraws connected edges TODO: Include child edges
    this.state.view.invalidate(this.state.cell);
    this.state.invalid = false;
    this.state.view.validate();
    this.redrawHandles();

    // Moves live preview to front
    if (this.movePreviewToFront) {
      this.moveToFront();
    }

    // Hides folding icon
    if (this.state.control != null && this.state.control.node != null) {
      this.state.control.node.style.visibility = 'hidden';
    }

    // Restores current state
    this.state.setState(tempState);
  }

  /**
   * Handles the event by applying the changes to the geometry.
   */
  moveToFront() {
    if (
      (this.state.text && this.state.text.node && this.state.text.node.nextSibling) ||
      (this.state.shape &&
        this.state.shape.node &&
        this.state.shape.node.nextSibling &&
        (!this.state.text || this.state.shape.node.nextSibling !== this.state.text.node))
    ) {
      if (this.state.shape && this.state.shape.node && this.state.shape.node.parentNode) {
        this.state.shape.node.parentNode.appendChild(this.state.shape.node);
      }

      if (this.state.text && this.state.text.node && this.state.text.node.parentNode) {
        this.state.text.node.parentNode.appendChild(this.state.text.node);
      }
    }
  }

  /**
   * Handles the event by applying the changes to the geometry.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    if (this.index != null && this.state != null) {
      const point = new Point(me.getGraphX(), me.getGraphY());
      const { index } = this;
      this.index = null;

      if (this.ghostPreview == null) {
        // Required to restore order in case of no change
        this.state.view.invalidate(this.state.cell, false, false);
        this.state.view.validate();
      }

      this.graph.batchUpdate(() => {
        if (index <= InternalEvent.CUSTOM_HANDLE) {
          if (this.customHandles != null) {
            // Creates style before changing cell state
            const style = this.state.view.graph.getCellStyle(this.state.cell);

            this.customHandles[InternalEvent.CUSTOM_HANDLE - index].active = false;
            this.customHandles[InternalEvent.CUSTOM_HANDLE - index].execute(me);

            // Sets style and apply on shape to force repaint and
            // check if execute has removed custom handles
            if (
              this.customHandles != null &&
              this.customHandles[InternalEvent.CUSTOM_HANDLE - index] != null
            ) {
              this.state.style = style;
              this.customHandles[InternalEvent.CUSTOM_HANDLE - index].positionChanged();
            }
          }
        } else if (index === InternalEvent.ROTATION_HANDLE) {
          if (this.currentAlpha != null) {
            const delta = this.currentAlpha - (this.state.style.rotation ?? 0);

            if (delta !== 0) {
              this.rotateCell(this.state.cell, delta);
            }
          } else {
            this.rotateClick();
          }
        } else {
          const gridEnabled = this.graph.isGridEnabledEvent(me.getEvent());
          const alpha = toRadians(this.state.style.rotation ?? 0);
          const cos = Math.cos(-alpha);
          const sin = Math.sin(-alpha);

          let dx = point.x - this.startX;
          let dy = point.y - this.startY;

          // Rotates vector for mouse gesture
          const tx = cos * dx - sin * dy;
          const ty = sin * dx + cos * dy;

          dx = tx;
          dy = ty;

          const s = this.graph.view.scale;
          const recurse = this.isRecursiveResize(this.state, me);

          this.resizeCell(
            this.state.cell,
            this.roundLength(dx / s),
            this.roundLength(dy / s),
            index,
            gridEnabled,
            this.isConstrainedEvent(me),
            recurse
          );
        }
      });

      me.consume();
      this.reset();
      this.redrawHandles();
    }
  }

  /**
   * Returns the `recursiveResize` status of the given state.
   * @param state the given {@link CellState}. This implementation takes the value of this state.
   * @param me the mouse event.
   */
  isRecursiveResize(state: CellState, me: InternalMouseEvent) {
    return this.graph.isRecursiveResize(this.state);
  }

  /**
   * Hook for subclasses to implement a single click on the rotation handle.
   * This code is executed as part of the model transaction.
   *
   * This implementation is empty.
   */
  rotateClick() {
    return;
  }

  /**
   * Rotates the given cell and its children by the given angle in degrees.
   *
   * @param cell {@link Cell} to be rotated.
   * @param angle Angle in degrees.
   * @param parent if set, consider the parent in the rotation computation.
   */
  rotateCell(cell: Cell, angle: number, parent?: Cell) {
    if (angle !== 0) {
      const model = this.graph.getDataModel();

      if (cell.isVertex() || cell.isEdge()) {
        if (!cell.isEdge()) {
          const style = this.graph.getCurrentCellStyle(cell);
          const total = (style.rotation || 0) + angle;
          this.graph.setCellStyles('rotation', total, [cell]);
        }

        let geo = cell.getGeometry();

        if (geo && parent) {
          const pgeo = parent.getGeometry();

          if (pgeo != null && !parent.isEdge()) {
            geo = geo.clone();
            geo.rotate(angle, new Point(pgeo.width / 2, pgeo.height / 2));
            model.setGeometry(cell, geo);
          }

          if ((cell.isVertex() && !geo.relative) || cell.isEdge()) {
            // Recursive rotation
            const childCount = cell.getChildCount();

            for (let i = 0; i < childCount; i += 1) {
              this.rotateCell(cell.getChildAt(i), angle, cell);
            }
          }
        }
      }
    }
  }

  /**
   * Resets the state of this handler.
   */
  reset() {
    if (this.index !== null && this.sizers[this.index].node.style.display === 'none') {
      this.sizers[this.index].node.style.display = '';
    }

    this.index = null;

    // TODO: Reset and redraw cell states for live preview
    if (this.preview) {
      this.preview.destroy();
      this.preview = null;
    }

    if (this.ghostPreview) {
      this.ghostPreview.destroy();
      this.ghostPreview = null;
    }

    if (this.livePreviewActive) {
      for (let i = 0; i < this.sizers.length; i += 1) {
        this.sizers[i].node.style.display = '';
      }

      // Shows folding icon
      if (this.state.control && this.state.control.node) {
        this.state.control.node.style.visibility = '';
      }
    }

    for (let i = 0; i < this.customHandles.length; i += 1) {
      if (this.customHandles[i].active) {
        this.customHandles[i].active = false;
        this.customHandles[i].reset();
      } else {
        this.customHandles[i].setVisible(true);
      }
    }

    // Checks if handler has been destroyed
    this.selectionBorder.node.style.display = 'inline';
    this.selectionBounds = this.getSelectionBounds(this.state);
    this.bounds = new Rectangle(
      this.selectionBounds.x,
      this.selectionBounds.y,
      this.selectionBounds.width,
      this.selectionBounds.height
    );
    this.drawPreview();

    this.removeHint();
    this.redrawHandles();
    this.edgeHandlers = [];
    this.handlesVisible = true;
    this.unscaledBounds = null;
  }

  /**
   * Uses the given vector to change the bounds of the given cell
   * in the graph using {@link Graph#resizeCell}.
   */
  resizeCell(
    cell: Cell,
    dx: number,
    dy: number,
    index: number,
    gridEnabled: boolean,
    constrained: boolean,
    recurse: boolean
  ) {
    let geo = cell.getGeometry();

    if (geo) {
      if (
        index === InternalEvent.LABEL_HANDLE &&
        this.labelShape &&
        this.labelShape.bounds
      ) {
        const alpha = -toRadians(this.state.style.rotation ?? 0);
        const cos = Math.cos(alpha);
        const sin = Math.sin(alpha);
        const { scale } = this.graph.view;
        const pt = getRotatedPoint(
          new Point(
            Math.round((this.labelShape.bounds.getCenterX() - this.startX) / scale),
            Math.round((this.labelShape.bounds.getCenterY() - this.startY) / scale)
          ),
          cos,
          sin
        );

        geo = geo.clone();

        if (geo.offset == null) {
          geo.offset = pt;
        } else {
          geo.offset.x += pt.x;
          geo.offset.y += pt.y;
        }

        this.graph.model.setGeometry(cell, geo);
      } else if (this.unscaledBounds) {
        const { scale } = this.graph.view;

        if (this.childOffsetX !== 0 || this.childOffsetY !== 0) {
          this.moveChildren(
            cell,
            Math.round(this.childOffsetX / scale),
            Math.round(this.childOffsetY / scale)
          );
        }

        this.graph.resizeCell(cell, this.unscaledBounds, recurse);
      }
    }
  }

  /**
   * Moves the children of the given cell by the given vector.
   */
  moveChildren(cell: Cell, dx: number, dy: number) {
    const model = this.graph.getDataModel();
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);
      let geo = child.getGeometry();

      if (geo != null) {
        geo = geo.clone();
        geo.translate(dx, dy);
        model.setGeometry(child, geo);
      }
    }
  }

  /**
   * Returns the union of the given bounds and location for the specified
   * handle index.
   *
   * To override this to limit the size of vertex via a minWidth/-Height style,
   * the following code can be used.
   *
   * ```javascript
   * let vertexHandlerUnion = union;
   * union = (bounds, dx, dy, index, gridEnabled, scale, tr, constrained)=>
   * {
   *   let result = vertexHandlerUnion.apply(this, arguments);
   *
   *   result.width = Math.max(result.width, mxUtils.getNumber(this.state.style, 'minWidth', 0));
   *   result.height = Math.max(result.height, mxUtils.getNumber(this.state.style, 'minHeight', 0));
   *
   *   return result;
   * };
   * ```
   *
   * The minWidth/-Height style can then be used as follows:
   *
   * ```javascript
   * graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30, 'minWidth=100;minHeight=100;');
   * ```
   *
   * To override this to update the height for a wrapped text if the width of a vertex is
   * changed, the following can be used.
   *
   * ```javascript
   * let mxVertexHandlerUnion = union;
   * union = (bounds, dx, dy, index, gridEnabled, scale, tr, constrained)=>
   * {
   *   let result = mxVertexHandlerUnion.apply(this, arguments);
   *   let s = this.state;
   *
   *   if (this.graph.isHtmlLabel(s.cell) && (index == 3 || index == 4) &&
   *       s.text != null && s.style.whiteSpace == 'wrap')
   *   {
   *     let label = this.graph.getLabel(s.cell);
   *     let fontSize = mxUtils.getNumber(s.style, 'fontSize', mxConstants.DEFAULT_FONTSIZE);
   *     let ww = result.width / s.view.scale - s.text.spacingRight - s.text.spacingLeft
   *
   *     result.height = mxUtils.getSizeForString(label, fontSize, s.style.fontFamily, ww).height;
   *   }
   *
   *   return result;
   * };
   * ```
   */
  union(
    bounds: Rectangle,
    dx: number,
    dy: number,
    index: number,
    gridEnabled: boolean,
    scale: number,
    tr: Point,
    constrained: boolean,
    centered: boolean
  ) {
    gridEnabled = gridEnabled && this.graph.isGridEnabled();

    if (this.singleSizer) {
      let x = bounds.x + bounds.width + dx;
      let y = bounds.y + bounds.height + dy;

      if (gridEnabled) {
        x = this.graph.snap(x / scale) * scale;
        y = this.graph.snap(y / scale) * scale;
      }

      const rect = new Rectangle(bounds.x, bounds.y, 0, 0);
      rect.add(new Rectangle(x, y, 0, 0));

      return rect;
    }
    const w0 = bounds.width;
    const h0 = bounds.height;
    let left = bounds.x - tr.x * scale;
    let right = left + w0;
    let top = bounds.y - tr.y * scale;
    let bottom = top + h0;

    const cx = left + w0 / 2;
    const cy = top + h0 / 2;

    if (index > 4 /* Bottom Row */) {
      bottom += dy;

      if (gridEnabled) {
        bottom = this.graph.snap(bottom / scale) * scale;
      } else {
        bottom = Math.round(bottom / scale) * scale;
      }
    } else if (index < 3 /* Top Row */) {
      top += dy;

      if (gridEnabled) {
        top = this.graph.snap(top / scale) * scale;
      } else {
        top = Math.round(top / scale) * scale;
      }
    }

    if (index === 0 || index === 3 || index === 5 /* Left */) {
      left += dx;

      if (gridEnabled) {
        left = this.graph.snap(left / scale) * scale;
      } else {
        left = Math.round(left / scale) * scale;
      }
    } else if (index === 2 || index === 4 || index === 7 /* Right */) {
      right += dx;

      if (gridEnabled) {
        right = this.graph.snap(right / scale) * scale;
      } else {
        right = Math.round(right / scale) * scale;
      }
    }

    let width = right - left;
    let height = bottom - top;

    if (constrained) {
      const geo = this.state.cell.getGeometry();

      if (geo != null) {
        const aspect = geo.width / geo.height;

        if (index === 1 || index === 2 || index === 7 || index === 6) {
          width = height * aspect;
        } else {
          height = width / aspect;
        }

        if (index === 0) {
          left = right - width;
          top = bottom - height;
        }
      }
    }

    if (centered) {
      width += width - w0;
      height += height - h0;

      const cdx = cx - (left + width / 2);
      const cdy = cy - (top + height / 2);

      left += cdx;
      top += cdy;
      right += cdx;
      bottom += cdy;
    }

    // Flips over left side
    if (width < 0) {
      left += width;
      width = Math.abs(width);
    }

    // Flips over top side
    if (height < 0) {
      top += height;
      height = Math.abs(height);
    }

    const result = new Rectangle(left + tr.x * scale, top + tr.y * scale, width, height);

    if (this.minBounds != null) {
      result.width = Math.max(
        result.width,
        this.minBounds.x * scale +
          this.minBounds.width * scale +
          Math.max(0, this.x0 * scale - result.x)
      );
      result.height = Math.max(
        result.height,
        this.minBounds.y * scale +
          this.minBounds.height * scale +
          Math.max(0, this.y0 * scale - result.y)
      );
    }

    return result;
  }

  /**
   * Redraws the handles and the preview.
   */
  redraw(ignoreHandles?: boolean) {
    this.selectionBounds = this.getSelectionBounds(this.state);
    this.bounds = new Rectangle(
      this.selectionBounds.x,
      this.selectionBounds.y,
      this.selectionBounds.width,
      this.selectionBounds.height
    );
    this.drawPreview();

    if (!ignoreHandles) {
      this.redrawHandles();
    }
  }

  /**
   * Returns the padding to be used for drawing handles for the current <bounds>.
   */
  getHandlePadding() {
    // KNOWN: Tolerance depends on event type (eg. 0 for mouse events)
    const result = new Point(0, 0);
    let tol = this.tolerance;

    if (
      this.sizers.length > 0 &&
      this.sizers[0].bounds &&
      (this.bounds.width < 2 * this.sizers[0].bounds.width + 2 * tol ||
        this.bounds.height < 2 * this.sizers[0].bounds.height + 2 * tol)
    ) {
      tol /= 2;

      result.x = this.sizers[0].bounds.width + tol;
      result.y = this.sizers[0].bounds.height + tol;
    }

    return result;
  }

  /**
   * Returns the bounds used to paint the resize handles.
   */
  getSizerBounds() {
    return this.bounds;
  }

  /**
   * Redraws the handles. To hide certain handles the following code can be used.
   *
   * ```javascript
   * redrawHandles()
   * {
   *   mxVertexHandlerRedrawHandles.apply(this, arguments);
   *
   *   if (this.sizers != null && this.sizers.length > 7)
   *   {
   *     this.sizers[1].node.style.display = 'none';
   *     this.sizers[6].node.style.display = 'none';
   *   }
   * };
   * ```
   */
  redrawHandles() {
    let s = this.getSizerBounds();
    const tol = this.tolerance;
    this.horizontalOffset = 0;
    this.verticalOffset = 0;

    for (let i = 0; i < this.customHandles.length; i += 1) {
      const shape = this.customHandles[i].shape;

      if (shape) {
        const temp = shape.node.style.display;
        this.customHandles[i].redraw();
        shape.node.style.display = temp;

        // Hides custom handles during text editing
        shape.node.style.visibility =
          this.handlesVisible && this.isCustomHandleVisible(this.customHandles[i])
            ? ''
            : 'hidden';
      }
    }

    if (this.sizers.length > 0 && this.sizers[0]) {
      if (this.index === null && this.manageSizers && this.sizers.length >= 8) {
        // KNOWN: Tolerance depends on event type (eg. 0 for mouse events)
        const padding = this.getHandlePadding();
        this.horizontalOffset = padding.x;
        this.verticalOffset = padding.y;

        if (this.horizontalOffset !== 0 || this.verticalOffset !== 0) {
          s = new Rectangle(s.x, s.y, s.width, s.height);

          s.x -= this.horizontalOffset / 2;
          s.width += this.horizontalOffset;
          s.y -= this.verticalOffset / 2;
          s.height += this.verticalOffset;
        }

        if (this.sizers.length >= 8) {
          if (
            this.sizers[0].bounds &&
            (s.width < 2 * this.sizers[0].bounds.width + 2 * tol ||
              s.height < 2 * this.sizers[0].bounds.height + 2 * tol)
          ) {
            this.sizers[0].node.style.display = 'none';
            this.sizers[2].node.style.display = 'none';
            this.sizers[5].node.style.display = 'none';
            this.sizers[7].node.style.display = 'none';
          } else if (this.handlesVisible) {
            this.sizers[0].node.style.display = '';
            this.sizers[2].node.style.display = '';
            this.sizers[5].node.style.display = '';
            this.sizers[7].node.style.display = '';
          }
        }
      }

      const r = s.x + s.width;
      const b = s.y + s.height;

      if (this.singleSizer) {
        this.moveSizerTo(this.sizers[0], r, b);
      } else {
        const cx = s.x + s.width / 2;
        const cy = s.y + s.height / 2;

        if (this.sizers.length >= 8) {
          const crs = [
            'nw-resize',
            'n-resize',
            'ne-resize',
            'e-resize',
            'se-resize',
            's-resize',
            'sw-resize',
            'w-resize',
          ];

          const alpha = toRadians(this.state.style.rotation ?? 0);
          const cos = Math.cos(alpha);
          const sin = Math.sin(alpha);
          const da = Math.round((alpha * 4) / Math.PI);

          const ct = new Point(s.getCenterX(), s.getCenterY());
          let pt = getRotatedPoint(new Point(s.x, s.y), cos, sin, ct);
          this.moveSizerTo(this.sizers[0], pt.x, pt.y);
          this.sizers[0].setCursor(crs[mod(0 + da, crs.length)]);

          pt.x = cx;
          pt.y = s.y;
          pt = getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[1], pt.x, pt.y);
          this.sizers[1].setCursor(crs[mod(1 + da, crs.length)]);

          pt.x = r;
          pt.y = s.y;
          pt = getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[2], pt.x, pt.y);
          this.sizers[2].setCursor(crs[mod(2 + da, crs.length)]);

          pt.x = s.x;
          pt.y = cy;
          pt = getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[3], pt.x, pt.y);
          this.sizers[3].setCursor(crs[mod(7 + da, crs.length)]);

          pt.x = r;
          pt.y = cy;
          pt = getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[4], pt.x, pt.y);
          this.sizers[4].setCursor(crs[mod(3 + da, crs.length)]);

          pt.x = s.x;
          pt.y = b;
          pt = getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[5], pt.x, pt.y);
          this.sizers[5].setCursor(crs[mod(6 + da, crs.length)]);

          pt.x = cx;
          pt.y = b;
          pt = getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[6], pt.x, pt.y);
          this.sizers[6].setCursor(crs[mod(5 + da, crs.length)]);

          pt.x = r;
          pt.y = b;
          pt = getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[7], pt.x, pt.y);
          this.sizers[7].setCursor(crs[mod(4 + da, crs.length)]);

          pt.x = cx + this.state.absoluteOffset.x;
          pt.y = cy + this.state.absoluteOffset.y;
          pt = getRotatedPoint(pt, cos, sin, ct);
          this.moveSizerTo(this.sizers[8], pt.x, pt.y);
        } else if (this.state.width >= 2 && this.state.height >= 2) {
          this.moveSizerTo(
            this.sizers[0],
            cx + this.state.absoluteOffset.x,
            cy + this.state.absoluteOffset.y
          );
        } else {
          this.moveSizerTo(this.sizers[0], this.state.x, this.state.y);
        }
      }
    }

    if (this.rotationShape) {
      const alpha = toRadians(this.currentAlpha);
      const cos = Math.cos(alpha);
      const sin = Math.sin(alpha);

      const ct = new Point(this.state.getCenterX(), this.state.getCenterY());
      const pt = getRotatedPoint(this.getRotationHandlePosition(), cos, sin, ct);

      if (this.rotationShape.node != null) {
        this.moveSizerTo(this.rotationShape, pt.x, pt.y);

        // Hides rotation handle during text editing
        this.rotationShape.node.style.visibility =
          this.state.view.graph.isEditing() || !this.handlesVisible ? 'hidden' : '';
      }
    }

    if (this.selectionBorder != null) {
      this.selectionBorder.rotation = this.state.style.rotation ?? 0;
    }

    if (this.edgeHandlers != null) {
      for (let i = 0; i < this.edgeHandlers.length; i += 1) {
        this.edgeHandlers[i].redraw();
      }
    }
  }

  /**
   * Returns true if the given custom handle is visible.
   */
  isCustomHandleVisible(handle: CellHandle) {
    return (
      !this.graph.isEditing() && (<Graph>this.state.view.graph).getSelectionCount() === 1
    );
  }

  /**
   * Returns an {@link Point} that defines the rotation handle position.
   */
  getRotationHandlePosition() {
    return new Point(
      this.bounds.x + this.bounds.width / 2,
      this.bounds.y + this.rotationHandleVSpacing
    );
  }

  /**
   * Returns `true` if the parent highlight should be visible.
   *
   * This implementation always returns `true`.
   */
  isParentHighlightVisible() {
    const parent = this.state.cell.getParent();
    return parent ? !this.graph.isCellSelected(parent) : false;
  }

  /**
   * Updates the highlight of the parent if {@link parentHighlightEnabled} is `true`.
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
          if (pstate != null && pstate.parentHighlight === this.parentHighlight) {
            pstate.parentHighlight = null;
          }

          this.parentHighlight.destroy();
          this.parentHighlight = null;
        }
      } else if (this.parentHighlightEnabled && visible) {
        if (
          parent &&
          parent.isVertex() &&
          pstate != null &&
          pstate.parentHighlight == null
        ) {
          this.parentHighlight = this.createParentHighlightShape(pstate);
          // VML dialect required here for event transparency in IE
          this.parentHighlight.dialect = DIALECT.SVG;
          this.parentHighlight.pointerEvents = false;
          this.parentHighlight.rotation = pstate.style.rotation ?? 0;
          this.parentHighlight.init(this.graph.getView().getOverlayPane());
          this.parentHighlight.redraw();

          // Shows highlight once per parent
          pstate.parentHighlight = this.parentHighlight;
        }
      }
    }
  }

  /**
   * Redraws the preview.
   */
  drawPreview() {
    if (this.preview != null) {
      this.preview.bounds = this.bounds;

      if (this.preview.node.parentNode === this.graph.container) {
        this.preview.bounds.width = Math.max(0, this.preview.bounds.width - 1);
        this.preview.bounds.height = Math.max(0, this.preview.bounds.height - 1);
      }

      this.preview.rotation = this.state.style.rotation ?? 0;
      this.preview.redraw();
    }

    this.selectionBorder.bounds = this.getSelectionBorderBounds();
    this.selectionBorder.redraw();
    this.updateParentHighlight();
  }

  /**
   * Returns the bounds for the selection border.
   */
  getSelectionBorderBounds() {
    return this.bounds;
  }

  /**
   * Returns `true` if this handler was destroyed or not initialized.
   */
  isDestroyed() {
    return this.selectionBorder == null;
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   */
  onDestroy() {
    (<Graph>this.state.view.graph).removeListener(this.escapeHandler);
    this.escapeHandler = () => {
      return;
    };

    if (this.preview) {
      this.preview.destroy();
      this.preview = null;
    }

    if (this.parentHighlight) {
      const parent = this.state.cell.getParent();
      const pstate = parent ? this.graph.view.getState(parent) : null;

      if (pstate && pstate.parentHighlight === this.parentHighlight) {
        pstate.parentHighlight = null;
      }

      this.parentHighlight.destroy();
      this.parentHighlight = null;
    }

    if (this.ghostPreview) {
      this.ghostPreview.destroy();
      this.ghostPreview = null;
    }

    if (this.selectionBorder) {
      this.selectionBorder.destroy();
    }

    this.labelShape = null;
    this.removeHint();

    for (let i = 0; i < this.sizers.length; i += 1) {
      this.sizers[i].destroy();
    }

    this.sizers = [];

    for (let i = 0; i < this.customHandles.length; i += 1) {
      this.customHandles[i].destroy();
    }

    this.customHandles = [];
  }
}

export default VertexHandler;
