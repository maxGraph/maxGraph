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

import InternalMouseEvent from './InternalMouseEvent';
import Client from '../../Client';
import { isConsumed } from '../../util/EventUtils';
import CellState from '../cell/CellState';
import {
  KeyboardEventListener,
  Listenable,
  MouseEventListener,
  TouchEventListener,
} from '../../types';
import { Graph } from '../Graph';

// Checks if passive event listeners are supported
// see https://github.com/Modernizr/Modernizr/issues/1894
let supportsPassive = false;


try {
  document.addEventListener(
    'test',
    () => {
      return;
    },
    Object.defineProperty &&
      Object.defineProperty({}, 'passive', {
        get: () => {
          supportsPassive = true;
        },
      })
  );
} catch (e) {
  // ignore
}

/**
 * @class InternalEvent
 *
 * Cross-browser DOM event support. For internal event handling,
 * {@link EventSource} and the graph event dispatch loop in {@link graph} are used.
 *
 * ### Memory Leaks:
 *
 * Use this class for adding and removing listeners to/from DOM nodes. The
 * {@link removeAllListeners} function is provided to remove all listeners that
 * have been added using {@link addListener}. The function should be invoked when
 * the last reference is removed in the JavaScript code, typically when the
 * referenced DOM node is removed from the DOM.
 */
class InternalEvent {
  /**
   * Binds the function to the specified event on the given element. Use
   * {@link mxUtils.bind} in order to bind the "this" keyword inside the function
   * to a given execution scope.
   */
  static addListener(
    element: Listenable,
    eventName: string,
    funct: MouseEventListener | TouchEventListener | KeyboardEventListener,
    capture = false,
  ) {
    element.addEventListener(
      eventName,
      funct as EventListener,
      supportsPassive ? { passive: false, capture: capture } : capture
    );

    if (!element.mxListenerList) {
      element.mxListenerList = [];
    }

    const entry = { name: eventName, f: funct };
    element.mxListenerList.push(entry);
  }

