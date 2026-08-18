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

import { afterAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
  BaseGraph,
  CellState,
  EdgeStyle,
  type EdgeStyleFunction,
  type GraphPlugin,
  registerDefaultEdgeStyles,
  unregisterAllEdgeStyles,
} from '../../src';
import { describeNoGlobalStateForMixinProperties } from './no-global-state-for-mixin-properties';

const customEdgeStyle: EdgeStyleFunction = () => {
  // do nothing, we just need a custom implementation that is not registered by default
};

beforeEach(() => {
  unregisterAllEdgeStyles();
});
afterAll(() => {
  unregisterAllEdgeStyles();
});

describe('isOrthogonal', () => {
  test('Style of the CellState, orthogonal: true', () => {
    const graph = new BaseGraph();
    const cellState = new CellState(graph.view, null, { orthogonal: true });
    expect(graph.isOrthogonal(cellState)).toBeTruthy();
  });

  test('No style in the CellState', () => {
    const graph = new BaseGraph();
    expect(graph.isOrthogonal(new CellState())).toBeFalsy();
  });

  test.each([undefined, null])('Style of the CellState, orthogonal: %s', (orthogonal) => {
    const graph = new BaseGraph();
    const cellState = new CellState(graph.view, null, { orthogonal });
    expect(graph.isOrthogonal(cellState)).toBeFalsy();
  });

  describe('Default builtin styles registered', () => {
    beforeEach(() => {
      registerDefaultEdgeStyles();
    });

    test.each([
      ['EntityRelation', EdgeStyle.EntityRelation],
      ['ElbowConnector', EdgeStyle.ElbowConnector],
      ['ManhattanConnector', EdgeStyle.ManhattanConnector],
      ['OrthogonalConnector', EdgeStyle.OrthConnector],
      ['SegmentConnector', EdgeStyle.SegmentConnector],
      ['SideToSide', EdgeStyle.SideToSide],
      ['TopToBottom', EdgeStyle.TopToBottom],
    ])('Style of the CellState, edgeStyle: %s', (_name, edgeStyle) => {
      const graph = new BaseGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle });
      expect(graph.isOrthogonal(cellState)).toBeTruthy();
    });

    test.each([
      ['custom', customEdgeStyle],
      ['Loop', EdgeStyle.Loop],
      ['null', null],
      ['undefined', undefined],
    ])('Style of the CellState, edgeStyle: %s', (_name, edgeStyle) => {
      const graph = new BaseGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle });
      expect(graph.isOrthogonal(cellState)).toBeFalsy();
    });
  });

  test.each([
    ['custom', customEdgeStyle],
    ['EntityRelation', EdgeStyle.EntityRelation],
    ['ElbowConnector', EdgeStyle.ElbowConnector],
    ['Loop', EdgeStyle.Loop],
    ['ManhattanConnector', EdgeStyle.ManhattanConnector],
    ['OrthogonalConnector', EdgeStyle.OrthConnector],
    ['SegmentConnector', EdgeStyle.SegmentConnector],
    ['SideToSide', EdgeStyle.SideToSide],
    ['TopToBottom', EdgeStyle.TopToBottom],
    ['null', null],
    ['undefined', undefined],
  ])(
    'Default builtin styles NOT registered - Style of the CellState, edgeStyle: %s',
    (_name, edgeStyle) => {
      const graph = new BaseGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle });
      expect(graph.isOrthogonal(cellState)).toBeFalsy();
    }
  );
});

describe('destroy', () => {
  test('calls onDestroy on registered plugins', () => {
    const onDestroyMock = jest.fn();

    class CustomPlugin implements GraphPlugin {
      static readonly pluginId = 'CustomPlugin';
      onDestroy = onDestroyMock;
    }

    const graph = new BaseGraph({
      plugins: [CustomPlugin],
    });

    graph.destroy();

    expect(onDestroyMock).toHaveBeenCalledTimes(1);
  });

  test('nulls container reference', () => {
    const graph = new BaseGraph({});
    expect(graph.container).not.toBeNull();

    graph.destroy();

    expect(graph.container).toBeNull();
  });

  test('clears eventListeners', () => {
    const graph = new BaseGraph({});
    graph.addListener('testEvent', () => {});
    expect(graph.eventListeners.length).toBeGreaterThan(0);

    graph.destroy();

    expect(graph.eventListeners).toHaveLength(0);
  });
});

describeNoGlobalStateForMixinProperties(() => new BaseGraph());
