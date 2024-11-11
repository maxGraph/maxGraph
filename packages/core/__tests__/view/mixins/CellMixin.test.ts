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
import {
  createGraphMockingGetCurrentCellStyle,
  createGraphWithoutPlugins,
} from '../../utils';
import { Cell, CellStyle } from '../../../src';
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
    expect(
      createGraphMockingGetCurrentCellStyle({}).isAutoSizeCell(new Cell())
    ).toBeFalsy();
  });

  test('Using Cell with the "autoSize" style property set to "true"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ autoSize: true }).isAutoSizeCell(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "autoSize" style property set to "false"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ cloneable: false }).isAutoSizeCell(
        new Cell()
      )
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
    expect(
      createGraphMockingGetCurrentCellStyle({}).isCellBendable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "bendable" style property set to "true"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ bendable: true }).isCellBendable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "bendable" style property set to "false"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ bendable: false }).isCellBendable(
        new Cell()
      )
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
    expect(
      createGraphMockingGetCurrentCellStyle({}).isCellCloneable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "cloneable" style property set to "true"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ cloneable: true }).isCellCloneable(
        new Cell()
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "cloneable" style property set to "false"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ cloneable: false }).isCellCloneable(
        new Cell()
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
    expect(
      createGraphMockingGetCurrentCellStyle({}).isCellDeletable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "deletable" style property set to "true"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ deletable: true }).isCellDeletable(
        new Cell()
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "deletable" style property set to "false"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ deletable: false }).isCellDeletable(
        new Cell()
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
    expect(
      createGraphMockingGetCurrentCellStyle({}).isCellMovable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "movable" style property set to "true"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ movable: true }).isCellMovable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "movable" style property set to "false"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ movable: false }).isCellMovable(new Cell())
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
    expect(
      createGraphMockingGetCurrentCellStyle({}).isCellResizable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "resizable" style property set to "true"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ resizable: true }).isCellResizable(
        new Cell()
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "resizable" style property set to "false"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ resizable: false }).isCellResizable(
        new Cell()
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
    expect(
      createGraphMockingGetCurrentCellStyle({}).isCellRotatable(new Cell())
    ).toBeTruthy();
  });

  test('Using Cell with the "rotatable" style property set to "true"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ rotatable: true }).isCellRotatable(
        new Cell()
      )
    ).toBeTruthy();
  });

  test('Using Cell with the "rotatable" style property set to "false"', () => {
    expect(
      createGraphMockingGetCurrentCellStyle({ rotatable: false }).isCellRotatable(
        new Cell()
      )
    ).toBeFalsy();
  });
});
