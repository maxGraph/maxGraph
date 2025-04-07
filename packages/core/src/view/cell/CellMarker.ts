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

import EventSource from '../event/EventSource';
import {
  DEFAULT_HOTSPOT,
  DEFAULT_INVALID_COLOR,
  DEFAULT_VALID_COLOR,
  MAX_HOTSPOT_SIZE,
  MIN_HOTSPOT_SIZE,
  NONE,
} from '../../util/Constants';
import CellHighlight from './CellHighlight';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import { intersectsHotspot } from '../../util/mathUtils';
import type { AbstractGraph } from '../AbstractGraph';
import { ColorValue } from '../../types';
import type CellState from './CellState';
import InternalMouseEvent from '../event/InternalMouseEvent';
import type Cell from './Cell';

/**
 * A helper class to process mouse locations and highlight cells.
 *
 * Helper class to highlight cells. To add a cell marker to an existing graph
 * for highlighting all cells, the following code is used:
 *
 * ```javascript
 * const marker = new CellMarker(graph);
 * graph.addMouseListener({
 *   mouseDown: ()=> {},
 *   mouseMove: (sender, me)=>
 *   {
 *     marker.process(me);
 *   },
 *   mouseUp: ()=> {}
 * });
 * ```
 *
 * **Event: {@link InternalEvent.MARK}**
 *
 * Fires after a cell has been marked or unmarked. The `state` property contains the marked <CellState> or null if no state is marked.
 */
class CellMarker extends EventSource {
  /**
   * Reference to the enclosing {@link Graph}.
   */
  graph: AbstractGraph;

  /**
   * Specifies if the marker is enabled.
   * @default true
   */
  enabled = true;

  /**
   * Specifies the portion of the width and height that should trigger a highlight.
   *
   * The area around the center of the cell to be marked is used as the hotspot. Possible values are between 0 and 1.
   * @default DEFAULT_HOTSPOT
   */
  hotspot = DEFAULT_HOTSPOT;

  /**
   * Specifies if the hotspot is enabled.
   * @default false
   */
  hotspotEnabled = false;

  /**
   * Holds the valid marker color.
   */
  validColor: ColorValue;

  /**
   * Holds the invalid marker color.
   */
  invalidColor: ColorValue;

  /**
   * Holds the current marker color.
   */
  currentColor: ColorValue = NONE;

  /**
   * Holds the marked {@link CellState} if it is valid.
   */
  validState: CellState | null = null;

  /**
   * Holds the marked {@link CellState}.
   */
  markedState: CellState | null = null;

  highlight: CellHighlight;

  /**
   * Constructs a new cell marker.
   *
   * @param graph Reference to the enclosing {@link Graph}.
   * @param validColor Optional marker color for valid states. Default is {@link DEFAULT_VALID_COLOR}.
   * @param invalidColor Optional marker color for invalid states. Default is {@link DEFAULT_INVALID_COLOR}.
   * @param hotspot Portion of the width and height where a state intersects a given coordinate pair. A value of 0 means always highlight. Default is {@link DEFAULT_HOTSPOT}.
   */
  constructor(
    graph: AbstractGraph,
    validColor: ColorValue = DEFAULT_VALID_COLOR,
    invalidColor: ColorValue = DEFAULT_INVALID_COLOR,
    hotspot: number = DEFAULT_HOTSPOT
  ) {
    super();

    this.graph = graph;
    this.validColor = validColor;
    this.invalidColor = invalidColor;
    this.hotspot = hotspot;
    this.highlight = new CellHighlight(graph);
  }

  /**
   * Enables or disables event handling.
   * This implementation updates {@link enabled}.
   *
   * @param enabled Boolean that specifies the new enabled state.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Returns true if events are handled.
   * This implementation returns {@link enabled}.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Sets the {@link hotspot}.
   */
  setHotspot(hotspot: number) {
    this.hotspot = hotspot;
  }

  /**
   * Returns the {@link hotspot}.
   */
  getHotspot() {
    return this.hotspot;
  }

  /**
   * Specifies whether the hotspot should be used in <intersects>.
   */
  setHotspotEnabled(enabled: boolean) {
    this.hotspotEnabled = enabled;
  }

  /**
   * Returns true if hotspot is used in <intersects>.
   */
  isHotspotEnabled() {
    return this.hotspotEnabled;
  }

  /**
   * Returns true if {@link validState} is not `null`.
   */
  hasValidState() {
    return !!this.validState;
  }

