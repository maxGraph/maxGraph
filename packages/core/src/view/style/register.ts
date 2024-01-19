/*
Copyright 2024-present The maxGraph project Contributors

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

import { EDGESTYLE, PERIMETER } from '../../util/Constants';
import EdgeStyle from './EdgeStyle';
import Perimeter from './Perimeter';
import StyleRegistry from './StyleRegistry';

let isCoreElementsRegistered = false;
/**
 * Register style elements for "EdgeStyle" and "Perimeters".
 */
export const registerCoreStyleElements = (): void => {
  if (!isCoreElementsRegistered) {
    registerEdgeStyles();
    registerPerimeters();
    isCoreElementsRegistered = true;
  }
};

const registerEdgeStyles = (): void => {
  StyleRegistry.putValue(EDGESTYLE.ELBOW, EdgeStyle.ElbowConnector);
  StyleRegistry.putValue(EDGESTYLE.ENTITY_RELATION, EdgeStyle.EntityRelation);
  StyleRegistry.putValue(EDGESTYLE.LOOP, EdgeStyle.Loop);
  StyleRegistry.putValue(EDGESTYLE.MANHATTAN, EdgeStyle.ManhattanConnector);
  StyleRegistry.putValue(EDGESTYLE.ORTHOGONAL, EdgeStyle.OrthConnector);
  StyleRegistry.putValue(EDGESTYLE.SEGMENT, EdgeStyle.SegmentConnector);
  StyleRegistry.putValue(EDGESTYLE.SIDETOSIDE, EdgeStyle.SideToSide);
  StyleRegistry.putValue(EDGESTYLE.TOPTOBOTTOM, EdgeStyle.TopToBottom);
};

const registerPerimeters = (): void => {
  StyleRegistry.putValue(PERIMETER.ELLIPSE, Perimeter.EllipsePerimeter);
  StyleRegistry.putValue(PERIMETER.HEXAGON, Perimeter.HexagonPerimeter);
  StyleRegistry.putValue(PERIMETER.RECTANGLE, Perimeter.RectanglePerimeter);
  StyleRegistry.putValue(PERIMETER.RHOMBUS, Perimeter.RhombusPerimeter);
  StyleRegistry.putValue(PERIMETER.TRIANGLE, Perimeter.TrianglePerimeter);
};
