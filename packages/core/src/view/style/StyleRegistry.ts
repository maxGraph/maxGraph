/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import {
  EDGESTYLE_ELBOW,
  EDGESTYLE_ENTITY_RELATION,
  EDGESTYLE_LOOP,
  EDGESTYLE_ORTHOGONAL,
  EDGESTYLE_SEGMENT,
  EDGESTYLE_SIDETOSIDE,
  EDGESTYLE_TOPTOBOTTOM,
  PERIMETER_ELLIPSE,
  PERIMETER_HEXAGON,
  PERIMETER_RECTANGLE,
  PERIMETER_RHOMBUS,
  PERIMETER_TRIANGLE,
} from '../../util/Constants';
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
   * Variable: values
   *
   * Maps from strings to objects.
   */
  static values = <any>{};

  /**
   * Function: putValue
   *
   * Puts the given object into the registry under the given name.
   */
  static putValue(name: string, obj: any): void {
    StyleRegistry.values[name] = obj;
  }

  /**
   * Function: getValue
   *
   * Returns the value associated with the given name.
   */
  static getValue(name: string): any {
    return StyleRegistry.values[name];
  }

  /**
   * Function: getName
   *
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

StyleRegistry.putValue(EDGESTYLE_ELBOW, EdgeStyle.ElbowConnector);
StyleRegistry.putValue(EDGESTYLE_ENTITY_RELATION, EdgeStyle.EntityRelation);
StyleRegistry.putValue(EDGESTYLE_LOOP, EdgeStyle.Loop);
StyleRegistry.putValue(EDGESTYLE_SIDETOSIDE, EdgeStyle.SideToSide);
StyleRegistry.putValue(EDGESTYLE_TOPTOBOTTOM, EdgeStyle.TopToBottom);
StyleRegistry.putValue(EDGESTYLE_ORTHOGONAL, EdgeStyle.OrthConnector);
StyleRegistry.putValue(EDGESTYLE_SEGMENT, EdgeStyle.SegmentConnector);

StyleRegistry.putValue(PERIMETER_ELLIPSE, Perimeter.EllipsePerimeter);
StyleRegistry.putValue(PERIMETER_RECTANGLE, Perimeter.RectanglePerimeter);
StyleRegistry.putValue(PERIMETER_RHOMBUS, Perimeter.RhombusPerimeter);
StyleRegistry.putValue(PERIMETER_TRIANGLE, Perimeter.TrianglePerimeter);
StyleRegistry.putValue(PERIMETER_HEXAGON, Perimeter.HexagonPerimeter);

export default StyleRegistry;
