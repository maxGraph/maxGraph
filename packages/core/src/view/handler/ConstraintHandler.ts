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

import Image from '../image/ImageBox.js';
import Client from '../../Client.js';
import {
  DEFAULT_VALID_COLOR,
  HIGHLIGHT_OPACITY,
  HIGHLIGHT_SIZE,
  HIGHLIGHT_STROKEWIDTH,
} from '../../util/Constants.js';
import InternalEvent from '../event/InternalEvent.js';
import { intersects } from '../../util/mathUtils.js';
import Rectangle from '../geometry/Rectangle.js';
import ImageShape from '../shape/node/ImageShape.js';
import RectangleShape from '../shape/node/RectangleShape.js';
import { isShiftDown } from '../../util/EventUtils.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import CellState from '../cell/CellState.js';
import InternalMouseEvent from '../event/InternalMouseEvent.js';
import ConnectionConstraint from '../other/ConnectionConstraint.js';
import Point from '../geometry/Point.js';
import type Cell from '../cell/Cell.js';

/**
 * Handles constraints on connection targets. This class is in charge of
 * showing fixed points when the mouse is over a vertex and handles constraints
 * to establish new connections.
 *
 */
class ConstraintHandler {
  /**
   * {@link Image} to be used as the image for fixed connection points.
   */
  pointImage = new Image(`${Client.imageBasePath}/point.gif`, 5, 5);

  /**
   * Reference to the enclosing {@link AbstractGraph}.
   */
  graph: AbstractGraph;

  resetHandler: () => void;

  currentFocus: CellState | null = null;

  currentFocusArea: Rectangle | null = null;

  focusIcons: ImageShape[] = [];

  constraints: ConnectionConstraint[] | null = null;

  currentConstraint: ConnectionConstraint | null = null;

  focusHighlight: RectangleShape | null = null;

  focusPoints: Point[] = [];

  currentPoint: Point | null = null;

  /**
   * Specifies if events are handled. Default is true.
   */
  enabled = true;

  /**
   * Specifies the color for the highlight. Default is {@link DEFAULT_VALID_COLOR}.
   */
  highlightColor = DEFAULT_VALID_COLOR;

  mouseleaveHandler: (() => void) | null = null;

  constructor(graph: AbstractGraph) {
    this.graph = graph;

    // Adds a graph model listener to update the current focus on changes
    this.resetHandler = () => {
      if (this.currentFocus && !this.graph.view.getState(this.currentFocus.cell)) {
        this.reset();
      } else {
        this.redraw();
      }
    };

    this.graph.model.addListener(InternalEvent.CHANGE, this.resetHandler);
    this.graph.view.addListener(InternalEvent.SCALE_AND_TRANSLATE, this.resetHandler);
    this.graph.view.addListener(InternalEvent.TRANSLATE, this.resetHandler);
    this.graph.view.addListener(InternalEvent.SCALE, this.resetHandler);
    this.graph.addListener(InternalEvent.ROOT, this.resetHandler);
  }

  /**
   * Returns true if events are handled. This implementation
   * returns {@link enabled}.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Enables or disables event handling. This implementation
   * updates {@link enabled}.
   *
   * @param {boolean} enabled - Boolean that specifies the new enabled state.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Resets the state of this handler.
   */
  reset() {
    for (let i = 0; i < this.focusIcons.length; i += 1) {
      this.focusIcons[i].destroy();
    }

    this.focusIcons = [];

    if (this.focusHighlight) {
      this.focusHighlight.destroy();
      this.focusHighlight = null;
    }

    this.currentConstraint = null;
    this.currentFocusArea = null;
    this.currentPoint = null;
    this.currentFocus = null;
    this.focusPoints = [];
  }

  /**
   * Returns the tolerance to be used for intersecting connection points. This
   * implementation returns {@link mxGraph.tolerance}.
   *
   * @param me {@link mxMouseEvent} whose tolerance should be returned.
   */
  getTolerance(me: InternalMouseEvent) {
    return this.graph.getEventTolerance();
  }

  /**
   * Returns the tolerance to be used for intersecting connection points.
   */
  getImageForConstraint(
    state: CellState,
    constraint: ConnectionConstraint,
    point: Point
  ) {
    return this.pointImage;
  }

  /**
   * Returns true if the given {@link mxMouseEvent} should be ignored in {@link update}. This
   * implementation always returns false.
   */
  isEventIgnored(me: InternalMouseEvent, source = false) {
    return false;
  }

  /**
   * Returns true if the given state should be ignored. This always returns false.
   */
  isStateIgnored(state: CellState, source = false) {
    return false;
  }

