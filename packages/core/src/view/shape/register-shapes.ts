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

import { ShapeRegistry } from './ShapeRegistry';
import type { ShapeConstructor, ShapeValue } from '../../types';
import RectangleShape from './node/RectangleShape';
import EllipseShape from './node/EllipseShape';
import RhombusShape from './node/RhombusShape';
import CylinderShape from './node/CylinderShape';
import ConnectorShape from './edge/ConnectorShape';
import ActorShape from './node/ActorShape';
import TriangleShape from './node/TriangleShape';
import HexagonShape from './node/HexagonShape';
import CloudShape from './node/CloudShape';
import LineShape from './edge/LineShape';
import ArrowShape from './edge/ArrowShape';
import ArrowConnectorShape from './edge/ArrowConnectorShape';
import DoubleEllipseShape from './node/DoubleEllipseShape';
import SwimlaneShape from './node/SwimlaneShape';
import ImageShape from './node/ImageShape';
import LabelShape from './node/LabelShape';

let isDefaultElementsRegistered = false;

/**
 * Register default builtin shapes into {@link CellRenderer}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export function registerDefaultShapes() {
  if (!isDefaultElementsRegistered) {
    const shapesToRegister: [ShapeValue, ShapeConstructor][] = [
      ['actor', ActorShape],
      ['arrow', ArrowShape],
      ['arrowConnector', ArrowConnectorShape],
      ['cloud', CloudShape],
      ['connector', ConnectorShape],
      ['cylinder', CylinderShape],
      ['doubleEllipse', DoubleEllipseShape],
      ['ellipse', EllipseShape],
      ['hexagon', HexagonShape],
      ['image', ImageShape],
      ['label', LabelShape],
      ['line', LineShape],
      ['rectangle', RectangleShape],
      ['rhombus', RhombusShape],
      ['swimlane', SwimlaneShape],
      ['triangle', TriangleShape],
    ];
    for (const [shapeName, shapeClass] of shapesToRegister) {
      ShapeRegistry.add(shapeName, shapeClass);
    }

    isDefaultElementsRegistered = true;
  }
}

/**
 * Unregister all shapes from {@link ShapeRegistry}.
 *
 * @category Configuration
 * @category Style
 * @since 0.18.0
 */
export function unregisterAllShapes() {
  ShapeRegistry.clear();
  isDefaultElementsRegistered = false;
}
