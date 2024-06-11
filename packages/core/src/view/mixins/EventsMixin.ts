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

import InternalMouseEvent from '../event/InternalMouseEvent';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import {
  getClientX,
  getClientY,
  isAltDown,
  isConsumed,
  isControlDown,
  isLeftMouseButton,
  isMetaDown,
  isMouseEvent,
  isMultiTouchEvent,
  isPenEvent,
  isPopupTrigger,
  isShiftDown,
  isTouchEvent,
} from '../../util/EventUtils';
import CellState from '../cell/CellState';
import Cell from '../cell/Cell';
import PanningHandler from '../handler/PanningHandler';
import ConnectionHandler from '../handler/ConnectionHandler';
import Point from '../geometry/Point';
import { mixInto } from '../../util/Utils';
import { convertPoint } from '../../util/styleUtils';
import { NONE } from '../../util/Constants';
import Client from '../../Client';
import EventSource from '../event/EventSource';
import CellEditorHandler from '../handler/CellEditorHandler';
import { Graph } from '../Graph';
import TooltipHandler from '../handler/TooltipHandler';

import type { MouseEventListener, MouseListenerSet } from '../../types';

declare module '../Graph' {
  interface Graph {
    mouseListeners: MouseListenerSet[];
    lastTouchEvent: MouseEvent | null;
    doubleClickCounter: number;
    lastTouchCell: Cell | null;
    fireDoubleClick: boolean | null;
    tapAndHoldThread: number | null;
    lastMouseX: number | null;
    lastMouseY: number | null;
    isMouseTrigger: boolean | null;
    ignoreMouseEvents: boolean | null;
    mouseMoveRedirect: MouseEventListener | null;
    mouseUpRedirect: MouseEventListener | null;
    lastEvent: any; // FIXME: Check if this can be more specific - DOM events or mxEventObjects!

    /**
     * Specifies if {@link KeyHandler} should invoke {@link escape} when the escape key is pressed.
     * @default true
     */
    escapeEnabled: boolean;

    /**
     * If `true`, when editing is to be stopped by way of selection changing,
     * data in diagram changing or other means stopCellEditing is invoked, and
     * changes are saved. This is implemented in a focus handler in
     * {@link CellEditorHandler}.
     * @default true
     */
    invokesStopCellEditing: boolean;

    /**
     * If `true`, pressing the enter key without pressing control or shift will stop
     * editing and accept the new value. This is used in {@link CellEditorHandler} to stop
     * cell editing. Note: You can always use F2 and escape to stop editing.
     * @default false
     */
    enterStopsCellEditing: boolean;

    /**
     * Holds the state of the mouse button.
     * @default false
     */
    isMouseDown: boolean;

    /**
     * Specifies if native double click events should be detected.
     * @default true
     */
    nativeDblClickEnabled: boolean;

    /**
     * Specifies if double taps on touch-based devices should be handled as a double click.
     * @default true
     */
    doubleTapEnabled: boolean;

    /**
     * Specifies the timeout in milliseconds for double taps and non-native double clicks.
     * @default 500
     */
    doubleTapTimeout: number;

    /**
     * Specifies the tolerance in pixels for double taps and double-clicks in quirks mode.
     * @default 25
     */
    doubleTapTolerance: number;

    /**
     * Holds the x-coordinate of the last touch event for double tap detection.
     * @default 0
     */
    lastTouchX: number;

    /**
     * Holds the x-coordinate of the last touch event for double tap detection.
     * @default 0
     */
    lastTouchY: number;

    /**
     * Holds the time of the last touch event for double click detection.
     * @default 0
     */
    lastTouchTime: number;

    /**
     * Specifies if tap and hold should be used for starting connections on touch-based devices.
     * @default true
     */
    tapAndHoldEnabled: boolean;

    /**
     * Specifies the time in milliseconds for a tap and hold.
     * @default 500
     */
    tapAndHoldDelay: number;

    /**
     * `true` if the timer for tap and hold events is running.
     * @default false
     */
    tapAndHoldInProgress: boolean;

    /**
     * `true` as long as the timer is running and the touch events stay within the given {@link tapAndHoldTolerance}.
     * @default false
     */
    tapAndHoldValid: boolean;

    /**
     * Holds the x-coordinate of the initial touch event for tap and hold.
     * @default 0
     */
    initialTouchX: number;

    /**
     * Holds the y-coordinate of the initial touch event for tap and hold.
     * @default 0
     */
    initialTouchY: number;

    /**
     * Tolerance in pixels for a move to be handled as a single click.
     * @default 4
     */
    tolerance: number;

    isNativeDblClickEnabled: () => boolean;

    getEventTolerance: () => number;

    setEventTolerance: (tolerance: number) => void;

    /**
     * Processes an escape keystroke.
     *
     * @param evt Event that represents the keystroke.
     */
    escape: (evt: Event) => void;