  /**
   * Returns the {@link validState}.
   */
  getValidState() {
    return this.validState;
  }

  /**
   * Returns the {@link markedState}.
   */
  getMarkedState() {
    return this.markedState;
  }

  /**
   * Resets the state of the cell marker.
   */
  reset() {
    this.validState = null;

    if (this.markedState) {
      this.markedState = null;
      this.unmark();
    }
  }

  /**
   * Processes the given event and cell and marks the state returned by {@link getState} with the color returned by {@link getMarkerColor}.
   * If the markerColor is not `null`, then the state is stored in {@link markedState}.
   * If {@link isValidState} returns `true`, then the state is stored in {@link validState} regardless of the marker color.
   * The state is returned regardless of the marker color and valid state.
   */
  process(me: InternalMouseEvent) {
    let state = null;

    if (this.isEnabled()) {
      state = this.getState(me);
      this.setCurrentState(state, me);
    }

    return state;
  }

  /**
   * Sets and marks the current valid state.
   */
  setCurrentState(state: CellState | null, me: InternalMouseEvent, color?: ColorValue) {
    const isValid = state ? this.isValidState(state) : false;
    color = color ?? this.getMarkerColor(me.getEvent(), state, isValid);

    if (isValid) {
      this.validState = state;
    } else {
      this.validState = null;
    }

    if (state !== this.markedState || color !== this.currentColor) {
      this.currentColor = color;

      if (state && this.currentColor !== NONE) {
        this.markedState = state;
        this.mark();
      } else if (this.markedState) {
        this.markedState = null;
        this.unmark();
      }
    }
  }

  /**
   * Marks the given cell using the given color, or {@link validColor} if no color is specified.
   */
  markCell(cell: Cell, color: ColorValue) {
    const state = this.graph.getView().getState(cell);

    if (state) {
      this.currentColor = color ?? this.validColor;
      this.markedState = state;
      this.mark();
    }
  }

  /**
   * Marks the {@link markedState} and fires a {@link InternalEvent.MARK} event.
   */
  mark() {
    this.highlight.setHighlightColor(this.currentColor);
    this.highlight.highlight(this.markedState);
    this.fireEvent(new EventObject(InternalEvent.MARK, 'state', this.markedState));
  }

  /**
   * Hides the marker and fires a {@link InternalEvent.MARK} event.
   */
  unmark(): void {
    this.mark();
  }

  /**
   * Returns true if the given {@link CellState} is a valid state.
   * If this returns `true`, then the state is stored in {@link validState}.
   * The return value of this method is used as the argument for {@link getMarkerColor}.
   */
  isValidState(state: CellState): boolean {
    return true;
  }

  /**
   * Returns the {@link validColor} or {@link invalidColor} depending on the value of {@link isValid}.
   * The given {@link CellState} is ignored by this implementation.
   */
  getMarkerColor(evt: Event, state: CellState | null, isValid: boolean) {
    return isValid ? this.validColor : this.invalidColor;
  }

  /**
   * Uses {@link getCell}, {@link getStateToMark} and {@link intersects} to return the {@link CellState} for the given {@link MouseEvent}.
   */
  getState(me: InternalMouseEvent) {
    const view = this.graph.getView();
    const cell = this.getCell(me);

    if (!cell) return null;

    const state = this.getStateToMark(view.getState(cell));

    return state && this.intersects(state, me) ? state : null;
  }

  /**
   * Returns the {@link Cell} for the given event and cell.
   * This implementation returns the given cell.
   */
  getCell(me: InternalMouseEvent) {
    return me.getCell();
  }

  /**
   * Returns the {@link CellState} to be marked for the given {@link CellState} under the mouse.
   * This implementation returns the given state.
   */
  getStateToMark(state: CellState | null) {
    return state;
  }

  /**
   * Returns `true` if the given coordinate pair intersects the given state.
   * This returns `true` if the {@link hotspot} is `0` or the coordinates are inside the hotspot for the given cell state.
   */
  intersects(state: CellState, me: InternalMouseEvent) {
    const x = me.getGraphX();
    const y = me.getGraphY();

    if (this.hotspotEnabled) {
      return intersectsHotspot(
        state,
        x,
        y,
        this.hotspot,
        MIN_HOTSPOT_SIZE,
        MAX_HOTSPOT_SIZE
      );
    }

    return true;
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   */
  destroy() {
    this.highlight.destroy();
  }
}

export default CellMarker;
