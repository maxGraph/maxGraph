/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Cell from '../cell/Cell';
import { Graph } from '../Graph';
import GraphLayout from './GraphLayout';

/**
 * Class: mxCompositeLayout
 *
 * Allows to compose multiple layouts into a single layout. The master layout
 * is the layout that handles move operations if another layout than the first
 * element in <layouts> should be used. The <master> layout is not executed as
 * the code assumes that it is part of <layouts>.
 *
 * Example:
 * (code)
 * let first = new mxFastOrganicLayout(graph);
 * let second = new mxParallelEdgeLayout(graph);
 * let layout = new mxCompositeLayout(graph, [first, second], first);
 * layout.execute(graph.getDefaultParent());
 * (end)
 *
 * Constructor: mxCompositeLayout
 *
 * Constructs a new layout using the given layouts. The graph instance is
 * required for creating the transaction that contains all layouts.
 *
 * Arguments:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * layouts - Array of <mxGraphLayouts>.
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
   * Variable: layouts
   *
   * Holds the array of <mxGraphLayouts> that this layout contains.
   */
  layouts: GraphLayout[];

  /**
   * Variable: master
   *
   * Reference to the <mxGraphLayouts> that handles moves. If this is null
   * then the first layout in <layouts> is used.
   */
  master?: GraphLayout;

  /**
   * Function: moveCell
   *
   * Implements <mxGraphLayout.moveCell> by calling move on <master> or the first
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
   * Function: execute
   *
   * Implements <mxGraphLayout.execute> by executing all <layouts> in a
   * single transaction.
   */
  execute(parent: Cell): void {
    const model = this.graph.getModel();

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
