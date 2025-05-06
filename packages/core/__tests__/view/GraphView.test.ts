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
  BaseGraph,
  CellState,
  EdgeStyle,
  EdgeStyleRegistry,
  GraphView,
  Perimeter,
  PerimeterRegistry,
  unregisterAllEdgeStyles,
  unregisterAllPerimeters,
} from '../../src';

describe('getEdgeStyle ', () => {
  describe('isLoopStyleEnabled returns true', () => {
    // use manual double instead of jest mock as this is a very simple use case, and we don't want to do any asserts on the fake method
    class GraphViewLoopStyleEnabled extends GraphView {
      override isLoopStyleEnabled(): boolean {
        return true;
      }
    }

    const createGraph = () =>
      new BaseGraph({ view: (graph) => new GraphViewLoopStyleEnabled(graph) });

    test('no loopStyle in CellStateStyle', () => {
      const graph = createGraph();
      const cellState = new CellState(graph.view, null, {});
      expect(graph.view.getEdgeStyle(cellState)).toBe(EdgeStyle.Loop); // default defined in AbstractGraph
    });

    test('loopStyle in CellStateStyle', () => {
      const graph = createGraph();
      const cellState = new CellState(graph.view, null, {
        loopStyle: EdgeStyle.ElbowConnector,
      });
      expect(graph.view.getEdgeStyle(cellState)).toBe(EdgeStyle.ElbowConnector);
    });
  });

  describe('isLoopStyleEnabled returns false', () => {
    // Prevents side effects between tests
    beforeEach(() => {
      unregisterAllEdgeStyles();
    });
    afterAll(() => {
      unregisterAllEdgeStyles();
    });

    // use manual double instead of jest mock as this is a very simple use case, and we don't want to do any asserts on the fake method
    class GraphViewLoopStyleDisabled extends GraphView {
      override isLoopStyleEnabled(): boolean {
        return false;
      }
    }

    const createGraph = () =>
      new BaseGraph({ view: (graph) => new GraphViewLoopStyleDisabled(graph) });

    test('no edgeStyle in CellStateStyle, no element matching in the registry', () => {
      const graph = createGraph();
      const cellState = new CellState(graph.view, null, {});
      expect(graph.view.getEdgeStyle(cellState)).toBeNull();
    });

    test('edgeStyle in CellStateStyle is a string, no element matching in the registry', () => {
      const graph = createGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle: 'customEdgeStyle' });
      expect(graph.view.getEdgeStyle(cellState)).toBeNull();
    });

    test('edgeStyle in CellStateStyle is a string, element matching in the registry', () => {
      const connector = EdgeStyle.OrthConnector;
      EdgeStyleRegistry.add('customEdgeStyle', connector);

      const graph = createGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle: 'customEdgeStyle' });
      expect(graph.view.getEdgeStyle(cellState)).toBe(connector);
    });

    test('edgeStyle in CellStateStyle is a string, element matching in the registry BUT CellStateStyle.noEdgeStyle is true', () => {
      const connector = EdgeStyle.OrthConnector;
      EdgeStyleRegistry.add('customEdgeStyle', connector);

      const graph = createGraph();
      const cellState = new CellState(graph.view, null, {
        edgeStyle: 'customEdgeStyle',
        noEdgeStyle: true,
      });
      expect(graph.view.getEdgeStyle(cellState)).toBeNull();
    });

    test('edgeStyle in CellStateStyle is a function', () => {
      const connector = EdgeStyle.OrthConnector;

      const graph = createGraph();
      const cellState = new CellState(graph.view, null, { edgeStyle: connector });
      expect(graph.view.getEdgeStyle(cellState)).toBe(connector);
    });
  });
});

describe('getPerimeterFunction', () => {
  // Prevents side effects between tests
  beforeEach(() => {
    unregisterAllPerimeters();
  });
  afterAll(() => {
    unregisterAllPerimeters();
  });

  test('no perimeter in CellStateStyle, no element matching in the registry', () => {
    const graph = new BaseGraph();
    const cellState = new CellState(graph.view, null, {});
    expect(graph.view.getPerimeterFunction(cellState)).toBeNull();
  });

  test('perimeter in CellStateStyle is a string, no element matching in the registry', () => {
    const graph = new BaseGraph();
    const cellState = new CellState(graph.view, null, { perimeter: 'customPerimeter' });
    expect(graph.view.getPerimeterFunction(cellState)).toBeNull();
  });

  test('perimeter in CellStateStyle is a string, element matching in the registry', () => {
    const perimeter = Perimeter.HexagonPerimeter;
    PerimeterRegistry.add('customPerimeter', perimeter);

    const graph = new BaseGraph();
    const cellState = new CellState(graph.view, null, { perimeter: 'customPerimeter' });
    expect(graph.view.getPerimeterFunction(cellState)).toBe(perimeter);
  });

  test('perimeter in CellStateStyle is a function', () => {
    const perimeter = Perimeter.HexagonPerimeter;

    const graph = new BaseGraph();
    const cellState = new CellState(graph.view, null, { perimeter });
    expect(graph.view.getPerimeterFunction(cellState)).toBe(perimeter);
  });
});
