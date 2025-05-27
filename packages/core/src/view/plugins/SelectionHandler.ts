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

import Client from '../../Client';
import InternalEvent from '../event/InternalEvent';
import { contains, getRotatedPoint, isNumeric, toRadians } from '../../util/mathUtils';
import { convertPoint } from '../../util/styleUtils';
import RectangleShape from '../shape/node/RectangleShape';
import Guide from '../other/Guide';
import Point from '../geometry/Point';
import {
  DROP_TARGET_COLOR,
  INVALID_CONNECT_TARGET_COLOR,
  NONE,
  VALID_COLOR,
} from '../../util/Constants';
import Dictionary from '../../util/Dictionary';
import CellHighlight from '../cell/CellHighlight';
import Rectangle from '../geometry/Rectangle';
import {
  getClientX,
  getClientY,
  isAltDown,
  isMultiTouchEvent,
} from '../../util/EventUtils';
import type { AbstractGraph } from '../AbstractGraph';
import Shape from '../shape/Shape';
import InternalMouseEvent from '../event/InternalMouseEvent';
import type SelectionCellsHandler from './SelectionCellsHandler';
import Cell from '../cell/Cell';
import type PopupMenuHandler from './PopupMenuHandler';
import EventSource from '../event/EventSource';
import CellState from '../cell/CellState';
import EventObject from '../event/EventObject';
import type ConnectionHandler from './ConnectionHandler';
import { EdgeHandlerConfig, VertexHandlerConfig } from '../handler/config';
import type CellEditorHandler from './CellEditorHandler';
import type { ColorValue, GraphPlugin } from '../../types';

/**
 * Graph event handler that handles selection.
 *
 * Individual cells are handled separately by {@link SelectionCellsHandler} using {@link VertexHandler} or one of the {@link EdgeHandler}s.
 * When the {@link SelectionCellsHandler} plugin is registered in the {@link AbstractGraph}, {@link SelectionHandler} interacts with this plugin to propagate global selection events to individual cells.
 *
 * To avoid the container to scroll a moved cell into view, set {@link scrollOnMove} to `false`.
 *
 * @category Plugin
 */
class SelectionHandler implements GraphPlugin {
  static readonly pluginId = 'SelectionHandler';

  /**
   * Constructs an event handler that creates handles for the selection cells.
   *
   * @param graph Reference to the enclosing {@link AbstractGraph}.
   */
  constructor(graph: AbstractGraph) {
    this.graph = graph;
    this.graph.addMouseListener(this);

    // Repaints the handler after autoscroll
    this.panHandler = () => {
      if (!this.suspended) {
        this.updatePreview();
        this.updateHint();
      }
    };

    this.graph.addListener(InternalEvent.PAN, this.panHandler);

    // Handles escape keystrokes
    this.escapeHandler = (sender, evt) => {
      this.reset();
    };

    this.graph.addListener(InternalEvent.ESCAPE, this.escapeHandler);

    // Updates the preview box for remote changes
    this.refreshHandler = (sender, evt) => {
      // Merges multiple pending calls
      if (this.refreshThread) {
        window.clearTimeout(this.refreshThread);
      }

      // Waits for the states and handlers to be updated
      this.refreshThread = window.setTimeout(() => {
        this.refreshThread = null;

        if (this.first && !this.suspended && this.cells) {
          // Updates preview with no translate to compute bounding box
          const dx = this.currentDx;
          const dy = this.currentDy;
          this.currentDx = 0;
          this.currentDy = 0;
          this.updatePreview();
          this.bounds = this.graph.getView().getBounds(this.cells);
          this.pBounds = this.getPreviewBounds(this.cells);

          if (this.pBounds == null && !this.livePreviewUsed) {
            this.reset();
          } else {
            // Restores translate and updates preview
            this.currentDx = dx;
            this.currentDy = dy;
            this.updatePreview();
            this.updateHint();

            if (this.livePreviewUsed) {
              // Forces update to ignore last visible state
              this.setHandlesVisibleForCells(
                this.getSelectionCellsHandler()?.getHandledSelectionCells() ?? [],
                false,
                true
              );
              this.updatePreview();
            }
          }
        }
      }, 0);
    };

    this.graph.getDataModel().addListener(InternalEvent.CHANGE, this.refreshHandler);
    this.graph.addListener(InternalEvent.REFRESH, this.refreshHandler);

    this.keyHandler = (e: KeyboardEvent) => {
      if (
        this.graph.container != null &&
        this.graph.container.style.visibility !== 'hidden' &&
        this.first != null &&
        !this.suspended
      ) {
        const clone =
          this.graph.isCloneEvent(<MouseEvent>(<unknown>e)) &&
          this.graph.isCellsCloneable() &&
          this.isCloneEnabled();

        if (clone !== this.cloning) {
          this.cloning = clone;
          this.checkPreview();
          this.updatePreview();
        }
      }
    };

    if (typeof document !== 'undefined') {
      InternalEvent.addListener(document, 'keydown', this.keyHandler);
      InternalEvent.addListener(document, 'keyup', this.keyHandler);
    }
  }

  /**
   * Reference to the enclosing {@link AbstractGraph}.
   */
  graph: AbstractGraph;

  panHandler: () => void;
  escapeHandler: (sender: EventSource, evt: EventObject) => void;
  refreshHandler: (sender: EventSource, evt: EventObject) => void;
  keyHandler: (e: KeyboardEvent) => void;
  refreshThread: number | null = null;

