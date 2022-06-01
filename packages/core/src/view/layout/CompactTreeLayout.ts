/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import Dictionary from '../../util/Dictionary';
import Point from '../geometry/Point';
import GraphLayout from './GraphLayout';
import CellPath from '../cell/CellPath';
import Rectangle from '../geometry/Rectangle';
import { sortCells } from '../../util/styleUtils';
import WeightedCellSorter from './util/WeightedCellSorter';
import Cell from '../cell/Cell';
import { Graph } from '../Graph';
import { findTreeRoots } from '../../util/treeTraversal';
import CellArray from '../cell/CellArray';

export interface _mxCompactTreeLayoutNode {
  cell?: Cell;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
  contour?: {
    upperTail?: _mxCompactTreeLayoutLine,
    upperHead?: _mxCompactTreeLayoutLine,
    lowerTail?: _mxCompactTreeLayoutLine,
    lowerHead?: _mxCompactTreeLayoutLine,
    [key: string]: any,
  };
  next?: _mxCompactTreeLayoutNode;
  child?: _mxCompactTreeLayoutNode;
  theta?: number;
}

export interface _mxCompactTreeLayoutLine {
  dx: number;
  dy: number;
  next: _mxCompactTreeLayoutLine;
  child?: _mxCompactTreeLayoutLine;
}

/**
 * @class CompactTreeLayout
 * @extends {GraphLayout}
 *
 * Extends {@link GraphLayout} to implement a compact tree (Moen) algorithm. This
 * layout is suitable for graphs that have no cycles (trees). Vertices that are
 * not connected to the tree will be ignored by this layout.
 *
 * ### Example
 *
 * ```javascript
 * var layout = new mxCompactTreeLayout(graph);
 * layout.execute(graph.getDefaultParent());
 * ```
 */
export class CompactTreeLayout extends GraphLayout {
  constructor(graph: Graph, horizontal: boolean = true, invert: boolean = false) {
    super(graph);
    this.horizontal = horizontal;
    this.invert = invert;
  }

  parentX: number | null = null;
  parentY: number | null = null;
  visited: { [key: string]: Cell } = {};

  /**
   * Specifies the orientation of the layout.
   * @default true
   */
  horizontal: boolean = true;

  /**
   * Specifies if edge directions should be inverted.
   * @default false.
   */
  invert: boolean = false;

  /**
   * If the parents should be resized to match the width/height of the
   * children. Default is true.
   * @default true
   */
  resizeParent: boolean = true;

  /**
   * Specifies if the parent location should be maintained, so that the
   * top, left corner stays the same before and after execution of
   * the layout. Default is false for backwards compatibility.
   * @default false
   */
  maintainParentLocation: boolean = false;

  /**
   * Padding added to resized parents.
   * @default 10
   */
  groupPadding: number = 10;

  /**
   * Top padding added to resized parents.
   * @default 0
   */
  groupPaddingTop: number = 0;

  /**
   * Right padding added to resized parents.
   * @default 0
   */
  groupPaddingRight: number = 0;

  /**
   * Bottom padding added to resized parents.
   * @default 0
   */
  groupPaddingBottom: number = 0;

  /**
   * Left padding added to resized parents.
   * @default 0
   */
  groupPaddingLeft: number = 0;

  /**
   * A set of the parents that need updating based on children
   * process as part of the layout.
   */
  parentsChanged: { [id: string]: Cell } | null = null;

  /**
   * Specifies if the tree should be moved to the top, left corner
   * if it is inside a top-level layer.
   * @default false
   */
  moveTree: boolean = false;

  /**
   * Holds the levelDistance.
   * @default 10
   */
  levelDistance: number = 10;

  /**
   * Holds the nodeDistance.
   * @default 20
   */
  nodeDistance: number = 20;

  /**
   * Specifies if all edge points of traversed edges should be removed.
   *
   * @default true
   */
  resetEdges: boolean = true;

  /**
   * The preferred horizontal distance between edges exiting a vertex.
   */
  prefHozEdgeSep: number = 5;

  /**
   * The preferred vertical offset between edges exiting a vertex.
   */
  prefVertEdgeOff: number = 4;

  /**
   * The minimum distance for an edge jetty from a vertex.
   */
  minEdgeJetty: number = 8;