    /**
     * Processes a single click on an optional cell and fires a {@link click} event.
     * The click event is fired initially. If the graph is enabled and the event has not been consumed,
     * then the cell is selected using {@link selectCellForEvent} or the selection is cleared using {@link clearSelection}.
     *
     * The events consumed state is set to `true` if the corresponding {@link InternalMouseEvent} has been consumed.
     *
     * To handle a click event, use the following code.
     *
     * ```javascript
     * graph.addListener(InternalEvent.CLICK, function(sender, evt) {
     *   const e = evt.getProperty('event'); // mouse event
     *   const cell = evt.getProperty('cell'); // cell may be null
     *
     *   if (cell) {
     *     // Do something useful with cell and consume the event
     *     evt.consume();
     *   }
     * });
     * ```
     *
     * @param me {@link mxMouseEvent} that represents the single click.
     */
    click: (me: InternalMouseEvent) => boolean;

    /**
     * Processes a double click on an optional cell and fires a {@link dblclick} event. The event is fired initially.
     *
     * If the graph is enabled and the event has not been consumed, then {@link edit} is called with the given cell.
     * The event is ignored if no cell was specified.
     *
     * Example for overriding this method.
     *
     * ```javascript
     * graph.dblClick = function(evt, cell) {
     *   const mxe = new EventObject(InternalEvent.DOUBLE_CLICK, 'event', evt, 'cell', cell);
     *   this.fireEvent(mxe);
     *
     *   if (this.isEnabled() && !InternalEvent.isConsumed(evt) && !mxe.isConsumed()) {
     * 	   alert('Hello, World!');
     *     mxe.consume();
     *   }
     * }
     * ```
     *
     * Example listener for this event.
     *
     * ```javascript
     * graph.addListener(InternalEvent.DOUBLE_CLICK, function(sender, evt) {
     *   const cell = evt.getProperty('cell');
     *   // do something with the cell and consume the
     *   // event to prevent in-place editing from start
     * });
     * ```
     *
     * @param evt Mouseevent that represents the double click.
     * @param cell Optional {@link Cell} under the mouse pointer.
     */
    dblClick: (evt: MouseEvent, cell?: Cell | null) => void;

    /**
     * Handles the {@link InternalMouseEvent} by highlighting the {@link CellState}.
     *
     * @param me {@link mxMouseEvent} that represents the touch event.
     */
    tapAndHold: (me: InternalMouseEvent) => void;

    /**
     * Adds a listener to the graph event dispatch loop.
     *
     * The listener must implement the mouseDown, mouseMove and mouseUp methods as shown in the {@link InternalMouseEvent} class.
     *
     * @param listener Listener to be added to the graph event listeners.
     */
    addMouseListener: (listener: MouseListenerSet) => void;

    /**
     * Removes the specified graph listener.
     *
     * @param listener Listener to be removed from the graph event listeners.
     */
    removeMouseListener: (listener: MouseListenerSet) => void;

    /**
     * Sets the graphX and graphY properties if the given {@link InternalMouseEvent} if required and returned the event.
     *
     * @param me {@link InternalMouseEvent} to be updated.
     * @param evtName Name of the mouse event.
     */
    updateMouseEvent: (me: InternalMouseEvent, evtName: string) => InternalMouseEvent;

    /**
     * Returns the state for the given touch event.
     */
    getStateForTouchEvent: (evt: MouseEvent) => CellState | null;

    /**
     * Returns `true` if the event should be ignored in {@link fireMouseEvent}.
     */
    isEventIgnored: (
      evtName: string,
      me: InternalMouseEvent,
      sender: EventSource
    ) => boolean;

    /**
     * Hook for ignoring synthetic mouse events after touchend in Firefox.
     */
    isSyntheticEventIgnored: (
      evtName: string,
      me: InternalMouseEvent,
      sender: any
    ) => boolean;

    /**
     * Returns `true` if the event should be ignored in {@link fireMouseEvent}.
     *
     * This implementation returns `true` for select, option and input (if not of type
     * checkbox, radio, button, submit or file) event sources if the event is not
     * a mouse event or a left mouse button press event.
     *
     * @param evtName The name of the event.
     * @param me {@link InternalMouseEvent} that should be ignored.
     */
    isEventSourceIgnored: (evtName: string, me: InternalMouseEvent) => boolean;

    /**
     * Returns the {@link CellState} to be used when firing the mouse event for the given state.
     *
     * This implementation returns the given state.
     *
     * @param {@link CellState} whose event source should be returned.
     */
    getEventState: (state: CellState) => CellState;

    /**
     * Dispatches the given event in the graph event dispatch loop.
     *
     * Possible event names are {@link InternalEvent.MOUSE_DOWN}, {@link InternalEvent.MOUSE_MOVE} and
     * {@link InternalEvent.MOUSE_UP}.
     * All listeners are invoked for all events regardless of the consumed state of the event.
     *
     * @param evtName String that specifies the type of event to be dispatched.
     * @param me {@link InternalMouseEvent} to be fired.
     * @param sender Optional sender argument. Default is `this`.
     */
    fireMouseEvent: (
      evtName: string,
      me: InternalMouseEvent,
      sender?: EventSource
    ) => void;

    /**
     * Consumes the given {@link InternalMouseEvent} if it's a touchStart event.
     */
    consumeMouseEvent: (
      evtName: string,
      me: InternalMouseEvent,
      sender: EventSource
    ) => void;

