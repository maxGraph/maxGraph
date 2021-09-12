import Point from '../geometry/Point';
import CellState from '../cell/datatypes/CellState';
import InternalMouseEvent from '../event/InternalMouseEvent';
import ConnectionConstraint from './ConnectionConstraint';
import Rectangle from '../geometry/Rectangle';
import { DIRECTION_NORTH, DIRECTION_SOUTH, DIRECTION_WEST } from '../../util/Constants';
import { getRotatedPoint, mixInto, toRadians } from '../../util/Utils';
import Cell from '../cell/datatypes/Cell';
import CellArray from '../cell/datatypes/CellArray';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import Dictionary from '../../util/Dictionary';
import { Graph } from '../Graph';
import ConnectionHandler from './ConnectionHandler';

declare module '../Graph' {
  interface Graph {
    constrainChildren: boolean;
    constrainRelativeChildren: boolean;
    disconnectOnMove: boolean;
    cellsDisconnectable: boolean;

    getOutlineConstraint: (
      point: Point,
      terminalState: CellState,
      me: InternalMouseEvent
    ) => ConnectionConstraint | null;
    getAllConnectionConstraints: (
      terminal: CellState | null,
      source: boolean
    ) => ConnectionConstraint[] | null;
    getConnectionConstraint: (
      edge: CellState,
      terminal: CellState | null,
      source: boolean
    ) => ConnectionConstraint;
    setConnectionConstraint: (
      edge: Cell,
      terminal: Cell | null,
      source: boolean,
      constraint: ConnectionConstraint | null
    ) => void;
    getConnectionPoint: (
      vertex: CellState,
      constraint: ConnectionConstraint,
      round?: boolean
    ) => Point | null;
    connectCell: (
      edge: Cell,
      terminal: Cell | null,
      source: boolean,
      constraint?: ConnectionConstraint | null
    ) => Cell;
    cellConnected: (
      edge: Cell,
      terminal: Cell | null,
      source: boolean,
      constraint?: ConnectionConstraint | null
    ) => void;
    disconnectGraph: (cells: CellArray) => void;
    getConnections: (cell: Cell, parent: Cell | null) => CellArray;
    isConstrainChild: (cell: Cell) => boolean;
    isConstrainChildren: () => boolean;
    setConstrainChildren: (value: boolean) => void;
    isConstrainRelativeChildren: () => boolean;
    setConstrainRelativeChildren: (value: boolean) => void;
    isDisconnectOnMove: () => boolean;
    setDisconnectOnMove: (value: boolean) => void;
    isCellDisconnectable: (cell: Cell, terminal: Cell | null, source: boolean) => boolean;
    isCellsDisconnectable: () => boolean;
    setCellsDisconnectable: (value: boolean) => void;
    isValidSource: (cell: Cell | null) => boolean;
    isValidTarget: (cell: Cell | null) => boolean;
    isValidConnection: (source: Cell | null, target: Cell | null) => boolean;
    setConnectable: (connectable: boolean) => void;
    isConnectable: () => boolean;
  }
}

type PartialGraph = Pick<Graph, 'getView' | 'getModel' | 'isPortsEnabled'>;
type PartialConnections = Pick<
  Graph,
  | 'constrainChildren'
  | 'constrainRelativeChildren'
  | 'disconnectOnMove'
  | 'cellsDisconnectable'
  | 'getOutlineConstraint'
  | 'getAllConnectionConstraints'
  | 'getConnectionConstraint'
  | 'setConnectionConstraint'
  | 'getConnectionPoint'
  | 'connectCell'
  | 'cellConnected'
  | 'disconnectGraph'
  | 'getConnections'
  | 'isConstrainChild'
  | 'isConstrainChildren'
  | 'setConstrainChildren'
  | 'isConstrainRelativeChildren'
  | 'setConstrainRelativeChildren'
  | 'isDisconnectOnMove'
  | 'setDisconnectOnMove'
  | 'isCellDisconnectable'
  | 'isCellsDisconnectable'
  | 'setCellsDisconnectable'
  | 'isValidSource'
  | 'isValidTarget'
  | 'isValidConnection'
  | 'setConnectable'
  | 'isConnectable'
  | 'setCellStyles'
  | 'fireEvent'
  | 'isPort'
  | 'getTerminalForPort'
  | 'isResetEdgesOnConnect'
  | 'resetEdge'
  | 'getEdges'
  | 'isCellLocked'
  | 'isAllowDanglingEdges'
  | 'isConnectableEdges'
  | 'getPlugin'
