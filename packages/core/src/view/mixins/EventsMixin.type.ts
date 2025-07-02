/*
Copyright 2024-present The maxGraph project Contributors

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

import type { MouseEventListener, MouseListenerSet } from '../../types.js';
import type Cell from '../cell/Cell.js';
import type InternalMouseEvent from '../event/InternalMouseEvent.js';
import type CellState from '../cell/CellState.js';
import type EventSource from '../event/EventSource.js';
import type Point from '../geometry/Point.js';

declare module '../AbstractGraph' {
  interface AbstractGraph {
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
     * If `true`, pressing the enter key without pressing control or shift will stop editing and accept the new value.
     * This is used in {@link CellEditorHandler} to stop cell editing.
     *
     * Note: The F2 (accept change) and escape keys (undo change) can always be used to stop editing.
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
     * @param me {@link InternalMouseEvent} that represents the touch event.
     */
    tapAndHold: (me: InternalMouseEvent) => void;

    /**
     * Adds a listener to the graph event dispatch loop.
     *
     * The listener must implement the `mouseDown`, `mouseMove` and `mouseUp` methods as shown in the {@link InternalMouseEvent} class.
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
