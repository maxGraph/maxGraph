/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import CompactTreeLayout from './CompactTreeLayout';
import Cell from '../cell/Cell';
import { Graph } from '../Graph';
import CellArray from '../cell/CellArray';

/**
 * Extends {@link mxGraphLayout} to implement a radial tree algorithm. This
 * layout is suitable for graphs that have no cycles (trees). Vertices that are
 * not connected to the tree will be ignored by this layout.
 *
 * @example
 * ```javascript
 * var layout = new mxRadialTreeLayout(graph);
 * layout.execute(graph.getDefaultParent());
 * ```
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
  angleOffset: number = 0.5;

  /**
   * The X co-ordinate of the root cell
   * @default 0
   */
  rootx: number = 0;

  /**
   * The Y co-ordinate of the root cell
   * @default 0
   */
  rooty: number = 0;

  /**
   * Holds the levelDistance.
   * @default 120
   */
  levelDistance: number = 120;

  /**
   * Holds the nodeDistance.
   * @default 10
   */
  nodeDistance: number = 10;

  /**
   * Specifies if the radios should be computed automatically
   * @default false
   */
  autoRadius: boolean = false;

  /**
   * Specifies if edges should be sorted according to the order of their
   * opposite terminal cell in the model.
   * @default false
   */
  sortEdges: boolean = false;

  /**
   * Array of leftmost x coordinate of each row
   */
  rowMinX: number[] = [];

  /**
   * Array of rightmost x coordinate of each row
   */
  rowMaxX: number[] = [];

  /**
   * Array of x coordinate of leftmost vertex of each row
   */
  rowMinCenX: number[] = [];

  /**
   * Array of x coordinate of rightmost vertex of each row
   */
  rowMaxCenX: number[] = [];

  /**
   * Array of y deltas of each row behind root vertex, also the radius in the tree
   */
  rowRadi: number[] = [];

  /**
   * Array of vertices on each row
   */
  row: CellArray = new CellArray();

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
   * Function: execute
   *
   * Implements <mxGraphLayout.execute>.
   *
   * If the parent has any connected edges, then it is used as the root of
   * the tree. Else, <mxGraph.findTreeRoots> will be used to find a suitable
   * root node within the set of children of the given parent.
   *
   * Parameters:
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
    const rootBounds = this.getVertexBounds(this.root);
    this.centerX = rootBounds.x + rootBounds.width / 2;
    this.centerY = rootBounds.y + rootBounds.height / 2;

    // Calculate the bounds of the involved vertices directly from the values set in the compact tree
    for (const vertex in this.visited) {
      const vertexBounds = this.getVertexBounds(this.visited[vertex]);
      bounds = bounds != null ? bounds : vertexBounds.clone();
      bounds.add(vertexBounds);
    }

    this.calcRowDims([this.node], 0);

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
        const vertexBounds = this.getVertexBounds(node.cell);
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
          totalTheta += child.theta;
          counter++;
          child = child.next;
        }

        if (counter > 0) {
          const averTheta = totalTheta / counter;

          if (averTheta > node.theta && j < row.length - 1) {
            const nextTheta = row[j + 1].theta;
            node.theta = Math.min(averTheta, nextTheta - Math.PI / 10);
          } else if (averTheta < node.theta && j > 0) {
            const lastTheta = row[j - 1].theta;
            node.theta = Math.max(averTheta, lastTheta + Math.PI / 10);
          }
        }
      }
    }

    // Set locations
    for (let i = 0; i < this.row.length; i += 1) {
      for (let j = 0; j < this.row[i].length; j++) {
        const row = this.row[i];
        const node = row[j];
        const vertexBounds = this.getVertexBounds(node.cell);
        this.setVertexLocation(
          node.cell,
          this.centerX - vertexBounds.width / 2 + this.rowRadi[i] * Math.cos(node.theta),
          this.centerY - vertexBounds.height / 2 + this.rowRadi[i] * Math.sin(node.theta)
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
  calcRowDims(row: number[], rowNum: number): void {
    if (row == null || row.length === 0) {
      return;
    }

    // Place root's children proportionally around the first level
    this.rowMinX[rowNum] = this.centerX;
    this.rowMaxX[rowNum] = this.centerX;
    this.rowMinCenX[rowNum] = this.centerX;
    this.rowMaxCenX[rowNum] = this.centerX;
    this.row[rowNum] = [];

    let rowHasChildren = false;

    for (let i = 0; i < row.length; i += 1) {
      let child = row[i] != null ? row[i].child : null;

      while (child != null) {
        const { cell } = child;
        const vertexBounds = this.getVertexBounds(cell);

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
        this.rowRadi[rowNum] = vertexBounds.y - this.getVertexBounds(this.root).y;

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
