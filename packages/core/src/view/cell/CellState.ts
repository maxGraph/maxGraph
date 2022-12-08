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

import Point from '../geometry/Point';
import Rectangle from '../geometry/Rectangle';
import Cell from './Cell';
import GraphView from '../../view/GraphView';
import Shape from '../geometry/Shape';
import TextShape from '../geometry/node/TextShape';
import Dictionary from '../../util/Dictionary';
import { ALIGN, NONE } from '../../util/Constants';
import { CellStateStyle } from '../../types';
import RectangleShape from '../geometry/node/RectangleShape';
import CellOverlay from './CellOverlay';
import { Graph } from '../Graph';

/**
 * Represents the current state of a cell in a given {@link GraphView}.
 *
 * For edges, the edge label position is stored in <absoluteOffset>.
 *
 * The size for oversize labels can be retrieved using the boundingBox property
 * of the <text> field as shown below.
 *
 * ```javascript
 * let bbox = (state.text != null) ? state.text.boundingBox : null;
 * ```
 *
 * Constructor: CellState
 *
 * Constructs a new object that represents the current state of the given
 * cell in the specified view.
 *
 * @param view {@link GraphView} that contains the state.
 * @param cell <Cell> that this state represents.
 * @param style Array of key, value pairs that constitute the style.
 */
class CellState extends Rectangle {
  // referenced in mxCellRenderer
  node: HTMLElement | null = null;

  // TODO: Document me!!
  cellBounds: Rectangle | null = null;

  paintBounds: Rectangle | null = null;

  boundingBox: Rectangle | null = null;

  // Used by mxCellRenderer's createControl()
  control: Shape | null = null;

  // Used by mxCellRenderer's createCellOverlays()
  overlays: Dictionary<CellOverlay, Shape> = new Dictionary();

  /**
   * Reference to the enclosing {@link GraphView}.
   */
  view!: GraphView;

  /**
   * Reference to the <Cell> that is represented by this state.
   */
  cell!: Cell;

  /**
   * Contains an array of key, value pairs that represent the style of the
   * cell.
   */
  style!: CellStateStyle;

  /**
   * Specifies if the style is invalid. Default is false.
   */
  invalidStyle = false;

  /**
   * Specifies if the state is invalid. Default is true.
   */
  invalid = true;

  /**
   * {@link Point} that holds the origin for all child cells. Default is a new
   * empty {@link Point}.
   */
  origin: Point;

  /**
   * Holds an array of <Point> that represent the absolute points of an
   * edge.
   */
  absolutePoints: (null | Point)[] = [];

  /**
   * {@link Point} that holds the absolute offset. For edges, this is the
   * absolute coordinates of the label position. For vertices, this is the
   * offset of the label relative to the top, left corner of the vertex.
   */
  absoluteOffset: Point;

  /**
   * Caches the visible source terminal state.
   */
  visibleSourceState: CellState | null = null;

  /**
   * Caches the visible target terminal state.
   */
  visibleTargetState: CellState | null = null;

  /**
   * Caches the distance between the end points for an edge.
   */
  terminalDistance = 0;

  /**
   * Caches the length of an edge.
   */
  length = 0;

  /**
   * Array of numbers that represent the cached length of each segment of the
   * edge.
   */
  segments: number[] = [];

  /**
   * Holds the {@link Shape} that represents the cell graphically.
   */
  shape: Shape | null = null;

  /**
   * Holds the {@link Text} that represents the label of the cell. Thi smay be
   * null if the cell has no label.
   */
  text: TextShape | null = null;

  /**
   * Holds the unscaled width of the state.
   */
  unscaledWidth = 0;

  /**
   * Holds the unscaled height of the state.
   */
  unscaledHeight = 0;

  parentHighlight: RectangleShape | null = null;

  point: Point | null = null;

  constructor(
    view: GraphView | null = null,
    cell: Cell | null = null,
    style: CellStateStyle | null = null
  ) {
    super();

    if (view) {
      this.view = view;
    }
    if (cell) {
      this.cell = cell;
    }
    this.style = style ?? {};

    this.origin = new Point();
    this.absoluteOffset = new Point();
  }

