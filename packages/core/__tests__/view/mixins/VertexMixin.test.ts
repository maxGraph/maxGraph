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
import { type CellStyle, Geometry } from '../../../src';

describe('insertVertex', () => {
  test('with several parameters', () => {
    const graph = createGraphWithoutContainer();
    const style: CellStyle = { rounded: true, shape: 'cloud' };
    const cell = graph.insertVertex(null, 'vertex_1', 'a value', 10, 20, 110, 120, style);
    expect(cell.getId()).toBe('vertex_1');
    expect(cell.vertex).toBeTruthy();
    expect(cell.edge).toBeFalsy();
    expect(cell.value).toBe('a value');
    expect(cell.style).toStrictEqual(style);

    const geometry = new Geometry(10, 20, 110, 120);
    geometry.relative = false;
    expect(cell.geometry).toStrictEqual(geometry);

    // parent created with cell as child
    expect(cell.parent).not.toBeNull();
    expect(cell.parent?.id).toBe('1'); // default parent
    const children = cell.parent?.children;
    expect(children).toContain(cell);
    expect(children).toHaveLength(1);

    // ensure that the cell is in the model
    const cellFromModel = graph.getDataModel().getCell('vertex_1');
    expect(cellFromModel).toBe(cell);
  });

  test('with single parameter', () => {
    const graph = createGraphWithoutContainer();
    const style: CellStyle = { align: 'right', fillColor: 'red' };
    const cell = graph.insertVertex({
      value: 'a value',
      x: 10,
      y: 20,
      size: [110, 120],
      style,
    });
    expect(cell.getId()).toBe('2'); // generated
    expect(cell.vertex).toBeTruthy();
    expect(cell.edge).toBeFalsy();
    expect(cell.value).toBe('a value');
    expect(cell.style).toStrictEqual(style);

    const geometry = new Geometry(10, 20, 110, 120);
    geometry.relative = false;
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

    const geometryOfParentCell = new Geometry(10, 10, 400, 400);
    expect(parentCell.geometry).toStrictEqual(geometryOfParentCell);

    const childCell = graph.insertVertex({
      parent: parentCell,
      value: 'child',
      position: [5, 5],
      width: 400,
      height: 400,
      relative: true,
    });
    const geometry = new Geometry(5, 5, 400, 400);
    geometry.relative = true;
    expect(childCell.geometry).toStrictEqual(geometry);

    expect(childCell.parent).toBe(parentCell);
    const children = parentCell.children;
    expect(children).toContain(childCell);
    expect(children).toHaveLength(1);
  });
});