  /**
   * The size of the vertical buffer in the center of inter-rank channels
   * where edge control points should not be placed.
   */
  channelBuffer: number = 4;

  /**
   * Whether or not to apply the internal tree edge routing.
   */
  edgeRouting: boolean = true;

  /**
   * Specifies if edges should be sorted according to the order of their
   * opposite terminal cell in the model.
   */
  sortEdges: boolean = false;

  /**
   * Whether or not the tops of cells in each rank should be aligned
   * across the rank
   */
  alignRanks: boolean = false;

  /**
   * An array of the maximum height of cells (relative to the layout direction)
   * per rank
   */
  maxRankHeight: CellArray | null = null;

  /**
   * The cell to use as the root of the tree
   */
  root: Cell | null = null;

  /**
   * The internal node representation of the root cell. Do not set directly
   * , this value is only exposed to assist with post-processing functionality
   */
  node: _mxCompactTreeLayoutNode | null = null;

  /**
   * Returns a boolean indicating if the given {@link mxCell} should be ignored as a
   * vertex. This returns true if the cell has no connections.
   *
   * @param vertex {@link mxCell} whose ignored state should be returned.
   */
  isVertexIgnored(vertex: Cell): boolean {
    return (
      super.isVertexIgnored(vertex) || vertex.getConnections().length === 0
    );
  }

  /**
   * Returns {@link horizontal}.
   */
  isHorizontal(): boolean {
    return this.horizontal;
  }

  /**
   * Implements {@link GraphLayout.execute}.
   *
   * If the parent has any connected edges, then it is used as the root of
   * the tree. Else, {@link mxGraph.findTreeRoots} will be used to find a suitable
   * root node within the set of children of the given parent.
   *
   * @param parent  {@link mxCell} whose children should be laid out.
   * @param root    Optional {@link mxCell} that will be used as the root of the tree. Overrides {@link root} if specified.
   */
  execute(parent: Cell, root?: Cell): void {
    this.parent = parent;
    const model = this.graph.getDataModel();

    if (root == null) {
      // Takes the parent as the root if it has outgoing edges
      if (
        this.graph.getEdges(parent, parent.getParent(), this.invert, !this.invert, false)
          .length > 0
      ) {
        this.root = parent;
      }

      // Tries to find a suitable root in the parent's
      // children
      else {
        const roots = findTreeRoots(this.graph, parent, true, this.invert);

        if (roots.length > 0) {
          for (let i = 0; i < roots.length; i += 1) {
            if (
              !this.isVertexIgnored(roots[i]) &&
              this.graph.getEdges(roots[i], null, this.invert, !this.invert, false)
                .length > 0
            ) {
              this.root = roots[i];
              break;
            }
          }
        }
      }
    } else {
      this.root = root;
    }

    if (this.root != null) {
      if (this.resizeParent) {
        this.parentsChanged = {};
      } else {
        this.parentsChanged = null;
      }

      //  Maintaining parent location
      this.parentX = null;
      this.parentY = null;

      if (
        parent !== this.root &&
        parent.isVertex() != null &&
        this.maintainParentLocation
      ) {
        const geo = parent.getGeometry();

        if (geo != null) {
          this.parentX = geo.x;
          this.parentY = geo.y;
        }
      }

      model.beginUpdate();

      try {
        this.visited = {};
        this.node = this.dfs(this.root, parent);

        if (this.alignRanks) {
          this.maxRankHeight = new CellArray();
          this.findRankHeights(this.node, 0);
          this.setCellHeights(this.node, 0);
        }

        if (this.node != null) {
          this.layout(this.node);
          let x0 = this.graph.gridSize;
          let y0 = x0;

          if (!this.moveTree) {
            const g = this.getVertexBounds(this.root);

            if (g != null) {
              x0 = g.x;
              y0 = g.y;
            }
          }

          let bounds = null;

          if (this.isHorizontal()) {
            bounds = this.horizontalLayout(this.node, x0, y0);
          } else {
            bounds = this.verticalLayout(this.node, null, x0, y0);
          }

          if (bounds != null) {
            let dx = 0;
            let dy = 0;

            if (bounds.x < 0) {
              dx = Math.abs(x0 - bounds.x);
            }

            if (bounds.y < 0) {
              dy = Math.abs(y0 - bounds.y);
            }

            if (dx !== 0 || dy !== 0) {
              this.moveNode(this.node, dx, dy);
            }

            if (this.resizeParent) {
              this.adjustParents();
            }

            if (this.edgeRouting) {
              // Iterate through all edges setting their positions
              this.localEdgeProcessing(this.node);
            }
          }

          // Maintaining parent location
          if (this.parentX != null && this.parentY != null) {
            let geo = parent.getGeometry();

            if (geo != null) {
              geo = geo.clone();
              geo.x = this.parentX;
              geo.y = this.parentY;
              model.setGeometry(parent, geo);
            }
          }
        }
      } finally {
        model.endUpdate();
      }
    }
  }

