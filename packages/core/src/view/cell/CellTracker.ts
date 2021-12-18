/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import CellMarker from './CellMarker';
import InternalMouseEvent from '../event/InternalMouseEvent';
import { Graph } from '../Graph';
import Cell from './Cell';
import EventSource from '../event/EventSource';

import type { ColorValue } from '../../types';

/**
 * Event handler that highlights cells
 *
 * @example
 * ```javascript
 * new mxCellTracker(graph, '#00FF00');
 * ```
 *
 * For detecting dragEnter, dragOver and dragLeave on cells, the following code can be used:
 * @example
 * ```javascript
 * graph.addMouseListener(
 * {
 *   cell: null,
 *   mouseDown: function(sender, me) { },
 *   mouseMove: function(sender, me)
 *   {
 *     var tmp = me.getCell();
 *
 *     if (tmp != this.cell)
 *     {
 *       if (this.cell != null)
 *       {
 *         this.dragLeave(me.getEvent(), this.cell);
 *       }
 *
 *       this.cell = tmp;
 *
 *       if (this.cell != null)
 *       {
 *         this.dragEnter(me.getEvent(), this.cell);
 *       }
 *     }
 *
 *     if (this.cell != null)
 *     {
 *       this.dragOver(me.getEvent(), this.cell);
 *     }
 *   },
 *   mouseUp: function(sender, me) { },
 *   dragEnter: function(evt, cell)
 *   {
 *     MaxLog.debug('dragEnter', cell.value);
 *   },
 *   dragOver: function(evt, cell)
 *   {
 *     MaxLog.debug('dragOver', cell.value);
 *   },
 *   dragLeave: function(evt, cell)
 *   {
 *     MaxLog.debug('dragLeave', cell.value);
 *   }
 * });
 * ```
 */
class CellTracker extends CellMarker {
  constructor(
    graph: Graph,
    color: ColorValue,
    funct: ((me: InternalMouseEvent) => Cell) | null = null
  ) {
    super(graph, color);

    this.graph.addMouseListener(this);

    if (funct) {
      this.getCell = funct;
    }
  }

  destroyed = false;

  /**
   * Ignores the event. The event is not consumed.
   */
  mouseDown(sender: EventSource, me: InternalMouseEvent) {}

  /**
   * Handles the event by highlighting the cell under the mousepointer if it
   * is over the hotspot region of the cell.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    if (this.isEnabled()) {
      this.process(me);
    }
  }

  /**
   * Handles the event by resetting the highlight.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {}

  /**
   * Destroys the object and all its resources and DOM nodes. This doesn't
   * normally need to be called. It is called automatically when the window
   * unloads.
   */
  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;

      this.graph.removeMouseListener(this);
      super.destroy();
    }
  }
}

export default CellTracker;
