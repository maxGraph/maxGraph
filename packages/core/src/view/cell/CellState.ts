/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Point from '../geometry/Point';
import Rectangle from '../geometry/Rectangle';
import Cell from './Cell';
import GraphView from '../../view/GraphView';
import Shape from '../geometry/Shape';
import TextShape from '../geometry/node/TextShape';
import Dictionary from '../../util/Dictionary';
import { ALIGN, NONE } from '../../util/constants';
import { CellStateStyles } from '../../types';
import RectangleShape from '../geometry/node/RectangleShape';
import CellOverlay from './CellOverlay';

/**
 * Class: CellState
 *
 * Represents the current state of a cell in a given <mxGraphView>.
 *
 * For edges, the edge label position is stored in <absoluteOffset>.
 *
 * The size for oversize labels can be retrieved using the boundingBox property
 * of the <text> field as shown below.
 *
 * (code)
 * let bbox = (state.text != null) ? state.text.boundingBox : null;
 * (end)
 *
 * Constructor: CellState
 *
 * Constructs a new object that represents the current state of the given
 * cell in the specified view.
 *
 * Parameters:
 *
 * view - <mxGraphView> that contains the state.
 * cell - <Cell> that this state represents.
 * style - Array of key, value pairs that constitute the style.
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
   * Variable: view
   *
   * Reference to the enclosing <mxGraphView>.
   */
  view: GraphView;

  /**
   * Variable: cell
   *
   * Reference to the <Cell> that is represented by this state.
   */
  cell: Cell;

  /**
   * Variable: style
   *
   * Contains an array of key, value pairs that represent the style of the
   * cell.
   */
  style: CellStateStyles;

  /**
   * Variable: invalidStyle
   *
   * Specifies if the style is invalid. Default is false.
   */
  invalidStyle = false;

  /**
   * Variable: invalid
   *
   * Specifies if the state is invalid. Default is true.
   */
  invalid = true;

  /**
   * Variable: origin
   *
   * <mxPoint> that holds the origin for all child cells. Default is a new
   * empty <mxPoint>.
   */
  origin: Point;

  /**
   * Variable: absolutePoints
   *
   * Holds an array of <Point> that represent the absolute points of an
   * edge.
   */
  absolutePoints: (null | Point)[] = [];

  /**
   * Variable: absoluteOffset
   *
   * <mxPoint> that holds the absolute offset. For edges, this is the
   * absolute coordinates of the label position. For vertices, this is the
   * offset of the label relative to the top, left corner of the vertex.
   */
  absoluteOffset: Point;

  /**
   * Variable: visibleSourceState
   *
   * Caches the visible source terminal state.
   */
  visibleSourceState: CellState | null = null;

  /**
   * Variable: visibleTargetState
   *
   * Caches the visible target terminal state.
   */
  visibleTargetState: CellState | null = null;

  /**
   * Variable: terminalDistance
   *
   * Caches the distance between the end points for an edge.
   */
  terminalDistance = 0;

  /**
   * Variable: length
   *
   * Caches the length of an edge.
   */
  length = 0;

  /**
   * Variable: segments
   *
   * Array of numbers that represent the cached length of each segment of the
   * edge.
   */
  segments: number[] = [];

  /**
   * Variable: shape
   *
   * Holds the <mxShape> that represents the cell graphically.
   */
  shape: Shape | null = null;

  /**
   * Variable: text
   *
   * Holds the <mxText> that represents the label of the cell. Thi smay be
   * null if the cell has no label.
   */
  text: TextShape | null = null;

  /**
   * Variable: unscaledWidth
   *
   * Holds the unscaled width of the state.
   */
  unscaledWidth = 0;

  /**
   * Variable: unscaledHeight
   *
   * Holds the unscaled height of the state.
   */
  unscaledHeight = 0;

  parentHighlight: RectangleShape | null = null;

  point: Point | null = null;

  constructor(view: GraphView | null=null, cell: Cell | null=null, style: CellStateStyles | null=null) {
    super();

    this.view = view;
    this.cell = cell;
    this.style = style ?? {};

    this.origin = new Point();
    this.absoluteOffset = new Point();
  }

  /**
   * Function: getPerimeterBounds
   *
   * Returns the <mxRectangle> that should be used as the perimeter of the
   * cell.
   *
   * Parameters:
   *
   * border - Optional border to be added around the perimeter bounds.
   * bounds - Optional <mxRectangle> to be used as the initial bounds.
   */
  getPerimeterBounds(
    border: number = 0,
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
   * Function: setAbsoluteTerminalPoint
   *
   * Sets the first or last point in <absolutePoints> depending on isSource.
   *
   * Parameters:
   *
   * point - <mxPoint> that represents the terminal point.
   * isSource - Boolean that specifies if the first or last point should
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
   * Function: setCursor
   *
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
   * Function: getVisibleTerminal
   *
   * Returns the visible source or target terminal cell.
   *
   * Parameters:
   *
   * source - Boolean that specifies if the source or target cell should be
   * returned.
   */
  getVisibleTerminal(source = false) {
    const tmp = this.getVisibleTerminalState(source);
    return tmp ? tmp.cell : null;
  }

  /**
   * Function: getVisibleTerminalState
   *
   * Returns the visible source or target terminal state.
   *
   * Parameters:
   *
   * source - Boolean that specifies if the source or target state should be
   * returned.
   */
  getVisibleTerminalState(source = false): CellState | null {
    return source ? this.visibleSourceState : this.visibleTargetState;
  }

  /**
   * Function: setVisibleTerminalState
   *
   * Sets the visible source or target terminal state.
   *
   * Parameters:
   *
   * terminalState - <CellState> that represents the terminal.
   * source - Boolean that specifies if the source or target state should be set.
   */
  setVisibleTerminalState(terminalState: CellState | null, source = false) {
    if (source) {
      this.visibleSourceState = terminalState;
    } else {
      this.visibleTargetState = terminalState;
    }
  }

  /**
   * Function: getCellBounds
   *
   * Returns the unscaled, untranslated bounds.
   */
  getCellBounds() {
    return this.cellBounds;
  }

  /**
   * Function: getPaintBounds
   *
   * Returns the unscaled, untranslated paint bounds. This is the same as
   * <getCellBounds> but with a 90 degree rotation if the shape's
   * isPaintBoundsInverted returns true.
   */
  getPaintBounds() {
    return this.paintBounds;
  }

  /**
   * Function: updateCachedBounds
   *
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
   * Function: clone
   *
   * Returns a clone of this <mxPoint>.
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
    this.view.graph.cellRenderer.destroy(this);
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
    return this.style.image;
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
    return this.style.indicatorColor;
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
    return this.style.gradientColor;
  }

  /**
   * Returns the indicator shape for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_SHAPE} in the cell style.
   *
   * @param state {@link CellState} whose indicator shape should be returned.
   */
  getIndicatorShape() {
    return this.style.indicatorShape;
  }

  /**
   * Returns the indicator image for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_IMAGE} in the cell style.
   *
   * @param state {@link CellState} whose indicator image should be returned.
   */
  getIndicatorImageSrc() {
    return this.style.indicatorImage;
  }
}

export default CellState;
