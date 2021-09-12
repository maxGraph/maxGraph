/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxClient from '../mxClient';
import InternalEvent from './event/InternalEvent';
import {
  contains,
  convertPoint,
  getRotatedPoint,
  isNumeric,
  toRadians,
} from '../util/Utils';
import RectangleShape from './geometry/shape/node/RectangleShape';
import mxGuide from '../util/Guide';
import Point from './geometry/Point';
import {
  CURSOR_MOVABLE_EDGE,
  CURSOR_MOVABLE_VERTEX,
  DIALECT_STRICTHTML,
  DIALECT_SVG,
  DROP_TARGET_COLOR,
  INVALID_CONNECT_TARGET_COLOR,
  NONE,
  VALID_COLOR,
} from '../util/Constants';
import Dictionary from '../util/Dictionary';
import CellHighlight from './selection/CellHighlight';
import Rectangle from './geometry/Rectangle';
import { getClientX, getClientY, isAltDown, isMultiTouchEvent } from '../util/EventUtils';
import { Graph } from './Graph';
import Guide from '../util/Guide';
import Shape from './geometry/shape/Shape';
import InternalMouseEvent from './event/InternalMouseEvent';
import SelectionCellsHandler from './selection/SelectionCellsHandler';
import Cell from './cell/datatypes/Cell';
import PopupMenuHandler from './popups_menus/PopupMenuHandler';
import EventSource from './event/EventSource';
import CellArray from './cell/datatypes/CellArray';
import CellState from './cell/datatypes/CellState';
import EventObject from './event/EventObject';
import ConnectionHandler from './connection/ConnectionHandler';
import CellEditor from './editing/CellEditor';

import type { ColorValue, GraphPlugin } from '../types';

/**
 * Class: mxGraphHandler
 *
 * Graph event handler that handles selection. Individual cells are handled
 * separately using <mxVertexHandler> or one of the edge handlers. These
 * handlers are created using <mxGraph.createHandler> in
 * <mxGraphSelectionModel.cellAdded>.
 *
 * To avoid the container to scroll a moved cell into view, set
 * <scrollAfterMove> to false.
 *
 * Constructor: mxGraphHandler
 *
 * Constructs an event handler that creates handles for the
 * selection cells.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 */
class GraphHandler implements GraphPlugin {
  static pluginId = 'GraphHandler';

