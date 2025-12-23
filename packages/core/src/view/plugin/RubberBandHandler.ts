/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2016, JGraph Ltd
Copyright (c) 2006-2016, Gaudenz Alder

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
  convertPoint,
  getOffset,
  getScrollOrigin,
  setOpacity,
  setPrefixedStyle,
} from '../../util/styleUtils.js';
import InternalEvent from '../event/InternalEvent.js';
import Point from '../geometry/Point.js';
import InternalMouseEvent from '../event/InternalMouseEvent.js';
import Client from '../../Client.js';
import Rectangle from '../geometry/Rectangle.js';
import { isAltDown, isMultiTouchEvent } from '../../util/EventUtils.js';
import { clearSelection } from '../../util/domUtils.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type { GraphPlugin, MouseListenerSet } from '../../types.js';
import EventObject from '../event/EventObject.js';
import EventSource from '../event/EventSource.js';

/**
 * Event handler that selects rectangular regions.
 *
 * **IMPORTANT**: This is not built-into `maxGraph` i.e. this plugin is not in the `maxGraph` default plugins, see {@link getDefaultPlugins}.
 *
 * To enable rubberband selection in a graph, use the following code.
 *
 * ```javascript
 * const plugins = [
 *   ...getDefaultPlugins(), // or any other plugins you want
 *   RubberBandHandler,
 * ];
 *
 * // Creates the graph with the custom plugins
 * const graph = new Graph(container, undefined, plugins);
 * ```
 *
 * **IMPORTANT**: the RubberBandHandler requires CSS styles in order to work properly.
 * See the CSS rules in the `css/common.css` file provided within the npm package. They relate to the `.mxRubberband` class.
 *
 * @category Plugin
 */
class RubberBandHandler implements GraphPlugin, MouseListenerSet {
  static pluginId = 'RubberBandHandler';

  constructor(graph: AbstractGraph) {
    this.graph = graph;
    this.graph.addMouseListener(this);

    // Handles force rubberband event
    this.forceRubberbandHandler = (sender: EventSource, evt: EventObject) => {
      const evtName = evt.getProperty('eventName');
      const me = evt.getProperty('event');

      if (evtName === InternalEvent.MOUSE_DOWN && this.isForceRubberbandEvent(me)) {
        const offset = getOffset(this.graph.container);
        const origin = getScrollOrigin(this.graph.container);
        origin.x -= offset.x;
        origin.y -= offset.y;
        this.start(me.getX() + origin.x, me.getY() + origin.y);
        me.consume(false);
      }
    };

    this.graph.addListener(InternalEvent.FIRE_MOUSE_EVENT, this.forceRubberbandHandler);

    // Repaints the marquee after autoscroll
    this.panHandler = () => {
      this.repaint();
    };

    this.graph.addListener(InternalEvent.PAN, this.panHandler);

    // Does not show menu if any touch gestures take place after the trigger
    this.gestureHandler = (sender: EventSource, eo: EventObject) => {
      if (this.first) {
        this.reset();
      }
    };

    this.graph.addListener(InternalEvent.GESTURE, this.gestureHandler);
  }

  forceRubberbandHandler: Function;
  panHandler: Function;
  gestureHandler: Function;
  graph: AbstractGraph;
  first: Point | null = null;
  destroyed = false;
  dragHandler: ((evt: MouseEvent) => void) | null = null;
  dropHandler: ((evt: MouseEvent) => void) | null = null;

  x = 0;
  y = 0;
  width = 0;
  height = 0;

  /**
   * Specifies the default opacity to be used for the rubberband div.
   * Valid values are between `0` and `100`.
   * @default 20
   */
  defaultOpacity = 20;

  /**
   * Specifies if events are handled.
   * @default true
   */
  enabled = true;

  /**
   * Holds the DIV element which is currently visible.
   */
  div: HTMLElement | null = null;

  /**
   * Holds the DIV element which is used to display the rubberband.
   */
  sharedDiv: HTMLElement | null = null;

  /**
   * Holds the value of the x argument in the last call to {@link update}.
   */
  currentX = 0;

  /**
   * Holds the value of the y argument in the last call to {@link update}.
   */
  currentY = 0;

  /**
   * Optional fade out effect.
   * @default false
   */
  fadeOut = false;

  /**
   * Creates the rubberband selection shape.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Enables or disables event handling. This implementation updates{@link enabled}.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Returns true if the given {@link MouseEvent} should start rubberband selection.
   * This implementation returns true if the alt key is pressed.
   */
  isForceRubberbandEvent(me: InternalMouseEvent) {
    return isAltDown(me.getEvent());
  }

  /**
   * Handles the event by initiating a rubberband selection.
   * By consuming the event all subsequent events of the gesture are redirected to this handler.
   */
  mouseDown(_sender: EventSource, me: InternalMouseEvent) {
    if (
      !me.isConsumed() &&
      this.isEnabled() &&
      this.graph.isEnabled() &&
      !me.getState() &&
      !isMultiTouchEvent(me.getEvent())
    ) {
      const offset = getOffset(this.graph.container);
      const origin = getScrollOrigin(this.graph.container);
      origin.x -= offset.x;
      origin.y -= offset.y;
      this.start(me.getX() + origin.x, me.getY() + origin.y);

      // Does not prevent the default for this event so that the
      // event processing chain is still executed even if we start
      // rubberbanding. This is required eg. in ExtJs to hide the
      // current context menu. In mouseMove we'll make sure we're
      // not selecting anything while we're rubberbanding.
      me.consume(false);
    }
  }

