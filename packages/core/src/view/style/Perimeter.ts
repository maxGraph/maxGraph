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

import { EllipsePerimeter as EllipsePerimeterFunction } from './perimeter/EllipsePerimeter';
import { HexagonPerimeter as HexagonPerimeterFunction } from './perimeter/HexagonPerimeter';
import { RectanglePerimeter as RectanglePerimeterFunction } from './perimeter/RectanglePerimeter';
import { RhombusPerimeter as RhombusPerimeterFunction } from './perimeter/RhombusPerimeter';
import { TrianglePerimeter as TrianglePerimeterFunction } from './perimeter/TrianglePerimeter';

/**
 * Provides various perimeter functions to be used in a style as the value of {@link CellStateStyle.perimeter}.
 *
 * ### Example
 *
 * ```javascript
 * <add as="perimeter">Perimeter.RectanglePerimeter</add>
 * ```
 *
 * ### Or programmatically
 *
 * ```javascript
 * style.perimeter = Perimeter.RectanglePerimeter;
 * ```
 *
 * When adding new perimeter functions, it is recommended to use the Perimeter-namespace as follows:
 *
 * ```javascript
 * Perimeter.CustomPerimeter = function (bounds, vertex, next, orthogonal)
 * {
 *   const x = 0; // Calculate x-coordinate
 *   const y = 0; // Calculate y-coordinate
 *
 *   return new Point(x, y);
 * }
 * ```
 *
 * #### The new perimeter should then be registered in the {@link StyleRegistry} as follows
 * ```javascript
 * StyleRegistry.putValue('customPerimeter', Perimeter.CustomPerimeter);
 * ```
 *
 * #### The custom perimeter above can now be used in a specific vertex as follows:
 *
 * ```javascript
 * model.setStyle(vertex, {...vertex.style, perimeter: 'customPerimeter'});
 * ```
 *
 * Note that the key of the {@link StyleRegistry} entry for the function should
 * be used in string values, unless {@link GraphView.allowEval} is `true`, in
 * which case you can also use Perimeter.CustomPerimeter for the value in
 * the cell style above.
 *
 * #### Or it can be used for all vertices in the graph as follows:
 *
 * ```javascript
 * var style = graph.getStylesheet().getDefaultVertexStyle();
 * style.perimeter = Perimeter.CustomPerimeter;
 * ```
 *
 * Note that the object can be used directly when programmatically setting
 * the value, but the key in the {@link StyleRegistry} should be used when
 * setting the value via a key, value pair in a cell style.
 *
 * @category Perimeter
 */
const Perimeter = {
  /**
   * Describes a rectangular perimeter.
   */
  RectanglePerimeter: RectanglePerimeterFunction,

  /**
   * Describes an elliptic perimeter.
   */
  EllipsePerimeter: EllipsePerimeterFunction,

  /**
   * Describes a rhombus (aka diamond) perimeter.
   */
  RhombusPerimeter: RhombusPerimeterFunction,

  /**
   * Describes a triangle perimeter.
   */
  TrianglePerimeter: TrianglePerimeterFunction,

  /**
   * Describes a hexagon perimeter.
   */
  HexagonPerimeter: HexagonPerimeterFunction,
};

export default Perimeter;
