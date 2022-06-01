/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { getRotatedPoint, toRadians } from '../../util/MathUtils';
import Point from '../geometry/Point';
import ImageShape from '../geometry/node/ImageShape';
import Rectangle from '../geometry/Rectangle';
import RectangleShape from '../geometry/node/RectangleShape';
import {
  DIALECT,
  HANDLE_FILLCOLOR,
  HANDLE_SIZE,
  HANDLE_STROKECOLOR,
} from '../../util/Constants';
import InternalEvent from '../event/InternalEvent';
import Shape from '../geometry/Shape';
import InternalMouseEvent from '../event/InternalMouseEvent';
import ImageBox from '../image/ImageBox';
import CellState from './CellState';
import CellArray from './CellArray';

import type { Graph } from '../Graph';
import type { CellHandle, CellStateStyle } from '../../types';

/**
 * Implements a single custom handle for vertices.
 *
 * @class VertexHandle
 */
class VertexHandle implements CellHandle {
  dependencies = ['snap', 'cells'];

  graph: Graph;
  state: CellState;
  shape: Shape | ImageShape | null;

  /**
   * Specifies the cursor to be used for this handle. Default is 'default'.
   */
  cursor = 'default';

  /**
   * Specifies the {@link Image} to be used to render the handle. Default is null.
   */
  image: ImageBox | null = null;

  /**
   * Default is false.
   */
  ignoreGrid = false;

  active = true;

  constructor(
    state: CellState,
    cursor: string = 'default',
    image: ImageBox | null = null,
    shape: Shape | null = null
  ) {
    this.graph = <Graph>state.view.graph;
    this.state = state;
    this.cursor = cursor;
    this.image = image;
    this.shape = shape;
    this.init();
  }

  /**
   * Hook for subclassers to return the current position of the handle.
   */
  getPosition(bounds: Rectangle | null): Point {
    return new Point();
  }

  /**
   * Hooks for subclassers to update the style in the <state>.
   */
  setPosition(bounds: Rectangle | null, pt: Point, me: InternalMouseEvent) {}

  /**
   * Hook for subclassers to execute the handle.
   */
  execute(me: InternalMouseEvent): void {}

  /**
   * Sets the cell style with the given name to the corresponding value in <state>.
   */
  copyStyle(key: keyof CellStateStyle) {
    this.graph.setCellStyles(key, this.state.style[key], new CellArray(this.state.cell));
  }

  /**
   * Processes the given {@link MouseEvent} and invokes <setPosition>.
   */
  processEvent(me: InternalMouseEvent): void {
    const { scale } = this.graph.view;
    const tr = this.graph.view.translate;
    let pt = new Point(me.getGraphX() / scale - tr.x, me.getGraphY() / scale - tr.y);

    // Center shape on mouse cursor
    if (this.shape != null && this.shape.bounds != null) {
      pt.x -= this.shape.bounds.width / scale / 4;
      pt.y -= this.shape.bounds.height / scale / 4;
    }

    // Snaps to grid for the rotated position then applies the rotation for the direction after that
    const alpha1 = -toRadians(this.getRotation());
    const alpha2 = -toRadians(this.getTotalRotation()) - alpha1;
    pt = this.flipPoint(
      this.rotatePoint(
        this.snapPoint(
          this.rotatePoint(pt, alpha1),
          this.ignoreGrid || !this.graph.isGridEnabledEvent(me.getEvent())
        ),
        alpha2
      )
    );
    this.setPosition(this.state.getPaintBounds(), pt, me);
    this.redraw();
  }

  /**
   * Should be called after <setPosition> in <processEvent>.
   * This repaints the state using {@link CellRenderer}.
   */
  positionChanged(): void {
    if (this.state.text != null) {
      this.state.text.apply(this.state);
    }

    if (this.state.shape != null) {
      this.state.shape.apply(this.state);
    }

    this.graph.cellRenderer.redraw(this.state, true);
  }

  /**
   * Returns the rotation defined in the style of the cell.
   */
  getRotation(): number {
    if (this.state.shape != null) {
      return this.state.shape.getRotation();
    }
    return 0;
  }

  /**
   * Returns the rotation from the style and the rotation from the direction of
   * the cell.
   */
  getTotalRotation(): number {
    if (this.state.shape != null) {
      return this.state.shape.getShapeRotation();
    }
    return 0;
  }

