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
  CompactTreeLayout,
  _mxCompactTreeLayoutLine,
  _mxCompactTreeLayoutNode,
} from './CompactTreeLayout';
import Cell from '../cell/Cell';
import { Graph } from '../Graph';

/**
 * Extends {@link CompactTreeLayout} to implement a radial tree algorithm. This
 * layout is suitable for graphs that have no cycles (trees). Vertices that are
 * not connected to the tree will be ignored by this layout.
 *
 * ```javascript
 * const layout = new RadialTreeLayout(graph);
 * layout.execute(graph.getDefaultParent());
 * ```
 *
 * @category Layout
 */
class RadialTreeLayout extends CompactTreeLayout {
  constructor(graph: Graph) {
    super(graph, false);
  }

  centerX: number | null = null;
  centerY: number | null = null;

  /**
   * The initial offset to compute the angle position.
   * @default 0.5
   */
  angleOffset = 0.5;

  /**
   * The X co-ordinate of the root cell
   * @default 0
   */
  rootx = 0;

  /**
   * The Y co-ordinate of the root cell
   * @default 0
   */
  rooty = 0;

  /**
   * Holds the levelDistance.
   * @default 120
   */
  levelDistance = 120;

  /**
   * Holds the nodeDistance.
   * @default 10
   */
  nodeDistance = 10;

  /**
   * Specifies if the radios should be computed automatically
   * @default false
   */
  autoRadius = false;

  /**
   * Specifies if edges should be sorted according to the order of their
   * opposite terminal cell in the model.
   * @default false
   */
  sortEdges = false;

  /**
   * Array of leftmost x coordinate of each row
   */
  rowMinX: { [key: number]: number } = {};

  /**
   * Array of rightmost x coordinate of each row
   */
  rowMaxX: { [key: number]: number } = {};

  /**
   * Array of x coordinate of leftmost vertex of each row
   */
  rowMinCenX: { [key: number]: number } = {};

  /**
   * Array of x coordinate of rightmost vertex of each row
   */
  rowMaxCenX: { [key: number]: number } = {};

  /**
   * Array of y deltas of each row behind root vertex, also the radius in the tree
   */
  rowRadi: { [key: number]: number } = {};

  /**
   * Array of vertices on each row
   */
  row: _mxCompactTreeLayoutNode[][] = [];

  /**
   * Returns a boolean indicating if the given {@link mxCell} should be ignored as a vertex.
   *
   * @param vertex {@link mxCell} whose ignored state should be returned.
   * @return true if the cell has no connections.
   */
  isVertexIgnored(vertex: Cell): boolean {
    return (
      super.isVertexIgnored(vertex) || this.graph.getConnections(vertex).length === 0
    );
  }

