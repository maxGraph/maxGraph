/**
 * Copyright (c) 2006-2016, JGraph Ltd
 * Copyright (c) 2006-2016, Gaudenz Alder
 */
import Geometry from '../geometry/Geometry';
import Cell from '../cell/Cell';
import Point from '../geometry/Point';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import {
  CURSOR_CONNECT,
  DEFAULT_VALID_COLOR,
  DIALECT_STRICTHTML,
  DIALECT_SVG,
  HIGHLIGHT_STROKEWIDTH,
  INVALID_COLOR,
  NONE,
  OUTLINE_HIGHLIGHT_COLOR,
  OUTLINE_HIGHLIGHT_STROKEWIDTH,
  TOOLTIP_VERTICAL_OFFSET,
  VALID_COLOR,
} from '../../util/constants';
import { convertPoint, getOffset, getRotatedPoint, toRadians } from '../../util/utils';
import InternalMouseEvent from '../event/InternalMouseEvent';
import ImageShape from '../geometry/node/ImageShape';
import CellMarker from '../cell/CellMarker';
import ConstraintHandler from './ConstraintHandler';
import PolylineShape from '../geometry/edge/PolylineShape';
import EventSource from '../event/EventSource';
import Rectangle from '../geometry/Rectangle';
import MaxLog from '../../util/gui/MaxLog';
import {
  getClientX,
  getClientY,
  isAltDown,
  isConsumed,
  isShiftDown,
} from '../../util/eventUtils';
import Image from '../image/ImageBox';
import CellState from '../cell/CellState';
import { Graph } from '../Graph';
import ConnectionConstraint from '../other/ConnectionConstraint';
import Shape from '../geometry/Shape';
import { GraphPlugin, Listenable } from '../../types';
import CellArray from '../cell/CellArray';

type FactoryMethod = (source: Cell | null, target: Cell | null, style?: string) => Cell;

/**
 * Class: mxConnectionHandler
 *
 * Graph event handler that creates new connections. Uses <mxTerminalMarker>
 * for finding and highlighting the source and target vertices and
 * <factoryMethod> to create the edge instance. This handler is built-into
 * <mxGraph.connectionHandler> and enabled using <mxGraph.setConnectable>.
 *
 * Example:
 *
 * (code)
 * new mxConnectionHandler(graph, (source, target, style)=>
 * {
 *   edge = new mxCell('', new mxGeometry());
 *   edge.setEdge(true);
 *   edge.setStyle(style);
 *   edge.geometry.relative = true;
 *   return edge;
 * });
 * (end)
 *
 * Here is an alternative solution that just sets a specific user object for
 * new edges by overriding <insertEdge>.
 *
 * (code)
 * mxConnectionHandlerInsertEdge = insertEdge;
 * insertEdge = (parent, id, value, source, target, style)=>
 * {
 *   value = 'Test';
 *
 *   return mxConnectionHandlerInsertEdge.apply(this, arguments);
 * };
 * (end)
 *
 * Using images to trigger connections:
 *
 * This handler uses mxTerminalMarker to find the source and target cell for
 * the new connection and creates a new edge using <connect>. The new edge is
 * created using <createEdge> which in turn uses <factoryMethod> or creates a
 * new default edge.
 *
 * The handler uses a "highlight-paradigm" for indicating if a cell is being
 * used as a source or target terminal, as seen in other diagramming products.
 * In order to allow both, moving and connecting cells at the same time,
 * <mxConstants.DEFAULT_HOTSPOT> is used in the handler to determine the hotspot
 * of a cell, that is, the region of the cell which is used to trigger a new
 * connection. The constant is a value between 0 and 1 that specifies the
 * amount of the width and height around the center to be used for the hotspot
 * of a cell and its default value is 0.5. In addition,
 * <mxConstants.MIN_HOTSPOT_SIZE> defines the minimum number of pixels for the
 * width and height of the hotspot.
 *
 * This solution, while standards compliant, may be somewhat confusing because
 * there is no visual indicator for the hotspot and the highlight is seen to
 * switch on and off while the mouse is being moved in and out. Furthermore,
 * this paradigm does not allow to create different connections depending on
 * the highlighted hotspot as there is only one hotspot per cell and it
 * normally does not allow cells to be moved and connected at the same time as
 * there is no clear indication of the connectable area of the cell.
 *
 * To come across these issues, the handle has an additional <createIcons> hook
 * with a default implementation that allows to create one icon to be used to
 * trigger new connections. If this icon is specified, then new connections can
 * only be created if the image is clicked while the cell is being highlighted.
 * The <createIcons> hook may be overridden to create more than one
 * <mxImageShape> for creating new connections, but the default implementation
 * supports one image and is used as follows:
 *
 * In order to display the "connect image" whenever the mouse is over the cell,
 * an DEFAULT_HOTSPOT of 1 should be used:
 *
 * (code)
 * mxConstants.DEFAULT_HOTSPOT = 1;
 * (end)
 *
 * In order to avoid confusion with the highlighting, the highlight color
 * should not be used with a connect image:
 *
 * (code)
 * mxConstants.HIGHLIGHT_COLOR = null;
 * (end)
 *
 * To install the image, the connectImage field of the mxConnectionHandler must
 * be assigned a new <mxImage> instance:
 *
 * (code)
 * connectImage = new mxImage('images/green-dot.gif', 14, 14);
 * (end)
 *
 * This will use the green-dot.gif with a width and height of 14 pixels as the
 * image to trigger new connections. In createIcons the icon field of the
 * handler will be set in order to remember the icon that has been clicked for
 * creating the new connection. This field will be available under selectedIcon
 * in the connect method, which may be overridden to take the icon that
 * triggered the new connection into account. This is useful if more than one
 * icon may be used to create a connection.
 *
 * Group: Events
 *
 * Event: mxEvent.START
 *
 * Fires when a new connection is being created by the user. The <code>state</code>
 * property contains the state of the source cell.
 *
 * Event: mxEvent.CONNECT
 *
 * Fires between begin- and endUpdate in <connect>. The <code>cell</code>
 * property contains the inserted edge, the <code>event</code> and <code>target</code>
 * properties contain the respective arguments that were passed to <connect> (where
 * target corresponds to the dropTarget argument). Finally, the <code>terminal</code>
 * property corresponds to the target argument in <connect> or the clone of the source
 * terminal if <createTarget> is enabled.
 *
 * Note that the target is the cell under the mouse where the mouse button was released.
 * Depending on the logic in the handler, this doesn't necessarily have to be the target
 * of the inserted edge. To print the source, target or any optional ports IDs that the
 * edge is connected to, the following code can be used. To get more details about the
 * actual connection point, <mxGraph.getConnectionConstraint> can be used. To resolve
 * the port IDs, use <Transactions.getCell>.
 *
 * (code)
 * graph.connectionHandler.addListener(mxEvent.CONNECT, (sender, evt)=>
 * {
 *   let edge = evt.getProperty('cell');
 *   let source = graph.getModel().getTerminal(edge, true);
 *   let target = graph.getModel().getTerminal(edge, false);
 *
 *   let style = graph.getCellStyle(edge);
 *   let sourcePortId = style[mxConstants.STYLE_SOURCE_PORT];
 *   let targetPortId = style[mxConstants.STYLE_TARGET_PORT];
 *
 *   MaxLog.show();
 *   MaxLog.debug('connect', edge, source.id, target.id, sourcePortId, targetPortId);
 * });
 * (end)
 *
 * Event: mxEvent.RESET
 *
 * Fires when the <reset> method is invoked.
 *
 * Constructor: mxConnectionHandler
 *
 * Constructs an event handler that connects vertices using the specified
 * factory method to create the new edges. Modify
 * <mxConstants.ACTIVE_REGION> to setup the region on a cell which triggers
 * the creation of a new connection or use connect icons as explained
 * above.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * factoryMethod - Optional function to create the edge. The function takes
 * the source and target <mxCell> as the first and second argument and an
 * optional cell style from the preview as the third argument. It returns
 * the <mxCell> that represents the new edge.
 */