  /**
   * Destroys the {@link focusIcons} if they exist.
   */
  destroyIcons() {
    for (let i = 0; i < this.focusIcons.length; i += 1) {
      this.focusIcons[i].destroy();
    }

    this.focusIcons = [];
    this.focusPoints = [];
  }

  /**
   * Destroys the {@link focusHighlight} if one exists.
   */
  destroyFocusHighlight() {
    if (this.focusHighlight) {
      this.focusHighlight.destroy();
      this.focusHighlight = null;
    }
  }

  /**
   * Returns true if the current focused state should not be changed for the given event.
   * This returns true if shift and alt are pressed.
   */
  isKeepFocusEvent(me: InternalMouseEvent) {
    return isShiftDown(me.getEvent());
  }

  /**
   * Returns the cell for the given event.
   */
  getCellForEvent(me: InternalMouseEvent, point: Point | null) {
    let cell = me.getCell();

    // Gets cell under actual point if different from event location
    if (!cell && point && (me.getGraphX() !== point.x || me.getGraphY() !== point.y)) {
      cell = this.graph.getCellAt(point.x, point.y);
    }

    // Uses connectable parent vertex if one exists
    if (cell && !cell.isConnectable()) {
      const parent = cell.getParent();

      if (parent && parent.isVertex() && parent.isConnectable()) {
        cell = parent;
      }
    }

    if (cell) {
      return this.graph.isCellLocked(cell) ? null : cell;
    } else {
      return null;
    }
  }

  /**
   * Updates the state of this handler based on the given {@link mxMouseEvent}.
   * Source is a boolean indicating if the cell is a source or target.
   */
  update(
    me: InternalMouseEvent,
    source: boolean,
    existingEdge: boolean,
    point: Point | null
  ) {
    if (this.isEnabled() && !this.isEventIgnored(me)) {
      // Lazy installation of mouseleave handler
      if (!this.mouseleaveHandler && this.graph.container) {
        this.mouseleaveHandler = () => {
          this.reset();
        };

        InternalEvent.addListener(this.graph.container, 'mouseleave', this.resetHandler);
      }

      const tol = this.getTolerance(me);
      const x = point ? point.x : me.getGraphX();
      const y = point ? point.y : me.getGraphY();
      const grid = new Rectangle(x - tol, y - tol, 2 * tol, 2 * tol);
      const mouse = new Rectangle(
        me.getGraphX() - tol,
        me.getGraphY() - tol,
        2 * tol,
        2 * tol
      );

      const state = this.graph.view.getState(this.getCellForEvent(me, point) as Cell);

      // Keeps focus icons visible while over vertex bounds and no other cell under mouse or shift is pressed
      if (
        !this.isKeepFocusEvent(me) &&
        (!this.currentFocusArea ||
          !this.currentFocus ||
          state ||
          !this.currentFocus.cell.isVertex() ||
          !intersects(this.currentFocusArea, mouse)) &&
        state !== this.currentFocus
      ) {
        this.currentFocusArea = null;
        this.currentFocus = null;
        this.setFocus(me, state!, source);
      }

      this.currentConstraint = null;
      this.currentPoint = null;
      let minDistSq = null;

      let tmp;

      if (
        this.focusIcons.length > 0 &&
        this.constraints &&
        (!state || this.currentFocus === state)
      ) {
        const cx = mouse.getCenterX();
        const cy = mouse.getCenterY();

        for (let i = 0; i < this.focusIcons.length; i += 1) {
          const dx = cx - this.focusIcons[i].bounds!.getCenterX();
          const dy = cy - this.focusIcons[i].bounds!.getCenterY();
          tmp = dx * dx + dy * dy;

          if (
            (this.intersects(this.focusIcons[i], mouse, source, existingEdge) ||
              (point &&
                this.intersects(this.focusIcons[i], grid, source, existingEdge))) &&
            (minDistSq === null || tmp < minDistSq)
          ) {
            this.currentConstraint = this.constraints[i];
            this.currentPoint = this.focusPoints[i];
            minDistSq = tmp;

            tmp = this.focusIcons[i].bounds!.clone();
            tmp.grow(HIGHLIGHT_SIZE + 1);
            tmp.width -= 1;
            tmp.height -= 1;

            if (!this.focusHighlight) {
              const hl = this.createHighlightShape();
              hl.dialect = 'svg';
              hl.pointerEvents = false;

              hl.init(this.graph.getView().getOverlayPane());
              this.focusHighlight = hl;

              const getState = () => {
                return this.currentFocus ? this.currentFocus : state;
              };

              InternalEvent.redirectMouseEvents(hl.node, this.graph, getState);
            }

            this.focusHighlight.bounds = tmp;
            this.focusHighlight.redraw();
          }
        }
      }

      if (!this.currentConstraint) {
        this.destroyFocusHighlight();
      }
    } else {
      this.currentConstraint = null;
      this.currentFocus = null;
      this.currentPoint = null;
    }
  }