  /**
   * Returns the {@link Rectangle} that should be used as the perimeter of the
   * cell.
   *
   * @param border Optional border to be added around the perimeter bounds.
   * @param bounds Optional {@link Rectangle} to be used as the initial bounds.
   */
  getPerimeterBounds(
    border = 0,
    bounds: Rectangle = new Rectangle(this.x, this.y, this.width, this.height)
  ) {
    if (this.shape?.stencil?.aspect === 'fixed') {
      const aspect = this.shape.stencil.computeAspect(
        this.shape,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height
      );

      bounds.x = aspect.x;
      bounds.y = aspect.y;
      bounds.width = this.shape.stencil.w0 * aspect.width;
      bounds.height = this.shape.stencil.h0 * aspect.height;
    }

    if (border !== 0) {
      bounds.grow(border);
    }

    return bounds;
  }

  /**
   * Sets the first or last point in <absolutePoints> depending on isSource.
   *
   * @param point {@link Point} that represents the terminal point.
   * @param isSource Boolean that specifies if the first or last point should
   * be assigned.
   */
  setAbsoluteTerminalPoint(point: Point | null, isSource = false) {
    if (isSource) {
      if (this.absolutePoints.length === 0) {
        this.absolutePoints.push(point);
      } else {
        this.absolutePoints[0] = point;
      }
    } else if (this.absolutePoints.length === 0) {
      this.absolutePoints.push(null);
      this.absolutePoints.push(point);
    } else if (this.absolutePoints.length === 1) {
      this.absolutePoints.push(point);
    } else {
      this.absolutePoints[this.absolutePoints.length - 1] = point;
    }
  }

  /**
   * Sets the given cursor on the shape and text shape.
   */
  setCursor(cursor: string) {
    if (this.shape) {
      this.shape.setCursor(cursor);
    }
    if (this.text) {
      this.text.setCursor(cursor);
    }
  }

  /**
   * Returns the visible source or target terminal cell.
   *
   * @param source Boolean that specifies if the source or target cell should be
   * returned.
   */
  getVisibleTerminal(source = false) {
    const tmp = this.getVisibleTerminalState(source);
    return tmp ? tmp.cell : null;
  }

  /**
   * Returns the visible source or target terminal state.
   *
   * @param source Boolean that specifies if the source or target state should be
   * returned.
   */
  getVisibleTerminalState(source = false): CellState | null {
    return source ? this.visibleSourceState : this.visibleTargetState;
  }

  /**
   * Sets the visible source or target terminal state.
   *
   * @param terminalState <CellState> that represents the terminal.
   * @param source Boolean that specifies if the source or target state should be set.
   */
  setVisibleTerminalState(terminalState: CellState | null, source = false) {
    if (source) {
      this.visibleSourceState = terminalState;
    } else {
      this.visibleTargetState = terminalState;
    }
  }

  /**
   * Returns the unscaled, untranslated bounds.
   */
  getCellBounds() {
    return this.cellBounds;
  }

  /**
   * Returns the unscaled, untranslated paint bounds. This is the same as
   * <getCellBounds> but with a 90 degree rotation if the shape's
   * isPaintBoundsInverted returns true.
   */
  getPaintBounds() {
    return this.paintBounds;
  }

  /**
   * Updates the cellBounds and paintBounds.
   */
  updateCachedBounds() {
    const view = this.view;
    const tr = view.translate;
    const s = view.scale;

    this.cellBounds = new Rectangle(
      this.x / s - tr.x,
      this.y / s - tr.y,
      this.width / s,
      this.height / s
    );
    this.paintBounds = Rectangle.fromRectangle(this.cellBounds);

    if (this.shape && this.shape.isPaintBoundsInverted()) {
      this.paintBounds.rotate90();
    }
  }