  /**
   * Implements {@link GraphLayout#execute}.
   *
   * If the parent has any connected edges, then it is used as the root of
   * the tree. Else, {@link Graph#findTreeRoots} will be used to find a suitable
   * root node within the set of children of the given parent.
   *
   * @param parent    {@link mxCell} whose children should be laid out.
   * @param root      Optional {@link mxCell} that will be used as the root of the tree.
   */
  execute(parent: Cell, root: Cell | null = null): void {
    this.parent = parent;

    this.useBoundingBox = false;
    this.edgeRouting = false;
    // this.horizontal = false;

    super.execute(parent, root || undefined);

    let bounds = null;
    const rootBounds = this.getVertexBounds(<Cell>this.root);
    this.centerX = rootBounds.x + rootBounds.width / 2;
    this.centerY = rootBounds.y + rootBounds.height / 2;

    // Calculate the bounds of the involved vertices directly from the values set in the compact tree
    for (const vertex in this.visited) {
      const vertexBounds = this.getVertexBounds(this.visited[vertex]);
      bounds = bounds != null ? bounds : vertexBounds.clone();
      bounds.add(vertexBounds);
    }

    this.calcRowDims([<_mxCompactTreeLayoutLine>this.node], 0);

    let maxLeftGrad = 0;
    let maxRightGrad = 0;

    // Find the steepest left and right gradients
    for (let i = 0; i < this.row.length; i += 1) {
      const leftGrad =
        (this.centerX - this.rowMinX[i] - this.nodeDistance) / this.rowRadi[i];
      const rightGrad =
        (this.rowMaxX[i] - this.centerX - this.nodeDistance) / this.rowRadi[i];

      maxLeftGrad = Math.max(maxLeftGrad, leftGrad);
      maxRightGrad = Math.max(maxRightGrad, rightGrad);
    }

    // Extend out row so they meet the maximum gradient and convert to polar co-ords
    for (let i = 0; i < this.row.length; i += 1) {
      const xLeftLimit = this.centerX - this.nodeDistance - maxLeftGrad * this.rowRadi[i];
      const xRightLimit =
        this.centerX + this.nodeDistance + maxRightGrad * this.rowRadi[i];
      const fullWidth = xRightLimit - xLeftLimit;

      for (let j = 0; j < this.row[i].length; j++) {
        const row = this.row[i];
        const node = row[j];
        const vertexBounds = this.getVertexBounds(<Cell>node.cell);
        const xProportion =
          (vertexBounds.x + vertexBounds.width / 2 - xLeftLimit) / fullWidth;
        const theta = 2 * Math.PI * xProportion;
        node.theta = theta;
      }
    }

    // Post-process from outside inwards to try to align parents with children
    for (let i = this.row.length - 2; i >= 0; i--) {
      const row = this.row[i];

      for (let j = 0; j < row.length; j++) {
        const node = row[j];
        let { child } = node;
        let counter = 0;
        let totalTheta = 0;

        while (child != null) {
          totalTheta += <number>child.theta;
          counter++;
          child = child.next;
        }

        if (counter > 0) {
          const averTheta = totalTheta / counter;

          if (averTheta > <number>node.theta && j < row.length - 1) {
            const nextTheta = row[j + 1].theta;
            node.theta = Math.min(averTheta, <number>nextTheta - Math.PI / 10);
          } else if (averTheta < <number>node.theta && j > 0) {
            const lastTheta = row[j - 1].theta;
            node.theta = Math.max(averTheta, <number>lastTheta + Math.PI / 10);
          }
        }
      }
    }

    // Set locations
    for (let i = 0; i < this.row.length; i += 1) {
      for (let j = 0; j < this.row[i].length; j++) {
        const row = this.row[i];
        const node = row[j];
        const vertexBounds = this.getVertexBounds(<Cell>node.cell);
        this.setVertexLocation(
          <Cell>node.cell,
          this.centerX -
            vertexBounds.width / 2 +
            this.rowRadi[i] * Math.cos(<number>node.theta),
          this.centerY -
            vertexBounds.height / 2 +
            this.rowRadi[i] * Math.sin(<number>node.theta)
        );
      }
    }
  }

  /**
   * Recursive function to calculate the dimensions of each row
   *
   * @param row      Array of internal nodes, the children of which are to be processed.
   * @param rowNum   Integer indicating which row is being processed.
   */
  calcRowDims(row: _mxCompactTreeLayoutNode[], rowNum: number): void {
    if (row == null || row.length === 0) {
      return;
    }

    // Place root's children proportionally around the first level
    this.rowMinX[rowNum] = <number>this.centerX;
    this.rowMaxX[rowNum] = <number>this.centerX;
    this.rowMinCenX[rowNum] = <number>this.centerX;
    this.rowMaxCenX[rowNum] = <number>this.centerX;
    this.row[rowNum] = [];

    let rowHasChildren = false;

    for (let i = 0; i < row.length; i += 1) {
      let child = row[i] != null ? row[i].child : null;

      while (child != null) {
        const { cell } = child;
        const vertexBounds = this.getVertexBounds(<Cell>cell);

        this.rowMinX[rowNum] = Math.min(vertexBounds.x, this.rowMinX[rowNum]);
        this.rowMaxX[rowNum] = Math.max(
          vertexBounds.x + vertexBounds.width,
          this.rowMaxX[rowNum]
        );
        this.rowMinCenX[rowNum] = Math.min(
          vertexBounds.x + vertexBounds.width / 2,
          this.rowMinCenX[rowNum]
        );
        this.rowMaxCenX[rowNum] = Math.max(
          vertexBounds.x + vertexBounds.width / 2,
          this.rowMaxCenX[rowNum]
        );
        this.rowRadi[rowNum] = vertexBounds.y - this.getVertexBounds(<Cell>this.root).y;

        if (child.child != null) {
          rowHasChildren = true;
        }

        this.row[rowNum].push(child);
        child = child.next;
      }
    }

    if (rowHasChildren) {
      this.calcRowDims(this.row[rowNum], rowNum + 1);
    }
  }
}

export default RadialTreeLayout;
