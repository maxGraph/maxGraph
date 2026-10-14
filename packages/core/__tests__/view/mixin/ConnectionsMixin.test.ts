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
  CellState,
  type CellStateStyle,
  ConnectionConstraint,
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
  const graph = createGraphWithoutPlugins();

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
      graph.getConnectionConstraint(
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
