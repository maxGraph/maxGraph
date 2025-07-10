/*
Copyright 2024-present The maxGraph project Contributors

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

import type Point from '../geometry/Point.js';
import type CellState from '../cell/CellState.js';
import type InternalMouseEvent from '../event/InternalMouseEvent.js';
import type ConnectionConstraint from '../other/ConnectionConstraint.js';
import type Cell from '../cell/Cell.js';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Specifies if a child should be constrained inside the parent bounds after a move or resize of the child.
     * @default true
     */
    constrainChildren: boolean;

    /**
     * Specifies if child cells with relative geometries should be constrained inside the parent bounds, if {@link constrainChildren} is `true`, and/or the {@link maximumGraphBounds}.
     * @default false
     */
    constrainRelativeChildren: boolean;

    /**
     * Specifies if edges should be disconnected from their terminals when they are moved.
     * @default true
     */
    disconnectOnMove: boolean;

    cellsDisconnectable: boolean;

    /**
     * Returns the constraint used to connect to the outline of the given state.
     */
    getOutlineConstraint: (
      point: Point,
      terminalState: CellState,
      me: InternalMouseEvent
    ) => ConnectionConstraint | null;

    /**
     * Returns an array of all {@link ConnectionConstraint}s for the given terminal. If
     * the shape of the given terminal is a {@link StencilShape} then the constraints
     * of the corresponding {@link StencilShape} are returned.
     *
     * @param terminal {@link CellState} that represents the terminal.
     * @param source Boolean that specifies if the terminal is the source or target.
     */
    getAllConnectionConstraints: (
      terminal: CellState | null,
      source: boolean
    ) => ConnectionConstraint[] | null;

    /**
     * Returns an {@link ConnectionConstraint} that describes the given connection point.
     * This result can then be passed to {@link getConnectionPoint}.
     *
     * @param edge {@link CellState} that represents the edge.
     * @param terminal {@link CellState} that represents the terminal.
     * @param source Boolean indicating if the terminal is the source or target. Default is `false`.
     */
    getConnectionConstraint: (
      edge: CellState,
      terminal: CellState | null,
      source: boolean
    ) => ConnectionConstraint;

    /**
     * Sets the {@link ConnectionConstraint} that describes the given connection point.
     * If no constraint is given then nothing is changed.
     *
     * To remove an existing constraint from the given edge, use an empty constraint instead.
     *
     * @param edge {@link Cell} that represents the edge.
     * @param terminal {@link Cell} that represents the terminal.
     * @param source Boolean indicating if the terminal is the source or target. Default is `false`.
     * @param constraint Optional {@link ConnectionConstraint} to be used for this connection.
     */
    setConnectionConstraint: (
      edge: Cell,
      terminal: Cell | null,
      source: boolean,
      constraint: ConnectionConstraint | null
    ) => void;

    /**
     * Returns the nearest point in the list of absolute points or the center of the opposite terminal.
     *
     * @param vertex {@link CellState} that represents the vertex.
     * @param constraint {@link ConnectionConstraint} that represents the connection point constraint as returned by {@link getConnectionConstraint}.
     * @param round Default is `true`.
     */
    getConnectionPoint: (
      vertex: CellState,
      constraint: ConnectionConstraint,
      round?: boolean
    ) => Point | null;

    /**
     * Connects the specified end of the given edge to the given terminal using {@link cellConnected} and fires {@link InternalEvent.CONNECT_CELL} while the transaction is in progress.
     *
     * @param edge {@link Cell} whose terminal should be updated.
     * @param terminal {@link Cell} that represents the new terminal to be used.
     * @param source Boolean indicating if the new terminal is the source or target. Default is `false`.
     * @param constraint Optional {@link ConnectionConstraint} to be used for this connection.
     * @returns the updated edge.
     */
    connectCell: (
      edge: Cell,
      terminal: Cell | null,
      source: boolean,
      constraint?: ConnectionConstraint | null
    ) => Cell;

    /**
     * Sets the new terminal for the given edge and resets the edge points if {@link resetEdgesOnConnect} is `true`.
     *
     * This method fires {@link InternalEvent.CELL_CONNECTED} while the transaction is in progress.
     *
     * @param edge {@link Cell} whose terminal should be updated.
     * @param terminal {@link Cell} that represents the new terminal to be used.
     * @param source Boolean indicating if the new terminal is the source or target.  Default is `false`.
     * @param constraint {@link ConnectionConstraint} to be used for this connection.
     */
    cellConnected: (
      edge: Cell,
      terminal: Cell | null,
      source: boolean,
      constraint?: ConnectionConstraint | null
    ) => void;

    /**
     * Disconnects the given edges from the terminals which are not in the given array.
     *
     * @param cells Array of {@link Cell} to be disconnected.
     */
    disconnectGraph: (cells: Cell[]) => void;

    /**
     * Returns all visible edges connected to the given cell without loops.
     *
     * @param cell {@link Cell} whose connections should be returned.
     * @param parent Optional parent of the opposite end for a connection to be returned.
     */
    getConnections: (cell: Cell, parent?: Cell | null) => Cell[];

    /**
     * Returns `true` if the given cell should be kept inside the bounds of its parent according to the rules defined by {@link getOverlap} and {@link isAllowOverlapParent}.
     *
     * This implementation returns false `for` all children of edges and {@link isConstrainChildren} otherwise.
     *
     * @param cell {@link Cell} that should be constrained.
     */
    isConstrainChild: (cell: Cell) => boolean;

    /**
     * Returns {@link constrainChildren}.
     */
    isConstrainChildren: () => boolean;

    /**
     * Sets {@link constrainChildren}.
     */
    setConstrainChildren: (value: boolean) => void;

    /**
     * Returns {@link constrainRelativeChildren}.
     */
    isConstrainRelativeChildren: () => boolean;

    /**
     * Sets {@link constrainRelativeChildren}.
     */
    setConstrainRelativeChildren: (value: boolean) => void;

    /**
     * Returns {@link disconnectOnMove} as a boolean.
     */
    isDisconnectOnMove: () => boolean;

    /**
     * Specifies if edges should be disconnected when moved.
     *
     * **Note**: cloned edges are always disconnected.
     *
     * @param value Boolean indicating if edges should be disconnected when moved.
     */
    setDisconnectOnMove: (value: boolean) => void;

    /**
     * Returns true if the given cell is disconnectable from the source or target terminal.
     * This returns {@link isCellsDisconnectable} for all given cells if {@link isCellLocked} does not return `true` for the given cell.
     *
     * @param cell {@link Cell} whose disconnectable state should be returned.
     * @param terminal {@link Cell} that represents the source or target terminal.
     * @param source Boolean indicating if the source or target terminal is to be disconnected.
     */
    isCellDisconnectable: (cell: Cell, terminal: Cell | null, source: boolean) => boolean;

    /**
     * Returns {@link cellsDisconnectable}.
     */
    isCellsDisconnectable: () => boolean;

    /**
     * Sets {@link cellsDisconnectable}.
     */
    setCellsDisconnectable: (value: boolean) => void;

    /**
     * Returns `true` if the given cell is a valid source for new connections.
     *
     * This implementation returns `true` for all non-null values and is called by is called by {@link isValidConnection}.
     *
     * @param cell {@link Cell} that represents a possible source or `null`.
     */
    isValidSource: (cell: Cell | null) => boolean;

    /**
     * Returns {@link isValidSource} for the given cell. This is called by {@link isValidConnection}.
     *
     * @param cell {@link Cell} that represents a possible target or `null`.
     */
    isValidTarget: (cell: Cell | null) => boolean;

    /**
     * Returns `true` if the given target cell is a valid target for source.
     *
     * This is a boolean implementation for not allowing connections between certain pairs of vertices and is called by {@link getEdgeValidationError}.
     *
     * This implementation returns `true` if {@link isValidSource} returns true for the source and {@link isValidTarget} returns true for the target.
     *
     * @param source {@link Cell} that represents the source cell.
     * @param target {@link Cell} that represents the target cell.
     */
    isValidConnection: (source: Cell | null, target: Cell | null) => boolean;

    /**
     * Specifies if the graph should allow new connections.
     *
     * This implementation updates {@link ConnectionHandler.enabled}.
     *
     * @param connectable Boolean indicating if new connections should be allowed.
     */
    setConnectable: (connectable: boolean) => void;

    /**
     * Returns `true` if the {@link ConnectionHandler} is enabled.
     */
    isConnectable: () => boolean;
  }
}
