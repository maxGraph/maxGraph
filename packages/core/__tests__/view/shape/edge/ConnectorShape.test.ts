/*
Copyright 2026-present The maxGraph project Contributors

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

import { describe, expect, test } from '@jest/globals';
import ConnectorShape from '../../../../src/view/shape/edge/ConnectorShape';
import Rectangle from '../../../../src/view/geometry/Rectangle';
import { NONE } from '../../../../src/util/Constants';
import type { CellStateStyle } from '../../../../src/types';

describe('augmentBoundingBox', () => {
  // strokeWidth = 0 and scale = 1 make super.augmentBoundingBox a no-op (grow(0)),
  // so the rectangle only reflects the marker-size contribution of ConnectorShape.
  const newShape = (style: CellStateStyle): ConnectorShape => {
    const shape = new ConnectorShape([], NONE, 0);
    shape.scale = 1;
    shape.strokeWidth = 0;
    shape.style = style;
    return shape;
  };

  // An absent arrow must be treated as NONE (mxGraph getValue default), so it must not
  // grow the bounding box. The reported regression treated `undefined` as "present".
  test.each<[string, CellStateStyle, number]>([
    // Reported scenario: startSize set unconditionally, but only endArrow is set.
    // startArrow is absent => only the end branch applies => max(0, 12) + 1 = 13.
    ['only end arrow set', { startSize: 12, endArrow: 'classic', endSize: 12 }, 13],
    // Symmetric scenario: endArrow is absent => only the start branch applies => 12 + 1 = 13.
    ['only start arrow set', { startArrow: 'classic', startSize: 12, endSize: 12 }, 13],
    // No arrow at all => no growth.
    ['no arrow set', { startSize: 12, endSize: 12 }, 0],
    // Explicit none on both sides => no growth.
    [
      'explicit none on both sides',
      { startArrow: NONE, startSize: 12, endArrow: NONE, endSize: 12 },
      0,
    ],
    // Both arrows set => start branch sets 13, end branch applies max(13, 12) + 1 = 14.
    [
      'both arrows set',
      { startArrow: 'classic', startSize: 12, endArrow: 'classic', endSize: 12 },
      14,
    ],
  ])('%s', (_desc, style, expectedGrow) => {
    const shape = newShape(style);
    const bbox = new Rectangle(0, 0, 100, 50);
    shape.augmentBoundingBox(bbox);

    const expected = new Rectangle(0, 0, 100, 50);
    expected.grow(expectedGrow);
    expect(bbox).toEqual(expected);
  });
});
