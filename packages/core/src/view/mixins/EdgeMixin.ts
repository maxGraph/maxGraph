import Cell from '../cell/Cell';
import CellArray from '../cell/CellArray';
import { mixInto } from '../../util/utils';
import { removeDuplicates } from '../../util/arrayUtils';
import { findNearestSegment } from '../../util/mathUtils';
import Geometry from '../geometry/Geometry';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import Dictionary from '../../util/Dictionary';
import { Graph } from '../Graph';
import Point from '../geometry/Point';

declare module '../Graph' {
  interface Graph {
    resetEdgesOnResize: boolean;
    resetEdgesOnMove: false;
    resetEdgesOnConnect: boolean;
    connectableEdges: boolean;
    allowDanglingEdges: boolean;
    cloneInvalidEdges: boolean;
    alternateEdgeStyle: string | null;
    edgeLabelsMovable: boolean;

    isResetEdgesOnMove: () => boolean;
    isResetEdgesOnConnect: () => boolean;
    isResetEdgesOnResize: () => boolean;
    isEdgeLabelsMovable: () => boolean;
    setEdgeLabelsMovable: (value: boolean) => void;
    setAllowDanglingEdges: (value: boolean) => void;
    isAllowDanglingEdges: () => boolean;
    setConnectableEdges: (value: boolean) => void;
    isConnectableEdges: () => boolean;
    setCloneInvalidEdges: (value: boolean) => void;
    isCloneInvalidEdges: () => boolean;
    flipEdge: (edge: Cell) => Cell;
    splitEdge: (
      edge: Cell,
      cells: CellArray,
      newEdge: Cell | null,
      dx?: number,
      dy?: number,
      x?: number,
      y?: number,
      parent?: Cell | null
    ) => Cell;
    insertEdge: (...args: any[]) => Cell;
    createEdge: (
      parent: Cell | null,
      id: string,
      value: any,
      source: Cell | null,
      target: Cell | null,
      style: any
    ) => Cell;
    addEdge: (
      edge: Cell,
      parent: Cell | null,
      source: Cell | null,
      target: Cell | null,
      index?: number | null
    ) => Cell;
    addAllEdges: (cells: CellArray) => CellArray;
    getAllEdges: (cells: CellArray | null) => CellArray;
    getIncomingEdges: (cell: Cell, parent: Cell | null) => CellArray;
    getOutgoingEdges: (cell: Cell, parent: Cell | null) => CellArray;
    getEdges: (
      cell: Cell,
      parent?: Cell | null,
      incoming?: boolean,
      outgoing?: boolean,
      includeLoops?: boolean,
      recurse?: boolean
    ) => CellArray;
    getChildEdges: (parent: Cell) => CellArray;
    getEdgesBetween: (source: Cell, target: Cell, directed?: boolean) => CellArray;
    resetEdges: (cells: CellArray) => void;
    resetEdge: (edge: Cell) => Cell;
  }
}

type PartialGraph = Pick<
  Graph,
  | 'batchUpdate'
  | 'fireEvent'
  | 'getDataModel'
  | 'getView'
  | 'getChildCells'
  | 'isValidAncestor'
  | 'cellsAdded'
  | 'cellsMoved'
  | 'cloneCell'
  | 'addCell'
  | 'cellConnected'
>;
type PartialEdge = Pick<
  Graph,
  | 'resetEdgesOnResize'
  | 'resetEdgesOnMove'
  | 'resetEdgesOnConnect'
  | 'connectableEdges'
  | 'allowDanglingEdges'
  | 'cloneInvalidEdges'
  | 'alternateEdgeStyle'
  | 'edgeLabelsMovable'
  | 'isResetEdgesOnMove'
  | 'isResetEdgesOnConnect'
  | 'isResetEdgesOnResize'
  | 'isEdgeLabelsMovable'
  | 'setEdgeLabelsMovable'
  | 'setAllowDanglingEdges'
  | 'isAllowDanglingEdges'
  | 'setConnectableEdges'
  | 'isConnectableEdges'
  | 'setCloneInvalidEdges'
  | 'isCloneInvalidEdges'
  | 'flipEdge'
  | 'splitEdge'
  | 'insertEdge'
  | 'createEdge'
  | 'addEdge'
  | 'addAllEdges'
  | 'getAllEdges'
  | 'getIncomingEdges'
  | 'getOutgoingEdges'
  | 'getEdges'
  | 'getChildEdges'
  | 'getEdgesBetween'
  | 'resetEdges'
  | 'resetEdge'