class ConnectionHandler extends EventSource implements GraphPlugin {
  static pluginId = 'ConnectionHandler';

  // TODO: Document me!
  previous: CellState | null = null;
  iconState: CellState | null = null;
  icons: ImageShape[] = [];
  cell: Cell | null = null;
  currentPoint: Point | null = null;
  sourceConstraint: ConnectionConstraint | null = null;
  shape: Shape | null = null;
  icon: ImageShape | null = null;
  originalPoint: Point | null = null;
  currentState: CellState | null = null;
  selectedIcon: ImageShape | null = null;
  waypoints: Point[] = [];

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  graph: Graph;

  /**
   * Variable: factoryMethod
   *
   * Function that is used for creating new edges. The function takes the
   * source and target <mxCell> as the first and second argument and returns
   * a new <mxCell> that represents the edge. This is used in <createEdge>.
   */
  factoryMethod: FactoryMethod | null = null;

  /**
   * Variable: moveIconFront
   *
   * Specifies if icons should be displayed inside the graph container instead
   * of the overlay pane. This is used for HTML labels on vertices which hide
   * the connect icon. This has precendence over <moveIconBack> when set
   * to true. Default is false.
   */
  moveIconFront = false;

  /**
   * Variable: moveIconBack
   *
   * Specifies if icons should be moved to the back of the overlay pane. This can
   * be set to true if the icons of the connection handler conflict with other
   * handles, such as the vertex label move handle. Default is false.
   */
  moveIconBack = false;

  /**
   * Variable: connectImage
   *
   * <mxImage> that is used to trigger the creation of a new connection. This
   * is used in <createIcons>. Default is null.
   */

  connectImage: Image | null = null;

  /**
   * Variable: targetConnectImage
   *
   * Specifies if the connect icon should be centered on the target state
   * while connections are being previewed. Default is false.
   */
  targetConnectImage = false;

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is false.
   */
  enabled = false;

  /**
   * Variable: select
   *
   * Specifies if new edges should be selected. Default is true.
   */
  select = true;

  /**
   * Variable: createTarget
   *
   * Specifies if <createTargetVertex> should be called if no target was under the
   * mouse for the new connection. Setting this to true means the connection
   * will be drawn as valid if no target is under the mouse, and
   * <createTargetVertex> will be called before the connection is created between
   * the source cell and the newly created vertex in <createTargetVertex>, which
   * can be overridden to create a new target. Default is false.
   */
  createTarget = false;

  /**
   * Variable: marker
   *
   * Holds the <mxTerminalMarker> used for finding source and target cells.
   */
  marker: CellMarker;

  /**
   * Variable: constraintHandler
   *
   * Holds the <mxConstraintHandler> used for drawing and highlighting
   * constraints.
   */
  constraintHandler: ConstraintHandler;

  /**
   * Variable: error
   *
   * Holds the current validation error while connections are being created.
   */
  error: string | null = null;

  /**
   * Variable: waypointsEnabled
   *
   * Specifies if single clicks should add waypoints on the new edge. Default is
   * false.
   */
  waypointsEnabled = false;

  /**
   * Variable: ignoreMouseDown
   *
   * Specifies if the connection handler should ignore the state of the mouse
   * button when highlighting the source. Default is false, that is, the
   * handler only highlights the source if no button is being pressed.
   */
  ignoreMouseDown = false;

  /**
   * Variable: first
   *
   * Holds the <mxPoint> where the mouseDown took place while the handler is
   * active.
   */
  first: Point | null = null;

  /**
   * Variable: connectIconOffset
   *
   * Holds the offset for connect icons during connection preview.
   * Default is mxPoint(0, <mxConstants.TOOLTIP_VERTICAL_OFFSET>).
   * Note that placing the icon under the mouse pointer with an
   * offset of (0,0) will affect hit detection.
   */
  connectIconOffset = new Point(0, TOOLTIP_VERTICAL_OFFSET);

  /**
   * Variable: edgeState
   *
   * Optional <CellState> that represents the preview edge while the
   * handler is active. This is created in <createEdgeState>.
   */
  edgeState: CellState | null = null;

  /**
   * Variable: changeHandler
   *
   * Holds the change event listener for later removal.
   */
  changeHandler: (sender: Listenable) => void;

  /**
   * Variable: drillHandler
   *
   * Holds the drill event listener for later removal.
   */
  drillHandler: (sender: Listenable) => void;

  /**
   * Variable: mouseDownCounter
   *
   * Counts the number of mouseDown events since the start. The initial mouse
   * down event counts as 1.
   */
  mouseDownCounter = 0;

  /**
   * Variable: movePreviewAway
   *
   * Switch to enable moving the preview away from the mousepointer. This is required in browsers
   * where the preview cannot be made transparent to events and if the built-in hit detection on
   * the HTML elements in the page should be used. Default is the value of <Client.IS_VML>.
   */
  movePreviewAway = false;

  /**
   * Variable: outlineConnect
   *
   * Specifies if connections to the outline of a highlighted target should be
   * enabled. This will allow to place the connection point along the outline of
   * the highlighted target. Default is false.
   */
  outlineConnect = false;

  /**
   * Variable: livePreview
   *
   * Specifies if the actual shape of the edge state should be used for the preview.
   * Default is false. (Ignored if no edge state is created in <createEdgeState>.)
   */
  livePreview = false;

  /**
   * Variable: cursor
   *
   * Specifies the cursor to be used while the handler is active. Default is null.
   */
  cursor: string | null = null;

  /**
   * Variable: insertBeforeSource
   *
   * Specifies if new edges should be inserted before the source vertex in the
   * cell hierarchy. Default is false for backwards compatibility.
   */
  insertBeforeSource = false;

  escapeHandler: () => void;

  constructor(graph: Graph, factoryMethod: FactoryMethod | null = null) {
    super();

    this.graph = graph;
    this.factoryMethod = factoryMethod;

    this.graph.addMouseListener(this);
    this.marker = this.createMarker();
    this.constraintHandler = new ConstraintHandler(this.graph);

    // Redraws the icons if the graph changes
    this.changeHandler = (sender: Listenable) => {
      if (this.iconState) {
        this.iconState = this.graph.getView().getState(this.iconState.cell);
      }

      if (this.iconState) {
        this.redrawIcons(this.icons, this.iconState);
        this.constraintHandler.reset();
      } else if (this.previous && !this.graph.view.getState(this.previous.cell)) {
        this.reset();
      }
    };

    this.graph.getModel().addListener(InternalEvent.CHANGE, this.changeHandler);
    this.graph.getView().addListener(InternalEvent.SCALE, this.changeHandler);
    this.graph.getView().addListener(InternalEvent.TRANSLATE, this.changeHandler);
    this.graph
      .getView()
      .addListener(InternalEvent.SCALE_AND_TRANSLATE, this.changeHandler);

    // Removes the icon if we step into/up or start editing
    this.drillHandler = (sender: Listenable) => {
      this.reset();
    };

    this.graph.addListener(InternalEvent.START_EDITING, this.drillHandler);
    this.graph.getView().addListener(InternalEvent.DOWN, this.drillHandler);
    this.graph.getView().addListener(InternalEvent.UP, this.drillHandler);

    // Handles escape keystrokes
    this.escapeHandler = () => {
      this.reset();
    };

    this.graph.addListener(InternalEvent.ESCAPE, this.escapeHandler);
  }