  /**
   * Removes the specified listener from the given element.
   */
  static removeListener(
    element: Listenable,
    eventName: string,
    funct: MouseEventListener | TouchEventListener | KeyboardEventListener
  ) {
    element.removeEventListener(eventName, funct as EventListener, false);

    if (element.mxListenerList) {
      const listenerCount = element.mxListenerList.length;

      for (let i = 0; i < listenerCount; i += 1) {
        const entry = element.mxListenerList[i];

        if (entry.f === funct) {
          element.mxListenerList.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Removes all listeners from the given element.
   */
  static removeAllListeners(element: Listenable) {
    const list = element.mxListenerList;

    if (list) {
      while (list.length > 0) {
        const entry = list[0];
        InternalEvent.removeListener(element, entry.name, entry.f);
      }
    }
  }

  /**
   * Adds the given listeners for touch, mouse and/or pointer events. If
   * <Client.IS_POINTER> is true then pointer events will be registered,
   * else the respective mouse events will be registered. If <Client.IS_POINTER>
   * is false and <Client.IS_TOUCH> is true then the respective touch events
   * will be registered as well as the mouse events.
   */
  static addGestureListeners(
    node: Listenable,
    startListener: MouseEventListener | null = null,
    moveListener: MouseEventListener | null = null,
    endListener: MouseEventListener | null = null
  ) {
    if (startListener) {
      InternalEvent.addListener(
        node,
        Client.IS_POINTER ? 'pointerdown' : 'mousedown',
        startListener
      );
    }

    if (moveListener) {
      InternalEvent.addListener(
        node,
        Client.IS_POINTER ? 'pointermove' : 'mousemove',
        moveListener
      );
    }

    if (endListener) {
      InternalEvent.addListener(
        node,
        Client.IS_POINTER ? 'pointerup' : 'mouseup',
        endListener
      );
    }

    if (!Client.IS_POINTER && Client.IS_TOUCH) {
      if (startListener) {
        InternalEvent.addListener(node, 'touchstart', startListener);
      }

      if (moveListener) {
        InternalEvent.addListener(node, 'touchmove', moveListener);
      }

      if (endListener) {
        InternalEvent.addListener(node, 'touchend', endListener);
      }
    }
  }

  /**
   * Removes the given listeners from mousedown, mousemove, mouseup and the
   * respective touch events if <Client.IS_TOUCH> is true.
   */
  static removeGestureListeners(
    node: Listenable,
    startListener: MouseEventListener | null,
    moveListener: MouseEventListener | null,
    endListener: MouseEventListener | null
  ) {
    if (startListener) {
      InternalEvent.removeListener(
        node,
        Client.IS_POINTER ? 'pointerdown' : 'mousedown',
        startListener
      );
    }

    if (moveListener) {
      InternalEvent.removeListener(
        node,
        Client.IS_POINTER ? 'pointermove' : 'mousemove',
        moveListener
      );
    }

    if (endListener) {
      InternalEvent.removeListener(
        node,
        Client.IS_POINTER ? 'pointerup' : 'mouseup',
        endListener
      );
    }

    if (!Client.IS_POINTER && Client.IS_TOUCH) {
      if (startListener) {
        InternalEvent.removeListener(node, 'touchstart', startListener);
      }

      if (moveListener) {
        InternalEvent.removeListener(node, 'touchmove', moveListener);
      }

      if (endListener) {
        InternalEvent.removeListener(node, 'touchend', endListener);
      }
    }
  }

  /**
   * Redirects the mouse events from the given DOM node to the graph dispatch
   * loop using the event and given state as event arguments. State can
   * either be an instance of <CellState> or a function that returns an
   * <CellState>. The down, move, up and dblClick arguments are optional
   * functions that take the trigger event as arguments and replace the
   * default behaviour.
   */
  static redirectMouseEvents(
    node: Listenable,
    graph: Graph,
    state: CellState | ((evt: Event) => CellState | null) | null = null,
    down: MouseEventListener | null = null,
    move: MouseEventListener | null = null,
    up: MouseEventListener | null = null,
    dblClick: MouseEventListener | null = null
  ) {
    const getState = (evt: Event) => {
      return typeof state === 'function' ? state(evt) : state;
    };

    InternalEvent.addGestureListeners(
      node,
      (evt) => {
        if (down) {
          down(evt);
        } else if (!isConsumed(evt)) {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_DOWN,
            new InternalMouseEvent(evt, getState(evt))
          );
        }
      },
      (evt) => {
        if (move) {
          move(evt);
        } else if (!isConsumed(evt)) {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_MOVE,
            new InternalMouseEvent(evt, getState(evt))
          );
        }
      },
      (evt) => {
        if (up) {
          up(evt);
        } else if (!isConsumed(evt)) {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_UP,
            new InternalMouseEvent(evt, getState(evt))
          );
        }
      }
    );

    InternalEvent.addListener(node, 'dblclick', (evt: MouseEvent) => {
      if (dblClick) {
        dblClick(evt);
      } else if (!isConsumed(evt)) {
        const tmp = getState(evt);
        graph.dblClick(evt, tmp?.cell);
      }
    });
  }

  /**
   * Removes the known listeners from the given DOM node and its descendants.
   *
   * @param element DOM node to remove the listeners from.
   */
  static release(element: Listenable) {
    try {
      InternalEvent.removeAllListeners(element);

      // @ts-ignore
      const children = element.childNodes;

      if (children !== undefined) {
        const childCount = children.length;
        for (let i = 0; i < childCount; i += 1) {
          InternalEvent.release(children[i]);
        }
      }
    } catch (e) {
      // ignores errors as this is typically called in cleanup code
    }
  }

  /**
   * Installs the given function as a handler for mouse wheel events. The
   * function has two arguments: the mouse event and a boolean that specifies
   * if the wheel was moved up or down.
   *
   * ### Example
   *
   * @example
   * ```javascript
   * mxEvent.addMouseWheelListener(function (evt, up)
   * {
   *   MaxLog.show();
   *   MaxLog.debug('mouseWheel: up='+up);
   * });
   * ```
   *
   * @param funct Handler function that takes the event argument and a boolean up
   * argument for the mousewheel direction.
   * @param target Target for installing the listener in Google Chrome. See
   * https://www.chromestatus.com/features/6662647093133312.
   */
  static addMouseWheelListener(
    funct: (event: Event, up: boolean, force?: boolean, cx?: number, cy?: number) => void,
    target?: Listenable
  ) {
    if (funct != null) {
      type TouchArray = { clientX: number, clientY: number }[];
      let touches: TouchArray | null = null;
      let startTouches: TouchArray | null = null;

      target = target != null ? target : window;

      const getTouchDistance = (touches: TouchArray) => {
        const a = touches[0].clientX - touches[1].clientX;
        const b = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(a * a + b * b);
      }

      const touchesToArray = (touches: TouchList): TouchArray => {
        // Safari seems to use the same TouchList object unless
        // the values are copied, so copy+output the values we need
        const out = [];
        for (let i=0; i<touches.length; i++) {
          out.push({ clientX: touches[i].clientX, clientY: touches[i].clientY });
        }
        return out;
      }

      // Adds basic mouse listeners for graph event dispatching
      if (Client.IS_TOUCH) {
        // If a touch device, use the touch events
        InternalEvent.addListener(target, 'touchstart', (evt: TouchEvent) => {
          if (evt.touches && evt.touches.length > 1) {
            InternalEvent.consume(evt);
            startTouches = touchesToArray(evt.touches);
          }
        }, true);
        InternalEvent.addListener(target, 'touchmove', (evt: TouchEvent) => {
          if (!startTouches && evt.touches && evt.touches.length > 1) {
            startTouches = touchesToArray(evt.touches);
          }
          if (startTouches && evt.touches && evt.touches.length > 1) {
            InternalEvent.consume(evt);
            touches = touchesToArray(evt.touches);

            const diff = getTouchDistance(touches) - getTouchDistance(startTouches);
            if (Math.abs(diff) > InternalEvent.PINCH_THRESHOLD) {
              funct(evt, diff > 0, true);
              startTouches = touchesToArray(evt.touches);
            }
          }
        }, true)
        InternalEvent.addListener(target, 'touchend', (evt: TouchEvent) => {
          if (startTouches) {
            InternalEvent.consume(evt);
          }
          touches = null;
          startTouches = null;
        }, true);

        InternalEvent.addListener(target, 'mousemove', (evt: TouchEvent) => {
          if (startTouches) {
            InternalEvent.consume(evt);
          }
        }, true);
        InternalEvent.addListener(target, 'pointermove', (evt: TouchEvent) => {
          if (startTouches) {
            InternalEvent.consume(evt);
          }
        }, true);
      }

      // Fall back to standard mouse wheel if touch events not in progress, or not a touch device
      InternalEvent.addListener(target, 'wheel', ((evt: WheelEvent) => {
        if (startTouches) {
          // If being handled by touch events, ignore
          InternalEvent.consume(evt);
          return;
        }

        // To prevent window zoom on trackpad pinch
        if (evt.ctrlKey) {
          InternalEvent.consume(evt);
        }

        // Handles the event using the given function
        if (Math.abs(evt.deltaX) > 0.5 || Math.abs(evt.deltaY) > 0.5) {
          funct(evt, evt.deltaY == 0 ? -evt.deltaX > 0 : -evt.deltaY > 0);
        }
      }) as EventListener, true);
    }
  }

  /**
   * Disables the context menu for the given element.
   */
  static disableContextMenu(element: Listenable) {
    InternalEvent.addListener(element, 'contextmenu', (evt: MouseEvent) => {
      if (evt.preventDefault) {
        evt.preventDefault();
      }
      return false;
    });
  }

  /**
   * Consumes the given event.
   *
   * @param evt Native event to be consumed.
   * @param {boolean} [preventDefault=true] Optional boolean to prevent the default for the event.
   * Default is true.
   * @param {boolean} [stopPropagation=true] Option boolean to stop event propagation. Default is
   * true.
   */
  static consume(evt: Event, preventDefault = true, stopPropagation = true) {
    if (preventDefault) {
      if (evt.preventDefault) {
        if (stopPropagation) {
          evt.stopPropagation();
        }

        evt.preventDefault();
      } else if (stopPropagation) {
        evt.cancelBubble = true;
      }
    }

    // Opera
    // @ts-ignore This is a non-standard property.
    evt.isConsumed = true;

    // Other browsers
    if (!evt.preventDefault) {
      evt.returnValue = false;
    }
  }

  //
  // Special handles in mouse events
  //

  /**
   * Index for the label handle in an mxMouseEvent. This should be a negative
   * value that does not interfere with any possible handle indices.
   * @default -1
   */
  static LABEL_HANDLE = -1;

  /**
   * Index for the rotation handle in an mxMouseEvent. This should be a
   * negative value that does not interfere with any possible handle indices.
   * @default -2
   */
  static ROTATION_HANDLE = -2;

  /**
   * Start index for the custom handles in an mxMouseEvent. This should be a
   * negative value and is the start index which is decremented for each
   * custom handle.
   * @default -100
   */
  static CUSTOM_HANDLE = -100;

  /**
   * Start index for the virtual handles in an mxMouseEvent. This should be a
   * negative value and is the start index which is decremented for each
   * virtual handle.
   * This assumes that there are no more
   * than VIRTUAL_HANDLE - CUSTOM_HANDLE custom handles.
   *
   * @default -100000
   */
  static VIRTUAL_HANDLE = -100000;

  //
  // Event names
  //

  /**
   * Specifies the event name for mouseDown.
   */
  static MOUSE_DOWN = 'mouseDown';

  /**
   * Specifies the event name for mouseMove.
   */
  static MOUSE_MOVE = 'mouseMove';

  /**
   * Specifies the event name for mouseUp.
   */
  static MOUSE_UP = 'mouseUp';

  /**
   * Specifies the event name for activate.
   */
  static ACTIVATE = 'activate';

  /**
   * Specifies the event name for resizeStart.
   */
  static RESIZE_START = 'resizeStart';

  /**
   * Specifies the event name for resize.
   */
  static RESIZE = 'resize';

  /**
   * Specifies the event name for resizeEnd.
   */
  static RESIZE_END = 'resizeEnd';

  /**
   * Specifies the event name for moveStart.
   */
  static MOVE_START = 'moveStart';

  /**
   * Specifies the event name for move.
   */
  static MOVE = 'move';

  /**
   * Specifies the event name for moveEnd.
   */
  static MOVE_END = 'moveEnd';

  /**
   * Specifies the event name for panStart.
   */
  static PAN_START = 'panStart';

  /**
   * Specifies the event name for pan.
   */
  static PAN = 'pan';

  /**
   * Specifies the event name for panEnd.
   */
  static PAN_END = 'panEnd';

  /**
   * Specifies the event name for minimize.
   */
  static MINIMIZE = 'minimize';

  /**
   * Specifies the event name for normalize.
   */
  static NORMALIZE = 'normalize';

  /**
   * Specifies the event name for maximize.
   */
  static MAXIMIZE = 'maximize';

  /**
   * Specifies the event name for hide.
   */
  static HIDE = 'hide';

  /**
   * Specifies the event name for show.
   */
  static SHOW = 'show';

  /**
   * Specifies the event name for close.
   */
  static CLOSE = 'close';

  /**
   * Specifies the event name for destroy.
   */
  static DESTROY = 'destroy';

  /**
   * Specifies the event name for refresh.
   */
  static REFRESH = 'refresh';

  /**
   * Specifies the event name for size.
   */
  static SIZE = 'size';

  /**
   * Specifies the event name for select.
   */
  static SELECT = 'select';

  /**
   * Specifies the event name for fired.
   */
  static FIRED = 'fired';

  /**
   * Specifies the event name for fireMouseEvent.
   */
  static FIRE_MOUSE_EVENT = 'fireMouseEvent';

  /**
   * Specifies the event name for gesture.
   */
  static GESTURE = 'gesture';

  /**
   * Specifies the event name for tapAndHold.
   */
  static TAP_AND_HOLD = 'tapAndHold';

  /**
   * Specifies the event name for get.
   */
  static GET = 'get';

  /**
   * Specifies the event name for receive.
   */
  static RECEIVE = 'receive';

  /**
   * Specifies the event name for connect.
   */
  static CONNECT = 'connect';

  /**
   * Specifies the event name for disconnect.
   */
  static DISCONNECT = 'disconnect';

  /**
   * Specifies the event name for suspend.
   */
  static SUSPEND = 'suspend';

  /**
   * Specifies the event name for suspend.
   */
  static RESUME = 'resume';

  /**
   * Specifies the event name for mark.
   */
  static MARK = 'mark';

  /**
   * Specifies the event name for root.
   */
  static ROOT = 'root';

  /**
   * Specifies the event name for post.
   */
  static POST = 'post';

  /**
   * Specifies the event name for open.
   */
  static OPEN = 'open';

  /**
   * Specifies the event name for open.
   */
  static SAVE = 'save';

  /**
   * Specifies the event name for beforeAddVertex.
   */
  static BEFORE_ADD_VERTEX = 'beforeAddVertex';

  /**
   * Specifies the event name for addVertex.
   */
  static ADD_VERTEX = 'addVertex';

  /**
   * Specifies the event name for afterAddVertex.
   */
  static AFTER_ADD_VERTEX = 'afterAddVertex';

  /**
   * Specifies the event name for done.
   */
  static DONE = 'done';

  /**
   * Specifies the event name for execute.
   */
  static EXECUTE = 'execute';

  /**
   * Specifies the event name for executed.
   */
  static EXECUTED = 'executed';

  /**
   * Specifies the event name for beginUpdate.
   */
  static BEGIN_UPDATE = 'beginUpdate';

  /**
   * Specifies the event name for startEdit.
   */
  static START_EDIT = 'startEdit';

  /**
   * Specifies the event name for endUpdate.
   */
  static END_UPDATE = 'endUpdate';

  /**
   * Specifies the event name for endEdit.
   */
  static END_EDIT = 'endEdit';

  /**
   * Specifies the event name for beforeUndo.
   */
  static BEFORE_UNDO = 'beforeUndo';

  /**
   * Specifies the event name for undo.
   */
  static UNDO = 'undo';

  /**
   * Specifies the event name for redo.
   */
  static REDO = 'redo';

  /**
   * Specifies the event name for change.
   */
  static CHANGE = 'change';

  /**
   * Specifies the event name for notify.
   */
  static NOTIFY = 'notify';

  /**
   * Specifies the event name for layoutCells.
   */
  static LAYOUT_CELLS = 'layoutCells';

  /**
   * Specifies the event name for click.
   */
  static CLICK = 'click';

  /**
   * Specifies the event name for scale.
   */
  static SCALE = 'scale';

  /**
   * Specifies the event name for translate.
   */
  static TRANSLATE = 'translate';

  /**
   * Specifies the event name for scaleAndTranslate.
   */
  static SCALE_AND_TRANSLATE = 'scaleAndTranslate';

  /**
   * Specifies the event name for up.
   */
  static UP = 'up';

  /**
   * Specifies the event name for down.
   */
  static DOWN = 'down';

  /**
   * Specifies the event name for add.
   */
  static ADD = 'add';

  /**
   * Specifies the event name for remove.
   */
  static REMOVE = 'remove';

  /**
   * Specifies the event name for clear.
   */
  static CLEAR = 'clear';

  /**
   * Specifies the event name for addCells.
   */
  static ADD_CELLS = 'addCells';

  /**
   * Specifies the event name for cellsAdded.
   */
  static CELLS_ADDED = 'cellsAdded';

  /**
   * Specifies the event name for moveCells.
   */
  static MOVE_CELLS = 'moveCells';

  /**
   * Specifies the event name for cellsMoved.
   */
  static CELLS_MOVED = 'cellsMoved';

  /**
   * Specifies the event name for resizeCells.
   */
  static RESIZE_CELLS = 'resizeCells';

  /**
   * Specifies the event name for cellsResized.
   */
  static CELLS_RESIZED = 'cellsResized';

  /**
   * Specifies the event name for toggleCells.
   */
  static TOGGLE_CELLS = 'toggleCells';

  /**
   * Specifies the event name for cellsToggled.
   */
  static CELLS_TOGGLED = 'cellsToggled';

  /**
   * Specifies the event name for orderCells.
   */
  static ORDER_CELLS = 'orderCells';

  /**
   * Specifies the event name for cellsOrdered.
   */
  static CELLS_ORDERED = 'cellsOrdered';

  /**
   * Specifies the event name for removeCells.
   */
  static REMOVE_CELLS = 'removeCells';

  /**
   * Specifies the event name for cellsRemoved.
   */
  static CELLS_REMOVED = 'cellsRemoved';

  /**
   * Specifies the event name for groupCells.
   */
  static GROUP_CELLS = 'groupCells';

  /**
   * Specifies the event name for ungroupCells.
   */
  static UNGROUP_CELLS = 'ungroupCells';

  /**
   * Specifies the event name for removeCellsFromParent.
   */
  static REMOVE_CELLS_FROM_PARENT = 'removeCellsFromParent';

  /**
   * Specifies the event name for foldCells.
   */
  static FOLD_CELLS = 'foldCells';

  /**
   * Specifies the event name for cellsFolded.
   */
  static CELLS_FOLDED = 'cellsFolded';

  /**
   * Specifies the event name for alignCells.
   */
  static ALIGN_CELLS = 'alignCells';

  /**
   * Specifies the event name for labelChanged.
   */
  static LABEL_CHANGED = 'labelChanged';

  /**
   * Specifies the event name for connectCell.
   */
  static CONNECT_CELL = 'connectCell';

  /**
   * Specifies the event name for cellConnected.
   */
  static CELL_CONNECTED = 'cellConnected';

  /**
   * Specifies the event name for splitEdge.
   */
  static SPLIT_EDGE = 'splitEdge';

  /**
   * Specifies the event name for flipEdge.
   */
  static FLIP_EDGE = 'flipEdge';

  /**
   * Specifies the event name for startEditing.
   */
  static START_EDITING = 'startEditing';

  /**
   * Specifies the event name for editingStarted.
   */
  static EDITING_STARTED = 'editingStarted';

  /**
   * Specifies the event name for editingStopped.
   */
  static EDITING_STOPPED = 'editingStopped';

  /**
   * Specifies the event name for addOverlay.
   */
  static ADD_OVERLAY = 'addOverlay';

  /**
   * Specifies the event name for removeOverlay.
   */
  static REMOVE_OVERLAY = 'removeOverlay';

  /**
   * Specifies the event name for updateCellSize.
   */
  static UPDATE_CELL_SIZE = 'updateCellSize';

  /**
   * Specifies the event name for escape.
   */
  static ESCAPE = 'escape';

  /**
   * Specifies the event name for doubleClick.
   */
  static DOUBLE_CLICK = 'doubleClick';

  /**
   * Specifies the event name for start.
   */
  static START = 'start';

  /**
   * Specifies the event name for reset.
   */
  static RESET = 'reset';

  /**
   * Threshold for pinch gestures to fire a mouse wheel event.
   * Default value is 10.
   */
  static PINCH_THRESHOLD = 10;
}

export default InternalEvent;
