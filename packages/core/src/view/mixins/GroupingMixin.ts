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

import Cell from '../cell/Cell';
import { sortCells } from '../../util/styleUtils';
import Geometry from '../geometry/Geometry';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import Rectangle from '../geometry/Rectangle';
import type Point from '../geometry/Point';
import type { Graph } from '../Graph';

type PartialGraph = Pick<
  Graph,
  | 'getDataModel'
  | 'fireEvent'
  | 'getView'
  | 'getDefaultParent'
  | 'batchUpdate'
  | 'isValidRoot'
  | 'getCurrentRoot'
  | 'cellsAdded'
  | 'cellsMoved'
  | 'cellsResized'
  | 'getBoundingBoxFromGeometry'
  | 'cellsRemoved'
  | 'getChildCells'
  | 'moveCells'
  | 'addAllEdges'
  | 'getSelectionCells'
  | 'getSelectionCell'
  | 'clearSelection'
  | 'setSelectionCell'
  | 'isSwimlane'
  | 'getStartSize'
  | 'getActualStartSize'
>;
type PartialGrouping = Pick<
  Graph,
  | 'groupCells'
  | 'getCellsForGroup'
  | 'getBoundsForGroup'
  | 'createGroupCell'
  | 'ungroupCells'
  | 'getCellsForUngroup'
  | 'removeCellsAfterUngroup'
  | 'removeCellsFromParent'
  | 'updateGroupBounds'
  | 'enterGroup'
  | 'exitGroup'