  /**
   * Creates and initializes the shapes required for this handle.
   */
  init() {
    const html = this.isHtmlRequired();

    if (this.image) {
      this.shape = new ImageShape(
        new Rectangle(0, 0, this.image.width, this.image.height),
        this.image.src
      );
      this.shape.preserveImageAspect = false;
    } else if (!this.shape) {
      this.shape = this.createShape(html);
    }

    this.initShape(html);
  }

  /**
   * Creates and returns the shape for this handle.
   */
  createShape(html: boolean): Shape {
    const bounds = new Rectangle(0, 0, HANDLE_SIZE, HANDLE_SIZE);
    return new RectangleShape(bounds, HANDLE_FILLCOLOR, HANDLE_STROKECOLOR);
  }

  /**
   * Initializes <shape> and sets its cursor.
   */
  initShape(html: boolean) {
    const shape = this.shape as Shape; // `this.shape` cannot be null.

    if (html && shape.isHtmlAllowed()) {
      shape.dialect = DIALECT.STRICTHTML;
      shape.init(this.graph.container);
    } else {
      shape.dialect =
        this.graph.dialect !== DIALECT.SVG ? DIALECT.MIXEDHTML : DIALECT.SVG;

      if (this.cursor) {
        shape.init(this.graph.getView().getOverlayPane());
      }
    }

    InternalEvent.redirectMouseEvents(shape.node, this.graph, this.state);
    shape.node.style.cursor = this.cursor;
  }

  /**
   * Renders the shape for this handle.
   */
  redraw() {
    if (this.shape && this.state.shape) {
      let pt = this.getPosition(this.state.getPaintBounds());

      if (pt) {
        const alpha = toRadians(this.getTotalRotation());
        pt = this.rotatePoint(this.flipPoint(pt), alpha);

        const { scale } = this.graph.view;
        const tr = this.graph.view.translate;
        const shapeBounds = <Rectangle>this.shape.bounds;

        shapeBounds.x = Math.floor((pt.x + tr.x) * scale - shapeBounds.width / 2);
        shapeBounds.y = Math.floor((pt.y + tr.y) * scale - shapeBounds.height / 2);

        // Needed to force update of text bounds
        this.shape.redraw();
      }
    }
  }

  /**
   * Returns true if this handle should be rendered in HTML. This returns true if
   * the text node is in the graph container.
   */
  isHtmlRequired() {
    return !!this.state.text && this.state.text.node.parentNode === this.graph.container;
  }

  /**
   * Rotates the point by the given angle.
   */
  rotatePoint(pt: Point, alpha: number) {
    const bounds = <Rectangle>this.state.getCellBounds();
    const cx = new Point(bounds.getCenterX(), bounds.getCenterY());
    const cos = Math.cos(alpha);
    const sin = Math.sin(alpha);

    return getRotatedPoint(pt, cos, sin, cx);
  }

  /**
   * Flips the given point vertically and/or horizontally.
   */
  flipPoint(pt: Point) {
    if (this.state.shape) {
      const bounds = <Rectangle>this.state.getCellBounds();

      if (this.state.shape.flipH) {
        pt.x = 2 * bounds.x + bounds.width - pt.x;
      }

      if (this.state.shape.flipV) {
        pt.y = 2 * bounds.y + bounds.height - pt.y;
      }
    }
    return pt;
  }

  /**
   * Snaps the given point to the grid if ignore is false. This modifies
   * the given point in-place and also returns it.
   */
  snapPoint(pt: Point, ignore: boolean) {
    if (!ignore) {
      pt.x = this.graph.snap(pt.x);
      pt.y = this.graph.snap(pt.y);
    }
    return pt;
  }

  /**
   * Shows or hides this handle.
   */
  setVisible(visible: boolean) {
    if (this.shape && this.shape.node) {
      this.shape.node.style.display = visible ? '' : 'none';
    }
  }

  /**
   * Resets the state of this handle by setting its visibility to true.
   */
  reset() {
    this.setVisible(true);
    this.state.style = this.graph.getCellStyle(this.state.cell);
    this.positionChanged();
  }

  /**
   * Destroys this handle.
   */
  destroy() {
    if (this.shape) {
      this.shape.destroy();
      this.shape = null;
    }
  }
}

export default VertexHandle;