>;
type PartialType = PartialGraph & PartialConnections;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const GraphConnectionsMixin: PartialType = {
  /*****************************************************************************
   * Group: Cell connecting and connection constraints
   *****************************************************************************/

  /**
   * Specifies if a child should be constrained inside the parent bounds after a
   * move or resize of the child.
   * @default true
   */
  constrainChildren: true,

  /**
   * Specifies if child cells with relative geometries should be constrained
   * inside the parent bounds, if {@link constrainChildren} is `true`, and/or the
   * {@link maximumGraphBounds}.
   * @default false
   */
  constrainRelativeChildren: false,

  /**
   * Specifies if edges should be disconnected from their terminals when they
   * are moved.
   * @default true
   */
  disconnectOnMove: true,

  cellsDisconnectable: true,

  /**
   * Returns the constraint used to connect to the outline of the given state.
   */
  getOutlineConstraint(point, terminalState, me) {
    if (terminalState.shape) {
      const bounds = <Rectangle>this.getView().getPerimeterBounds(terminalState);
      const direction = terminalState.style.direction;

      if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
        bounds.x += bounds.width / 2 - bounds.height / 2;
        bounds.y += bounds.height / 2 - bounds.width / 2;
        const tmp = bounds.width;
        bounds.width = bounds.height;
        bounds.height = tmp;
      }

      const alpha = toRadians(terminalState.shape.getShapeRotation());

      if (alpha !== 0) {
        const cos = Math.cos(-alpha);
        const sin = Math.sin(-alpha);

        const ct = new Point(bounds.getCenterX(), bounds.getCenterY());
        point = getRotatedPoint(point, cos, sin, ct);
      }

      let sx = 1;
      let sy = 1;
      let dx = 0;
      let dy = 0;

      // LATER: Add flipping support for image shapes
      if (terminalState.cell.isVertex()) {
        let flipH = terminalState.style.flipH;
        let flipV = terminalState.style.flipV;

        if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
          const tmp = flipH;
          flipH = flipV;
          flipV = tmp;
        }

        if (flipH) {
          sx = -1;
          dx = -bounds.width;
        }

        if (flipV) {
          sy = -1;
          dy = -bounds.height;
        }
      }

      point = new Point(
        (point.x - bounds.x) * sx - dx + bounds.x,
        (point.y - bounds.y) * sy - dy + bounds.y
      );

      const x =
        bounds.width === 0
          ? 0
          : Math.round(((point.x - bounds.x) * 1000) / bounds.width) / 1000;
      const y =
        bounds.height === 0
          ? 0
          : Math.round(((point.y - bounds.y) * 1000) / bounds.height) / 1000;

      return new ConnectionConstraint(new Point(x, y), false);
    }
    return null;
  },

  /**
   * Returns an array of all {@link mxConnectionConstraints} for the given terminal. If
   * the shape of the given terminal is a {@link mxStencilShape} then the constraints
   * of the corresponding {@link mxStencil} are returned.
   *
   * @param terminal {@link mxCellState} that represents the terminal.
   * @param source Boolean that specifies if the terminal is the source or target.
   */
  getAllConnectionConstraints(terminal, source) {
    if (terminal && terminal.shape && terminal.shape.stencil) {
      return terminal.shape.stencil.constraints;
    }
    return null;
  },

  /**
   * Returns an {@link ConnectionConstraint} that describes the given connection
   * point. This result can then be passed to {@link getConnectionPoint}.
   *
   * @param edge {@link mxCellState} that represents the edge.
   * @param terminal {@link mxCellState} that represents the terminal.
   * @param source Boolean indicating if the terminal is the source or target.
   */
  getConnectionConstraint(edge, terminal, source = false) {
    let point: Point | null = null;

    const x = edge.style[source ? 'exitX' : 'entryX'];

    if (x !== undefined) {
      const y = edge.style[source ? 'exitY' : 'entryY'];

      if (y !== undefined) {
        point = new Point(x, y);
      }
    }

    let perimeter = false;
    let dx = 0;
    let dy = 0;

    if (point) {
      perimeter = edge.style[source ? 'exitPerimeter' : 'entryPerimeter'];

      // Add entry/exit offset
      dx = edge.style[source ? 'exitDx' : 'entryDx'];
      dy = edge.style[source ? 'exitDy' : 'entryDy'];

      dx = Number.isFinite(dx) ? dx : 0;
      dy = Number.isFinite(dy) ? dy : 0;
    }

    return new ConnectionConstraint(point, perimeter, null, dx, dy);
  },

  /**
   * Sets the {@link ConnectionConstraint} that describes the given connection point.
   * If no constraint is given then nothing is changed. To remove an existing
   * constraint from the given edge, use an empty constraint instead.
   *
   * @param edge {@link mxCell} that represents the edge.
   * @param terminal {@link mxCell} that represents the terminal.
   * @param source Boolean indicating if the terminal is the source or target.
   * @param constraint Optional {@link ConnectionConstraint} to be used for this
   * connection.
   */
  setConnectionConstraint(edge, terminal, source = false, constraint = null) {
    if (constraint) {
      this.getModel().beginUpdate();

      try {
        if (!constraint || !constraint.point) {
          this.setCellStyles(source ? 'exitX' : 'entryX', null, new CellArray(edge));
          this.setCellStyles(source ? 'exitY' : 'entryY', null, new CellArray(edge));
          this.setCellStyles(source ? 'exitDx' : 'entryDx', null, new CellArray(edge));
          this.setCellStyles(source ? 'exitDy' : 'entryDy', null, new CellArray(edge));
          this.setCellStyles(
            source ? 'exitPerimeter' : 'entryPerimeter',
            null,
            new CellArray(edge)
          );
        } else if (constraint.point) {
          this.setCellStyles(
            source ? 'exitX' : 'entryX',
            constraint.point.x,
            new CellArray(edge)
          );
          this.setCellStyles(
            source ? 'exitY' : 'entryY',
            constraint.point.y,
            new CellArray(edge)
          );
          this.setCellStyles(
            source ? 'exitDx' : 'entryDx',
            constraint.dx,
            new CellArray(edge)
          );
          this.setCellStyles(
            source ? 'exitDy' : 'entryDy',
            constraint.dy,
            new CellArray(edge)
          );

          // Only writes 0 since 1 is default
          if (!constraint.perimeter) {
            this.setCellStyles(
              source ? 'exitPerimeter' : 'entryPerimeter',
              '0',
              new CellArray(edge)
            );
          } else {
            this.setCellStyles(
              source ? 'exitPerimeter' : 'entryPerimeter',
              null,
              new CellArray(edge)
            );
          }
        }
      } finally {
        this.getModel().endUpdate();
      }
    }
  },

  /**
   * Returns the nearest point in the list of absolute points or the center
   * of the opposite terminal.
   *
   * @param vertex {@link mxCellState} that represents the vertex.
   * @param constraint {@link mxConnectionConstraint} that represents the connection point
   * constraint as returned by {@link getConnectionConstraint}.
   */
  getConnectionPoint(vertex, constraint, round = true) {
    let point: Point | null = null;

    if (constraint.point) {
      const bounds = <Rectangle>this.getView().getPerimeterBounds(vertex);
      const cx = new Point(bounds.getCenterX(), bounds.getCenterY());
      const direction = vertex.style.direction;
      let r1 = 0;

      // Bounds need to be rotated by 90 degrees for further computation
      if (vertex.style.anchorPointDirection) {
        if (direction === DIRECTION_NORTH) {
          r1 += 270;
        } else if (direction === DIRECTION_WEST) {
          r1 += 180;
        } else if (direction === DIRECTION_SOUTH) {
          r1 += 90;
        }

        // Bounds need to be rotated by 90 degrees for further computation
        if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
          bounds.rotate90();
        }
      }

      const { scale } = this.getView();
      point = new Point(
        bounds.x + constraint.point.x * bounds.width + <number>constraint.dx * scale,
        bounds.y + constraint.point.y * bounds.height + <number>constraint.dy * scale
      );

      // Rotation for direction before projection on perimeter
      let r2 = vertex.style.rotation || 0;

      if (constraint.perimeter) {
        if (r1 !== 0) {
          // Only 90 degrees steps possible here so no trig needed
          let cos = 0;
          let sin = 0;

          if (r1 === 90) {
            sin = 1;
          } else if (r1 === 180) {
            cos = -1;
          } else if (r1 === 270) {
            sin = -1;
          }

          point = getRotatedPoint(point, cos, sin, cx);
        }

        point = this.getView().getPerimeterPoint(vertex, point, false);
      } else {
        r2 += r1;

        if (vertex.cell.isVertex()) {
          let flipH = vertex.style.flipH;
          let flipV = vertex.style.flipV;

          if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
            const temp = flipH;
            flipH = flipV;
            flipV = temp;
          }

          if (flipH) {
            point.x = 2 * bounds.getCenterX() - point.x;
          }

          if (flipV) {
            point.y = 2 * bounds.getCenterY() - point.y;
          }
        }
      }

      // Generic rotation after projection on perimeter
      if (r2 !== 0 && point) {
        const rad = toRadians(r2);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        point = getRotatedPoint(point, cos, sin, cx);
      }
    }

    if (round && point) {
      point.x = Math.round(point.x);
      point.y = Math.round(point.y);
    }
    return point;
  },

  /**
   * Connects the specified end of the given edge to the given terminal
   * using {@link cellConnected} and fires {@link InternalEvent.CONNECT_CELL} while the
   * transaction is in progress. Returns the updated edge.
   *
   * @param edge {@link mxCell} whose terminal should be updated.
   * @param terminal {@link mxCell} that represents the new terminal to be used.
   * @param source Boolean indicating if the new terminal is the source or target.
   * @param constraint Optional {@link ConnectionConstraint} to be used for this
   * connection.
   */
  connectCell(edge, terminal = null, source = false, constraint = null) {
    this.getModel().beginUpdate();
    try {
      const previous = edge.getTerminal(source);
      this.cellConnected(edge, terminal, source, constraint);
      this.fireEvent(
        new EventObject(
          InternalEvent.CONNECT_CELL,
          'edge',
          edge,
          'terminal',
          terminal,
          'source',
          source,
          'previous',
          previous
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
    return edge;
  },

  /**
   * Sets the new terminal for the given edge and resets the edge points if
   * {@link resetEdgesOnConnect} is true. This method fires
   * {@link InternalEvent.CELL_CONNECTED} while the transaction is in progress.
   *
   * @param edge {@link mxCell} whose terminal should be updated.
   * @param terminal {@link mxCell} that represents the new terminal to be used.
   * @param source Boolean indicating if the new terminal is the source or target.
   * @param constraint {@link mxConnectionConstraint} to be used for this connection.
   */
  cellConnected(edge, terminal, source = false, constraint = null) {
    this.getModel().beginUpdate();
    try {
      const previous = edge.getTerminal(source);

      // Updates the constraint
      this.setConnectionConstraint(edge, terminal, source, constraint);

      // Checks if the new terminal is a port, uses the ID of the port in the
      // style and the parent of the port as the actual terminal of the edge.
      if (this.isPortsEnabled()) {
        let id = null;

        if (terminal && this.isPort(terminal)) {
          id = terminal.getId();
          terminal = this.getTerminalForPort(terminal, source);
        }

        // Sets or resets all previous information for connecting to a child port
        const key = source ? 'sourcePort' : 'targetPort';
        this.setCellStyles(key, id, new CellArray(edge));
      }

      this.getModel().setTerminal(edge, terminal, source);

      if (this.isResetEdgesOnConnect()) {
        this.resetEdge(edge);
      }

      this.fireEvent(
        new EventObject(
          InternalEvent.CELL_CONNECTED,
          'edge',
          edge,
          'terminal',
          terminal,
          'source',
          source,
          'previous',
          previous
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
  },

  /**
   * Disconnects the given edges from the terminals which are not in the
   * given array.
   *
   * @param cells Array of {@link Cell} to be disconnected.
   */
  disconnectGraph(cells) {
    this.getModel().beginUpdate();
    try {
      const { scale, translate: tr } = this.getView();

      // Fast lookup for finding cells in array
      const dict = new Dictionary<Cell, boolean>();

      for (let i = 0; i < cells.length; i += 1) {
        dict.put(cells[i], true);
      }

      for (const cell of cells) {
        if (cell.isEdge()) {
          let geo = cell.getGeometry();

          if (geo) {
            const state = this.getView().getState(cell);
            const parent = cell.getParent();
            const pstate = parent ? this.getView().getState(parent) : null;

            if (state && pstate) {
              geo = geo.clone();

              const dx = -pstate.origin.x;
              const dy = -pstate.origin.y;
              const pts = state.absolutePoints;

              let src = cell.getTerminal(true);

              if (src && this.isCellDisconnectable(cell, src, true)) {
                while (src && !dict.get(src)) {
                  src = src.getParent();
                }

                if (!src && pts[0]) {
                  geo.setTerminalPoint(
                    new Point(pts[0].x / scale - tr.x + dx, pts[0].y / scale - tr.y + dy),
                    true
                  );
                  this.getModel().setTerminal(cell, null, true);
                }
              }

              let trg = cell.getTerminal(false);

              if (trg && this.isCellDisconnectable(cell, trg, false)) {
                while (trg && !dict.get(trg)) {
                  trg = trg.getParent();
                }

                if (!trg) {
                  const n = pts.length - 1;
                  const p = pts[n];

                  if (p) {
                    geo.setTerminalPoint(
                      new Point(p.x / scale - tr.x + dx, p.y / scale - tr.y + dy),
                      false
                    );
                    this.getModel().setTerminal(cell, null, false);
                  }
                }
              }

              this.getModel().setGeometry(cell, geo);
            }
          }
        }
      }
    } finally {
      this.getModel().endUpdate();
    }
  },

  /**
   * Returns all visible edges connected to the given cell without loops.
   *
   * @param cell {@link mxCell} whose connections should be returned.
   * @param parent Optional parent of the opposite end for a connection to be
   * returned.
   */
  getConnections(cell, parent = null) {
    return this.getEdges(cell, parent, true, true, false);
  },

  /**
   * Returns true if the given cell should be kept inside the bounds of its
   * parent according to the rules defined by {@link getOverlap} and
   * {@link isAllowOverlapParent}. This implementation returns false for all children
   * of edges and {@link isConstrainChildren} otherwise.
   *
   * @param cell {@link mxCell} that should be constrained.
   */
  isConstrainChild(cell) {
    return (
      this.isConstrainChildren() &&
      !!cell.getParent() &&
      !(<Cell>cell.getParent()).isEdge()
    );
  },

  /**
   * Returns {@link constrainChildren}.
   */
  isConstrainChildren() {
    return this.constrainChildren;
  },

  /**
   * Sets {@link constrainChildren}.
   */
  setConstrainChildren(value) {
    this.constrainChildren = value;
  },

  /**
   * Returns {@link constrainRelativeChildren}.
   */
  isConstrainRelativeChildren() {
    return this.constrainRelativeChildren;
  },

  /**
   * Sets {@link constrainRelativeChildren}.
   */
  setConstrainRelativeChildren(value) {
    this.constrainRelativeChildren = value;
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Returns {@link disconnectOnMove} as a boolean.
   */
  isDisconnectOnMove() {
    return this.disconnectOnMove;
  },

  /**
   * Specifies if edges should be disconnected when moved. (Note: Cloned
   * edges are always disconnected.)
   *
   * @param value Boolean indicating if edges should be disconnected
   * when moved.
   */
  setDisconnectOnMove(value) {
    this.disconnectOnMove = value;
  },

  /**
   * Returns true if the given cell is disconnectable from the source or
   * target terminal. This returns {@link isCellsDisconnectable} for all given
   * cells if {@link isCellLocked} does not return true for the given cell.
   *
   * @param cell {@link mxCell} whose disconnectable state should be returned.
   * @param terminal {@link mxCell} that represents the source or target terminal.
   * @param source Boolean indicating if the source or target terminal is to be
   * disconnected.
   */
  isCellDisconnectable(cell, terminal = null, source = false) {
    return this.isCellsDisconnectable() && !this.isCellLocked(cell);
  },

  /**
   * Returns {@link cellsDisconnectable}.
   */
  isCellsDisconnectable() {
    return this.cellsDisconnectable;
  },

  /**
   * Sets {@link cellsDisconnectable}.
   */
  setCellsDisconnectable(value) {
    this.cellsDisconnectable = value;
  },

  /**
   * Returns true if the given cell is a valid source for new connections.
   * This implementation returns true for all non-null values and is
   * called by is called by {@link isValidConnection}.
   *
   * @param cell {@link mxCell} that represents a possible source or null.
   */
  isValidSource(cell) {
    return (
      (cell == null && this.isAllowDanglingEdges()) ||
      (cell != null &&
        (!cell.isEdge() || this.isConnectableEdges()) &&
        cell.isConnectable())
    );
  },

  /**
   * Returns {@link isValidSource} for the given cell. This is called by
   * {@link isValidConnection}.
   *
   * @param cell {@link mxCell} that represents a possible target or null.
   */
  isValidTarget(cell) {
    return this.isValidSource(cell);
  },

  /**
   * Returns true if the given target cell is a valid target for source.
   * This is a boolean implementation for not allowing connections between
   * certain pairs of vertices and is called by {@link getEdgeValidationError}.
   * This implementation returns true if {@link isValidSource} returns true for
   * the source and {@link isValidTarget} returns true for the target.
   *
   * @param source {@link mxCell} that represents the source cell.
   * @param target {@link mxCell} that represents the target cell.
   */
  isValidConnection(source, target) {
    return this.isValidSource(source) && this.isValidTarget(target);
  },

  /**
   * Specifies if the graph should allow new connections. This implementation
   * updates {@link ConnectionHandler.enabled} in {@link connectionHandler}.
   *
   * @param connectable Boolean indicating if new connections should be allowed.
   */
  setConnectable(connectable) {
    const connectionHandler = this.getPlugin('ConnectionHandler') as ConnectionHandler;

    connectionHandler.setEnabled(connectable);
  },

  /**
   * Returns true if the {@link connectionHandler} is enabled.
   */
  isConnectable() {
    const connectionHandler = this.getPlugin('ConnectionHandler') as ConnectionHandler;

    return connectionHandler.isEnabled();
  },
};

mixInto(Graph)(GraphConnectionsMixin);
