/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import InternalEvent from '../event/InternalEvent';
import { fit, getScrollOrigin } from '../../util/Utils';
import { TOOLTIP_VERTICAL_OFFSET } from '../../util/Constants';
import { getSource, isMouseEvent } from '../../util/EventUtils';
import { isNode } from '../../util/DomUtils';
import { Graph } from '../Graph';
import CellState from '../cell/datatypes/CellState';
import InternalMouseEvent from '../event/InternalMouseEvent';
import PopupMenuHandler from '../popups_menus/PopupMenuHandler';

import type { GraphPlugin } from '../../types';
import EventSource from '../event/EventSource';

/**
 * Class: mxTooltipHandler
 *
 * Graph event handler that displays tooltips. <mxGraph.getTooltip> is used to
 * get the tooltip for a cell or handle. This handler is built-into
 * <mxGraph.tooltipHandler> and enabled using <mxGraph.setTooltips>.
 *
 * Example:
 *
 * (code>
 * new mxTooltipHandler(graph);
 * (end)
 *
 * Constructor: mxTooltipHandler
 *
 * Constructs an event handler that displays tooltips with the specified
 * delay (in milliseconds). If no delay is specified then a default delay
 * of 500 ms (0.5 sec) is used.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * delay - Optional delay in milliseconds.
 */
class TooltipHandler implements GraphPlugin {
  static pluginId = 'TooltipHandler';

  constructor(graph: Graph) {
    this.graph = graph;
    this.delay = 500;
    this.graph.addMouseListener(this);

    this.div = document.createElement('div');
    this.div.className = 'mxTooltip';
    this.div.style.visibility = 'hidden';

    document.body.appendChild(this.div);

    InternalEvent.addGestureListeners(this.div, (evt) => {
      const source = getSource(evt);

      // @ts-ignore nodeName may exist
      if (source && source.nodeName !== 'A') {
        this.hideTooltip();
      }
    });

    // Hides tooltips and resets tooltip timer if mouse leaves container
    InternalEvent.addListener(
      this.graph.getContainer(),
      'mouseleave',
      (evt: MouseEvent) => {
        if (this.div !== evt.relatedTarget) {
          this.hide();
        }
      }
    );
  }

  div: HTMLElement;

  /**
   * Variable: zIndex
   *
   * Specifies the zIndex for the tooltip and its shadow. Default is 10005.
   */
  zIndex = 10005;

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  graph: Graph;

  /**
   * Variable: delay
   *
   * Delay to show the tooltip in milliseconds. Default is 500.
   */
  delay: number;

  /**
   * Variable: ignoreTouchEvents
   *
   * Specifies if touch and pen events should be ignored. Default is true.
   */
  ignoreTouchEvents = true;

  /**
   * Variable: hideOnHover
   *
   * Specifies if the tooltip should be hidden if the mouse is moved over the
   * current cell. Default is false.
   */
  hideOnHover = false;

  /**
   * Variable: destroyed
   *
   * True if this handler was destroyed using <destroy>.
   */
  destroyed = false;

  lastX = 0;
  lastY = 0;
  state: CellState | null = null;
  stateSource = false;
  node: any;
  thread: number | null = null;

  /**
   * Variable: enabled
   *
   * Specifies if events are handled. Default is false.
   */
  enabled = false;

  /**
   * Function: isEnabled
   *
   * Returns true if events are handled. This implementation
   * returns <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Function: setEnabled
   *
   * Enables or disables event handling. This implementation
   * updates <enabled>.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Function: isHideOnHover
   *
   * Returns <hideOnHover>.
   */
  isHideOnHover() {
    return this.hideOnHover;
  }

  /**
   * Function: setHideOnHover
   *
   * Sets <hideOnHover>.
   */
  setHideOnHover(value: boolean) {
    this.hideOnHover = value;
  }

  /**
   * Function: getStateForEvent
   *
   * Returns the <mxCellState> to be used for showing a tooltip for this event.
   */
  getStateForEvent(me: InternalMouseEvent) {
    return me.getState();
  }