  /**
   * Defines the maximum number of cells to paint subhandles
   * for. Default is 50 for Firefox and 20 for IE. Set this
   * to 0 if you want an unlimited number of handles to be
   * displayed. This is only recommended if the number of
   * cells in the graph is limited to a small number, eg.
   * 500.
   */
  maxCells = 50;

  /**
   * Specifies if events are handled. Default is true.
   */
  enabled = true;

  /**
   * Specifies if drop targets under the mouse should be enabled. Default is
   * true.
   */
  highlightEnabled = true;

  /**
   * Specifies if cloning by control-drag is enabled. Default is true.
   */
  cloneEnabled = true;

  /**
   * Specifies if moving is enabled. Default is true.
   */
  moveEnabled = true;

  /**
   * Specifies if other cells should be used for snapping the right, center or
   * left side of the current selection. Default is false.
   */
  guidesEnabled = false;

  /**
   * Whether the handles of the selection are currently visible.
   */
  handlesVisible = true;

  /**
   * Holds the {@link Guide} instance that is used for alignment.
   */
  guide: Guide | null = null;

  /**
   * Stores the x-coordinate of the current mouse move.
   */
  currentDx = 0;

  /**
   * Stores the y-coordinate of the current mouse move.
   */
  currentDy = 0;

  /**
   * Specifies if a move cursor should be shown if the mouse is over a movable
   * cell. Default is true.
   */
  updateCursor = true;

  /**
   * Specifies if selecting is enabled. Default is true.
   */
  selectEnabled = true;

  /**
   * Specifies if cells may be moved out of their parents. Default is true.
   */
  removeCellsFromParent = true;

  /**
   * If empty parents should be removed from the model after all child cells
   * have been moved out. Default is true.
   */
  removeEmptyParents = false;

  /**
   * Specifies if drop events are interpreted as new connections if no other
   * drop action is defined. Default is false.
   */
  connectOnDrop = false;

  /**
   * Specifies if the view should be scrolled so that a moved cell is visible.
   * @default true
   */
  scrollOnMove = true;

  /**
   * Specifies the minimum number of pixels for the width and height of a
   * selection border. Default is 6.
   */
  minimumSize = 6;

  /**
   * Specifies the color of the preview shape. Default is black.
   */
  previewColor: ColorValue = 'black';

  /**
   * Specifies if the graph container should be used for preview. If this is used
   * then drop target detection relies entirely on {@link AbstractGraph.getCellAt} because
   * the HTML preview does not "let events through". Default is false.
   */
  htmlPreview = false;

  /**
   * Reference to the {@link Shape} that represents the preview.
   */
  shape: Shape | null = null;

  /**
   * Specifies if the grid should be scaled. Default is false.
   */
  scaleGrid = false;

  /**
   * Specifies if the bounding box should allow for rotation. Default is true.
   */
  rotationEnabled = true;

  /**
   * Maximum number of cells for which live preview should be used.  Default is 0 which means no live preview.
   */
  maxLivePreview = 0;

  /**
   * Variable allowLivePreview
   *
   * If live preview is allowed on this system.  Default is true for systems with SVG support.
   */
  allowLivePreview = Client.IS_SVG;

  cell: Cell | null = null;

  delayedSelection = false;

  first: Point | null = null;
  cells: Cell[] | null = null;
  bounds: Rectangle | null = null;
  pBounds: Rectangle | null = null;
  allCells: Dictionary<Cell, CellState> = new Dictionary();

  cellWasClicked = false;
  cloning = false;
  cellCount = 0;

  target: Cell | null = null;

  suspended = false;
  livePreviewActive = false;
  livePreviewUsed = false;

  highlight: CellHighlight | null = null;

  /**
   * Returns <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Sets <enabled>.
   */
  setEnabled(value: boolean) {
    this.enabled = value;
  }

  /**
   * Returns <cloneEnabled>.
   */
  isCloneEnabled() {
    return this.cloneEnabled;
  }

  /**
   * Sets <cloneEnabled>.
   *
   * @param value Boolean that specifies the new clone enabled state.
   */
  setCloneEnabled(value: boolean) {
    this.cloneEnabled = value;
  }

  /**
   * Returns {@link oveEnabled}.
   */
  isMoveEnabled() {
    return this.moveEnabled;
  }

  /**
   * Sets {@link oveEnabled}.
   */
  setMoveEnabled(value: boolean) {
    this.moveEnabled = value;
  }

  /**
   * Returns <selectEnabled>.
   */
  isSelectEnabled() {
    return this.selectEnabled;
  }

  /**
   * Sets <selectEnabled>.
   */
  setSelectEnabled(value: boolean) {
    this.selectEnabled = value;
  }

  /**
   * Returns <removeCellsFromParent>.
   */
  isRemoveCellsFromParent() {
    return this.removeCellsFromParent;
  }

  /**
   * Sets <removeCellsFromParent>.
   */
  setRemoveCellsFromParent(value: boolean) {
    this.removeCellsFromParent = value;
  }

  /**
   * Returns true if the given cell and parent should propagate
   * selection state to the parent.
   */
  isPropagateSelectionCell(cell: Cell, immediate: boolean, me: InternalMouseEvent) {
    const parent = cell.getParent() as Cell;

    if (immediate) {
      const geo = cell.isEdge() ? null : cell.getGeometry();

      return (
        (!this.graph.isSiblingSelected(cell) && geo && geo.relative) ||
        !this.graph.isSwimlane(parent)
      );
    }
    return (
      (!this.graph.isToggleEvent(me.getEvent()) ||
        (!this.graph.isSiblingSelected(cell) &&
          !this.graph.isCellSelected(cell) &&
          !this.graph.isSwimlane(parent)) ||
        this.graph.isCellSelected(parent)) &&
      (this.graph.isToggleEvent(me.getEvent()) || !this.graph.isCellSelected(parent))
    );
  }

