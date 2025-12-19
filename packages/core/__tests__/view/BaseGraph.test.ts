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
  AbstractGraph,
  BaseGraph,
  Cell,
  CellState,
  EdgeHandler,
  EdgeSegmentHandler,
  EdgeStyle,
  type EdgeStyleFunction,
  EdgeStyleRegistry,
  ElbowEdgeHandler,
  ImageBundle,
  Multiplicity,
  Point,
  Rectangle,
  RectangleShape,
  registerDefaultEdgeStyles,
  unregisterAllEdgeStyles,
  VertexHandler,
} from '../../src';

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

const createCellState = (graph: AbstractGraph, isEdge: boolean): CellState => {
  const cell = new Cell();
  cell.setEdge(isEdge);
  cell.setVertex(!isEdge);
  const cellState = new CellState(graph.view, cell, {});
  cellState.absolutePoints = [new Point(0, 0)];
  cellState.shape = new RectangleShape(new Rectangle(), 'green', 'blue');
  return cellState;
};

const createCellStateOfEdge = (graph: AbstractGraph): CellState =>
  createCellState(graph, true);

describe('createEdgeHandler', () => {
  describe('Default builtin styles registered', () => {
    beforeEach(() => {
      registerDefaultEdgeStyles();
    });

    test.each([
      ['ElbowConnector', EdgeStyle.ElbowConnector],
      ['Loop', EdgeStyle.Loop],
      ['SideToSide', EdgeStyle.SideToSide],
      ['TopToBottom', EdgeStyle.TopToBottom],
    ])('Expect ElbowEdgeHandler for edgeStyle: %s', (_name, edgeStyle) => {
      const graph = new BaseGraph();
      const cellState = createCellStateOfEdge(graph);
      expect(graph.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        ElbowEdgeHandler
      );
    });

    test.each([
      ['ManhattanConnector', EdgeStyle.ManhattanConnector],
      ['OrthogonalConnector', EdgeStyle.OrthConnector],
      ['SegmentConnector', EdgeStyle.SegmentConnector],
    ])('Expect EdgeSegmentHandler for edgeStyle: %s', (_name, edgeStyle) => {
      const graph = new BaseGraph();
      const cellState = createCellStateOfEdge(graph);
      expect(graph.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        EdgeSegmentHandler
      );
    });

    test.each([
      ['custom', customEdgeStyle],
      ['EntityRelation', EdgeStyle.EntityRelation],
      ['null', null],
    ])('Expect EdgeHandler for edgeStyle: %s', (_name, edgeStyle) => {
      const graph = new BaseGraph();
      const cellState = createCellStateOfEdge(graph);
      expectExactInstanceOfEdgeHandler(graph.createEdgeHandler(cellState, edgeStyle));
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
  ])(
    'Default builtin styles NOT registered - Expect EdgeHandler for edgeStyle: %s',
    (_name, edgeStyle) => {
      const graph = new BaseGraph();
      const cellState = createCellStateOfEdge(graph);
      expectExactInstanceOfEdgeHandler(graph.createEdgeHandler(cellState, edgeStyle));
    }
  );

  describe('Custom edge handler', () => {
    test('default', () => {
      class CustomEdgeHandler extends EdgeHandler {}
      const edgeStyle = customEdgeStyle;

      const graph = new BaseGraph();
      graph.createEdgeHandlerInstance = (state) => {
        return new CustomEdgeHandler(state);
      };

      const cellState = createCellStateOfEdge(graph);
      expect(graph.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        CustomEdgeHandler
      );
    });

    test('elbow', () => {
      class CustomEdgeHandler extends ElbowEdgeHandler {}
      const edgeStyle = customEdgeStyle;
      EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind: 'elbow' });

      const graph = new BaseGraph();
      graph.createElbowEdgeHandler = (state) => {
        return new CustomEdgeHandler(state);
      };

      const cellState = createCellStateOfEdge(graph);
      expect(graph.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        CustomEdgeHandler
      );
    });

    test('segment', () => {
      class CustomEdgeHandler extends EdgeSegmentHandler {}
      const edgeStyle = customEdgeStyle;
      EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind: 'segment' });

      const graph = new BaseGraph();
      graph.createEdgeSegmentHandler = (state) => {
        return new CustomEdgeHandler(state);
      };

      const cellState = createCellStateOfEdge(graph);
      expect(graph.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        CustomEdgeHandler
      );
    });
  });
});

describe('createHandler', () => {
  test('Expect VertexHandler', () => {
    const graph = new BaseGraph();
    const cellState = createCellState(graph, false);
    expect(graph.createHandler(cellState)).toBeInstanceOf(VertexHandler);
  });

  test('Expect EdgeHandler', () => {
    const graph = new BaseGraph();
    const cellState = createCellStateOfEdge(graph);
    expectExactInstanceOfEdgeHandler(<EdgeHandler>graph.createHandler(cellState));
  });
});

function expectExactInstanceOfEdgeHandler(handler: EdgeHandler): void {
  expect(handler).toBeInstanceOf(EdgeHandler);
  expect(handler).not.toBeInstanceOf(EdgeSegmentHandler);
  expect(handler).not.toBeInstanceOf(ElbowEdgeHandler);
}

// For "complex" properties, for example: arrays or object.
describe('Expect no global state for properties coming from mixins', () => {
  test('alternateEdgeStyle', () => {
    const graph1 = new BaseGraph();
    const graph2 = new BaseGraph();

    graph1.alternateEdgeStyle.arcSize = 10;
    graph1.alternateEdgeStyle.fillColor = 'red';
    expect(graph1.alternateEdgeStyle).not.toEqual(graph2.alternateEdgeStyle);
    expect(graph1.alternateEdgeStyle).not.toBe(graph2.alternateEdgeStyle);
  });

  test('cells', () => {
    const graph1 = new BaseGraph();
    const graph2 = new BaseGraph();

    graph1.cells.push(new Cell());
    expect(graph2.cells).toStrictEqual([]);
    expect(graph1.cells).not.toBe(graph2.cells);
  });

  test('imageBundles', () => {
    const graph1 = new BaseGraph();
    const graph2 = new BaseGraph();

    graph1.imageBundles.push(new ImageBundle());
    expect(graph2.imageBundles).toStrictEqual([]);
    expect(graph1.imageBundles).not.toBe(graph2.imageBundles);
  });

  test('mouseListeners', () => {
    const graph1 = new BaseGraph();
    expect(graph1.mouseListeners).toHaveLength(1);
    const graph2 = new BaseGraph();
    expect(graph2.mouseListeners).toHaveLength(1);

    graph1.mouseListeners.push({
      mouseDown: () => {},
      mouseMove: () => {},
      mouseUp: () => {},
    });
    expect(graph2.mouseListeners).toHaveLength(1);
    expect(graph1.mouseListeners).toHaveLength(2);
    expect(graph1.mouseListeners).not.toBe(graph2.mouseListeners);
  });

  test('multiplicities', () => {
    const graph1 = new BaseGraph();
    const graph2 = new BaseGraph();

    graph1.multiplicities.push(
      new Multiplicity(
        true,
        'rectangle',
        null,
        null,
        0,
        2,
        ['circle'],
        'Only 2 targets allowed',
        'Only circle targets allowed'
      )
    );
    expect(graph2.multiplicities).toStrictEqual([]);
    expect(graph1.multiplicities).not.toBe(graph2.multiplicities);
  });

  test('options', () => {
    const graph1 = new BaseGraph();
    const graph2 = new BaseGraph();

    graph1.options.foldingEnabled = false;
    expect(graph1.options).not.toBe(graph2.options);
  });
});
