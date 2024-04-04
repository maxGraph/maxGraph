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
  setCellStyleFlags,
  setCellStyles,
} from '../../src/util/styleUtils';
import { FONT } from '../../src/util/Constants';
import { createGraphWithoutPlugins } from '../utils';
import type { CellStyle } from '../../src';

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