  constructor(graph: Graph) {
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
              const selectionCellsHandler = this.graph.getPlugin(
                'SelectionCellsHandler'
              ) as SelectionCellsHandler;

              // Forces update to ignore last visible state
              this.setHandlesVisibleForCells(
                selectionCellsHandler.getHandledSelectionCells(),
                false,
                true
              );
              this.updatePreview();
            }
          }
        }
      }, 0);
    };

    this.graph.getModel().addListener(InternalEvent.CHANGE, this.refreshHandler);
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
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  graph: Graph;

  panHandler: () => void;
  escapeHandler: (sender: EventSource, evt: EventObject) => void;
  refreshHandler: (sender: EventSource, evt: EventObject) => void;
  keyHandler: (e: KeyboardEvent) => void;
  refreshThread: number | null = null;

  /**
   * Variable: maxCells
   *
   * Defines the maximum number of cells to paint subhandles
   * for. Default is 50 for Firefox and 20 for IE. Set this
   * to 0 if you want an unlimited number of handles to be
   * displayed. This is only recommended if the number of
   * cells in the graph is limited to a small number, eg.
   * 500.
   */
  maxCells = 50;

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is true.
   */
  enabled = true;

  /**
   * Variable: highlightEnabled
   *
   * Specifies if drop targets under the mouse should be enabled. Default is
   * true.
   */
  highlightEnabled = true;

  /**
   * Variable: cloneEnabled
   *
   * Specifies if cloning by control-drag is enabled. Default is true.
   */
  cloneEnabled = true;

  /**
   * Variable: moveEnabled
   *
   * Specifies if moving is enabled. Default is true.
   */
  moveEnabled = true;

  /**
   * Variable: guidesEnabled
   *
   * Specifies if other cells should be used for snapping the right, center or
   * left side of the current selection. Default is false.
   */
  guidesEnabled = false;

  /**
   * Variable: handlesVisible
   *
   * Whether the handles of the selection are currently visible.
   */
  handlesVisible = true;

  /**
   * Variable: guide
   *
   * Holds the <mxGuide> instance that is used for alignment.
   */
  guide: Guide | null = null;

  /**
   * Variable: currentDx
   *
   * Stores the x-coordinate of the current mouse move.
   */
  currentDx = 0;

  /**
   * Variable: currentDy
   *
   * Stores the y-coordinate of the current mouse move.
   */
  currentDy = 0;

  /**
   * Variable: updateCursor
   *
   * Specifies if a move cursor should be shown if the mouse is over a movable
   * cell. Default is true.
   */
  updateCursor = true;

  /**
   * Variable: selectEnabled
   *
   * Specifies if selecting is enabled. Default is true.
   */
  selectEnabled = true;

  /**
   * Variable: removeCellsFromParent
   *
   * Specifies if cells may be moved out of their parents. Default is true.
   */
  removeCellsFromParent = true;

  /**
   * Variable: removeEmptyParents
   *
   * If empty parents should be removed from the model after all child cells
   * have been moved out. Default is true.
   */
  removeEmptyParents = false;

  /**
   * Variable: connectOnDrop
   *
   * Specifies if drop events are interpreted as new connections if no other
   * drop action is defined. Default is false.
   */
  connectOnDrop = false;

  /**
   * Variable: scrollOnMove
   *
   * Specifies if the view should be scrolled so that a moved cell is
   * visible. Default is true.
   */
  scrollOnMove = true;

  /**
   * Variable: minimumSize
   *
   * Specifies the minimum number of pixels for the width and height of a
   * selection border. Default is 6.
   */
  minimumSize = 6;

  /**
   * Variable: previewColor
   *
   * Specifies the color of the preview shape. Default is black.
   */
  previewColor: ColorValue = 'black';

  /**
   * Variable: htmlPreview
   *
   * Specifies if the graph container should be used for preview. If this is used
   * then drop target detection relies entirely on <mxGraph.getCellAt> because
   * the HTML preview does not "let events through". Default is false.
   */
  htmlPreview = false;

  /**
   * Variable: shape
   *
   * Reference to the <mxShape> that represents the preview.
   */
  shape: Shape | null = null;

  /**
   * Variable: scaleGrid
   *
   * Specifies if the grid should be scaled. Default is false.
   */
  scaleGrid = false;

  /**
   * Variable: rotationEnabled
   *
   * Specifies if the bounding box should allow for rotation. Default is true.
   */
  rotationEnabled = true;

  /**
   * Variable: maxLivePreview
   *
   * Maximum number of cells for which live preview should be used.  Default is 0 which means no live preview.
   */
  maxLivePreview = 0;

  /**
   * Variable allowLivePreview
   *
   * If live preview is allowed on this system.  Default is true for systems with SVG support.
   */
  allowLivePreview = mxClient.IS_SVG;

  cell: Cell | null = null;

  delayedSelection = false;

  first: Point | null = null;
  cells: CellArray | null = null;
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
   * Function: isEnabled
   *
   * Returns <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Function: setEnabled
   *
   * Sets <enabled>.
   */
  setEnabled(value: boolean) {
    this.enabled = value;
  }

  /**
   * Function: isCloneEnabled
   *
   * Returns <cloneEnabled>.
   */
  isCloneEnabled() {
    return this.cloneEnabled;
  }

  /**
   * Function: setCloneEnabled
   *
   * Sets <cloneEnabled>.
   *
   * Parameters:
   *
   * value - Boolean that specifies the new clone enabled state.
   */
  setCloneEnabled(value: boolean) {
    this.cloneEnabled = value;
  }

  /**
   * Function: isMoveEnabled
   *
   * Returns <moveEnabled>.
   */
  isMoveEnabled() {
    return this.moveEnabled;
  }

  /**
   * Function: setMoveEnabled
   *
   * Sets <moveEnabled>.
   */
  setMoveEnabled(value: boolean) {
    this.moveEnabled = value;
  }

  /**
   * Function: isSelectEnabled
   *
   * Returns <selectEnabled>.
   */
  isSelectEnabled() {
    return this.selectEnabled;
  }

  /**
   * Function: setSelectEnabled
   *
   * Sets <selectEnabled>.
   */
  setSelectEnabled(value: boolean) {
    this.selectEnabled = value;
  }

  /**
   * Function: isRemoveCellsFromParent
   *
   * Returns <removeCellsFromParent>.
   */
  isRemoveCellsFromParent() {
    return this.removeCellsFromParent;
  }

  /**
   * Function: setRemoveCellsFromParent
   *
   * Sets <removeCellsFromParent>.
   */
  setRemoveCellsFromParent(value: boolean) {
    this.removeCellsFromParent = value;
  }

  /**
   * Function: isPropagateSelectionCell
   *
   * Returns true if the given cell and parent should propagate
   * selection state to the parent.
   */
  isPropagateSelectionCell(cell: Cell, immediate: boolean, me: InternalMouseEvent) {
    const parent = cell.getParent() as Cell;

    if (immediate) {
      const geo = cell.isEdge() ? null : cell.getGeometry();

      return (
        !this.graph.isSiblingSelected(cell) &&
        geo &&
        geo.relative /* disable swimlane for now || !this.graph.isSwimlane(parent) */
      );
    }
    return (
      (!this.graph.isToggleEvent(me.getEvent()) ||
        (!this.graph.isSiblingSelected(cell) && !this.graph.isCellSelected(cell)) ||
        /* disable swimlane for now !this.graph.isSwimlane(parent)*/
        this.graph.isCellSelected(parent)) &&
      (this.graph.isToggleEvent(me.getEvent()) || !this.graph.isCellSelected(parent))
    );
  }

  /**
   * Function: getInitialCellForEvent
   *
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
   * Function: isDelayedSelection
   *
   * Hook to return true for delayed selections.
   */
  isDelayedSelection(cell: Cell, me: InternalMouseEvent) {
    let c: Cell | null = cell;

    const selectionCellsHandler = this.graph.getPlugin(
      'SelectionCellsHandler'
    ) as SelectionCellsHandler;

    if (!this.graph.isToggleEvent(me.getEvent()) || !isAltDown(me.getEvent())) {
      while (c) {
        if (selectionCellsHandler.isHandled(c)) {
          const cellEditor = this.graph.getPlugin('CellEditor') as CellEditor;
          return cellEditor.getEditingCell() !== c;
        }

        c = c.getParent();
      }
    }

    return this.graph.isToggleEvent(me.getEvent()) && !isAltDown(me.getEvent());
  }

  /**
   * Function: selectDelayed
   *
   * Implements the delayed selection for the given mouse event.
   */
  selectDelayed(me: InternalMouseEvent) {
    const popupMenuHandler = this.graph.getPlugin('PopupMenuHandler') as PopupMenuHandler;

    if (!popupMenuHandler.isPopupTrigger(me)) {
      let cell = me.getCell();

      if (cell === null) {
        cell = this.cell;
      }

      if (cell) this.selectCellForEvent(cell, me);
    }
  }

  /**
   * Function: selectCellForEvent
   *
   * Selects the given cell for the given <mxMouseEvent>.
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
   * Function: consumeMouseEvent
   *
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
   * Function: mouseDown
   *
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
              geo.points.length > 0 ||
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
   * Function: getGuideStates
   *
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
   * Function: getCells
   *
   * Returns the cells to be modified by this handler. This implementation
   * returns all selection cells that are movable, or the given initial cell if
   * the given cell is not selected and movable. This handles the case of moving
   * unselectable or unselected cells.
   *
   * Parameters:
   *
   * initialCell - <mxCell> that triggered this handler.
   */
  getCells(initialCell: Cell) {
    if (!this.delayedSelection && this.graph.isCellMovable(initialCell)) {
      return new CellArray(initialCell);
    }
    return this.graph.getMovableCells(this.graph.getSelectionCells());
  }

  /**
   * Function: getPreviewBounds
   *
   * Returns the <mxRectangle> used as the preview bounds for
   * moving the given cells.
   */
  getPreviewBounds(cells: CellArray) {
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
   * Function: getBoundingBox
   *
   * Returns the union of the <mxCellStates> for the given array of <mxCells>.
   * For vertices, this method uses the bounding box of the corresponding shape
   * if one exists. The bounding box of the corresponding text label and all
   * controls and overlays are ignored. See also: <mxGraphView.getBounds> and
   * <mxGraph.getBoundingBox>.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> whose bounding box should be returned.
   */
  getBoundingBox(cells: CellArray) {
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
   * Function: createPreviewShape
   *
   * Creates the shape used to draw the preview for the given bounds.
   */
  createPreviewShape(bounds: Rectangle) {
    const shape = new RectangleShape(bounds, NONE, this.previewColor);
    shape.isDashed = true;

    if (this.htmlPreview) {
      shape.dialect = DIALECT_STRICTHTML;
      shape.init(this.graph.container);
    } else {
      // Makes sure to use either VML or SVG shapes in order to implement
      // event-transparency on the background area of the rectangle since
      // HTML shapes do not let mouseevents through even when transparent
      shape.dialect = DIALECT_SVG;
      shape.init(this.graph.getView().getOverlayPane());
      shape.pointerEvents = false;

      // Workaround for artifacts on iOS
      if (mxClient.IS_IOS) {
        shape.getSvgScreenOffset = () => {
          return 0;
        };
      }
    }

    return shape;
  }

  createGuide() {
    return new mxGuide(this.graph, this.getGuideStates());
  }

  /**
   * Function: start
   *
   * Starts the handling of the mouse gesture.
   */
  start(cell: Cell, x: number, y: number, cells?: CellArray) {
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
   * Function: isCellMoving
   *
   * Returns true if the given cell is currently being moved.
   */
  isCellMoving(cell: Cell) {
    return this.allCells.get(cell);
  }

  /**
   * Function: useGuidesForEvent
   *
   * Returns true if the guides should be used for the given <mxMouseEvent>.
   * This implementation returns <mxGuide.isEnabledForEvent>.
   */
  useGuidesForEvent(me: InternalMouseEvent) {
    return this.guide
      ? this.guide.isEnabledForEvent(me.getEvent()) &&
          !this.graph.isConstrainedEvent(me.getEvent())
      : true;
  }

  /**
   * Function: snap
   *
   * Snaps the given vector to the grid and returns the given mxPoint instance.
   */
  snap(vector: Point) {
    const scale = this.scaleGrid ? this.graph.view.scale : 1;

    vector.x = this.graph.snap(vector.x / scale) * scale;
    vector.y = this.graph.snap(vector.y / scale) * scale;

    return vector;
  }

  /**
   * Function: getDelta
   *
   * Returns an <mxPoint> that represents the vector for moving the cells
   * for the given <mxMouseEvent>.
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
   * Function: updateHint
   *
   * Hook for subclassers do show details while the handler is active.
   */
  updateHint(me?: InternalMouseEvent) {}

  /**
   * Function: removeHint
   *
   * Hooks for subclassers to hide details when the handler gets inactive.
   */
  removeHint() {}

  /**
   * Function: roundLength
   *
   * Hook for rounding the unscaled vector. This uses Math.round.
   */
  roundLength(length: number) {
    return Math.round(length * 100) / 100;
  }

  /**
   * Function: isValidDropTarget
   *
   * Returns true if the given cell is a valid drop target.
   */
  isValidDropTarget(target: Cell, me: InternalMouseEvent) {
    return this.cell ? this.cell.getParent() !== target : false;
  }

  /**
   * Function: checkPreview
   *
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
   * Function: mouseMove
   *
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
              const color = error == null ? VALID_COLOR : INVALID_CONNECT_TARGET_COLOR;
              this.setHighlightColor(color);
              highlight = true;
            }
          }
        }

        if (state != null && highlight) {
          this.highlight.highlight(state);
        } else {
          this.highlight.hide();
        }

        if (this.guide != null && this.useGuidesForEvent(me)) {
          delta = this.guide.move(this.bounds, delta, gridEnabled, clone);
          hideGuide = false;
        } else {
          delta = this.graph.snapDelta(delta, this.bounds, !gridEnabled, false, false);
        }

        if (this.guide != null && hideGuide) {
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
      (me.getState() != null || me.sourceState != null) &&
      !graph.isMouseDown
    ) {
      let cursor = graph.getCursorForMouseEvent(me);
      const cell = me.getCell();

      if (!cursor && cell && graph.isEnabled() && graph.isCellMovable(cell)) {
        if (cell.isEdge()) {
          cursor = CURSOR_MOVABLE_EDGE;
        } else {
          cursor = CURSOR_MOVABLE_VERTEX;
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
   * Function: updatePreview
   *
   * Updates the bounds of the preview shape.
   */
  updatePreview(remote = false) {
    if (this.livePreviewUsed && !remote) {
      if (this.cells) {
        const selectionCellsHandler = this.graph.getPlugin(
          'SelectionCellsHandler'
        ) as SelectionCellsHandler;

        this.setHandlesVisibleForCells(
          selectionCellsHandler.getHandledSelectionCells(),
          false
        );
        this.updateLivePreview(this.currentDx, this.currentDy);
      }
    } else {
      this.updatePreviewShape();
    }
  }

  /**
   * Function: updatePreviewShape
   *
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
   * Function: updateLivePreview
   *
   * Updates the bounds of the preview shape.
   */
  updateLivePreview(dx: number, dy: number) {
    if (!this.suspended) {
      const states: CellState[][] = [];

      if (this.allCells != null) {
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
                if (state.control != null && state.control.node != null) {
                  state.control.node.style.visibility = 'hidden';
                }
              }
              // Clone live preview may use text bounds
              else if (state.text != null) {
                state.text.updateBoundingBox();

                // Fixes preview box for edge labels
                if (state.text.boundingBox != null) {
                  state.text.boundingBox.x += dx;
                  state.text.boundingBox.y += dy;
                }

                if (state.text.unrotatedBoundingBox != null) {
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
   * Function: redrawHandles
   *
   * Redraws the preview shape for the given states array.
   */
  redrawHandles(states: CellState[][]) {
    const selectionCellsHandler = this.graph.getPlugin(
      'SelectionCellsHandler'
    ) as SelectionCellsHandler;

    for (let i = 0; i < states.length; i += 1) {
      const handler = selectionCellsHandler.getHandler(states[i][0].cell);

      if (handler != null) {
        handler.redraw(true);
      }
    }
  }

  /**
   * Function: resetPreviewStates
   *
   * Resets the given preview states array.
   */
  resetPreviewStates(states: CellState[][]) {
    for (let i = 0; i < states.length; i += 1) {
      states[i][0].setState(states[i][1]);
    }
  }

  /**
   * Function: suspend
   *
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
   * Function: resume
   *
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
   * Function: resetLivePreview
   *
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
        state.control != null &&
        state.control.node != null &&
        state.control.node.style.visibility === 'hidden'
      ) {
        state.control.node.style.visibility = '';
      }

      // Fixes preview box for edge labels
      if (!this.cloning) {
        if (state.text !== null) {
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
   * Function: setHandlesVisibleForCells
   *
   * Sets wether the handles attached to the given cells are visible.
   *
   * Parameters:
   *
   * cells - Array of <mxCells>.
   * visible - Boolean that specifies if the handles should be visible.
   * force - Forces an update of the handler regardless of the last used value.
   */
  setHandlesVisibleForCells(cells: CellArray, visible: boolean, force = false) {
    if (force || this.handlesVisible !== visible) {
      this.handlesVisible = visible;

      const selectionCellsHandler = this.graph.getPlugin(
        'SelectionCellsHandler'
      ) as SelectionCellsHandler;

      for (let i = 0; i < cells.length; i += 1) {
        const handler = selectionCellsHandler.getHandler(cells[i]);

        if (handler != null) {
          handler.setHandlesVisible(visible);

          if (visible) {
            handler.redraw();
          }
        }
      }
    }
  }

  /**
   * Function: setHighlightColor
   *
   * Sets the color of the rectangle used to highlight drop targets.
   *
   * Parameters:
   *
   * color - String that represents the new highlight color.
   */
  setHighlightColor(color: ColorValue) {
    if (this.highlight) {
      this.highlight.setHighlightColor(color);
    }
  }

  /**
   * Function: mouseUp
   *
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
          const connectionHandler = graph.getPlugin(
            'ConnectionHandler'
          ) as ConnectionHandler;

          connectionHandler.connect(this.cell, cell, me.getEvent());
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
   * Function: reset
   *
   * Resets the state of this handler.
   */
  // reset(): void;
  reset() {
    if (this.livePreviewUsed) {
      this.resetLivePreview();

      const selectionCellsHandler = this.graph.getPlugin(
        'SelectionCellsHandler'
      ) as SelectionCellsHandler;

      this.setHandlesVisibleForCells(
        selectionCellsHandler.getHandledSelectionCells(),
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
   * Function: shouldRemoveCellsFromParent
   *
   * Returns true if the given cells should be removed from the parent for the specified
   * mousereleased event.
   */
  shouldRemoveCellsFromParent(parent: Cell, cells: CellArray, evt: MouseEvent) {
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
   * Function: moveCells
   *
   * Moves the given cells by the specified amount.
   */
  moveCells(
    cells: CellArray,
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

    this.graph.getModel().beginUpdate();
    try {
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

      this.graph.removeCells(new CellArray(...temp), false);
    } finally {
      this.graph.getModel().endUpdate();
    }

    // Selects the new cells if cells have been cloned
    if (clone) {
      this.graph.setSelectionCells(cells);
    }

    if (this.isSelectEnabled() && this.scrollOnMove) {
      this.graph.scrollCellToVisible(cells[0]);
    }
  }

  /**
   * Function: shouldRemoveParent
   *
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
   * Function: destroyShapes
   *
   * Destroy the preview and highlight shapes.
   */
  // destroyShapes(): void;
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
    if (this.highlight != null) {
      this.highlight.destroy();
      this.highlight = null;
    }
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  // destroy(): void;
  onDestroy() {
    this.graph.removeMouseListener(this);
    this.graph.removeListener(this.panHandler);
    this.graph.removeListener(this.escapeHandler);

    this.graph.getModel().removeListener(this.refreshHandler);
    this.graph.removeListener(this.refreshHandler);

    InternalEvent.removeListener(document, 'keydown', this.keyHandler);
    InternalEvent.removeListener(document, 'keyup', this.keyHandler);

    this.destroyShapes();
    this.removeHint();
  }
}

export default GraphHandler;
