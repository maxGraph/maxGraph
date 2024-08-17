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
import GraphLayout from './GraphLayout';
import { Graph } from '../Graph';
import Cell from '../cell/Cell';

/**
 * Extends {@link GraphLayout} to implement a circular layout for a given radius.
 * The vertices do not need to be connected for this layout to work and all
 * connections between vertices are not taken into account.
 *
 * Example:
 *
 * ```javascript
 * const layout = new CircleLayout(graph);
 * layout.execute(graph.getDefaultParent());
 * ```
 *
 * @category Layout
 */
class CircleLayout extends GraphLayout {
  /**
   * Constructs a new circular layout for the specified radius.
   *
   * @param graph {@link Graph} that contains the cells.
   * @param radius Optional radius as an int. Default is 100.
   */
  constructor(graph: Graph, radius = 100) {
    super(graph);
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
  moveCircle = false;

  /**
   * Integer specifying the left coordinate of the circle.
   * Default is 0.
   */
  x0 = 0;

  /**
   * Integer specifying the top coordinate of the circle.
   * Default is 0.
   */
  y0 = 0;

  /**
   * Specifies if all edge points of traversed edges should be removed.
   * Default is true.
   */
  resetEdges = true;

  /**
   * Specifies if the STYLE_NOEDGESTYLE flag should be set on edges that are
   * modified by the result. Default is true.
   */
  disableEdgeStyle = true;

  /**
   * Implements {@link GraphLayout#execute}.
   */
  execute(parent: Cell) {
    // Moves the vertices to build a circle. Makes sure the
    // radius is large enough for the vertices to not
    // overlap
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
      this.circle(vertices, r, <number>left, <number>top);
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
  circle(vertices: Cell[], r: number, left: number, top: number) {
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
