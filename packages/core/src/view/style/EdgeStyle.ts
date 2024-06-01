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

import { getValue } from '../../util/Utils';
import { getNumber } from '../../util/StringUtils';
import {
  getBoundingBox,
  getPortConstraints,
  reversePortConstraints,
} from '../../util/mathUtils';
import Point from '../geometry/Point';
import type CellState from '../cell/CellState';
import {
  DEFAULT_MARKERSIZE,
  DIRECTION,
  DIRECTION_MASK,
  NONE,
} from '../../util/Constants';
import Rectangle from '../geometry/Rectangle';
import Geometry from '../geometry/Geometry';
import { scaleCellState, scalePointArray } from './edge/shared';
import type { EdgeStyleFunction } from '../../types';

import { ElbowConnector as ElbowConnectorFunction } from './edge/Elbow';
import { EntityRelation as EntityRelationFunction } from './edge/EntityRelation';
import { Loop as LoopFunction } from './edge/Loop';
import { SegmentConnector as SegmentConnectorFunction } from './edge/Segment';
import { SideToSide as SideToSideFunction } from './edge/SideToSide';
import { TopToBottom as TopToBottomFunction } from './edge/TopToBottom';

/**
 * Provides various edge styles to be used as the values for `edgeStyle` in a cell style.
 *
 * Example:
 *
 * ```javascript
 * let style = stylesheet.getDefaultEdgeStyle();
 * style.edgeStyle = EdgeStyle.ElbowConnector;
 * ```
 *
 * Sets the default edge style to `ElbowConnector`.
 *
 * Custom edge style:
 *
 * To write a custom edge style, a function must be added to the EdgeStyle object as follows:
 *
 * ```javascript
 * EdgeStyle.MyStyle = (state, source, target, points, result)=>
 * {
 *   if (source != null && target != null)
 *   {
 *     let pt = new Point(target.getCenterX(), source.getCenterY());
 *
 *     if (Utils.contains(source, pt.x, pt.y))
 *     {
 *       pt.y = source.y + source.height;
 *     }
 *
 *     result.push(pt);
 *   }
 * };
 * ```
 *
 * In the above example, a right angle is created using a point on the
 * horizontal center of the target vertex and the vertical center of the source
 * vertex. The code checks if that point intersects the source vertex and makes
 * the edge straight if it does. The point is then added into the result array,
 * which acts as the return value of the function.
 *
 * The new edge style should then be registered in the {@link StyleRegistry} as follows:
 * ```javascript
 * StyleRegistry.putValue('myEdgeStyle', EdgeStyle.MyStyle);
 * ```
 *
 * The custom edge style above can now be used in a specific edge as follows:
 *
 * ```javascript
 * style.edgeStyle = 'myEdgeStyle';
 * ```
 *
 * Note that the key of the {@link StyleRegistry} entry for the function should
 * be used in string values, unless {@link GraphView#allowEval} is true, in
 * which case you can also use `EdgeStyle.MyStyle` for the value in the
 * cell style above.
 *
 * Or it can be used for all edges in the graph as follows:
 *
 * ```javascript
 * let style = graph.getStylesheet().getDefaultEdgeStyle();
 * style.edgeStyle = EdgeStyle.MyStyle;
 * ```
 *
 * Note that the object can be used directly when programmatically setting
 * the value, but the key in the {@link StyleRegistry} should be used when
 * setting the value via a key, value pair in a cell style.
 */
class EdgeStyle {
  /**
   * Implements a self-reference, aka. loop.
   */
  static Loop = LoopFunction;
}

export default EdgeStyle;
