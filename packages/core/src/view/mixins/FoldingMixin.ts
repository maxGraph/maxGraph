/*
Copyright 2021-present The maxGraph project Contributors

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

import Image from '../image/ImageBox';
import Client from '../../Client';
import CellState from '../cell/CellState';
import Cell from '../cell/Cell';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import Geometry from '../geometry/Geometry';
import { getValue, mixInto } from '../../util/Utils';
import { toRadians } from '../../util/mathUtils';
import Rectangle from '../geometry/Rectangle';
import { Graph } from '../Graph';

declare module '../Graph' {
  interface Graph {
    /** Folding options. */
    options: GraphFoldingOptions;

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
     * Returns the {@link Image} used to display the collapsed state of the specified cell state.
     *
     * This returns `null` for all edges.
     */
    getFoldingImage: (state: CellState) => Image | null;

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

type GraphFoldingOptions = {
  /**
   * Specifies if folding (collapse and expand via an image icon in the graph should be enabled).
   * @default true
   */
  foldingEnabled: boolean;
  /**
   * Specifies the {@link Image} to indicate a collapsed state.
   * @default `Client.imageBasePath + '/collapsed.gif'`
   */
  collapsedImage: Image;
  /**
   * Specifies the {@link Image} to indicate a expanded state.
   * @default `Client.imageBasePath + '/expanded.gif'`
   */
  expandedImage: Image;
  /**
   * Specifies if the cell size should be changed to the preferred size when a cell is first collapsed.
   * @default true
   */
  collapseToPreferredSize: boolean;
};

type PartialGraph = Pick<
  Graph,
  | 'getDataModel'
  | 'fireEvent'
  | 'getCurrentCellStyle'
  | 'isExtendParent'
  | 'extendParent'
  | 'constrainChild'
  | 'getPreferredSizeForCell'
  | 'getSelectionCells'
  | 'stopEditing'
  | 'batchUpdate'
>;
type PartialFolding = Pick<
  Graph,
  | 'options'
  | 'collapseExpandResource'
  | 'getCollapseExpandResource'
  | 'isFoldingEnabled'
  | 'getFoldableCells'
  | 'isCellFoldable'
  | 'getFoldingImage'
  | 'foldCells'
  | 'cellsFolded'
  | 'swapBounds'
  | 'updateAlternateBounds'
>;
type PartialType = PartialGraph & PartialFolding;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const FoldingMixin: PartialType = {
  options: {
    foldingEnabled: true,
    collapsedImage: new Image(`${Client.imageBasePath}/collapsed.gif`, 9, 9),
    expandedImage: new Image(`${Client.imageBasePath}/expanded.gif`, 9, 9),
    collapseToPreferredSize: true,
  },

  collapseExpandResource: Client.language != 'none' ? 'collapse-expand' : '',

  getCollapseExpandResource() {
    return this.collapseExpandResource;
  },

  isFoldingEnabled() {
    return this.options.foldingEnabled;
  },

  getFoldableCells(cells, collapse = false) {
    return this.getDataModel().filterCells(cells, (cell: Cell) => {
      return this.isCellFoldable(cell, collapse);
    });
  },

  isCellFoldable(cell, collapse?: boolean): boolean {
    const style = this.getCurrentCellStyle(cell);
    return cell.getChildCount() > 0 && (style.foldable ?? true);
  },

  getFoldingImage(state) {
    if (state != null && this.isFoldingEnabled() && !state.cell.isEdge()) {
      const tmp = (<Cell>state.cell).isCollapsed();

      if (this.isCellFoldable(state.cell, !tmp)) {
        return tmp ? this.options.collapsedImage : this.options.expandedImage;
      }
    }
    return null;
  },

  foldCells(
    collapse = false,
    recurse = false,
    cells = null,
    checkFoldable = false,
    _evt = null
  ) {
    if (cells == null) {
      cells = this.getFoldableCells(this.getSelectionCells(), collapse);
    }

    this.stopEditing(false);

    this.batchUpdate(() => {
      this.cellsFolded(cells, collapse, recurse, checkFoldable);
      this.fireEvent(
        new EventObject(
          InternalEvent.FOLD_CELLS,
          'collapse',
          collapse,
          'recurse',
          recurse,
          'cells',
          cells
        )
      );
    });
    return cells;
  },

  cellsFolded(cells = null, collapse = false, recurse = false, checkFoldable = false) {
    if (cells != null && cells.length > 0) {
      this.batchUpdate(() => {
        for (let i = 0; i < cells.length; i += 1) {
          if (
            (!checkFoldable || this.isCellFoldable(cells[i], collapse)) &&
            collapse !== cells[i].isCollapsed()
          ) {
            this.getDataModel().setCollapsed(cells[i], collapse);
            this.swapBounds(cells[i], collapse);

            if (this.isExtendParent(cells[i])) {
              this.extendParent(cells[i]);
            }

            if (recurse) {
              const children = cells[i].getChildren();
              this.cellsFolded(children, collapse, recurse);
            }

            this.constrainChild(cells[i]);
          }
        }

        this.fireEvent(
          new EventObject(InternalEvent.CELLS_FOLDED, { cells, collapse, recurse })
        );
      });
    }
  },

  swapBounds(cell, willCollapse = false) {
    let geo = cell.getGeometry();
    if (geo != null) {
      geo = <Geometry>geo.clone();

      this.updateAlternateBounds(cell, geo, willCollapse);
      geo.swap();

      this.getDataModel().setGeometry(cell, geo);
    }
  },

  updateAlternateBounds(cell = null, geo = null, willCollapse = false) {
    if (cell != null && geo != null) {
      const style = this.getCurrentCellStyle(cell);

      if (geo.alternateBounds == null) {
        let bounds = geo;

        if (this.options.collapseToPreferredSize) {
          const tmp = this.getPreferredSizeForCell(cell);

          if (tmp != null) {
            bounds = <Geometry>tmp;

            const startSize = getValue(style, 'startSize');

            if (startSize > 0) {
              bounds.height = Math.max(bounds.height, startSize);
            }
          }
        }

        geo.alternateBounds = new Rectangle(0, 0, bounds.width, bounds.height);
      }

      if (geo.alternateBounds != null) {
        geo.alternateBounds.x = geo.x;
        geo.alternateBounds.y = geo.y;

        const alpha = toRadians(style.rotation || 0);

        if (alpha !== 0) {
          const dx = geo.alternateBounds.getCenterX() - geo.getCenterX();
          const dy = geo.alternateBounds.getCenterY() - geo.getCenterY();

          const cos = Math.cos(alpha);
          const sin = Math.sin(alpha);

          const dx2 = cos * dx - sin * dy;
          const dy2 = sin * dx + cos * dy;

          geo.alternateBounds.x += dx2 - dx;
          geo.alternateBounds.y += dy2 - dy;
        }
      }
    }
  },
};

mixInto(Graph)(FoldingMixin);
