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
  CellState,
  type CellStateStyle,
  type CellStyle,
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
  const getAllConnectionConstraints = (state: CellState | null) =>
    createGraphWithoutPlugins().getAllConnectionConstraints(state, true);

  test('null CellState', () => {
    expect(getAllConnectionConstraints(null)).toBeNull();
  });

  test('CellState with null shape', () => {
    expect(getAllConnectionConstraints(new CellState())).toBeNull();
  });

  test('CellState with shape which is not a StencilShape', () => {
    const cellState = new CellState();
    cellState.shape = new Shape();
    expect(getAllConnectionConstraints(cellState)).toBeNull();
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
    expect(getAllConnectionConstraints(cellState)).toBe(constraints);
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

  /** The style properties of a single edge side, independently of the source/target naming. */
  interface ConnectionStyleValues {
    x?: number;
    y?: number;
    perimeter?: boolean;
    dx?: number;
    dy?: number;
  }

  const expectConstraint = (
    constraint: ConnectionConstraint,
    expected: { point: Point | null; perimeter: boolean; dx: number; dy: number }
  ): void => {
    // Compare all properties at once, so that a failure reports the whole constraint instead of
    // the first property that differs.
    expect({
      point: constraint.point,
      perimeter: constraint.perimeter,
      dx: constraint.dx,
      dy: constraint.dy,
    }).toStrictEqual(expected);
  };

  describe.each([
    {
      side: 'source',
      source: true,
      toStyle: ({ x, y, perimeter, dx, dy }: ConnectionStyleValues): CellStateStyle => ({
        exitX: x,
        exitY: y,
        exitPerimeter: perimeter,
        exitDx: dx,
        exitDy: dy,
      }),
    },
    {
      side: 'target',
      source: false,
      toStyle: ({ x, y, perimeter, dx, dy }: ConnectionStyleValues): CellStateStyle => ({
        entryX: x,
        entryY: y,
        entryPerimeter: perimeter,
        entryDx: dx,
        entryDy: dy,
      }),
    },
  ])('$side terminal', ({ source, toStyle }) => {
    const constraintFor = (values: ConnectionStyleValues): ConnectionConstraint =>
      createGraphWithoutPlugins().getConnectionConstraint(
        new CellState(null, null, toStyle(values)),
        null,
        source
      );

    test('no fixed connection point', () => {
      expectConstraint(constraintFor({}), {
        point: null,
        perimeter: false,
        dx: 0,
        dy: 0,
      });
    });

    test.each([
      ['x', { x: 0.25 }],
      ['y', { y: 0.75 }],
    ])(
      'only the %s coordinate is set, which is not a fixed connection point',
      (_desc, values) => {
        expectConstraint(constraintFor(values), {
          point: null,
          perimeter: false,
          dx: 0,
          dy: 0,
        });
      }
    );

    // Regression test: the perimeter defaults to true in mxGraph, and the JSDoc of
    // CellStyle.entryPerimeter and CellStyle.exitPerimeter documents the same default.
    test('fixed connection point without explicit perimeter defaults to using the perimeter', () => {
      expectConstraint(constraintFor({ x: 0.25, y: 0.75 }), {
        point: new Point(0.25, 0.75),
        perimeter: true,
        dx: 0,
        dy: 0,
      });
    });

    test.each([true, false])(
      'fixed connection point with perimeter explicitly set to %s',
      (perimeter) => {
        expectConstraint(constraintFor({ x: 0.25, y: 0.75, perimeter }), {
          point: new Point(0.25, 0.75),
          perimeter,
          dx: 0,
          dy: 0,
        });
      }
    );

    // The XML deserialization currently produces numbers instead of booleans, see the
    // "Cell with baseStyleNames style attribute" test in serialization.xml.test.ts.
    test.each([
      [1, true],
      [0, false],
    ])('perimeter set to the number %s behaves as %s', (styleValue, expected) => {
      const constraint = constraintFor({
        x: 0.25,
        y: 0.75,
        perimeter: styleValue as unknown as boolean,
      });
      expect(Boolean(constraint.perimeter)).toBe(expected);
    });

    test('offsets are applied when a fixed connection point is set', () => {
      expectConstraint(constraintFor({ x: 0.25, y: 0.75, dx: 3, dy: -4 }), {
        point: new Point(0.25, 0.75),
        perimeter: true,
        dx: 3,
        dy: -4,
      });
    });

    test('offsets are ignored when no fixed connection point is set', () => {
      expectConstraint(constraintFor({ dx: 3, dy: -4 }), {
        point: null,
        perimeter: false,
        dx: 0,
        dy: 0,
      });
    });
  });
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
