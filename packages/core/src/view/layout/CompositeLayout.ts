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
import Cell from '../cell/Cell';
import { Graph } from '../Graph';
import GraphLayout from './GraphLayout';

/**
 * Allows to compose multiple layouts into a single layout. The master layout
 * is the layout that handles move operations if another layout than the first
 * element in <layouts> should be used. The {@link aster} layout is not executed as
 * the code assumes that it is part of <layouts>.
 *
 * Example:
 * ```javascript
 * let first = new mxFastOrganicLayout(graph);
 * let second = new mxParallelEdgeLayout(graph);
 * let layout = new mxCompositeLayout(graph, [first, second], first);
 * layout.execute(graph.getDefaultParent());
 * ```
 *
 * Constructor: mxCompositeLayout
 *
 * Constructs a new layout using the given layouts. The graph instance is
 * required for creating the transaction that contains all layouts.
 *
 * Arguments:
 *
 * graph - Reference to the enclosing {@link Graph}.
 * layouts - Array of {@link GraphLayouts}.
 * master - Optional layout that handles moves. If no layout is given then
 * the first layout of the above array is used to handle moves.
 */
class CompositeLayout extends GraphLayout {
  constructor(graph: Graph, layouts: GraphLayout[], master?: GraphLayout) {
    super(graph);
    this.layouts = layouts;
    this.master = master;
  }

  /**
   * Holds the array of {@link GraphLayouts} that this layout contains.
   */
  layouts: GraphLayout[];

  /**
   * Reference to the {@link GraphLayouts} that handles moves. If this is null
   * then the first layout in <layouts> is used.
   */
  master?: GraphLayout;

  /**
   * Implements {@link GraphLayout#moveCell} by calling move on {@link aster} or the first
   * layout in <layouts>.
   */
  moveCell(cell: Cell, x: number, y: number) {
    if (this.master != null) {
      this.master.moveCell.apply(this.master, [cell, x, y]);
    } else {
      this.layouts[0].moveCell.apply(this.layouts[0], [cell, x, y]);
    }
  }

  /**
   * Implements {@link GraphLayout#execute} by executing all <layouts> in a
   * single transaction.
   */
  execute(parent: Cell): void {
    const model = this.graph.getDataModel();

    model.beginUpdate();
    try {
      for (let i = 0; i < this.layouts.length; i += 1) {
        this.layouts[i].execute.apply(this.layouts[i], [parent]);
      }
    } finally {
      model.endUpdate();
    }
  }
}

export default CompositeLayout;
