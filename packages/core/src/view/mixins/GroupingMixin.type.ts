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
import type Rectangle from '../geometry/Rectangle';

declare module '../Graph' {
  interface Graph {
    /**
     * Adds the cells into the given group.
     * The change is carried out using {@link cellsAdded}, {@link cellsMoved} and {@link cellsResized}.
     *
     * This method fires {@link InternalEvent.GROUP_CELLS} while the transaction is in progress.
     *
     * @param group {@link Cell} that represents the target group. If `null` is specified then a new group is created using {@link createGroupCell}.
     * @param border Optional integer that specifies the border between the child area and the group bounds. Default is `0`.
     * @param cells Optional array of {@link Cell} to be grouped. If `null` is specified then the selection cells are used.
     * @returns the new group. A group is only created if there is at least one entry in the given array of cells.
     */
    groupCells: (group: Cell, border: number, cells?: Cell[] | null) => Cell;

    /**
     * Returns the cells with the same parent as the first cell in the given array.
     */
    getCellsForGroup: (cells: Cell[]) => Cell[];

    /**
     * Returns the bounds to be used for the given group and children.
     */
    getBoundsForGroup: (
      group: Cell,
      children: Cell[],
      border: number | null
    ) => Rectangle | null;

    /**
     * Hook for creating the group cell to hold the given array of {@link Cell} if no group cell was given to the {@link group} function.
     *
     * The following code can be used to set the style of new group cells.
     *
     * ```javascript
     * const graphCreateGroupCell = graph.createGroupCell;
     * graph.createGroupCell = function(cells) {
     *   const group = graphCreateGroupCell.apply(this, arguments);
     *   group.setStyle('group');
     *
     *   return group;
     * };
     */
    createGroupCell: (cells: Cell[]) => Cell;

    /**
     * Ungroups the given cells by moving the children to their parents parent and removing the empty groups.
     *
     * @param cells Array of cells to be ungrouped. If `null` is specified then the selection cells are used.
     * @returns the children that have been removed from the groups.
     */
    ungroupCells: (cells?: Cell[] | null) => Cell[];

    /**
     * Returns the selection cells that can be ungrouped.
     */
    getCellsForUngroup: () => Cell[];

    /**
     * Hook to remove the groups after {@link ungroupCells}.
     *
     * @param cells Array of {@link Cell} that were ungrouped.
     */
    removeCellsAfterUngroup: (cells: Cell[]) => void;

    /**
     * Removes the specified cells from their parents and adds them to the default parent.
     *
     * @param cells Array of {@link Cell} to be removed from their parents.
     * @returns the cells that were removed from their parents.
     */
    removeCellsFromParent: (cells?: Cell[] | null) => Cell[];

    /**
     * Updates the bounds of the given groups to include all children and returns the passed-in cells.
     *
     * Call this with the groups in parent to child order, top-most group first, the cells are processed in reverse order and cells with no children are ignored.
     *
     * @param cells The groups whose bounds should be updated. If this is `null`, then the selection cells are used.
     * @param border Optional border to be added in the group. Default is `0`.
     * @param moveGroup Optional boolean that allows the group to be moved. Default is `false`.
     * @param topBorder Optional top border to be added in the group. Default is `0`.
     * @param rightBorder Optional top border to be added in the group. Default is `0`.
     * @param bottomBorder Optional top border to be added in the group. Default is `0`.
     * @param leftBorder Optional top border to be added in the group. Default is `0`.
     */
    updateGroupBounds: (
      cells: Cell[],
      border?: number,
      moveGroup?: boolean,
      topBorder?: number,
      rightBorder?: number,
      bottomBorder?: number,
      leftBorder?: number
    ) => Cell[];

    /**
     * Uses the given cell as the root of the displayed cell hierarchy. If no cell is specified then the selection cell is used.
     *
     * The cell is only used if {@link isValidRoot} returns `true`.
     *
     * @param cell Optional {@link Cell} to be used as the new root. Default is the selection cell.
     */
    enterGroup: (cell: Cell) => void;

    /**
     * Changes the current root to the next valid root in the displayed cell hierarchy.
     */
    exitGroup: () => void;
  }
}
