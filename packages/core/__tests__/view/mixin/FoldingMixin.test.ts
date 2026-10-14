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
import { createCellWithStyle, createGraphWithoutPlugins } from '../../utils';
import { Cell, type CellStateStyle } from '../../../src';

const ignoredFoldableParameter = false;

function createCellWithChildren(style?: CellStateStyle): Cell {
  const cell = createCellWithStyle(style ?? {});
  cell.children.push(new Cell());
  return cell;
}

describe('isCellFoldable', () => {
  test('Using defaults, Cell without children', () => {
    expect(
      createGraphWithoutPlugins().isCellFoldable(new Cell(), ignoredFoldableParameter)
    ).toBeFalsy();
  });

  test('Using defaults, Cell with children', () => {
    const cell = createCellWithChildren();
    expect(
      createGraphWithoutPlugins().isCellFoldable(cell, ignoredFoldableParameter)
    ).toBeTruthy();
  });

  test('Using Cell with the "foldable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellFoldable(
        createCellWithChildren({ foldable: true }),
        ignoredFoldableParameter
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "foldable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellFoldable(
        createCellWithChildren({ foldable: false }),
        ignoredFoldableParameter
      )
    ).toBeFalsy();
  });
});

describe('cellsFolded', () => {
  test('collapse every given cell', () => {
    const graph = createGraphWithoutPlugins();
    const groups = [
      graph.insertVertex({ value: 'group 1', size: [100, 100] }),
      graph.insertVertex({ value: 'group 2', size: [100, 100] }),
    ];

    graph.cellsFolded(groups, true, false);

    expect(groups.map((group) => group.isCollapsed())).toEqual([true, true]);
  });
});
