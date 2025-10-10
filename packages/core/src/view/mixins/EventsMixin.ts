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

import InternalMouseEvent from '../event/InternalMouseEvent.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
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
} from '../../util/EventUtils.js';
import CellState from '../cell/CellState.js';
import Cell from '../cell/Cell.js';
import type PanningHandler from '../plugins/PanningHandler.js';
import type ConnectionHandler from '../plugins/ConnectionHandler.js';
import Point from '../geometry/Point.js';
import { convertPoint } from '../../util/styleUtils.js';
import { NONE } from '../../util/Constants.js';
import Client from '../../Client.js';
import type CellEditorHandler from '../plugins/CellEditorHandler.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type TooltipHandler from '../plugins/TooltipHandler.js';

type PartialGraph = Pick<
  AbstractGraph,
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
  AbstractGraph,
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
export const EventsMixin: PartialType = {
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

    const panningHandler = this.getPlugin<PanningHandler>('PanningHandler');
    const connectionHandler = this.getPlugin<ConnectionHandler>('ConnectionHandler');

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

      this.mouseMoveRedirect = (evt: MouseEvent) => {
        this.fireMouseEvent(
          InternalEvent.MOUSE_MOVE,
          new InternalMouseEvent(evt, this.getStateForTouchEvent(evt))
        );
      };
      this.mouseUpRedirect = (evt: MouseEvent) => {
        this.fireMouseEvent(
          InternalEvent.MOUSE_UP,
          new InternalMouseEvent(evt, this.getStateForTouchEvent(evt))
        );
      };
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
    sender = sender ?? (this as AbstractGraph);

    if (this.isEventSourceIgnored(evtName, me)) {
      const tooltipHandler = this.getPlugin<TooltipHandler>('TooltipHandler');
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
          switch (evtName) {
            case InternalEvent.MOUSE_DOWN: {
              l.mouseDown(sender, me);

              break;
            }
            case InternalEvent.MOUSE_MOVE: {
              l.mouseMove(sender, me);

              break;
            }
            case InternalEvent.MOUSE_UP: {
              l.mouseUp(sender, me);

              break;
            }
            // No default
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

      const cellEditorHandler = this.getPlugin<CellEditorHandler>('CellEditorHandler');

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
