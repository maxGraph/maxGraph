/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import EventSource from '../event/EventSource';
import { getValue } from '../../util/Utils';
import InternalEvent from '../event/InternalEvent';
import Rectangle from '../geometry/Rectangle';
import graph from '../Graph';
import EventObject from '../event/EventObject';
import Cell from '../cell/datatypes/Cell';
import Geometry from '../geometry/Geometry';
import CellArray from '../cell/datatypes/CellArray';

/**
 * @class SwimlaneManager
 * @extends EventSource
 *
 * Manager for swimlanes and nested swimlanes that sets the size of newly added
 * swimlanes to that of their siblings, and propagates changes to the size of a
 * swimlane to its siblings, if {@link siblings} is true, and its ancestors, if
 * {@link bubbling} is true.
 */
class SwimlaneManager extends EventSource {
  constructor(
    graph: graph,
    horizontal: boolean = true,
    addEnabled: boolean = true,
    resizeEnabled: boolean = true
  ) {
    super();

    this.horizontal = horizontal;
    this.addEnabled = addEnabled;
    this.resizeEnabled = resizeEnabled;

    this.addHandler = (sender: any, evt: EventObject) => {
      if (this.isEnabled() && this.isAddEnabled()) {
        this.cellsAdded(evt.getProperty('cells'));
      }
    };

    this.resizeHandler = (sender: any, evt: EventObject) => {
      if (this.isEnabled() && this.isResizeEnabled()) {
        this.cellsResized(evt.getProperty('cells'));
      }
    };

    this.setGraph(graph);
  }

  /**
   * Reference to the enclosing {@link graph}.
   */
  graph: graph | null = null;

  /**
   * Specifies if event handling is enabled.
   * @default true
   */
  enabled: boolean = true;

  /**
   * Specifies the orientation of the swimlanes.
   * @default true
   */
  horizontal: boolean = true;

  /**
   * Specifies if newly added cells should be resized to match the size of their
   * existing siblings.
   * @default true
   */
  addEnabled: boolean = true;

  /**
   * Specifies if resizing of swimlanes should be handled.
   * @default true
   */
  resizeEnabled: boolean = true;

  /**
   * Holds the function that handles the move event.
   */
  addHandler: Function | null = null;

  /**
   * Holds the function that handles the move event.
   */
  resizeHandler: Function | null = null;

  /**
   * Returns true if events are handled. This implementation
   * returns {@link enabled}.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enables or disables event handling. This implementation
   * updates {@link enabled}.
   *
   * @param enabled Boolean that specifies the new enabled state.
   */
  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  /**
   * Returns {@link horizontal}.
   */
  isHorizontal(): boolean {
    return this.horizontal;
  }

  /**
   * Sets {@link horizontal}.
   */
  setHorizontal(value: boolean): void {
    this.horizontal = value;
  }

  /**
   * Returns {@link addEnabled}.
   */
  isAddEnabled(): boolean {
    return this.addEnabled;
  }

  /**
   * Sets {@link addEnabled}.
   */
  setAddEnabled(value: boolean): void {
    this.addEnabled = value;
  }

  /**
   * Returns {@link resizeEnabled}.
   */
  isResizeEnabled(): boolean {
    return this.resizeEnabled;
  }

  /**
   * Sets {@link resizeEnabled}.
   */
  setResizeEnabled(value: boolean): void {
    this.resizeEnabled = value;
  }

  /**
   * Returns the graph that this manager operates on.
   */
  getGraph(): graph | null {
    return this.graph;
  }

  /**
   * Sets the graph that the manager operates on.
   */
  setGraph(graph: graph | null): void {
    if (this.graph != null) {
      this.graph.removeListener(this.addHandler);
      this.graph.removeListener(this.resizeHandler);
    }

    this.graph = graph;

    if (this.graph != null) {
      this.graph.addListener(InternalEvent.ADD_CELLS, this.addHandler);
      this.graph.addListener(InternalEvent.CELLS_RESIZED, this.resizeHandler);
    }
  }

  /**
   * Returns true if the given swimlane should be ignored.
   */
  isSwimlaneIgnored(swimlane: Cell): boolean {
    return !(<graph>this.getGraph()).isSwimlane(swimlane);
  }

  /**
   * Returns true if the given cell is horizontal. If the given cell is not a
   * swimlane, then the global orientation is returned.
   */
  isCellHorizontal(cell: Cell): boolean {
    if ((<graph>this.graph).isSwimlane(cell)) {
      const style = (<graph>this.graph).getCellStyle(cell);
      return getValue(style, 'horizontal', 1) == 1;
    }
    return !this.isHorizontal();
  }

