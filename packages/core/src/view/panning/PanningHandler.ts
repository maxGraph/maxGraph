/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import EventSource from '../event/EventSource';
import { hasScrollbars } from '../../util/Utils';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import {
  isConsumed,
  isControlDown,
  isLeftMouseButton,
  isMultiTouchEvent,
  isPopupTrigger,
  isShiftDown,
} from '../../util/EventUtils';
import PanningManager from './PanningManager';
import InternalMouseEvent from '../event/InternalMouseEvent';

import type { GraphPlugin, MouseEventListener } from '../../types';
import type { Graph } from '../Graph';

/**
 * Class: mxPanningHandler
 *
 * Event handler that pans and creates popupmenus. To use the left
 * mousebutton for panning without interfering with cell moving and
 * resizing, use <isUseLeftButton> and <isIgnoreCell>. For grid size
 * steps while panning, use <useGrid>. This handler is built-into
 * <mxGraph.panningHandler> and enabled using <mxGraph.setPanning>.
 *
 * Constructor: mxPanningHandler
 *
 * Constructs an event handler that creates a <mxPopupMenu>
 * and pans the graph.
 *
 * Event: mxEvent.PAN_START
 *
 * Fires when the panning handler changes its <active> state to true. The
 * <code>event</code> property contains the corresponding <mxMouseEvent>.
 *
 * Event: mxEvent.PAN
 *
 * Fires while handle is processing events. The <code>event</code> property contains
 * the corresponding <mxMouseEvent>.
 *
 * Event: mxEvent.PAN_END
 *
 * Fires when the panning handler changes its <active> state to false. The
 * <code>event</code> property contains the corresponding <mxMouseEvent>.
 */
class PanningHandler extends EventSource implements GraphPlugin {
  static pluginId = 'PanningHandler';

  constructor(graph: Graph) {
    super();

    this.graph = graph;
    this.graph.addMouseListener(this);

    // Handles force panning event
    this.forcePanningHandler = (sender: EventSource, eo: EventObject) => {
      const evtName = eo.getProperty('eventName');
      const me = eo.getProperty('event');

      if (evtName === InternalEvent.MOUSE_DOWN && this.isForcePanningEvent(me)) {
        this.start(me);
        this.active = true;
        this.fireEvent(new EventObject(InternalEvent.PAN_START, 'event', me));
        me.consume();
      }
    };

    this.graph.addListener(InternalEvent.FIRE_MOUSE_EVENT, this.forcePanningHandler);

    // Handles pinch gestures
    this.gestureHandler = (sender: EventSource, eo: EventObject) => {
      if (this.isPinchEnabled()) {
        const evt = eo.getProperty('event');

        if (!isConsumed(evt) && evt.type === 'gesturestart') {
          this.initialScale = this.graph.view.scale;

          // Forces start of panning when pinch gesture starts
          if (!this.active && this.mouseDownEvent) {
            this.start(this.mouseDownEvent);
            this.mouseDownEvent = null;
          }
        } else if (evt.type === 'gestureend' && this.initialScale !== 0) {
          this.initialScale = 0;
        }

        if (this.initialScale !== 0) {
          this.zoomGraph(evt);
        }
      }
    };

    this.graph.addListener(InternalEvent.GESTURE, this.gestureHandler);

    this.mouseUpListener = () => {
      if (this.active) {
        this.reset();
      }
    };

    // Stops scrolling on every mouseup anywhere in the document
    InternalEvent.addListener(document, 'mouseup', this.mouseUpListener);

    this.panningManager = new PanningManager(graph);
  }

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  graph: Graph;

  panningManager: PanningManager;

  getPanningManager = () => this.panningManager;

  /**
   * Variable: useLeftButtonForPanning
   *
   * Specifies if panning should be active for the left mouse button.
   * Setting this to true may conflict with <mxRubberband>. Default is false.
   */
  useLeftButtonForPanning = false;

  /**
   * Variable: usePopupTrigger
   *
   * Specifies if <mxEvent.isPopupTrigger> should also be used for panning.
   */
  usePopupTrigger = true;

  /**
   * Variable: ignoreCell
   *
   * Specifies if panning should be active even if there is a cell under the
   * mousepointer. Default is false.
   */
  ignoreCell = false;

