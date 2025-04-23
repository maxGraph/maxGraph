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

import { EllipsePerimeter as EllipsePerimeterFunction } from './EllipsePerimeter';
import { HexagonPerimeter as HexagonPerimeterFunction } from './HexagonPerimeter';
import { RectanglePerimeter as RectanglePerimeterFunction } from './RectanglePerimeter';
import { RhombusPerimeter as RhombusPerimeterFunction } from './RhombusPerimeter';
import { TrianglePerimeter as TrianglePerimeterFunction } from './TrianglePerimeter';

/**
 * Provides various perimeter functions to be used in a style as the value of {@link CellStateStyle.perimeter}.
 *
 * @category Perimeter
 */
export const Perimeter = {
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