  /**
   * Called if any cells have been added.
   *
   * @param cell Array of {@link Cell} that have been added.
   */
  cellsAdded(cells: CellArray): void {
    if (cells != null) {
      const model = (<graph>this.graph).getModel();

      model.beginUpdate();
      try {
        for (const cell of cells) {
          if (!this.isSwimlaneIgnored(cell)) {
            this.swimlaneAdded(cell);
          }
        }
      } finally {
        model.endUpdate();
      }
    }
  }

  /**
   * Updates the size of the given swimlane to match that of any existing
   * siblings swimlanes.
   *
   * @param swimlane {@link mxCell} that represents the new swimlane.
   */
  // swimlaneAdded(swimlane: mxCell): void;
  swimlaneAdded(swimlane: Cell): void {
    const parent = <Cell>swimlane.getParent();
    const childCount = parent.getChildCount();
    let geo = null;

    // Finds the first valid sibling swimlane as reference
    for (let i = 0; i < childCount; i += 1) {
      const child = <Cell>parent.getChildAt(i);

      if (child !== swimlane && !this.isSwimlaneIgnored(child)) {
        geo = child.getGeometry();
        if (geo != null) {
          break;
        }
      }
    }

    // Applies the size of the refernece to the newly added swimlane
    if (geo != null) {
      const parentHorizontal =
        parent != null ? this.isCellHorizontal(parent) : this.horizontal;
      this.resizeSwimlane(swimlane, geo.width, geo.height, parentHorizontal);
    }
  }

  /**
   * Called if any cells have been resizes. Calls {@link swimlaneResized} for all
   * swimlanes where {@link isSwimlaneIgnored} returns false.
   *
   * @param cells Array of {@link Cell} whose size was changed.
   */
  cellsResized(cells: CellArray | null): void {
    if (cells != null) {
      const model = (<graph>this.getGraph()).getModel();

      model.beginUpdate();
      try {
        // Finds the top-level swimlanes and adds offsets
        for (const cell of cells) {
          if (!this.isSwimlaneIgnored(cell)) {
            const geo = cell.getGeometry();

            if (geo != null) {
              const size = new Rectangle(0, 0, geo.width, geo.height);
              let top = cell;
              let current = top;

              while (current != null) {
                top = current;
                current = <Cell>current.getParent();
                const tmp = (<graph>this.graph).isSwimlane(current)
                  ? (<graph>this.graph).getStartSize(current)
                  : new Rectangle();
                size.width += tmp.width;
                size.height += tmp.height;
              }

              const parentHorizontal =
                current != null ? this.isCellHorizontal(current) : this.horizontal;
              this.resizeSwimlane(top, size.width, size.height, parentHorizontal);
            }
          }
        }
      } finally {
        model.endUpdate();
      }
    }
  }

  /**
   * Called from {@link cellsResized} for all swimlanes that are not ignored to update
   * the size of the siblings and the size of the parent swimlanes, recursively,
   * if {@link bubbling} is true.
   *
   * @param swimlane {@link mxCell} whose size has changed.
   */
  resizeSwimlane(swimlane: Cell, w: number, h: number, parentHorizontal: boolean): void {
    const model = (<graph>this.graph).getModel();

    model.beginUpdate();
    try {
      const horizontal = this.isCellHorizontal(swimlane);

      if (!this.isSwimlaneIgnored(swimlane)) {
        let geo = <Geometry>swimlane.getGeometry();

        if (geo != null) {
          if (
            (parentHorizontal && geo.height !== h) ||
            (!parentHorizontal && geo.width !== w)
          ) {
            geo = geo.clone();

            if (parentHorizontal) {
              geo.height = h;
            } else {
              geo.width = w;
            }

            model.setGeometry(swimlane, geo);
          }
        }
      }

      const tmp = (<graph>this.graph).isSwimlane(swimlane)
        ? (<graph>this.graph).getStartSize(swimlane)
        : new Rectangle();
      w -= tmp.width;
      h -= tmp.height;

      const childCount = swimlane.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const child = <Cell>swimlane.getChildAt(i);
        this.resizeSwimlane(child, w, h, horizontal);
      }
    } finally {
      model.endUpdate();
    }
  }

  /**
   * Removes all handlers from the {@link graph} and deletes the reference to it.
   */
  destroy(): void {
    this.setGraph(null);
  }
}

export default SwimlaneManager;
