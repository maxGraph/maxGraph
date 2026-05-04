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

import { afterEach, beforeAll, describe, expect, test } from '@jest/globals';
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
  Point,
  Rectangle,
  RectangleShape,
  registerDefaultEdgeStyles,
  unregisterAllEdgeStyles,
} from '../../../src';

const createEdgeHandlerForStyle = (
  edgeStyle: EdgeStyleFunction | undefined,
  pointCount: number,
  { skipDefaultRegistration = false } = {}
): EdgeHandler => {
  const graph = new BaseGraph();
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
  const graph = new BaseGraph();
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
