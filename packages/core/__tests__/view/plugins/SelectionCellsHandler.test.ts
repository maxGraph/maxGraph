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
  Point,
  Rectangle,
  RectangleShape,
  registerDefaultEdgeStyles,
  SelectionCellsHandler,
  unregisterAllEdgeStyles,
  VertexHandler,
} from '../../../src';

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

const createCellStateOfVertex = (graph: AbstractGraph): CellState =>
  createCellState(graph, false);

// access to the protected method
class SelectionCellsHandlerForTest extends SelectionCellsHandler {
  constructor(graph: AbstractGraph) {
    super(graph);
  }

  override createHandler(state: CellState) {
    return super.createHandler(state);
  }

  override createEdgeHandler(state: CellState, edgeStyle: EdgeStyleFunction | null) {
    return super.createEdgeHandler(state, edgeStyle);
  }
}

const createNewGraph = () => new BaseGraph({ plugins: [SelectionCellsHandler] });

const getPlugin = (graph: BaseGraph) =>
  graph.getPlugin<SelectionCellsHandlerForTest>('SelectionCellsHandler');

const expectExactInstanceOfEdgeHandler = (handler: EdgeHandler): void => {
  expect(handler).toBeInstanceOf(EdgeHandler);
  expect(handler).not.toBeInstanceOf(EdgeSegmentHandler);
  expect(handler).not.toBeInstanceOf(ElbowEdgeHandler);
};

describe('createHandler', () => {
  describe('vertex', () => {
    test('Expect VertexHandler', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);

      const cellState = createCellStateOfVertex(graph);
      expect(plugin.createHandler(cellState)).toBeInstanceOf(VertexHandler);
    });

    test('Expect custom VertexHandler', () => {
      class CustomVertexHandler extends VertexHandler {}

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.configureVertexHandler((state) => {
        return new CustomVertexHandler(state);
      });

      const cellState = createCellStateOfVertex(graph);
      expect(plugin.createHandler(cellState)).toBeInstanceOf(CustomVertexHandler);
    });
  });

  test('Expect EdgeHandler', () => {
    const graph = createNewGraph();
    const plugin = getPlugin(graph);

    const cellState = createCellStateOfEdge(graph);
    expectExactInstanceOfEdgeHandler(<EdgeHandler>plugin.createHandler(cellState));
  });
});

describe('createEdgeHandler', () => {
  beforeEach(() => {
    unregisterAllEdgeStyles();
  });
  afterAll(() => {
    unregisterAllEdgeStyles();
  });

  const customEdgeStyle: EdgeStyleFunction = () => {
    // do nothing, we just need a custom implementation that is not registered by default
  };

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
      const graph = createNewGraph();
      const plugin = getPlugin(graph);

      const cellState = createCellStateOfEdge(graph);
      expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        ElbowEdgeHandler
      );
    });

    test.each([
      ['ManhattanConnector', EdgeStyle.ManhattanConnector],
      ['OrthogonalConnector', EdgeStyle.OrthConnector],
      ['SegmentConnector', EdgeStyle.SegmentConnector],
    ])('Expect EdgeSegmentHandler for edgeStyle: %s', (_name, edgeStyle) => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);

      const cellState = createCellStateOfEdge(graph);
      expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        EdgeSegmentHandler
      );
    });

    test.each([
      ['custom', customEdgeStyle],
      ['EntityRelation', EdgeStyle.EntityRelation],
      ['null', null],
    ])('Expect EdgeHandler for edgeStyle: %s', (_name, edgeStyle) => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);

      const cellState = createCellStateOfEdge(graph);
      expectExactInstanceOfEdgeHandler(plugin.createEdgeHandler(cellState, edgeStyle));
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
      const graph = createNewGraph();
      const plugin = getPlugin(graph);

      const cellState = createCellStateOfEdge(graph);
      expectExactInstanceOfEdgeHandler(plugin.createEdgeHandler(cellState, edgeStyle));
    }
  );

  describe('Register custom edge handler', () => {
    test('default', () => {
      class CustomEdgeHandler extends EdgeHandler {}
      const edgeStyle = customEdgeStyle;

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.configureEdgeHandler('default', (state) => {
        return new CustomEdgeHandler(state);
      });

      const cellState = createCellStateOfEdge(graph);
      expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        CustomEdgeHandler
      );
    });

    test('elbow', () => {
      class CustomEdgeHandler extends ElbowEdgeHandler {}
      const edgeStyle = customEdgeStyle;
      EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind: 'elbow' });

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.configureEdgeHandler('elbow', (state) => {
        return new CustomEdgeHandler(state);
      });

      const cellState = createCellStateOfEdge(graph);
      expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        CustomEdgeHandler
      );
    });

    test('segment', () => {
      class CustomEdgeHandler extends EdgeSegmentHandler {}
      const edgeStyle = customEdgeStyle;
      EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind: 'segment' });

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.configureEdgeHandler('segment', (state) => {
        return new CustomEdgeHandler(state);
      });

      const cellState = createCellStateOfEdge(graph);
      expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        CustomEdgeHandler
      );
    });
  });

  describe('Custom handlerKind', () => {
    test('edgeStyle registered with an unknown handlerKind', () => {
      const edgeStyle = customEdgeStyle;
      EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind: 'unknown_kind' });

      const graph = createNewGraph();
      const plugin = getPlugin(graph);

      const cellState = createCellStateOfEdge(graph);
      expectExactInstanceOfEdgeHandler(plugin.createEdgeHandler(cellState, edgeStyle));
    });

    test('edgeStyle registered with a custom handlerKind', () => {
      class CustomEdgeHandler extends ElbowEdgeHandler {}
      const edgeStyle = customEdgeStyle;
      EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind: 'custom_kind' });

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.configureEdgeHandler('custom_kind', (state) => {
        return new CustomEdgeHandler(state);
      });

      const cellState = createCellStateOfEdge(graph);
      expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
        CustomEdgeHandler
      );
    });
  });
});
