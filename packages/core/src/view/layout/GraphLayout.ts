/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2018, JGraph Ltd
Copyright (c) 2006-2018, Gaudenz Alder

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

import Rectangle from '../geometry/Rectangle.js';
import Geometry from '../geometry/Geometry.js';
import Point from '../geometry/Point.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type Cell from '../cell/Cell.js';
import { GraphLayoutTraverseArgs } from './types.js';

/**
 * Base class for all layout algorithms in maxGraph.
 *
 * Main public methods are {@link moveCell} for handling a moved cell within a layouted parent,
 * and {@link execute} for running the layout on a given parent cell.
 *
 * @category Layout
 */
class GraphLayout {
  constructor(graph: AbstractGraph) {
    this.graph = graph;
  }

  /**
   * Reference to the enclosing {@link AbstractGraph}.
   */
  graph: AbstractGraph;

  /**
   * Boolean indicating if the bounding box of the label should be used if it iss available.
   * @default true.
   */
  useBoundingBox = true;

  /**
   * The parent cell of the layout, if any
   * @default null
   */
  parent: Cell | null = null;

  /**
   * Notified when a cell is being moved in a parent that has automatic
   * layout to update the cell state (eg. index) so that the outcome of the
   * layout will position the vertex as close to the point (x, y) as
   * possible.
   *
   * Empty implementation.
   *
   * @param cell {@link Cell} which has been moved.
   * @param x X-coordinate of the new cell location.
   * @param y Y-coordinate of the new cell location.
   */
  moveCell(cell: Cell, x: number, y: number): void {
    return;
  }

  /**
   * Notified when a cell is being resized in a parent that has automatic
   * layout to update the other cells in the layout.
   *
   * Empty implementation.
   *
   * @param cell {@link Cell} which has been moved.
   * @param bounds {@link Rectangle} that represents the new cell bounds.
   * @param prev
   */
  resizeCell(cell: Cell, bounds: Rectangle, prev?: Cell) {
    return;
  }

  /**
   * Executes the layout algorithm for the children of the given parent.
   *
   * @param parent {@link Cell} whose children should be layed out.
   */
  execute(parent: Cell): void {
    return;
  }

  /**
   * Returns the graph that this layout operates on.
   */
  getGraph(): AbstractGraph {
    return this.graph;
  }

  /**
   * Returns the constraint for the given key and cell. The optional edge and
   * source arguments are used to return inbound and outgoing routing-
   * constraints for the given edge and vertex. This implementation always
   * returns the value for the given key in the style of the given cell.
   *
   * @param key Key of the constraint to be returned.
   * @param cell {@link Cell} whose constraint should be returned.
   * @param edge Optional {@link Cell} that represents the connection whose constraint
   * should be returned. Default is null.
   * @param source Optional boolean that specifies if the connection is incoming
   * or outgoing. Default is null.
   */
  getConstraint(key: string, cell: Cell, edge?: Cell, source?: boolean): any {
    // @ts-expect-error
    return this.graph.getCurrentCellStyle(cell)[key];
  }

  /**
   * Traverses the (directed) graph invoking the given function for each
   * visited vertex and edge. The function is invoked with the current vertex
   * and the incoming edge as a parameter. This implementation makes sure
   * each vertex is only visited once. The function may return false if the
   * traversal should stop at the given vertex.
   *
   * Example:
   *
   * ```javascript
   * GlobalConfig.logger.show();
   * const cell = graph.getSelectionCell();
   * graph.traverse(cell, false, function(vertex, edge)
   * {
   *   GlobalConfig.logger.debug(graph.getLabel(vertex));
   * });
   * ```
   *
   * @param vertex {@link Cell} that represents the vertex where the traversal starts.
   * @param directed Optional boolean indicating if edges should only be traversed
   * from source to target. Default is true.
   * @param func Visitor function that takes the current vertex and the incoming
   * edge as arguments. The traversal stops if the function returns false.
   * @param edge Optional {@link Cell} that represents the incoming edge. This is
   * null for the first step of the traversal.
   * @param visited Optional {@link Map} of cell paths for the visited cells.
   */
  traverse({ vertex, directed, func, edge, visited }: GraphLayoutTraverseArgs): void {
    if (func != null && vertex != null) {
      directed = directed != null ? directed : true;
      visited = visited || new Map();

      if (!visited.get(vertex)) {
        visited.set(vertex, true);
        const result = func(vertex, edge);

        if (result == null || result) {
          const edgeCount = vertex.getEdgeCount();

          if (edgeCount > 0) {
            for (let i = 0; i < edgeCount; i += 1) {
              const e: Cell = vertex.getEdgeAt(i);
              const isSource = e.getTerminal(true) === vertex;

              if (!directed || isSource) {
                const next = this.graph.view.getVisibleTerminal(e, !isSource);
                this.traverse({
                  vertex: next,
                  directed,
                  func,
                  edge: e,
                  visited,
                });
              }
            }
          }
        }
      }
    }
  }