  /**
   * Hook to return initial cell for the given event.
   */
  getInitialCellForEvent(me: InternalMouseEvent) {
    let state = me.getState();

    if (
      (!this.graph.isToggleEvent(me.getEvent()) || !isAltDown(me.getEvent())) &&
      state &&
      !this.graph.isCellSelected(state.cell)
    ) {
      let parent = state.cell.getParent();
      let next = parent ? this.graph.view.getState(parent) : null;

      while (
        next &&
        !this.graph.isCellSelected(next.cell) &&
        (next.cell.isVertex() || next.cell.isEdge()) &&
        this.isPropagateSelectionCell(state.cell, true, me)
      ) {
        state = next;
        parent = state.cell.getParent();
        next = parent ? this.graph.view.getState(parent) : null;
      }
    }

    return state ? state.cell : null;
  }

  /**
   * Hook to return true for delayed selections.
   */
  isDelayedSelection(cell: Cell, me: InternalMouseEvent) {
    let c: Cell | null = cell;

    const selectionCellsHandler = this.getSelectionCellsHandler();

    if (!this.graph.isToggleEvent(me.getEvent()) || !isAltDown(me.getEvent())) {
      while (c) {
        if (selectionCellsHandler?.isHandled(c)) {
          const cellEditorHandler =
            this.graph.getPlugin<CellEditorHandler>('CellEditorHandler');
          return cellEditorHandler?.getEditingCell() !== c;
        }
        c = c.getParent();
      }
    }
    return this.graph.isToggleEvent(me.getEvent()) && !isAltDown(me.getEvent());
  }

  /**
   * Implements the delayed selection for the given mouse event.
   */
  selectDelayed(me: InternalMouseEvent) {
    const popupMenuHandler = this.graph.getPlugin<PopupMenuHandler>('PopupMenuHandler');

    if (!popupMenuHandler || !popupMenuHandler.isPopupTrigger(me)) {
      let cell = me.getCell();
      if (cell === null) {
        cell = this.cell;
      }
      if (cell) this.selectCellForEvent(cell, me);
    }
  }

  /**
   * Selects the given cell for the given {@link MouseEvent}.
   */
  selectCellForEvent(cell: Cell, me: InternalMouseEvent) {
    const state = this.graph.view.getState(cell);

    if (state) {
      if (me.isSource(state.control)) {
        this.graph.selectCellForEvent(cell, me.getEvent());
      } else {
        if (!this.graph.isToggleEvent(me.getEvent()) || !isAltDown(me.getEvent())) {
          let parent = cell.getParent();

          while (
            parent &&
            this.graph.view.getState(parent) &&
            (parent.isVertex() || parent.isEdge()) &&
            this.isPropagateSelectionCell(cell, false, me)
          ) {
            cell = parent;
            parent = cell.getParent();
          }
        }
        this.graph.selectCellForEvent(cell, me.getEvent());
      }
    }
    return cell;
  }

  /**
   * Consumes the given mouse event. NOTE: This may be used to enable click
   * events for links in labels on iOS as follows as consuming the initial
   * touchStart disables firing the subsequent click evnent on the link.
   *
   * <code>
   * consumeMouseEvent(evtName, me)
   * {
   *   var source = mxEvent.getSource(me.getEvent());
   *
   *   if (!mxEvent.isTouchEvent(me.getEvent()) || source.nodeName != 'A')
   *   {
   *     me.consume();
   *   }
   * }
   * </code>
   */
  consumeMouseEvent(evtName: string, me: InternalMouseEvent) {
    me.consume();
  }

  /**
   * Handles the event by selecing the given cell and creating a handle for
   * it. By consuming the event all subsequent events of the gesture are
   * redirected to this handler.
   */
  mouseDown(sender: EventSource, me: InternalMouseEvent) {
    if (
      !me.isConsumed() &&
      this.isEnabled() &&
      this.graph.isEnabled() &&
      me.getState() &&
      !isMultiTouchEvent(me.getEvent())
    ) {
      const cell = this.getInitialCellForEvent(me);

      if (cell) {
        this.delayedSelection = this.isDelayedSelection(cell, me);
        this.cell = null;

        if (this.isSelectEnabled() && !this.delayedSelection) {
          this.graph.selectCellForEvent(cell, me.getEvent());
        }

        if (this.isMoveEnabled()) {
          const geo = cell.getGeometry();

          if (
            geo &&
            this.graph.isCellMovable(cell) &&
            (!cell.isEdge() ||
              this.graph.getSelectionCount() > 1 ||
              (geo.points && geo.points.length > 0) ||
              !cell.getTerminal(true) ||
              !cell.getTerminal(false) ||
              this.graph.isAllowDanglingEdges() ||
              (this.graph.isCloneEvent(me.getEvent()) && this.graph.isCellsCloneable()))
          ) {
            this.start(cell, me.getX(), me.getY());
          } else if (this.delayedSelection) {
            this.cell = cell;
          }

          this.cellWasClicked = true;
          this.consumeMouseEvent(InternalEvent.MOUSE_DOWN, me);
        }
      }
    }
  }

  /**
   * Creates an array of cell states which should be used as guides.
   */
  getGuideStates() {
    const parent = this.graph.getDefaultParent();

    const filter = (cell: Cell) => {
      const geo = cell.getGeometry();

      return (
        !!this.graph.view.getState(cell) && cell.isVertex() && !!geo && !geo.relative
      );
    };

    return this.graph.view.getCellStates(parent.filterDescendants(filter));
  }

