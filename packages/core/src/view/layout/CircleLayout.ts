/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import GraphLayout from './GraphLayout';
import { Graph } from '../Graph';
import CellArray from '../cell/CellArray';
import Cell from '../cell/Cell';

/**
 * Extends <mxGraphLayout> to implement a circular layout for a given radius.
 * The vertices do not need to be connected for this layout to work and all
 * connections between vertices are not taken into account.
 *
 * Example:
 *
 * (code)
 * let layout = new mxCircleLayout(graph);
 * layout.execute(graph.getDefaultParent());
 * (end)
 *
 * Constructor: mxCircleLayout
 *
 * Constructs a new circular layout for the specified radius.
 *
 * Arguments:
 *
 * graph - <mxGraph> that contains the cells.
 * radius - Optional radius as an int. Default is 100.
 */
class CircleLayout extends GraphLayout {
  constructor(graph: Graph, radius: number = 100) {
    super(graph);
    // mxGraphLayout.call(this, graph);
    this.radius = radius;
  }

  /**
   * Integer specifying the size of the radius. Default is 100.
   */
  radius: number;

  /**
   * Boolean specifying if the circle should be moved to the top,
   * left corner specified by <x0> and <y0>. Default is false.
   */
  moveCircle: boolean = false;

  /**
   * Integer specifying the left coordinate of the circle.
   * Default is 0.
   */
  x0: number = 0;

  /**
   * Integer specifying the top coordinate of the circle.
   * Default is 0.
   */
  y0: number = 0;

  /**
   * Specifies if all edge points of traversed edges should be removed.
   * Default is true.
   */
  resetEdges: boolean = true;

  /**
   * Specifies if the STYLE_NOEDGESTYLE flag should be set on edges that are
   * modified by the result. Default is true.
   */
  disableEdgeStyle: boolean = true;

  /**
   * Implements <mxGraphLayout.execute>.
   */
  execute(parent: Cell) {
    const model = this.graph.getModel();

    // Moves the vertices to build a circle. Makes sure the
    // radius is large enough for the vertices to not
    // overlap
    model.beginUpdate();

    this.graph.batchUpdate(() => {
      // Gets all vertices inside the parent and finds
      // the maximum dimension of the largest vertex
      let max = 0;
      let top = null;
      let left = null;
      const vertices = [];
      const childCount = parent.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const cell = parent.getChildAt(i);

        if (!this.isVertexIgnored(cell)) {
          vertices.push(cell);
          const bounds = this.getVertexBounds(cell);

          if (top == null) {
            top = bounds.y;
          } else {
            top = Math.min(top, bounds.y);
          }

          if (left == null) {
            left = bounds.x;
          } else {
            left = Math.min(left, bounds.x);
          }

          max = Math.max(max, Math.max(bounds.width, bounds.height));
        } else if (!this.isEdgeIgnored(cell)) {
          // Resets the points on the traversed edge
          if (this.resetEdges) {
            this.graph.resetEdge(cell);
          }

          if (this.disableEdgeStyle) {
            this.setEdgeStyleEnabled(cell, false);
          }
        }
      }

      const r = this.getRadius(vertices.length, max);
      if (this.moveCircle) {
        // Moves the circle to the specified origin
        left = this.x0;
        top = this.y0;
      }
      this.circle(new CellArray(...vertices), r, <number>left, <number>top);
    });
  }

  /**
   * Returns the radius to be used for the given vertex count. Max is the maximum
   * width or height of all vertices in the layout.
   */
  getRadius(count: number, max: number) {
    return Math.max((count * max) / Math.PI, this.radius);
  }

  /**
   * Executes the circular layout for the specified array
   * of vertices and the given radius. This is called from
   * <execute>.
   */
  circle(vertices: CellArray, r: number, left: number, top: number) {
    const vertexCount = vertices.length;
    const phi = (2 * Math.PI) / vertexCount;

    vertices.forEach((vertex, i) => {
      if (this.isVertexMovable(vertex)) {
        this.setVertexLocation(
          vertex,
          Math.round(left + r + r * Math.sin(i * phi)),
          Math.round(top + r + r * Math.cos(i * phi))
        );
      }
    });
  }
}

export default CircleLayout;