  /**
   * Returns true if the given parent is an ancestor of the given child.
   *
   * @param parent {@link Cell} that specifies the parent.
   * @param child {@link Cell} that specifies the child.
   * @param traverseAncestors boolean whether to
   */
  isAncestor(parent: Cell, child: Cell | null, traverseAncestors?: boolean): boolean {
    if (!traverseAncestors) {
      return (<Cell>child).getParent() === parent;
    }

    if (child === parent) {
      return false;
    }

    while (child != null && child !== parent) {
      child = child.getParent();
    }

    return child === parent;
  }

  /**
   * Returns a boolean indicating if the given {@link Cell} is movable or
   * bendable by the algorithm. This implementation returns true if the given
   * cell is movable in the graph.
   *
   * @param cell {@link Cell} whose movable state should be returned.
   */
  isVertexMovable(cell: Cell): boolean {
    return this.graph.isCellMovable(cell);
  }

  /**
   * Returns a boolean indicating if the given {@link Cell} should be ignored by
   * the algorithm. This implementation returns false for all vertices.
   *
   * @param vertex {@link Cell} whose ignored state should be returned.
   */
  isVertexIgnored(vertex: Cell): boolean {
    return !vertex.isVertex() || !vertex.isVisible();
  }

  /**
   * Returns a boolean indicating if the given {@link Cell} should be ignored by
   * the algorithm. This implementation returns false for all vertices.
   *
   * @param edge {@link Cell} whose ignored state should be returned.
   */
  isEdgeIgnored(edge: Cell): boolean {
    return (
      !edge.isEdge() ||
      !edge.isVisible() ||
      edge.getTerminal(true) == null ||
      edge.getTerminal(false) == null
    );
  }

  /**
   * Disables or enables the edge style of the given edge.
   */
  setEdgeStyleEnabled(edge: Cell, value: any): void {
    this.graph.setCellStyles('noEdgeStyle', value ? '0' : '1', [edge]);
  }

  /**
   * Disables or enables orthogonal end segments of the given edge.
   */
  setOrthogonalEdge(edge: Cell, value: any): void {
    this.graph.setCellStyles('orthogonal', value ? '1' : '0', [edge]);
  }

  /**
   * Determines the offset of the given parent to the parent
   * of the layout
   */
  getParentOffset(parent: Cell | null): Point {
    const result = new Point();

    if (parent != null && parent !== this.parent) {
      const model = this.graph.getDataModel();

      if (this.parent && this.parent.isAncestor(parent)) {
        let parentGeo = <Geometry>parent.getGeometry();

        while (parent !== this.parent) {
          result.x += parentGeo.x;
          result.y += parentGeo.y;

          parent = <Cell>parent.getParent();
          parentGeo = <Geometry>parent.getGeometry();
        }
      }
    }
    return result;
  }

  /**
   * Replaces the array of Point in the geometry of the given edge
   * with the given array of Point.
   */
  setEdgePoints(edge: Cell, points: Point[] | null): void {
    if (edge != null) {
      const { model } = this.graph;
      let geometry = edge.getGeometry();

      if (geometry == null) {
        geometry = new Geometry();
        geometry.setRelative(true);
      } else {
        geometry = geometry.clone();
      }

      if (this.parent != null && points != null) {
        const parent = <Cell>edge.getParent();
        const parentOffset = this.getParentOffset(parent);

        for (let i = 0; i < points.length; i += 1) {
          points[i].x = points[i].x - parentOffset.x;
          points[i].y = points[i].y - parentOffset.y;
        }
      }

      geometry.points = points;
      model.setGeometry(edge, geometry);
    }
  }

