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
import GraphLayout from './GraphLayout';
import { intersects } from '../../util/mathUtils';
import Cell from '../cell/Cell';
import { Graph } from '../Graph';
import CellState from '../cell/CellState';
import TextShape from '../geometry/node/TextShape';
import Rectangle from '../geometry/Rectangle';

/**
 * Extends {@link GraphLayout} to implement an edge label layout. This layout
 * makes use of cell states, which means the graph must be validated in
 * a graph view (so that the label bounds are available) before this layout
 * can be executed.
 *
 * ```javascript
 * const layout = new EdgeLabelLayout(graph);
 * layout.execute(graph.getDefaultParent());
 * ```
 *
 * @category Layout
 */
class EdgeLabelLayout extends GraphLayout {
  constructor(graph: Graph, radius: number) {
    super(graph);
  }

  /**
   * Implements {@link GraphLayout.execute}
   */
  execute(parent: Cell): void {
    const { view } = this.graph;
    const model = this.graph.getDataModel();

    // Gets all vertices and edges inside the parent
    const edges = [];
    const vertices = [];
    const childCount = parent.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const cell = parent.getChildAt(i);
      const state = view.getState(cell);

      if (state != null) {
        if (!this.isVertexIgnored(cell)) {
          vertices.push(state);
        } else if (!this.isEdgeIgnored(cell)) {
          edges.push(state);
        }
      }
    }
    this.placeLabels(vertices, edges);
  }

  /**
   * Places the labels of the given edges.
   *
   * @param v   vertexes
   * @param e   edges
   */
  placeLabels(v: CellState[], e: CellState[]): void {
    // Moves the vertices to build a circle. Makes sure the
    // radius is large enough for the vertices to not
    // overlap
    this.graph.batchUpdate(() => {
      for (let i = 0; i < e.length; i += 1) {
        const edge = e[i];

        if (edge != null && edge.text != null && edge.text.boundingBox != null) {
          for (let j = 0; j < v.length; j += 1) {
            const vertex = v[j];

            if (vertex != null) {
              this.avoid(edge, vertex);
            }
          }
        }
      }
    });
  }

  /**
   * Places the labels of the given edges.
   */
  avoid(edge: CellState, vertex: CellState): void {
    const model = this.graph.getDataModel();
    const labRect = <Rectangle>(<TextShape>edge.text).boundingBox;

    if (intersects(labRect, vertex)) {
      const dy1 = -labRect.y - labRect.height + vertex.y;
      const dy2 = -labRect.y + vertex.y + vertex.height;

      let dy = Math.abs(dy1) < Math.abs(dy2) ? dy1 : dy2;

      const dx1 = -labRect.x - labRect.width + vertex.x;
      const dx2 = -labRect.x + vertex.x + vertex.width;

      let dx = Math.abs(dx1) < Math.abs(dx2) ? dx1 : dx2;

      if (Math.abs(dx) < Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }

      let g = edge.cell.getGeometry();

      if (g != null) {
        g = g.clone();

        if (g.offset != null) {
          g.offset.x += dx;
          g.offset.y += dy;
        } else {
          g.offset = new Point(dx, dy);
        }

        model.setGeometry(edge.cell, g);
      }
    }
  }
}

export default EdgeLabelLayout;
