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

import InternalMouseEvent from './InternalMouseEvent.js';
import { EventNames } from './EventNames.js';
import Client from '../../Client.js';
import { isConsumed, isMouseEvent } from '../../util/EventUtils.js';
import type CellState from '../cell/CellState.js';
import type {
  EventCache,
  GestureEvent,
  KeyboardEventListener,
  Listenable,
  MouseEventListener,
} from '../../types.js';
import type { AbstractGraph } from '../AbstractGraph.js';

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
 * {@link EventSource} and the graph event dispatch loop in {@link AbstractGraph} are used.
 *
 * ### Memory Leaks:
 *
 * Use this class for adding and removing listeners to/from DOM nodes. The
 * {@link removeAllListeners} function is provided to remove all listeners that
 * have been added using {@link addListener}. The function should be invoked when
 * the last reference is removed in the JavaScript code, typically when the
 * referenced DOM node is removed from the DOM.
 *
 * @category Event
 */
class InternalEvent {
  /**
   * Binds the function to the specified event on the given element.
   */
  static addListener(
    element: Listenable,
    eventName: string,
    funct: MouseEventListener | KeyboardEventListener
  ) {
    element.addEventListener(
      eventName,
      funct as EventListener,
      supportsPassive ? { passive: false } : false
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
    funct: MouseEventListener | KeyboardEventListener
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
    graph: AbstractGraph,
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
            EventNames.MOUSE_DOWN,
            new InternalMouseEvent(evt, getState(evt))
          );
        }
      },
      (evt) => {
        if (move) {
          move(evt);
        } else if (!isConsumed(evt)) {
          graph.fireMouseEvent(
            EventNames.MOUSE_MOVE,
            new InternalMouseEvent(evt, getState(evt))
          );
        }
      },
      (evt) => {
        if (up) {
          up(evt);
        } else if (!isConsumed(evt)) {
          graph.fireMouseEvent(
            EventNames.MOUSE_UP,
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
   * This has been tested with IE 6 and 7, Firefox (all versions), Opera and
   * Safari. It does currently not work on Safari for Mac.
   *
   * ### Example
   *
   * @example
   * ```javascript
   * mxEvent.addMouseWheelListener(function (evt, up)
   * {
   *   GlobalConfig.logger.show();
   *   GlobalConfig.logger.debug('mouseWheel: up='+up);
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
    target: Listenable
  ) {
    if (funct != null) {
      const wheelHandler = (evt: WheelEvent) => {
        // To prevent window zoom on trackpad pinch
        if (evt.ctrlKey) {
          evt.preventDefault();
        }

        // Handles the event using the given function
        if (Math.abs(evt.deltaX) > 0.5 || Math.abs(evt.deltaY) > 0.5) {
          funct(evt, evt.deltaY == 0 ? -evt.deltaX > 0 : -evt.deltaY > 0);
        }
      };

      target = target != null ? target : window;

      if (Client.IS_SF && !Client.IS_TOUCH) {
        let scale = 1;

        InternalEvent.addListener(target, 'gesturestart', (evt: GestureEvent) => {
          InternalEvent.consume(evt);
          scale = 1;
        });

        InternalEvent.addListener(target, 'gesturechange', ((evt: GestureEvent) => {
          InternalEvent.consume(evt);

          if (typeof evt.scale === 'number') {
            const diff = scale - evt.scale;

            if (Math.abs(diff) > 0.2) {
              funct(evt, diff < 0, true);
              scale = evt.scale;
            }
          }
        }) as EventListener);

        InternalEvent.addListener(target, 'gestureend', (evt: GestureEvent) => {
          InternalEvent.consume(evt);
        });
      } else {
        let evtCache: EventCache = [];
        let dx0 = 0;
        let dy0 = 0;

        // Adds basic listeners for graph event dispatching
        InternalEvent.addGestureListeners(
          target,
          ((evt: GestureEvent) => {
            if (!isMouseEvent(evt) && evt.pointerId != null) {
              evtCache.push(evt);
            }
          }) as EventListener,
          ((evt: GestureEvent) => {
            if (!isMouseEvent(evt) && evtCache.length == 2) {
              // Find this event in the cache and update its record with this event
              for (let i = 0; i < evtCache.length; i += 1) {
                if (evt.pointerId == evtCache[i].pointerId) {
                  evtCache[i] = evt;
                  break;
                }
              }

              // Calculate the distance between the two pointers
              const dx = Math.abs(evtCache[0].clientX - evtCache[1].clientX);
              const dy = Math.abs(evtCache[0].clientY - evtCache[1].clientY);
              const tx = Math.abs(dx - dx0);
              const ty = Math.abs(dy - dy0);

              if (
                tx > InternalEvent.PINCH_THRESHOLD ||
                ty > InternalEvent.PINCH_THRESHOLD
              ) {
                const cx =
                  evtCache[0].clientX + (evtCache[1].clientX - evtCache[0].clientX) / 2;
                const cy =
                  evtCache[0].clientY + (evtCache[1].clientY - evtCache[0].clientY) / 2;

                funct(evtCache[0], tx > ty ? dx > dx0 : dy > dy0, true, cx, cy);

                // Cache the distance for the next move event
                dx0 = dx;
                dy0 = dy;
              }
            }
          }) as EventListener,
          (evt) => {
            evtCache = [];
            dx0 = 0;
            dy0 = 0;
          }
        );
      }

      InternalEvent.addListener(target, 'wheel', wheelHandler as EventListener);
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

  /**
   * Threshold for pinch gestures to fire a mouse wheel event.
   * Default value is 10.
   */
  static PINCH_THRESHOLD = 10;
}

export default InternalEvent;
