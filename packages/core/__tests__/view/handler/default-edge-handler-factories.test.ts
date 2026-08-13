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
import {
  BaseGraph,
  Cell,
  CellState,
  EdgeHandler,
  EdgeSegmentHandler,
  type EdgeStyleHandlerKind,
  ElbowEdgeHandler,
  getDefaultEdgeHandlerFactories,
  Point,
  Rectangle,
  RectangleShape,
} from '../../../src';

const createEdgeCellState = (): CellState => {
  const graph = new BaseGraph();
  const cell = new Cell();
  cell.setEdge(true);
  const cellState = new CellState(graph.view, cell, {});
  cellState.absolutePoints = [new Point(0, 0)];
  cellState.shape = new RectangleShape(new Rectangle(), 'green', 'blue');
  return cellState;
};

describe('getDefaultEdgeHandlerFactories', () => {
  test('returns a factory for the three builtin handler kinds', () => {
    expect(Object.keys(getDefaultEdgeHandlerFactories())).toStrictEqual([
      'default',
      'elbow',
      'segment',
    ]);
  });

  test('returns a new object each time it is called', () => {
    const factories = getDefaultEdgeHandlerFactories();
    const otherFactories = getDefaultEdgeHandlerFactories();

    expect(factories).not.toBe(otherFactories);

    delete factories.elbow;
    expect(otherFactories.elbow).toBeDefined();
  });

  // The three classes form an inheritance chain, EdgeSegmentHandler extends ElbowEdgeHandler extends EdgeHandler, so
  // toBeInstanceOf cannot tell them apart. The constructor identity can.
  test.each([
    ['default', EdgeHandler],
    ['elbow', ElbowEdgeHandler],
    ['segment', EdgeSegmentHandler],
  ])('creates the handler of the %s kind', (handlerKind, expectedClass) => {
    const factory =
      getDefaultEdgeHandlerFactories()[handlerKind as EdgeStyleHandlerKind]!;

    expect(factory(createEdgeCellState()).constructor).toBe(expectedClass);
  });
});