  /**
   * Function: mouseDown
   *
   * Handles the event by initiating a rubberband selection. By consuming the
   * event all subsequent events of the gesture are redirected to this
   * handler.
   */
  mouseDown(sender: EventSource, me: InternalMouseEvent) {
    this.reset(me, false);
    this.hideTooltip();
  }

  /**
   * Function: mouseMove
   *
   * Handles the event by updating the rubberband selection.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    if (me.getX() !== this.lastX || me.getY() !== this.lastY) {
      this.reset(me, true);
      const state = this.getStateForEvent(me);

      if (
        this.isHideOnHover() ||
        state !== this.state ||
        (me.getSource() !== this.node &&
          (!this.stateSource ||
            (state != null &&
              this.stateSource ===
                (me.isSource(state.shape) || !me.isSource(state.text)))))
      ) {
        this.hideTooltip();
      }
    }

    this.lastX = me.getX();
    this.lastY = me.getY();
  }

  /**
   * Function: mouseUp
   *
   * Handles the event by resetting the tooltip timer or hiding the existing
   * tooltip.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    this.reset(me, true);
    this.hideTooltip();
  }

  /**
   * Function: resetTimer
   *
   * Resets the timer.
   */
  resetTimer() {
    if (this.thread) {
      window.clearTimeout(this.thread);
      this.thread = null;
    }
  }

  /**
   * Function: reset
   *
   * Resets and/or restarts the timer to trigger the display of the tooltip.
   */
  reset(me: InternalMouseEvent, restart: boolean, state: CellState | null = null) {
    if (!this.ignoreTouchEvents || isMouseEvent(me.getEvent())) {
      this.resetTimer();
      state = state ?? this.getStateForEvent(me);

      if (
        restart &&
        this.isEnabled() &&
        state &&
        this.div.style.visibility === 'hidden'
      ) {
        const node = me.getSource();
        const x = me.getX();
        const y = me.getY();
        const stateSource = me.isSource(state.shape) || me.isSource(state.text);
        const popupMenuHandler = this.graph.getPlugin(
          'PopupMenuHandler'
        ) as PopupMenuHandler;

        this.thread = window.setTimeout(() => {
          if (
            state &&
            node &&
            !this.graph.isEditing() &&
            popupMenuHandler &&
            !popupMenuHandler.isMenuShowing() &&
            !this.graph.isMouseDown
          ) {
            // Uses information from inside event cause using the event at
            // this (delayed) point in time is not possible in IE as it no
            // longer contains the required information (member not found)
            const tip = this.graph.getTooltip(
              state,
              node as HTMLElement | SVGElement,
              x,
              y
            );
            this.show(tip, x, y);
            this.state = state;
            this.node = node;
            this.stateSource = stateSource;
          }
        }, this.delay);
      }
    }
  }

  /**
   * Function: hide
   *
   * Hides the tooltip and resets the timer.
   */
  hide() {
    this.resetTimer();
    this.hideTooltip();
  }

  /**
   * Function: hideTooltip
   *
   * Hides the tooltip.
   */
  hideTooltip() {
    this.div.style.visibility = 'hidden';
    this.div.innerHTML = '';
  }

  /**
   * Function: show
   *
   * Shows the tooltip for the specified cell and optional index at the
   * specified location (with a vertical offset of 10 pixels).
   */
  show(tip: HTMLElement | string | null, x: number, y: number) {
    if (!this.destroyed && tip && tip !== '') {
      const origin = getScrollOrigin();

      this.div.style.zIndex = String(this.zIndex);
      this.div.style.left = `${x + origin.x}px`;
      this.div.style.top = `${y + TOOLTIP_VERTICAL_OFFSET + origin.y}px`;

      if (!isNode(tip)) {
        this.div.innerHTML = (tip as string).replace(/\n/g, '<br>');
      } else {
        this.div.innerHTML = '';
        this.div.appendChild(tip as HTMLElement);
      }

      this.div.style.visibility = '';
      fit(this.div);
    }
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  onDestroy() {
    if (!this.destroyed) {
      this.graph.removeMouseListener(this);
      InternalEvent.release(this.div);

      if (this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }

      this.destroyed = true;
    }
  }
}

export default TooltipHandler;
