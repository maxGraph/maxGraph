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

import type Cell from '../cell/Cell';
import type { Graph } from '../Graph';
import GraphLayout from './GraphLayout';

/**
 * Allows to compose multiple layouts into a single layout.
 *
 * The {@link master} layout is the layout that handles move operations if another layout than the first
 * element in {@link GraphLayout}s should be used. The {@link master} layout is not executed as
 * the code assumes that it is part of {@link layouts}.
 *
 * Example:
 * ```javascript
 * const first = new FastOrganicLayout(graph);
 * const second = new ParallelEdgeLayout(graph);
 * const layout = new CompositeLayout(graph, [first, second], first);
 * layout.execute(graph.getDefaultParent());
 * ```
 *
 * @category Layout
 */
class CompositeLayout extends GraphLayout {
  /**
   * Constructs a new layout using the given layouts. The graph instance is
   * required for creating the transaction that contains all layouts.
   *
   * @param graph Reference to the enclosing {@link Graph}.
   * @param layouts Array of {@link GraphLayout}s.
   * @param master Optional layout that handles moves. If no layout is given, then the first layout of the above array is used to handle moves.
   */
  constructor(graph: Graph, layouts: GraphLayout[], master?: GraphLayout) {
    super(graph);
    this.layouts = layouts;
    this.master = master;
  }

  /**
   * Holds the array of {@link GraphLayout}s that this layout contains.
   */
  layouts: GraphLayout[];

  /**
   * Reference to the {@link GraphLayout}s that handles moves. If this is null
   * then the first layout in <layouts> is used.
   */
  master?: GraphLayout;

  /**
   * Calls `move` on {@link master} or the first layout in {@link layouts}.
   */
  moveCell(cell: Cell, x: number, y: number) {
    if (this.master != null) {
      this.master.moveCell.apply(this.master, [cell, x, y]);
    } else {
      this.layouts[0].moveCell.apply(this.layouts[0], [cell, x, y]);
    }
  }

  /**
   * Implements {@link GraphLayout#execute} by executing all {@link layouts} in a single transaction.
   */
  execute(parent: Cell): void {
    this.graph.batchUpdate(() => {
      for (let i = 0; i < this.layouts.length; i += 1) {
        this.layouts[i].execute.apply(this.layouts[i], [parent]);
      }
    });
  }
}

export default CompositeLayout;
