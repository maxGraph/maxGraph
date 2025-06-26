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

import type Cell from '../view/cell/Cell';
import type { AbstractGraph } from '../view/AbstractGraph';

/*****************************************************************************
 * Group: Tree and traversal-related
 *****************************************************************************/

/**
 * Returns all children in the given parent which do not have incoming
 * edges. If the result is empty then the with the greatest difference
 * between incoming and outgoing edges is returned.
 *
 * @param graph the Graph to use for the traversal.
 * @param parent {@link Cell} whose children should be checked.
 * @param isolate Optional boolean that specifies if edges should be ignored if
 * the opposite end is not a child of the given parent cell. Default is
 * false.
 * @param invert Optional boolean that specifies if outgoing or incoming edges
 * should be counted for a tree root. If false then outgoing edges will be
 * counted. Default is `false`.
 */
export function findTreeRoots(
  graph: AbstractGraph,
  parent: Cell,
  isolate = false,
  invert = false
) {
  const roots: Cell[] = [];

  if (parent != null) {
    let best = null;
    let maxDiff = 0;

    for (const cell of parent.getChildren()) {
      if (cell.isVertex() && cell.isVisible()) {
        const conns = graph.getConnections(cell, isolate ? parent : null);
        let fanOut = 0;
        let fanIn = 0;

        for (let j = 0; j < conns.length; j++) {
          const src = graph.view.getVisibleTerminal(conns[j], true);

          if (src == cell) {
            fanOut++;
          } else {
            fanIn++;
          }
        }

        if (
          (invert && fanOut == 0 && fanIn > 0) ||
          (!invert && fanIn == 0 && fanOut > 0)
        ) {
          roots.push(cell);
        }

        const diff = invert ? fanIn - fanOut : fanOut - fanIn;

        if (diff > maxDiff) {
          maxDiff = diff;
          best = cell;
        }
      }
    }

    if (roots.length == 0 && best != null) {
      roots.push(best);
    }
  }
  return roots;
}

/**
 * Traverses the (directed) graph invoking the given function for each
 * visited vertex and edge. The function is invoked with the current vertex
 * and the incoming edge as a parameter. This implementation makes sure
 * each vertex is only visited once. The function may return false if the
 * traversal should stop at the given vertex.
 *
 * Example:
 *
 * ```javascript
 * GlobalConfig.logger.show();
 * let cell = graph.getSelectionCell();
 * graph.traverse(cell, false, (vertex, edge)=>
 * {
 *   GlobalConfig.logger.debug(graph.getLabel(vertex));
 * });
 * ```
 *
 * @param vertex <Cell> that represents the vertex where the traversal starts.
 * @param directed Optional boolean indicating if edges should only be traversed
 * from source to target. Default is true.
 * @param func Visitor function that takes the current vertex and the incoming
 * edge as arguments. The traversal stops if the function returns false.
 * @param edge Optional <Cell> that represents the incoming edge. This is
 * null for the first step of the traversal.
 * @param visited Optional {@link Map} from cells to true for the visited cells.
 * @param inverse Optional boolean to traverse in inverse direction. Default is false.
 * This is ignored if directed is false.
 */
export function traverse(
  vertex: Cell | null = null,
  directed = true,
  func: Function | null = null,
  edge: Cell | null = null,
  visited: Map<Cell, boolean> | null = null,
  inverse = false
) {
  if (func != null && vertex != null) {
    directed = directed != null ? directed : true;
    inverse = inverse != null ? inverse : false;
    visited = visited || new Map<Cell, boolean>();

    if (!visited.get(vertex)) {
      visited.set(vertex, true);
      const result = func(vertex, edge);

      if (result == null || result) {
        const edgeCount = vertex.getEdgeCount();

        if (edgeCount > 0) {
          for (let i = 0; i < edgeCount; i += 1) {
            const e = <Cell>vertex.getEdgeAt(i);
            const isSource = e.getTerminal(true) == vertex;

            if (!directed || !inverse == isSource) {
              const next = e.getTerminal(!isSource);
              traverse(next, directed, func, e, visited, inverse);
            }
          }
        }
      }
    }
  }
}
