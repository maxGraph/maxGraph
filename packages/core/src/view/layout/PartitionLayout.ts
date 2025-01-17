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

import Rectangle from '../geometry/Rectangle';
import GraphLayout from './GraphLayout';
import { Graph } from '../Graph';
import Cell from '../cell/Cell';

/**
 * Extends {@link GraphLayout} for partitioning the parent cell vertically or
 * horizontally by filling the complete area with the child cells. A horizontal
 * layout partitions the height of the given parent whereas a non-horizontal
 * layout partitions the width. If the parent is a layer (that is, a child of
 * the root node), then the current graph size is partitioned. The children do
 * not need to be connected for this layout to work.
 *
 * Example:
 *
 * ```javascript
 * const layout = new PartitionLayout(graph, true, 10, 20);
 * layout.execute(graph.getDefaultParent());
 * ```
 *
 * @category Layout
 */
class PartitionLayout extends GraphLayout {
  constructor(graph: Graph, horizontal = true, spacing = 0, border = 0) {
    super(graph);
    this.horizontal = horizontal != null ? horizontal : true;
    this.spacing = spacing || 0;
    this.border = border || 0;
  }

  /**
   * Boolean indicating the direction in which the space is partitioned.
   * Default is true.
   */
  horizontal: boolean;

  /**
   * Integer that specifies the absolute spacing in pixels between the
   * children. Default is 0.
   */
  spacing: number;

  /**
   * Integer that specifies the absolute inset in pixels for the parent that
   * contains the children. Default is 0.
   */
  border: number;

  /**
   * Boolean that specifies if vertices should be resized. Default is true.
   */
  resizeVertices = true;

  /**
   * Returns <horizontal>.
   */
  isHorizontal(): boolean {
    return this.horizontal;
  }

  /**
   * Implements {@link GraphLayout.moveCell}.
   *
   * @param {mxCell} cell
   * @param {number} x
   * @param {number} y
   * @memberof mxPartitionLayout
   */
  moveCell(cell: Cell, x: number, y: number): void {
    const model = this.graph.getDataModel();
    const parent = cell.getParent();

    if (cell != null && parent != null) {
      let i = 0;
      let last = 0;
      const childCount = parent.getChildCount();

      // Finds index of the closest swimlane
      // TODO: Take into account the orientation
      for (i = 0; i < childCount; i += 1) {
        const child = parent.getChildAt(i);
        const bounds = this.getVertexBounds(child);

        if (bounds != null) {
          const tmp = bounds.x + bounds.width / 2;

          if (last < x && tmp > x) {
            break;
          }

          last = tmp;
        }
      }

      // Changes child order in parent
      let idx = parent.getIndex(cell);
      idx = Math.max(0, i - (i > idx ? 1 : 0));

      model.add(parent, cell, idx);
    }
  }

  /**
   * Implements {@link GraphLayout#execute}. All children where <isVertexIgnored>
   * returns false and <isVertexMovable> returns true are modified.
   */
  execute(parent: Cell): void {
    const horizontal = this.isHorizontal();
    const model = this.graph.getDataModel();
    let pgeo = <Rectangle>parent.getGeometry();

    // Handles special case where the parent is either a layer with no
    // geometry or the current root of the view in which case the size
    // of the graph's container will be used.
    if (
      this.graph.container != null &&
      ((pgeo == null && model.isLayer(parent)) ||
        parent === this.graph.getView().currentRoot)
    ) {
      const width = this.graph.container.offsetWidth - 1;
      const height = this.graph.container.offsetHeight - 1;
      pgeo = new Rectangle(0, 0, width, height);
    }

    if (pgeo != null) {
      const children = [];
      const childCount = parent.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const child = parent.getChildAt(i);

        if (!this.isVertexIgnored(child) && this.isVertexMovable(child)) {
          children.push(child);
        }
      }

      const n = children.length;

      if (n > 0) {
        let x0 = this.border;
        let y0 = this.border;
        let other = horizontal ? pgeo.height : pgeo.width;
        other -= 2 * this.border;

        const size = this.graph.isSwimlane(parent)
          ? this.graph.getStartSize(parent)
          : new Rectangle();

        other -= horizontal ? size.height : size.width;
        x0 += size.width;
        y0 += size.height;

        const tmp = this.border + (n - 1) * this.spacing;
        const value = horizontal
          ? (pgeo.width - x0 - tmp) / n
          : (pgeo.height - y0 - tmp) / n;

        // Avoids negative values, that is values where the sum of the
        // spacing plus the border is larger then the available space
        if (value > 0) {
          model.beginUpdate();
          try {
            for (let i = 0; i < n; i += 1) {
              const child = children[i];
              let geo = child.getGeometry();

              if (geo != null) {
                geo = geo.clone();
                geo.x = x0;
                geo.y = y0;

                if (horizontal) {
                  if (this.resizeVertices) {
                    geo.width = value;
                    geo.height = other;
                  }

                  x0 += value + this.spacing;
                } else {
                  if (this.resizeVertices) {
                    geo.height = value;
                    geo.width = other;
                  }

                  y0 += value + this.spacing;
                }

                model.setGeometry(child, geo);
              }
            }
          } finally {
            model.endUpdate();
          }
        }
      }
    }
  }
}

export default PartitionLayout;
