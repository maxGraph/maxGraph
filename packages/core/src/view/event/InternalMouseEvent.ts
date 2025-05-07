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

import {
  getClientX,
  getClientY,
  getSource,
  isMouseEvent,
  isPopupTrigger,
} from '../../util/EventUtils';
import { isAncestorNode } from '../../util/domUtils';
import CellState from '../cell/CellState';
import Shape from '../shape/Shape';

/**
 * Base class for all mouse events in mxGraph. A listener for this event should
 * implement the following methods:
 *
 * ```javascript
 * graph.addMouseListener(
 * {
 *   mouseDown: (sender, evt)=>
 *   {
 *     GlobalConfig.logger.debug('mouseDown');
 *   },
 *   mouseMove: (sender, evt)=>
 *   {
 *     GlobalConfig.logger.debug('mouseMove');
 *   },
 *   mouseUp: (sender, evt)=>
 *   {
 *     GlobalConfig.logger.debug('mouseUp');
 *   }
 * });
 * ```
 *
 * @category Event
 */
class InternalMouseEvent {
  /**
   * Constructs a new event object for the given arguments.
   *
   * @param evt Native mouse event.
   * @param state Optional {@link CellState} under the mouse.
   */
  constructor(evt: MouseEvent, state: CellState | null = null) {
    this.evt = evt;
    this.state = state;
    this.sourceState = state;

    // graphX and graphY are updated right after this constructor is executed,
    // so let them default to 0 and make them not nullable.
    this.graphX = 0;
    this.graphY = 0;
  }

  /**
   * Holds the consumed state of this event.
   */
  consumed = false;

  /**
   * Holds the inner event object.
   */
  evt: MouseEvent;

  /**
   * Holds the x-coordinate of the event in the graph. This value is set in
   * {@link AbstractGraph.fireMouseEvent}.
   */
  graphX: number;

  /**
   * Holds the y-coordinate of the event in the graph. This value is set in
   * {@link AbstractGraph.fireMouseEvent}.
   */
  graphY: number;

  /**
   * Holds the optional <CellState> associated with this event.
   */
  state: CellState | null;

  /**
   * Holds the <CellState> that was passed to the constructor. This can be
   * different from <state> depending on the result of {@link AbstractGraph.getEventState}.
   */
  sourceState: CellState | null;

  /**
   * Returns <evt>.
   */
  getEvent() {
    return this.evt;
  }

  /**
   * Returns the target DOM element using {@link Event#getSource} for <evt>.
   */
  getSource() {
    return <Element>getSource(this.evt);
  }

  /**
   * Returns true if the given {@link Shape} is the source of <evt>.
   */
  isSource(shape: Shape | null) {
    return shape ? isAncestorNode(shape.node, this.getSource()) : false;
  }

  /**
   * Returns <evt.clientX>.
   */
  getX() {
    return getClientX(this.getEvent());
  }

  /**
   * Returns <evt.clientY>.
   */
  getY() {
    return getClientY(this.getEvent());
  }

  /**
   * Returns <graphX>.
   */
  getGraphX() {
    return this.graphX;
  }

  /**
   * Returns <graphY>.
   */
  getGraphY() {
    return this.graphY;
  }

  /**
   * Returns <state>.
   */
  getState() {
    return this.state;
  }

  /**
   * Returns the <Cell> in <state> is not null.
   */
  getCell() {
    const state = this.getState();
    return state ? state.cell : null;
  }

  /**
   * Returns true if the event is a popup trigger.
   */
  isPopupTrigger() {
    return isPopupTrigger(this.getEvent());
  }

  /**
   * Returns <consumed>.
   */
  isConsumed() {
    return this.consumed;
  }

  /**
   * Sets <consumed> to true and invokes preventDefault on the native event
   * if such a method is defined. This is used mainly to avoid the cursor from
   * being changed to a text cursor in Webkit. You can use the preventDefault
   * flag to disable this functionality.
   *
   * @param preventDefault Specifies if the native event should be canceled. Default
   * is true.
   */
  consume(preventDefault?: boolean) {
    preventDefault = preventDefault
      ? preventDefault
      : (window.TouchEvent && this.evt instanceof TouchEvent) || isMouseEvent(this.evt);

    if (preventDefault && this.evt.preventDefault) {
      this.evt.preventDefault();
    }

    // Sets local consumed state
    this.consumed = true;
  }
}

export default InternalMouseEvent;
