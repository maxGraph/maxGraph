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

import type Codec from '../../Codec';
import ObjectCodec from '../../ObjectCodec';
import Geometry from '../../../view/geometry/Geometry';
import Point from '../../../view/geometry/Point';

export class mxGeometryCodec extends ObjectCodec {
  getName(): string {
    return 'mxGeometry';
  }

  constructor() {
    super(new Geometry());
  }

  afterDecode(dec: Codec, node: Element | null, obj?: any): any {
    // Convert points to the right form
    // input: [ { x: 420, y: 60 }, ... ]
    // output: [ Point { _x: 420, _y: 60 }, ... ]
    //
    // in mxGraph XML, the points are modeled as Object, so it is easier to convert the values to Point objects after the whole decoding of the geometry
    // <Array as="points">
    //   <Object x="420" y="60"/>
    // </Array>

    const originalPoints = (obj as Geometry).points;
    if (originalPoints) {
      const points: Array<Point> = [];
      for (const pointInput of originalPoints) {
        const rawPoint = pointInput as { x: number; y: number };
        points.push(new Point(rawPoint.x, rawPoint.y));
      }
      (obj as Geometry).points = points;
    }

    return obj;
  }
}