  /**
   * Variable: previewEnabled
   *
   * Specifies if the panning should be previewed. Default is true.
   */
  previewEnabled = true;

  /**
   * Variable: useGrid
   *
   * Specifies if the panning steps should be aligned to the grid size.
   * Default is false.
   */
  useGrid = false;

  /**
   * Variable: panningEnabled
   *
   * Specifies if panning should be enabled. Default is false.
   */
  panningEnabled = false;

  /**
   * Variable: pinchEnabled
   *
   * Specifies if pinch gestures should be handled as zoom. Default is true.
   */
  pinchEnabled = true;

  initialScale = 0;

  /**
   * Variable: maxScale
   *
   * Specifies the maximum scale. Default is 8.
   */
  maxScale = 8;

  /**
   * Variable: minScale
   *
   * Specifies the minimum scale. Default is 0.01.
   */
  minScale = 0.01;

  /**
   * Variable: dx
   *
   * Holds the current horizontal offset.
   */
  dx = 0;

  /**
   * Variable: dy
   *
   * Holds the current vertical offset.
   */
  dy = 0;

  /**
   * Variable: startX
   *
   * Holds the x-coordinate of the start point.
   */
  startX = 0;

  /**
   * Variable: startY
   *
   * Holds the y-coordinate of the start point.
   */
  startY = 0;

  dx0 = 0;
  dy0 = 0;

  panningTrigger = false;

  active = false;

  forcePanningHandler: (sender: EventSource, evt: EventObject) => void;
  gestureHandler: (sender: EventSource, evt: EventObject) => void;

  mouseUpListener: MouseEventListener;

  mouseDownEvent: InternalMouseEvent | null = null;

  /**
   * Function: isActive
   *
   * Returns true if the handler is currently active.
   */
  isActive() {
    return this.active || this.initialScale !== null;
  }

  /**
   * Function: isPanningEnabled
   *
   * Returns <panningEnabled>.
   */
  isPanningEnabled() {
    return this.panningEnabled;
  }

  /**
   * Function: setPanningEnabled
   *
   * Sets <panningEnabled>.
   */
  setPanningEnabled(value: boolean) {
    this.panningEnabled = value;
  }

  /**
   * Function: isPinchEnabled
   *
   * Returns <pinchEnabled>.
   */
  isPinchEnabled() {
    return this.pinchEnabled;
  }

  /**
   * Function: setPinchEnabled
   *
   * Sets <pinchEnabled>.
   */
  setPinchEnabled(value: boolean) {
    this.pinchEnabled = value;
  }

  /**
   * Function: isPanningTrigger
   *
   * Returns true if the given event is a panning trigger for the optional
   * given cell. This returns true if control-shift is pressed or if
   * <usePopupTrigger> is true and the event is a popup trigger.
   */
  isPanningTrigger(me: InternalMouseEvent) {
    const evt = me.getEvent();

    return (
      (this.useLeftButtonForPanning && !me.getState() && isLeftMouseButton(evt)) ||
      (isControlDown(evt) && isShiftDown(evt)) ||
      (this.usePopupTrigger && isPopupTrigger(evt))
    );
  }

  /**
   * Function: isForcePanningEvent
   *
   * Returns true if the given <mxMouseEvent> should start panning. This
   * implementation always returns true if <ignoreCell> is true or for
   * multi touch events.
   */
  isForcePanningEvent(me: InternalMouseEvent) {
    return this.ignoreCell || isMultiTouchEvent(me.getEvent());
  }

  /**
   * Function: mouseDown
   *
   * Handles the event by initiating the panning. By consuming the event all
   * subsequent events of the gesture are redirected to this handler.
   */
  mouseDown(sender: EventSource, me: InternalMouseEvent) {
    this.mouseDownEvent = me;

    if (
      !me.isConsumed() &&
      this.isPanningEnabled() &&
      !this.active &&
      this.isPanningTrigger(me)
    ) {
      this.start(me);
      this.consumePanningTrigger(me);
    }
  }

