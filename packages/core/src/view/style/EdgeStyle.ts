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

import { ElbowConnector as ElbowConnectorFunction } from './edge/Elbow';
import { EntityRelation as EntityRelationFunction } from './edge/EntityRelation';
import { Loop as LoopFunction } from './edge/Loop';
import { ManhattanConnector as ManhattanConnectorFunction } from './edge/Manhattan';
import { OrthogonalConnector as OrthogonalConnectorFunction } from './edge/Orthogonal';
import { SegmentConnector as SegmentConnectorFunction } from './edge/Segment';
import { SideToSide as SideToSideFunction } from './edge/SideToSide';
import { TopToBottom as TopToBottomFunction } from './edge/TopToBottom';

/**
 * Provides various edge styles to be used as the values for `edgeStyle` in a cell style.
 *
 * The following example sets the default edge style to `ElbowConnector`:
 *
 * ```javascript
 * const style = stylesheet.getDefaultEdgeStyle();
 * style.edgeStyle = EdgeStyle.ElbowConnector;
 * ```
 *
 * To write a custom edge style, create a function as follows.
 * In the example below, a right angle is created using a point on the horizontal center of the target vertex and the vertical center of the source vertex.
 * The code checks if that point intersects the source vertex and makes the edge straight if it does.
 * The point is then added into the result array, which acts as the return value of the function.
 *
 * ```javascript
 * const MyStyle = (state, source, target, points, result) => {
 *   if (source && target) {
 *     const pt = new Point(target.getCenterX(), source.getCenterY());
 *
 *     if (mathUtils.contains(source, pt.x, pt.y)) {
 *       pt.y = source.y + source.height;
 *     }
 *
 *     result.push(pt);
 *   }
 * };
 * ```
 *
 * The new edge style can then be registered in the {@link StyleRegistry} as follows:
 * ```javascript
 * StyleRegistry.putValue('myEdgeStyle', MyStyle);
 * ```
 *
 * The custom edge style above can now be used in a specific edge as follows:
 * ```javascript
 * style.edgeStyle = 'myEdgeStyle';
 * ```
 *
 * The key of the {@link StyleRegistry} entry for the function should be used in the {@link CellState.edgeStyle} values, unless {@link GraphView#allowEval} is `true.
 * In this case, you can also use the `'EdgeStyle.MyStyle'` string for the value in the cell style above.
 *
 * The custom EdgeStyle can be used for all edges in the graph as follows:
 *
 * ```javascript
 * const style = graph.getStylesheet().getDefaultEdgeStyle();
 * style.edgeStyle = EdgeStyle.MyStyle;
 * ```
 *
 * It can also be used directly when setting the value of the `edgeStyle` key in a style of a specific edge as follows:
 * ```javascript
 * style.edgeStyle = EdgeStyle.MyStyle;
 * ```
 */
class EdgeStyle {
  /**
   * Implements an entity relation style for edges (as used in database
   * schema diagrams). At the time the function is called, the result
   * array contains a placeholder (null) for the first absolute point,
   * that is, the point where the edge and source terminal are connected.
   * The implementation of the style then adds all intermediate waypoints
   * except for the last point, that is, the connection point between the
   * edge and the target terminal. The first ant the last point in the
   * result array are then replaced with Point that take into account
   * the terminal's perimeter and next point on the edge.
   *
   * @param state {@link CellState} that represents the edge to be updated.
   * @param source {@link CellState} that represents the source terminal.
   * @param target {@link CellState} that represents the target terminal.
   * @param points List of relative control points.
   * @param result Array of {@link Point} that represent the actual points of the edge.
   */
  static EntityRelation = EntityRelationFunction;

  /**
   * Implements a self-reference, aka. loop.
   */
  static Loop = LoopFunction;

  /**
   * Uses either {@link SideToSide} or {@link TopToBottom} depending on the horizontal flag in the cell style.
   * {@link SideToSide} is used if horizontal is `true` or unspecified.
   */
  static ElbowConnector = ElbowConnectorFunction;

  /**
   * Implements a vertical elbow edge.
   */
  static SideToSide = SideToSideFunction;

  /**
   * Implements a horizontal elbow edge.
   */
  static TopToBottom = TopToBottomFunction;

  /**
   * Implements an orthogonal edge style. Use {@link EdgeSegmentHandler}
   * as an interactive handler for this style.
   *
   * @param state {@link CellState} that represents the edge to be updated.
   * @param sourceScaled {@link CellState} that represents the source terminal.
   * @param targetScaled {@link CellState} that represents the target terminal.
   * @param controlHints List of relative control points.
   * @param result Array of {@link Point} that represent the actual points of the edge.
   */
  static SegmentConnector = SegmentConnectorFunction;

  /**
   * Implements a local orthogonal router between the given cells.
   *
   * @param state {@link CellState} that represents the edge to be updated.
   * @param sourceScaled {@link CellState} that represents the source terminal.
   * @param targetScaled {@link CellState} that represents the target terminal.
   * @param controlHints List of relative control {@link Point}s.
   * @param result Array of {@link Point}s that represent the actual points of the
   * edge.
   */
  static OrthConnector = OrthogonalConnectorFunction;

  /**
   * ManhattanConnector code is based on code from https://github.com/mwangm/mxgraph-manhattan-connector
   *
   * Implements router to find the shortest route that avoids cells using manhattan distance as metric.
   */
  static ManhattanConnector = ManhattanConnectorFunction;
}

export default EdgeStyle;