  /**
   * Sets the new position of the given cell taking into account the size of
   * the bounding box if {@link useBoundingBox} is true. The change is only carried
   * out if the new location is not equal to the existing location, otherwise
   * the geometry is not replaced with an updated instance. The new or old
   * bounds are returned (including overlapping labels).
   *
   * @param cell {@link Cell} whose geometry is to be set.
   * @param x Integer that defines the x-coordinate of the new location.
   * @param y Integer that defines the y-coordinate of the new location.
   */
  setVertexLocation(cell: Cell, x: number, y: number): Rectangle | null {
    const model = this.graph.getDataModel();
    let geometry = cell.getGeometry();
    let result = null;

    if (geometry != null) {
      result = new Rectangle(x, y, geometry.width, geometry.height);

      // Checks for oversize labels and shifts the result
      // TODO: Use mxUtils.getStringSize for label bounds
      if (this.useBoundingBox) {
        const state = this.graph.getView().getState(cell);

        if (state != null && state.text != null && state.text.boundingBox != null) {
          const { scale } = this.graph.getView();
          const box = state.text.boundingBox;

          if (state.text.boundingBox.x < state.x) {
            x += (state.x - box.x) / scale;
            result.width = box.width;
          }

          if (state.text.boundingBox.y < state.y) {
            y += (state.y - box.y) / scale;
            result.height = box.height;
          }
        }
      }

      if (this.parent != null) {
        const parent = cell.getParent();

        if (parent != null && parent !== this.parent) {
          const parentOffset = this.getParentOffset(parent);

          x -= parentOffset.x;
          y -= parentOffset.y;
        }
      }

      if (geometry.x !== x || geometry.y !== y) {
        geometry = geometry.clone();
        geometry.x = x;
        geometry.y = y;

        model.setGeometry(cell, geometry);
      }
    }

    return result;
  }

  /**
   * Returns an {@link Rectangle} that defines the bounds of the given cell or
   * the bounding box if {@link useBoundingBox} is true.
   */
  getVertexBounds(cell: Cell): Rectangle {
    let geo = <Rectangle>cell.getGeometry();

    // Checks for oversize label bounding box and corrects
    // the return value accordingly
    // TODO: Use mxUtils.getStringSize for label bounds
    if (this.useBoundingBox) {
      const state = this.graph.getView().getState(cell);

      if (state != null && state.text != null && state.text.boundingBox != null) {
        const { scale } = this.graph.getView();
        const tmp = state.text.boundingBox;

        const dx0 = Math.max(state.x - tmp.x, 0) / scale;
        const dy0 = Math.max(state.y - tmp.y, 0) / scale;
        const dx1 = Math.max(tmp.x + tmp.width - (state.x + state.width), 0) / scale;
        const dy1 = Math.max(tmp.y + tmp.height - (state.y + state.height), 0) / scale;

        geo = new Rectangle(
          geo.x - dx0,
          geo.y - dy0,
          geo.width + dx0 + dx1,
          geo.height + dy0 + dy1
        );
      }
    }

    if (this.parent != null) {
      const parent = cell.getParent();
      geo = geo.clone();

      if (parent != null && parent !== this.parent) {
        const parentOffset = this.getParentOffset(parent);
        geo.x += parentOffset.x;
        geo.y += parentOffset.y;
      }
    }

    return new Rectangle(geo.x, geo.y, geo.width, geo.height);
  }

  /**
   * Shortcut to {@link AbstractGraph.updateGroupBounds} with moveGroup set to true.
   */
  arrangeGroups(
    cells: Cell[],
    border: number,
    topBorder: number,
    rightBorder: number,
    bottomBorder: number,
    leftBorder: number
  ) {
    return this.graph.updateGroupBounds(
      cells,
      border,
      true,
      topBorder,
      rightBorder,
      bottomBorder,
      leftBorder
    );
  }
}

export default GraphLayout;
