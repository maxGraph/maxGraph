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

import { setOpacity } from '../../util/styleUtils';
import GeometryChange from '../undoable_changes/GeometryChange';
import TerminalChange from '../undoable_changes/TerminalChange';
import ValueChange from '../undoable_changes/ValueChange';
import ChildChange from '../undoable_changes/ChildChange';
import StyleChange from '../undoable_changes/StyleChange';
import type { AbstractGraph } from '../AbstractGraph';
import type Cell from '../../view/cell/Cell';
import { UndoableChange } from '../../types';
import Geometry from '../geometry/Geometry';

/**
 * Provides animation effects.
 *
 * @category Animation
 */
class Effects {
  /**
   * Asynchronous animated move operation. See also: <Morphing>.
   *
   * @example
   * ```javascript
   * graph.model.addListener(mxEvent.CHANGE, function(sender, evt)
   * {
   *   var changes = evt.getProperty('edit').changes;
   *
   *   if (changes.length < 10)
   *   {
   *     Effects.animateChanges(graph, changes);
   *   }
   * });
   * ```
   *
   * @param graph - {@link AbstractGraph} that received the changes.
   * @param changes - Array of changes to be animated.
   * @param done - Optional function argument that is invoked after the
   * last step of the animation.
   */
  static animateChanges(
    graph: AbstractGraph,
    changes: UndoableChange[],
    done?: Function
  ): void {
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
          // @ts-ignore
          const state = graph.getView().getState(change.cell || change.child, false);

          if (state != null) {
            isRequired = true;

            if (change.constructor !== GeometryChange || change.cell.isEdge()) {
              setOpacity(state.shape!.node, (100 * step) / maxStep);
            } else {
              const { scale } = graph.getView();
              const geometry = <Geometry>change.geometry;
              const previous = <Geometry>change.previous;

              const dx = (geometry.x - previous.x) * scale;
              const dy = (geometry.y - previous.y) * scale;

              const sx = (geometry.width - previous.width) * scale;
              const sy = (geometry.height - previous.height) * scale;

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
              Effects.cascadeOpacity(graph, change.cell, (100 * step) / maxStep);
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

    const delay = 30;
    animate();
  }

  /**
   * Sets the opacity on the given cell and its descendants.
   *
   * @param graph - {@link AbstractGraph} that contains the cells.
   * @param cell - {@link Cell} to set the opacity for.
   * @param opacity - New value for the opacity in %.
   */
  static cascadeOpacity(graph: AbstractGraph, cell: Cell, opacity: number): void {
    // Fades all children
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);
      const childState = graph.getView().getState(child);

      if (childState != null) {
        setOpacity(childState.shape!.node, opacity);
        Effects.cascadeOpacity(graph, child, opacity);
      }
    }

    // Fades all connected edges
    const edges = cell.getEdges();

    if (edges != null) {
      for (let i = 0; i < edges.length; i += 1) {
        const edgeState = graph.getView().getState(edges[i]);

        if (edgeState != null) {
          setOpacity(edgeState.shape!.node, opacity);
        }
      }
    }
  }

  /**
   * Asynchronous fade-out operation.
   */
  static fadeOut(
    node: HTMLElement,
    from: number,
    remove: boolean,
    step: number,
    delay: number,
    isEnabled: boolean
  ): void {
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

export default Effects;
