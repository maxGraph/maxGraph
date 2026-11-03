/*
Copyright 2023-present The maxGraph project Contributors

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
import { createGraphWithoutPlugins } from '../../utils';
import {
  type Cell,
  type CellStyle,
  CellState,
  ConnectionConstraint,
  type Graph,
  Point,
  Shape,
  StencilShape,
} from '../../../src';

test('The "ConnectionHandler" plugin is not available', () => {
  const graph = createGraphWithoutPlugins();
  graph.setConnectable(true);
  graph.isConnectable();
  expect(graph.isConnectable()).toBe(false);
});

describe('getAllConnectionConstraints', () => {
  const graph = createGraphWithoutPlugins();
  test('null CellState', () => {
    expect(graph.getAllConnectionConstraints(null, true)).toBeNull();
  });

  test('CellState with null shape', () => {
    expect(graph.getAllConnectionConstraints(new CellState(), true)).toBeNull();
  });

  test('CellState with shape which is not a StencilShape', () => {
    const cellState = new CellState();
    cellState.shape = new Shape();
    expect(graph.getAllConnectionConstraints(cellState, true)).toBeNull();
  });

  test('CellState with shape which is a StencilShape', () => {
    class CustomStencilShape extends StencilShape {
      constructor(constraints: ConnectionConstraint[]) {
        super(null!);
        this.constraints = constraints;
      }
      override parseDescription() {
        // do nothing
      }
      override parseConstraints() {
        // do nothing, constraints passed in constructor
      }
    }

    const cellState = new CellState();
    const constraints = [new ConnectionConstraint(null), new ConnectionConstraint(null)];
    cellState.shape = new Shape(new CustomStencilShape(constraints));
    expect(graph.getAllConnectionConstraints(cellState, true)).toBe(constraints);
  });
});

describe('getConnectionConstraint', () => {
  const insertEdge = (graph: Graph, style?: CellStyle) => {
    const source = graph.insertVertex({ position: [0, 0], size: [20, 20] });
    const target = graph.insertVertex({ position: [100, 0], size: [20, 20] });
    const edge = graph.insertEdge({ source, target, style });
    return { source, target, edge };
  };

  const getEdgeState = (graph: Graph, edge: Cell): CellState =>
    graph.getView().getState(edge)!;

  test.each([
    ['source', true],
    ['target', false],
  ])('no point after clearing the %s constraint', (_name, isSource) => {
    const graph = createGraphWithoutPlugins();
    const { source, target, edge } = insertEdge(graph);
    const terminal = isSource ? source : target;

    graph.setConnectionConstraint(
      edge,
      terminal,
      isSource,
      new ConnectionConstraint(new Point(0.5, 1), false)
    );
    graph.setConnectionConstraint(
      edge,
      terminal,
      isSource,
      new ConnectionConstraint(null)
    );

    const constraint = graph.getConnectionConstraint(
      getEdgeState(graph, edge),
      graph.getView().getState(terminal),
      isSource
    );
    expect(constraint.point).toBeNull();
  });

  test.each([
    ['exit', true, { exitX: null, exitY: null }],
    ['entry', false, { entryX: null, entryY: null }],
  ])(
    'no point when the %s coordinates are null in the style',
    (_name, isSource, style) => {
      const graph = createGraphWithoutPlugins();
      const { source, target, edge } = insertEdge(graph, style as unknown as CellStyle);

      const constraint = graph.getConnectionConstraint(
        getEdgeState(graph, edge),
        graph.getView().getState(isSource ? source : target),
        isSource
      );
      expect(constraint.point).toBeNull();
    }
  );
});

describe('disconnectGraph', () => {
  test('keep the edges whose terminals are all in the given cells', () => {
    const graph = createGraphWithoutPlugins();
    const source = graph.insertVertex({ value: 'source' });
    const target = graph.insertVertex({ value: 'target' });
    const edge = graph.insertEdge({ source, target });

    graph.disconnectGraph([source, edge, target]);

    expect([edge.getTerminal(true), edge.getTerminal(false)]).toEqual([source, target]);
  });
});
