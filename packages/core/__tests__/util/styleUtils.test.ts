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
import {
  matchBinaryMask,
  parseCssNumber,
  setStyleFlag,
  setCellStyleFlags,
  setCellStyles,
} from '../../src/util/styleUtils';
import { FONT } from '../../src/util/Constants';
import {
  CellStateStyle,
  type CellStyle,
  type NumericCellStateStyleKeys,
} from '../../src/types';
import { createGraphWithoutPlugins } from '../utils';

describe('matchBinaryMask', () => {
  test('match self', () => {
    expect(matchBinaryMask(FONT.STRIKETHROUGH, FONT.STRIKETHROUGH)).toBeTruthy();
  });
  test('match', () => {
    expect(matchBinaryMask(9465, FONT.BOLD)).toBeTruthy();
  });
  test('match another', () => {
    expect(matchBinaryMask(19484, FONT.UNDERLINE)).toBeTruthy();
  });
  test('no match', () => {
    expect(matchBinaryMask(46413, FONT.ITALIC)).toBeFalsy();
  });
});

describe('parseCssNumber', () => {
  test.each([
    ['thin', 2],
    ['medium', 4],
    ['thick', 6],
    ['10', 10],
    ['3.14', 3.14],
    ['-5', -5],
    ['0', 0],
    ['', 0],
    ['invalid', 0],
    ['10px', 10],
    ['1.5em', 1.5],
  ])('parses %s correctly to %d', (input, expected) => {
    expect(parseCssNumber(input)).toBe(expected);
  });
});

describe('setStyleFlag', () => {
  test('preserves other style properties', () => {
    const style = { fontStyle: FONT.BOLD, fillColor: 'red', strokeColor: 'blue' };
    setStyleFlag(style, 'fontStyle', FONT.ITALIC, true);
    expect(style).toEqual({
      fontStyle: FONT.BOLD | FONT.ITALIC,
      fillColor: 'red',
      strokeColor: 'blue',
    });
  });

  test('multiple flags can be combined', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT.BOLD, true);
    setStyleFlag(style, 'fontStyle', FONT.ITALIC, true);
    setStyleFlag(style, 'fontStyle', FONT.UNDERLINE, true);
    expect(style.fontStyle).toBe(FONT.BOLD | FONT.ITALIC | FONT.UNDERLINE);
  });

  test('fontStyle undefined, set bold, no value', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT.BOLD);
    expect(style.fontStyle).toBe(1);
  });
  test('fontStyle undefined, set bold, value is false', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT.BOLD, false);
    expect(style.fontStyle).toBe(0);
  });
  test('fontStyle undefined, set italic, value is false', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT.ITALIC, false);
    expect(style.fontStyle).toBe(0);
  });
  test('fontStyle undefined, set underline, value is true', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT.UNDERLINE, true);
    expect(style.fontStyle).toBe(4);
  });
  test('fontStyle undefined, set strike-through, value is true', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT.STRIKETHROUGH, true);
    expect(style.fontStyle).toBe(8);
  });

  test('fontStyle set without bold, toggle bold', () => {
    const style: CellStyle = { fontStyle: 2 };
    setStyleFlag(style, 'fontStyle', FONT.BOLD);
    expect(style.fontStyle).toBe(3);
  });
  test('fontStyle set with bold, toggle bold', () => {
    const style: CellStyle = { fontStyle: 9 };
    setStyleFlag(style, 'fontStyle', FONT.BOLD);
    expect(style.fontStyle).toBe(8);
  });

  test('fontStyle set without strike-through, set strike-through', () => {
    const style: CellStyle = { fontStyle: 7 };
    setStyleFlag(style, 'fontStyle', FONT.STRIKETHROUGH, true);
    expect(style.fontStyle).toBe(15);
  });
  test('fontStyle set without strike-through, unset strike-through', () => {
    const style: CellStyle = { fontStyle: 7 };
    setStyleFlag(style, 'fontStyle', FONT.STRIKETHROUGH, false);
    expect(style.fontStyle).toBe(7);
  });

  test('fontStyle set with underline, set underline', () => {
    const style: CellStyle = { fontStyle: 6 };
    setStyleFlag(style, 'fontStyle', FONT.UNDERLINE, true);
    expect(style.fontStyle).toBe(6);
  });
  test('fontStyle set with underline, unset underline', () => {
    const style: CellStyle = { fontStyle: 6 };
    setStyleFlag(style, 'fontStyle', FONT.UNDERLINE, false);
    expect(style.fontStyle).toBe(2);
  });
});

test('setCellStyleFlags on vertex', () => {
  // Need a graph to have a view and ensure that the cell state is updated
  const graph = createGraphWithoutPlugins();

  const style: CellStyle = { fontStyle: 4, spacing: 8 };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  setCellStyleFlags(graph.getDataModel(), [cell], 'fontStyle', FONT.BOLD, true);
  expect(cell.style.fontStyle).toBe(5);
  expect(graph.getView().getState(cell)?.style?.fontStyle).toBe(5);
});

test('setCellStyles on vertex', () => {
  // Need a graph to have a view and ensure that the cell state is updated
  const graph = createGraphWithoutPlugins();

  const style: CellStyle = { strokeColor: 'yellow', labelWidth: 100 };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  setCellStyles(graph.getDataModel(), [cell], 'strokeColor', 'chartreuse');
  expect(cell.style.strokeColor).toBe('chartreuse');
  expect(graph.getView().getState(cell)?.style?.strokeColor).toBe('chartreuse');
});
