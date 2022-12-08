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

import { EDGESTYLE, PERIMETER } from '../../util/Constants';
import EdgeStyle from './EdgeStyle';
import Perimeter from './Perimeter';

/**
 * @class StyleRegistry
 *
 * Singleton class that acts as a global converter from string to object values
 * in a style. This is currently only used to perimeters and edge styles.
 */
class StyleRegistry {
  /**
   * Maps from strings to objects.
   */
  static values = <any>{};

  /**
   * Puts the given object into the registry under the given name.
   */
  static putValue(name: string, obj: any): void {
    StyleRegistry.values[name] = obj;
  }

  /**
   * Returns the value associated with the given name.
   */
  static getValue(name: string): any {
    return StyleRegistry.values[name];
  }

  /**
   * Returns the name for the given value.
   */
  static getName(value: any): string | null {
    for (const key in StyleRegistry.values) {
      if (StyleRegistry.values[key] === value) {
        return key;
      }
    }
    return null;
  }
}

StyleRegistry.putValue(EDGESTYLE.ELBOW, EdgeStyle.ElbowConnector);
StyleRegistry.putValue(EDGESTYLE.ENTITY_RELATION, EdgeStyle.EntityRelation);
StyleRegistry.putValue(EDGESTYLE.LOOP, EdgeStyle.Loop);
StyleRegistry.putValue(EDGESTYLE.SIDETOSIDE, EdgeStyle.SideToSide);
StyleRegistry.putValue(EDGESTYLE.TOPTOBOTTOM, EdgeStyle.TopToBottom);
StyleRegistry.putValue(EDGESTYLE.ORTHOGONAL, EdgeStyle.OrthConnector);
StyleRegistry.putValue(EDGESTYLE.SEGMENT, EdgeStyle.SegmentConnector);

StyleRegistry.putValue(PERIMETER.ELLIPSE, Perimeter.EllipsePerimeter);
StyleRegistry.putValue(PERIMETER.RECTANGLE, Perimeter.RectanglePerimeter);
StyleRegistry.putValue(PERIMETER.RHOMBUS, Perimeter.RhombusPerimeter);
StyleRegistry.putValue(PERIMETER.TRIANGLE, Perimeter.TrianglePerimeter);
StyleRegistry.putValue(PERIMETER.HEXAGON, Perimeter.HexagonPerimeter);

export default StyleRegistry;
