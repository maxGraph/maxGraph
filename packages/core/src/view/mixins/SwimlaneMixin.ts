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
import Rectangle from '../geometry/Rectangle';
import { mixInto } from '../../util/Utils';
import { convertPoint } from '../../util/styleUtils';
import { mod } from '../../util/mathUtils';
import { DEFAULT_STARTSIZE, DIRECTION, SHAPE } from '../../util/Constants';
import { getClientX, getClientY } from '../../util/EventUtils';
import { Graph } from '../Graph';

import { CellStateStyle, DirectionValue } from '../../types';

declare module '../Graph' {
  interface Graph {
    /**
     * Specifies if swimlanes should be selectable via the content if the mouse is released.
     * @default true
     */
    swimlaneSelectionEnabled: boolean;

    /**
     * Specifies if nesting of swimlanes is allowed.
     * @default true
     */
    swimlaneNesting: boolean;

    /**
     * The attribute used to find the color for the indicator if the indicator color is set to 'swimlane'.
     * @default {@link 'fillColor'}
     */
    swimlaneIndicatorColorAttribute: string;

    /**
     * Returns the nearest ancestor of the given cell which is a swimlane, or the given cell, if it is itself a swimlane.
     *
     * @param cell {@link Cell} for which the ancestor swimlane should be returned.
     */
    getSwimlane: (cell: Cell | null) => Cell | null;

    /**
     * Returns the bottom-most swimlane that intersects the given point (x, y) in the cell hierarchy that starts at the given parent.
     *
     * @param x X-coordinate of the location to be checked.
     * @param y Y-coordinate of the location to be checked.
     * @param parent {@link mxCell} that should be used as the root of the recursion. Default is {@link defaultParent}.
     */
    getSwimlaneAt: (x: number, y: number, parent?: Cell | null) => Cell | null;

    /**
     * Returns `true` if the given coordinate pair is inside the content are of the given swimlane.
     *
     * @param swimlane {@link Cell} that specifies the swimlane.
     * @param x X-coordinate of the mouse event.
     * @param y Y-coordinate of the mouse event.
     */
    hitsSwimlaneContent: (swimlane: Cell, x: number, y: number) => boolean;

    /**
     * Returns the start size of the given swimlane, that is, the width or height of the part that contains the title, depending on the horizontal style.
     * The return value is an {@link Rectangle} with either width or height set as appropriate.
     *
     * @param swimlane {@link mxCell} whose start size should be returned.
     * @param ignoreState Optional boolean that specifies if cell state should be ignored.
     */
    getStartSize: (swimlane: Cell, ignoreState?: boolean) => Rectangle;

    /**
     * Returns the direction for the given swimlane style.
     */
    getSwimlaneDirection: (style: CellStateStyle) => DirectionValue;

    /**
     * Returns the actual start size of the given swimlane taking into account direction and horizontal and vertical flip styles.
     * The start size is returned as an {@link Rectangle} where top, left, bottom, right start sizes are returned as x, y, height and width, respectively.
     *
     * @param swimlane {@link mxCell} whose start size should be returned.
     * @param ignoreState Optional boolean that specifies if cell state should be ignored.
     */
    getActualStartSize: (swimlane: Cell, ignoreState: boolean) => Rectangle;

    /**
     * Returns `true` if the given cell is a swimlane in the graph.
     * A swimlane is a container cell with some specific behaviour. This implementation
     * checks if the shape associated with the given cell is a {@link SwimlaneShape}.
     *
     * @param cell {@link Cell} to be checked.
     * @param ignoreState Optional boolean that specifies if the cell state should be ignored.
     */
    isSwimlane: (cell: Cell, ignoreState?: boolean) => boolean;

    /**
     * Returns `true` if the given cell is a valid drop target for the specified cells.
     *
     * If {@link splitEnabled} is true then this returns {@link isSplitTarget} for the given arguments else it returns true if the cell is not collapsed
     * and its child count is greater than 0.
     *
     * @param cell {@link Cell} that represents the possible drop target.
     * @param cells {@link Cell} that should be dropped into the target.
     * @param evt Mouseevent that triggered the invocation.
     */
    isValidDropTarget: (cell: Cell, cells?: Cell[], evt?: MouseEvent | null) => boolean;

    /**
     * Returns the given cell if it is a drop target for the given cells or the nearest ancestor that may be used as a drop target for the given cells.
     *
     * If the given array contains a swimlane and {@link swimlaneNesting} is `false` then this always returns `null`.
     * If no cell is given, then the bottommost swimlane at the location of the given event is returned.
     *
     * This function should only be used if {@link isDropEnabled} returns true.
     *
     * @param cells Array of {@link Cell} which are to be dropped onto the target.
     * @param evt Mouse event for the drag and drop.
     * @param cell {@link Cell} that is under the mouse pointer.
     * @param clone Optional boolean to indicate of cells will be cloned.
     */
    getDropTarget: (
      cells: Cell[],
      evt: MouseEvent,
      cell: Cell | null,
      clone?: boolean
    ) => Cell | null;

    /**
     * Returns {@link swimlaneNesting} as a boolean.
     */
    isSwimlaneNesting: () => boolean;

    /**
     * Specifies if swimlanes can be nested by drag and drop.
     * This is only taken into account if dropEnabled is true.
     *
     * @param value Boolean indicating if swimlanes can be nested.
     */
    setSwimlaneNesting: (value: boolean) => void;

    /**
     * Returns {@link swimlaneSelectionEnabled} as a boolean.
     */
    isSwimlaneSelectionEnabled: () => boolean;

    /**
     * Specifies if swimlanes should be selected if the mouse is released over their content area.
     *
     * @param value Boolean indicating if swimlanes content areas should be selected when the mouse is released over them.
     */
    setSwimlaneSelectionEnabled: (value: boolean) => void;
  }
}

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
const SwimlaneMixin: PartialType = {
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

mixInto(Graph)(SwimlaneMixin);
