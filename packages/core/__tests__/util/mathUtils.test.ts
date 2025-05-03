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
import { getPortConstraints, isNumeric } from '../../src/util/mathUtils';
import { DIRECTION_MASK } from '../../src/util/Constants';
import CellState from '../../src/view/cell/CellState';
import { DirectionValue } from '../../src';

describe('getPortConstraints', () => {
  const defaultMask = DIRECTION_MASK.NONE;

  test('returns defaultValue when portConstraint is null', () => {
    const terminal = new CellState();
    terminal.style = {};
    const edge = new CellState();
    edge.style = {};

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.NONE
    );
    expect(getPortConstraints(terminal, edge, true, DIRECTION_MASK.ALL)).toBe(
      DIRECTION_MASK.ALL
    );
  });

  test('uses terminal.style.portConstraint over edge style constraints', () => {
    const terminal = new CellState();
    terminal.style = { portConstraint: 'north' };
    const edge = new CellState();
    edge.style = {
      sourcePortConstraint: 'south',
      targetPortConstraint: 'east',
    };

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.NORTH
    );
  });

  test('falls back to edge.style.sourcePortConstraint when terminal has no constraint and source is true', () => {
    const terminal = new CellState();
    terminal.style = {};
    const edge = new CellState();
    edge.style = { sourcePortConstraint: 'north' };

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.NORTH
    );
  });

  test('falls back to edge.style.targetPortConstraint when terminal has no constraint and source is false', () => {
    const terminal = new CellState();
    terminal.style = {};
    const edge = new CellState();
    edge.style = { targetPortConstraint: 'south' };

    expect(getPortConstraints(terminal, edge, false, defaultMask)).toBe(
      DIRECTION_MASK.SOUTH
    );
  });

  test.each([
    ['north', DIRECTION_MASK.NORTH],
    ['south', DIRECTION_MASK.SOUTH],
    ['east', DIRECTION_MASK.EAST],
    ['west', DIRECTION_MASK.WEST],
  ])('handles single direction %s', (direction: DirectionValue, expectedMask: number) => {
    const terminal = new CellState();
    terminal.style = { portConstraint: direction };
    const edge = new CellState();
    edge.style = {};

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(expectedMask);
  });

  test('handles array of port constraints (north and south)', () => {
    const terminal = new CellState();
    terminal.style = { portConstraint: ['north', 'south'] };
    const edge = new CellState();
    edge.style = {};

    // This should return a mask with both NORTH and SOUTH bits set
    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.NORTH | DIRECTION_MASK.SOUTH
    );
  });

  test('handles array of port constraints in edge.style.sourcePortConstraint', () => {
    const terminal = new CellState();
    terminal.style = {}; // No port constraint on terminal
    const edge = new CellState();
    edge.style = {
      sourcePortConstraint: ['north', 'south'],
    };

    // When terminal has no constraint, should use the edge's sourcePortConstraint array
    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.NORTH | DIRECTION_MASK.SOUTH
    );
  });

  test('handles array of port constraints in edge.style.targetPortConstraint', () => {
    const terminal = new CellState();
    terminal.style = {}; // No port constraint on terminal
    const edge = new CellState();
    edge.style = {
      targetPortConstraint: ['east', 'west'],
    };

    // When terminal has no constraint, should use the edge's targetPortConstraint array
    expect(getPortConstraints(terminal, edge, false, defaultMask)).toBe(
      DIRECTION_MASK.EAST | DIRECTION_MASK.WEST
    );
  });

  test('terminal portConstraint array takes precedence over edge port constraints', () => {
    const terminal = new CellState();
    terminal.style = {
      portConstraint: ['north', 'west'],
    };
    const edge = new CellState();
    edge.style = {
      sourcePortConstraint: 'south',
      targetPortConstraint: 'east',
    };

    // Terminal's portConstraint should take precedence over edge's sourcePortConstraint
    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.NORTH | DIRECTION_MASK.WEST
    );
  });

  test('handles rotated constraints when portConstraintRotation is true', () => {
    const terminal = new CellState();
    terminal.style = {
      portConstraint: 'north',
      portConstraintRotation: true,
      rotation: 90,
    };
    const edge = new CellState();
    edge.style = {};

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.EAST
    );
  });

  test('handles constraints with rotation defaulting to 0', () => {
    const terminal = new CellState();
    terminal.style = {
      portConstraint: 'north',
      portConstraintRotation: true,
      // rotation not set, should default to 0
    };
    const edge = new CellState();
    edge.style = {};

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.NORTH
    );
  });

  test('ignores rotation when portConstraintRotation is false', () => {
    const terminal = new CellState();
    terminal.style = {
      portConstraint: 'north',
      portConstraintRotation: false,
      rotation: 90,
    };
    const edge = new CellState();
    edge.style = {};

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.NORTH
    );
  });

  test('handles 180 degree rotation', () => {
    const terminal = new CellState();
    terminal.style = {
      portConstraint: 'north',
      portConstraintRotation: true,
      rotation: 180,
    };
    const edge = new CellState();
    edge.style = {};

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.SOUTH
    );
  });

  test('handles negative rotation (-90 degrees)', () => {
    const terminal = new CellState();
    terminal.style = {
      portConstraint: 'north',
      portConstraintRotation: true,
      rotation: -90,
    };
    const edge = new CellState();
    edge.style = {};

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.WEST
    );
  });

  test('handles extreme negative rotation (-135 degrees)', () => {
    const terminal = new CellState();
    terminal.style = {
      portConstraint: 'north',
      portConstraintRotation: true,
      rotation: -135,
    };
    const edge = new CellState();
    edge.style = {};

    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.SOUTH
    );
  });

  test('handles very extreme negative rotation (-180 degrees)', () => {
    const terminal = new CellState();
    terminal.style = {
      portConstraint: 'north',
      portConstraintRotation: true,
      rotation: -180,
    };
    const edge = new CellState();
    edge.style = {};

    // With rotation <= -135, quad = 2, so a NORTH constraint becomes SOUTH
    expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
      DIRECTION_MASK.SOUTH
    );
  });

  describe('legacy mxGraph, to support backward compatibility when loading mxGraph XML models', () => {
    test('handles combined directions NORTH and SOUTH', () => {
      const terminal = new CellState();
      // @ts-ignore mxGraph set 'northsouth' as a string
      terminal.style = { portConstraint: 'north' + 'south' };
      const edge = new CellState();
      edge.style = {};

      expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
        DIRECTION_MASK.NORTH | DIRECTION_MASK.SOUTH
      );
    });

    test('handles combined directions EAST and WEST', () => {
      const terminal = new CellState();
      // @ts-ignore mxGraph set 'eastwest' as a string
      terminal.style = { portConstraint: 'east' + 'west' };
      const edge = new CellState();
      edge.style = {};

      expect(getPortConstraints(terminal, edge, true, defaultMask)).toBe(
        DIRECTION_MASK.EAST | DIRECTION_MASK.WEST
      );
    });
  });
});

describe('isNumeric', () => {
  test.each([null, undefined])('nullish value: %s', (value: null | undefined) => {
    expect(isNumeric(value)).toBeFalsy();
  });

  test('number', () => {
    expect(isNumeric(9465.45654)).toBeTruthy();
  });

  test('Infinity', () => {
    expect(isNumeric(Infinity)).toBeFalsy();
  });

  test('empty string', () => {
    expect(isNumeric('')).toBeFalsy();
  });

  test('hexadecimal in string', () => {
    expect(isNumeric('0x354354')).toBeFalsy();
  });

  test('string which is not a number', () => {
    expect(isNumeric('354354b')).toBeFalsy();
  });

  test('too large number in a string', () => {
    expect(isNumeric('9465456546987616587651356846')).toBeTruthy();
  });

  test('Object', () => {
    expect(isNumeric({ attribute: 'value' })).toBeFalsy();
  });
});
