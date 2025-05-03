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

import {
  DEFAULT_VALID_COLOR,
  HIGHLIGHT_OPACITY,
  HIGHLIGHT_STROKEWIDTH,
} from '../../util/Constants';
import InternalEvent from '../event/InternalEvent';
import Rectangle from '../geometry/Rectangle';
import type CellState from './CellState';
import type { AbstractGraph } from '../AbstractGraph';
import Shape from '../geometry/Shape';

import type { ColorValue } from '../../types';

/**
 * A helper class to highlight cells. Here is an example for a given cell.
 *
 * ```javascript
 * var highlight = new mxCellHighlight(graph, '#ff0000', 2);
 * highlight.highlight(graph.view.getState(cell)));
 * ```
 */
class CellHighlight {
  // TODO: Document me!!
  highlightColor: ColorValue;

  strokeWidth = 0;

  dashed = false;

  opacity = 100;

  repaintHandler: Function;

  shape: Shape | null = null;

  /**
   * Specifies if the highlights should appear on top of everything else in the overlay pane.
   * @default false
   */
  keepOnTop = false;

  /**
   * Reference to the enclosing {@link AbstractGraph}.
   */
  graph: AbstractGraph;

  /**
   * Reference to the {@link CellState}.
   * @default null
   */
  state: CellState | null = null;

  /**
   * Specifies the spacing between the highlight for vertices and the vertex.
   * @default 2
   */
  spacing = 2;

  /**
   * Holds the handler that automatically invokes reset if the highlight should be hidden.
   * @default null
   */
  resetHandler: Function;

  constructor(
    graph: AbstractGraph,
    highlightColor?: ColorValue,
    strokeWidth?: number,
    dashed?: boolean
  ) {
    this.graph = graph;
    this.highlightColor = highlightColor ?? DEFAULT_VALID_COLOR;
    this.strokeWidth = strokeWidth ?? HIGHLIGHT_STROKEWIDTH;
    this.dashed = dashed ?? false;
    this.opacity = HIGHLIGHT_OPACITY;

    // Updates the marker if the graph changes
    this.repaintHandler = () => {
      // Updates reference to state
      if (this.state) {
        const tmp = this.graph.view.getState(this.state.cell);

        if (!tmp) {
          this.hide();
        } else {
          this.state = tmp;
          this.repaint();
        }
      }
    };

    this.graph.getView().addListener(InternalEvent.SCALE, this.repaintHandler);
    this.graph.getView().addListener(InternalEvent.TRANSLATE, this.repaintHandler);
    this.graph
      .getView()
      .addListener(InternalEvent.SCALE_AND_TRANSLATE, this.repaintHandler);
    this.graph.getDataModel().addListener(InternalEvent.CHANGE, this.repaintHandler);

    // Hides the marker if the current root changes
    this.resetHandler = () => {
      this.hide();
    };

    this.graph.getView().addListener(InternalEvent.DOWN, this.resetHandler);
    this.graph.getView().addListener(InternalEvent.UP, this.resetHandler);
  }

  /**
   * Sets the color of the rectangle used to highlight drop targets.
   *
   * @param {string} color - String that represents the new highlight color.
   */
  setHighlightColor(color: ColorValue) {
    this.highlightColor = color;

    if (this.shape) {
      this.shape.stroke = color;
    }
  }

  /**
   * Creates and returns the highlight shape for the given state.
   */
  drawHighlight() {
    this.shape = this.createShape();
    this.repaint();

    if (this.shape) {
      const node = this.shape.node;

      if (!this.keepOnTop && node?.parentNode?.firstChild !== node && node.parentNode) {
        node.parentNode.insertBefore(node, node.parentNode.firstChild);
      }
    }
  }

  /**
   * Creates and returns the highlight shape for the given state.
   */
  createShape() {
    if (!this.state) return null;

    const shape = this.graph.cellRenderer.createShape(this.state);

    shape.svgStrokeTolerance = this.graph.getEventTolerance();
    shape.points = this.state.absolutePoints;
    shape.apply(this.state);
    shape.stroke = this.highlightColor;
    shape.opacity = this.opacity;
    shape.isDashed = this.dashed;
    shape.isShadow = false;

    shape.dialect = 'svg';
    shape.init(this.graph.getView().getOverlayPane());
    InternalEvent.redirectMouseEvents(shape.node, this.graph, this.state);

    if (this.graph.dialect !== 'svg') {
      shape.pointerEvents = false;
    } else {
      shape.svgPointerEvents = 'stroke';
    }

    return shape;
  }

  /**
   * Updates the highlight after a change of the model or view.
   */
  getStrokeWidth(state: CellState | null = null) {
    return this.strokeWidth;
  }

  /**
   * Updates the highlight after a change of the model or view.
   */
  repaint(): void {
    if (this.state && this.shape) {
      this.shape.scale = this.state.view.scale;

      if (this.state.cell.isEdge()) {
        this.shape.strokeWidth = this.getStrokeWidth();
        this.shape.points = this.state.absolutePoints;
        this.shape.outline = false;
      } else {
        this.shape.bounds = new Rectangle(
          this.state.x - this.spacing,
          this.state.y - this.spacing,
          this.state.width + 2 * this.spacing,
          this.state.height + 2 * this.spacing
        );
        this.shape.rotation = this.state.style.rotation ?? 0;
        this.shape.strokeWidth = this.getStrokeWidth() / this.state.view.scale;
        this.shape.outline = true;
      }

      // Uses cursor from shape in highlight
      if (this.state.shape) {
        this.shape.setCursor(this.state.shape.getCursor());
      }

      this.shape.redraw();
    }
  }

  /**
   * Resets the state of the cell marker.
   */
  hide(): void {
    this.highlight(null);
  }

  /**
   * Marks the {@link arkedState} and fires a {@link ark} event.
   */
  highlight(state: CellState | null = null): void {
    if (this.state !== state) {
      if (this.shape) {
        this.shape.destroy();
        this.shape = null;
      }

      this.state = state;
      if (this.state) {
        this.drawHighlight();
      }
    }
  }

  /**
   * Returns true if this highlight is at the given position.
   */
  isHighlightAt(x: number, y: number): boolean {
    let hit = false;
    if (this.shape && document.elementFromPoint) {
      let elt: (Node & ParentNode) | null = document.elementFromPoint(x, y);

      while (elt) {
        if (elt === this.shape.node) {
          hit = true;
          break;
        }
        elt = elt.parentNode;
      }
    }
    return hit;
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   */
  destroy() {
    const graph = this.graph;
    graph.getView().removeListener(this.resetHandler);
    graph.getView().removeListener(this.repaintHandler);
    graph.getDataModel().removeListener(this.repaintHandler);

    if (this.shape) {
      this.shape.destroy();
      this.shape = null;
    }
  }
}

export default CellHighlight;
