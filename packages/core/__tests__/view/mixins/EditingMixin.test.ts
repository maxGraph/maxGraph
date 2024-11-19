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

import { describe, expect, test } from '@jest/globals';
import { createCellWithStyle, createGraphWithoutPlugins } from '../../utils';
import { Cell } from '../../../src';

describe('isCellEditable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellEditable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "editable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellEditable(createCellWithStyle({ editable: true }))
    ).toBeTruthy();
  });

  test('Using Cell with the "editable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellEditable(createCellWithStyle({ editable: false }))
    ).toBeFalsy();
  });

  test('Cells not editable in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsEditable(false);
    expect(graph.isCellEditable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsLocked(true);
    expect(graph.isCellEditable(new Cell())).toBeFalsy();
  });
});
