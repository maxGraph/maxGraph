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

import type { CellStyle, EdgeParameters, EdgeParametersValue } from '../../types.js';
import type Cell from '../cell/Cell.js';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Specifies if edge control points should be reset after the resize of a connected cell.
     * @default false
     */
    resetEdgesOnResize: boolean;

    /**
     * Specifies if edge control points should be reset after the move of a connected cell.
     * @default false
     */
    resetEdgesOnMove: boolean;

    /**
     * Specifies if edge control points should be reset after the edge has been reconnected.
     * @default true
     */
    resetEdgesOnConnect: boolean;

    /**
     * Specifies if edges are connectable. This overrides the connectable field in edges.
     * @default false
     */
    connectableEdges: boolean;

    /**
     * Specifies if edges with disconnected terminals are allowed in the graph.
     * @default true
     */
    allowDanglingEdges: boolean;

    /**
     * Specifies if edges that are cloned should be validated and only inserted if they are valid.
     *
     * @default false
     */
    cloneInvalidEdges: boolean;

    /**
     * Specifies the return value for edges in {@link isLabelMovable}.
     * @default true
     */
    edgeLabelsMovable: boolean;

    isResetEdgesOnMove: () => boolean;
    isResetEdgesOnConnect: () => boolean;
    isResetEdgesOnResize: () => boolean;

    /**
     * Returns {@link edgeLabelsMovable}.
     */
    isEdgeLabelsMovable: () => boolean;

    /**
     * Sets {@link edgeLabelsMovable}.
     */
    setEdgeLabelsMovable: (value: boolean) => void;

    /**
     * Specifies if dangling edges are allowed, that is, if edges are allowed
     * that do not have a source and/or target terminal defined.
     *
     * @param value Boolean indicating if dangling edges are allowed.
     */
    setAllowDanglingEdges: (value: boolean) => void;

    /**
     * Returns {@link allowDanglingEdges} as a boolean.
     */
    isAllowDanglingEdges: () => boolean;

    /**
     * Specifies if edges should be connectable.
     *
     * @param value Boolean indicating if edges should be connectable.
     */
    setConnectableEdges: (value: boolean) => void;

    /**
     * Returns {@link connectableEdges} as a boolean.
     */
    isConnectableEdges: () => boolean;

    /**
     * Sets {@link cloneInvalidEdges}.
     */
    setCloneInvalidEdges: (value: boolean) => void;

    /**
     * Returns {@link cloneInvalidEdges} as a boolean.
     */
    isCloneInvalidEdges: () => boolean;

    /**
     * Toggles the style of the given edge between `null` (or empty) and {@link alternateEdgeStyle}.
     *
     * This method fires {@link InternalEvent.FLIP_EDGE} while the transaction is in progress.
     *
     * Here is an example that overrides this implementation to invert the value of {@link CellStateStyle.elbow} without removing any existing styles.
     *
     * ```javascript
     * graph.flipEdge = function(edge) {
     *   if (edge) {
     *     const style = this.getCurrentCellStyle(edge);
     *     const elbow = style.elbow ?? 'horizontal';
     *     const value = (elbow == 'horizontal') ? 'vertical' : 'horizontal';
     *     this.setCellStyles('elbow', value, [edge]);
     *   }
     * };
     * ```
     *
     * @param edge {@link Cell} whose style should be changed.
     * @returns The edge that was flipped.
     */
    flipEdge: (edge: Cell) => Cell;

    /**
     * Splits the given edge by adding the newEdge between the previous source and the given cell
     * and reconnecting the source of the given edge to the given cell.
     *
     * This method fires {@link InternalEvent.SPLIT_EDGE} while the transaction is in progress.
     *
     * @param edge {@link Cell} that represents the edge to be split.
     * @param cells {@link Cell}s that represents the cells to insert into the edge.
     * @param newEdge <Cell> that represents the edge to be inserted.
     * @param dx Optional integer that specifies the vector to move the cells.
     * @param dy Optional integer that specifies the vector to move the cells.
     * @param x Integer that specifies the x-coordinate of the drop location.
     * @param y Integer that specifies the y-coordinate of the drop location.
     * @param parent Optional parent to insert the cell. If `null`,  the parent of the edge is used.
     * @returns The new edge that was inserted.
     */
    splitEdge: (
      edge: Cell,
      cells: Cell[],
      newEdge: Cell | null,
      dx?: number,
      dy?: number,
      x?: number,
      y?: number,
      parent?: Cell | null
    ) => Cell;

    /**
     * Adds a new edge into the given parent {@link Cell} using value as the user object and the given source and target as the terminals of the new edge.
     * The id and style are used for the respective properties of the new {@link Cell}, which is returned.
     *
     * **IMPORTANT**:
     * - This is a legacy method to ease the migration from `mxGraph`. Use the {@link insertEdge} method with a single object parameter instead.
     *
     * @param parent {@link Cell} that specifies the parent of the new edge. If not set, use the default parent.
     * @param id Optional string that defines the Id of the new edge. If not set, the id is auto-generated when creating the vertex.
     * @param value Object to be used as the user object which is generally used to display the label of the edge. The default implementation handles `string` object.
     * @param source {@link Cell} that defines the source of the edge.
     * @param target {@link Cell} that defines the target of the edge.
     * @param style Optional object that defines the cell style.
     */
    insertEdge(
      parent?: Cell | null,
      id?: string | null,
      value?: EdgeParametersValue,
      source?: Cell | null,
      target?: Cell | null,
      style?: CellStyle
    ): Cell;

    /**
     * Adds a new edge into the given parent {@link Cell} using value as the user object
     * and the given source and target as the terminals of the new edge.
     * The id and style are used for the respective properties of the new {@link Cell}, which is returned.
     *
     * @param params the parameters used to create the new edge.
     */
    insertEdge(params: EdgeParameters): Cell;

    /**
     * Hook method that creates the new edge for {@link insertEdge}.
     *
     * This implementation does not set the source and target of the edge, these are set when the edge is added to the model.
     *
     * @param parent {@link Cell} that specifies the parent of the new edge. If not set, use the default parent.
     * @param id Optional string that defines the Id of the new edge. If not set, the id is auto-generated when creating the vertex.
     * @param value Object to be used as the user object which is generally used to display the label of the edge. The default implementation handles `string` object.
     * @param source {@link Cell} that defines the source of the edge.
     * @param target {@link Cell} that defines the target of the edge.
     * @param style Optional object that defines the cell style.
     */
    createEdge: (
      parent?: Cell | null,
      id?: string,
      value?: any,
      source?: Cell | null,
      target?: Cell | null,
      style?: CellStyle
    ) => Cell;

    /**
     * Adds the edge to the parent and connects it to the given source and target terminals. This is a shortcut method.
     *
     * @param edge {@link Cell} to be inserted into the given parent.
     * @param parent {@link Cell} that represents the new parent. If no parent is given then the default parent is used.
     * @param source Optional {@link Cell} that represents the source terminal.
     * @param target Optional {@link Cell} that represents the target terminal.
     * @param index Optional index to insert the cells at. Default is 'to append'.
     * @returns The edge that was added.
     */
    addEdge: (
      edge: Cell,
      parent: Cell | null,
      source: Cell | null,
      target: Cell | null,
      index?: number | null
    ) => Cell;

    /**
     * Returns an array with the given cells and all edges that are connected to a cell or one of its descendants.
     */
    addAllEdges: (cells: Cell[]) => Cell[];

    /**
     * Returns all edges connected to the given cells or its descendants.
     */
    getAllEdges: (cells: Cell[] | null) => Cell[];

    /**
     * Returns the visible incoming edges for the given cell.
     * If the optional parent argument is specified, then only child edges of the given parent are returned.
     *
     * @param cell {@link Cell} whose incoming edges should be returned.
     * @param parent Optional parent of the opposite end for an edge to be returned.
     */
    getIncomingEdges: (cell: Cell, parent: Cell | null) => Cell[];

    /**
     * Returns the visible outgoing edges for the given cell.
     * If the optional parent argument is specified, then only child edges of the given parent are returned.
     *
     * @param cell {@link Cell} whose outgoing edges should be returned.
     * @param parent Optional parent of the opposite end for an edge to be returned.
     */
    getOutgoingEdges: (cell: Cell, parent: Cell | null) => Cell[];

    /**
     * Returns the incoming and/or outgoing edges for the given cell.
     *
     * If the optional parent argument is specified, then only edges are returned where the opposite is in the given parent cell.
     *
     * If at least one of incoming or outgoing is true, then loops are ignored, if both are false, then all edges connected to the given cell are returned including loops.
     *
     * @param cell {@link Cell} whose edges should be returned.
     * @param parent Optional parent of the opposite end for an edge to be returned.
     * @param incoming Optional boolean that specifies if incoming edges should be included in the result. Default is `true`.
     * @param outgoing Optional boolean that specifies if outgoing edges should be included in the result. Default is `true`.
     * @param includeLoops Optional boolean that specifies if loops should be included in the result. Default is `true`.
     * @param recurse Optional boolean the specifies if the parent specified only needs to be an ancestral parent, `true`, or the direct parent, `false`. Default is `false`.
     */
    getEdges: (
      cell: Cell,
      parent?: Cell | null,
      incoming?: boolean,
      outgoing?: boolean,
      includeLoops?: boolean,
      recurse?: boolean
    ) => Cell[];

    /**
     * Returns the visible child edges of the given parent.
     *
     * @param parent {@link Cell} whose child vertices should be returned.
     */
    getChildEdges: (parent: Cell) => Cell[];

    /**
     * Returns the edges between the given source and target.
     * This takes into account collapsed and invisible cells and returns the connected edges as displayed on the screen.
     *
     * @param source
     * @param target
     * @param directed If set to true, only returns the directed edges i.e. edges whose source is `source` and target is `target`. Default is `false`.
     */
    getEdgesBetween: (source: Cell, target: Cell, directed?: boolean) => Cell[];

    /**
     * Resets the control points of the edges that are connected to the given
     * cells if not both ends of the edge are in the given cells array.
     *
     * @param cells Array of {@link Cell} for which the connected edges should be reset.
     */
    resetEdges: (cells: Cell[]) => void;

    /**
     * Resets the control points of the given edge.
     *
     * @param edge {@link Cell} whose points should be reset.
     */
    resetEdge: (edge: Cell) => Cell;
  }
}
