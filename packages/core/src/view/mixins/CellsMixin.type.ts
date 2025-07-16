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

import type Cell from '../cell/Cell.js';
import type Rectangle from '../geometry/Rectangle.js';
import type {
  AlignValue,
  CellStateStyle,
  CellStyle,
  NumericCellStateStyleKeys,
  VAlignValue,
} from '../../types.js';
import type Geometry from '../geometry/Geometry.js';
import type CellState from '../cell/CellState.js';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Specifies the return value for {@link isCellsResizable}.
     * @default true
     */
    cellsResizable: boolean;

    /**
     * Specifies the return value for {@link isCellsBendable}.
     * @default true
     */
    cellsBendable: boolean;

    /**
     * Specifies the return value for {@link isCellsSelectable}.
     * @default true
     */
    cellsSelectable: boolean;

    /**
     * Specifies the return value for {@link isCellsDisconnectable}.
     * @default true
     */
    cellsDisconnectable: boolean;

    /**
     * Specifies if the graph should automatically update the cell size after an
     * edit. This is used in {@link isAutoSizeCell}.
     * @default false
     */
    autoSizeCells: boolean;

    /**
     * Specifies if autoSize style should be applied when cells are added.
     * @default false
     */
    autoSizeCellsOnAdd: boolean;

    /**
     * Specifies the return value for {@link isCellLocked}.
     * @default false
     */
    cellsLocked: boolean;

    /**
     * Specifies the return value for {@link isCellCloneable}.
     * @default true
     */
    cellsCloneable: boolean;

    /**
     * Specifies the return value for {@link isCellDeletable}.
     * @default true
     */
    cellsDeletable: boolean;

    /**
     * Specifies the return value for {@link isCellMovable}.
     * @default true
     */
    cellsMovable: boolean;

    /**
     * Specifies if a parent should contain the child bounds after a resize of
     * the child. This has precedence over {@link constrainChildren}.
     * @default true
     */
    extendParents: boolean;

    /**
     * Specifies if parents should be extended according to the {@link extendParents}
     * switch if cells are added.
     * @default true
     */
    extendParentsOnAdd: boolean;

    /**
     * Specifies if parents should be extended according to the {@link extendParents}
     * switch if cells are added.
     * @default false (for backwards compatibility)
     */
    extendParentsOnMove: boolean;

    /**
     * Returns the bounding box for the given array of {@link Cell}. The bounding box for
     * each cell and its descendants is computed using {@link view.getBoundingBox}.
     *
     * @param cells Array of {@link Cell} whose bounding box should be returned.
     */
    getBoundingBox: (cells: Cell[]) => Rectangle | null;

    /**
     * Removes all cached information for the given cell and its descendants.
     * This is called when a cell was removed from the model.
     *
     * @param cell {@link Cell} that was removed from the model.
     */
    removeStateForCell: (cell: Cell) => void;

    /**
     * Returns the style for the given cell from the cell state, if one exists,
     * or using {@link getCellStyle}.
     *
     * @param cell {@link Cell} whose style should be returned as an array.
     * @param ignoreState Optional boolean that specifies if the cell state should be ignored.
     */
    getCurrentCellStyle: (cell: Cell, ignoreState?: boolean) => CellStateStyle;

    /**
     * Returns the computed style of the Cell using the edge or vertex default style regarding of the type of the cell.
     * The actual computation is done by {@link Stylesheet.getCellStyle}.
     *
     * **Note**: You should try and get the cell state for the given cell and use the cached style in the state before using this method.
     *
     * @param cell {@link Cell} whose style should be returned as an array.
     */
    getCellStyle: (cell: Cell) => CellStateStyle;

    /**
     * Tries to resolve the value for the image style in the image bundles and
     * turns short data URIs as defined in {@link ImageBundle} to data URIs as
     * defined in RFC 2397 of the IETF.
     */
    postProcessCellStyle: (style: CellStateStyle) => CellStateStyle;

    /**
     * Sets the style of the specified cells. If no cells are given, then the selection cells are changed.
     *
     * **IMPORTANT**: Do not pass {@link Cell.getStyle} as value of the `style` parameter. Always get a clone of the style of the cell with {@link Cell.getClonedStyle}, then update it and pass the updated style to this method.
     * For more details, see {@link GraphDataModel.setStyle}.
     *
     * @param style String representing the new style of the cells.
     * @param cells Optional array of {@link Cell} to set the style for. Default is the selection cells.
     */
    setCellStyle: (style: CellStyle, cells?: Cell[]) => void;

    /**
     * Toggles the boolean value for the given key in the style of the given cell and returns the new value as boolean.
     *
     * If no cell is specified then the selection cell is used.
     *
     * @param key String representing the key for the boolean value to be toggled.
     * @param defaultValue Optional boolean default value if no value is defined. Default is `false`.
     * @param cell Optional {@link Cell} whose style should be modified. Default is the selection cell.
     */
    toggleCellStyle: (
      key: keyof CellStateStyle,
      defaultValue?: boolean,
      cell?: Cell
    ) => boolean | null;

    /**
     * Toggles the boolean value for the given key in the style of the given cells and returns the new value as boolean.
     *
     * If no cells are specified, then the selection cells are used.
     *
     * For example, this can be used to toggle {@link CellStateStyle.rounded} or any other style with a boolean value.
     *
     * @param key String representing the key for the boolean value to be toggled.
     * @param defaultValue Optional boolean default value if no value is defined. Default is `false`.
     * @param cells Optional array of {@link Cell} whose styles should be modified. Default is the selection cells.
     */
    toggleCellStyles: (
      key: keyof CellStateStyle,
      defaultValue?: boolean,
      cells?: Cell[]
    ) => boolean | null;

    /**
     * Sets the key to value in the styles of the given cells. This will modify the existing cell styles in-place and override any existing assignment for the given key.
     *
     * If no cells are specified, then the selection cells are changed.
     *
     * If no value is specified, then the respective key is removed from the styles.
     *
     * @param key String representing the key to be assigned.
     * @param value String representing the new value for the key.
     * @param cells Optional array of {@link Cell} to change the style for. Default is the selection cells.
     */
    setCellStyles: (
      key: keyof CellStateStyle,
      value: CellStateStyle[keyof CellStateStyle],
      cells?: Cell[]
    ) => void;

    /**
     * Toggles the given bit for the given key in the styles of the specified cells.
     *
     * @param key String representing the key to toggle the flag in.
     * @param flag Integer that represents the bit to be toggled.
     * @param cells Optional array of {@link Cell} to change the style for. Default is the selection cells.
     */
    toggleCellStyleFlags: (
      key: NumericCellStateStyleKeys,
      flag: number,
      cells?: Cell[] | null
    ) => void;

    /**
     * Sets or toggles the given bit for the given key in the styles of the specified cells.
     *
     * @param key String representing the key to toggle the flag in.
     * @param flag Integer that represents the bit to be toggled.
     * @param value Boolean value to be used or `null` if the value should be toggled. Default is `null`.
     * @param cells Optional array of {@link Cell} to change the style for. Default is the selection cells.
     */
    setCellStyleFlags: (
      key: NumericCellStateStyleKeys,
      flag: number,
      value?: boolean | null,
      cells?: Cell[] | null
    ) => void;

    /**
     * Aligns the given cells vertically or horizontally according to the given alignment using the optional parameter as the coordinate.
     *
     * @param align Specifies the alignment.
     * @param cells Array of {@link Cell} to be aligned.
     * @param param Optional coordinate for the alignment.
     */
    alignCells: (
      align: AlignValue | VAlignValue,
      cells?: Cell[],
      param?: number | null
    ) => void;

    /**
     * Returns the clone for the given cell. Uses {@link cloneCells}.
     *
     * @param cell {@link Cell} to be cloned.
     * @param allowInvalidEdges Optional boolean that specifies if invalid edges should be cloned. Default is `true`.
     * @param mapping Optional mapping for existing clones.
     * @param keepPosition Optional boolean indicating if the position of the cells should be updated to reflect the lost parent cell. Default is `false`.
     */
    cloneCell: (
      cell: Cell,
      allowInvalidEdges?: boolean,
      mapping?: any,
      keepPosition?: boolean
    ) => Cell;

    /**
     * Returns the clones for the given cells. The clones are created recursively using {@link cloneCells}.
     *
     * If the terminal of an edge is not in the given array, then the respective end is assigned a terminal point and the terminal is removed.
     *
     * @param cells Array of {@link Cell} to be cloned.
     * @param allowInvalidEdges Optional boolean that specifies if invalid edges should be cloned. Default is `true`.
     * @param mapping Optional mapping for existing clones.
     * @param keepPosition Optional boolean indicating if the position of the cells should be updated to reflect the lost parent cell. Default is `false`.
     */
    cloneCells: (
      cells: Cell[],
      allowInvalidEdges?: boolean,
      mapping?: any,
      keepPosition?: boolean
    ) => Cell[];

    /**
     * Adds the cell to the parent and connects it to the given source and target terminals.
     *
     * This is a shortcut method.
     *
     * @param cell {@link Cell} to be inserted into the given parent.
     * @param parent {@link Cell} that represents the new parent. If no parent is given then the default parent is used.
     * @param index Optional index to insert the cells at. Default is 'to append'.
     * @param source Optional {@link Cell} that represents the source terminal.
     * @param target Optional {@link Cell} that represents the target terminal.
     * @returns the cell that was added.
     */
    addCell: (
      cell: Cell,
      parent: Cell | null,
      index?: number | null,
      source?: Cell | null,
      target?: Cell | null
    ) => Cell;

    /**
     * Adds the cells to the parent at the given index, connecting each cell to
     * the optional source and target terminal. The change is carried out using
     * {@link cellsAdded}. This method fires {@link InternalEvent.ADD_CELLS} while the
     * transaction is in progress. Returns the cells that were added.
     *
     * @param cells Array of {@link Cell}s to be inserted.
     * @param parent {@link Cell} that represents the new parent. If no parent is given then the default parent is used. Default is `null`.
     * @param index Optional index to insert the cells at.  Default is `null` (append).
     * @param source Optional source {@link Cell} for all inserted cells. Default is `null`.
     * @param target Optional target {@link Cell} for all inserted cells. Default is `null`.
     * @param absolute Optional boolean indicating of cells should be kept at their absolute position. Default is `false`.
     */
    addCells: (
      cells: Cell[],
      parent?: Cell | null,
      index?: number | null,
      source?: Cell | null,
      target?: Cell | null,
      absolute?: boolean
    ) => Cell[];

    /**
     * Adds the specified cells to the given parent. This method fires
     * {@link Event#CELLS_ADDED} while the transaction is in progress.
     */
    cellsAdded: (
      cells: Cell[],
      parent: Cell,
      index: number,
      source: Cell | null,
      target: Cell | null,
      absolute: boolean,
      constrain?: boolean,
      extend?: boolean
    ) => void;

    /**
     * Resizes the specified cell to just fit around its label and/or children.
     *
     * @param cell {@link Cell} to be resized.
     * @param recurse Optional boolean which specifies if all descendants should be auto-sized. Default is `true`.
     */
    autoSizeCell: (cell: Cell, recurse?: boolean) => void;

    /**
     * Removes the given cells from the graph including all connected edges if
     * includeEdges is true. The change is carried out using {@link cellsRemoved}.
     * This method fires {@link InternalEvent.REMOVE_CELLS} while the transaction is in
     * progress. The removed cells are returned as an array.
     *
     * @param cells Array of {@link Cell} to remove. If null is specified then the selection cells which are deletable are used.
     * @param includeEdges Optional boolean which specifies if all connected edges should be removed as well. Default is `true`.
     */
    removeCells: (cells?: Cell[] | null, includeEdges?: boolean | null) => Cell[];

    /**
     * Removes the given cells from the model. This method fires
     * {@link InternalEvent.CELLS_REMOVED} while the transaction is in progress.
     *
     * @param cells Array of {@link Cell} to remove.
     */
    cellsRemoved: (cells: Cell[]) => void;

    /**
     * Sets the visible state of the specified cells and all connected edges
     * if includeEdges is true. The change is carried out using {@link cellsToggled}.
     * This method fires {@link InternalEvent.TOGGLE_CELLS} while the transaction is in
     * progress. Returns the cells whose visible state was changed.
     *
     * @param show Boolean that specifies the visible state to be assigned.
     * @param cells Array of {@link Cell} whose visible state should be changed. If `null` is specified then the selection cells are used.
     * @param includeEdges Optional boolean indicating if the visible state of all connected edges should be changed as well. Default is `true`.
     */
    toggleCells: (show: boolean, cells: Cell[], includeEdges: boolean) => Cell[];

    /**
     * Sets the visible state of the specified cells.
     *
     * @param cells Array of {@link Cell} whose visible state should be changed.
     * @param show Boolean that specifies the visible state to be assigned.
     */
    cellsToggled: (cells: Cell[], show: boolean) => void;

    /**
     * Updates the size of the given cell in the model using {@link cellSizeUpdated}.
     * This method fires {@link InternalEvent.UPDATE_CELL_SIZE} while the transaction is in
     * progress. Returns the cell whose size was updated.
     *
     * @param cell {@link Cell} whose size should be updated.
     * @param ignoreChildren if `true`, ignore the children of the cell when computing the size of the cell. Default is `false`.
     */
    updateCellSize: (cell: Cell, ignoreChildren?: boolean) => Cell;

    /**
     * Updates the size of the given cell in the model using {@link getPreferredSizeForCell} to get the new size.
     *
     * @param cell {@link Cell} for which the size should be changed.
     * @param ignoreChildren if `true`, ignore the children of the cell when computing the size of the cell. Default is `false`.
     */
    cellSizeUpdated: (cell: Cell, ignoreChildren: boolean) => void;

    /**
     * Returns the preferred width and height of the given {@link Cell} as an
     * {@link Rectangle}. To implement a minimum width, add a new style e.g.
     * minWidth in the vertex and override this method as follows.
     *
     * ```javascript
     * var graphGetPreferredSizeForCell = graph.getPreferredSizeForCell;
     * graph.getPreferredSizeForCell(cell)
     * {
     *   var result = graphGetPreferredSizeForCell.apply(this, arguments);
     *   var style = this.getCellStyle(cell);
     *
     *   if (style.minWidth > 0)
     *   {
     *     result.width = Math.max(style.minWidth, result.width);
     *   }
     *
     *   return result;
     * };
     * ```
     *
     * @param cell {@link Cell} for which the preferred size should be returned.
     * @param textWidth Optional maximum text width for word wrapping.
     */
    getPreferredSizeForCell: (cell: Cell, textWidth?: number | null) => Rectangle | null;

    /**
     * Sets the bounds of the given cell using {@link resizeCells}. Returns the
     * cell which was passed to the function.
     *
     * @param cell {@link Cell} whose bounds should be changed.
     * @param bounds {@link Rectangle} that represents the new bounds.
     * @param recurse Optional boolean that specifies if the children should be resized. Default is `false`.
     */
    resizeCell: (cell: Cell, bounds: Rectangle, recurse?: boolean) => Cell;

    /**
     * Sets the bounds of the given cells and fires a {@link InternalEvent.RESIZE_CELLS}
     * event while the transaction is in progress. Returns the cells which
     * have been passed to the function.
     *
     * @param cells Array of {@link Cell} whose bounds should be changed.
     * @param bounds Array of {@link Rectangle}s that represent the new bounds.
     * @param recurse Optional boolean that specifies if the children should be resized. Default is {@link isRecursiveResize}.
     */
    resizeCells: (cells: Cell[], bounds: Rectangle[], recurse: boolean) => Cell[];

    /**
     * Sets the bounds of the given cells and fires a {@link InternalEvent.CELLS_RESIZED}
     * event. If {@link extendParents} is true, then the parent is extended if a
     * child size is changed so that it overlaps with the parent.
     *
     * The following example shows how to control group resizes to make sure
     * that all child cells stay within the group.
     *
     * ```javascript
     * graph.addListener(InternalEvent.CELLS_RESIZED, function(sender, evt) {
     *   const cells = evt.getProperty('cells');
     *
     *   if (cells) {
     *     for (const cell of cells) {
     *       if (graph.getDataModel().getChildCount(cell) > 0) {
     *         let geo = cell.getGeometry();
     *
     *         if (geo) {
     *           const children = graph.getChildCells(cell, true, true);
     *           const bounds = graph.getBoundingBoxFromGeometry(children, true);
     *
     *           geo = geo.clone();
     *           geo.width = Math.max(geo.width, bounds.width);
     *           geo.height = Math.max(geo.height, bounds.height);
     *
     *           graph.getDataModel().setGeometry(cell, geo);
     *         }
     *       }
     *     }
     *   }
     * });
     * ```
     *
     * @param cells Array of {@link Cell} whose bounds should be changed.
     * @param bounds Array of {@link Rectangle}s that represent the new bounds.
     * @param recurse Optional boolean that specifies if the children should be resized. Default is `false`.
     */
    cellsResized: (cells: Cell[], bounds: Rectangle[], recurse: boolean) => void;

    /**
     * Resizes the parents recursively so that they contain the complete area of the resized child cell.
     *
     * @param cell {@link Cell} whose bounds should be changed.
     * @param bounds {@link Rectangle}s that represent the new bounds.
     * @param ignoreRelative Boolean that indicates if relative cells should be ignored. Default is `false`.
     * @param recurse Optional boolean that specifies if the children should be resized. Default is `false`.
     */
    cellResized: (
      cell: Cell,
      bounds: Rectangle,
      ignoreRelative: boolean,
      recurse: boolean
    ) => Geometry | null;

    /**
     * Resizes the child cells of the given cell for the given new geometry with respect to the current geometry of the cell.
     *
     * @param cell {@link Cell} that has been resized.
     * @param newGeo {@link Geometry} that represents the new bounds.
     */
    resizeChildCells: (cell: Cell, newGeo: Geometry) => void;

    /**
     * Constrains the children of the given cell using {@link constrainChild}.
     *
     * @param cell {@link Cell} that has been resized.
     */
    constrainChildCells: (cell: Cell) => void;

    /**
     * Scales the points, position and size of the given cell according to the given vertical and horizontal scaling factors.
     *
     * @param cell {@link Cell} whose geometry should be scaled.
     * @param dx Horizontal scaling factor.
     * @param dy Vertical scaling factor.
     * @param recurse Boolean indicating if the child cells should be scaled. Default is `false`.
     */
    scaleCell: (cell: Cell, dx: number, dy: number, recurse: boolean) => void;

    /**
     * Resizes the parents recursively so that they contain the complete area of the resized child cell.
     *
     * @param cell {@link Cell} that has been resized.
     */
    extendParent: (cell: Cell) => void;

    /**
     * Clones and inserts the given cells into the graph using the move method and returns the inserted cells. This shortcut
     * is used if cells are inserted via data transfer.
     *
     * @param cells Array of {@link Cell} to be imported.
     * @param dx Integer that specifies the x-coordinate of the vector. Default is `0`.
     * @param dy Integer that specifies the y-coordinate of the vector. Default is `0`.
     * @param target {@link Cell} that represents the new parent of the cells.
     * @param evt {@link MouseEvent} that triggered the invocation.
     * @param mapping Optional mapping for existing clones.
     * @returns the cells that were imported.
     */
    importCells: (
      cells: Cell[],
      dx?: number,
      dy?: number,
      target?: Cell | null,
      evt?: MouseEvent | null,
      mapping?: any
    ) => Cell[];

    /**
     * Moves or clones the specified cells and moves the cells or clones by the given amount, adding them to the optional
     * target cell. The `evt` is the mouse event as the mouse was released. The change is carried out using {@link cellsMoved}.
     * This method fires {@link Event#MOVE_CELLS} while the transaction is in progress.
     *
     * Use the following code to move all cells in the graph.
     *
     * ```javascript
     * graph.moveCells(graph.getChildCells(null, true, true), 10, 10);
     * ```
     *
     * @param cells Array of {@link Cell} to be moved, cloned or added to the target.
     * @param dx Integer that specifies the x-coordinate of the vector. Default is `0`.
     * @param dy Integer that specifies the y-coordinate of the vector. Default is `0`.
     * @param clone Boolean indicating if the cells should be cloned. Default is `false`.
     * @param target {@link Cell} that represents the new parent of the cells.
     * @param evt {@link MouseEvent} that triggered the invocation.
     * @param mapping Optional mapping for existing clones.
     * @returns the cells that were moved.
     */
    moveCells: (
      cells: Cell[],
      dx?: number,
      dy?: number,
      clone?: boolean,
      target?: Cell | null,
      evt?: MouseEvent | null,
      mapping?: any
    ) => Cell[];

    /**
     * Moves the specified cells by the given vector, disconnecting the cells using disconnectGraph is disconnect is true.
     *
     * This method fires {@link InternalEvent.CELLS_MOVED} while the transaction is in progress.
     */
    cellsMoved: (
      cells: Cell[],
      dx: number,
      dy: number,
      disconnect: boolean,
      constrain: boolean,
      extend?: boolean | null
    ) => void;

    /**
     * Translates the geometry of the given cell and stores the new, translated geometry in the model as an atomic change.
     */
    translateCell: (cell: Cell, dx: number, dy: number) => void;

    /**
     * Returns the {@link Rectangle} inside which a cell is to be kept.
     *
     * @param cell {@link Cell} for which the area should be returned.
     */
    getCellContainmentArea: (cell: Cell) => Rectangle | null;

    /**
     * Keeps the given cell inside the bounds returned by {@link getCellContainmentArea} for its parent,
     * according to the rules defined by {@link getOverlap} and {@link isConstrainChild}.
     *
     * This modifies the cell's geometry in-place and does not clone it.
     *
     * @param cell {@link Cell} which should be constrained.
     * @param sizeFirst Specifies if the size should be changed first. Default is `true`.
     */
    constrainChild: (cell: Cell, sizeFirst?: boolean) => void;

    /**
     * Returns the visible child vertices or edges in the given parent.
     *
     * If vertices and edges is `false`, then all children are returned.
     *
     * @param parent {@link Cell} whose children should be returned.
     * @param vertices Optional boolean that specifies if child vertices should be returned. Default is `false`.
     * @param edges Optional boolean that specifies if child edges should be returned. Default is `false`.
     */
    getChildCells: (parent?: Cell | null, vertices?: boolean, edges?: boolean) => Cell[];

    /**
     * Returns the bottom-most cell that intersects the given point (x, y) in the cell hierarchy starting at the given parent.
     *
     * This will also return swimlanes if the given location intersects the content area of the swimlane.
     * If this is not desired, then the {@link hitsSwimlaneContent} may be used if the returned cell is a swimlane
     * to determine if the location is inside the content area or on the actual title of the swimlane.
     *
     * @param x X-coordinate of the location to be checked.
     * @param y Y-coordinate of the location to be checked.
     * @param parent {@link Cell} that should be used as the root of the recursion. Default is current root of the view or the root of the model.
     * @param vertices Optional boolean indicating if vertices should be returned. Default is `true`.
     * @param edges Optional boolean indicating if edges should be returned. Default is `true`.
     * @param ignoreFn Optional function that returns true if cell should be ignored. The function is passed the cell state and the x and y parameter. Default is `null`.
     */
    getCellAt: (
      x: number,
      y: number,
      parent?: Cell | null,
      vertices?: boolean | null,
      edges?: boolean | null,
      ignoreFn?: Function | null
    ) => Cell | null;

    /**
     * Returns the child vertices and edges of the given parent that are contained in the given rectangle.
     *
     * The result is added to the optional result array, which is returned.
     * If no result array is specified then a new array is created and returned.
     *
     * @param x X-coordinate of the rectangle.
     * @param y Y-coordinate of the rectangle.
     * @param width Width of the rectangle.
     * @param height Height of the rectangle.
     * @param parent {@link Cell} that should be used as the root of the recursion. Default is current root of the view or the root of the model.
     * @param result Optional array to store the result in. Default is an empty Array.
     * @param intersection Default is `null`.
     * @param ignoreFn Default is `null`.
     * @param includeDescendants Default is `false`.
     */
    getCells: (
      x: number,
      y: number,
      width: number,
      height: number,
      parent?: Cell | null,
      result?: Cell[],
      intersection?: Rectangle | null,
      ignoreFn?: Function | null,
      includeDescendants?: boolean
    ) => Cell[];

    /**
     * Returns the children of the given parent that are contained in the half-pane from the given point (x0, y0) rightwards or downwards
     * depending on `rightHalfpane` and `bottomHalfpane`.
     *
     * @param x0 X-coordinate of the origin.
     * @param y0 Y-coordinate of the origin.
     * @param parent Optional {@link Cell} whose children should be checked. Default is <defaultParent>.
     * @param rightHalfpane Boolean indicating if the cells in the right halfpane from the origin should be returned. Default is `false`.
     * @param bottomHalfpane Boolean indicating if the cells in the bottom halfpane from the origin should be returned. Default is `false`.
     */
    getCellsBeyond: (
      x0: number,
      y0: number,
      parent: Cell | null,
      rightHalfpane: boolean,
      bottomHalfpane: boolean
    ) => Cell[];

    /**
     * Returns the bottom-most cell that intersects the given point (x, y) in the cell hierarchy that starts at the given parent.
     *
     * @param state {@link CellState} that represents the cell state.
     * @param x X-coordinate of the location to be checked.
     * @param y Y-coordinate of the location to be checked.
     */
    intersects: (state: CellState, x: number, y: number) => boolean;

    /**
     * Returns whether the specified parent is a valid ancestor of the specified cell,
     * either direct or indirectly based on whether ancestor recursion is enabled.
     *
     * @param cell {@link Cell} the possible child cell
     * @param parent {@link Cell} the possible parent cell
     * @param recurse boolean whether to recurse the child ancestors. Default is `false`.
     */
    isValidAncestor: (cell: Cell | null, parent: Cell, recurse?: boolean) => boolean;

    /**
     * Returns `true` if the given cell may not be moved, sized, bended, disconnected, edited or selected.
     *
     * This implementation returns `true` for all vertices with a relative geometry if {@link locked} is `false`.
     *
     * @param cell {@link Cell} whose locked state should be returned.
     */
    isCellLocked: (cell: Cell) => boolean;

    isCellsLocked: () => boolean;

    /**
     * Sets if any cell may be moved, sized, bended, disconnected, edited or selected.
     *
     * @param value Boolean that defines the new value for {@link cellsLocked}.
     */
    setCellsLocked: (value: boolean) => void;

    /**
     * Returns the cells which may be exported in the given array of cells.
     */
    getCloneableCells: (cells: Cell[]) => Cell[];

    /**
     * Returns true if the given cell is cloneable.
     *
     * This implementation returns {@link isCellsCloneable} for all cells unless a cell style specifies {@link CellStateStyle.cloneable} to be `false`.
     *
     * @param cell Optional {@link Cell} whose cloneable state should be returned.
     */
    isCellCloneable: (cell: Cell) => boolean;

    /**
     * Returns {@link cellsCloneable}, that is, if the graph allows cloning of cells by using control-drag.
     */
    isCellsCloneable: () => boolean;

    /**
     * Specifies if the graph should allow cloning of cells by holding down the control key while cells are being moved.
     *
     * This implementation updates {@link cellsCloneable}.
     *
     * @param value Boolean indicating if the graph should be cloneable.
     */
    setCellsCloneable: (value: boolean) => void;

    /**
     * Returns the cells which may be exported in the given array of cells.
     */
    getExportableCells: (cells: Cell[]) => Cell[];

    /**
     * Returns true if the given cell may be exported to the clipboard.
     *
     * This implementation returns {@link exportEnabled} for all cells.
     *
     * @param cell {@link Cell} that represents the cell to be exported.
     */
    canExportCell: (cell: Cell | null) => boolean;

    /**
     * Returns the cells which may be imported in the given array of cells.
     */
    getImportableCells: (cells: Cell[]) => Cell[];

    /**
     * Returns true if the given cell may be imported from the clipboard.
     *
     * This implementation returns {@link importEnabled} for all cells.
     *
     * @param cell {@link Cell} that represents the cell to be imported.
     */
    canImportCell: (cell: Cell | null) => boolean;

    /**
     * Returns true if the given cell is selectable.
     *
     * This implementation returns {@link cellsSelectable}.
     *
     * To add a new style for making cells (un)selectable, use the following code.
     *
     * ```javascript
     * isCellSelectable(cell) {
     *   const style = this.getCurrentCellStyle(cell);
     *   return this.isCellsSelectable() && !this.isCellLocked(cell) && style.selectable ?? true;
     * };
     * ```
     *
     * You can then use the new style as shown in this example.
     *
     * ```javascript
     * graph.insertVertex({
     *   parent,
     *   value: 'Hello,',
     *   position: [20, 20],
     *   size: [80, 30],
     *   style: {
     *     selectable: false,
     *   },
     * });
     * ```
     *
     * @param cell {@link Cell} whose selectable state should be returned.
     */
    isCellSelectable: (cell: Cell) => boolean;

    /**
     * Returns {@link cellsSelectable}.
     */
    isCellsSelectable: () => boolean;

    /**
     * Sets {@link cellsSelectable}.
     */
    setCellsSelectable: (value: boolean) => void;

    /**
     * Returns the cells which may be exported in the given array of cells.
     */
    getDeletableCells: (cells: Cell[]) => Cell[];

    /**
     * Returns `true` if the given cell is deletable.
     *
     * @param cell {@link Cell} whose deletable state should be returned.
     * @returns {@link cellsDeletable} for all given cells if a cells style does not specify {@link CellStateStyle.deletable} to be `false`.
     */
    isCellDeletable: (cell: Cell) => boolean;

    /**
     * Returns {@link cellsDeletable}.
     */
    isCellsDeletable: () => boolean;

    /**
     * Sets {@link cellsDeletable}.
     *
     * @param value Boolean indicating if the graph should allow deletion of cells.
     */
    setCellsDeletable: (value: boolean) => void;

    /**
     * Returns `true` if the given cell is rotatable.
     *
     * This returns `true` for the given cell if its style does not specify {@link CellStateStyle.rotatable} to be `false`.
     *
     * @param cell {@link Cell} whose rotatable state should be returned.
     */
    isCellRotatable: (cell: Cell) => boolean;

    /**
     * Returns the cells which are movable in the given array of cells.
     */
    getMovableCells: (cells: Cell[]) => Cell[];

    /**
     * Returns `true` if the given cell is movable.
     *
     * This returns {@link cellsMovable} for all given cells if {@link isCellLocked} does not return `true` for the given cell,
     * and its style does not specify {@link CellStateStyle.movable} to be `false`.
     *
     * @param cell {@link Cell} whose movable state should be returned.
     */
    isCellMovable: (cell: Cell) => boolean;

    /**
     * Returns {@link cellsMovable}.
     */
    isCellsMovable: () => boolean;

    /**
     * Specifies if the graph should allow moving of cells.
     *
     * This implementation updates {@link cellsMovable}.
     *
     * @param value Boolean indicating if the graph should allow moving of cells.
     */
    setCellsMovable: (value: boolean) => void;

    /**
     * Returns true if the given cell is resizable.
     *
     * This returns {@link cellsResizable} for all given cells if {@link isCellLocked} does not return `true` for the given cell
     * and its style does not specify {@link 'resizable'} to be `false`.
     *
     * @param cell {@link Cell} whose resizable state should be returned.
     */
    isCellResizable: (cell: Cell) => boolean;

    /**
     * Returns {@link cellsResizable}.
     */
    isCellsResizable: () => boolean;

    /**
     * Specifies if the graph should allow resizing of cells. This implementation updates {@link cellsResizable}.
     *
     * @param value Boolean indicating if the graph should allow resizing of cells.
     */
    setCellsResizable: (value: boolean) => void;

    /**
     * Returns true if the given cell is bendable.
     *
     * This returns {@link cellsBendable} for all given cells if {@link cellsLocked} does not return `true` for the given cell
     * and its style does not specify {@link CellStateStyle.bendable} to be `false`.
     *
     * @param cell {@link Cell} whose bendable state should be returned.
     */
    isCellBendable: (cell: Cell) => boolean;

    /**
     * Returns {@link cellsBendable}.
     */
    isCellsBendable: () => boolean;

    /**
     * Specifies if the graph should allow bending of edges.
     *
     * This implementation updates {@link cellsBendable}.
     *
     * @param value Boolean indicating if the graph should allow bending of edges.
     */
    setCellsBendable: (value: boolean) => void;

    /**
     * Returns true if the size of the given cell should automatically be updated after a change of the label.
     *
     * This implementation returns {@link autoSizeCells} or checks if the cell style does specify {@link CellStateStyle.autoSize} to be `true`.
     *
     * @param cell {@link Cell} that should be resized.
     */
    isAutoSizeCell: (cell: Cell) => boolean;

    /**
     * Returns {@link autoSizeCells}.
     */
    isAutoSizeCells: () => boolean;

    /**
     * Specifies if cell sizes should be automatically updated after a label change.
     *
     * This implementation sets {@link autoSizeCells} to the given parameter.
     *
     * To update the size of cells when the cells are added, set {@link autoSizeCellsOnAdd} to `true`.
     *
     * @param value Boolean indicating if cells should be resized automatically.
     */
    setAutoSizeCells: (value: boolean) => void;

    /**
     * Returns true if the parent of the given cell should be extended if the child has been resized so that it overlaps the parent.
     *
     * This implementation returns {@link isExtendParents} if the cell is not an edge.
     *
     * @param cell {@link Cell} that has been resized.
     */
    isExtendParent: (cell: Cell) => boolean;

    /**
     * Returns {@link extendParents}.
     */
    isExtendParents: () => boolean;

    /**
     * Sets {@link extendParents}.
     *
     * @param value New boolean value for {@link extendParents}.
     */
    setExtendParents: (value: boolean) => void;

    /**
     * Returns {@link extendParentsOnAdd}.
     */
    isExtendParentsOnAdd: (cell: Cell) => boolean;

    /**
     * Sets {@link extendParentsOnAdd}.
     *
     * @param value New boolean value for {@link extendParentsOnAdd}.
     */
    setExtendParentsOnAdd: (value: boolean) => void;

    /**
     * Returns {@link extendParentsOnMove}.
     */
    isExtendParentsOnMove: () => boolean;

    /**
     * Sets {@link extendParentsOnMove}.
     *
     * @param value New boolean value for {@link extendParentsOnAdd}.
     */
    setExtendParentsOnMove: (value: boolean) => void;

    /**
     * Returns the cursor value to be used for the CSS of the shape for the given cell.
     *
     * This implementation returns `null`.
     *
     * @param cell {@link Cell} whose cursor should be returned.
     */
    getCursorForCell: (cell: Cell) => string | null;

    /**
     * Returns the scaled, translated bounds for the given cell. See {@link GraphView.getBounds} for arrays.
     *
     * @param cell {@link Cell} whose bounds should be returned.
     * @param includeEdges Optional boolean that specifies if the bounds of the connected edges should be included. Default is `false`.
     * @param includeDescendants Optional boolean that specifies if the bounds of all descendants should be included. Default is `false`.
     */
    getCellBounds: (
      cell: Cell,
      includeEdges?: boolean,
      includeDescendants?: boolean
    ) => Rectangle | null;

    /**
     * Returns the bounding box for the geometries of the vertices in the
     * given array of cells. This can be used to find the graph bounds during
     * a layout operation (ie. before the last endUpdate) as follows:
     *
     * ```javascript
     * var cells = graph.getChildCells(graph.getDefaultParent(), true, true);
     * var bounds = graph.getBoundingBoxFromGeometry(cells, true);
     * ```
     *
     * This can then be used to move cells to the origin:
     *
     * ```javascript
     * if (bounds.x < 0 || bounds.y < 0)
     * {
     *   graph.moveCells(cells, -Math.min(bounds.x, 0), -Math.min(bounds.y, 0))
     * }
     * ```
     *
     * Or to translate the graph view:
     *
     * ```javascript
     * if (bounds.x < 0 || bounds.y < 0)
     * {
     *   getView().setTranslate(-Math.min(bounds.x, 0), -Math.min(bounds.y, 0));
     * }
     * ```
     *
     * @param cells Array of {@link Cell} whose bounds should be returned.
     * @param includeEdges Specifies if edge bounds should be included by computing the bounding box for all points in geometry. Default is `false`.
     */
    getBoundingBoxFromGeometry: (
      cells: Cell[],
      includeEdges?: boolean
    ) => Rectangle | null;
  }
}
