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

import InternalEvent from '../event/InternalEvent.js';
import { fit, getScrollOrigin } from '../../util/styleUtils.js';
import { TOOLTIP_VERTICAL_OFFSET } from '../../util/Constants.js';
import { getSource, isMouseEvent } from '../../util/EventUtils.js';
import { isNode } from '../../util/domUtils.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import CellState from '../cell/CellState.js';
import InternalMouseEvent from '../event/InternalMouseEvent.js';
import type PopupMenuHandler from './PopupMenuHandler.js';
import type { GraphPlugin, MouseListenerSet } from '../../types.js';
import type EventSource from '../event/EventSource.js';
import { htmlEntities } from '../../util/StringUtils.js';
import { translate } from '../../internal/i18n-utils.js';
import type Shape from '../shape/Shape.js';
import type SelectionCellsHandler from './SelectionCellsHandler.js';
import type Cell from '../cell/Cell.js';

/**
 * Plugin that displays tooltips.
 * It is generally enabled using {@link AbstractGraph.setTooltips}.
 *
 * {@link getTooltip} is used to get the tooltip for a cell or handle.
 *
 * **IMPORTANT**: Provides additional tooltip information on edges when the {@link SelectionCellsHandler} (cell selection) plugin is available. See {@link getTooltip} for more details.
 *
 * @category Plugin
 */
class TooltipHandler implements GraphPlugin, MouseListenerSet {
  static pluginId = 'TooltipHandler';

