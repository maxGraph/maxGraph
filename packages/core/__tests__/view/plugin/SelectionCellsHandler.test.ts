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

import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import {
  AbstractGraph,
  BaseGraph,
  Cell,
  CellState,
  type CellStyle,
  EdgeHandler,
  EdgeSegmentHandler,
  EdgeStyle,
  type EdgeStyleFunction,
  EdgeStyleHandlerKind,
  EdgeStyleRegistry,
  ElbowEdgeHandler,
  Geometry,
  Point,
  Rectangle,
  RectangleShape,
  registerDefaultEdgeStyles,
  SelectionCellsHandler,
  unregisterAllEdgeStyles,
  VertexHandler,
} from '../../../src';
import { hasListener } from '../../utils';

describe('onDestroy', () => {
  test('removes refreshHandler from selectionModel', () => {
    const graph = new BaseGraph({ plugins: [SelectionCellsHandler] });
    const handler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
    const { refreshHandler } = handler;

    expect(hasListener(graph.getSelectionModel().eventListeners, refreshHandler)).toBe(
      true
    );

    handler.onDestroy();

    expect(hasListener(graph.getSelectionModel().eventListeners, refreshHandler)).toBe(
      false
    );
  });

  test('clears eventListeners', () => {
    const graph = new BaseGraph({ plugins: [SelectionCellsHandler] });
    const handler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
    handler.addListener('testEvent', () => {});
    expect(handler.eventListeners.length).toBeGreaterThan(0);

    handler.onDestroy();

    expect(handler.eventListeners).toHaveLength(0);
  });

  test('removes refreshHandler from dataModel', () => {
    const graph = new BaseGraph({ plugins: [SelectionCellsHandler] });
    const handler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
    const { refreshHandler } = handler;

    expect(hasListener(graph.getDataModel().eventListeners, refreshHandler)).toBe(true);

    handler.onDestroy();

    expect(hasListener(graph.getDataModel().eventListeners, refreshHandler)).toBe(false);
  });

  test('removes refreshHandler from view', () => {
    const graph = new BaseGraph({ plugins: [SelectionCellsHandler] });
    const handler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
    const { refreshHandler } = handler;

    expect(hasListener(graph.getView().eventListeners, refreshHandler)).toBe(true);

    handler.onDestroy();

    expect(hasListener(graph.getView().eventListeners, refreshHandler)).toBe(false);
  });
});

