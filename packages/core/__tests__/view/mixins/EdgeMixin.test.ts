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
import { createGraphWithoutContainer } from './utils';
import { Cell, type CellStyle, Geometry } from '../../../src';

describe('insertEdge', () => {
  test('with several parameters', () => {
    const graph = createGraphWithoutContainer();
    const source = new Cell();
    const target = new Cell();

    const style: CellStyle = { rounded: true, shape: 'line' };
    const cell = graph.insertEdge(null, 'edge_1', 'a value', source, target, style);
    expect(cell.getId()).toBe('edge_1');
    expect(cell.vertex).toBeFalsy();
    expect(cell.edge).toBeTruthy();
    expect(cell.value).toBe('a value');
    expect(cell.source).toBe(source);
    expect(cell.target).toBe(target);
    expect(cell.style).toStrictEqual(style);

    const geometry = new Geometry();
    geometry.relative = true;
    expect(cell.geometry).toStrictEqual(geometry);

    // parent created with cell as child
    expect(cell.parent).not.toBeNull();
    expect(cell.parent?.id).toBe('1'); // default parent
    const children = cell.parent?.children;
    expect(children).toContain(cell);
    expect(children).toHaveLength(1);

    // ensure that the cell is in the model
    const cellFromModel = graph.getDataModel().getCell('edge_1');
    expect(cellFromModel).toBe(cell);
  });

  test('with single parameter', () => {
    const graph = createGraphWithoutContainer();
    const source = new Cell();
    const target = new Cell();

    const style: CellStyle = { startArrow: 'oval', strokeColor: 'red' };
    const cell = graph.insertEdge({
      source,
      style,
      target,
      value: 'a value',
    });
    expect(cell.getId()).toBe('2'); // generated
    expect(cell.vertex).toBeFalsy();
    expect(cell.edge).toBeTruthy();
    expect(cell.value).toBe('a value');
    expect(cell.source).toBe(source);
    expect(cell.target).toBe(target);
    expect(cell.style).toStrictEqual(style);

    const geometry = new Geometry();
    geometry.relative = true;
    expect(cell.geometry).toStrictEqual(geometry);

    // parent created with cell as child
    expect(cell.parent).not.toBeNull();
    expect(cell.parent?.id).toBe('1'); // default parent
    const children = cell.parent?.children;
    expect(children).toContain(cell);
    expect(children).toHaveLength(1);

    // ensure that the cell is in the model
    const cellFromModel = graph.getDataModel().getCell('2');
    expect(cellFromModel).toBe(cell);
  });

  test('with single parameter and non default parent', () => {
    const graph = createGraphWithoutContainer();

    const parentCell = graph.insertVertex({
      value: 'non default',
      position: [10, 10],
      size: [400, 400],
    });
    expect(parentCell.getId()).toBe('2'); // generated
    expect(parentCell.value).toBe('non default');

    const childCell = graph.insertEdge({
      parent: parentCell,
    });
    expect(childCell.getId()).toBe('3'); // generated

    expect(childCell.parent).toBe(parentCell);
    const children = parentCell.children;
    expect(children).toContain(childCell);
    expect(children).toHaveLength(1);
  });
});