  /**
   * Function: isEnabled
   *
   * Returns true if events are handled. This implementation
   * returns <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Function: setEnabled
   *
   * Enables or disables event handling. This implementation
   * updates <enabled>.
   *
   * Parameters:
   *
   * enabled - Boolean that specifies the new enabled state.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Function: isInsertBefore
   *
   * Returns <insertBeforeSource> for non-loops and false for loops.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to be inserted.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * evt - Mousedown event of the connect gesture.
   * dropTarget - <mxCell> that represents the cell under the mouse when it was
   * released.
   */
  isInsertBefore(
    edge: Cell,
    source: Cell | null,
    target: Cell | null,
    evt: MouseEvent,
    dropTarget: Cell | null
  ) {
    return this.insertBeforeSource && source !== target;
  }

  /**
   * Function: isCreateTarget
   *
   * Returns <createTarget>.
   *
   * Parameters:
   *
   * evt - Current active native pointer event.
   */
  isCreateTarget(evt: Event) {
    return this.createTarget;
  }

  /**
   * Function: setCreateTarget
   *
   * Sets <createTarget>.
   */
  setCreateTarget(value: boolean) {
    this.createTarget = value;
  }

  /**
   * Function: createShape
   *
   * Creates the preview shape for new connections.
   */
  createShape() {
    // Creates the edge preview
    const shape =
      this.livePreview && this.edgeState
        ? this.graph.cellRenderer.createShape(this.edgeState)
        : new PolylineShape([], INVALID_COLOR);

    if (shape && shape.node) {
      shape.dialect = DIALECT_SVG;
      shape.scale = this.graph.view.scale;
      shape.pointerEvents = false;
      shape.isDashed = true;
      shape.init(this.graph.getView().getOverlayPane());
      InternalEvent.redirectMouseEvents(shape.node, this.graph, null);
    }

    return shape;
  }

  /**
   * Function: isConnectableCell
   *
   * Returns true if the given cell is connectable. This is a hook to
   * disable floating connections. This implementation returns true.
   */
  isConnectableCell(cell: Cell) {
    return true;
  }

  /**
   * Function: createMarker
   *
   * Creates and returns the <mxCellMarker> used in <marker>.
   */
  createMarker() {
    const self = this;

    class MyCellMarker extends CellMarker {
      hotspotEnabled = true;

      // Overrides to return cell at location only if valid (so that
      // there is no highlight for invalid cells)
      getCell(me: InternalMouseEvent) {
        let cell = super.getCell(me);
        self.error = null;

        // Checks for cell at preview point (with grid)
        if (!cell && self.currentPoint) {
          cell = self.graph.getCellAt(self.currentPoint.x, self.currentPoint.y);
        }

        // Uses connectable parent vertex if one exists
        if (cell && !cell.isConnectable() && self.cell) {
          const parent = self.cell.getParent();

          if (parent && parent.isVertex() && parent.isConnectable()) {
            cell = parent;
          }
        }

        if (cell) {
          if (
            (self.graph.isSwimlane(cell) &&
              self.currentPoint != null &&
              self.graph.hitsSwimlaneContent(
                cell,
                self.currentPoint.x,
                self.currentPoint.y
              )) ||
            !self.isConnectableCell(cell)
          ) {
            cell = null;
          }
        }

        if (cell) {
          if (self.isConnecting()) {
            if (self.previous) {
              self.error = self.validateConnection(self.previous.cell, cell);

              if (self.error && self.error.length === 0) {
                cell = null;

                // Enables create target inside groups
                if (self.isCreateTarget(me.getEvent())) {
                  self.error = null;
                }
              }
            }
          } else if (!self.isValidSource(cell, me)) {
            cell = null;
          }
        } else if (
          self.isConnecting() &&
          !self.isCreateTarget(me.getEvent()) &&
          !self.graph.isAllowDanglingEdges()
        ) {
          self.error = '';
        }

        return cell;
      }

      // Sets the highlight color according to validateConnection
      isValidState(state: CellState) {
        if (self.isConnecting()) {
          return !self.error;
        }
        return super.isValidState(state);
      }

      // Overrides to use marker color only in highlight mode or for
      // target selection
      getMarkerColor(evt: Event, state: CellState, isValid: boolean) {
        return !self.connectImage || self.isConnecting()
          ? super.getMarkerColor(evt, state, isValid)
          : NONE;
      }

      // Overrides to use hotspot only for source selection otherwise
      // intersects always returns true when over a cell
      intersects(state: CellState, evt: InternalMouseEvent) {
        if (self.connectImage || self.isConnecting()) {
          return true;
        }
        return super.intersects(state, evt);
      }
    }

    return new MyCellMarker(this.graph) as CellMarker;
  }

  /**
   * Function: start
   *
   * Starts a new connection for the given state and coordinates.
   */
  start(state: CellState, x: number, y: number, edgeState: CellState) {
    this.previous = state;
    this.first = new Point(x, y);
    this.edgeState = edgeState ?? this.createEdgeState();

    // Marks the source state
    this.marker.currentColor = this.marker.validColor;
    this.marker.markedState = state;
    this.marker.mark();

    this.fireEvent(new EventObject(InternalEvent.START, 'state', this.previous));
  }

  /**
   * Function: isConnecting
   *
   * Returns true if the source terminal has been clicked and a new
   * connection is currently being previewed.
   */
  isConnecting() {
    return !!this.first && !!this.shape;
  }

  /**
   * Function: isValidSource
   *
   * Returns <mxGraph.isValidSource> for the given source terminal.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the source terminal.
   * me - <mxMouseEvent> that is associated with this call.
   */
  isValidSource(cell: Cell, me: InternalMouseEvent) {
    return this.graph.isValidSource(cell);
  }

  /**
   * Function: isValidTarget
   *
   * Returns true. The call to <mxGraph.isValidTarget> is implicit by calling
   * <mxGraph.getEdgeValidationError> in <validateConnection>. This is an
   * additional hook for disabling certain targets in this specific handler.
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the target terminal.
   */
  isValidTarget(cell: Cell) {
    return true;
  }

  /**
   * Function: validateConnection
   *
   * Returns the error message or an empty string if the connection for the
   * given source target pair is not valid. Otherwise it returns null. This
   * implementation uses <mxGraph.getEdgeValidationError>.
   *
   * Parameters:
   *
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   */
  validateConnection(source: Cell, target: Cell) {
    if (!this.isValidTarget(target)) {
      return '';
    }
    return this.graph.getEdgeValidationError(null, source, target);
  }

  /**
   * Function: getConnectImage
   *
   * Hook to return the <mxImage> used for the connection icon of the given
   * <CellState>. This implementation returns <connectImage>.
   *
   * Parameters:
   *
   * state - <CellState> whose connect image should be returned.
   */
  getConnectImage(state: CellState) {
    return this.connectImage;
  }

  /**
   * Function: isMoveIconToFrontForState
   *
   * Returns true if the state has a HTML label in the graph's container, otherwise
   * it returns <moveIconFront>.
   *
   * Parameters:
   *
   * state - <CellState> whose connect icons should be returned.
   */
  isMoveIconToFrontForState(state: CellState) {
    if (state.text && state.text.node.parentNode === this.graph.container) {
      return true;
    }
    return this.moveIconFront;
  }

