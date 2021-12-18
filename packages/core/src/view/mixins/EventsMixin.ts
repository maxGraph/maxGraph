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
} from '../../util/eventUtils';
import CellState from '../cell/CellState';
import Cell from '../cell/Cell';
import PanningHandler from '../handler/PanningHandler';
import ConnectionHandler from '../handler/ConnectionHandler';
import Point from '../geometry/Point';
import { convertPoint, mixInto } from '../../util/utils';
import { NONE, SHAPE } from '../../util/constants';
import Client from '../../Client';
import EventSource from '../event/EventSource';
import CellEditor from '../handler/CellEditor';
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
    escapeEnabled: boolean;
    invokesStopCellEditing: boolean;
    enterStopsCellEditing: boolean;
    isMouseDown: boolean;
    nativeDblClickEnabled: boolean;
    doubleTapEnabled: boolean;
    doubleTapTimeout: number;
    doubleTapTolerance: number;
    lastTouchX: number;
    lastTouchY: number;
    lastTouchTime: number;
    tapAndHoldEnabled: boolean;
    tapAndHoldDelay: number;
    tapAndHoldInProgress: boolean;
    tapAndHoldValid: boolean;
    initialTouchX: number;
    initialTouchY: number;
    tolerance: number;

    isNativeDblClickEnabled: () => boolean;
    getEventTolerance: () => number;
    setEventTolerance: (tolerance: number) => void;
    escape: (evt: Event) => void;
    click: (me: InternalMouseEvent) => boolean;
    dblClick: (evt: MouseEvent, cell?: Cell | null) => void;
    tapAndHold: (me: InternalMouseEvent) => void;
    addMouseListener: (listener: MouseListenerSet) => void;
    removeMouseListener: (listener: MouseListenerSet) => void;
    updateMouseEvent: (me: InternalMouseEvent, evtName: string) => InternalMouseEvent;
    getStateForTouchEvent: (evt: MouseEvent) => CellState | null;
    isEventIgnored: (
      evtName: string,
      me: InternalMouseEvent,
      sender: EventSource
    ) => boolean;
    isSyntheticEventIgnored: (
      evtName: string,
      me: InternalMouseEvent,
      sender: any
    ) => boolean;
    isEventSourceIgnored: (evtName: string, me: InternalMouseEvent) => boolean;
    getEventState: (state: CellState) => CellState;
    fireMouseEvent: (
      evtName: string,
      me: InternalMouseEvent,
      sender?: EventSource
    ) => void;
    consumeMouseEvent: (
      evtName: string,
      me: InternalMouseEvent,
      sender: EventSource
    ) => void;
    fireGestureEvent: (evt: MouseEvent, cell?: Cell | null) => void;
    sizeDidChange: () => void;
    isCloneEvent: (evt: MouseEvent) => boolean;
    isTransparentClickEvent: (evt: MouseEvent) => boolean;
    isToggleEvent: (evt: MouseEvent) => boolean;
    isGridEnabledEvent: (evt: MouseEvent) => boolean;
    isConstrainedEvent: (evt: MouseEvent) => boolean;
    isIgnoreTerminalEvent: (evt: MouseEvent) => boolean;
    getPointForEvent: (evt: MouseEvent, addOffset?: boolean) => Point;
    isEscapeEnabled: () => boolean;
    setEscapeEnabled: (value: boolean) => void;
    isInvokesStopCellEditing: () => boolean;
    setInvokesStopCellEditing: (value: boolean) => void;
    isEnterStopsCellEditing: () => boolean;
    setEnterStopsCellEditing: (value: boolean) => void;
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
  | 'isEditing'
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
  /**
   * Holds the mouse event listeners. See {@link fireMouseEvent}.
   */
  mouseListeners: [],

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

  /**
   * Specifies if {@link mxKeyHandler} should invoke {@link escape} when the escape key
   * is pressed.
   * @default true
   */
  escapeEnabled: true,

  /**
   * If `true`, when editing is to be stopped by way of selection changing,
   * data in diagram changing or other means stopCellEditing is invoked, and
   * changes are saved. This is implemented in a focus handler in
   * {@link CellEditor}.
   * @default true
   */
  invokesStopCellEditing: true,

  /**
   * If `true`, pressing the enter key without pressing control or shift will stop
   * editing and accept the new value. This is used in {@link CellEditor} to stop
   * cell editing. Note: You can always use F2 and escape to stop editing.
   * @default false
   */
  enterStopsCellEditing: false,

  /**
   * Holds the state of the mouse button.
   */
  isMouseDown: false,

  /**
   * Specifies if native double click events should be detected.
   * @default true
   */
  nativeDblClickEnabled: true,

  /**
   * Specifies if double taps on touch-based devices should be handled as a
   * double click.
   * @default true
   */
  doubleTapEnabled: true,

  /**
   * Specifies the timeout in milliseconds for double taps and non-native double clicks.
   * @default 500
   */
  doubleTapTimeout: 500,

  /**
   * Specifies the tolerance in pixels for double taps and double clicks in quirks mode.
   * @default 25
   */
  doubleTapTolerance: 25,

  /**
   * Holds the x-coordinate of the last touch event for double tap detection.
   */
  lastTouchX: 0,

  /**
   * Holds the x-coordinate of the last touch event for double tap detection.
   */
  lastTouchY: 0,

  /**
   * Holds the time of the last touch event for double click detection.
   */
  lastTouchTime: 0,

  /**
   * Specifies if tap and hold should be used for starting connections on touch-based
   * devices.
   * @default true
   */
  tapAndHoldEnabled: true,

  /**
   * Specifies the time in milliseconds for a tap and hold.
   * @default 500
   */
  tapAndHoldDelay: 500,

  /**
   * `True` if the timer for tap and hold events is running.
   */
  tapAndHoldInProgress: false,

  /**
   * `True` as long as the timer is running and the touch events
   * stay within the given {@link tapAndHoldTolerance}.
   */
  tapAndHoldValid: false,

  /**
   * Holds the x-coordinate of the initial touch event for tap and hold.
   */
  initialTouchX: 0,

  /**
   * Holds the y-coordinate of the initial touch event for tap and hold.
   */
  initialTouchY: 0,

  /**
   * Tolerance in pixels for a move to be handled as a single click.
   * @default 4
   */
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

  /*****************************************************************************
   * Group: Event processing
   *****************************************************************************/

  /**
   * Processes an escape keystroke.
   *
   * @param evt Mouseevent that represents the keystroke.
   */
  escape(evt) {
    this.fireEvent(new EventObject(InternalEvent.ESCAPE, 'event', evt));
  },

  /**
   * Processes a singleclick on an optional cell and fires a {@link click} event.
   * The click event is fired initially. If the graph is enabled and the
   * event has not been consumed, then the cell is selected using
   * {@link selectCellForEvent} or the selection is cleared using
   * {@link clearSelection}. The events consumed state is set to true if the
   * corresponding {@link InternalMouseEvent} has been consumed.
   *
   * To handle a click event, use the following code.
   *
   * ```javascript
   * graph.addListener(mxEvent.CLICK, function(sender, evt)
   * {
   *   var e = evt.getProperty('event'); // mouse event
   *   var cell = evt.getProperty('cell'); // cell may be null
   *
   *   if (cell != null)
   *   {
   *     // Do something useful with cell and consume the event
   *     evt.consume();
   *   }
   * });
   * ```
   *
   * @param me {@link mxMouseEvent} that represents the single click.
   */
  click(me) {
    const evt = me.getEvent();
    let cell = me.getCell();
    const mxe = new EventObject(InternalEvent.CLICK, 'event', evt, 'cell', cell);

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
        /* comment out swimlane for now... perhaps make it a plugin?
      } else if (this.swimlane.isSwimlaneSelectionEnabled()) {
        cell = this.swimlane.getSwimlaneAt(me.getGraphX(), me.getGraphY());

        if (cell != null && (!this.isToggleEvent(evt) || !isAltDown(evt))) {
          let temp = cell;
          let swimlanes = [];

          while (temp != null) {
            temp = temp.getParent();
            const state = this.getView().getState(temp);

            if (this.swimlane.isSwimlane(temp) && state != null) {
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
        }*/
      }

      if (cell) {
        this.selectCellForEvent(cell, evt);
      } else if (!this.isToggleEvent(evt)) {
        this.clearSelection();
      }
    }
    return false;
  },

  /**
   * Processes a doubleclick on an optional cell and fires a {@link dblclick}
   * event. The event is fired initially. If the graph is enabled and the
   * event has not been consumed, then {@link edit} is called with the given
   * cell. The event is ignored if no cell was specified.
   *
   * Example for overriding this method.
   *
   * ```javascript
   * graph.dblClick = function(evt, cell)
   * {
   *   var mxe = new mxEventObject(mxEvent.DOUBLE_CLICK, 'event', evt, 'cell', cell);
   *   this.fireEvent(mxe);
   *
   *   if (this.isEnabled() && !mxEvent.isConsumed(evt) && !mxe.isConsumed())
   *   {
   * 	   mxUtils.alert('Hello, World!');
   *     mxe.consume();
   *   }
   * }
   * ```
   *
   * Example listener for this event.
   *
   * ```javascript
   * graph.addListener(mxEvent.DOUBLE_CLICK, function(sender, evt)
   * {
   *   var cell = evt.getProperty('cell');
   *   // do something with the cell and consume the
   *   // event to prevent in-place editing from start
   * });
   * ```
   *
   * @param evt Mouseevent that represents the doubleclick.
   * @param cell Optional {@link Cell} under the mousepointer.
   */
  dblClick(evt, cell = null) {
    const mxe = new EventObject(InternalEvent.DOUBLE_CLICK, { event: evt, cell: cell });
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

  /**
   * Handles the {@link InternalMouseEvent} by highlighting the {@link CellState}.
   *
   * @param me {@link mxMouseEvent} that represents the touch event.
   * @param state Optional {@link CellState} that is associated with the event.
   */
  tapAndHold(me) {
    const evt = me.getEvent();
    const mxe = new EventObject(
      InternalEvent.TAP_AND_HOLD,
      'event',
      evt,
      'cell',
      me.getCell()
    );

    const panningHandler = this.getPlugin('PanningHandler') as PanningHandler;
    const connectionHandler = this.getPlugin('ConnectionHandler') as ConnectionHandler;

    // LATER: Check if event should be consumed if me is consumed
    this.fireEvent(mxe);

    if (mxe.isConsumed()) {
      // Resets the state of the panning handler
      panningHandler.panningTrigger = false;
    }

    // Handles the event if it has not been consumed
    if (
      this.isEnabled() &&
      !isConsumed(evt) &&
      !mxe.isConsumed() &&
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
            new EventObject(InternalEvent.START, 'state', connectionHandler.previous)
          );
        }
      }
    }
  },

  /*****************************************************************************
   * Group: Graph events
   *****************************************************************************/

  /**
   * Adds a listener to the graph event dispatch loop. The listener
   * must implement the mouseDown, mouseMove and mouseUp methods
   * as shown in the {@link InternalMouseEvent} class.
   *
   * @param listener Listener to be added to the graph event listeners.
   */
  addMouseListener(listener) {
    this.mouseListeners.push(listener);
  },

  /**
   * Removes the specified graph listener.
   *
   * @param listener Listener to be removed from the graph event listeners.
   */
  removeMouseListener(listener) {
    for (let i = 0; i < this.mouseListeners.length; i += 1) {
      if (this.mouseListeners[i] === listener) {
        this.mouseListeners.splice(i, 1);
        break;
      }
    }
  },

  /**
   * Sets the graphX and graphY properties if the given {@link InternalMouseEvent} if
   * required and returned the event.
   *
   * @param me {@link mxMouseEvent} to be updated.
   * @param evtName Name of the mouse event.
   */
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

  /**
   * Returns the state for the given touch event.
   */
  getStateForTouchEvent(evt) {
    const x = getClientX(evt);
    const y = getClientY(evt);

    // Dispatches the drop event to the graph which
    // consumes and executes the source function
    const pt = convertPoint(this.getContainer(), x, y);
    const cell = this.getCellAt(pt.x, pt.y);

    return cell ? this.getView().getState(cell) : null;
  },

  /**
   * Returns true if the event should be ignored in {@link fireMouseEvent}.
   */
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

  /**
   * Hook for ignoring synthetic mouse events after touchend in Firefox.
   */
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

  /**
   * Returns true if the event should be ignored in {@link fireMouseEvent}. This
   * implementation returns true for select, option and input (if not of type
   * checkbox, radio, button, submit or file) event sources if the event is not
   * a mouse event or a left mouse button press event.
   *
   * @param evtName The name of the event.
   * @param me {@link mxMouseEvent} that should be ignored.
   */
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

  /**
   * Returns the {@link CellState} to be used when firing the mouse event for the
   * given state. This implementation returns the given state.
   *
   * {@link CellState} - State whose event source should be returned.
   */
  getEventState(state) {
    return state;
  },

  /**
   * Dispatches the given event in the graph event dispatch loop. Possible
   * event names are {@link InternalEvent.MOUSE_DOWN}, {@link InternalEvent.MOUSE_MOVE} and
   * {@link InternalEvent.MOUSE_UP}. All listeners are invoked for all events regardless
   * of the consumed state of the event.
   *
   * @param evtName String that specifies the type of event to be dispatched.
   * @param me {@link mxMouseEvent} to be fired.
   * @param sender Optional sender argument. Default is `this`.
   */
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
        new EventObject(InternalEvent.FIRE_MOUSE_EVENT, 'eventName', evtName, 'event', me)
      );

      if (
        Client.IS_SF ||
        Client.IS_GC ||
        me.getEvent().target !== this.getContainer()
      ) {
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

      const cellEditor = this.getPlugin('CellEditor') as CellEditor;

      // Stops editing for all events other than from cellEditor
      if (
        evtName === InternalEvent.MOUSE_DOWN &&
        this.isEditing() &&
        !cellEditor.isEventSource(me.getEvent())
      ) {
        this.stopEditing(!this.isInvokesStopCellEditing());
      }

      this.consumeMouseEvent(evtName, me, sender);
    }
  },

  /**
   * Consumes the given {@link InternalMouseEvent} if it's a touchStart event.
   */
  consumeMouseEvent(evtName, me, sender) {
    sender = sender ?? this;

    // Workaround for duplicate click in Windows 8 with Chrome/FF/Opera with touch
    if (evtName === InternalEvent.MOUSE_DOWN && isTouchEvent(me.getEvent())) {
      me.consume(false);
    }
  },

  /**
   * Dispatches a {@link InternalEvent.GESTURE} event. The following example will resize the
   * cell under the mouse based on the scale property of the native touch event.
   *
   * ```javascript
   * graph.addListener(mxEvent.GESTURE, function(sender, eo)
   * {
   *   var evt = eo.getProperty('event');
   *   var state = graph.view.getState(eo.getProperty('cell'));
   *
   *   if (graph.isEnabled() && graph.isCellResizable(state.cell) && Math.abs(1 - evt.scale) > 0.2)
   *   {
   *     var scale = graph.view.scale;
   *     var tr = graph.view.translate;
   *
   *     var w = state.width * evt.scale;
   *     var h = state.height * evt.scale;
   *     var x = state.x - (w - state.width) / 2;
   *     var y = state.y - (h - state.height) / 2;
   *
   *     var bounds = new mxRectangle(graph.snap(x / scale) - tr.x,
   *     		graph.snap(y / scale) - tr.y, graph.snap(w / scale), graph.snap(h / scale));
   *     graph.resizeCell(state.cell, bounds);
   *     eo.consume();
   *   }
   * });
   * ```
   *
   * @param evt Gestureend event that represents the gesture.
   * @param cell Optional {@link Cell} associated with the gesture.
   */
  fireGestureEvent(evt, cell = null) {
    // Resets double tap event handling when gestures take place
    this.lastTouchTime = 0;
    this.fireEvent(new EventObject(InternalEvent.GESTURE, 'event', evt, 'cell', cell));
  },

  /**
   * Called when the size of the graph has changed. This implementation fires
   * a {@link size} event after updating the clipping region of the SVG element in
   * SVG-bases browsers.
   */
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

    this.fireEvent(new EventObject(InternalEvent.SIZE, 'bounds', bounds));
  },

  /*****************************************************************************
   * Group: Graph display
   *****************************************************************************/

  /**
   * Returns true if the given event is a clone event. This implementation
   * returns true if control is pressed.
   */
  isCloneEvent(evt) {
    return isControlDown(evt);
  },

  /**
   * Hook for implementing click-through behaviour on selected cells. If this
   * returns true the cell behind the selected cell will be selected. This
   * implementation returns false;
   */
  isTransparentClickEvent(evt) {
    return false;
  },

  /**
   * Returns true if the given event is a toggle event. This implementation
   * returns true if the meta key (Cmd) is pressed on Macs or if control is
   * pressed on any other platform.
   */
  isToggleEvent(evt) {
    return Client.IS_MAC ? isMetaDown(evt) : isControlDown(evt);
  },

  /**
   * Returns true if the given mouse event should be aligned to the grid.
   */
  isGridEnabledEvent(evt) {
    return !isAltDown(evt);
  },

  /**
   * Returns true if the given mouse event should be aligned to the grid.
   */
  isConstrainedEvent(evt) {
    return isShiftDown(evt);
  },

  /**
   * Returns true if the given mouse event should not allow any connections to be
   * made. This implementation returns false.
   */
  isIgnoreTerminalEvent(evt) {
    return false;
  },

  /**
   * Returns an {@link Point} representing the given event in the unscaled,
   * non-translated coordinate space of {@link container} and applies the grid.
   *
   * @param evt Mousevent that contains the mouse pointer location.
   * @param addOffset Optional boolean that specifies if the position should be
   * offset by half of the {@link gridSize}. Default is `true`.
   */
  getPointForEvent(evt, addOffset = true) {
    const p = convertPoint(this.getContainer(), getClientX(evt), getClientY(evt));
    const s = this.getView().scale;
    const tr = this.getView().translate;
    const off = addOffset ? this.getGridSize() / 2 : 0;

    p.x = this.snap(p.x / s - tr.x - off);
    p.y = this.snap(p.y / s - tr.y - off);

    return p;
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Returns {@link escapeEnabled}.
   */
  isEscapeEnabled() {
    return this.escapeEnabled;
  },

  /**
   * Sets {@link escapeEnabled}.
   *
   * @param enabled Boolean indicating if escape should be enabled.
   */
  setEscapeEnabled(value) {
    this.escapeEnabled = value;
  },

  /**
   * Returns {@link invokesStopCellEditing}.
   */
  isInvokesStopCellEditing() {
    return this.invokesStopCellEditing;
  },

  /**
   * Sets {@link invokesStopCellEditing}.
   */
  setInvokesStopCellEditing(value) {
    this.invokesStopCellEditing = value;
  },

  /**
   * Returns {@link enterStopsCellEditing}.
   */
  isEnterStopsCellEditing() {
    return this.enterStopsCellEditing;
  },

  /**
   * Sets {@link enterStopsCellEditing}.
   */
  setEnterStopsCellEditing(value) {
    this.enterStopsCellEditing = value;
  },

  /*****************************************************************************
   * Group: Graph appearance
   *****************************************************************************/

  /**
   * Returns the cursor value to be used for the CSS of the shape for the
   * given event. This implementation calls {@link getCursorForCell}.
   *
   * @param me {@link mxMouseEvent} whose cursor should be returned.
   */
  getCursorForMouseEvent(me) {
    const cell = me.getCell();
    return cell ? this.getCursorForCell(cell) : null;
  },
};

mixInto(Graph)(EventsMixin);