  /**
   * Function: start
   *
   * Starts panning at the given event.
   */
  start(me: InternalMouseEvent) {
    this.dx0 = -this.graph.container.scrollLeft;
    this.dy0 = -this.graph.container.scrollTop;

    // Stores the location of the trigger event
    this.startX = me.getX();
    this.startY = me.getY();
    this.dx = 0;
    this.dy = 0;

    this.panningTrigger = true;
  }

  /**
   * Function: consumePanningTrigger
   *
   * Consumes the given <mxMouseEvent> if it was a panning trigger in
   * <mouseDown>. The default is to invoke <mxMouseEvent.consume>. Note that this
   * will block any further event processing. If you haven't disabled built-in
   * context menus and require immediate selection of the cell on mouseDown in
   * Safari and/or on the Mac, then use the following code:
   *
   * (code)
   * consumePanningTrigger(me)
   * {
   *   if (me.evt.preventDefault)
   *   {
   *     me.evt.preventDefault();
   *   }
   *
   *   // Stops event processing in IE
   *   me.evt.returnValue = false;
   *
   *   // Sets local consumed state
   *   if (!mxClient.IS_SF && !mxClient.IS_MAC)
   *   {
   *     me.consumed = true;
   *   }
   * };
   * (end)
   */
  consumePanningTrigger(me: InternalMouseEvent) {
    me.consume();
  }

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the panning on the graph.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    this.dx = me.getX() - this.startX;
    this.dy = me.getY() - this.startY;

    if (this.active) {
      if (this.previewEnabled) {
        // Applies the grid to the panning steps
        if (this.useGrid) {
          this.dx = this.graph.snap(this.dx);
          this.dy = this.graph.snap(this.dy);
        }

        this.graph.panGraph(this.dx + this.dx0, this.dy + this.dy0);
      }

      this.fireEvent(new EventObject(InternalEvent.PAN, 'event', me));
    } else if (this.panningTrigger) {
      const tmp = this.active;

      // Panning is activated only if the mouse is moved
      // beyond the graph tolerance
      this.active =
        Math.abs(this.dx) > this.graph.getSnapTolerance() ||
        Math.abs(this.dy) > this.graph.getSnapTolerance();

      if (!tmp && this.active) {
        this.fireEvent(new EventObject(InternalEvent.PAN_START, 'event', me));
      }
    }

    if (this.active || this.panningTrigger) {
      me.consume();
    }
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by setting the translation on the view or showing the
   * popupmenu.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    if (this.active) {
      if (this.dx !== 0 && this.dy !== 0) {
        // Ignores if scrollbars have been used for panning
        if (
          !this.graph.isUseScrollbarsForPanning() ||
          !hasScrollbars(this.graph.container)
        ) {
          const { scale } = this.graph.getView();
          const t = this.graph.getView().translate;
          this.graph.panGraph(0, 0);
          this.panGraph(t.x + this.dx / scale, t.y + this.dy / scale);
        }

        me.consume();
      }

      this.fireEvent(new EventObject(InternalEvent.PAN_END, 'event', me));
    }

    this.reset();
  }

  /**
   * Function: zoomGraph
   *
   * Zooms the graph to the given value and consumed the event if needed.
   */
  zoomGraph(evt: Event) {
    // @ts-ignore evt may have scale property
    let value = Math.round(this.initialScale * evt.scale * 100) / 100;
    value = Math.max(this.minScale, value);
    value = Math.min(this.maxScale, value);

    if (this.graph.view.scale !== value) {
      this.graph.zoomTo(value);
      InternalEvent.consume(evt);
    }
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by setting the translation on the view or showing the
   * popupmenu.
   */
  reset() {
    this.panningTrigger = false;
    this.mouseDownEvent = null;
    this.active = false;
    this.dx = 0;
    this.dy = 0;
  }

  /**
   * Function: panGraph
   *
   * Pans <graph> by the given amount.
   */
  panGraph(dx: number, dy: number) {
    this.graph.getView().setTranslate(dx, dy);
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  onDestroy() {
    this.graph.removeMouseListener(this);
    this.graph.removeListener(this.forcePanningHandler);
    this.graph.removeListener(this.gestureHandler);
    InternalEvent.removeListener(document, 'mouseup', this.mouseUpListener);
  }
}

export default PanningHandler;