    /**
     * Dispatches a {@link InternalEvent.GESTURE} event. The following example will resize the
     * cell under the mouse based on the scale property of the native touch event.
     *
     * ```javascript
     * graph.addListener(mxEvent.GESTURE, function(sender, eo) {
     *   const evt = eo.getProperty('event');
     *   const state = graph.view.getState(eo.getProperty('cell'));
     *
     *   if (graph.isEnabled() && graph.isCellResizable(state.cell) && Math.abs(1 - evt.scale) > 0.2) {
     *     const scale = graph.view.scale;
     *     const tr = graph.view.translate;
     *
     *     const w = state.width * evt.scale;
     *     const h = state.height * evt.scale;
     *     const x = state.x - (w - state.width) / 2;
     *     const y = state.y - (h - state.height) / 2;
     *
     *     const bounds = new Rectangle(graph.snap(x / scale) - tr.x,
     *     		graph.snap(y / scale) - tr.y,
     *     		graph.snap(w / scale),
     *     		graph.snap(h / scale));
     *     graph.resizeCell(state.cell, bounds);
     *     eo.consume();
     *   }
     * });
     * ```
     *
     * @param evt MouseEvent event that represents the gesture.
     * @param cell Optional {@link Cell} associated with the gesture.
     */
    fireGestureEvent: (evt: MouseEvent, cell?: Cell | null) => void;

    /**
     * Called when the size of the graph has changed.
     *
     * This implementation fires a {@link size} event after updating the clipping region of the SVG element in SVG-bases browsers.
     */
    sizeDidChange: () => void;

    /**
     * Returns `true` if the given event is a clone event.
     *
     * This implementation returns `true` if control is pressed.
     */
    isCloneEvent: (evt: MouseEvent) => boolean;

    /**
     * Hook for implementing click-through behaviour on selected cells.
     * If this method returns `true` the cell behind the selected cell will be selected.
     *
     * This implementation returns `false`.
     */
    isTransparentClickEvent: (evt: MouseEvent) => boolean;

    /**
     * Returns `true` if the given event is a toggle event.
     *
     * This implementation returns `true` if the meta key (Cmd) is pressed on Macs or if control is pressed on any other platform.
     */
    isToggleEvent: (evt: MouseEvent) => boolean;

    /**
     * Returns `true` if the given mouse event should be aligned to the grid.
     */
    isGridEnabledEvent: (evt: MouseEvent) => boolean;

    /**
     * Returns `true` if the given mouse event should be aligned to the grid.
     */
    isConstrainedEvent: (evt: MouseEvent) => boolean;

    /**
     * Returns `true` if the given mouse event should not allow any connections to be made.
     *
     * This implementation returns `false`.
     */
    isIgnoreTerminalEvent: (evt: MouseEvent) => boolean;

    /**
     * Returns an {@link Point} representing the given event in the unscaled,
     * non-translated coordinate space of {@link container} and applies the grid.
     *
     * @param evt MouseEvent that contains the mouse pointer location.
     * @param addOffset Optional boolean that specifies if the position should be
     * offset by half of the {@link gridSize}. Default is `true`.
     */
    getPointForEvent: (evt: MouseEvent, addOffset?: boolean) => Point;

    /**
     * Returns {@link escapeEnabled}.
     */
    isEscapeEnabled: () => boolean;

    /**
     * Sets {@link escapeEnabled}.
     *
     * @param value Boolean indicating if escape should be enabled.
     */
    setEscapeEnabled: (value: boolean) => void;

    /**
     * Returns {@link invokesStopCellEditing}.
     */
    isInvokesStopCellEditing: () => boolean;

    /**
     * Sets {@link invokesStopCellEditing}.
     */
    setInvokesStopCellEditing: (value: boolean) => void;

    /**
     * Returns {@link enterStopsCellEditing}.
     */
    isEnterStopsCellEditing: () => boolean;

    /**
     * Sets {@link enterStopsCellEditing}.
     */
    setEnterStopsCellEditing: (value: boolean) => void;

    /**
     * Returns the cursor value to be used for the CSS of the shape for the given event.
     *
     * This implementation calls {@link getCursorForCell}.
     *
     * @param me {@link InternalMouseEvent} whose cursor should be returned.
     */
    getCursorForMouseEvent: (me: InternalMouseEvent) => string | null;
  }
}

type PartialGraph = Pick<
  Graph,
  | 'fireEvent'
  | 'isEnabled'
  | 'getCellAt'
  | 'isCellSelected'
  | 'selectCellForEvent'
  | 'clearSelection'
  | 'isCellEditable'
  | 'isEditing'
  | 'startEditingAtCell'
  | 'getPlugin'
  | 'getView'
  | 'getContainer'
  | 'getPanDx'
  | 'getPanDy'
  | 'getEventSource'
  | 'setEventSource'
  | 'isAutoScroll'
  | 'getGraphBounds'
  | 'scrollPointToVisible'
  | 'isIgnoreScrollbars'
  | 'isTranslateToScrollPosition'
  | 'isAutoExtend'
  | 'stopEditing'
  | 'getBorder'
  | 'getMinimumContainerSize'
  | 'isResizeContainer'
  | 'doResizeContainer'
  | 'isPreferPageSize'
  | 'isPageVisible'
  | 'getPreferredPageSize'
  | 'getMinimumGraphSize'
  | 'getGridSize'
  | 'snap'
  | 'getCursorForCell'
  | 'paintBackground'
  | 'updatePageBreaks'
  | 'isPageBreaksVisible'
  | 'isSwimlaneSelectionEnabled'
  | 'getSwimlaneAt'
  | 'isSwimlane'