  /**
   * Function: createIcons
   *
   * Creates the array <mxImageShapes> that represent the connect icons for
   * the given <CellState>.
   *
   * Parameters:
   *
   * state - <CellState> whose connect icons should be returned.
   */
  createIcons(state: CellState) {
    const image = this.getConnectImage(state);

    if (image) {
      this.iconState = state;
      const icons = [];

      // Cannot use HTML for the connect icons because the icon receives all
      // mouse move events in IE, must use VML and SVG instead even if the
      // connect-icon appears behind the selection border and the selection
      // border consumes the events before the icon gets a chance
      const bounds = new Rectangle(0, 0, image.width, image.height);
      const icon = new ImageShape(bounds, image.src, undefined, undefined, 0);
      icon.preserveImageAspect = false;

      if (this.isMoveIconToFrontForState(state)) {
        icon.dialect = DIALECT_STRICTHTML;
        icon.init(this.graph.container);
      } else {
        icon.dialect = DIALECT_SVG;
        icon.init(this.graph.getView().getOverlayPane());

        // Move the icon back in the overlay pane
        if (this.moveIconBack && icon.node.parentNode && icon.node.previousSibling) {
          icon.node.parentNode.insertBefore(icon.node, icon.node.parentNode.firstChild);
        }
      }

      icon.node.style.cursor = CURSOR_CONNECT;

      // Events transparency
      const getState = () => {
        return this.currentState ?? state;
      };

      // Updates the local icon before firing the mouse down event.
      const mouseDown = (evt: MouseEvent) => {
        if (!isConsumed(evt)) {
          this.icon = icon;
          this.graph.fireMouseEvent(
            InternalEvent.MOUSE_DOWN,
            new InternalMouseEvent(evt, getState())
          );
        }
      };

      InternalEvent.redirectMouseEvents(icon.node, this.graph, getState, mouseDown);

      icons.push(icon);
      this.redrawIcons(icons, this.iconState);

      return icons;
    }

    return [];
  }

  /**
   * Function: redrawIcons
   *
   * Redraws the given array of <mxImageShapes>.
   *
   * Parameters:
   *
   * icons - Array of <mxImageShapes> to be redrawn.
   */
  redrawIcons(icons: ImageShape[], state: CellState) {
    if (icons[0] && icons[0].bounds) {
      const pos = this.getIconPosition(icons[0], state);
      icons[0].bounds.x = pos.x;
      icons[0].bounds.y = pos.y;
      icons[0].redraw();
    }
  }

  // TODO: Document me! ===========================================================================================================
  getIconPosition(icon: ImageShape, state: CellState) {
    const { scale } = this.graph.getView();
    let cx = state.getCenterX();
    let cy = state.getCenterY();

    if (this.graph.isSwimlane(state.cell)) {
      const size = this.graph.getStartSize(state.cell);

      cx = size.width !== 0 ? state.x + (size.width * scale) / 2 : cx;
      cy = size.height !== 0 ? state.y + (size.height * scale) / 2 : cy;

      const alpha = toRadians(state.style.rotation ?? 0);

      if (alpha !== 0) {
        const cos = Math.cos(alpha);
        const sin = Math.sin(alpha);
        const ct = new Point(state.getCenterX(), state.getCenterY());
        const pt = getRotatedPoint(new Point(cx, cy), cos, sin, ct);
        cx = pt.x;
        cy = pt.y;
      }
    }

    return new Point(cx - icon.bounds!.width / 2, cy - icon.bounds!.height / 2);
  }

  /**
   * Function: destroyIcons
   *
   * Destroys the connect icons and resets the respective state.
   */
  destroyIcons() {
    for (let i = 0; i < this.icons.length; i += 1) {
      this.icons[i].destroy();
    }

    this.icons = [];
    this.icon = null;
    this.selectedIcon = null;
    this.iconState = null;
  }

  /**
   * Function: isStartEvent
   *
   * Returns true if the given mouse down event should start this handler. The
   * This implementation returns true if the event does not force marquee
   * selection, and the currentConstraint and currentFocus of the
   * <constraintHandler> are not null, or <previous> and <error> are not null and
   * <icons> is null or <icons> and <icon> are not null.
   */
  isStartEvent(me: InternalMouseEvent) {
    return (
      (this.constraintHandler.currentFocus !== null &&
        this.constraintHandler.currentConstraint !== null) ||
      (this.previous !== null &&
        this.error === null &&
        (this.icons.length === 0 || this.icon !== null))
    );
  }

  /**
   * Function: mouseDown
   *
   * Handles the event by initiating a new connection.
   */
  mouseDown(sender: EventSource, me: InternalMouseEvent) {
    this.mouseDownCounter += 1;

    if (
      this.isEnabled() &&
      this.graph.isEnabled() &&
      !me.isConsumed() &&
      !this.isConnecting() &&
      this.isStartEvent(me)
    ) {
      if (
        this.constraintHandler.currentConstraint &&
        this.constraintHandler.currentFocus &&
        this.constraintHandler.currentPoint
      ) {
        this.sourceConstraint = this.constraintHandler.currentConstraint;
        this.previous = this.constraintHandler.currentFocus;
        this.first = this.constraintHandler.currentPoint.clone();
      } else {
        // Stores the location of the initial mousedown
        this.first = new Point(me.getGraphX(), me.getGraphY());
      }

      this.edgeState = this.createEdgeState(me);
      this.mouseDownCounter = 1;

      if (this.waypointsEnabled && !this.shape) {
        this.waypoints = [];
        this.shape = this.createShape();

        if (this.edgeState) {
          this.shape.apply(this.edgeState);
        }
      }

      // Stores the starting point in the geometry of the preview
      if (!this.previous && this.edgeState && this.edgeState.cell.geometry) {
        const pt = this.graph.getPointForEvent(me.getEvent());
        this.edgeState.cell.geometry.setTerminalPoint(pt, true);
      }

      this.fireEvent(new EventObject(InternalEvent.START, 'state', this.previous));

      me.consume();
    }

    this.selectedIcon = this.icon;
    this.icon = null;
  }

  /**
   * Function: isImmediateConnectSource
   *
   * Returns true if a tap on the given source state should immediately start
   * connecting. This implementation returns true if the state is not movable
   * in the graph.
   */
  isImmediateConnectSource(state: CellState) {
    return !this.graph.isCellMovable(state.cell);
  }

  /**
   * Function: createEdgeState
   *
   * Hook to return an <CellState> which may be used during the preview.
   * This implementation returns null.
   *
   * Use the following code to create a preview for an existing edge style:
   *
   * (code)
   * graph.connectionHandler.createEdgeState(me)
   * {
   *   var edge = graph.createEdge(null, null, null, null, null, 'edgeStyle=elbowEdgeStyle');
   *
   *   return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge));
   * };
   * (end)
   */
  createEdgeState(me?: InternalMouseEvent): CellState | null {
    return null;
  }

