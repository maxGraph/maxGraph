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

import { describe, expect, test } from '@jest/globals';
import {
  Cell,
  CellState,
  EdgeSegmentHandler,
  EdgeStyle,
  ElbowEdgeHandler,
  Point,
  Rectangle,
  RectangleShape,
} from '../../src';
import { createGraphWithoutPlugins } from '../utils';
import EdgeHandler from '../../src/view/handler/EdgeHandler';

describe('isOrthogonal', () => {
  test('Style of the CellState, orthogonal: true', () => {
    const graph = createGraphWithoutPlugins();
    const cellState = new CellState(graph.view, null, { orthogonal: true });
    expect(graph.isOrthogonal(cellState)).toBeTruthy();
  });

  test('No style in the CellState', () => {
    const graph = createGraphWithoutPlugins();
    expect(graph.isOrthogonal(new CellState())).toBeFalsy();
  });

  test.each([
    ['ElbowConnector', EdgeStyle.ElbowConnector],
    ['ManhattanConnector', EdgeStyle.ManhattanConnector],
    ['OrthogonalConnector', EdgeStyle.OrthConnector],
    ['SideToSide', EdgeStyle.SideToSide],
  ])('Style of the CellState, edgeStyle: %s', (_name, edgeStyle) => {
    const graph = createGraphWithoutPlugins();
    const cellState = new CellState(graph.view, null, { edgeStyle });
    expect(graph.isOrthogonal(cellState)).toBeTruthy();
  });

  test('Style of the CellState, edgeStyle: Loop', () => {
    const graph = createGraphWithoutPlugins();
    const cellState = new CellState(graph.view, null, {
      edgeStyle: EdgeStyle.Loop,
    });
    expect(graph.isOrthogonal(cellState)).toBeFalsy();
  });
});

describe('createEdgeHandler', () => {
  test.each([
    ['ElbowConnector', EdgeStyle.ElbowConnector],
    ['Loop', EdgeStyle.Loop],
    ['SideToSide', EdgeStyle.SideToSide],
    ['TopToBottom', EdgeStyle.TopToBottom],
  ])('Expect ElbowEdgeHandler for edgeStyle: %s', (_name, edgeStyle) => {
    const graph = createGraphWithoutPlugins();
    const cellState = new CellState(graph.view, new Cell(), {});
    cellState.shape = new RectangleShape(new Rectangle(), 'green', 'blue');
    expect(graph.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
      ElbowEdgeHandler
    );
  });

  test.each([
    ['ManhattanConnector', EdgeStyle.ManhattanConnector],
    ['OrthogonalConnector', EdgeStyle.OrthConnector],
    ['SegmentConnector', EdgeStyle.SegmentConnector],
  ])('Expect EdgeSegmentHandler for edgeStyle: %s', (_name, edgeStyle) => {
    const graph = createGraphWithoutPlugins();
    const cellState = new CellState(graph.view, new Cell(), {});
    cellState.absolutePoints = [new Point(0, 0)];
    cellState.shape = new RectangleShape(new Rectangle(), 'green', 'blue');
    expect(graph.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(
      EdgeSegmentHandler
    );
  });

  test.each([
    ['EntityRelation', EdgeStyle.EntityRelation],
    ['null', null],
  ])('Expect EdgeHandler for edgeStyle: %s', (_name, edgeStyle) => {
    const graph = createGraphWithoutPlugins();
    const cellState = new CellState(graph.view, new Cell(), {});
    cellState.shape = new RectangleShape(new Rectangle(), 'green', 'blue');
    expect(graph.createEdgeHandler(cellState, edgeStyle)).toBeInstanceOf(EdgeHandler);
  });
});