>;
type PartialType = PartialGraph & PartialGrouping;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const GroupingMixin: PartialType = {
  groupCells(group, border = 0, cells) {
    if (!cells) cells = sortCells(this.getSelectionCells(), true);
    if (!cells) cells = this.getCellsForGroup(cells);

    if (group == null) {
      group = this.createGroupCell(cells);
    }

    const bounds = this.getBoundsForGroup(group, cells, border);

    if (cells.length > 1 && bounds != null) {
      // Uses parent of group or previous parent of first child
      let parent = group.getParent();

      if (parent == null) {
        parent = <Cell>cells[0].getParent();
      }

      this.batchUpdate(() => {
        // Checks if the group has a geometry and
        // creates one if one does not exist
        if (group.getGeometry() == null) {
          this.getDataModel().setGeometry(group, new Geometry());
        }

        // Adds the group into the parent
        let index = (<Cell>parent).getChildCount();
        this.cellsAdded([group], <Cell>parent, index, null, null, false, false, false);

        // Adds the children into the group and moves
        index = group.getChildCount();
        this.cellsAdded(<Cell[]>cells, group, index, null, null, false, false, false);
        this.cellsMoved(<Cell[]>cells, -bounds.x, -bounds.y, false, false, false);

        // Resizes the group
        this.cellsResized([group], [bounds], false);

        this.fireEvent(
          new EventObject(InternalEvent.GROUP_CELLS, { group, border, cells })
        );
      });
    }
    return group;
  },

  getCellsForGroup(cells) {
    const result = [];
    if (cells != null && cells.length > 0) {
      const parent = cells[0].getParent();
      result.push(cells[0]);

      // Filters selection cells with the same parent
      for (let i = 1; i < cells.length; i += 1) {
        if (cells[i].getParent() === parent) {
          result.push(cells[i]);
        }
      }
    }
    return result;
  },

  getBoundsForGroup(group, children, border) {
    const result = this.getBoundingBoxFromGeometry(children, true);
    if (result != null) {
      if (this.isSwimlane(group)) {
        const size = this.getStartSize(group);

        result.x -= size.width;
        result.y -= size.height;
        result.width += size.width;
        result.height += size.height;
      }

      // Adds the border
      if (border != null) {
        result.x -= border;
        result.y -= border;
        result.width += 2 * border;
        result.height += 2 * border;
      }
    }
    return result;
  },

  createGroupCell(cells) {
    const group = new Cell('');
    group.setVertex(true);
    group.setConnectable(false);

    return group;
  },

  ungroupCells(cells) {
    let result: Cell[] = [];

    if (cells == null) {
      cells = this.getCellsForUngroup();
    }

    if (cells != null && cells.length > 0) {
      this.batchUpdate(() => {
        const _cells = <Cell[]>cells;

        for (let i = 0; i < _cells.length; i += 1) {
          let children = _cells[i].getChildren();

          if (children != null && children.length > 0) {
            children = children.slice();
            const parent = <Cell>_cells[i].getParent();
            const index = parent.getChildCount();

            this.cellsAdded(children, parent, index, null, null, true);
            result = result.concat(children);

            // Fix relative child cells
            for (const child of children) {
              const state = this.getView().getState(child);
              let geo = child.getGeometry();

              if (state != null && geo != null && geo.relative) {
                geo = <Geometry>geo.clone();
                geo.x = (<Point>state.origin).x;
                geo.y = (<Point>state.origin).y;
                geo.relative = false;

                this.getDataModel().setGeometry(child, geo);
              }
            }
          }
        }

        this.removeCellsAfterUngroup(_cells);
        this.fireEvent(new EventObject(InternalEvent.UNGROUP_CELLS, { cells }));
      });
    }
    return result;
  },

  getCellsForUngroup() {
    const cells = this.getSelectionCells();

    // Finds the cells with children
    const tmp = [];

    for (let i = 0; i < cells.length; i += 1) {
      if (cells[i].isVertex() && cells[i].getChildCount() > 0) {
        tmp.push(cells[i]);
      }
    }
    return tmp;
  },

  removeCellsAfterUngroup(cells) {
    this.cellsRemoved(this.addAllEdges(cells));
  },

  removeCellsFromParent(cells) {
    if (cells == null) {
      cells = this.getSelectionCells();
    }
    this.batchUpdate(() => {
      const parent = this.getDefaultParent();
      const index = parent.getChildCount();

      this.cellsAdded(<Cell[]>cells, parent, index, null, null, true);
      this.fireEvent(new EventObject(InternalEvent.REMOVE_CELLS_FROM_PARENT, { cells }));
    });
    return cells;
  },

  updateGroupBounds(
    cells,
    border = 0,
    moveGroup = false,
    topBorder = 0,
    rightBorder = 0,
    bottomBorder = 0,
    leftBorder = 0
  ) {
    if (cells == null) {
      cells = this.getSelectionCells();
    }

    border = border != null ? border : 0;
    moveGroup = moveGroup != null ? moveGroup : false;
    topBorder = topBorder != null ? topBorder : 0;
    rightBorder = rightBorder != null ? rightBorder : 0;
    bottomBorder = bottomBorder != null ? bottomBorder : 0;
    leftBorder = leftBorder != null ? leftBorder : 0;

    this.batchUpdate(() => {
      for (let i = cells.length - 1; i >= 0; i--) {
        let geo = cells[i].getGeometry();
        if (geo == null) {
          continue;
        }

        const children = this.getChildCells(cells[i]);
        if (children != null && children.length > 0) {
          const bounds = this.getBoundingBoxFromGeometry(children, true);

          if (bounds != null && bounds.width > 0 && bounds.height > 0) {
            // Adds the size of the title area for swimlanes
            const size = <Rectangle>(
              (this.isSwimlane(cells[i])
                ? this.getActualStartSize(cells[i], true)
                : new Rectangle())
            );
            geo = <Geometry>geo.clone();

            if (moveGroup) {
              geo.x = Math.round(geo.x + bounds.x - border - size.x - leftBorder);
              geo.y = Math.round(geo.y + bounds.y - border - size.y - topBorder);
            }

            geo.width = Math.round(
              bounds.width + 2 * border + size.x + leftBorder + rightBorder + size.width
            );
            geo.height = Math.round(
              bounds.height + 2 * border + size.y + topBorder + bottomBorder + size.height
            );

            this.getDataModel().setGeometry(cells[i], geo);
            this.moveCells(
              children,
              border + size.x - bounds.x + leftBorder,
              border + size.y - bounds.y + topBorder
            );
          }
        }
      }
    });
    return cells;
  },

  /*****************************************************************************
   * Group: Drilldown
   *****************************************************************************/

  enterGroup(cell) {
    cell = cell || this.getSelectionCell();

    if (cell != null && this.isValidRoot(cell)) {
      this.getView().setCurrentRoot(cell);
      this.clearSelection();
    }
  },

  exitGroup() {
    const root = this.getDataModel().getRoot();
    const current = this.getCurrentRoot();

    if (current != null) {
      let next = current.getParent() as Cell;

      // Finds the next valid root in the hierarchy
      while (next !== root && !this.isValidRoot(next) && next.getParent() !== root) {
        next = <Cell>next.getParent();
      }

      // Clears the current root if the new root is
      // the model's root or one of the layers.
      if (next === root || next.getParent() === root) {
        this.getView().setCurrentRoot(null);
      } else {
        this.getView().setCurrentRoot(next);
      }

      const state = this.getView().getState(current);

      // Selects the previous root in the graph
      if (state != null) {
        this.setSelectionCell(current);
      }
    }
  },
};
