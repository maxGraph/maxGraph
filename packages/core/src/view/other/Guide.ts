/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import { DIALECT, GUIDE_COLOR, GUIDE_STROKEWIDTH } from '../../util/Constants';
import Point from '../geometry/Point';
import PolylineShape from '../geometry/edge/PolylineShape';
import type CellState from '../cell/CellState';
import Shape from '../geometry/Shape';
import Rectangle from '../geometry/Rectangle';
import type { AbstractGraph } from '../AbstractGraph';

/**
 * Implements the alignment of selection cells to other cells in the graph.
 *
 * Constructor: mxGuide
 *
 * Constructs a new guide object.
 */
class Guide {
  constructor(graph: AbstractGraph, states: CellState[]) {
    this.graph = graph;
    this.setStates(states);
  }

  /**
   * Reference to the enclosing {@link AbstractGraph} instance.
   */
  graph: AbstractGraph;

  /**
   * Contains the {@link CellState}s that are used for alignment.
   */
  states: CellState[] = [];

  /**
   * Specifies if horizontal guides are enabled. Default is true.
   */
  horizontal = true;

  /**
   * Specifies if vertical guides are enabled. Default is true.
   */
  vertical = true;

  /**
   * Holds the {@link Shape} for the horizontal guide.
   */
  guideX: Shape | null = null;

  /**
   * Holds the {@link Shape} for the vertical guide.
   */
  guideY: Shape | null = null;

  /**
   * Specifies if rounded coordinates should be used. Default is false.
   */
  rounded = false;

  /**
   * Default tolerance in px if grid is disabled. Default is 2.
   */
  tolerance = 2;

  /**
   * Sets the {@link CellState}s that should be used for alignment.
   */
  setStates(states: CellState[]) {
    this.states = states;
  }

  /**
   * Returns true if the guide should be enabled for the given native event. This
   * implementation always returns true.
   */
  isEnabledForEvent(evt: MouseEvent) {
    return true;
  }

  /**
   * Returns the tolerance for the guides. Default value is gridSize / 2.
   */
  getGuideTolerance(gridEnabled = false) {
    return gridEnabled && this.graph.isGridEnabled()
      ? this.graph.getGridSize() / 2
      : this.tolerance;
  }

  /**
   * Returns the mxShape to be used for painting the respective guide. This
   * implementation returns a new, dashed and crisp {@link PolylineShape} using
   * {@link GUIDE_COLOR} and {@link GUIDE_STROKEWIDTH} as the format.
   *
   * @param horizontal Boolean that specifies which guide should be created.
   */
  createGuideShape(horizontal = false) {
    // TODO: Should vertical guides be supported here?? ============================
    const guide = new PolylineShape([], GUIDE_COLOR, GUIDE_STROKEWIDTH);
    guide.isDashed = true;
    return guide;
  }

  /**
   * Returns true if the given state should be ignored.
   * @param state
   */
  isStateIgnored(state: CellState) {
    return false;
  }

