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

import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';
import {
  EdgeMarkerRegistry,
  EdgeStyleRegistry,
  PerimeterRegistry,
  registerDefaultStyleElements,
  ShapeRegistry,
  unregisterAllEdgeMarkers,
  unregisterAllEdgeStylesAndPerimeters,
  unregisterAllShapes,
} from '../../src';

const unregisterAll = (): void => {
  unregisterAllEdgeMarkers();
  unregisterAllEdgeStylesAndPerimeters();
  unregisterAllShapes();
};

beforeEach(unregisterAll);
afterEach(unregisterAll);

describe('registerDefaultStyleElements', () => {
  test.each([
    ['edge marker', EdgeMarkerRegistry, 'classic'],
    ['edge style', EdgeStyleRegistry, 'orthogonalEdgeStyle'],
    ['perimeter', PerimeterRegistry, 'ellipsePerimeter'],
    ['shape', ShapeRegistry, 'ellipse'],
  ])('registers the builtin %s elements', (_name, registry, key) => {
    expect(registry.get(key)).toBeNull();

    registerDefaultStyleElements();

    expect(registry.get(key)).not.toBeNull();
  });

  test('is idempotent', () => {
    registerDefaultStyleElements();
    const shape = ShapeRegistry.get('ellipse');

    registerDefaultStyleElements();

    expect(ShapeRegistry.get('ellipse')).toBe(shape);
  });
});