  /**
   * Returns the cells to be modified by this handler. This implementation
   * returns all selection cells that are movable, or the given initial cell if
   * the given cell is not selected and movable. This handles the case of moving
   * unselectable or unselected cells.
   *
   * @param initialCell <Cell> that triggered this handler.
   */
  getCells(initialCell: Cell): Cell[] {
    if (!this.delayedSelection && this.graph.isCellMovable(initialCell)) {
      return [initialCell];
    }
    return this.graph.getMovableCells(this.graph.getSelectionCells());
  }

  /**
   * Returns the {@link Rectangle} used as the preview bounds for
   * moving the given cells.
   */
  getPreviewBounds(cells: Cell[]) {
    const bounds = this.getBoundingBox(cells);

    if (bounds) {
      // Corrects width and height
      bounds.width = Math.max(0, bounds.width - 1);
      bounds.height = Math.max(0, bounds.height - 1);

      if (bounds.width < this.minimumSize) {
        const dx = this.minimumSize - bounds.width;
        bounds.x -= dx / 2;
        bounds.width = this.minimumSize;
      } else {
        bounds.x = Math.round(bounds.x);
        bounds.width = Math.ceil(bounds.width);
      }

      if (bounds.height < this.minimumSize) {
        const dy = this.minimumSize - bounds.height;
        bounds.y -= dy / 2;
        bounds.height = this.minimumSize;
      } else {
        bounds.y = Math.round(bounds.y);
        bounds.height = Math.ceil(bounds.height);
      }
    }
    return bounds;
  }

  /**
   * Returns the union of the {@link CellStates} for the given array of {@link Cells}.
   * For vertices, this method uses the bounding box of the corresponding shape
   * if one exists. The bounding box of the corresponding text label and all
   * controls and overlays are ignored. See also: {@link GraphView#getBounds} and
   * {@link AbstractGraph.getBoundingBox}.
   *
   * @param cells Array of {@link Cells} whose bounding box should be returned.
   */
  getBoundingBox(cells: Cell[]) {
    let result = null;

    if (cells.length > 0) {
      for (let i = 0; i < cells.length; i += 1) {
        if (cells[i].isVertex() || cells[i].isEdge()) {
          const state = this.graph.view.getState(cells[i]);

          if (state) {
            let bbox = null;

            if (cells[i].isVertex() && state.shape && state.shape.boundingBox) {
              bbox = state.shape.boundingBox;
            }

            if (bbox) {
              if (!result) {
                result = Rectangle.fromRectangle(bbox);
              } else {
                result.add(bbox);
              }
            }
          }
        }
      }
    }
    return result;
  }

  /**
   * Creates the shape used to draw the preview for the given bounds.
   */
  createPreviewShape(bounds: Rectangle) {
    const shape = new RectangleShape(bounds, NONE, this.previewColor);
    shape.isDashed = true;

    if (this.htmlPreview) {
      shape.dialect = 'strictHtml';
      shape.init(this.graph.container);
    } else {
      // Makes sure to use either VML or SVG shapes in order to implement
      // event-transparency on the background area of the rectangle since
      // HTML shapes do not let mouseevents through even when transparent
      shape.dialect = 'svg';
      shape.init(this.graph.getView().getOverlayPane());
      shape.pointerEvents = false;

      // Workaround for artifacts on iOS
      if (Client.IS_IOS) {
        shape.getSvgScreenOffset = () => {
          return 0;
        };
      }
    }
    return shape;
  }

  createGuide() {
    return new Guide(this.graph, this.getGuideStates());
  }

  /**
   * Starts the handling of the mouse gesture.
   */
  start(cell: Cell, x: number, y: number, cells?: Cell[]) {
    this.cell = cell;
    this.first = convertPoint(this.graph.container, x, y);
    this.cells = cells ? cells : this.getCells(this.cell);
    this.bounds = this.graph.getView().getBounds(this.cells);
    this.pBounds = this.getPreviewBounds(this.cells);
    this.cloning = false;
    this.cellCount = 0;

    for (let i = 0; i < this.cells.length; i += 1) {
      this.cellCount += this.addStates(this.cells[i], this.allCells);
    }

    if (this.guidesEnabled) {
      this.guide = this.createGuide();
      const parent = cell.getParent() as Cell;
      const ignore = parent.getChildCount() < 2;

      // Uses connected states as guides
      const connected = new Dictionary();
      const opps = this.graph.getOpposites(this.graph.getEdges(this.cell), this.cell);

      for (let i = 0; i < opps.length; i += 1) {
        const state = this.graph.view.getState(opps[i]);

        if (state && !connected.get(state)) {
          connected.put(state, true);
        }
      }

      this.guide.isStateIgnored = (state: CellState) => {
        const p = state.cell.getParent();

        return (
          !!state.cell &&
          ((!this.cloning && !!this.isCellMoving(state.cell)) ||
            (state.cell !== (this.target || parent) &&
              !ignore &&
              !connected.get(state) &&
              (!this.target || this.target.getChildCount() >= 2) &&
              p !== (this.target || parent)))
        );
      };
    }
  }

