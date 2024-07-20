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

import Rectangle from '../geometry/Rectangle';
import { convertPoint } from '../../util/styleUtils';
import { mod } from '../../util/mathUtils';
import { DEFAULT_STARTSIZE, DIRECTION, SHAPE } from '../../util/Constants';
import { getClientX, getClientY } from '../../util/EventUtils';
import type { Graph } from '../Graph';
import type { DirectionValue } from '../../types';

type PartialGraph = Pick<
  Graph,
  | 'getDefaultParent'
  | 'getCurrentRoot'
  | 'getDataModel'
  | 'getView'
  | 'getContainer'
  | 'getCurrentCellStyle'
  | 'intersects'
  | 'isSplitEnabled'
  | 'isSplitTarget'
  | 'getPanDx'
  | 'getPanDy'
>;
type PartialSwimlane = Pick<
  Graph,
  | 'swimlaneSelectionEnabled'
  | 'swimlaneNesting'
  | 'swimlaneIndicatorColorAttribute'
  | 'getSwimlane'
  | 'getSwimlaneAt'
  | 'hitsSwimlaneContent'
  | 'getStartSize'
  | 'getSwimlaneDirection'
  | 'getActualStartSize'
  | 'isSwimlane'
  | 'isValidDropTarget'
  | 'getDropTarget'
  | 'isSwimlaneNesting'
  | 'setSwimlaneNesting'
  | 'isSwimlaneSelectionEnabled'
  | 'setSwimlaneSelectionEnabled'
>;
type PartialType = PartialGraph & PartialSwimlane;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const SwimlaneMixin: PartialType = {
  swimlaneSelectionEnabled: true,

  swimlaneNesting: true,

  swimlaneIndicatorColorAttribute: 'fillColor',

  getSwimlane(cell = null) {
    while (cell && !this.isSwimlane(cell)) {
      cell = cell.getParent();
    }
    return cell;
  },

  getSwimlaneAt(x, y, parent) {
    if (!parent) {
      parent = this.getCurrentRoot();

      if (!parent) {
        parent = this.getDataModel().getRoot();
      }
    }

    if (parent) {
      const childCount = parent.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const child = parent.getChildAt(i);

        if (child) {
          const result = this.getSwimlaneAt(x, y, child);

          if (result != null) {
            return result;
          }
          if (child.isVisible() && this.isSwimlane(child)) {
            const state = this.getView().getState(child);

            if (state && this.intersects(state, x, y)) {
              return child;
            }
          }
        }
      }
    }
    return null;
  },

  hitsSwimlaneContent(swimlane, x, y) {
    const state = this.getView().getState(swimlane);
    const size = this.getStartSize(swimlane);

    if (state) {
      const scale = this.getView().getScale();
      x -= state.x;
      y -= state.y;

      if (size.width > 0 && x > 0 && x > size.width * scale) {
        return true;
      }
      if (size.height > 0 && y > 0 && y > size.height * scale) {
        return true;
      }
    }
    return false;
  },

  getStartSize(swimlane, ignoreState = false) {
    const result = new Rectangle();
    const style = this.getCurrentCellStyle(swimlane, ignoreState);
    const size = style.startSize ?? DEFAULT_STARTSIZE;

    if (style.horizontal ?? true) {
      result.height = size;
    } else {
      result.width = size;
    }
    return result;
  },

  getSwimlaneDirection(style) {
    const dir = style.direction ?? DIRECTION.EAST;
    const flipH = style.flipH;
    const flipV = style.flipV;
    const h = style.horizontal ?? true;
    let n = h ? 0 : 3;

    if (dir === DIRECTION.NORTH) {
      n--;
    } else if (dir === DIRECTION.WEST) {
      n += 2;
    } else if (dir === DIRECTION.SOUTH) {
      n += 1;
    }

    const _mod = mod(n, 2);

    if (flipH && _mod === 1) {
      n += 2;
    }

    if (flipV && _mod === 0) {
      n += 2;
    }

    return [DIRECTION.NORTH, DIRECTION.EAST, DIRECTION.SOUTH, DIRECTION.WEST][
      mod(n, 4)
    ] as DirectionValue;
  },

  getActualStartSize(swimlane, ignoreState = false) {
    const result = new Rectangle();

    if (this.isSwimlane(swimlane, ignoreState)) {
      const style = this.getCurrentCellStyle(swimlane, ignoreState);
      const size = style.startSize ?? DEFAULT_STARTSIZE;
      const dir = this.getSwimlaneDirection(style);

      if (dir === DIRECTION.NORTH) {
        result.y = size;
      } else if (dir === DIRECTION.WEST) {
        result.x = size;
      } else if (dir === DIRECTION.SOUTH) {
        result.height = size;
      } else {
        result.width = size;
      }
    }
    return result;
  },

  isSwimlane(cell, ignoreState = false) {
    if (cell && cell.getParent() !== this.getDataModel().getRoot() && !cell.isEdge()) {
      return this.getCurrentCellStyle(cell, ignoreState).shape === SHAPE.SWIMLANE;
    }
    return false;
  },

  isValidDropTarget(cell, cells, evt) {
    return (
      cell &&
      ((this.isSplitEnabled() && this.isSplitTarget(cell, cells, evt)) ||
        (!cell.isEdge() &&
          (this.isSwimlane(cell) || (cell.getChildCount() > 0 && !cell.isCollapsed()))))
    );
  },

  getDropTarget(cells, evt, cell = null, clone = false) {
    if (!this.isSwimlaneNesting()) {
      for (let i = 0; i < cells.length; i += 1) {
        if (this.isSwimlane(cells[i])) {
          return null;
        }
      }
    }

    const pt = convertPoint(this.getContainer(), getClientX(evt), getClientY(evt));
    pt.x -= this.getPanDx();
    pt.y -= this.getPanDy();
    const swimlane = this.getSwimlaneAt(pt.x, pt.y);

    if (!cell) {
      cell = swimlane;
    } else if (swimlane) {
      // Checks if the cell is an ancestor of the swimlane
      // under the mouse and uses the swimlane in that case
      let tmp = swimlane.getParent();

      while (tmp && this.isSwimlane(tmp) && tmp !== cell) {
        tmp = tmp.getParent();
      }

      if (tmp === cell) {
        cell = swimlane;
      }
    }

    while (
      cell &&
      !this.isValidDropTarget(cell, cells, evt) &&
      !this.getDataModel().isLayer(cell)
    ) {
      cell = cell.getParent();
    }

    // Checks if parent is dropped into child if not cloning
    let parentCell = cell;
    if (!clone) {
      while (parentCell && cells.indexOf(parentCell) < 0) {
        parentCell = parentCell.getParent();
      }
    }

    return !this.getDataModel().isLayer(cell) && !parentCell ? cell : null;
  },

  isSwimlaneNesting() {
    return this.swimlaneNesting;
  },

  setSwimlaneNesting(value) {
    this.swimlaneNesting = value;
  },

  isSwimlaneSelectionEnabled(): boolean {
    return this.swimlaneSelectionEnabled;
  },

  setSwimlaneSelectionEnabled(value) {
    this.swimlaneSelectionEnabled = value;
  },
};