>;
type PartialType = PartialGraph & PartialEdge;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const EdgeMixin: PartialType = {
  /**
   * Specifies if edge control points should be reset after the resize of a
   * connected cell.
   * @default false
   */
  resetEdgesOnResize: false,

  isResetEdgesOnResize() {
    return this.resetEdgesOnResize;
  },

  /**
   * Specifies if edge control points should be reset after the move of a
   * connected cell.
   * @default false
   */
  resetEdgesOnMove: false,

  isResetEdgesOnMove() {
    return this.resetEdgesOnMove;
  },

  /**
   * Specifies if edge control points should be reset after the the edge has been
   * reconnected.
   * @default true
   */
  resetEdgesOnConnect: true,

  isResetEdgesOnConnect() {
    return this.resetEdgesOnConnect;
  },

  /**
   * Specifies if edges are connectable. This overrides the connectable field in edges.
   * @default false
   */
  connectableEdges: false,

  /**
   * Specifies if edges with disconnected terminals are allowed in the graph.
   * @default true
   */
  allowDanglingEdges: true,

  /**
   * Specifies if edges that are cloned should be validated and only inserted
   * if they are valid.
   * @default true
   */
  cloneInvalidEdges: false,

  /**
   * Specifies the alternate edge style to be used if the main control point
   * on an edge is being double clicked.
   * @default null
   */
  alternateEdgeStyle: null,

  /**
   * Specifies the return value for edges in {@link isLabelMovable}.
   * @default true
   */
  edgeLabelsMovable: true,

  /*****************************************************************************
   * Group: Graph Behaviour
   *****************************************************************************/

  /**
   * Returns {@link edgeLabelsMovable}.
   */
  isEdgeLabelsMovable() {
    return this.edgeLabelsMovable;
  },

  /**
   * Sets {@link edgeLabelsMovable}.
   */
  setEdgeLabelsMovable(value) {
    this.edgeLabelsMovable = value;
  },

  /**
   * Specifies if dangling edges are allowed, that is, if edges are allowed
   * that do not have a source and/or target terminal defined.
   *
   * @param value Boolean indicating if dangling edges are allowed.
   */
  setAllowDanglingEdges(value) {
    this.allowDanglingEdges = value;
  },

  /**
   * Returns {@link allowDanglingEdges} as a boolean.
   */
  isAllowDanglingEdges() {
    return this.allowDanglingEdges;
  },

  /**
   * Specifies if edges should be connectable.
   *
   * @param value Boolean indicating if edges should be connectable.
   */
  setConnectableEdges(value) {
    this.connectableEdges = value;
  },

  /**
   * Returns {@link connectableEdges} as a boolean.
   */
  isConnectableEdges() {
    return this.connectableEdges;
  },

  /**
   * Specifies if edges should be inserted when cloned but not valid wrt.
   * {@link getEdgeValidationError}. If false such edges will be silently ignored.
   *
   * @param value Boolean indicating if cloned invalid edges should be
   * inserted into the graph or ignored.
   */
  setCloneInvalidEdges(value) {
    this.cloneInvalidEdges = value;
  },

  /**
   * Returns {@link cloneInvalidEdges} as a boolean.
   */
  isCloneInvalidEdges() {
    return this.cloneInvalidEdges;
  },

  /*****************************************************************************
   * Group: Cell alignment and orientation
   *****************************************************************************/

  /**
   * Toggles the style of the given edge between null (or empty) and
   * {@link alternateEdgeStyle}. This method fires {@link InternalEvent.FLIP_EDGE} while the
   * transaction is in progress. Returns the edge that was flipped.
   *
   * Here is an example that overrides this implementation to invert the
   * value of {@link 'elbow'} without removing any existing styles.
   *
   * ```javascript
   * graph.flipEdge = function(edge)
   * {
   *   if (edge != null)
   *   {
   *     var style = this.getCurrentCellStyle(edge);
   *     var elbow = mxUtils.getValue(style, 'elbow',
   *         mxConstants.ELBOW_HORIZONTAL);
   *     var value = (elbow == mxConstants.ELBOW_HORIZONTAL) ?
   *         mxConstants.ELBOW_VERTICAL : mxConstants.ELBOW_HORIZONTAL;
   *     this.setCellStyles('elbow', value, [edge]);
   *   }
   * };
   * ```
   *
   * @param edge {@link mxCell} whose style should be changed.
   */
  flipEdge(edge) {
    if (this.alternateEdgeStyle) {
      this.batchUpdate(() => {
        const style = edge.getStyle();

        if (!style || style.length === 0) {
          this.getDataModel().setStyle(edge, this.alternateEdgeStyle);
        } else {
          this.getDataModel().setStyle(edge, null);
        }

        // Removes all existing control points
        this.resetEdge(edge);
        this.fireEvent(new EventObject(InternalEvent.FLIP_EDGE, { edge }));
      });
    }
    return edge;
  },

  /**
   * Splits the given edge by adding the newEdge between the previous source
   * and the given cell and reconnecting the source of the given edge to the
   * given cell. This method fires {@link Event#SPLIT_EDGE} while the transaction
   * is in progress. Returns the new edge that was inserted.
   *
   * @param edge <Cell> that represents the edge to be splitted.
   * @param cells {@link Cells} that represents the cells to insert into the edge.
   * @param newEdge <Cell> that represents the edge to be inserted.
   * @param dx Optional integer that specifies the vector to move the cells.
   * @param dy Optional integer that specifies the vector to move the cells.
   * @param x Integer that specifies the x-coordinate of the drop location.
   * @param y Integer that specifies the y-coordinate of the drop location.
   * @param parent Optional parent to insert the cell. If null the parent of
   * the edge is used.
   */
  splitEdge(edge, cells, newEdge, dx = 0, dy = 0, x, y, parent = null) {
    parent = parent ?? edge.getParent();
    const source = edge.getTerminal(true);

    this.batchUpdate(() => {
      if (!newEdge) {
        newEdge = this.cloneCell(edge);

        // Removes waypoints before/after new cell
        const state = this.getView().getState(edge);
        let geo: Geometry | null = newEdge.getGeometry();

        if (geo && state) {
          const t = this.getView().translate;
          const s = this.getView().scale;
          const idx = findNearestSegment(state, (dx + t.x) * s, (dy + t.y) * s);

          geo.points = (<Point[]>geo.points).slice(0, idx);
          geo = edge.getGeometry();

          if (geo) {
            geo = geo.clone();
            geo.points = (<Point[]>geo.points).slice(idx);
            this.getDataModel().setGeometry(edge, geo);
          }
        }
      }

      this.cellsMoved(cells, dx, dy, false, false);
      this.cellsAdded(
        cells,
        parent as Cell,
        parent ? parent.getChildCount() : 0,
        null,
        null,
        true
      );
      this.cellsAdded(
        new CellArray(newEdge),
        parent as Cell,
        parent ? parent.getChildCount() : 0,
        source,
        cells[0],
        false
      );
      this.cellConnected(edge, cells[0], true);
      this.fireEvent(
        new EventObject(InternalEvent.SPLIT_EDGE, { edge, cells, newEdge, dx, dy })
      );
    });

    return newEdge as Cell;
  },

  /**
   * Adds a new edge into the given parent {@link Cell} using value as the user
   * object and the given source and target as the terminals of the new edge.
   * The id and style are used for the respective properties of the new
   * {@link Cell}, which is returned.
   *
   * @param parent {@link mxCell} that specifies the parent of the new edge.
   * @param id Optional string that defines the Id of the new edge.
   * @param value JavaScript object to be used as the user object.
   * @param source {@link mxCell} that defines the source of the edge.
   * @param target {@link mxCell} that defines the target of the edge.
   * @param style Optional string that defines the cell style.
   */
  insertEdge(...args) {
    let parent: Cell;
    let id: string = '';
    let value: any; // note me - can be a string or a class instance!!!
    let source: Cell;
    let target: Cell;
    let style: string = ''; // TODO: Also allow for an object or class instance??

    if (args.length === 1) {
      // If only a single parameter, treat as an object
      // This syntax can be more readable
      const params = args[0];
      parent = params.parent;
      id = params.id || '';
      value = params.value || '';
      source = params.source;
      target = params.target;
      style = params.style;
    } else {
      // otherwise treat as individual arguments
      [parent, id, value, source, target, style] = args;
    }

    const edge = this.createEdge(parent, id, value, source, target, style);
    return this.addEdge(edge, parent, source, target);
  },

  /**
   * Hook method that creates the new edge for {@link insertEdge}. This
   * implementation does not set the source and target of the edge, these
   * are set when the edge is added to the model.
   *
   */
  createEdge(parent = null, id, value, source = null, target = null, style) {
    // Creates the edge
    const edge = new Cell(value, new Geometry(), style);
    edge.setId(id);
    edge.setEdge(true);
    (<Geometry>edge.geometry).relative = true;
    return edge;
  },

  /**
   * Adds the edge to the parent and connects it to the given source and
   * target terminals. This is a shortcut method. Returns the edge that was
   * added.
   *
   * @param edge {@link mxCell} to be inserted into the given parent.
   * @param parent {@link mxCell} that represents the new parent. If no parent is
   * given then the default parent is used.
   * @param source Optional {@link Cell} that represents the source terminal.
   * @param target Optional {@link Cell} that represents the target terminal.
   * @param index Optional index to insert the cells at. Default is 'to append'.
   */
  addEdge(edge, parent = null, source = null, target = null, index = null) {
    return this.addCell(edge, parent, index, source, target);
  },

  /*****************************************************************************
   * Group: Folding
   *****************************************************************************/

  /**
   * Returns an array with the given cells and all edges that are connected
   * to a cell or one of its descendants.
   */
  addAllEdges(cells) {
    const allCells = cells.slice();
    return new CellArray(...removeDuplicates(allCells.concat(this.getAllEdges(cells))));
  },

  /**
   * Returns all edges connected to the given cells or its descendants.
   */
  getAllEdges(cells) {
    let edges: CellArray = new CellArray();

    if (cells) {
      for (let i = 0; i < cells.length; i += 1) {
        const edgeCount = cells[i].getEdgeCount();

        for (let j = 0; j < edgeCount; j++) {
          edges.push(cells[i].getEdgeAt(j));
        }

        // Recurses
        const children = cells[i].getChildren();
        edges = edges.concat(this.getAllEdges(children));
      }
    }
    return edges;
  },

  /**
   * Returns the visible incoming edges for the given cell. If the optional
   * parent argument is specified, then only child edges of the given parent
   * are returned.
   *
   * @param cell {@link mxCell} whose incoming edges should be returned.
   * @param parent Optional parent of the opposite end for an edge to be
   * returned.
   */
  getIncomingEdges(cell, parent = null) {
    return this.getEdges(cell, parent, true, false, false);
  },

  /**
   * Returns the visible outgoing edges for the given cell. If the optional
   * parent argument is specified, then only child edges of the given parent
   * are returned.
   *
   * @param cell {@link mxCell} whose outgoing edges should be returned.
   * @param parent Optional parent of the opposite end for an edge to be
   * returned.
   */
  getOutgoingEdges(cell, parent = null) {
    return this.getEdges(cell, parent, false, true, false);
  },

  /**
   * Returns the incoming and/or outgoing edges for the given cell.
   * If the optional parent argument is specified, then only edges are returned
   * where the opposite is in the given parent cell. If at least one of incoming
   * or outgoing is true, then loops are ignored, if both are false, then all
   * edges connected to the given cell are returned including loops.
   *
   * @param cell <Cell> whose edges should be returned.
   * @param parent Optional parent of the opposite end for an edge to be
   * returned.
   * @param incoming Optional boolean that specifies if incoming edges should
   * be included in the result. Default is true.
   * @param outgoing Optional boolean that specifies if outgoing edges should
   * be included in the result. Default is true.
   * @param includeLoops Optional boolean that specifies if loops should be
   * included in the result. Default is true.
   * @param recurse Optional boolean the specifies if the parent specified only
   * need be an ancestral parent, true, or the direct parent, false.
   * Default is false
   */
  getEdges(
    cell,
    parent = null,
    incoming = true,
    outgoing = true,
    includeLoops = true,
    recurse = false
  ) {
    let edges: CellArray = new CellArray();
    const isCollapsed = cell.isCollapsed();
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);

      if (isCollapsed || !child.isVisible()) {
        edges = edges.concat(child.getEdges(incoming, outgoing));
      }
    }

    edges = edges.concat(cell.getEdges(incoming, outgoing));
    const result = new CellArray();

    for (let i = 0; i < edges.length; i += 1) {
      const state = this.getView().getState(edges[i]);
      const source =  this.getView().getVisibleTerminal(edges[i], true);
      const target =  this.getView().getVisibleTerminal(edges[i], false);

      if (
        (includeLoops && source && target && source === target) ||
        (source !== target &&
          ((incoming && target === cell && (!parent || this.isValidAncestor(<Cell>source, parent, recurse))) ||
            (outgoing && source === cell && (!parent || this.isValidAncestor(<Cell>target, parent, recurse)))))
      ) {
        result.push(edges[i]);
      }
    }
    return result;
  },

  /*****************************************************************************
   * Group: Cell retrieval
   *****************************************************************************/

  /**
   * Returns the visible child edges of the given parent.
   *
   * @param parent {@link mxCell} whose child vertices should be returned.
   */
  getChildEdges(parent) {
    return this.getChildCells(parent, false, true);
  },

  /**
   * Returns the edges between the given source and target. This takes into
   * account collapsed and invisible cells and returns the connected edges
   * as displayed on the screen.
   *
   * source -
   * target -
   * directed -
   */
  getEdgesBetween(source, target, directed = false) {
    const edges = this.getEdges(source);
    const result = new CellArray();

    // Checks if the edge is connected to the correct
    // cell and returns the first match
    for (let i = 0; i < edges.length; i += 1) {
      const state = this.getView().getState(edges[i]);

      const src = state
        ? state.getVisibleTerminal(true)
        : this.getView().getVisibleTerminal(edges[i], true);
      const trg = state
        ? state.getVisibleTerminal(false)
        : this.getView().getVisibleTerminal(edges[i], false);

      if (
        (src === source && trg === target) ||
        (!directed && src === target && trg === source)
      ) {
        result.push(edges[i]);
      }
    }
    return result;
  },

  /*****************************************************************************
   * Group: Cell moving
   *****************************************************************************/

  /**
   * Resets the control points of the edges that are connected to the given
   * cells if not both ends of the edge are in the given cells array.
   *
   * @param cells Array of {@link Cell} for which the connected edges should be
   * reset.
   */
  resetEdges(cells) {
    // Prepares faster cells lookup
    const dict = new Dictionary();

    for (let i = 0; i < cells.length; i += 1) {
      dict.put(cells[i], true);
    }

    this.batchUpdate(() => {
      for (let i = 0; i < cells.length; i += 1) {
        const edges = cells[i].getEdges();

        for (let j = 0; j < edges.length; j++) {
          const state = this.getView().getState(edges[j]);

          const source = state
            ? state.getVisibleTerminal(true)
            : this.getView().getVisibleTerminal(edges[j], true);
          const target = state
            ? state.getVisibleTerminal(false)
            : this.getView().getVisibleTerminal(edges[j], false);

          // Checks if one of the terminals is not in the given array
          if (!dict.get(source) || !dict.get(target)) {
            this.resetEdge(edges[j]);
          }
        }

        this.resetEdges(cells[i].getChildren());
      }
    });
  },

  /**
   * Resets the control points of the given edge.
   *
   * @param edge {@link mxCell} whose points should be reset.
   */
  resetEdge(edge) {
    let geo = edge.getGeometry();

    // Resets the control points
    if (geo && geo.points && (<Point[]>geo.points).length > 0) {
      geo = geo.clone();
      geo.points = [];
      this.getDataModel().setGeometry(edge, geo);
    }

    return edge;
  },
};

mixInto(Graph)(EdgeMixin);