  /**
   * Creates the rubberband selection shape.
   */
  start(x: number, y: number) {
    this.first = new Point(x, y);

    const { container } = this.graph;

    function createMouseEvent(evt: MouseEvent) {
      const me = new InternalMouseEvent(evt);
      const pt = convertPoint(container, me.getX(), me.getY());

      me.graphX = pt.x;
      me.graphY = pt.y;

      return me;
    }

    this.dragHandler = (evt: MouseEvent) => {
      this.mouseMove(this.graph, createMouseEvent(evt));
    };

    this.dropHandler = (evt: MouseEvent) => {
      this.mouseUp(this.graph, createMouseEvent(evt));
    };

    // Workaround for rubberband stopping if the mouse leaves the container in Firefox
    if (Client.IS_FF) {
      InternalEvent.addGestureListeners(
        document,
        null,
        this.dragHandler,
        this.dropHandler
      );
    }
  }

  /**
   * Handles the event by updating the rubberband selection.
   */
  mouseMove(_sender: EventSource, me: InternalMouseEvent) {
    if (!me.isConsumed() && this.first) {
      const origin = getScrollOrigin(this.graph.container);
      const offset = getOffset(this.graph.container);
      origin.x -= offset.x;
      origin.y -= offset.y;
      const x = me.getX() + origin.x;
      const y = me.getY() + origin.y;
      const dx = this.first.x - x;
      const dy = this.first.y - y;
      const tol = this.graph.getEventTolerance();

      if (this.div || Math.abs(dx) > tol || Math.abs(dy) > tol) {
        if (!this.div) {
          this.div = this.createShape();
        }

        // Clears selection while rubberbanding. This is required because
        // the event is not consumed in mouseDown.
        clearSelection();

        this.update(x, y);
        me.consume();
      }
    }
  }

  /**
   * Creates the rubberband selection shape.
   */
  createShape() {
    if (!this.sharedDiv) {
      this.sharedDiv = document.createElement('div');
      this.sharedDiv.className = 'mxRubberband';
      setOpacity(this.sharedDiv, this.defaultOpacity);
    }

    this.graph.container.appendChild(this.sharedDiv);
    const result = this.sharedDiv;

    if (Client.IS_SVG && this.fadeOut) {
      this.sharedDiv = null;
    }

    return result;
  }

  /**
   * Returns true if this handler is active.
   */
  isActive(sender?: EventSource, me?: InternalMouseEvent) {
    return this.div && this.div.style.display !== 'none';
  }

  /**
   * Handles the event by selecting the region of the rubberband using {@link AbstractGraph.selectRegion}.
   */
  mouseUp(_sender: EventSource, me: InternalMouseEvent) {
    const active = this.isActive();
    this.reset();

    if (active) {
      this.execute(me.getEvent());
      me.consume();
    }
  }

  /**
   * Resets the state of this handler and selects the current region for the given event.
   */
  execute(evt: MouseEvent) {
    const rect = new Rectangle(this.x, this.y, this.width, this.height);
    this.graph.selectRegion(rect, evt);
  }

  /**
   * Resets the state of the rubberband selection.
   */
  reset() {
    if (this.div) {
      if (Client.IS_SVG && this.fadeOut) {
        const temp = this.div;
        setPrefixedStyle(temp.style, 'transition', 'all 0.2s linear');
        temp.style.pointerEvents = 'none';
        temp.style.opacity = String(0);

        window.setTimeout(() => {
          if (temp.parentNode) temp.parentNode.removeChild(temp);
        }, 200);
      } else {
        if (this.div.parentNode) this.div.parentNode.removeChild(this.div);
      }
    }

    InternalEvent.removeGestureListeners(
      document,
      null,
      this.dragHandler,
      this.dropHandler
    );
    this.dragHandler = null;
    this.dropHandler = null;

    this.currentX = 0;
    this.currentY = 0;
    this.first = null;
    this.div = null;
  }

  /**
   * Sets <currentX> and <currentY> and calls {@link repaint}.
   */
  update(x: number, y: number) {
    this.currentX = x;
    this.currentY = y;

    this.repaint();
  }

  /**
   * Computes the bounding box and updates the style of the `div`.
   */
  repaint() {
    if (this.div && this.first) {
      const x = this.currentX - this.graph.getPanDx();
      const y = this.currentY - this.graph.getPanDy();

      this.x = Math.min(this.first.x, x);
      this.y = Math.min(this.first.y, y);
      this.width = Math.max(this.first.x, x) - this.x;
      this.height = Math.max(this.first.y, y) - this.y;

      const dx = 0;
      const dy = 0;

      this.div.style.left = `${this.x + dx}px`;
      this.div.style.top = `${this.y + dy}px`;
      this.div.style.width = `${Math.max(1, this.width)}px`;
      this.div.style.height = `${Math.max(1, this.height)}px`;
    }
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   * This does normally not need to be called, it is called automatically when the window unloads.
   */
  onDestroy() {
    if (!this.destroyed) {
      this.destroyed = true;
      this.graph.removeMouseListener(this);
      this.graph.removeListener(this.forceRubberbandHandler);
      this.graph.removeListener(this.panHandler);
      this.reset();

      if (this.sharedDiv) {
        this.sharedDiv = null;
      }
    }
  }
}

export default RubberBandHandler;