  /**
   * Moves the specified node and all of its children by the given amount.
   */
  moveNode(node: any, dx: number, dy: number): void {
    node.x += dx;
    node.y += dy;
    this.apply(node);

    let { child } = node;

    while (child != null) {
      this.moveNode(child, dx, dy);
      child = child.next;
    }
  }

  /**
   * Called if {@link sortEdges} is true to sort the array of outgoing edges in place.
   */
  sortOutgoingEdges(source: Cell, edges: CellArray): void {
    const lookup = new Dictionary();

    edges.sort((e1, e2) => {
      const end1 = <Cell>e1.getTerminal(e1.getTerminal(false) == source);
      let p1 = lookup.get(end1);

      if (p1 == null) {
        p1 = CellPath.create(end1).split(CellPath.PATH_SEPARATOR);
        lookup.put(end1, p1);
      }

      const end2 = <Cell>e2.getTerminal(e2.getTerminal(false) === source);
      let p2 = lookup.get(end2);

      if (p2 == null) {
        p2 = CellPath.create(end2).split(CellPath.PATH_SEPARATOR);
        lookup.put(end2, p2);
      }

      return CellPath.compare(<string[]>p1, <string[]>p2);
    });
  }

  /**
   * Stores the maximum height (relative to the layout
   * direction) of cells in each rank
   */
  findRankHeights(node: any, rank: number): void {
    const maxRankHeight = <CellArray>this.maxRankHeight;
    if (maxRankHeight[rank] == null || maxRankHeight[rank] < node.height) {
      maxRankHeight[rank] = node.height;
    }

    let { child } = node;
    while (child != null) {
      this.findRankHeights(child, rank + 1);
      child = child.next;
    }
  }

  /**
   * Set the cells heights (relative to the layout
   * direction) when the tops of each rank are to be aligned
   */
  setCellHeights(node: any, rank: number): void {
    const maxRankHeight = <CellArray>this.maxRankHeight;
    if (maxRankHeight[rank] != null && maxRankHeight[rank] > node.height) {
      node.height = maxRankHeight[rank];
    }

    let { child } = node;
    while (child != null) {
      this.setCellHeights(child, rank + 1);
      child = child.next;
    }
  }

