/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { Graph } from '../../view/Graph';
import CellArray from '../../view/cell/CellArray';

/**
 * @class
 *
 * Singleton that implements a clipboard for graph cells.
 *
 * ### Example:
 *
 * @example
 * ```javascript
 * Clipboard.copy(graph);
 * Clipboard.paste(graph2);
 * ```
 *
 * This copies the selection cells from the graph to the clipboard and
 * pastes them into graph2.
 *
 * For fine-grained control of the clipboard data the {@link graph.canExportCell}
 * and {@link graph.canImportCell} functions can be overridden.
 *
 * To restore previous parents for pasted cells, the implementation for
 * {@link copy} and {@link paste} can be changed as follows.
 *
 * @example
 * ```javascript
 * Clipboard.copy = function(graph, cells)
 * {
 *   cells = cells || graph.getSelectionCells();
 *   var result = graph.getExportableCells(cells);
 *
 *   Clipboard.parents = new Object();
 *
 *   for (var i = 0; i < result.length; i++)
 *   {
 *     Clipboard.parents[i] = graph.model.getParent(cells[i]);
 *   }
 *
 *   Clipboard.insertCount = 1;
 *   Clipboard.setCells(graph.cloneCells(result));
 *
 *   return result;
 * };
 *
 * Clipboard.paste = function(graph)
 * {
 *   if (!Clipboard.isEmpty())
 *   {
 *     var cells = graph.getImportableCells(Clipboard.getCells());
 *     var delta = Clipboard.insertCount * Clipboard.STEPSIZE;
 *     var parent = graph.getDefaultParent();
 *
 *     graph.model.beginUpdate();
 *     try
 *     {
 *       for (var i = 0; i < cells.length; i++)
 *       {
 *         var tmp = (Clipboard.parents != null && graph.model.contains(Clipboard.parents[i])) ?
 *              Clipboard.parents[i] : parent;
 *         cells[i] = graph.importCells([cells[i]], delta, delta, tmp)[0];
 *       }
 *     }
 *     finally
 *     {
 *       graph.model.endUpdate();
 *     }
 *
 *     // Increments the counter and selects the inserted cells
 *     Clipboard.insertCount++;
 *     graph.setSelectionCells(cells);
 *   }
 * };
 * ```
 */
class Clipboard {
  /**
   * Defines the step size to offset the cells after each paste operation.
   * Default is 10.
   */
  static STEPSIZE = 10;

  /**
   * Counts the number of times the clipboard data has been inserted.
   */
  static insertCount = 1;

  /**
   * Holds the array of {@link mxCell} currently in the clipboard.
   */
  static cells: CellArray;

  /**
   * Sets the cells in the clipboard. Fires a {@link mxEvent.CHANGE} event.
   */
  static setCells(cells: CellArray) {
    Clipboard.cells = cells;
  }

  /**
   * Returns  the cells in the clipboard.
   */
  static getCells() {
    return Clipboard.cells;
  }

  /**
   * Returns true if the clipboard currently has not data stored.
   */
  static isEmpty() {
    return !Clipboard.getCells();
  }

  /**
   * Cuts the given array of {@link mxCell} from the specified graph.
   * If cells is null then the selection cells of the graph will
   * be used. Returns the cells that have been cut from the graph.
   *
   * @param graph - {@link graph} that contains the cells to be cut.
   * @param cells - Optional array of {@link mxCell} to be cut.
   */
  static cut(graph: Graph, cells?: CellArray) {
    cells = Clipboard.copy(graph, cells);
    Clipboard.insertCount = 0;
    Clipboard.removeCells(graph, cells);

    return cells;
  }

  /**
   * Hook to remove the given cells from the given graph after
   * a cut operation.
   *
   * @param graph - {@link graph} that contains the cells to be cut.
   * @param cells - Array of {@link mxCell} to be cut.
   */
  static removeCells(graph: Graph, cells: CellArray) {
    graph.removeCells(cells);
  }

  /**
   * Copies the given array of {@link mxCell} from the specified
   * graph to {@link cells}. Returns the original array of cells that has
   * been cloned. Descendants of cells in the array are ignored.
   *
   * @param graph - {@link graph} that contains the cells to be copied.
   * @param cells - Optional array of {@link mxCell} to be copied.
   */
  static copy(graph: Graph, cells?: CellArray) {
    cells = cells || graph.getSelectionCells();
    const result = graph.getExportableCells(cells).getTopmostCells();
    Clipboard.insertCount = 1;
    Clipboard.setCells(graph.cloneCells(result));

    return result;
  }

  /**
   * Pastes the {@link cells} into the specified graph restoring
   * the relation to {@link parents}, if possible. If the parents
   * are no longer in the graph or invisible then the
   * cells are added to the graph's default or into the
   * swimlane under the cell's new location if one exists.
   * The cells are added to the graph using {@link graph.importCells}
   * and returned.
   *
   * @param graph - {@link graph} to paste the {@link cells} into.
   */
  static paste(graph: Graph) {
    let cells = null;

    if (!Clipboard.isEmpty() && Clipboard.getCells()) {
      cells = graph.getImportableCells(Clipboard.getCells());
      const delta = Clipboard.insertCount * Clipboard.STEPSIZE;
      const parent = graph.getDefaultParent();
      cells = graph.importCells(cells, delta, delta, parent);

      // Increments the counter and selects the inserted cells
      Clipboard.insertCount++;
      graph.setSelectionCells(<CellArray>cells);
    }

    return cells;
  }
}

export default Clipboard;
