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

import { describe, expect, jest, test } from '@jest/globals';
import { createGraphWithoutContainer } from '../../utils';
import { Cell, type CellStateStyle } from '../../../src';

describe('isCellEditable', () => {
  const createGraphMockingGetCurrentCellStyle = (cellIsEditable?: boolean) => {
    const graph = createGraphWithoutContainer();
    graph.getCurrentCellStyle = jest
      .fn<(cell: Cell, ignoreState?: boolean) => CellStateStyle>()
      .mockReturnValue(cellIsEditable !== undefined ? { editable: cellIsEditable } : {});
    return graph;
  };

  test('Using defaults', () => {
    expect(
      createGraphMockingGetCurrentCellStyle().isCellEditable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with "editable" property set to "true"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle(true).isCellEditable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with "editable" property set to "false"', () => {
    const graph = createGraphWithoutContainer();
    expect(
      createGraphMockingGetCurrentCellStyle(false).isCellEditable(new Cell())
    ).toBeFalsy();
  });

  test('Cells not editable in Graph', () => {
    const graph = createGraphWithoutContainer();
    graph.setCellsEditable(false);
    expect(graph.isCellEditable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutContainer();
    graph.setCellsLocked(true);
    expect(graph.isCellEditable(new Cell())).toBeFalsy();
  });
});
