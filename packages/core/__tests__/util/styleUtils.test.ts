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
  parseCssNumber,
  setStyleFlag,
  setCellStyleFlags,
  setCellStyles,
} from '../../src/util/styleUtils';
import { FONT_STYLE_FLAG } from '../../src/util/Constants';
import { type CellStyle, BaseGraph } from '../../src';
import { createGraphWithoutPlugins } from '../utils';

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
    const style = {
      fontStyle: FONT_STYLE_FLAG.BOLD,
      fillColor: 'red',
      strokeColor: 'blue',
    };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.ITALIC, true);
    expect(style).toEqual({
      fontStyle: FONT_STYLE_FLAG.BOLD | FONT_STYLE_FLAG.ITALIC,
      fillColor: 'red',
      strokeColor: 'blue',
    });
  });

  test('multiple flags can be combined', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.BOLD, true);
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.ITALIC, true);
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.UNDERLINE, true);
    expect(style.fontStyle).toBe(
      FONT_STYLE_FLAG.BOLD | FONT_STYLE_FLAG.ITALIC | FONT_STYLE_FLAG.UNDERLINE
    );
  });

  test('fontStyle undefined, set bold, no value', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.BOLD);
    expect(style.fontStyle).toBe(1);
  });
  test('fontStyle undefined, set bold, value is false', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.BOLD, false);
    expect(style.fontStyle).toBe(0);
  });
  test('fontStyle undefined, set italic, value is false', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.ITALIC, false);
    expect(style.fontStyle).toBe(0);
  });
  test('fontStyle undefined, set underline, value is true', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.UNDERLINE, true);
    expect(style.fontStyle).toBe(4);
  });
  test('fontStyle undefined, set strike-through, value is true', () => {
    const style: CellStyle = {};
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.STRIKETHROUGH, true);
    expect(style.fontStyle).toBe(8);
  });

  test('fontStyle set without bold, toggle bold', () => {
    const style: CellStyle = { fontStyle: 2 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.BOLD);
    expect(style.fontStyle).toBe(3);
  });
  test('fontStyle set with bold, toggle bold', () => {
    const style: CellStyle = { fontStyle: 9 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.BOLD);
    expect(style.fontStyle).toBe(8);
  });

  test('fontStyle set without strike-through, set strike-through', () => {
    const style: CellStyle = { fontStyle: 7 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.STRIKETHROUGH, true);
    expect(style.fontStyle).toBe(15);
  });
  test('fontStyle set without strike-through, unset strike-through', () => {
    const style: CellStyle = { fontStyle: 7 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.STRIKETHROUGH, false);
    expect(style.fontStyle).toBe(7);
  });

  test('fontStyle set with underline, set underline', () => {
    const style: CellStyle = { fontStyle: 6 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.UNDERLINE, true);
    expect(style.fontStyle).toBe(6);
  });
  test('fontStyle set with underline, unset underline', () => {
    const style: CellStyle = { fontStyle: 6 };
    setStyleFlag(style, 'fontStyle', FONT_STYLE_FLAG.UNDERLINE, false);
    expect(style.fontStyle).toBe(2);
  });
});

// In this test, we need a graph to have a view and ensure that the cell state is updated
test.each([
  ['BaseGraph', new BaseGraph()],
  ['Graph', createGraphWithoutPlugins()],
])('setCellStyleFlags on vertex using %s', (_name, graph) => {
  const style: CellStyle = { fontStyle: 4, spacing: 8 };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  setCellStyleFlags(
    graph.getDataModel(),
    [cell],
    'fontStyle',
    FONT_STYLE_FLAG.BOLD,
    true
  );
  expect(cell.style.fontStyle).toBe(5);
  expect(graph.getView().getState(cell)?.style?.fontStyle).toBe(5);
});

// In this test, we need a graph to have a view and ensure that the cell state is updated
test.each([
  ['BaseGraph', new BaseGraph()],
  ['Graph', createGraphWithoutPlugins()],
])('setCellStyles on vertex using %s', (_name, graph) => {
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
