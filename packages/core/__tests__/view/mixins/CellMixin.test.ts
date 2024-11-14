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
import { Cell, type CellStyle } from '../../../src';
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

describe('isAutoSizeCell', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isAutoSizeCell(new Cell())).toBeFalsy();
  });

  test('Using Cell with the "autoSize" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isAutoSizeCell(createCellWithStyle({ autoSize: true }))
    ).toBeTruthy();
  });

  test('Using Cell with the "autoSize" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isAutoSizeCell(createCellWithStyle({ autoSize: false }))
    ).toBeFalsy();
  });

  test('Cells not "autoSize" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setAutoSizeCells(false);
    expect(graph.isAutoSizeCell(new Cell())).toBeFalsy();
  });

  test('Cells "autoSize" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setAutoSizeCells(true);
    expect(graph.isAutoSizeCell(new Cell())).toBeTruthy();
  });
});

describe('isCellBendable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellBendable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "bendable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellBendable(createCellWithStyle({ bendable: true }))
    ).toBeTruthy();
  });

  test('Using Cell with the "bendable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellBendable(createCellWithStyle({ bendable: false }))
    ).toBeFalsy();
  });

  test('Cells not "bendable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsBendable(false);
    expect(graph.isCellBendable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsLocked(true);
    expect(graph.isCellBendable(new Cell())).toBeFalsy();
  });
});

describe('isCellCloneable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellCloneable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "cloneable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellCloneable(
        createCellWithStyle({ cloneable: true })
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "cloneable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellCloneable(
        createCellWithStyle({ cloneable: false })
      )
    ).toBeFalsy();
  });

  test('Cells not "cloneable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsCloneable(false);
    expect(graph.isCellCloneable(new Cell())).toBeFalsy();
  });
});

describe('isCellDeletable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellDeletable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "deletable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellDeletable(
        createCellWithStyle({ deletable: true })
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "deletable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellDeletable(
        createCellWithStyle({ deletable: false })
      )
    ).toBeFalsy();
  });

  test('Cells not "deletable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsDeletable(false);
    expect(graph.isCellDeletable(new Cell())).toBeFalsy();
  });
});

describe('isCellMovable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellMovable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "movable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellMovable(createCellWithStyle({ movable: true }))
    ).toBeTruthy();
  });

  test('Using Cell with the "movable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellMovable(createCellWithStyle({ movable: false }))
    ).toBeFalsy();
  });

  test('Cells not "movable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsMovable(false);
    expect(graph.isCellMovable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsLocked(true);
    expect(graph.isCellMovable(new Cell())).toBeFalsy();
  });
});

describe('isCellResizable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellResizable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "resizable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellResizable(
        createCellWithStyle({ resizable: true })
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "resizable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellResizable(
        createCellWithStyle({ resizable: false })
      )
    ).toBeFalsy();
  });

  test('Cells not "resizable" in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsResizable(false);
    expect(graph.isCellResizable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsLocked(true);
    expect(graph.isCellResizable(new Cell())).toBeFalsy();
  });
});

describe('isCellRotatable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellRotatable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "rotatable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellRotatable(
        createCellWithStyle({ rotatable: true })
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "rotatable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellRotatable(
        createCellWithStyle({ rotatable: false })
      )
    ).toBeFalsy();
  });
});