  /**
   * Does a depth first search starting at the specified cell.
   * Makes sure the specified parent is never left by the
   * algorithm.
   */
  dfs(cell: Cell, parent: Cell) {
    const id = CellPath.create(cell);
    let node = null;

    if (cell != null && this.visited[id] == null && !this.isVertexIgnored(cell)) {
      this.visited[id] = cell;
      node = this.createNode(cell);

      const model = this.graph.getDataModel();
      let prev = null;
      const out = this.graph.getEdges(
        cell,
        parent,
        this.invert,
        !this.invert,
        false,
        true
      );
      const view = this.graph.getView();

      if (this.sortEdges) {
        this.sortOutgoingEdges(cell, out);
      }

      for (let i = 0; i < out.length; i += 1) {
        const edge = out[i];

        if (!this.isEdgeIgnored(edge)) {
          // Resets the points on the traversed edge
          if (this.resetEdges) {
            this.setEdgePoints(edge, null);
          }

          if (this.edgeRouting) {
            this.setEdgeStyleEnabled(edge, false);
            this.setEdgePoints(edge, null);
          }

          // Checks if terminal in same swimlane
          const state = view.getState(edge);
          const target =
            state != null
              ? <Cell>state.getVisibleTerminal(this.invert)
              : <Cell>view.getVisibleTerminal(edge, this.invert);
          const tmp = this.dfs(target, parent);

          if (tmp != null && target.getGeometry() != null) {
            if (prev == null) {
              node.child = tmp;
            } else {
              prev.next = tmp;
            }
            prev = tmp;
          }
        }
      }
    }

    return node;
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  layout(node: any): void {
    let { child } = node;

    while (child != null) {
      this.layout(child);
      child = child.next;
    }

    if (node.child != null) {
      this.attachParent(node, this.join(node));
    } else {
      this.layoutLeaf(node);
    }
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  horizontalLayout(node: any, x0: number, y0: number, bounds: Rectangle | null=null): Rectangle | null {
    node.x += x0 + node.offsetX;
    node.y += y0 + node.offsetY;
    bounds = this.apply(node, bounds);
    const { child } = node;

    if (child != null) {
      bounds = this.horizontalLayout(child, node.x, node.y, bounds);
      let siblingOffset = node.y + child.offsetY;
      let s = child.next;

      while (s != null) {
        bounds = this.horizontalLayout(s, node.x + child.offsetX, siblingOffset, bounds);
        siblingOffset += s.offsetY;
        s = s.next;
      }
    }
    return bounds;
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  verticalLayout(
    node: _mxCompactTreeLayoutNode, 
    parent: _mxCompactTreeLayoutNode | null, 
    x0: number, 
    y0: number, 
    bounds: Rectangle | null=null
  ): Rectangle | null {
    node.x = <number>node.x + x0 + <number>node.offsetY;
    node.y = <number>node.y + y0 + <number>node.offsetX;
    bounds = this.apply(node, bounds);
    const { child } = node;

    if (child != null) {
      bounds = this.verticalLayout(child, node, <number>node.x, <number>node.y, bounds);
      let siblingOffset = <number>node.x + <number>child.offsetY;
      let s = child.next;

      while (s != null) {
        bounds = this.verticalLayout(
          s,
          node,
          siblingOffset,
          <number>node.y + <number>child.offsetX,
          bounds
        );
        siblingOffset += <number>s.offsetY;
        s = s.next;
      }
    }
    return bounds;
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  attachParent(node: any, height: number): void {
    const x = this.nodeDistance + this.levelDistance;
    const y2 = (height - node.width) / 2 - this.nodeDistance;
    const y1 = y2 + node.width + 2 * this.nodeDistance - height;

    node.child.offsetX = x + node.height;
    node.child.offsetY = y1;

    node.contour.upperHead = this.createLine(
      node.height,
      0,
      this.createLine(x, y1, node.contour.upperHead)
    );
    node.contour.lowerHead = this.createLine(
      node.height,
      0,
      this.createLine(x, y2, node.contour.lowerHead)
    );
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  // layoutLeaf(node: any): void;
  layoutLeaf(node: any): void {
    const dist = 2 * this.nodeDistance;

    node.contour.upperTail = this.createLine(node.height + dist, 0);
    node.contour.upperHead = node.contour.upperTail;
    node.contour.lowerTail = this.createLine(0, -node.width - dist);
    node.contour.lowerHead = this.createLine(
      node.height + dist,
      0,
      node.contour.lowerTail
    );
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  join(node: any): number {
    const dist = 2 * this.nodeDistance;

    let { child } = node;
    node.contour = child.contour;
    let h = child.width + dist;
    let sum = h;
    child = child.next;

    while (child != null) {
      const d = this.merge(node.contour, child.contour);
      child.offsetY = d + h;
      child.offsetX = 0;
      h = child.width + dist;
      sum += d + h;
      child = child.next;
    }

    return sum;
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  merge(p1: any, p2: any): number {
    let x = 0;
    let y = 0;
    let total = 0;

    let upper = p1.lowerHead;
    let lower = p2.upperHead;

    while (lower != null && upper != null) {
      const d = this.offset(x, y, lower.dx, lower.dy, upper.dx, upper.dy);
      y += d;
      total += d;

      if (x + lower.dx <= upper.dx) {
        x += lower.dx;
        y += lower.dy;
        lower = lower.next;
      } else {
        x -= upper.dx;
        y -= upper.dy;
        upper = upper.next;
      }
    }

    if (lower != null) {
      const b = this.bridge(p1.upperTail, 0, 0, lower, x, y);
      p1.upperTail = b.next != null ? p2.upperTail : b;
      p1.lowerTail = p2.lowerTail;
    } else {
      const b = this.bridge(p2.lowerTail, x, y, upper, 0, 0);

      if (b.next == null) {
        p1.lowerTail = b;
      }
    }

    p1.lowerHead = p2.lowerHead;

    return total;
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  // offset(p1: number, p2: number, a1: number, a2: number, b1: number, b2: number): number;
  offset(p1: number, p2: number, a1: number, a2: number, b1: number, b2: number): number {
    let d = 0;

    if (b1 <= p1 || p1 + a1 <= 0) {
      return 0;
    }

    const t = b1 * a2 - a1 * b2;

    if (t > 0) {
      if (p1 < 0) {
        const s = p1 * a2;
        d = s / a1 - p2;
      } else if (p1 > 0) {
        const s = p1 * b2;
        d = s / b1 - p2;
      } else {
        d = -p2;
      }
    } else if (b1 < p1 + a1) {
      const s = (b1 - p1) * a2;
      d = b2 - (p2 + s / a1);
    } else if (b1 > p1 + a1) {
      const s = (a1 + p1) * b2;
      d = s / b1 - (p2 + a2);
    } else {
      d = b2 - (p2 + a2);
    }

    if (d > 0) {
      return d;
    }
    return 0;
  }

  bridge(
    line1: _mxCompactTreeLayoutLine, 
    x1: number, 
    y1: number, 
    line2: _mxCompactTreeLayoutLine, 
    x2: number, 
    y2: number
  ) {
    const dx = x2 + line2.dx - x1;
    let dy = 0;
    let s = 0;

    if (line2.dx === 0) {
      dy = line2.dy;
    } else {
      s = dx * line2.dy;
      dy = s / line2.dx;
    }

    const r = this.createLine(dx, dy, line2.next);
    line1.next = this.createLine(0, y2 + line2.dy - dy - y1, r);

    return r;
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  createNode(cell: Cell): _mxCompactTreeLayoutNode {
    const node: _mxCompactTreeLayoutNode = {};
    node.cell = cell;
    node.x = 0;
    node.y = 0;
    node.width = 0;
    node.height = 0;

    const geo = this.getVertexBounds(cell);

    if (geo != null) {
      if (this.isHorizontal()) {
        node.width = geo.height;
        node.height = geo.width;
      } else {
        node.width = geo.width;
        node.height = geo.height;
      }
    }

    node.offsetX = 0;
    node.offsetY = 0;
    node.contour = {};
    return node;
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  apply(node: _mxCompactTreeLayoutNode, bounds: Rectangle | null=null): Rectangle | null {
    const model = this.graph.getDataModel();
    const cell = <Cell>node.cell;
    let g: Rectangle = <Rectangle>cell.getGeometry();

    if (cell != null && g != null) {
      if (this.isVertexMovable(cell)) {
        g = <Rectangle>this.setVertexLocation(cell, <number>node.x, <number>node.y);

        if (this.resizeParent) {
          const parent = <Cell>cell.getParent();
          const id = <string>CellPath.create(parent);

          // Implements set semantic
          const parentsChanged = <{ [id: string]: Cell }>this.parentsChanged;
          if (parentsChanged[id] == null) {
            parentsChanged[id] = parent;
          }
        }
      }

      if (bounds == null) {
        bounds = new Rectangle(g.x, g.y, g.width, g.height);
      } else {
        bounds = new Rectangle(
          Math.min(bounds.x, g.x),
          Math.min(bounds.y, g.y),
          Math.max(bounds.x + bounds.width, g.x + g.width),
          Math.max(bounds.y + bounds.height, g.y + g.height)
        );
      }
    }
    return bounds;
  }

  /**
   * Starts the actual compact tree layout algorithm
   * at the given node.
   */
  createLine(dx: number, dy: number, next: any=null): _mxCompactTreeLayoutLine {
    let line: _mxCompactTreeLayoutLine = {
      dx, 
      dy, 
      next
    };
    return line;
  }

  /**
   * Adjust parent cells whose child geometries have changed. The default
   * implementation adjusts the group to just fit around the children with
   * a padding.
   */
  adjustParents(): void {
    const tmp = new CellArray();

    for (const id in this.parentsChanged) {
      tmp.push(this.parentsChanged[id]);
    }

    this.arrangeGroups(
      sortCells(tmp, true),
      this.groupPadding,
      this.groupPaddingTop,
      this.groupPaddingRight,
      this.groupPaddingBottom,
      this.groupPaddingLeft
    );
  }

  /**
   * Moves the specified node and all of its children by the given amount.
   */
  localEdgeProcessing(node: _mxCompactTreeLayoutNode): void {
    this.processNodeOutgoing(node);
    let { child } = node;

    while (child != null) {
      this.localEdgeProcessing(child);
      child = child.next;
    }
  }

  /**
   * Separates the x position of edges as they connect to vertices
   */
  processNodeOutgoing(node: _mxCompactTreeLayoutNode): void {
    let { child } = node;
    const parentCell = <Cell>node.cell;

    let childCount = 0;
    const sortedCells: WeightedCellSorter[] = [];

    while (child != null) {
      childCount++;

      let sortingCriterion;
      if (this.horizontal) {
        sortingCriterion = <number>child.y;
      } else {
        sortingCriterion = <number>child.x;
      }

      sortedCells.push(new WeightedCellSorter(child, sortingCriterion));
      child = child.next;
    }

    sortedCells.sort(WeightedCellSorter.compare);

    let availableWidth = <number>node.width;

    const requiredWidth = (childCount + 1) * this.prefHozEdgeSep;

    // Add a buffer on the edges of the vertex if the edge count allows
    if (availableWidth > requiredWidth + 2 * this.prefHozEdgeSep) {
      availableWidth -= 2 * this.prefHozEdgeSep;
    }

    const edgeSpacing = availableWidth / childCount;

    let currentXOffset = edgeSpacing / 2.0;

    if (availableWidth > requiredWidth + 2 * this.prefHozEdgeSep) {
      currentXOffset += this.prefHozEdgeSep;
    }

    let currentYOffset = this.minEdgeJetty - this.prefVertEdgeOff;
    let maxYOffset = 0;

    const parentBounds = this.getVertexBounds(parentCell);
    child = node.child;

    for (let j = 0; j < sortedCells.length; j++) {
      const childCell = <Cell>(<_mxCompactTreeLayoutNode>sortedCells[j].cell).cell;
      const childBounds = this.getVertexBounds(childCell);
      const edges = this.graph.getEdgesBetween(parentCell, childCell, false);

      const newPoints: Point[] = [];
      let x = 0;
      let y = 0;

      for (let i = 0; i < edges.length; i += 1) {
        if (this.horizontal) {
          // Use opposite co-ords, calculation was done for
          //
          x = parentBounds.x + parentBounds.width;
          y = parentBounds.y + currentXOffset;
          newPoints.push(new Point(x, y));
          x = parentBounds.x + parentBounds.width + currentYOffset;
          newPoints.push(new Point(x, y));
          y = childBounds.y + childBounds.height / 2.0;
          newPoints.push(new Point(x, y));
          this.setEdgePoints(edges[i], newPoints);
        } else {
          x = parentBounds.x + currentXOffset;
          y = parentBounds.y + parentBounds.height;
          newPoints.push(new Point(x, y));
          y = parentBounds.y + parentBounds.height + currentYOffset;
          newPoints.push(new Point(x, y));
          x = childBounds.x + childBounds.width / 2.0;
          newPoints.push(new Point(x, y));
          this.setEdgePoints(edges[i], newPoints);
        }
      }

      if (j < childCount / 2) {
        currentYOffset += this.prefVertEdgeOff;
      } else if (j > childCount / 2) {
        currentYOffset -= this.prefVertEdgeOff;
      }
      // Ignore the case if equals, this means the second of 2
      // jettys with the same y (even number of edges)

      //                pos[k * 2] = currentX;
      currentXOffset += edgeSpacing;
      //                pos[k * 2 + 1] = currentYOffset;

      maxYOffset = Math.max(maxYOffset, currentYOffset);
    }
  }
}

export default CompactTreeLayout;
