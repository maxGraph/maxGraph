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

import { afterEach, beforeAll, describe, expect, jest, test } from '@jest/globals';
import {
  BaseGraph,
  Cell,
  CellState,
  type CellStateStyle,
  EdgeHandler,
  EdgeStyle,
  type EdgeStyleFunction,
  EdgeStyleRegistry,
  Geometry,
  Graph,
  InternalMouseEvent,
  Point,
  Rectangle,
  RectangleShape,
  registerDefaultEdgeStyles,
  type SelectionCellsHandler,
  type Shape,
  unregisterAllEdgeStyles,
} from '../../../src';
import { createBaseGraph, createCellHandleStub, createContainer } from '../../utils';

const createEdgeHandlerForStyle = (
  edgeStyle: EdgeStyleFunction | undefined,
  pointCount: number,
  { skipDefaultRegistration = false } = {}
): EdgeHandler => {
  const graph = createBaseGraph();
  if (!skipDefaultRegistration) {
    registerDefaultEdgeStyles();
  }

  const cell = new Cell();
  cell.setEdge(true);
  cell.setVertex(false);
  cell.setGeometry(new Geometry());

  const style: CellStateStyle = edgeStyle ? { edgeStyle } : {};
  const cellState = new CellState(graph.view, cell, style);
  cellState.absolutePoints = Array.from(
    { length: pointCount },
    (_, i) => new Point(i * 10, 0)
  );
  cellState.shape = new RectangleShape(new Rectangle(), 'green', 'blue');

  return new EdgeHandler(cellState);
};

const createEdgeHandlerWithoutGeometry = (): EdgeHandler => {
  const graph = createBaseGraph();
  const cell = new Cell();
  cell.setEdge(true);
  cell.setVertex(false);
  // no geometry set

  const cellState = new CellState(graph.view, cell, {
    edgeStyle: EdgeStyle.EntityRelation,
  });
  cellState.absolutePoints = [new Point(0, 0), new Point(10, 0)];
  cellState.shape = new RectangleShape(new Rectangle(), 'green', 'blue');

  return new EdgeHandler(cellState);
};

describe('isHandleVisible', () => {
  beforeAll(() => {
    unregisterAllEdgeStyles();
  });
  afterEach(() => {
    unregisterAllEdgeStyles();
  });

  describe('EntityRelation edge style', () => {
    test('first handle is visible', () => {
      const handler = createEdgeHandlerForStyle(EdgeStyle.EntityRelation, 5);
      expect(handler.isHandleVisible(0)).toBe(true);
    });

    test('last handle is visible', () => {
      const handler = createEdgeHandlerForStyle(EdgeStyle.EntityRelation, 5);
      expect(handler.isHandleVisible(4)).toBe(true);
    });

    test('intermediate handle is not visible', () => {
      const handler = createEdgeHandlerForStyle(EdgeStyle.EntityRelation, 5);
      expect(handler.isHandleVisible(2)).toBe(false);
    });
  });

  test('other edge style - intermediate handle is visible', () => {
    const handler = createEdgeHandlerForStyle(EdgeStyle.OrthConnector, 5);
    expect(handler.isHandleVisible(2)).toBe(true);
  });

  test('no geometry - all handles are visible', () => {
    const handler = createEdgeHandlerWithoutGeometry();
    expect(handler.isHandleVisible(0)).toBe(true);
    expect(handler.isHandleVisible(1)).toBe(true);
  });

  test('no edge style - intermediate handle is visible', () => {
    const handler = createEdgeHandlerForStyle(undefined, 5);
    expect(handler.isHandleVisible(2)).toBe(true);
  });

  test('EntityRelation registered without allowIntermediateHandles metadata - intermediate handle is visible', () => {
    EdgeStyleRegistry.add('entityRelationEdgeStyle', EdgeStyle.EntityRelation, {});

    const handler = createEdgeHandlerForStyle(EdgeStyle.EntityRelation, 5, {
      skipDefaultRegistration: true,
    });
    expect(handler.isHandleVisible(2)).toBe(true);
  });
});

describe('loops over the handles', () => {
  let graph: Graph;

  afterEach(() => {
    graph.destroy();
  });

  /**
   * Selects an edge with 2 waypoints, whose absolute points are (40, 20), (150, 20), (150, 220) and (300, 220).
   */
  const selectEdge = (): EdgeHandler => {
    graph = new Graph(createContainer({ offsetWidth: 1200, offsetHeight: 900 }));
    const source = graph.insertVertex({ position: [0, 0], size: [40, 40] });
    const target = graph.insertVertex({ position: [300, 200], size: [40, 40] });
    const edge = graph.insertEdge({ source, target });
    edge.getGeometry()!.points = [new Point(150, 20), new Point(150, 220)];
    graph.view.invalidate();
    graph.view.validate();
    graph.setSelectionCell(edge);
    return graph
      .getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!
      .getHandler(edge) as EdgeHandler;
  };

  const createShapeStubs = (): Shape[] =>
    [{ node: { style: {} } }, { node: { style: {} } }] as unknown as Shape[];

  test.each([
    ['the first point', 42, 40],
    ['the last point', 298, 300],
  ])('getPointForEvent snaps to %s of the edge', (_description, pointerX, expectedX) => {
    const handler = selectEdge();
    handler.snapToTerminals = true;
    graph.setGridEnabled(false);
    const mouseEvent = new InternalMouseEvent(new MouseEvent('mousemove'));
    mouseEvent.graphX = pointerX;
    mouseEvent.graphY = 100;

    expect(handler.getPointForEvent(mouseEvent)).toEqual(new Point(expectedX, 100));
  });

  test('setHandlesVisible hides every bend, virtual bend and custom handle', () => {
    const handler = selectEdge();
    const virtualBends = createShapeStubs();
    handler.virtualBends = virtualBends;
    const customHandles = [createCellHandleStub(), createCellHandleStub()];
    handler.customHandles = customHandles;

    handler.setHandlesVisible(false);

    expect(
      [...handler.bends, ...virtualBends].map((bend) => bend.node.style.display)
    ).toEqual([...handler.bends, ...virtualBends].map(() => 'none'));
    for (const customHandle of customHandles) {
      expect(customHandle.setVisible).toHaveBeenCalledWith(false);
    }
  });

  test.each(['reset', 'redrawHandles'] as const)(
    '%s acts on every custom handle',
    (method) => {
      const handler = selectEdge();
      // an active handler is refreshed by reset, which replaces the custom handles before the loop
      handler.active = false;
      const customHandles = [createCellHandleStub(), createCellHandleStub()];
      handler.customHandles = customHandles;

      handler[method]();

      for (const customHandle of customHandles) {
        expect(
          method === 'reset' ? customHandle.reset : customHandle.redraw
        ).toHaveBeenCalled();
      }
    }
  );

  test('destroyBends destroys every given bend', () => {
    const handler = selectEdge();
    const bends = [{ destroy: jest.fn() }, { destroy: jest.fn() }] as unknown as Shape[];

    handler.destroyBends(bends);

    for (const bend of bends) {
      expect(bend.destroy).toHaveBeenCalledTimes(1);
    }
  });
});