>;
type PartialEvents = Pick<
  Graph,
  | 'mouseListeners'
  | 'lastTouchEvent'
  | 'doubleClickCounter'
  | 'lastTouchCell'
  | 'fireDoubleClick'
  | 'tapAndHoldThread'
  | 'lastMouseX'
  | 'lastMouseY'
  | 'isMouseTrigger'
  | 'ignoreMouseEvents'
  | 'mouseMoveRedirect'
  | 'mouseUpRedirect'
  | 'lastEvent'
  | 'escapeEnabled'
  | 'invokesStopCellEditing'
  | 'enterStopsCellEditing'
  | 'isMouseDown'
  | 'nativeDblClickEnabled'
  | 'doubleTapEnabled'
  | 'doubleTapTimeout'
  | 'doubleTapTolerance'
  | 'lastTouchX'
  | 'lastTouchY'
  | 'lastTouchTime'
  | 'tapAndHoldEnabled'
  | 'tapAndHoldDelay'
  | 'tapAndHoldInProgress'
  | 'tapAndHoldValid'
  | 'initialTouchX'
  | 'initialTouchY'
  | 'tolerance'
  | 'isNativeDblClickEnabled'
  | 'getEventTolerance'
  | 'setEventTolerance'
  | 'escape'
  | 'click'
  | 'dblClick'
  | 'tapAndHold'
  | 'addMouseListener'
  | 'removeMouseListener'
  | 'updateMouseEvent'
  | 'getStateForTouchEvent'
  | 'isEventIgnored'
  | 'isSyntheticEventIgnored'
  | 'isEventSourceIgnored'
  | 'getEventState'
  | 'fireMouseEvent'
  | 'consumeMouseEvent'
  | 'fireGestureEvent'
  | 'sizeDidChange'
  | 'isCloneEvent'
  | 'isTransparentClickEvent'
  | 'isToggleEvent'
  | 'isGridEnabledEvent'
  | 'isConstrainedEvent'
  | 'isIgnoreTerminalEvent'
  | 'getPointForEvent'
  | 'isEscapeEnabled'
  | 'setEscapeEnabled'
  | 'isInvokesStopCellEditing'
  | 'setInvokesStopCellEditing'
  | 'isEnterStopsCellEditing'
  | 'setEnterStopsCellEditing'
  | 'getCursorForMouseEvent'