describe('Handler management', () => {
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

  const createNewGraph = () => new BaseGraph({ plugins: [SelectionCellsHandler] });

  const getPlugin = (graph: BaseGraph) =>
    graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;

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
        plugin.setVertexHandlerFactory((state) => {
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

    test('Pass the edge geometry and the visible terminal states to getEdgeStyle', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);

      const cellState = createCellStateOfEdge(graph);
      const waypoints = [new Point(10, 20), new Point(30, 40)];
      cellState.cell.setGeometry(new Geometry());
      cellState.cell.getGeometry()!.points = waypoints;

      const sourceState = createCellStateOfVertex(graph);
      const targetState = createCellStateOfVertex(graph);
      cellState.setVisibleTerminalState(sourceState, true);
      cellState.setVisibleTerminalState(targetState, false);

      const getEdgeStyleSpy = jest.spyOn(graph.view, 'getEdgeStyle');
      plugin.createHandler(cellState);

      // not using toHaveBeenCalledWith: matching CellState makes the TypeScript inference of the matcher blow up
      expect(getEdgeStyleSpy.mock.calls).toHaveLength(1);
      const [state, points, source, target] = getEdgeStyleSpy.mock.calls[0];
      expect(state).toBe(cellState);
      expect(points).toBe(waypoints);
      expect(source).toBe(sourceState);
      expect(target).toBe(targetState);
    });

    test('Pass undefined points to getEdgeStyle when the edge has no geometry', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);

      const cellState = createCellStateOfEdge(graph);
      expect(cellState.cell.getGeometry()).toBeNull();

      const getEdgeStyleSpy = jest.spyOn(graph.view, 'getEdgeStyle');
      plugin.createHandler(cellState);

      expect(getEdgeStyleSpy.mock.calls).toHaveLength(1);
      const [state, points, source, target] = getEdgeStyleSpy.mock.calls[0];
      expect(state).toBe(cellState);
      expect(points).toBeUndefined();
      expect(source).toBeNull();
      expect(target).toBeNull();
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
      test.each(['default', 'elbow', 'segment'])(
        '%s',
        (handlerKind: EdgeStyleHandlerKind) => {
          class CustomEdgeHandler extends ElbowEdgeHandler {}
          const edgeStyle = customEdgeStyle;
          handlerKind != 'default' && // when not registered, it will use 'default'
            EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind });

          const graph = createNewGraph();
          const plugin = getPlugin(graph);
          plugin.setEdgeHandlerFactory(handlerKind, (state) => {
            return new CustomEdgeHandler(state);
          });

          const cellState = createCellStateOfEdge(graph);
          expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
            CustomEdgeHandler
          );
        }
      );
    });

    describe('setEdgeHandlerFactoryForAllKinds', () => {
      class CustomEdgeHandler extends EdgeHandler {}

      const createPluginWithFactoryForAllKinds = () => {
        const graph = createNewGraph();
        const plugin = getPlugin(graph);
        plugin.setEdgeHandlerFactoryForAllKinds((state) => new CustomEdgeHandler(state));
        return { graph, plugin };
      };

      test.each([
        ['default', EdgeStyle.EntityRelation],
        ['elbow', EdgeStyle.ElbowConnector],
        ['segment', EdgeStyle.SegmentConnector],
      ])('Expect the factory for the %s handler kind', (_name, edgeStyle) => {
        registerDefaultEdgeStyles();
        const { graph, plugin } = createPluginWithFactoryForAllKinds();

        const cellState = createCellStateOfEdge(graph);
        expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
          CustomEdgeHandler
        );
      });

      test('Expect the factory for an edgeStyle without registered edge style', () => {
        const { graph, plugin } = createPluginWithFactoryForAllKinds();

        const cellState = createCellStateOfEdge(graph);
        expect(plugin.createEdgeHandler(cellState, null)).toBeInstanceOf(
          CustomEdgeHandler
        );
      });

      test('Expect the factory for a custom handlerKind registered afterwards', () => {
        const { graph, plugin } = createPluginWithFactoryForAllKinds();

        // registered after the factory, it has no dedicated factory so it falls back to 'default'
        const edgeStyle = customEdgeStyle;
        EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind: 'custom_kind' });

        const cellState = createCellStateOfEdge(graph);
        expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
          CustomEdgeHandler
        );
      });

      test('Discard the factories set beforehand, including those of custom kinds', () => {
        class PreviousEdgeHandler extends ElbowEdgeHandler {}
        const edgeStyle = customEdgeStyle;
        EdgeStyleRegistry.add('custom', edgeStyle, { handlerKind: 'custom_kind' });

        const graph = createNewGraph();
        const plugin = getPlugin(graph);
        plugin.setEdgeHandlerFactory('custom_kind', (state) => {
          return new PreviousEdgeHandler(state);
        });
        plugin.setEdgeHandlerFactoryForAllKinds((state) => new CustomEdgeHandler(state));

        const cellState = createCellStateOfEdge(graph);
        const handler = plugin.createEdgeHandler(cellState, edgeStyle);
        expect(handler).toBeInstanceOf(CustomEdgeHandler);
        expect(handler).not.toBeInstanceOf(PreviousEdgeHandler);
      });

      test('Be overridable for a single kind afterwards', () => {
        class SegmentSpecificEdgeHandler extends EdgeSegmentHandler {}
        registerDefaultEdgeStyles();

        const { graph, plugin } = createPluginWithFactoryForAllKinds();
        plugin.setEdgeHandlerFactory('segment', (state) => {
          return new SegmentSpecificEdgeHandler(state);
        });

        const cellState = createCellStateOfEdge(graph);
        expect(
          plugin.createEdgeHandler(cellState, EdgeStyle.SegmentConnector)
        ).toBeInstanceOf(SegmentSpecificEdgeHandler);
        // the other kinds still use the factory set for all kinds
        expect(
          plugin.createEdgeHandler(cellState, EdgeStyle.ElbowConnector)
        ).toBeInstanceOf(CustomEdgeHandler);
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
        plugin.setEdgeHandlerFactory('custom_kind', (state) => {
          return new CustomEdgeHandler(state);
        });

        const cellState = createCellStateOfEdge(graph);
        expect(plugin.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
          CustomEdgeHandler
        );
      });
    });
  });
});

