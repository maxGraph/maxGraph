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

import Cell from '../cell/Cell.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
import Geometry from '../geometry/Geometry.js';
import { toRadians } from '../../util/mathUtils.js';
import Rectangle from '../geometry/Rectangle.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import { isI18nEnabled } from '../../internal/i18n-utils.js';

type PartialGraph = Pick<
  AbstractGraph,
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
  | 'options'
>;
type PartialFolding = Pick<
  AbstractGraph,
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
export const FoldingMixin: PartialType = {
  collapseExpandResource: isI18nEnabled() ? 'collapse-expand' : '',

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

  isCellFoldable(cell, _collapse?: boolean): boolean {
    return cell.getChildCount() > 0 && (this.getCurrentCellStyle(cell).foldable ?? true);
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

  updateAlternateBounds(cell = null, geo = null, _willCollapse = false) {
    if (cell != null && geo != null) {
      const style = this.getCurrentCellStyle(cell);

      if (geo.alternateBounds == null) {
        let bounds = geo;

        if (this.options.collapseToPreferredSize) {
          const tmp = this.getPreferredSizeForCell(cell);

          if (tmp != null) {
            bounds = <Geometry>tmp;

            const startSize = style.startSize ?? 0;
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