>;
type PartialType = PartialGraph & PartialEvents;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const EventsMixin: PartialType = {
  // TODO: Document me!
  lastTouchEvent: null,

  doubleClickCounter: 0,

  lastTouchCell: null,

  fireDoubleClick: null,

  tapAndHoldThread: null,

  lastMouseX: null,

  lastMouseY: null,

  isMouseTrigger: null,

  ignoreMouseEvents: null,

  mouseMoveRedirect: null,

  mouseUpRedirect: null,

  lastEvent: null, // FIXME: Check if this can be more specific - DOM events or mxEventObjects!

  escapeEnabled: true,

  invokesStopCellEditing: true,

  enterStopsCellEditing: false,

  isMouseDown: false,

  nativeDblClickEnabled: true,

  doubleTapEnabled: true,

  doubleTapTimeout: 500,

  doubleTapTolerance: 25,

  lastTouchX: 0,

  lastTouchY: 0,

  lastTouchTime: 0,

  tapAndHoldEnabled: true,

  tapAndHoldDelay: 500,

  tapAndHoldInProgress: false,

  tapAndHoldValid: false,

  initialTouchX: 0,

  initialTouchY: 0,

  tolerance: 4,

  isNativeDblClickEnabled() {
    return this.nativeDblClickEnabled;
  },

  getEventTolerance() {
    return this.tolerance;
  },

  setEventTolerance(tolerance: number) {
    this.tolerance = tolerance;
  },

  escape(evt) {
    this.fireEvent(new EventObject(InternalEvent.ESCAPE, { event: evt }));
  },

  click(me) {
    const evt = me.getEvent();
    let cell = me.getCell();
    const mxe = new EventObject(InternalEvent.CLICK, { event: evt, cell });

    if (me.isConsumed()) {
      mxe.consume();
    }

    this.fireEvent(mxe);

    if (this.isEnabled() && !isConsumed(evt) && !mxe.isConsumed()) {
      if (cell) {
        if (this.isTransparentClickEvent(evt)) {
          let active = false;

          const tmp = this.getCellAt(
            me.graphX,
            me.graphY,
            null,
            false,
            false,
            (state: CellState) => {
              const selected = this.isCellSelected(state.cell);
              active = active || selected;

              return (
                !active ||
                selected ||
                (state.cell !== cell && state.cell.isAncestor(cell))
              );
            }
          );

          if (tmp) {
            cell = tmp;
          }
        }
      } else if (this.isSwimlaneSelectionEnabled()) {
        cell = this.getSwimlaneAt(me.getGraphX(), me.getGraphY());

        if (cell != null && (!this.isToggleEvent(evt) || !isAltDown(evt))) {
          let temp: Cell | null = cell;
          let swimlanes = [];

          while (temp != null) {
            temp = <Cell>temp.getParent();
            const state = this.getView().getState(temp);

            if (this.isSwimlane(temp) && state != null) {
              swimlanes.push(temp);
            }
          }

          // Selects ancestors for selected swimlanes
          if (swimlanes.length > 0) {
            swimlanes = swimlanes.reverse();
            swimlanes.splice(0, 0, cell);
            swimlanes.push(cell);

            for (let i = 0; i < swimlanes.length - 1; i += 1) {
              if (this.isCellSelected(swimlanes[i])) {
                cell = swimlanes[this.isToggleEvent(evt) ? i : i + 1];
              }
            }
          }
        }
      }

      if (cell) {
        this.selectCellForEvent(cell, evt);
      } else if (!this.isToggleEvent(evt)) {
        this.clearSelection();
      }
    }
    return false;
  },

  dblClick(evt, cell = null) {
    const mxe = new EventObject(InternalEvent.DOUBLE_CLICK, { event: evt, cell });
    this.fireEvent(mxe);

    // Handles the event if it has not been consumed
    if (
      this.isEnabled() &&
      !isConsumed(evt) &&
      !mxe.isConsumed() &&
      cell &&
      this.isCellEditable(cell) &&
      !this.isEditing(cell)
    ) {
      this.startEditingAtCell(cell, evt);
      InternalEvent.consume(evt);
    }
  },

  tapAndHold(me) {
    const evt = me.getEvent();
    const mxe = new EventObject(InternalEvent.TAP_AND_HOLD, {
      event: evt,
      cell: me.getCell(),
    });

    const panningHandler = this.getPlugin('PanningHandler') as PanningHandler;
    const connectionHandler = this.getPlugin('ConnectionHandler') as ConnectionHandler;

    // LATER: Check if event should be consumed if me is consumed
    this.fireEvent(mxe);

    if (mxe.isConsumed()) {
      // Resets the state of the panning handler
      panningHandler && (panningHandler.panningTrigger = false);
    }

    // Handles the event if it has not been consumed
    if (
      this.isEnabled() &&
      !isConsumed(evt) &&
      !mxe.isConsumed() &&
      connectionHandler &&
      connectionHandler.isEnabled()
    ) {
      const cell = connectionHandler.marker.getCell(me);

      if (cell) {
        const state = this.getView().getState(cell);

        if (state) {
          connectionHandler.marker.currentColor = connectionHandler.marker.validColor;
          connectionHandler.marker.markedState = state;
          connectionHandler.marker.mark();

          connectionHandler.first = new Point(me.getGraphX(), me.getGraphY());
          connectionHandler.edgeState = connectionHandler.createEdgeState(me);
          connectionHandler.previous = state;
          connectionHandler.fireEvent(
            new EventObject(InternalEvent.START, { state: connectionHandler.previous })
          );
        }
      }
    }
  },

  addMouseListener(listener) {
    this.mouseListeners.push(listener);
  },

  removeMouseListener(listener) {
    for (let i = 0; i < this.mouseListeners.length; i += 1) {
      if (this.mouseListeners[i] === listener) {
        this.mouseListeners.splice(i, 1);
        break;
      }
    }
  },

  updateMouseEvent(me, evtName) {
    const pt = convertPoint(this.getContainer(), me.getX(), me.getY());

    me.graphX = pt.x - this.getPanDx();
    me.graphY = pt.y - this.getPanDy();

    // Searches for rectangles using method if native hit detection is disabled on shape
    if (!me.getCell() && this.isMouseDown && evtName === InternalEvent.MOUSE_MOVE) {
      const cell = this.getCellAt(pt.x, pt.y, null, true, true, (state: CellState) => {
        return (
          !state.shape ||
          state.shape.paintBackground !== this.paintBackground ||
          state.style.pointerEvents ||
          state.shape.fill !== NONE
        );
      });

      me.state = cell ? this.getView().getState(cell) : null;
    }

    return me;
  },

  getStateForTouchEvent(evt) {
    const x = getClientX(evt);
    const y = getClientY(evt);

    // Dispatches the drop event to the graph which
    // consumes and executes the source function
    const pt = convertPoint(this.getContainer(), x, y);
    const cell = this.getCellAt(pt.x, pt.y);

    return cell ? this.getView().getState(cell) : null;
  },

  isEventIgnored(evtName, me, sender) {
    const mouseEvent = isMouseEvent(me.getEvent());
    let result = false;

    // Drops events that are fired more than once
    if (me.getEvent() === this.lastEvent) {
      result = true;
    } else {
      this.lastEvent = me.getEvent();
    }

    // Installs event listeners to capture the complete gesture from the event source
    // for non-MS touch events as a workaround for all events for the same geture being
    // fired from the event source even if that was removed from the DOM.
    const eventSource = this.getEventSource();

    if (eventSource && evtName !== InternalEvent.MOUSE_MOVE) {
      InternalEvent.removeGestureListeners(
        eventSource,
        null,
        this.mouseMoveRedirect,
        this.mouseUpRedirect
      );
      this.mouseMoveRedirect = null;
      this.mouseUpRedirect = null;
      this.setEventSource(null);
    } else if (!Client.IS_GC && eventSource && me.getSource() !== eventSource) {
      result = true;
    } else if (
      eventSource &&
      Client.IS_TOUCH &&
      evtName === InternalEvent.MOUSE_DOWN &&
      !mouseEvent &&
      !isPenEvent(me.getEvent())
    ) {
      this.setEventSource(me.getSource());

      (this.mouseMoveRedirect = (evt: MouseEvent) => {
        this.fireMouseEvent(
          InternalEvent.MOUSE_MOVE,
          new InternalMouseEvent(evt, this.getStateForTouchEvent(evt))
        );
      }),
        (this.mouseUpRedirect = (evt: MouseEvent) => {
          this.fireMouseEvent(
            InternalEvent.MOUSE_UP,
            new InternalMouseEvent(evt, this.getStateForTouchEvent(evt))
          );
        }),
        InternalEvent.addGestureListeners(
          eventSource,
          null,
          this.mouseMoveRedirect,
          this.mouseUpRedirect
        );
    }

    // Factored out the workarounds for FF to make it easier to override/remove
    // Note this method has side-effects!
    if (this.isSyntheticEventIgnored(evtName, me, sender)) {
      result = true;
    }

    // Never fires mouseUp/-Down for double clicks
    if (
      !isPopupTrigger(this.lastEvent) &&
      evtName !== InternalEvent.MOUSE_MOVE &&
      this.lastEvent.detail === 2
    ) {
      return true;
    }

    // Filters out of sequence events or mixed event types during a gesture
    if (evtName === InternalEvent.MOUSE_UP && this.isMouseDown) {
      this.isMouseDown = false;
    } else if (evtName === InternalEvent.MOUSE_DOWN && !this.isMouseDown) {
      this.isMouseDown = true;
      this.isMouseTrigger = mouseEvent;
    }
    // Drops mouse events that are fired during touch gestures as a workaround for Webkit
    // and mouse events that are not in sync with the current internal button state
    else if (
      !result &&
      (((!Client.IS_FF || evtName !== InternalEvent.MOUSE_MOVE) &&
        this.isMouseDown &&
        this.isMouseTrigger !== mouseEvent) ||
        (evtName === InternalEvent.MOUSE_DOWN && this.isMouseDown) ||
        (evtName === InternalEvent.MOUSE_UP && !this.isMouseDown))
    ) {
      result = true;
    }

    if (!result && evtName === InternalEvent.MOUSE_DOWN) {
      this.lastMouseX = me.getX();
      this.lastMouseY = me.getY();
    }

    return result;
  },

  isSyntheticEventIgnored(evtName, me, sender) {
    let result = false;
    const mouseEvent = isMouseEvent(me.getEvent());

    // LATER: This does not cover all possible cases that can go wrong in FF
    if (this.ignoreMouseEvents && mouseEvent && evtName !== InternalEvent.MOUSE_MOVE) {
      this.ignoreMouseEvents = evtName !== InternalEvent.MOUSE_UP;
      result = true;
    } else if (Client.IS_FF && !mouseEvent && evtName === InternalEvent.MOUSE_UP) {
      this.ignoreMouseEvents = true;
    }
    return result;
  },

  isEventSourceIgnored(evtName, me) {
    const source = me.getSource();

    if (!source) return true;

    // @ts-ignore nodeName could exist
    const name = source.nodeName ? source.nodeName.toLowerCase() : '';
    const candidate = !isMouseEvent(me.getEvent()) || isLeftMouseButton(me.getEvent());

    return (
      evtName === InternalEvent.MOUSE_DOWN &&
      candidate &&
      (name === 'select' ||
        name === 'option' ||
        (name === 'input' &&
          // @ts-ignore type could exist
          source.type !== 'checkbox' &&
          // @ts-ignore type could exist
          source.type !== 'radio' &&
          // @ts-ignore type could exist
          source.type !== 'button' &&
          // @ts-ignore type could exist
          source.type !== 'submit' &&
          // @ts-ignore type could exist
          source.type !== 'file'))
    );
  },

  getEventState(state) {
    return state;
  },

  fireMouseEvent(evtName, me, sender) {
    sender = sender ?? (this as Graph);

    if (this.isEventSourceIgnored(evtName, me)) {
      const tooltipHandler = this.getPlugin('TooltipHandler') as TooltipHandler;
      if (tooltipHandler) {
        tooltipHandler.hide();
      }
      return;
    }

    // Updates the graph coordinates in the event
    me = this.updateMouseEvent(me, evtName);

    // Detects and processes double taps for touch-based devices which do not have native double click events
    // or where detection of double click is not always possible (quirks, IE10+). Note that this can only handle
    // double clicks on cells because the sequence of events in IE prevents detection on the background, it fires
    // two mouse ups, one of which without a cell but no mousedown for the second click which means we cannot
    // detect which mouseup(s) are part of the first click, ie we do not know when the first click ends.
    if (
      (!this.nativeDblClickEnabled && !isPopupTrigger(me.getEvent())) ||
      (this.doubleTapEnabled &&
        Client.IS_TOUCH &&
        (isTouchEvent(me.getEvent()) || isPenEvent(me.getEvent())))
    ) {
      const currentTime = new Date().getTime();

      if (evtName === InternalEvent.MOUSE_DOWN) {
        if (
          this.lastTouchEvent &&
          this.lastTouchEvent !== me.getEvent() &&
          currentTime - this.lastTouchTime < this.doubleTapTimeout &&
          Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance &&
          Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance &&
          this.doubleClickCounter < 2
        ) {
          this.doubleClickCounter += 1;
          let doubleClickFired = false;

          if (evtName === InternalEvent.MOUSE_UP) {
            if (me.getCell() === this.lastTouchCell && this.lastTouchCell) {
              this.lastTouchTime = 0;
              const cell = this.lastTouchCell;
              this.lastTouchCell = null;

              this.dblClick(me.getEvent(), cell);
              doubleClickFired = true;
            }
          } else {
            this.fireDoubleClick = true;
            this.lastTouchTime = 0;
          }

          if (doubleClickFired) {
            InternalEvent.consume(me.getEvent());
            return;
          }
        } else if (!this.lastTouchEvent || this.lastTouchEvent !== me.getEvent()) {
          this.lastTouchCell = me.getCell();
          this.lastTouchX = me.getX();
          this.lastTouchY = me.getY();
          this.lastTouchTime = currentTime;
          this.lastTouchEvent = me.getEvent();
          this.doubleClickCounter = 0;
        }
      } else if (
        (this.isMouseDown || evtName === InternalEvent.MOUSE_UP) &&
        this.fireDoubleClick
      ) {
        this.fireDoubleClick = false;
        const cell = this.lastTouchCell;
        this.lastTouchCell = null;
        this.isMouseDown = false;

        // Workaround for Chrome/Safari not firing native double click events for double touch on background
        const valid =
          cell ||
          ((isTouchEvent(me.getEvent()) || isPenEvent(me.getEvent())) &&
            (Client.IS_GC || Client.IS_SF));

        if (
          valid &&
          Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance &&
          Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance
        ) {
          this.dblClick(me.getEvent(), cell);
        } else {
          InternalEvent.consume(me.getEvent());
        }
        return;
      }
    }

    if (!this.isEventIgnored(evtName, me, sender)) {
      const state = me.getState();

      // Updates the event state via getEventState
      me.state = state ? this.getEventState(state) : null;
      this.fireEvent(
        new EventObject(InternalEvent.FIRE_MOUSE_EVENT, { eventName: evtName, event: me })
      );

      if (Client.IS_SF || Client.IS_GC || me.getEvent().target !== this.getContainer()) {
        const container = this.getContainer();

        if (
          evtName === InternalEvent.MOUSE_MOVE &&
          this.isMouseDown &&
          this.isAutoScroll() &&
          !isMultiTouchEvent(me.getEvent())
        ) {
          this.scrollPointToVisible(me.getGraphX(), me.getGraphY(), this.isAutoExtend());
        } else if (
          evtName === InternalEvent.MOUSE_UP &&
          this.isIgnoreScrollbars() &&
          this.isTranslateToScrollPosition() &&
          (container.scrollLeft !== 0 || container.scrollTop !== 0)
        ) {
          const s = this.getView().scale;
          const tr = this.getView().translate;
          this.getView().setTranslate(
            tr.x - container.scrollLeft / s,
            tr.y - container.scrollTop / s
          );
          container.scrollLeft = 0;
          container.scrollTop = 0;
        }

        const mouseListeners = this.mouseListeners;

        // Does not change returnValue in Opera
        if (!me.getEvent().preventDefault) {
          me.getEvent().returnValue = true;
        }

        for (const l of mouseListeners) {
          if (evtName === InternalEvent.MOUSE_DOWN) {
            l.mouseDown(sender, me);
          } else if (evtName === InternalEvent.MOUSE_MOVE) {
            l.mouseMove(sender, me);
          } else if (evtName === InternalEvent.MOUSE_UP) {
            l.mouseUp(sender, me);
          }
        }

        // Invokes the click handler
        if (evtName === InternalEvent.MOUSE_UP) {
          this.click(me);
        }
      }

      // Detects tapAndHold events using a timer
      if (
        (isTouchEvent(me.getEvent()) || isPenEvent(me.getEvent())) &&
        evtName === InternalEvent.MOUSE_DOWN &&
        this.tapAndHoldEnabled &&
        !this.tapAndHoldInProgress
      ) {
        this.tapAndHoldInProgress = true;
        this.initialTouchX = me.getGraphX();
        this.initialTouchY = me.getGraphY();

        const handler = () => {
          if (this.tapAndHoldValid) {
            this.tapAndHold(me);
          }

          this.tapAndHoldInProgress = false;
          this.tapAndHoldValid = false;
        };

        if (this.tapAndHoldThread) {
          window.clearTimeout(this.tapAndHoldThread);
        }

        this.tapAndHoldThread = window.setTimeout(handler, this.tapAndHoldDelay);
        this.tapAndHoldValid = true;
      } else if (evtName === InternalEvent.MOUSE_UP) {
        this.tapAndHoldInProgress = false;
        this.tapAndHoldValid = false;
      } else if (this.tapAndHoldValid) {
        this.tapAndHoldValid =
          Math.abs(this.initialTouchX - me.getGraphX()) < this.tolerance &&
          Math.abs(this.initialTouchY - me.getGraphY()) < this.tolerance;
      }

      const cellEditorHandler = this.getPlugin('CellEditorHandler') as CellEditorHandler;

      // Stops editing for all events other than from cellEditorHandler
      if (
        evtName === InternalEvent.MOUSE_DOWN &&
        this.isEditing() &&
        !cellEditorHandler?.isEventSource(me.getEvent())
      ) {
        this.stopEditing(!this.isInvokesStopCellEditing());
      }

      this.consumeMouseEvent(evtName, me, sender);
    }
  },

  consumeMouseEvent(evtName, me, sender) {
    sender = sender ?? this;

    // Workaround for duplicate click in Windows 8 with Chrome/FF/Opera with touch
    if (evtName === InternalEvent.MOUSE_DOWN && isTouchEvent(me.getEvent())) {
      me.consume(false);
    }
  },

  fireGestureEvent(evt, cell = null) {
    // Resets double tap event handling when gestures take place
    this.lastTouchTime = 0;
    this.fireEvent(new EventObject(InternalEvent.GESTURE, { event: evt, cell }));
  },

  sizeDidChange() {
    const bounds = this.getGraphBounds();

    const border = this.getBorder();

    let width = Math.max(0, bounds.x) + bounds.width + 2 * border;
    let height = Math.max(0, bounds.y) + bounds.height + 2 * border;

    const minimumContainerSize = this.getMinimumContainerSize();

    if (minimumContainerSize) {
      width = Math.max(width, minimumContainerSize.width);
      height = Math.max(height, minimumContainerSize.height);
    }

    if (this.isResizeContainer()) {
      this.doResizeContainer(width, height);
    }

    if (this.isPreferPageSize() || this.isPageVisible()) {
      const size = this.getPreferredPageSize(
        bounds,
        Math.max(1, width),
        Math.max(1, height)
      );

      width = size.width * this.getView().scale;
      height = size.height * this.getView().scale;
    }

    const minimumGraphSize = this.getMinimumGraphSize();

    if (minimumGraphSize) {
      width = Math.max(width, minimumGraphSize.width * this.getView().scale);
      height = Math.max(height, minimumGraphSize.height * this.getView().scale);
    }

    width = Math.ceil(width);
    height = Math.ceil(height);

    // @ts-ignore
    const root = this.getView().getDrawPane().ownerSVGElement;

    if (root) {
      root.style.minWidth = `${Math.max(1, width)}px`;
      root.style.minHeight = `${Math.max(1, height)}px`;
      root.style.width = '100%';
      root.style.height = '100%';
    }

    this.updatePageBreaks(this.isPageBreaksVisible(), width, height);

    this.fireEvent(new EventObject(InternalEvent.SIZE, { bounds }));
  },

  isCloneEvent(evt) {
    return isControlDown(evt);
  },

  isTransparentClickEvent(evt) {
    return false;
  },

  isToggleEvent(evt) {
    return Client.IS_MAC ? isMetaDown(evt) : isControlDown(evt);
  },

  isGridEnabledEvent(evt) {
    return !isAltDown(evt);
  },

  isConstrainedEvent(evt) {
    return isShiftDown(evt);
  },

  isIgnoreTerminalEvent(_evt) {
    return false;
  },

  getPointForEvent(evt, addOffset = true) {
    const p = convertPoint(this.getContainer(), getClientX(evt), getClientY(evt));
    const s = this.getView().scale;
    const tr = this.getView().translate;
    const off = addOffset ? this.getGridSize() / 2 : 0;

    p.x = this.snap(p.x / s - tr.x - off);
    p.y = this.snap(p.y / s - tr.y - off);

    return p;
  },

  isEscapeEnabled() {
    return this.escapeEnabled;
  },

  setEscapeEnabled(value) {
    this.escapeEnabled = value;
  },

  isInvokesStopCellEditing() {
    return this.invokesStopCellEditing;
  },

  setInvokesStopCellEditing(value) {
    this.invokesStopCellEditing = value;
  },

  isEnterStopsCellEditing() {
    return this.enterStopsCellEditing;
  },

  setEnterStopsCellEditing(value) {
    this.enterStopsCellEditing = value;
  },

  getCursorForMouseEvent(me) {
    const cell = me.getCell();
    return cell ? this.getCursorForCell(cell) : null;
  },
};

mixInto(Graph)(EventsMixin);
