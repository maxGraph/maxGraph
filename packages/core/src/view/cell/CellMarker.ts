/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
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
import { intersectsHotspot } from '../../util/MathUtils';
import { Graph } from '../Graph';
import { ColorValue } from '../../types';
import CellState from './CellState';
import InternalMouseEvent from '../event/InternalMouseEvent';
import Cell from './Cell';

/**
 * A helper class to process mouse locations and highlight cells.
 *
 * Helper class to highlight cells. To add a cell marker to an existing graph
 * for highlighting all cells, the following code is used:
 *
 * ```javascript
 * let marker = new mxCellMarker(graph);
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
 * Event: mxEvent.MARK
 *
 * Fires after a cell has been marked or unmarked. The <code>state</code>
 * property contains the marked <CellState> or null if no state is marked.
 *
 * Constructor: mxCellMarker
 *
 * Constructs a new cell marker.
 *
 * @param graph Reference to the enclosing {@link Graph}.
 * @param validColor Optional marker color for valid states. Default is
 * {@link Constants#DEFAULT_VALID_COLOR}.
 * @param invalidColor Optional marker color for invalid states. Default is
 * {@link Constants#DEFAULT_INVALID_COLOR}.
 * @param hotspot Portion of the width and hight where a state intersects a
 * given coordinate pair. A value of 0 means always highlight. Default is
 * {@link Constants#DEFAULT_HOTSPOT}.
 */
class CellMarker extends EventSource {
  /**
   * Reference to the enclosing {@link Graph}.
   */
  graph: Graph;

  /**
   * Specifies if the marker is enabled. Default is true.
   */
  enabled = true;

  /**
   * Specifies the portion of the width and height that should trigger
   * a highlight. The area around the center of the cell to be marked is used
   * as the hotspot. Possible values are between 0 and 1. Default is
   * mxConstants.DEFAULT_HOTSPOT.
   */
  hotspot = DEFAULT_HOTSPOT;

  /**
   * Specifies if the hotspot is enabled. Default is false.
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
   * Holds the marked <CellState> if it is valid.
   */
  validState: CellState | null = null;

  /**
   * Holds the marked <CellState>.
   */
  markedState: CellState | null = null;

  highlight: CellHighlight;

  constructor(
    graph: Graph,
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
   * Enables or disables event handling. This implementation
   * updates <enabled>.
   *
   * @param enabled Boolean that specifies the new enabled state.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Returns true if events are handled. This implementation
   * returns <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Sets the <hotspot>.
   */
  setHotspot(hotspot: number) {
    this.hotspot = hotspot;
  }

  /**
   * Returns the <hotspot>.
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
   * Returns true if <validState> is not null.
   */
  hasValidState() {
    return !!this.validState;
  }

  /**
   * Returns the <validState>.
   */
  getValidState() {
    return this.validState;
  }

  /**
   * Returns the {@link arkedState}.
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
   * Processes the given event and cell and marks the state returned by
   * <getState> with the color returned by <getMarkerColor>. If the
   * markerColor is not null, then the state is stored in {@link arkedState}. If
   * <isValidState> returns true, then the state is stored in <validState>
   * regardless of the marker color. The state is returned regardless of the
   * marker color and valid state.
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
   * Marks the given cell using the given color, or <validColor> if no color is specified.
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
   * Marks the {@link arkedState} and fires a {@link ark} event.
   */
  mark() {
    this.highlight.setHighlightColor(this.currentColor);
    this.highlight.highlight(this.markedState);
    this.fireEvent(new EventObject(InternalEvent.MARK, 'state', this.markedState));
  }

  /**
   * Hides the marker and fires a {@link ark} event.
   */
  unmark(): void {
    this.mark();
  }

  /**
   * Returns true if the given <CellState> is a valid state. If this
   * returns true, then the state is stored in <validState>. The return value
   * of this method is used as the argument for <getMarkerColor>.
   */
  isValidState(state: CellState): boolean {
    return true;
  }

  /**
   * Returns the valid- or invalidColor depending on the value of isValid.
   * The given <CellState> is ignored by this implementation.
   */
  getMarkerColor(evt: Event, state: CellState | null, isValid: boolean) {
    return isValid ? this.validColor : this.invalidColor;
  }

  /**
   * Uses <getCell>, <getStateToMark> and <intersects> to return the
   * <CellState> for the given {@link MouseEvent}.
   */
  getState(me: InternalMouseEvent) {
    const view = this.graph.getView();
    const cell = this.getCell(me);

    if (!cell) return null;

    const state = this.getStateToMark(view.getState(cell));

    return state && this.intersects(state, me) ? state : null;
  }

  /**
   * Returns the <Cell> for the given event and cell. This returns the
   * given cell.
   */
  getCell(me: InternalMouseEvent) {
    return me.getCell();
  }

  /**
   * Returns the <CellState> to be marked for the given <CellState> under
   * the mouse. This returns the given state.
   */
  getStateToMark(state: CellState | null) {
    return state;
  }

  /**
   * Returns true if the given coordinate pair intersects the given state.
   * This returns true if the <hotspot> is 0 or the coordinates are inside
   * the hotspot for the given cell state.
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
