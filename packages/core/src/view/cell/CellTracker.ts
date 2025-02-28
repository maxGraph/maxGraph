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

import CellMarker from './CellMarker';
import InternalMouseEvent from '../event/InternalMouseEvent';
import { Graph } from '../Graph';
import Cell from './Cell';
import EventSource from '../event/EventSource';

import type { ColorValue } from '../../types';

/**
 * Event handler that highlights cells
 *
 * ```javascript
 * new CellTracker(graph, '#00FF00');
 * ```
 *
 * For detecting `dragEnter`, `dragOver` and `dragLeave` on cells, the following code can be used:
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
 *     GlobalConfig.logger.debug('dragEnter', cell.value);
 *   },
 *   dragOver: function(evt, cell)
 *   {
 *     GlobalConfig.logger.debug('dragOver', cell.value);
 *   },
 *   dragLeave: function(evt, cell)
 *   {
 *     GlobalConfig.logger.debug('dragLeave', cell.value);
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
  mouseDown(sender: EventSource, me: InternalMouseEvent) {
    return;
  }

  /**
   * Handles the event by highlighting the cell under the mouse pointer if it is over the hotspot region of the cell.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    if (this.isEnabled()) {
      this.process(me);
    }
  }

  /**
   * Handles the event by resetting the highlight.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    return;
  }

  /**
   * Destroys the object and all its resources and DOM nodes. This doesn't normally need to be called.
   * It is called automatically when the window unloads.
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