  /**
   * Transfers the focus to the given state as a source or target terminal. If
   * the handler is not enabled then the outline is painted, but the constraints
   * are ignored.
   */
  redraw() {
    if (this.currentFocus && this.constraints && this.focusIcons.length > 0) {
      const state = this.graph.view.getState(this.currentFocus.cell) as CellState;
      this.currentFocus = state;
      this.currentFocusArea = new Rectangle(state.x, state.y, state.width, state.height);

      for (let i = 0; i < this.constraints.length; i += 1) {
        const cp = this.graph.getConnectionPoint(state, this.constraints[i]) as Point;
        const img = this.getImageForConstraint(state, this.constraints[i], cp);

        const bounds = new Rectangle(
          Math.round(cp.x - img.width / 2),
          Math.round(cp.y - img.height / 2),
          img.width,
          img.height
        );
        this.focusIcons[i].bounds = bounds;
        this.focusIcons[i].redraw();
        this.currentFocusArea.add(this.focusIcons[i].bounds as Rectangle);
        this.focusPoints[i] = cp;
      }
    }
  }

  /**
   * Transfers the focus to the given state as a source or target terminal. If
   * the handler is not enabled then the outline is painted, but the constraints
   * are ignored.
   */
  setFocus(me: InternalMouseEvent, state: CellState | null, source: boolean) {
    this.constraints =
      state && !this.isStateIgnored(state, source) && state.cell.isConnectable()
        ? this.isEnabled()
          ? (this.graph.getAllConnectionConstraints(state, source) ?? [])
          : []
        : null;

    // Only uses cells which have constraints
    if (this.constraints && state) {
      this.currentFocus = state;
      this.currentFocusArea = new Rectangle(state.x, state.y, state.width, state.height);

      for (let i = 0; i < this.focusIcons.length; i += 1) {
        this.focusIcons[i].destroy();
      }

      this.focusIcons = [];
      this.focusPoints = [];

      for (let i = 0; i < this.constraints.length; i += 1) {
        const cp = this.graph.getConnectionPoint(state, this.constraints[i]) as Point;
        const img = this.getImageForConstraint(state, this.constraints[i], cp);

        const { src } = img;
        const bounds = new Rectangle(
          Math.round(cp.x - img.width / 2),
          Math.round(cp.y - img.height / 2),
          img.width,
          img.height
        );
        const icon = new ImageShape(bounds, src);
        icon.dialect = this.graph.dialect !== 'svg' ? 'mixedHtml' : 'svg';
        icon.preserveImageAspect = false;
        icon.init(this.graph.getView().getDecoratorPane());

        // Move the icon behind all other overlays
        if (icon.node.previousSibling) {
          icon.node.parentNode?.insertBefore(icon.node, icon.node.parentNode.firstChild);
        }

        const getState = () => {
          return this.currentFocus ? this.currentFocus : state;
        };

        icon.redraw();

        InternalEvent.redirectMouseEvents(icon.node, this.graph, getState);
        this.currentFocusArea.add(icon.bounds as Rectangle);
        this.focusIcons.push(icon);
        this.focusPoints.push(cp);
      }

      this.currentFocusArea.grow(this.getTolerance(me));
    } else {
      this.destroyIcons();
      this.destroyFocusHighlight();
    }
  }

  /**
   * Create the shape used to paint the highlight.
   *
   * Returns true if the given icon intersects the given point.
   */
  createHighlightShape() {
    const hl = new RectangleShape(
      new Rectangle(),
      this.highlightColor,
      this.highlightColor,
      HIGHLIGHT_STROKEWIDTH
    );
    hl.opacity = HIGHLIGHT_OPACITY;

    return hl;
  }

  /**
   * Returns `true` if the given icon intersects the given rectangle.
   */
  intersects(
    icon: ImageShape,
    rectangle: Rectangle,
    source: boolean,
    existingEdge: boolean
  ) {
    return intersects(icon.bounds!, rectangle);
  }

  /**
   * Destroy this handler.
   */
  onDestroy() {
    this.reset();

    this.graph.model.removeListener(this.resetHandler);
    this.graph.view.removeListener(this.resetHandler);
    this.graph.removeListener(this.resetHandler);

    if (this.mouseleaveHandler && this.graph.container) {
      InternalEvent.removeListener(
        this.graph.container,
        'mouseleave',
        this.mouseleaveHandler
      );
      this.mouseleaveHandler = null;
    }
  }
}

export default ConstraintHandler;