  /**
   * Moves the <bounds> by the given {@link Point} and returnt the snapped point.
   */
  move(
    bounds: Rectangle | null = null,
    delta: Point,
    gridEnabled = false,
    clone = false
  ) {
    if ((this.horizontal || this.vertical) && bounds) {
      const { scale } = this.graph.getView();
      const tt = this.getGuideTolerance(gridEnabled) * scale;
      const b = bounds.clone();
      b.x += delta.x;
      b.y += delta.y;
      let overrideX = false;
      let stateX: CellState | null = null;
      let valueX: number | null = null;
      let overrideY = false;
      let stateY: CellState | null = null;
      let valueY: number | null = null;
      let ttX = tt;
      let ttY = tt;
      const left = b.x;
      const right = b.x + b.width;
      const center = b.getCenterX();
      const top = b.y;
      const bottom = b.y + b.height;
      const middle = b.getCenterY();

      // Snaps the left, center and right to the given x-coordinate
      const snapX = (x: number, state: CellState, centerAlign: boolean) => {
        let override = false;

        if (centerAlign && Math.abs(x - center) < ttX) {
          delta.x = x - bounds.getCenterX();
          ttX = Math.abs(x - center);
          override = true;
        } else if (!centerAlign) {
          if (Math.abs(x - left) < ttX) {
            delta.x = x - bounds.x;
            ttX = Math.abs(x - left);
            override = true;
          } else if (Math.abs(x - right) < ttX) {
            delta.x = x - bounds.x - bounds.width;
            ttX = Math.abs(x - right);
            override = true;
          }
        }

        if (override) {
          stateX = state;
          valueX = x;

          if (!this.guideX) {
            this.guideX = this.createGuideShape(true);

            // Makes sure to use SVG shapes in order to implement
            // event-transparency on the background area of the rectangle since
            // HTML shapes do not let mouseevents through even when transparent
            this.guideX.dialect = DIALECT.SVG;
            this.guideX.pointerEvents = false;
            this.guideX.init(this.graph.getView().getOverlayPane());
          }
        }

        overrideX = overrideX || override;
      };

      // Snaps the top, middle or bottom to the given y-coordinate
      const snapY = (y: number, state: CellState, centerAlign: boolean) => {
        let override = false;

        if (centerAlign && Math.abs(y - middle) < ttY) {
          delta.y = y - bounds.getCenterY();
          ttY = Math.abs(y - middle);
          override = true;
        } else if (!centerAlign) {
          if (Math.abs(y - top) < ttY) {
            delta.y = y - bounds.y;
            ttY = Math.abs(y - top);
            override = true;
          } else if (Math.abs(y - bottom) < ttY) {
            delta.y = y - bounds.y - bounds.height;
            ttY = Math.abs(y - bottom);
            override = true;
          }
        }

        if (override) {
          stateY = state;
          valueY = y;

          if (!this.guideY) {
            this.guideY = this.createGuideShape(false);

            // Makes sure to use SVG shapes in order to implement
            // event-transparency on the background area of the rectangle since
            // HTML shapes do not let mouseevents through even when transparent
            this.guideY.dialect = DIALECT.SVG;
            this.guideY.pointerEvents = false;
            this.guideY.init(this.graph.getView().getOverlayPane());
          }
        }

        overrideY = overrideY || override;
      };

      for (let i = 0; i < this.states.length; i += 1) {
        const state = this.states[i];

        if (state && !this.isStateIgnored(state)) {
          // Align x
          if (this.horizontal) {
            snapX(state.getCenterX(), state, true);
            snapX(state.x, state, false);
            snapX(state.x + state.width, state, false);

            // Aligns left and right of shape to center of page
            if (!state.cell) {
              snapX(state.getCenterX(), state, false);
            }
          }

          // Align y
          if (this.vertical) {
            snapY(state.getCenterY(), state, true);
            snapY(state.y, state, false);
            snapY(state.y + state.height, state, false);

            // Aligns left and right of shape to center of page
            if (!state.cell) {
              snapY(state.getCenterY(), state, false);
            }
          }
        }
      }

      // Moves cells to the raster if not aligned
      this.graph.snapDelta(delta, bounds, !gridEnabled, overrideX, overrideY);
      delta = this.getDelta(bounds, stateX, delta.x, stateY, delta.y);

      // Redraws the guides
      const c = this.graph.container;

      if (!overrideX && this.guideX) {
        this.guideX.node.style.visibility = 'hidden';
      } else if (this.guideX) {
        let minY: number | null = null;
        let maxY: number | null = null;

        if (stateX) {
          minY = Math.min(bounds.y + delta.y - this.graph.getPanDy(), stateX!.y);
          maxY = Math.max(
            bounds.y + bounds.height + delta.y - this.graph.getPanDy(),
            // @ts-ignore stateX! doesn't work for some reason...
            stateX!.y + stateX!.height
          );
        }

        if (minY !== null && maxY !== null) {
          this.guideX.points = [new Point(valueX!, minY), new Point(valueX!, maxY)];
        } else {
          this.guideX.points = [
            new Point(valueX!, -this.graph.getPanDy()),
            new Point(valueX!, c.scrollHeight - 3 - this.graph.getPanDy()),
          ];
        }

        this.guideX.stroke = this.getGuideColor(stateX!, true);
        this.guideX.node.style.visibility = 'visible';
        this.guideX.redraw();
      }

      if (!overrideY && this.guideY != null) {
        this.guideY.node.style.visibility = 'hidden';
      } else if (this.guideY != null) {
        let minX = null;
        let maxX = null;

        if (stateY != null && bounds != null) {
          minX = Math.min(bounds.x + delta.x - this.graph.getPanDx(), stateY!.x);
          maxX = Math.max(
            bounds.x + bounds.width + delta.x - this.graph.getPanDx(),
            // @ts-ignore
            stateY.x + stateY.width
          );
        }

        if (minX != null && maxX != null && valueY !== null) {
          this.guideY.points = [new Point(minX, valueY), new Point(maxX, valueY)];
        } else if (valueY !== null) {
          this.guideY.points = [
            new Point(-this.graph.getPanDx(), valueY),
            new Point(c.scrollWidth - 3 - this.graph.getPanDx(), valueY),
          ];
        }

        this.guideY.stroke = this.getGuideColor(stateY!, false);
        this.guideY.node.style.visibility = 'visible';
        this.guideY.redraw();
      }
    }

    return delta;
  }

  /**
   * Rounds to pixels for virtual states (eg. page guides)
   */
  getDelta(
    bounds: Rectangle,
    stateX: CellState | null = null,
    dx: number,
    stateY: CellState | null = null,
    dy: number
  ): Point {
    const s = this.graph.view.scale;
    if (this.rounded || (stateX != null && stateX.cell == null)) {
      dx = Math.round((bounds.x + dx) / s) * s - bounds.x;
    }
    if (this.rounded || (stateY != null && stateY.cell == null)) {
      dy = Math.round((bounds.y + dy) / s) * s - bounds.y;
    }
    return new Point(dx, dy);
  }

  /**
   * Hides all current guides.
   */
  getGuideColor(state: CellState, horizontal: boolean) {
    return GUIDE_COLOR;
  }

  /**
   * Hides all current guides.
   */
  hide() {
    this.setVisible(false);
  }

  /**
   * Shows or hides the current guides.
   */
  setVisible(visible: boolean) {
    if (this.guideX) {
      this.guideX.node.style.visibility = visible ? 'visible' : 'hidden';
    }
    if (this.guideY) {
      this.guideY.node.style.visibility = visible ? 'visible' : 'hidden';
    }
  }

  /**
   * Destroys all resources that this object uses.
   */
  destroy() {
    if (this.guideX) {
      this.guideX.destroy();
      this.guideX = null;
    }
    if (this.guideY) {
      this.guideY.destroy();
      this.guideY = null;
    }
  }
}

export default Guide;
