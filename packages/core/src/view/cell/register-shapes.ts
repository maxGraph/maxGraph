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

import CellRenderer from './CellRenderer';
import type { ShapeConstructor } from '../../types';
import RectangleShape from '../geometry/node/RectangleShape';
import EllipseShape from '../geometry/node/EllipseShape';
import RhombusShape from '../geometry/node/RhombusShape';
import CylinderShape from '../geometry/node/CylinderShape';
import ConnectorShape from '../geometry/edge/ConnectorShape';
import ActorShape from '../geometry/node/ActorShape';
import TriangleShape from '../geometry/node/TriangleShape';
import HexagonShape from '../geometry/node/HexagonShape';
import CloudShape from '../geometry/node/CloudShape';
import LineShape from '../geometry/edge/LineShape';
import ArrowShape from '../geometry/edge/ArrowShape';
import ArrowConnectorShape from '../geometry/edge/ArrowConnectorShape';
import DoubleEllipseShape from '../geometry/node/DoubleEllipseShape';
import SwimlaneShape from '../geometry/node/SwimlaneShape';
import ImageShape from '../geometry/node/ImageShape';
import LabelShape from '../geometry/node/LabelShape';
import { SHAPE } from '../../util/Constants';

let isDefaultElementsRegistered = false;

/**
 * Add default shapes into `CellRenderer` shapes.
 *
 * @private
 * @category Configuration
 * @category Style
 */
export function registerDefaultShapes() {
  if (!isDefaultElementsRegistered) {
    const shapesToRegister: [string, ShapeConstructor][] = [
      [SHAPE.ACTOR, ActorShape],
      [SHAPE.ARROW, ArrowShape],
      [SHAPE.ARROW_CONNECTOR, ArrowConnectorShape],
      [SHAPE.CLOUD, CloudShape],
      [SHAPE.CONNECTOR, ConnectorShape],
      [SHAPE.CYLINDER, CylinderShape],
      [SHAPE.DOUBLE_ELLIPSE, DoubleEllipseShape],
      [SHAPE.ELLIPSE, EllipseShape],
      [SHAPE.HEXAGON, HexagonShape],
      [SHAPE.IMAGE, ImageShape],
      [SHAPE.LABEL, LabelShape],
      [SHAPE.LINE, LineShape],
      [SHAPE.RECTANGLE, RectangleShape],
      [SHAPE.RHOMBUS, RhombusShape],
      [SHAPE.SWIMLANE, SwimlaneShape],
      [SHAPE.TRIANGLE, TriangleShape],
    ];
    for (const [shapeName, shapeClass] of shapesToRegister) {
      CellRenderer.registerShape(shapeName, shapeClass);
    }

    isDefaultElementsRegistered = true;
  }
}
