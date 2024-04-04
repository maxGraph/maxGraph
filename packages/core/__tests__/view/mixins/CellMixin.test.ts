/*
Copyright 2024-present The maxGraph project Contributors

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

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import type { CellStyle } from '../../../src';
import { FONT } from '../../../src/util/Constants';

test('setCellStyles on vertex', () => {
  const graph = createGraphWithoutPlugins();

  const style: CellStyle = { align: 'right', fillColor: 'red' };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  graph.setCellStyles('fillColor', 'blue', [cell]);
  expect(cell.style.fillColor).toBe('blue');
  expect(graph.getView().getState(cell)?.style?.fillColor).toBe('blue');
});

test('setCellStyleFlags on vertex', () => {
  const graph = createGraphWithoutPlugins();

  const style: CellStyle = { fontStyle: 3, fillColor: 'red' };
  const cell = graph.insertVertex({
    value: 'a value',
    x: 10,
    y: 20,
    size: [110, 120],
    style,
  });
  expect(cell.style).toStrictEqual(style);

  graph.setCellStyleFlags('fontStyle', FONT.UNDERLINE, null, [cell]);
  expect(cell.style.fontStyle).toBe(7);
  expect(graph.getView().getState(cell)?.style?.fontStyle).toBe(7);
});