// Unlike the "Handler management" tests, these insert real cells and select them, so the handlers are created by the
// refresh triggered by the selection change, which is the path applications actually go through.
describe('Handler lifecycle on selection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    unregisterAllEdgeStyles();
  });

  const createNewGraph = () => new BaseGraph({ plugins: [SelectionCellsHandler] });

  const getPlugin = (graph: BaseGraph) =>
    graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;

  const insertVertex = (graph: BaseGraph): Cell =>
    graph.insertVertex({
      value: 'a vertex',
      position: [10, 20],
      size: [80, 40],
    });

  const insertEdge = (graph: BaseGraph, style: CellStyle = {}): Cell => {
    const source = graph.insertVertex({
      value: 'source',
      position: [0, 0],
      size: [40, 40],
    });
    const target = graph.insertVertex({
      value: 'target',
      position: [200, 200],
      size: [40, 40],
    });
    return graph.insertEdge({ value: 'an edge', source, target, style });
  };

  describe('refresh', () => {
    test('Use the default handlers when no factory is set', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      const vertex = insertVertex(graph);
      const edge = insertEdge(graph);

      graph.setSelectionCells([vertex, edge]);

      expect(plugin.getHandler(vertex)).toBeInstanceOf(VertexHandler);
      expect(plugin.getHandler(edge)).toBeInstanceOf(EdgeHandler);
    });

    test('Use the factory set with setVertexHandlerFactory', () => {
      class CustomVertexHandler extends VertexHandler {}

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.setVertexHandlerFactory((state) => new CustomVertexHandler(state));

      const vertex = insertVertex(graph);
      graph.setSelectionCell(vertex);

      expect(plugin.getHandler(vertex)).toBeInstanceOf(CustomVertexHandler);
    });

    test('Use the factory set with setEdgeHandlerFactory for the default handler kind', () => {
      class CustomEdgeHandler extends EdgeHandler {}

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.setEdgeHandlerFactory('default', (state) => new CustomEdgeHandler(state));

      const edge = insertEdge(graph);
      graph.setSelectionCell(edge);

      expect(plugin.getHandler(edge)).toBeInstanceOf(CustomEdgeHandler);
    });

    test('Use the factory set with setEdgeHandlerFactoryForAllKinds whatever the edge style', () => {
      class CustomEdgeHandler extends EdgeHandler {}
      registerDefaultEdgeStyles();

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.setEdgeHandlerFactoryForAllKinds((state) => new CustomEdgeHandler(state));

      const plainEdge = insertEdge(graph);
      // 'elbow' and 'segment' kinds, which have their own handler by default
      const elbowEdge = insertEdge(graph, { edgeStyle: 'elbowEdgeStyle' });
      const segmentEdge = insertEdge(graph, { edgeStyle: 'segmentEdgeStyle' });

      graph.setSelectionCells([plainEdge, elbowEdge, segmentEdge]);

      for (const edge of [plainEdge, elbowEdge, segmentEdge]) {
        expect(plugin.getHandler(edge)).toBeInstanceOf(CustomEdgeHandler);
      }
    });

    test('Use the factory matching the handler kind of the edge style', () => {
      class CustomElbowEdgeHandler extends ElbowEdgeHandler {}
      registerDefaultEdgeStyles();

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      plugin.setEdgeHandlerFactory('elbow', (state) => new CustomElbowEdgeHandler(state));

      // 'elbowEdgeStyle' is registered with the 'elbow' handler kind
      const edge = insertEdge(graph, { edgeStyle: 'elbowEdgeStyle' });
      graph.setSelectionCell(edge);

      expect(plugin.getHandler(edge)).toBeInstanceOf(CustomElbowEdgeHandler);
    });

    test('Only affect the handlers created after the factory is set', () => {
      class CustomVertexHandler extends VertexHandler {}

      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      const vertex = insertVertex(graph);
      graph.setSelectionCell(vertex);
      const handlerCreatedBefore = plugin.getHandler(vertex);

      plugin.setVertexHandlerFactory((state) => new CustomVertexHandler(state));

      expect(handlerCreatedBefore).toBeInstanceOf(VertexHandler);
      expect(handlerCreatedBefore).not.toBeInstanceOf(CustomVertexHandler);
      expect(plugin.getHandler(vertex)).toBe(handlerCreatedBefore);
    });

    test('Destroy the handler when the cell is deselected', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      const vertex = insertVertex(graph);
      graph.setSelectionCell(vertex);

      const handler = plugin.getHandler(vertex)!;
      const onDestroySpy = jest.spyOn(handler, 'onDestroy');

      graph.clearSelection();

      expect(onDestroySpy).toHaveBeenCalledTimes(1);
      expect(plugin.isHandled(vertex)).toBe(false);
    });
  });

  describe('updateHandler', () => {
    test('Replace the existing handler with a newly created one', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      const vertex = insertVertex(graph);
      graph.setSelectionCell(vertex);

      const initialHandler = plugin.getHandler(vertex)!;
      const onDestroySpy = jest.spyOn(initialHandler, 'onDestroy');

      plugin.updateHandler(graph.view.getState(vertex)!);

      expect(onDestroySpy).toHaveBeenCalledTimes(1);
      const newHandler = plugin.getHandler(vertex);
      expect(newHandler).toBeInstanceOf(VertexHandler);
      expect(newHandler).not.toBe(initialHandler);
    });

    test('Transfer the in-progress gesture to the new handler', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      const vertex = insertVertex(graph);
      graph.setSelectionCell(vertex);

      // simulate a gesture in progress on the current handler
      const initialHandler = plugin.getHandler(vertex)!;
      initialHandler.index = 3;
      initialHandler.startX = 12;
      initialHandler.startY = 34;

      const startSpy = jest
        .spyOn(VertexHandler.prototype, 'start')
        .mockImplementation(() => {});

      plugin.updateHandler(graph.view.getState(vertex)!);

      expect(startSpy).toHaveBeenCalledTimes(1);
      expect(startSpy).toHaveBeenCalledWith(12, 34, 3);
    });

    test('Do not start a gesture on the new handler when none is in progress', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      const vertex = insertVertex(graph);
      graph.setSelectionCell(vertex);

      expect(plugin.getHandler(vertex)!.index).toBeNull();

      const startSpy = jest
        .spyOn(VertexHandler.prototype, 'start')
        .mockImplementation(() => {});

      plugin.updateHandler(graph.view.getState(vertex)!);

      expect(startSpy).not.toHaveBeenCalled();
    });

    test('Do nothing when the cell has no handler', () => {
      const graph = createNewGraph();
      const plugin = getPlugin(graph);
      const vertex = insertVertex(graph);

      expect(plugin.isHandled(vertex)).toBe(false);

      plugin.updateHandler(graph.view.getState(vertex)!);

      expect(plugin.isHandled(vertex)).toBe(false);
    });
  });
});
