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

import { expect } from '@jest/globals';
import type { Cell, CellStyle, Geometry, GraphDataModel } from '../../src';

interface ExpectCellProperties {
  geometry?: Geometry;
  /**
   * `Record<string, unknown>` is accepted in addition to {@link CellStyle} so that a test can state a decoded value
   * whose type contradicts the declared one, which is currently the case for every boolean property, without needing
   * a type suppression on each of them.
   */
  style?: CellStyle | Record<string, unknown>;
}

type NullableStringOrObject = string | object | null;

/**
 * Narrows the cell to a non nullish value, and fails loudly if it is not.
 *
 * Every call site has already asserted that the cell exists, so reaching the error means that assertion stopped
 * working. Throwing rather than returning matters: an early return would skip every assertion that follows and let
 * the test pass while checking nothing.
 */
function assertCellIsDefined(cell: Cell | null): asserts cell is Cell {
  if (!cell) {
    throw new Error(
      'The cell must be defined at this point, the assertions above it are expected to have failed first'
    );
  }
}

/**
 * Utility class to check the content of GraphDataModel.
 */
export class ModelChecker {
  constructor(private model: GraphDataModel) {}

  checkRootCells() {
    const cell0 = this.model.getCell('0');
    expect(cell0).toBeDefined();
    expect(cell0).not.toBeNull();
    expect(cell0?.parent).toBeNull();

    const cell1 = this.model.getCell('1');
    expect(cell1).toBeDefined();
    expect(cell1).not.toBeNull();
    expect(cell1?.parent).toBe(cell0);
  }

  checkCellsCount(count: number) {
    const cellIds = Object.getOwnPropertyNames(this.model.cells);
    expect(cellIds).toHaveLength(count);
  }

  expectIsVertex(
    cell: Cell | null,
    value: NullableStringOrObject,
    properties?: ExpectCellProperties
  ) {
    this.checkCellBaseProperties(cell, value, properties);
    assertCellIsDefined(cell);
    expect(cell.edge).toEqual(false);
    expect(cell.isEdge()).toBeFalsy();
    expect(cell.vertex).toEqual(true);
    expect(cell.isVertex()).toBeTruthy();
  }

  expectIsEdge(
    cell: Cell | null,
    value: NullableStringOrObject = null,
    properties?: ExpectCellProperties
  ) {
    this.checkCellBaseProperties(cell, value, properties);
    assertCellIsDefined(cell);
    expect(cell.edge).toEqual(true);
    expect(cell.isEdge()).toBeTruthy();
    expect(cell.vertex).toEqual(false);
    expect(cell.isVertex()).toBeFalsy();
  }

  private checkCellBaseProperties(
    cell: Cell | null,
    value: NullableStringOrObject,
    properties?: ExpectCellProperties
  ) {
    expect(cell).toBeDefined();
    expect(cell).not.toBeNull();
    assertCellIsDefined(cell);

    expect(cell.value).toEqual(value);
    expect(cell.getParent()?.id).toEqual('1'); // default parent id

    expect(cell.geometry).toEqual(properties?.geometry ?? null);
    expect(cell.style).toEqual(properties?.style ?? {});
  }
}