  /**
   * Function: isOutlineConnectEvent
   *
   * Returns true if <outlineConnect> is true and the source of the event is the outline shape
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
   * Function: updateCurrentState
   *
   * Updates the current state for a given mouse move event by using
   * the <marker>.
   */
  updateCurrentState(me: InternalMouseEvent, point: Point): void {
    this.constraintHandler.update(
      me,
      !this.first,
      false,
      !this.first || me.isSource(this.marker.highlight.shape) ? null : point
    );

    if (
      this.constraintHandler.currentFocus != null &&
      this.constraintHandler.currentConstraint != null
    ) {
      // Handles special case where grid is large and connection point is at actual point in which
      // case the outline is not followed as long as we're < gridSize / 2 away from that point
      if (
        this.marker.highlight &&
        this.marker.highlight.state &&
        this.marker.highlight.state.cell === this.constraintHandler.currentFocus.cell &&
        this.marker.highlight.shape
      ) {
        // Direct repaint needed if cell already highlighted
        if (this.marker.highlight.shape.stroke !== 'transparent') {
          this.marker.highlight.shape.stroke = 'transparent';
          this.marker.highlight.repaint();
        }
      } else {
        this.marker.markCell(this.constraintHandler.currentFocus.cell, 'transparent');
      }

      // Updates validation state
      if (this.previous) {
        this.error = this.validateConnection(
          this.previous.cell,
          this.constraintHandler.currentFocus.cell
        );

        if (!this.error) {
          this.currentState = this.constraintHandler.currentFocus;
        }

        if (
          this.error ||
          (this.currentState && !this.isCellEnabled(this.currentState.cell))
        ) {
          this.constraintHandler.reset();
        }
      }
    } else {
      if (this.graph.isIgnoreTerminalEvent(me.getEvent())) {
        this.marker.reset();
        this.currentState = null;
      } else {
        this.marker.process(me);
        this.currentState = this.marker.getValidState();
      }

      if (this.currentState != null && !this.isCellEnabled(this.currentState.cell)) {
        this.constraintHandler.reset();
        this.marker.reset();
        this.currentState = null;
      }

      const outline = this.isOutlineConnectEvent(me);

      if (this.currentState != null && outline) {
        // Handles special case where mouse is on outline away from actual end point
        // in which case the grid is ignored and mouse point is used instead
        if (me.isSource(this.marker.highlight.shape)) {
          point = new Point(me.getGraphX(), me.getGraphY());
        }

        const constraint = this.graph.getOutlineConstraint(point, this.currentState, me);
        this.constraintHandler.setFocus(me, this.currentState, false);
        this.constraintHandler.currentConstraint = constraint;
        this.constraintHandler.currentPoint = point;
      }

      if (this.outlineConnect) {
        if (this.marker.highlight != null && this.marker.highlight.shape != null) {
          const s = this.graph.view.scale;

          if (
            this.constraintHandler.currentConstraint != null &&
            this.constraintHandler.currentFocus != null
          ) {
            this.marker.highlight.shape.stroke = OUTLINE_HIGHLIGHT_COLOR;
            this.marker.highlight.shape.strokeWidth =
              OUTLINE_HIGHLIGHT_STROKEWIDTH / s / s;
            this.marker.highlight.repaint();
          } else if (this.marker.hasValidState()) {
            const cell = me.getCell();

            // Handles special case where actual end point of edge and current mouse point
            // are not equal (due to grid snapping) and there is no hit on shape or highlight
            // but ignores cases where parent is used for non-connectable child cells
            if (
              cell &&
              cell.isConnectable() &&
              this.marker.getValidState() !== me.getState()
            ) {
              this.marker.highlight.shape.stroke = 'transparent';
              this.currentState = null;
            } else {
              this.marker.highlight.shape.stroke = DEFAULT_VALID_COLOR;
            }

            this.marker.highlight.shape.strokeWidth = HIGHLIGHT_STROKEWIDTH / s / s;
            this.marker.highlight.repaint();
          }
        }
      }
    }
  }

  /**
   * Function: isCellEnabled
   *
   * Returns true if the given cell does not allow new connections to be created.
   */
  isCellEnabled(cell: Cell) {
    return true;
  }

  /**
   * Function: convertWaypoint
   *
   * Converts the given point from screen coordinates to model coordinates.
   */
  convertWaypoint(point: Point) {
    const scale = this.graph.getView().getScale();
    const tr = this.graph.getView().getTranslate();

    point.x = point.x / scale - tr.x;
    point.y = point.y / scale - tr.y;
  }

