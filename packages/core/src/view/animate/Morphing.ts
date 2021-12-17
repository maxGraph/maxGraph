/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Point from '../geometry/Point';
import CellStatePreview from '../cell/CellStatePreview';
import Animation from './Animation';

/**
 *
 * Class: Morphing
 *
 * Implements animation for morphing cells. Here is an example of
 * using this class for animating the result of a layout algorithm:
 *
 * (code)
 * graph.getModel().beginUpdate();
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
 *     graph.getModel().endUpdate();
 *   });
 *
 *   morph.startAnimation();
 * }
 * (end)
 *
 * Constructor: Morphing
 *
 * Constructs an animation.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * steps - Optional number of steps in the morphing animation. Default is 6.
 * ease - Optional easing constant for the animation. Default is 1.5.
 * delay - Optional delay between the animation steps. Passed to <Animation>.
 */
class Morphing extends Animation {
  constructor(graph, steps, ease, delay) {
    super(delay);
    this.graph = graph;
    this.steps = steps != null ? steps : 6;
    this.ease = ease != null ? ease : 1.5;
  }

  /**
   * Variable: graph
   *
   * Specifies the delay between the animation steps. Defaul is 30ms.
   */
  graph = null;

  /**
   * Variable: steps
   *
   * Specifies the maximum number of steps for the morphing.
   */
  steps = null;

  /**
   * Variable: step
   *
   * Contains the current step.
   */
  step = 0;

  /**
   * Variable: ease
   *
   * Ease-off for movement towards the given vector. Larger values are
   * slower and smoother. Default is 4.
   */
  ease = null;

  /**
   * Variable: cells
   *
   * Optional array of cells to be animated. If this is not specified
   * then all cells are checked and animated if they have been moved
   * in the current transaction.
   */
  cells = null;

  /**
   * Function: updateAnimation
   *
   * Animation step.
   */
  updateAnimation() {
    super.updateAnimation();
    const move = new CellStatePreview(this.graph);

    if (this.cells != null) {
      // Animates the given cells individually without recursion
      for (let i = 0; i < this.cells.length; i += 1) {
        this.animateCell(this.cells[i], move, false);
      }
    } else {
      // Animates all changed cells by using recursion to find
      // the changed cells but not for the animation itself
      this.animateCell(this.graph.getModel().getRoot(), move, true);
    }

    this.show(move);

    if (move.isEmpty() || this.step++ >= this.steps) {
      this.stopAnimation();
    }
  }

  /**
   * Function: show
   *
   * Shows the changes in the given <mxCellStatePreview>.
   */
  show(move) {
    move.show();
  }

  /**
   * Function: animateCell
   *
   * Animates the given cell state using <mxCellStatePreview.moveState>.
   */
  animateCell(cell, move, recurse) {
    const state = this.graph.getView().getState(cell);
    let delta = null;

    if (state != null) {
      // Moves the animated state from where it will be after the model
      // change by subtracting the given delta vector from that location
      delta = this.getDelta(state);

      if (
        cell.isVertex() &&
        (delta.x != 0 || delta.y != 0)
      ) {
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
        this.animateCell(
          cell.getChildAt(i),
          move,
          recurse
        );
      }
    }
  }

  /**
   * Function: stopRecursion
   *
   * Returns true if the animation should not recursively find more
   * deltas for children if the given parent state has been animated.
   */
  stopRecursion(state, delta) {
    return delta != null && (delta.x != 0 || delta.y != 0);
  }

  /**
   * Function: getDelta
   *
   * Returns the vector between the current rendered state and the future
   * location of the state after the display will be updated.
   */
  getDelta(state) {
    const origin = this.getOriginForCell(state.cell);
    const translate = this.graph.getView().getTranslate();
    const scale = this.graph.getView().getScale();
    const x = state.x / scale - translate.x;
    const y = state.y / scale - translate.y;

    return new Point((origin.x - x) * scale, (origin.y - y) * scale);
  }

  /**
   * Function: getOriginForCell
   *
   * Returns the top, left corner of the given cell. TODO: Improve performance
   * by using caching inside this method as the result per cell never changes
   * during the lifecycle of this object.
   */
  getOriginForCell(cell) {
    let result = null;

    if (cell != null) {
      const parent = cell.getParent();
      const geo = cell.getGeometry();
      result = this.getOriginForCell(parent);

      // TODO: Handle offsets
      if (geo != null) {
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