  /**
   * Adds the states for the given cell recursively to the given dictionary.
   * @param cell
   * @param dict
   */
  addStates(cell: Cell, dict: Dictionary<Cell, CellState>) {
    const state = this.graph.view.getState(cell);
    let count = 0;

    if (state && !dict.get(cell)) {
      dict.put(cell, state);
      count++;

      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        count += this.addStates(cell.getChildAt(i), dict);
      }
    }
    return count;
  }

  /**
   * Returns true if the given cell is currently being moved.
   */
  isCellMoving(cell: Cell) {
    return this.allCells.get(cell);
  }

  /**
   * Returns true if the guides should be used for the given {@link MouseEvent}.
   * This implementation returns {@link Guide#isEnabledForEvent}.
   */
  useGuidesForEvent(me: InternalMouseEvent) {
    return this.guide
      ? this.guide.isEnabledForEvent(me.getEvent()) &&
          !this.graph.isConstrainedEvent(me.getEvent())
      : true;
  }

  /**
   * Snaps the given vector to the grid and returns the given mxPoint instance.
   */
  snap(vector: Point) {
    const scale = this.scaleGrid ? this.graph.view.scale : 1;
    vector.x = this.graph.snap(vector.x / scale) * scale;
    vector.y = this.graph.snap(vector.y / scale) * scale;
    return vector;
  }

  /**
   * Returns an {@link Point} that represents the vector for moving the cells
   * for the given {@link MouseEvent}.
   */
  getDelta(me: InternalMouseEvent) {
    const point = convertPoint(this.graph.container, me.getX(), me.getY());

    if (!this.first) return new Point();

    return new Point(
      point.x - this.first.x - this.graph.getPanDx(),
      point.y - this.first.y - this.graph.getPanDy()
    );
  }

  /**
   * Hook for subclassers do show details while the handler is active.
   */
  updateHint(me?: InternalMouseEvent) {
    return;
  }

  /**
   * Hooks for subclassers to hide details when the handler gets inactive.
   */
  removeHint() {
    return;
  }

  /**
   * Hook for rounding the unscaled vector. This uses Math.round.
   */
  roundLength(length: number) {
    return Math.round(length * 100) / 100;
  }

  /**
   * Returns true if the given cell is a valid drop target.
   */
  isValidDropTarget(target: Cell, me: InternalMouseEvent) {
    return this.cell ? this.cell.getParent() !== target : false;
  }

  /**
   * Updates the preview if cloning state has changed.
   */
  checkPreview() {
    if (this.livePreviewActive && this.cloning) {
      this.resetLivePreview();
      this.livePreviewActive = false;
    } else if (
      this.maxLivePreview >= this.cellCount &&
      !this.livePreviewActive &&
      this.allowLivePreview
    ) {
      if (!this.cloning || !this.livePreviewActive) {
        this.livePreviewActive = true;
        this.livePreviewUsed = true;
      }
    } else if (!this.livePreviewUsed && !this.shape && this.bounds) {
      this.shape = this.createPreviewShape(this.bounds);
    }
  }

  /**
   * Handles the event by highlighting possible drop targets and updating the
   * preview.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    const { graph } = this;

    if (
      !me.isConsumed() &&
      graph.isMouseDown &&
      this.cell &&
      this.first &&
      this.bounds &&
      !this.suspended
    ) {
      // Stops moving if a multi touch event is received
      if (isMultiTouchEvent(me.getEvent())) {
        this.reset();
        return;
      }

      let delta = this.getDelta(me);
      const tol = graph.getEventTolerance();

      if (
        this.shape ||
        this.livePreviewActive ||
        Math.abs(delta.x) > tol ||
        Math.abs(delta.y) > tol
      ) {
        // Highlight is used for highlighting drop targets
        if (!this.highlight) {
          this.highlight = new CellHighlight(this.graph, DROP_TARGET_COLOR, 3);
        }

        const clone =
          graph.isCloneEvent(me.getEvent()) &&
          graph.isCellsCloneable() &&
          this.isCloneEnabled();
        const gridEnabled = graph.isGridEnabledEvent(me.getEvent());
        const cell = me.getCell();
        let hideGuide = true;
        let target: Cell | null = null;
        this.cloning = clone;

        if (graph.isDropEnabled() && this.highlightEnabled && this.cells) {
          // Contains a call to getCellAt to find the cell under the mouse
          target = graph.getDropTarget(this.cells, me.getEvent(), cell, clone);
        }

        let state = target ? graph.getView().getState(target) : null;
        let highlight = false;

        if (state && (clone || (target && this.isValidDropTarget(target, me)))) {
          if (this.target !== target) {
            this.target = target;
            this.setHighlightColor(DROP_TARGET_COLOR);
          }

          highlight = true;
        } else {
          this.target = null;

          if (
            this.connectOnDrop &&
            cell &&
            this.cells &&
            this.cells.length === 1 &&
            cell.isVertex() &&
            cell.isConnectable()
          ) {
            state = graph.getView().getState(cell);

            if (state) {
              const error = graph.getEdgeValidationError(null, this.cell, cell);
              const color = error === null ? VALID_COLOR : INVALID_CONNECT_TARGET_COLOR;
              this.setHighlightColor(color);
              highlight = true;
            }
          }
        }

        if (state && highlight) {
          this.highlight.highlight(state);
        } else {
          this.highlight.hide();
        }

        if (this.guide && this.useGuidesForEvent(me)) {
          delta = this.guide.move(this.bounds, delta, gridEnabled, clone);
          hideGuide = false;
        } else {
          delta = this.graph.snapDelta(delta, this.bounds, !gridEnabled, false, false);
        }

        if (this.guide && hideGuide) {
          this.guide.hide();
        }

        // Constrained movement if shift key is pressed
        if (graph.isConstrainedEvent(me.getEvent())) {
          if (Math.abs(delta.x) > Math.abs(delta.y)) {
            delta.y = 0;
          } else {
            delta.x = 0;
          }
        }

        this.checkPreview();

        if (this.currentDx !== delta.x || this.currentDy !== delta.y) {
          this.currentDx = delta.x;
          this.currentDy = delta.y;
          this.updatePreview();
        }
      }

      this.updateHint(me);
      this.consumeMouseEvent(InternalEvent.MOUSE_MOVE, me);

      // Cancels the bubbling of events to the container so
      // that the droptarget is not reset due to an mouseMove
      // fired on the container with no associated state.
      InternalEvent.consume(me.getEvent());
    } else if (
      (this.isMoveEnabled() || this.isCloneEnabled()) &&
      this.updateCursor &&
      !me.isConsumed() &&
      (me.getState() || me.sourceState) &&
      !graph.isMouseDown
    ) {
      let cursor = graph.getCursorForMouseEvent(me);
      const cell = me.getCell();

      if (!cursor && cell && graph.isEnabled() && graph.isCellMovable(cell)) {
        if (cell.isEdge()) {
          cursor = EdgeHandlerConfig.cursorMovable;
        } else {
          cursor = VertexHandlerConfig.cursorMovable;
        }
      }

      // Sets the cursor on the original source state under the mouse
      // instead of the event source state which can be the parent
      if (cursor && me.sourceState) {
        me.sourceState.setCursor(cursor);
      }
    }
  }

  /**
   * Updates the bounds of the preview shape.
   */
  updatePreview(remote = false) {
    if (this.livePreviewUsed && !remote) {
      if (this.cells) {
        this.setHandlesVisibleForCells(
          this.getSelectionCellsHandler()?.getHandledSelectionCells() ?? [],
          false
        );
        this.updateLivePreview(this.currentDx, this.currentDy);
      }
    } else {
      this.updatePreviewShape();
    }
  }

  /**
   * Updates the bounds of the preview shape.
   */
  updatePreviewShape() {
    if (this.shape && this.pBounds) {
      this.shape.bounds = new Rectangle(
        Math.round(this.pBounds.x + this.currentDx),
        Math.round(this.pBounds.y + this.currentDy),
        this.pBounds.width,
        this.pBounds.height
      );
      this.shape.redraw();
    }
  }

  /**
   * Updates the bounds of the preview shape.
   */
  updateLivePreview(dx: number, dy: number) {
    if (!this.suspended) {
      const states: CellState[][] = [];

      if (this.allCells) {
        this.allCells.visit((key, state: CellState | null) => {
          const realState = state ? this.graph.view.getState(state.cell) : null;

          // Checks if cell was removed or replaced
          if (realState !== state && state) {
            state.destroy();

            if (realState) {
              this.allCells.put(state.cell, realState);
            } else {
              this.allCells.remove(state.cell);
            }

            state = realState;
          }

          if (state) {
            // Saves current state
            const tempState = state.clone();
            states.push([state, tempState]);

            // Makes transparent for events to detect drop targets
            if (state.shape) {
              if (state.shape.originalPointerEvents === null) {
                state.shape.originalPointerEvents = state.shape.pointerEvents;
              }

              state.shape.pointerEvents = false;

              if (state.text) {
                if (state.text.originalPointerEvents === null) {
                  state.text.originalPointerEvents = state.text.pointerEvents;
                }

                state.text.pointerEvents = false;
              }
            }

            // Temporarily changes position
            if (state.cell.isVertex()) {
              state.x += dx;
              state.y += dy;

              // Draws the live preview
              if (!this.cloning) {
                state.view.graph.cellRenderer.redraw(state, true);

                // Forces redraw of connected edges after all states
                // have been updated but avoids update of state
                state.view.invalidate(state.cell);
                state.invalid = false;

                // Hides folding icon
                if (state.control && state.control.node) {
                  state.control.node.style.visibility = 'hidden';
                }
              }
              // Clone live preview may use text bounds
              else if (state.text) {
                state.text.updateBoundingBox();

                // Fixes preview box for edge labels
                if (state.text.boundingBox) {
                  state.text.boundingBox.x += dx;
                  state.text.boundingBox.y += dy;
                }

                if (state.text.unrotatedBoundingBox) {
                  state.text.unrotatedBoundingBox.x += dx;
                  state.text.unrotatedBoundingBox.y += dy;
                }
              }
            }
          }
        });
      }

      // Resets the handler if everything was removed
      if (states.length === 0) {
        this.reset();
      } else {
        // Redraws connected edges
        const s = this.graph.view.scale;

        for (let i = 0; i < states.length; i += 1) {
          const state = states[i][0];

          if (state.cell.isEdge()) {
            const geometry = state.cell.getGeometry();
            const points = [];

            if (geometry && geometry.points) {
              for (let j = 0; j < geometry.points.length; j++) {
                if (geometry.points[j]) {
                  points.push(
                    new Point(
                      geometry.points[j].x + dx / s,
                      geometry.points[j].y + dy / s
                    )
                  );
                }
              }
            }

            let source = state.visibleSourceState;
            let target = state.visibleTargetState;
            const pts = states[i][1].absolutePoints;

            if (source == null || !this.isCellMoving(source.cell)) {
              const pt0 = pts[0];

              if (pt0) {
                state.setAbsoluteTerminalPoint(new Point(pt0.x + dx, pt0.y + dy), true);
                source = null;
              }
            } else {
              state.view.updateFixedTerminalPoint(
                state,
                source,
                true,
                this.graph.getConnectionConstraint(state, source, true)
              );
            }

            if (target == null || !this.isCellMoving(target.cell)) {
              const ptn = pts[pts.length - 1];

              if (ptn) {
                state.setAbsoluteTerminalPoint(new Point(ptn.x + dx, ptn.y + dy), false);
                target = null;
              }
            } else {
              state.view.updateFixedTerminalPoint(
                state,
                target,
                false,
                this.graph.getConnectionConstraint(state, target, false)
              );
            }

            state.view.updatePoints(state, points, source, target);
            state.view.updateFloatingTerminalPoints(state, source, target);
            state.view.updateEdgeLabelOffset(state);
            state.invalid = false;

            // Draws the live preview but avoids update of state
            if (!this.cloning) {
              state.view.graph.cellRenderer.redraw(state, true);
            }
          }
        }

        this.graph.view.validate();
        this.redrawHandles(states);
        this.resetPreviewStates(states);
      }
    }
  }

  /**
   * Redraws the preview shape for the given states array.
   */
  redrawHandles(states: CellState[][]) {
    const selectionCellsHandler = this.getSelectionCellsHandler();

    for (let i = 0; i < states.length; i += 1) {
      const handler = selectionCellsHandler?.getHandler(states[i][0].cell);
      handler?.redraw(true);
    }
  }

  /**
   * Resets the given preview states array.
   */
  resetPreviewStates(states: CellState[][]) {
    for (let i = 0; i < states.length; i += 1) {
      states[i][0].setState(states[i][1]);
    }
  }

  /**
   * Suspends the livew preview.
   */
  suspend() {
    if (!this.suspended) {
      if (this.livePreviewUsed) {
        this.updateLivePreview(0, 0);
      }

      if (this.shape) {
        this.shape.node.style.visibility = 'hidden';
      }

      if (this.guide) {
        this.guide.setVisible(false);
      }

      this.suspended = true;
    }
  }

  /**
   * Suspends the livew preview.
   */
  resume() {
    if (this.suspended) {
      this.suspended = false;

      if (this.livePreviewUsed) {
        this.livePreviewActive = true;
      }

      if (this.shape) {
        this.shape.node.style.visibility = 'visible';
      }

      if (this.guide) {
        this.guide.setVisible(true);
      }
    }
  }

  /**
   * Resets the livew preview.
   */
  resetLivePreview() {
    this.allCells.visit((key, state) => {
      // Restores event handling
      if (state.shape && state.shape.originalPointerEvents !== null) {
        state.shape.pointerEvents = state.shape.originalPointerEvents;
        state.shape.originalPointerEvents = null;

        // Forces repaint even if not moved to update pointer events
        state.shape.bounds = null;

        if (state.text && state.text.originalPointerEvents !== null) {
          state.text.pointerEvents = state.text.originalPointerEvents;
          state.text.originalPointerEvents = null;
        }
      }

      // Shows folding icon
      if (
        state.control &&
        state.control.node &&
        state.control.node.style.visibility === 'hidden'
      ) {
        state.control.node.style.visibility = '';
      }

      // Fixes preview box for edge labels
      if (!this.cloning) {
        if (state.text) {
          state.text.updateBoundingBox();
        }
      }

      // Forces repaint of connected edges
      state.view.invalidate(state.cell);
    });

    // Repaints all invalid states
    this.graph.view.validate();
  }

  /**
   * Sets whether the handles attached to the given cells are visible.
   *
   * @param cells Array of {@link Cell}s.
   * @param visible Boolean that specifies if the handles should be visible.
   * @param force Forces an update of the handler regardless of the last used value.
   */
  setHandlesVisibleForCells(cells: Cell[], visible: boolean, force = false) {
    if (force || this.handlesVisible !== visible) {
      this.handlesVisible = visible;

      const selectionCellsHandler = this.getSelectionCellsHandler();

      for (let i = 0; i < cells.length; i += 1) {
        const handler = selectionCellsHandler?.getHandler(cells[i]);
        if (handler) {
          handler.setHandlesVisible(visible);
          if (visible) {
            handler.redraw();
          }
        }
      }
    }
  }

  /**
   * Sets the color of the rectangle used to highlight drop targets.
   *
   * @param color String that represents the new highlight color.
   */
  setHighlightColor(color: ColorValue) {
    if (this.highlight) {
      this.highlight.setHighlightColor(color);
    }
  }

  /**
   * Handles the event by applying the changes to the selection cells.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    if (!me.isConsumed()) {
      if (this.livePreviewUsed) {
        this.resetLivePreview();
      }

      if (
        this.cell &&
        this.first &&
        (this.shape || this.livePreviewUsed) &&
        isNumeric(this.currentDx) &&
        isNumeric(this.currentDy)
      ) {
        const { graph } = this;
        const cell = me.getCell();

        if (
          this.connectOnDrop &&
          !this.target &&
          cell &&
          cell.isVertex() &&
          cell.isConnectable() &&
          graph.isEdgeValid(null, this.cell, cell)
        ) {
          const connectionHandler =
            graph.getPlugin<ConnectionHandler>('ConnectionHandler');

          connectionHandler?.connect(this.cell, cell, me.getEvent());
        } else {
          const clone =
            graph.isCloneEvent(me.getEvent()) &&
            graph.isCellsCloneable() &&
            this.isCloneEnabled();
          const { scale } = graph.getView();
          const dx = this.roundLength(this.currentDx / scale);
          const dy = this.roundLength(this.currentDy / scale);
          const target = this.target;

          if (
            target &&
            graph.isSplitEnabled() &&
            this.cells &&
            graph.isSplitTarget(target, this.cells, me.getEvent())
          ) {
            graph.splitEdge(
              target,
              this.cells,
              null,
              dx,
              dy,
              me.getGraphX(),
              me.getGraphY()
            );
          } else if (this.cells) {
            this.moveCells(this.cells, dx, dy, clone, this.target, me.getEvent());
          }
        }
      } else if (this.isSelectEnabled() && this.delayedSelection && this.cell != null) {
        this.selectDelayed(me);
      }
    }

    // Consumes the event if a cell was initially clicked
    if (this.cellWasClicked) {
      this.consumeMouseEvent(InternalEvent.MOUSE_UP, me);
    }

    this.reset();
  }

  /**
   * Resets the state of this handler.
   */
  reset() {
    if (this.livePreviewUsed) {
      this.resetLivePreview();

      this.setHandlesVisibleForCells(
        this.getSelectionCellsHandler()?.getHandledSelectionCells() ?? [],
        true
      );
    }

    this.destroyShapes();
    this.removeHint();

    this.delayedSelection = false;
    this.livePreviewActive = false;
    this.livePreviewUsed = false;
    this.cellWasClicked = false;
    this.suspended = false;
    this.currentDx = 0;
    this.currentDy = 0;
    this.cellCount = 0;
    this.cloning = false;
    this.allCells.clear();
    this.pBounds = null;
    this.target = null;
    this.first = null;
    this.cells = null;
    this.cell = null;
  }

  /**
   * Returns true if the given cells should be removed from the parent for the specified
   * mousereleased event.
   */
  shouldRemoveCellsFromParent(parent: Cell, cells: Cell[], evt: MouseEvent) {
    if (parent.isVertex()) {
      const pState = this.graph.getView().getState(parent);

      if (pState) {
        let pt = convertPoint(this.graph.container, getClientX(evt), getClientY(evt));

        const alpha = toRadians(pState.style.rotation ?? 0);

        if (alpha !== 0) {
          const cos = Math.cos(-alpha);
          const sin = Math.sin(-alpha);
          const cx = new Point(pState.getCenterX(), pState.getCenterY());
          pt = getRotatedPoint(pt, cos, sin, cx);
        }

        return !contains(pState, pt.x, pt.y);
      }
    }

    return false;
  }

  /**
   * Moves the given cells by the specified amount.
   */
  moveCells(
    cells: Cell[],
    dx: number,
    dy: number,
    clone: boolean,
    target: Cell | null,
    evt: MouseEvent
  ) {
    if (!this.cell) return;

    if (clone) {
      cells = this.graph.getCloneableCells(cells);
    }

    // Removes cells from parent
    const parent = this.cell.getParent();

    if (
      !target &&
      parent &&
      this.isRemoveCellsFromParent() &&
      this.shouldRemoveCellsFromParent(parent, cells, evt)
    ) {
      target = this.graph.getDefaultParent();
    }

    // Cloning into locked cells is not allowed
    clone = !!clone && !this.graph.isCellLocked(target || this.graph.getDefaultParent());

    this.graph.batchUpdate(() => {
      const parents = [];

      // Removes parent if all child cells are removed
      if (!clone && target && this.removeEmptyParents) {
        // Collects all non-selected parents
        const dict = new Dictionary();

        for (let i = 0; i < cells.length; i += 1) {
          dict.put(cells[i], true);
        }

        // LATER: Recurse up the cell hierarchy
        for (let i = 0; i < cells.length; i += 1) {
          const par = cells[i].getParent();

          if (par && !dict.get(par)) {
            dict.put(par, true);
            parents.push(par);
          }
        }
      }

      // Passes all selected cells in order to correctly clone or move into
      // the target cell. The method checks for each cell if its movable.
      cells = this.graph.moveCells(cells, dx, dy, clone, target, evt);

      // Removes parent if all child cells are removed
      const temp = [];

      for (let i = 0; i < parents.length; i += 1) {
        if (this.shouldRemoveParent(parents[i])) {
          temp.push(parents[i]);
        }
      }

      this.graph.removeCells(temp, false);
    });

    // Selects the new cells if cells have been cloned
    if (clone) {
      this.graph.setSelectionCells(cells);
    }

    if (this.isSelectEnabled() && this.scrollOnMove) {
      this.graph.scrollCellToVisible(cells[0]);
    }
  }

  /**
   * Returns true if the given parent should be removed after removal of child cells.
   */
  shouldRemoveParent(parent: Cell) {
    const state = this.graph.view.getState(parent);

    return (
      state != null &&
      (state.cell.isEdge() || state.cell.isVertex()) &&
      this.graph.isCellDeletable(state.cell) &&
      state.cell.getChildCount() === 0 &&
      state.isTransparentState()
    );
  }

  /**
   * Destroy the preview and highlight shapes.
   */
  destroyShapes() {
    // Destroys the preview dashed rectangle
    if (this.shape) {
      this.shape.destroy();
      this.shape = null;
    }

    if (this.guide) {
      this.guide.destroy();
      this.guide = null;
    }

    // Destroys the drop target highlight
    if (this.highlight) {
      this.highlight.destroy();
      this.highlight = null;
    }
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   */
  onDestroy() {
    this.graph.removeMouseListener(this);
    this.graph.removeListener(this.panHandler);
    this.graph.removeListener(this.escapeHandler);

    this.graph.getDataModel().removeListener(this.refreshHandler);
    this.graph.removeListener(this.refreshHandler);

    InternalEvent.removeListener(document, 'keydown', this.keyHandler);
    InternalEvent.removeListener(document, 'keyup', this.keyHandler);

    this.destroyShapes();
    this.removeHint();
  }

  private getSelectionCellsHandler(): SelectionCellsHandler | undefined {
    return this.graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler');
  }
}

export default SelectionHandler;
