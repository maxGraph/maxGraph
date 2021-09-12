/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import { setOpacity } from '../Utils';
import GeometryChange from '../../view/geometry/GeometryChange';
import TerminalChange from '../../view/cell/edge/TerminalChange';
import ValueChange from '../../view/cell/ValueChange';
import ChildChange from '../../view/model/ChildChange';
import StyleChange from '../../view/style/StyleChange';

/**
 * Provides animation effects.
 *
 * @class mxEffects
 */
class mxEffects {
  /**
   * Asynchronous animated move operation. See also: <mxMorphing>.
   *
   * @example
   * ```javascript
   * graph.model.addListener(mxEvent.CHANGE, function(sender, evt)
   * {
   *   var changes = evt.getProperty('edit').changes;
   *
   *   if (changes.length < 10)
   *   {
   *     mxEffects.animateChanges(graph, changes);
   *   }
   * });
   * ```
   *
   * @param graph - <mxGraph> that received the changes.
   * @param changes - Array of changes to be animated.
   * @param done - Optional function argument that is invoked after the
   * last step of the animation.
   */
  // static animateChanges(graph: mxGraph, changes: Array<any>, done?: Function): void;
  static animateChanges(graph, changes, done) {
    const maxStep = 10;
    let step = 0;

    const animate = () => {
      let isRequired = false;

      for (let i = 0; i < changes.length; i += 1) {
        const change = changes[i];

        if (
          change instanceof GeometryChange ||
          change instanceof TerminalChange ||
          change instanceof ValueChange ||
          change instanceof ChildChange ||
          change instanceof StyleChange
        ) {
          const state = graph.getView().getState(change.cell || change.child, false);

          if (state != null) {
            isRequired = true;

            if (change.constructor !== GeometryChange || change.cell.isEdge()) {
              setOpacity(state.shape.node, (100 * step) / maxStep);
            } else {
              const { scale } = graph.getView();

              const dx = (change.geometry.x - change.previous.x) * scale;
              const dy = (change.geometry.y - change.previous.y) * scale;

              const sx = (change.geometry.width - change.previous.width) * scale;
              const sy = (change.geometry.height - change.previous.height) * scale;

              if (step === 0) {
                state.x -= dx;
                state.y -= dy;
                state.width -= sx;
                state.height -= sy;
              } else {
                state.x += dx / maxStep;
                state.y += dy / maxStep;
                state.width += sx / maxStep;
                state.height += sy / maxStep;
              }

              graph.cellRenderer.redraw(state);

              // Fades all connected edges and children
              mxEffects.cascadeOpacity(graph, change.cell, (100 * step) / maxStep);
            }
          }
        }
      }

      if (step < maxStep && isRequired) {
        step++;
        window.setTimeout(animate, delay);
      } else if (done != null) {
        done();
      }
    };

    let delay = 30;
    animate();
  }

  /**
   * Sets the opacity on the given cell and its descendants.
   *
   * @param graph - <mxGraph> that contains the cells.
   * @param cell - <mxCell> to set the opacity for.
   * @param opacity - New value for the opacity in %.
   */
  // static cascadeOpacity(graph: mxGraph, cell: mxCell, opacity: number): void;
  static cascadeOpacity(graph, cell, opacity) {
    // Fades all children
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);
      const childState = graph.getView().getState(child);

      if (childState != null) {
        setOpacity(childState.shape.node, opacity);
        mxEffects.cascadeOpacity(graph, child, opacity);
      }
    }

    // Fades all connected edges
    const edges = graph.model.getEdges(cell);

    if (edges != null) {
      for (let i = 0; i < edges.length; i += 1) {
        const edgeState = graph.getView().getState(edges[i]);

        if (edgeState != null) {
          setOpacity(edgeState.shape.node, opacity);
        }
      }
    }
  }

  /**
   * Function: fadeOut
   *
   * Asynchronous fade-out operation.
   */
  static fadeOut(node, from, remove, step, delay, isEnabled) {
    step = step || 40;
    delay = delay || 30;

    let opacity = from || 100;

    setOpacity(node, opacity);

    if (isEnabled || isEnabled == null) {
      const f = () => {
        opacity = Math.max(opacity - step, 0);
        setOpacity(node, opacity);

        if (opacity > 0) {
          window.setTimeout(f, delay);
        } else {
          node.style.visibility = 'hidden';

          if (remove && node.parentNode) {
            node.parentNode.removeChild(node);
          }
        }
      };
      window.setTimeout(f, delay);
    } else {
      node.style.visibility = 'hidden';

      if (remove && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }
  }
}

export default mxEffects;