  /**
   * Function: snapToPreview
   *
   * Called to snap the given point to the current preview. This snaps to the
   * first point of the preview if alt is not pressed.
   */
  snapToPreview(me: InternalMouseEvent, point: Point) {
    if (!isAltDown(me.getEvent()) && this.previous) {
      const tol = (this.graph.getGridSize() * this.graph.view.scale) / 2;
      const tmp =
        this.sourceConstraint && this.first
          ? this.first
          : new Point(this.previous.getCenterX(), this.previous.getCenterY());

      if (Math.abs(tmp.x - me.getGraphX()) < tol) {
        point.x = tmp.x;
      }

      if (Math.abs(tmp.y - me.getGraphY()) < tol) {
        point.y = tmp.y;
      }
    }
  }

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the preview edge or by highlighting
   * a possible source or target terminal.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    if (
      !me.isConsumed() &&
      (this.ignoreMouseDown || this.first || !this.graph.isMouseDown)
    ) {
      // Handles special case when handler is disabled during highlight
      if (!this.isEnabled() && this.currentState) {
        this.destroyIcons();
        this.currentState = null;
      }

      const view = this.graph.getView();
      const { scale } = view;
      const tr = view.translate;
      let point = new Point(me.getGraphX(), me.getGraphY());
      this.error = null;

      if (this.graph.isGridEnabledEvent(me.getEvent())) {
        point = new Point(
          (this.graph.snap(point.x / scale - tr.x) + tr.x) * scale,
          (this.graph.snap(point.y / scale - tr.y) + tr.y) * scale
        );
      }

      this.snapToPreview(me, point);
      this.currentPoint = point;

      if (
        (this.first || (this.isEnabled() && this.graph.isEnabled())) &&
        (this.shape ||
          !this.first ||
          Math.abs(me.getGraphX() - this.first.x) > this.graph.getEventTolerance() ||
          Math.abs(me.getGraphY() - this.first.y) > this.graph.getEventTolerance())
      ) {
        this.updateCurrentState(me, point);
      }

      if (this.first) {
        let constraint = null;
        let current: Point | null = point;

        // Uses the current point from the constraint handler if available
        if (
          this.constraintHandler.currentConstraint &&
          this.constraintHandler.currentFocus &&
          this.constraintHandler.currentPoint
        ) {
          constraint = this.constraintHandler.currentConstraint;
          current = this.constraintHandler.currentPoint.clone();
        } else if (
          this.previous &&
          !this.graph.isIgnoreTerminalEvent(me.getEvent()) &&
          isShiftDown(me.getEvent())
        ) {
          if (
            Math.abs(this.previous.getCenterX() - point.x) <
            Math.abs(this.previous.getCenterY() - point.y)
          ) {
            point.x = this.previous.getCenterX();
          } else {
            point.y = this.previous.getCenterY();
          }
        }

        let pt2: Point | null = this.first;

        // Moves the connect icon with the mouse
        if (this.selectedIcon && this.selectedIcon.bounds) {
          const w = this.selectedIcon.bounds.width;
          const h = this.selectedIcon.bounds.height;

          if (this.currentState && this.targetConnectImage) {
            const pos = this.getIconPosition(this.selectedIcon, this.currentState);
            this.selectedIcon.bounds.x = pos.x;
            this.selectedIcon.bounds.y = pos.y;
          } else {
            const bounds = new Rectangle(
              me.getGraphX() + this.connectIconOffset.x,
              me.getGraphY() + this.connectIconOffset.y,
              w,
              h
            );
            this.selectedIcon.bounds = bounds;
          }

          this.selectedIcon.redraw();
        }

        // Uses edge state to compute the terminal points
        if (this.edgeState) {
          this.updateEdgeState(current, constraint);
          current = this.edgeState.absolutePoints[
            this.edgeState.absolutePoints.length - 1
          ];
          pt2 = this.edgeState.absolutePoints[0];
        } else {
          if (this.currentState) {
            if (!this.constraintHandler.currentConstraint) {
              const tmp = this.getTargetPerimeterPoint(this.currentState, me);

              if (tmp != null) {
                current = tmp;
              }
            }
          }

          // Computes the source perimeter point
          if (!this.sourceConstraint && this.previous) {
            const next = this.waypoints.length > 0 ? this.waypoints[0] : current;
            const tmp = this.getSourcePerimeterPoint(this.previous, next as Point, me);

            if (tmp) {
              pt2 = tmp;
            }
          }
        }

        // Makes sure the cell under the mousepointer can be detected
        // by moving the preview shape away from the mouse. This
        // makes sure the preview shape does not prevent the detection
        // of the cell under the mousepointer even for slow gestures.
        if (!this.currentState && this.movePreviewAway && current) {
          let tmp = pt2;

          if (this.edgeState && this.edgeState.absolutePoints.length >= 2) {
            const tmp2 = this.edgeState.absolutePoints[
              this.edgeState.absolutePoints.length - 2
            ];

            if (tmp2) {
              tmp = tmp2;
            }
          }

          if (tmp) {
            const dx = current.x - tmp.x;
            const dy = current.y - tmp.y;

            const len = Math.sqrt(dx * dx + dy * dy);

            if (len === 0) {
              return;
            }

            // Stores old point to reuse when creating edge
            this.originalPoint = current.clone();
            current.x -= (dx * 4) / len;
            current.y -= (dy * 4) / len;
          }
        } else {
          this.originalPoint = null;
        }

        // Creates the preview shape (lazy)
        if (!this.shape) {
          const dx = Math.abs(me.getGraphX() - this.first.x);
          const dy = Math.abs(me.getGraphY() - this.first.y);

          if (
            dx > this.graph.getEventTolerance() ||
            dy > this.graph.getEventTolerance()
          ) {
            this.shape = this.createShape();

            if (this.edgeState) {
              this.shape.apply(this.edgeState);
            }

            // Revalidates current connection
            this.updateCurrentState(me, point);
          }
        }

        // Updates the points in the preview edge
        if (this.shape) {
          if (this.edgeState) {
            this.shape.points = this.edgeState.absolutePoints;
          } else {
            let pts = [pt2];

            if (this.waypoints.length > 0) {
              pts = pts.concat(this.waypoints);
            }

            pts.push(current);
            this.shape.points = pts;
          }

          this.drawPreview();
        }

        // Makes sure endpoint of edge is visible during connect
        if (this.cursor) {
          this.graph.container.style.cursor = this.cursor;
        }

        InternalEvent.consume(me.getEvent());
        me.consume();
      } else if (!this.isEnabled() || !this.graph.isEnabled()) {
        this.constraintHandler.reset();
      } else if (this.previous !== this.currentState && !this.edgeState) {
        this.destroyIcons();

        // Sets the cursor on the current shape
        if (
          this.currentState &&
          !this.error &&
          !this.constraintHandler.currentConstraint
        ) {
          this.icons = this.createIcons(this.currentState);

          if (this.icons.length === 0) {
            this.currentState.setCursor(CURSOR_CONNECT);
            me.consume();
          }
        }

        this.previous = this.currentState;
      } else if (
        this.previous === this.currentState &&
        this.currentState != null &&
        this.icons.length === 0 &&
        !this.graph.isMouseDown
      ) {
        // Makes sure that no cursors are changed
        me.consume();
      }

      if (!this.graph.isMouseDown && this.currentState != null && this.icons != null) {
        let hitsIcon = false;
        const target = me.getSource();

        for (let i = 0; i < this.icons.length && !hitsIcon; i += 1) {
          hitsIcon =
            target === this.icons[i].node ||
            // @ts-ignore parentNode should exist.
            (!!target && target.parentNode === this.icons[i].node);
        }

        if (!hitsIcon) {
          this.updateIcons(this.currentState, this.icons, me);
        }
      }
    } else {
      this.constraintHandler.reset();
    }
  }

  /**
   * Function: updateEdgeState
   *
   * Updates <edgeState>.
   */
  updateEdgeState(current: Point | null, constraint: ConnectionConstraint | null) {
    if (!this.edgeState) return;

    // TODO: Use generic method for writing constraint to style
    if (this.sourceConstraint && this.sourceConstraint.point) {
      this.edgeState.style.exitX = this.sourceConstraint.point.x;
      this.edgeState.style.exitY = this.sourceConstraint.point.y;
    }

    if (constraint && constraint.point) {
      this.edgeState.style.entryX = constraint.point.x;
      this.edgeState.style.entryY = constraint.point.y;
    } else {
      this.edgeState.style.entryX = 0;
      this.edgeState.style.entryY = 0;
    }

    this.edgeState.absolutePoints = [null, this.currentState != null ? null : current];

    if (this.sourceConstraint) {
      this.graph.view.updateFixedTerminalPoint(
        this.edgeState,
        this.previous,
        true,
        this.sourceConstraint
      );
    }

    if (this.currentState != null) {
      if (constraint == null) {
        constraint = this.graph.getConnectionConstraint(
          this.edgeState,
          this.previous,
          false
        );
      }

      this.edgeState.setAbsoluteTerminalPoint(null, false);
      this.graph.view.updateFixedTerminalPoint(
        this.edgeState,
        this.currentState,
        false,
        constraint
      );
    }

    // Scales and translates the waypoints to the model
    let realPoints = [];

    for (let i = 0; i < this.waypoints.length; i += 1) {
      const pt = this.waypoints[i].clone();
      this.convertWaypoint(pt);
      realPoints[i] = pt;
    }

    this.graph.view.updatePoints(
      this.edgeState,
      realPoints,
      this.previous,
      this.currentState
    );
    this.graph.view.updateFloatingTerminalPoints(
      this.edgeState,
      this.previous,
      this.currentState
    );
  }

  /**
   * Function: getTargetPerimeterPoint
   *
   * Returns the perimeter point for the given target state.
   *
   * Parameters:
   *
   * state - <CellState> that represents the target cell state.
   * me - <mxMouseEvent> that represents the mouse move.
   */
  getTargetPerimeterPoint(state: CellState, me: InternalMouseEvent) {
    let result: Point | null = null;
    const { view } = state;
    const targetPerimeter = view.getPerimeterFunction(state);

    if (targetPerimeter && this.previous) {
      const next =
        this.waypoints.length > 0
          ? this.waypoints[this.waypoints.length - 1]
          : new Point(this.previous.getCenterX(), this.previous.getCenterY());
      const tmp = targetPerimeter(
        view.getPerimeterBounds(state),
        this.edgeState,
        next,
        false
      );

      if (tmp) {
        result = tmp;
      }
    } else {
      result = new Point(state.getCenterX(), state.getCenterY());
    }

    return result;
  }

  /**
   * Function: getSourcePerimeterPoint
   *
   * Hook to update the icon position(s) based on a mouseOver event. This is
   * an empty implementation.
   *
   * Parameters:
   *
   * state - <CellState> that represents the target cell state.
   * next - <mxPoint> that represents the next point along the previewed edge.
   * me - <mxMouseEvent> that represents the mouse move.
   */
  getSourcePerimeterPoint(state: CellState, next: Point, me: InternalMouseEvent) {
    let result = null;
    const { view } = state;
    const sourcePerimeter = view.getPerimeterFunction(state);
    const c = new Point(state.getCenterX(), state.getCenterY());

    if (sourcePerimeter) {
      const theta = state.style.rotation ?? 0;
      const rad = -theta * (Math.PI / 180);

      if (theta !== 0) {
        next = getRotatedPoint(
          new Point(next.x, next.y),
          Math.cos(rad),
          Math.sin(rad),
          c
        );
      }

      let tmp = sourcePerimeter(view.getPerimeterBounds(state), state, next, false);

      if (tmp) {
        if (theta !== 0) {
          tmp = getRotatedPoint(
            new Point(tmp.x, tmp.y),
            Math.cos(-rad),
            Math.sin(-rad),
            c
          );
        }

        result = tmp;
      }
    } else {
      result = c;
    }

    return result;
  }

  /**
   * Function: updateIcons
   *
   * Hook to update the icon position(s) based on a mouseOver event. This is
   * an empty implementation.
   *
   * Parameters:
   *
   * state - <CellState> under the mouse.
   * icons - Array of currently displayed icons.
   * me - <mxMouseEvent> that contains the mouse event.
   */
  updateIcons(state: CellState, icons: ImageShape[], me: InternalMouseEvent) {
    // empty
  }

  /**
   * Function: isStopEvent
   *
   * Returns true if the given mouse up event should stop this handler. The
   * connection will be created if <error> is null. Note that this is only
   * called if <waypointsEnabled> is true. This implemtation returns true
   * if there is a cell state in the given event.
   */
  isStopEvent(me: InternalMouseEvent) {
    return !!me.getState();
  }

  /**
   * Function: addWaypoint
   *
   * Adds the waypoint for the given event to <waypoints>.
   */
  addWaypointForEvent(me: InternalMouseEvent) {
    if (!this.first) return;

    let point = convertPoint(this.graph.container, me.getX(), me.getY());
    const dx = Math.abs(point.x - this.first.x);
    const dy = Math.abs(point.y - this.first.y);
    const addPoint =
      this.waypoints.length > 0 ||
      (this.mouseDownCounter > 1 &&
        (dx > this.graph.getEventTolerance() || dy > this.graph.getEventTolerance()));

    if (addPoint) {
      const { scale } = this.graph.view;
      point = new Point(
        this.graph.snap(me.getGraphX() / scale) * scale,
        this.graph.snap(me.getGraphY() / scale) * scale
      );
      this.waypoints.push(point);
    }
  }

  /**
   * Function: checkConstraints
   *
   * Returns true if the connection for the given constraints is valid. This
   * implementation returns true if the constraints are not pointing to the
   * same fixed connection point.
   */
  checkConstraints(c1: ConnectionConstraint | null, c2: ConnectionConstraint | null) {
    return (
      !c1 ||
      !c2 ||
      !c1.point ||
      !c2.point ||
      !c1.point.equals(c2.point) ||
      c1.dx !== c2.dx ||
      c1.dy !== c2.dy ||
      c1.perimeter !== c2.perimeter
    );
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by inserting the new connection.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    if (!me.isConsumed() && this.isConnecting()) {
      if (this.waypointsEnabled && !this.isStopEvent(me)) {
        this.addWaypointForEvent(me);
        me.consume();

        return;
      }

      const c1 = this.sourceConstraint;
      const c2 = this.constraintHandler.currentConstraint;

      const source = this.previous ? this.previous.cell : null;
      let target = null;

      if (
        this.constraintHandler.currentConstraint &&
        this.constraintHandler.currentFocus
      ) {
        target = this.constraintHandler.currentFocus.cell;
      }

      if (!target && this.currentState) {
        target = this.currentState.cell;
      }

      // Inserts the edge if no validation error exists and if constraints differ
      if (
        !this.error &&
        (!source || !target || source !== target || this.checkConstraints(c1, c2))
      ) {
        this.connect(source, target, me.getEvent(), me.getCell());
      } else {
        // Selects the source terminal for self-references
        if (
          this.previous != null &&
          this.marker.validState != null &&
          this.previous.cell === this.marker.validState.cell
        ) {
          this.graph.selectCellForEvent(this.marker.validState.cell, me.getEvent());
        }

        // Displays the error message if it is not an empty string,
        // for empty error messages, the event is silently dropped
        if (this.error != null && this.error.length > 0) {
          this.graph.validationAlert(this.error);
        }
      }

      // Redraws the connect icons and resets the handler state
      this.destroyIcons();
      me.consume();
    }

    if (this.first != null) {
      this.reset();
    }
  }

  /**
   * Function: reset
   *
   * Resets the state of this handler.
   */
  reset(): void {
    if (this.shape != null) {
      this.shape.destroy();
      this.shape = null;
    }

    // Resets the cursor on the container
    if (this.cursor != null && this.graph.container != null) {
      this.graph.container.style.cursor = '';
    }

    this.destroyIcons();
    this.marker.reset();
    this.constraintHandler.reset();
    this.originalPoint = null;
    this.currentPoint = null;
    this.edgeState = null;
    this.previous = null;
    this.error = null;
    this.sourceConstraint = null;
    this.mouseDownCounter = 0;
    this.first = null;

    this.fireEvent(new EventObject(InternalEvent.RESET));
  }

  /**
   * Function: drawPreview
   *
   * Redraws the preview edge using the color and width returned by
   * <getEdgeColor> and <getEdgeWidth>.
   */
  drawPreview() {
    this.updatePreview(this.error === null);
    if (this.shape) this.shape.redraw();
  }

  /**
   * Function: getEdgeColor
   *
   * Returns the color used to draw the preview edge. This returns green if
   * there is no edge validation error and red otherwise.
   *
   * Parameters:
   *
   * valid - Boolean indicating if the color for a valid edge should be
   * returned.
   */
  updatePreview(valid: boolean) {
    if (this.shape) {
      this.shape.strokeWidth = this.getEdgeWidth(valid);
      this.shape.stroke = this.getEdgeColor(valid);
    }
  }

  /**
   * Function: getEdgeColor
   *
   * Returns the color used to draw the preview edge. This returns green if
   * there is no edge validation error and red otherwise.
   *
   * Parameters:
   *
   * valid - Boolean indicating if the color for a valid edge should be
   * returned.
   */
  getEdgeColor(valid: boolean) {
    return valid ? VALID_COLOR : INVALID_COLOR;
  }

  /**
   * Function: getEdgeWidth
   *
   * Returns the width used to draw the preview edge. This returns 3 if
   * there is no edge validation error and 1 otherwise.
   *
   * Parameters:
   *
   * valid - Boolean indicating if the width for a valid edge should be
   * returned.
   */
  getEdgeWidth(valid: boolean): number {
    return valid ? 3 : 1;
  }

  /**
   * Function: connect
   *
   * Connects the given source and target using a new edge. This
   * implementation uses <createEdge> to create the edge.
   *
   * Parameters:
   *
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * evt - Mousedown event of the connect gesture.
   * dropTarget - <mxCell> that represents the cell under the mouse when it was
   * released.
   */
  connect(
    source: Cell | null,
    target: Cell | null,
    evt: MouseEvent,
    dropTarget: Cell | null = null
  ) {
    if (target || this.isCreateTarget(evt) || this.graph.isAllowDanglingEdges()) {
      // Uses the common parent of source and target or
      // the default parent to insert the edge
      const model = this.graph.getModel();
      let terminalInserted = false;
      let edge: Cell | null = null;

      model.beginUpdate();
      try {
        if (
          source &&
          !target &&
          !this.graph.isIgnoreTerminalEvent(evt) &&
          this.isCreateTarget(evt)
        ) {
          target = this.createTargetVertex(evt, source);

          if (target) {
            dropTarget = this.graph.getDropTarget(new CellArray(target), evt, dropTarget);
            terminalInserted = true;

            // Disables edges as drop targets if the target cell was created
            // FIXME: Should not shift if vertex was aligned (same in Java)
            if (dropTarget == null || !dropTarget.isEdge()) {
              const pstate = dropTarget
                ? this.graph.getView().getState(dropTarget)
                : null;

              if (pstate) {
                const tmp = target.getGeometry();

                if (tmp) {
                  tmp.x -= pstate.origin.x;
                  tmp.y -= pstate.origin.y;
                }
              }
            } else {
              dropTarget = this.graph.getDefaultParent();
            }

            this.graph.addCell(target, dropTarget);
          }
        }

        let parent: Cell | null = this.graph.getDefaultParent();

        if (
          source &&
          target &&
          source.getParent() === target.getParent() &&
          source.getParent()?.getParent() !== model.getRoot()
        ) {
          parent = source.getParent();

          if (
            source.geometry &&
            source.geometry.relative &&
            target.geometry &&
            target.geometry.relative
          ) {
            parent = parent!.getParent();
          }
        }

        // Uses the value of the preview edge state for inserting
        // the new edge into the graph
        let value = null;
        let style = '';

        if (this.edgeState) {
          value = this.edgeState.cell.value;
          style = this.edgeState.cell.style ?? '';
        }

        edge = this.insertEdge(parent as Cell, '', value, source, target, style);

        if (edge && source) {
          // Updates the connection constraints
          this.graph.setConnectionConstraint(edge, source, true, this.sourceConstraint);
          this.graph.setConnectionConstraint(
            edge,
            target,
            false,
            this.constraintHandler.currentConstraint
          );

          // Uses geometry of the preview edge state
          if (this.edgeState && this.edgeState.cell && this.edgeState.cell.geometry) {
            model.setGeometry(edge, this.edgeState.cell.geometry);
          }

          parent = source.getParent();

          // Inserts edge before source
          if (this.isInsertBefore(edge, source, target, evt, dropTarget)) {
            const index = null;
            let tmp: Cell | null = source;

            while (
              tmp &&
              tmp.parent != null &&
              tmp.geometry != null &&
              tmp.geometry.relative &&
              tmp.parent !== edge.parent
            ) {
              tmp = tmp.getParent();
            }

            if (tmp != null && tmp.parent != null && tmp.parent === edge.parent) {
              model.add(parent, edge, tmp.parent.getIndex(tmp));
            }
          }

          // Makes sure the edge has a non-null, relative geometry
          let geo = edge.getGeometry();

          if (geo == null) {
            geo = new Geometry();
            geo.relative = true;

            model.setGeometry(edge, geo);
          }

          // Uses scaled waypoints in geometry
          if (this.waypoints.length > 0) {
            const s = this.graph.view.scale;
            const tr = this.graph.view.translate;
            geo.points = [];

            for (let i = 0; i < this.waypoints.length; i += 1) {
              const pt = this.waypoints[i];
              geo.points.push(new Point(pt.x / s - tr.x, pt.y / s - tr.y));
            }
          }

          if (!target && this.currentPoint) {
            const t = this.graph.view.translate;
            const s = this.graph.view.scale;
            const pt =
              this.originalPoint != null
                ? new Point(
                    this.originalPoint.x / s - t.x,
                    this.originalPoint.y / s - t.y
                  )
                : new Point(this.currentPoint.x / s - t.x, this.currentPoint.y / s - t.y);
            pt.x -= this.graph.getPanDx() / this.graph.view.scale;
            pt.y -= this.graph.getPanDy() / this.graph.view.scale;
            geo.setTerminalPoint(pt, false);
          }

          this.fireEvent(
            new EventObject(
              InternalEvent.CONNECT,
              'cell',
              edge,
              'terminal',
              target,
              'event',
              evt,
              'target',
              dropTarget,
              'terminalInserted',
              terminalInserted
            )
          );
        }
      } catch (e) {
        MaxLog.show();
        // MaxLog.debug(e.message);
      } finally {
        model.endUpdate();
      }

      if (this.select) {
        this.selectCells(edge, terminalInserted ? target : null);
      }
    }
  }

  /**
   * Function: selectCells
   *
   * Selects the given edge after adding a new connection. The target argument
   * contains the target vertex if one has been inserted.
   */
  selectCells(edge: Cell | null, target: Cell | null) {
    this.graph.setSelectionCell(edge);
  }

  /**
   * Function: insertEdge
   *
   * Creates, inserts and returns the new edge for the given parameters. This
   * implementation does only use <createEdge> if <factoryMethod> is defined,
   * otherwise <mxGraph.insertEdge> will be used.
   */
  insertEdge(
    parent: Cell,
    id: string,
    value: any,
    source: Cell | null,
    target: Cell | null,
    style: string
  ): Cell {
    if (!this.factoryMethod) {
      return this.graph.insertEdge(parent, id, value, source, target, style);
    }
    let edge = this.createEdge(value, source, target, style);
    edge = this.graph.addEdge(edge, parent, source, target);

    return edge;
  }

  /**
   * Function: createTargetVertex
   *
   * Hook method for creating new vertices on the fly if no target was
   * under the mouse. This is only called if <createTarget> is true and
   * returns null.
   *
   * Parameters:
   *
   * evt - Mousedown event of the connect gesture.
   * source - <mxCell> that represents the source terminal.
   */
  createTargetVertex(evt: MouseEvent, source: Cell) {
    // Uses the first non-relative source
    let geo = source.getGeometry();

    while (geo && geo.relative) {
      source = source.getParent() as Cell;
      geo = source.getGeometry();
    }

    const clone = this.graph.cloneCell(source);
    geo = clone.getGeometry();

    if (geo && this.currentPoint) {
      const t = this.graph.view.translate;
      const s = this.graph.view.scale;
      const point = new Point(
        this.currentPoint.x / s - t.x,
        this.currentPoint.y / s - t.y
      );
      geo.x = Math.round(point.x - geo.width / 2 - this.graph.getPanDx() / s);
      geo.y = Math.round(point.y - geo.height / 2 - this.graph.getPanDy() / s);

      // Aligns with source if within certain tolerance
      const tol = this.getAlignmentTolerance();

      if (tol > 0) {
        const sourceState = this.graph.view.getState(source);

        if (sourceState != null) {
          const x = sourceState.x / s - t.x;
          const y = sourceState.y / s - t.y;

          if (Math.abs(x - geo.x) <= tol) {
            geo.x = Math.round(x);
          }

          if (Math.abs(y - geo.y) <= tol) {
            geo.y = Math.round(y);
          }
        }
      }
    }

    return clone;
  }

  /**
   * Function: getAlignmentTolerance
   *
   * Returns the tolerance for aligning new targets to sources. This returns the grid size / 2.
   */
  getAlignmentTolerance(evt?: MouseEvent): number {
    return this.graph.isGridEnabled()
      ? this.graph.getGridSize() / 2
      : this.graph.getSnapTolerance();
  }

  /**
   * Function: createEdge
   *
   * Creates and returns a new edge using <factoryMethod> if one exists. If
   * no factory method is defined, then a new default edge is returned. The
   * source and target arguments are informal, the actual connection is
   * setup later by the caller of this function.
   *
   * Parameters:
   *
   * value - Value to be used for creating the edge.
   * source - <mxCell> that represents the source terminal.
   * target - <mxCell> that represents the target terminal.
   * style - Optional style from the preview edge.
   */
  createEdge(value: any, source: Cell | null, target: Cell | null, style: string = '') {
    let edge = null;

    // Creates a new edge using the factoryMethod
    if (this.factoryMethod != null) {
      edge = this.factoryMethod(source, target, style);
    }

    if (edge == null) {
      edge = new Cell(value || '');
      edge.setEdge(true);
      edge.setStyle(style);

      const geo = new Geometry();
      geo.relative = true;
      edge.setGeometry(geo);
    }

    return edge;
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes. This should be
   * called on all instances. It is called automatically for the built-in
   * instance created for each <mxGraph>.
   */
  onDestroy() {
    this.graph.removeMouseListener(this);

    if (this.shape) {
      this.shape.destroy();
      this.shape = null;
    }

    if (this.marker) {
      this.marker.destroy();
      // @ts-expect-error this.marker is null when it is destroyed.
      this.marker = null;
    }

    if (this.constraintHandler) {
      this.constraintHandler.destroy();
    }

    if (this.changeHandler) {
      this.graph.getModel().removeListener(this.changeHandler);
      this.graph.getView().removeListener(this.changeHandler);
    }

    if (this.drillHandler) {
      this.graph.removeListener(this.drillHandler);
      this.graph.getView().removeListener(this.drillHandler);
    }

    if (this.escapeHandler) {
      this.graph.removeListener(this.escapeHandler);
    }
  }
}

export default ConnectionHandler;
