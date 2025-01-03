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

import type Cell from '../cell/Cell';
import type GraphSelectionModel from '../GraphSelectionModel';
import type Rectangle from '../geometry/Rectangle';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    cells: Cell[];
    doneResource: string;
    updatingSelectionResource: string;
    singleSelection: boolean;

    /** @default null */
    selectionModel: any | null;

    /**
     * Returns the {@link GraphSelectionModel} that contains the selection.
     */
    getSelectionModel: () => GraphSelectionModel;

    /**
     * Sets the {@link GraphSelectionModel} that contains the selection.
     */
    setSelectionModel: (selectionModel: GraphSelectionModel) => void;

    /**
     * Returns `true` if the given cell is selected.
     *
     * @param cell {@link Cell} for which the selection state should be returned.
     */
    isCellSelected: (cell: Cell) => boolean;

    /**
     * Returns `true` if the selection is empty.
     */
    isSelectionEmpty: () => boolean;

    /**
     * Clears the selection using {@link GraphSelectionModel.clear}.
     */
    clearSelection: () => void;

    /**
     * Returns the number of selected cells.
     */
    getSelectionCount: () => number;

    /**
     * Returns the first cell from the array of selected {@link Cell}.
     */
    getSelectionCell: () => Cell;

    /**
     * Returns the array of selected {@link Cell}.
     */
    getSelectionCells: () => Cell[];

    /**
     * Sets the selection cell.
     *
     * @param cell {@link Cell} to be selected.
     */
    setSelectionCell: (cell: Cell | null) => void;

    /**
     * Sets the selection cell.
     *
     * @param cells Array of {@link Cell} to be selected.
     */
    setSelectionCells: (cells: Cell[]) => void;

    /**
     * Adds the given cell to the selection.
     *
     * @param cell {@link Cell} to be add to the selection.
     */
    addSelectionCell: (cell: Cell) => void;

    /**
     * Adds the given cells to the selection.
     *
     * @param cells Array of {@link Cell} to be added to the selection.
     */
    addSelectionCells: (cells: Cell[]) => void;

    /**
     * Removes the given cell from the selection.
     *
     * @param cell {@link Cell} to be removed from the selection.
     */
    removeSelectionCell: (cell: Cell) => void;

    /**
     * Removes the given cells from the selection.
     *
     * @param cells Array of {@link Cell} to be removed from the selection.
     */
    removeSelectionCells: (cells: Cell[]) => void;

    /**
     * Selects and returns the cells inside the given rectangle for the specified event.
     *
     * @param rect {@link Rectangle} that represents the region to be selected.
     * @param evt MouseEvent that triggered the selection.
     */
    selectRegion: (rect: Rectangle, evt: MouseEvent) => Cell[];

    /**
     * Selects the next cell.
     */
    selectNextCell: () => void;

    /**
     * Selects the previous cell.
     */
    selectPreviousCell: () => void;

    /**
     * Selects the parent cell.
     */
    selectParentCell: () => void;

    /**
     * Selects the first child cell.
     */
    selectChildCell: () => void;

    /**
     * Selects the next, parent, first child or previous cell, if all arguments are `false`.
     *
     * @param isNext Boolean indicating if the next cell should be selected. Default is `false`.
     * @param isParent Boolean indicating if the parent cell should be selected. Default is `false`.
     * @param isChild Boolean indicating if the first child cell should be selected. Default is `false`.
     */
    selectCell: (isNext?: boolean, isParent?: boolean, isChild?: boolean) => void;

    /**
     * Selects all children of the given parent cell or the children of the default parent if no parent is specified.
     *
     * To select leaf vertices and/or edges use {@link selectCells}.
     *
     * @param parent Optional {@link Cell} whose children should be selected. Default is {@link defaultParent}.
     * @param descendants Optional boolean specifying whether all descendants should be selected. Default is `false`.
     */
    selectAll: (parent?: Cell | null, descendants?: boolean) => void;

    /**
     * Select all vertices inside the given parent or the default parent.
     */
    selectVertices: (parent?: Cell | null, selectGroups?: boolean) => void;

    /**
     * Select all edges inside the given parent or the default parent.
     */
    selectEdges: (parent?: Cell | null) => void;

    /**
     * Selects all vertices and/or edges depending on the given boolean arguments recursively, starting at the given parent or the default parent if no parent is specified.
     *
     * Use {@link selectAll} to select all cells.
     *
     * For vertices, only cells with no children are selected.
     *
     * @param vertices Boolean indicating if vertices should be selected.
     * @param edges Boolean indicating if edges should be selected.
     * @param parent Optional {@link Cell} that acts as the root of the recursion. Default is {@link defaultParent}.
     * @param selectGroups Optional boolean that specifies if groups should be selected. Default is `false`.
     */
    selectCells: (
      vertices: boolean,
      edges: boolean,
      parent?: Cell | null,
      selectGroups?: boolean
    ) => void;

    /**
     * Selects the given cell by either adding it to the selection or replacing the selection depending on whether the given mouse event is a toggle event.
     *
     * @param cell {@link Cell} to be selected.
     * @param evt Optional mouseEvent that triggered the selection.
     */
    selectCellForEvent: (cell: Cell, evt: MouseEvent) => void;

    /**
     * Selects the given cells by either adding them to the selection or replacing the selection depending on whether the given mouse event is a toggle event.
     *
     * @param cells Array of {@link Cell} to be selected.
     * @param evt Optional mouseEvent that triggered the selection.
     */
    selectCellsForEvent: (cells: Cell[], evt: MouseEvent) => void;

    /**
     * Returns `true` if any sibling of the given cell is selected.
     */

    isSiblingSelected: (cell: Cell) => boolean;

    /**
     * Returns the cells to be selected for the given array of changes.
     *
     * @param changes
     * @param ignoreFn Optional function that takes a change and returns true if the change should be ignored.
     */
    getSelectionCellsForChanges: (
      changes: any[],
      ignoreFn?: ((change: any) => boolean) | null
    ) => Cell[];

    /**
     * Removes selection cells that are not in the model from the selection.
     */
    updateSelection: () => void;
  }
}
