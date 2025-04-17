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
import type CellState from '../cell/CellState';
import type ImageBox from '../image/ImageBox';
import type Geometry from '../geometry/Geometry';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Specifies the resource key for the tooltip on the collapse/expand icon.
     * If the resource for this key does not exist then the value is used as
     * the tooltip.
     * @default 'collapse-expand' is `Client.language` is not 'none'. Else, it is an empty string.
     */
    collapseExpandResource: string;

    getCollapseExpandResource: () => string;

    isFoldingEnabled: () => boolean;

    /**
     * Returns the cells which are movable in the given array of cells.
     */
    getFoldableCells: (cells: Cell[], collapse: boolean) => Cell[] | null;

    /**
     * Returns `true` if the given cell is foldable.
     *
     * The default implementation returns `true` if the cell has at least one child and its style
     * does not specify {@link CellStyle.foldable} to be `false`.
     *
     * @param cell whose foldable state should be returned.
     */
    isCellFoldable: (cell: Cell, collapse: boolean) => boolean;

    /**
     * Returns the {@link ImageBox} used to display the collapsed state of the specified cell state.
     *
     * This returns `null` for all edges.
     */
    getFoldingImage: (state: CellState) => ImageBox | null;

    /**
     * Sets the collapsed state of the specified cells and all descendants if recurse is `true`.
     * The change is carried out using {@link cellsFolded}.
     *
     * This method fires {@link InternalEvent.FOLD_CELLS} while the transaction is in progress.
     *
     * Returns the cells whose collapsed state was changed.
     *
     * @param collapse Boolean indicating the collapsed state to be assigned. Default is `false`.
     * @param recurse Optional boolean indicating if the collapsed state of all descendants should be set. Default is `false`.
     * @param cells Array of {@link Cell} whose collapsed state should be set. If `null` is specified then the foldable selection cells are used. Default is `null`.
     * @param checkFoldable Optional boolean indicating of {@link isCellFoldable} should be checked. Default is `false`.
     * @param evt Optional native event that triggered the invocation. Default is `null`.
     */
    foldCells: (
      collapse: boolean,
      recurse?: boolean,
      cells?: Cell[] | null,
      checkFoldable?: boolean,
      evt?: Event | null
    ) => Cell[] | null;

    /**
     * Sets the collapsed state of the specified cells.
     *
     * This method fires {@link InternalEvent.CELLS_FOLDED} while the transaction is in progress.
     *
     * Returns the cells whose collapsed state was changed.
     *
     * @param cells Array of {@link Cell} whose collapsed state should be set. Default is `null`.
     * @param collapse Boolean indicating the collapsed state to be assigned. Default is `false`.
     * @param recurse Boolean indicating if the collapsed state of all descendants should be set. Default is `false`.
     * @param checkFoldable Optional boolean indicating of {@link isCellFoldable} should be checked. Default is `false`.
     */
    cellsFolded: (
      cells: Cell[] | null,
      collapse: boolean,
      recurse: boolean,
      checkFoldable?: boolean
    ) => void;

    /**
     * Swaps the alternate and the actual bounds in the geometry of the given
     * cell invoking {@link updateAlternateBounds} before carrying out the swap.
     *
     * @param cell {@link Cell} for which the bounds should be swapped.
     * @param willCollapse Boolean indicating if the cell is going to be collapsed. Default is `false`.
     */
    swapBounds: (cell: Cell, willCollapse: boolean) => void;

    /**
     * Updates or sets the alternate bounds in the given geometry for the given cell depending on whether the cell is going to be collapsed.
     *
     * If no alternate bounds are defined in the geometry and {@link collapseToPreferredSize} is `true`,
     * then the preferred size is used for the alternate bounds.
     *
     * The top, left corner is always kept at the same location.
     *
     * @param cell {@link Cell} for which the geometry is being updated. Default is `null`.
     * @param geo {@link Geometry} for which the alternate bounds should be updated. Default is `null`.
     * @param willCollapse Boolean indicating if the cell is going to be collapsed. Default is `false`.
     */
    updateAlternateBounds: (
      cell: Cell | null,
      geo: Geometry | null,
      willCollapse: boolean
    ) => void;
  }
}
