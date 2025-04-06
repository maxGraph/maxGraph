/*
Copyright 2022-present The maxGraph project Contributors

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
import { Cell, GraphDataModel } from '../../src';

describe('filterCells', () => {
  const model: GraphDataModel = new GraphDataModel();

  test('Filter cells with a valid filter function', () => {
    const cell1 = new Cell();
    const cells = [cell1, new Cell()];
    const filter = (cell: Cell) => cell === cell1;
    const result = model.filterCells(cells, filter);
    expect(result).toEqual([cell1]);
  });

  test('Filter cells with an empty array', () => {
    const cells: Cell[] = [];
    const filter = (_cell: Cell) => true;
    const result = model.filterCells(cells, filter);
    expect(result).toEqual([]);
  });

  test('Filter cells with a filter function that returns false for all cells', () => {
    const cells = [new Cell(), new Cell()];
    const filter = (_cell: Cell) => false;
    const result = model.filterCells(cells, filter);
    expect(result).toEqual([]);
  });
});

describe('isLayer', () => {
  const model: GraphDataModel = new GraphDataModel();
  const root: Cell = new Cell();
  model.setRoot(root);

  test('Child is null', () => {
    expect(model.isLayer(null)).toBe(false);
  });

  test('Child is not null and is not layer', () => {
    expect(model.isLayer(new Cell())).toBe(false);
  });

  test('Child is not null and is layer', () => {
    const child = new Cell();
    root.children.push(child);
    child.setParent(root);
    expect(model.isLayer(child)).toBeTruthy();
  });
});
