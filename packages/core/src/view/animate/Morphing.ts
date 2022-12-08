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

import Point from '../geometry/Point';
import CellStatePreview from '../cell/CellStatePreview';
import Animation from './Animation';
import CellState from '../cell/CellState';
import Cell from '../cell/Cell';
import { Graph } from '../Graph';

/**
 * Implements animation for morphing cells. Here is an example of
 * using this class for animating the result of a layout algorithm:
 *
 * ```javascript
 * graph.getDataModel().beginUpdate();
 * try
 * {
 *   let circleLayout = new mxCircleLayout(graph);
 *   circleLayout.execute(graph.getDefaultParent());
 * }
 * finally
 * {
 *   let morph = new Morphing(graph);
 *   morph.addListener(mxEvent.DONE, ()=>
 *   {
 *     graph.getDataModel().endUpdate();
 *   });
 *
 *   morph.startAnimation();
 * }
 * ```
 *
 * Constructor: Morphing
 *
 * Constructs an animation.
 *
 * @param graph Reference to the enclosing {@link Graph}.
 * @param steps Optional number of steps in the morphing animation. Default is 6.
 * @param ease Optional easing constant for the animation. Default is 1.5.
 * @param delay Optional delay between the animation steps. Passed to <Animation>.
 */
class Morphing extends Animation {
  constructor(graph: Graph, steps = 6, ease = 1.5, delay: number) {
    super(delay);
    this.graph = graph;
    this.steps = steps;
    this.ease = ease;
  }

  /**
   * Specifies the delay between the animation steps. Defaul is 30ms.
   */
  graph: Graph;

  /**
   * Specifies the maximum number of steps for the morphing.
   */
  steps: number;

  /**
   * Contains the current step.
   */
  step = 0;

  /**
   * Ease-off for movement towards the given vector. Larger values are
   * slower and smoother. Default is 4.
   */
  ease: number;

  /**
   * Optional array of cells to be animated. If this is not specified
   * then all cells are checked and animated if they have been moved
   * in the current transaction.
   */
  cells: Cell[] | null = null;

  /**
   * Animation step.
   */
  updateAnimation() {
    super.updateAnimation();
    const move = new CellStatePreview(this.graph);

    if (this.cells != null) {
      // Animates the given cells individually without recursion
      for (const cell of this.cells) {
        this.animateCell(cell, move, false);
      }
    } else {
      // Animates all changed cells by using recursion to find
      // the changed cells but not for the animation itself
      this.animateCell(<Cell>this.graph.getDataModel().getRoot(), move, true);
    }

    this.show(move);

    if (move.isEmpty() || this.step++ >= this.steps) {
      this.stopAnimation();
    }
  }

  /**
   * Shows the changes in the given <CellStatePreview>.
   */
  show(move: CellStatePreview) {
    move.show();
  }

  /**
   * Animates the given cell state using <CellStatePreview.moveState>.
   */
  animateCell(cell: Cell, move: CellStatePreview, recurse = false) {
    const state = this.graph.getView().getState(cell);
    let delta = null;

    if (state != null) {
      // Moves the animated state from where it will be after the model
      // change by subtracting the given delta vector from that location
      delta = this.getDelta(state);

      if (cell.isVertex() && (delta.x != 0 || delta.y != 0)) {
        const translate = this.graph.view.getTranslate();
        const scale = this.graph.view.getScale();

        delta.x += translate.x * scale;
        delta.y += translate.y * scale;

        move.moveState(state, -delta.x / this.ease, -delta.y / this.ease);
      }
    }

    if (recurse && !this.stopRecursion(state, delta)) {
      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        this.animateCell(cell.getChildAt(i), move, recurse);
      }
    }
  }

  /**
   * Returns true if the animation should not recursively find more
   * deltas for children if the given parent state has been animated.
   */
  stopRecursion(state: CellState | null = null, delta: Point | null = null) {
    return delta != null && (delta.x != 0 || delta.y != 0);
  }

  /**
   * Returns the vector between the current rendered state and the future
   * location of the state after the display will be updated.
   */
  getDelta(state: CellState) {
    const origin = <Point>this.getOriginForCell(state.cell);
    const translate = this.graph.getView().getTranslate();
    const scale = this.graph.getView().getScale();
    const x = state.x / scale - translate.x;
    const y = state.y / scale - translate.y;

    return new Point((origin.x - x) * scale, (origin.y - y) * scale);
  }

  /**
   * Returns the top, left corner of the given cell. TODO: Improve performance
   * by using caching inside this method as the result per cell never changes
   * during the lifecycle of this object.
   */
  getOriginForCell(cell: Cell | null = null): Point | null {
    let result = null;

    if (cell != null) {
      const parent = cell.getParent();
      const geo = cell.getGeometry();
      result = <Point>this.getOriginForCell(parent);

      // TODO: Handle offsets
      if (geo != null && parent != null) {
        if (geo.relative) {
          const pgeo = parent.getGeometry();

          if (pgeo != null) {
            result.x += geo.x * pgeo.width;
            result.y += geo.y * pgeo.height;
          }
        } else {
          result.x += geo.x;
          result.y += geo.y;
        }
      }
    }

    if (result == null) {
      const t = this.graph.view.getTranslate();
      result = new Point(-t.x, -t.y);
    }
    return result;
  }
}

export default Morphing;