  /**
   * Creates the tooltip element and appends it to the document body.
   *
   */
  init() {
    if (document.body) {
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
  }

  /**
   * Constructs an event handler that displays tooltips.
   *
   * @param graph Reference to the enclosing {@link AbstractGraph}.
   */
  constructor(graph: AbstractGraph) {
    this.graph = graph;
    this.graph.addMouseListener(this);
  }

  div?: HTMLElement | null;

  /**
   * Specifies the zIndex for the tooltip and its shadow.
   * @default 10005
   */
  zIndex = 10005;

  /**
   * Reference to the enclosing {@link AbstractGraph}.
   */
  graph: AbstractGraph;

  /**
   * Delay to show the tooltip in milliseconds.
   * @default 500
   */
  delay = 500;

  /**
   * Specifies if touch and pen events should be ignored.
   * @default true
   */
  ignoreTouchEvents = true;

  /**
   * Specifies if the tooltip should be hidden if the mouse is moved over the current cell.
   * @default false
   */
  hideOnHover = false;

  /**
   * `true` if this handler was destroyed using {@link onDestroy}.
   */
  destroyed = false;

  lastX = 0;
  lastY = 0;
  state: CellState | null = null;
  stateSource = false;
  node: any;
  thread: number | null = null;

  /**
   * Specifies if events are handled.
   * @default false
   */
  enabled = false;

  /**
   * Returns `true` if events are handled.
   *
   * This implementation returns {@link enabled}.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Enables or disables event handling.
   *
   * This implementation updates {@link enabled}.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Returns {@link hideOnHover}.
   */
  isHideOnHover() {
    return this.hideOnHover;
  }

  /**
   * Sets {@link hideOnHover}.
   */
  setHideOnHover(value: boolean) {
    this.hideOnHover = value;
  }

  /**
   * Returns the {@link CellState}. to be used for showing a tooltip for this event.
   */
  getStateForEvent(me: InternalMouseEvent) {
    return me.getState();
  }

  mouseDown(_sender: EventSource, me: InternalMouseEvent) {
    this.reset(me, false);
    this.hideTooltip();
  }

  mouseMove(_sender: EventSource, me: InternalMouseEvent) {
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
   * Handles the event by resetting the tooltip timer or hiding the existing tooltip.
   */
  mouseUp(_sender: EventSource, me: InternalMouseEvent) {
    this.reset(me, true);
    this.hideTooltip();
  }

  /**
   * Resets the timer.
   */
  resetTimer() {
    if (this.thread) {
      window.clearTimeout(this.thread);
      this.thread = null;
    }
  }

  /**
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
        (!this.div || this.div.style.visibility == 'hidden')
      ) {
        const node = me.getSource();
        const x = me.getX();
        const y = me.getY();
        const stateSource = me.isSource(state.shape) || me.isSource(state.text);
        const popupMenuHandler =
          this.graph.getPlugin<PopupMenuHandler>('PopupMenuHandler');

        this.thread = window.setTimeout(() => {
          if (
            state &&
            node &&
            !this.graph.isEditing() &&
            !popupMenuHandler?.isMenuShowing() &&
            !this.graph.isMouseDown
          ) {
            // Uses information from inside event cause using the event at
            // this (delayed) point in time is not possible in IE as it no
            // longer contains the required information (member not found)
            const tip = this.getTooltip(state, node as HTMLElement | SVGElement, x, y);
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
   * Hides the tooltip and resets the timer.
   */
  hide() {
    this.resetTimer();
    this.hideTooltip();
  }

  /**
   * Hides the tooltip.
   */
  hideTooltip() {
    if (this.div) {
      this.div.style.visibility = 'hidden';
      this.div.innerHTML = '';
    }
  }

  /**
   * Shows the tooltip for the specified cell and optional index at the
   * specified location (with a vertical offset of 10 pixels).
   */
  show(tip: HTMLElement | string | null, x: number, y: number) {
    if (!this.destroyed && tip && tip !== '') {
      const origin = getScrollOrigin();
      if (!this.div) {
        this.init();
      }
      this.div!.style.zIndex = String(this.zIndex);
      this.div!.style.left = `${x + origin.x}px`;
      this.div!.style.top = `${y + TOOLTIP_VERTICAL_OFFSET + origin.y}px`;

      if (!isNode(tip)) {
        this.div!.innerHTML = (tip as string).replace(/\n/g, '<br>');
      } else {
        this.div!.innerHTML = '';
        this.div!.appendChild(tip as HTMLElement);
      }

      this.div!.style.visibility = '';
      fit(this.div!);
    }
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   */
  onDestroy() {
    if (!this.destroyed) {
      this.resetTimer();
      this.graph.removeMouseListener(this);
      if (this.div) {
        InternalEvent.release(this.div);
      }

      if (this.div?.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }

      this.destroyed = true;
      this.div = null;
    }
  }

  /**
   * Returns the string or DOM node that represents the tooltip for the given state, node and coordinate pair.
   *
   * This implementation checks if the given node is a folding icon or overlay and returns the respective tooltip.
   * - If this does not result in a tooltip, the handler for the cell is retrieved from {@link SelectionCellsHandler} and the optional `getTooltipForNode` method is called.
   * - If no special tooltip exists here then {@link getTooltipForCell} is used with the cell in the given state as the argument to return a tooltip for the given state.
   *
   * @param state {@link CellState} whose tooltip should be returned.
   * @param node DOM node that is currently under the mouse.
   * @param x X-coordinate of the mouse.
   * @param y Y-coordinate of the mouse.
   *
   * @since 0.23.0
   */
  getTooltip(
    state: CellState,
    node: HTMLElement | SVGElement,
    x: number,
    y: number
  ): HTMLElement | string | null {
    let tip: HTMLElement | string | null = null;

    // Checks if the mouse is over the folding icon
    if (
      state.control &&
      (node === state.control.node || node.parentNode === state.control.node)
    ) {
      tip = this.graph.getCollapseExpandResource();
      tip = htmlEntities(translate(tip) || tip, true).replace(/\\n/g, '<br>');
    }

    if (!tip && state.overlays) {
      state.overlays.forEach((shape: Shape) => {
        // LATER: Exit loop if tip is not null
        if (!tip && (node === shape.node || node.parentNode === shape.node)) {
          tip = shape.overlay ? (shape.overlay.toString() ?? null) : null;
        }
      });
    }

    if (!tip) {
      const selectionCellsHandler = this.graph.getPlugin<SelectionCellsHandler>(
        'SelectionCellsHandler'
      );

      const handler = selectionCellsHandler?.getHandler(state.cell);

      if (
        handler &&
        // this method exists at least in EdgeSegmentHandler and ElbowEdgeHandler
        'getTooltipForNode' in handler &&
        typeof handler.getTooltipForNode === 'function'
      ) {
        tip = handler.getTooltipForNode(node);
      }
    }

    if (!tip) {
      tip = this.getTooltipForCell(state.cell);
    }

    return tip;
  }

  /**
   * Returns the string or DOM node to be used as the tooltip for the given cell.
   * This implementation uses the {@link Cell.getTooltip} function if it exists, or else it returns {@link convertValueToString} for the cell.
   *
   * To replace all tooltips with the string "Hello, World!", use the following code:
   *
   * ```typescript
   * const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler')!;
   * tooltipHandler.getTooltipForCell = function(cell) {
   *   return 'Hello, World!';
   * }
   * ```
   *
   * @param cell {@link Cell} whose tooltip should be returned.
   *
   * @since 0.23.0
   */
  getTooltipForCell(cell: Cell): string {
    // Special case for cells that implement their own tooltip method
    // Kept for backward compatibility with mxGraph, currently Cell does not have it in the maxGraph core code and demo/examples
    if (cell && 'getTooltip' in cell && typeof cell.getTooltip === 'function') {
      return cell.getTooltip();
    }
    return this.graph.convertValueToString(cell);
  }
}

export default TooltipHandler;
