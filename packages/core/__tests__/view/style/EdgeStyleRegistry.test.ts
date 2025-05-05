/*
Copyright 2025-present The maxGraph project Contributors

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

import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import {
  EdgeStyle,
  type EdgeStyleFunction,
  EdgeStyleRegistry,
  unregisterAllEdgeStyles,
} from '../../../src';

// WARNING the tests here involved global state, so they must not be run in parallel of other tests to prevent side effects
describe('registry', () => {
  // Prevents side effects between tests
  beforeEach(() => {
    unregisterAllEdgeStyles();
  });
  afterAll(() => {
    unregisterAllEdgeStyles();
  });

  const customEdgeStyle: EdgeStyleFunction = () => {
    // empty on purpose, we only need the reference to this function in the tests
  };

  test('verify registration', () => {
    EdgeStyleRegistry.add('custom', customEdgeStyle, {
      isOrthogonal: true,
      handlerKind: 'customHandler',
    });

    expect(EdgeStyleRegistry.get('custom')).toBe(customEdgeStyle);
    expect(EdgeStyleRegistry.getHandlerKind(customEdgeStyle)).toEqual('customHandler');
    expect(EdgeStyleRegistry.isOrthogonal(customEdgeStyle)).toBeTruthy();
  });

  test('verify registration - no meta data', () => {
    EdgeStyleRegistry.add('custom', customEdgeStyle);

    expect(EdgeStyleRegistry.get('custom')).toBe(customEdgeStyle);
    expect(EdgeStyleRegistry.getHandlerKind(customEdgeStyle)).toEqual('default');
    expect(EdgeStyleRegistry.isOrthogonal(customEdgeStyle)).toBeFalsy();
  });

  test('clear', () => {
    EdgeStyleRegistry.add('custom', customEdgeStyle, {
      isOrthogonal: false,
      handlerKind: 'customHandler',
    });
    expect(EdgeStyleRegistry.get('custom')).toBeDefined();

    EdgeStyleRegistry.clear();

    expect(EdgeStyleRegistry.get('custom')).toBeNull();
    // the edge style function is no longer registered, so returns default values
    expect(EdgeStyleRegistry.getHandlerKind(customEdgeStyle)).toEqual('default');
    expect(EdgeStyleRegistry.isOrthogonal(customEdgeStyle)).toBeFalsy();
  });

  describe('getName', () => {
    test('no element registered', () => {
      expect(EdgeStyleRegistry.getName(customEdgeStyle)).toBeNull();
      expect(EdgeStyleRegistry.getName(null)).toBeNull();
    });

    test('elements registered', () => {
      EdgeStyleRegistry.add('element1', EdgeStyle.OrthConnector);
      EdgeStyleRegistry.add('element2', customEdgeStyle);
      EdgeStyleRegistry.add('match', EdgeStyle.SegmentConnector);
      EdgeStyleRegistry.add('element3', EdgeStyle.ManhattanConnector);

      expect(EdgeStyleRegistry.getName(EdgeStyle.SegmentConnector)).toBe('match');
      expect(EdgeStyleRegistry.getName(null)).toBeNull();
    });
  });
});