  /**
   * Destructor: setState
   *
   * Copies all fields from the given state to this state.
   */
  setState(state: CellState) {
    this.view = state.view;
    this.cell = state.cell;
    this.style = state.style;
    this.absolutePoints = state.absolutePoints;
    this.origin = state.origin;
    this.absoluteOffset = state.absoluteOffset;
    this.boundingBox = state.boundingBox;
    this.terminalDistance = state.terminalDistance;
    this.segments = state.segments;
    this.length = state.length;
    this.x = state.x;
    this.y = state.y;
    this.width = state.width;
    this.height = state.height;
    this.unscaledWidth = state.unscaledWidth;
    this.unscaledHeight = state.unscaledHeight;
  }

  /**
   * Returns a clone of this {@link Point}.
   */
  clone() {
    const clone = new CellState(this.view, this.cell, this.style);

    // Clones the absolute points
    for (let i = 0; i < this.absolutePoints.length; i += 1) {
      const p = this.absolutePoints[i];
      clone.absolutePoints[i] = p ? p.clone() : null;
    }

    if (this.origin) {
      clone.origin = this.origin.clone();
    }

    if (this.absoluteOffset) {
      clone.absoluteOffset = this.absoluteOffset.clone();
    }

    if (this.boundingBox) {
      clone.boundingBox = this.boundingBox.clone();
    }

    clone.terminalDistance = this.terminalDistance;
    clone.segments = this.segments;
    clone.length = this.length;
    clone.x = this.x;
    clone.y = this.y;
    clone.width = this.width;
    clone.height = this.height;
    clone.unscaledWidth = this.unscaledWidth;
    clone.unscaledHeight = this.unscaledHeight;

    return clone;
  }

  /**
   * Destructor: destroy
   *
   * Destroys the state and all associated resources.
   */
  destroy() {
    (<Graph>this.view.graph).cellRenderer.destroy(this);
  }

  /**
   * Returns true if the given cell state is a loop.
   *
   * @param state {@link CellState} that represents a potential loop.
   */
  isLoop(state: CellState) {
    const src = this.getVisibleTerminalState(true);
    const trg = this.getVisibleTerminalState(false);

    return src && src === trg;
  }

  /*****************************************************************************
   * Group: Graph appearance
   *****************************************************************************/

  /**
   * Returns the vertical alignment for the given cell state. This
   * implementation returns the value stored under
   * {@link 'verticalAlign'} in the cell style.
   *
   * @param state {@link CellState} whose vertical alignment should be
   * returned.
   */
  getVerticalAlign() {
    return this.style.verticalAlign ?? ALIGN.MIDDLE;
  }

  /**
   * Returns true if the given state has no stroke- or fillcolor and no image.
   *
   * @param state {@link CellState} to check.
   */
  isTransparentState() {
    let result = false;

    const stroke = this.style.strokeColor ?? NONE;
    const fill = this.style.fillColor ?? NONE;

    result = stroke === NONE && fill === NONE && !this.getImageSrc();

    return result;
  }

  /**
   * Returns the image URL for the given cell state. This implementation
   * returns the value stored under {@link 'image'} in the cell
   * style.
   *
   * @param state {@link CellState} whose image URL should be returned.
   */
  getImageSrc() {
    return this.style.image || null;
  }

  /**
   * Returns the indicator color for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_COLOR} in the cell style.
   *
   * @param state {@link CellState} whose indicator color should be
   * returned.
   */
  getIndicatorColor() {
    return this.style.indicatorColor || null;
  }

  /**
   * Returns the indicator gradient color for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_GRADIENTCOLOR} in the cell style.
   *
   * @param state {@link CellState} whose indicator gradient color should be
   * returned.
   */
  getIndicatorGradientColor() {
    return this.style.gradientColor || null;
  }

  /**
   * Returns the indicator shape for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_SHAPE} in the cell style.
   *
   * @param state {@link CellState} whose indicator shape should be returned.
   */
  getIndicatorShape() {
    return this.style.indicatorShape || null;
  }

  /**
   * Returns the indicator image for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_IMAGE} in the cell style.
   *
   * @param state {@link CellState} whose indicator image should be returned.
   */
  getIndicatorImageSrc() {
    return this.style.indicatorImage || null;
  }
}

export default CellState;
