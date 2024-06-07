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
import { cloneCells, getOpposites } from '../../src/util/cellArrayUtils';
import { IDENTITY_FIELD_NAME } from '../../src/util/Constants';
import Cell from '../../src/view/cell/Cell';
import { GraphDataModel } from '../../src/view/GraphDataModel';

describe('getOpposites', () => {
  const edges: Cell[] = [];
  const terminal = new Cell();

  // source == terminal
  const edge1 = new Cell();
  edge1.setTerminal(terminal, true);
  const oppositeOfMatchingSource = new Cell();
  edge1.setTerminal(oppositeOfMatchingSource, false);
  edges.push(edge1);
  // target == terminal
  const edge2 = new Cell();
  const oppositeOfMatchingTarget = new Cell();
  edge2.setTerminal(oppositeOfMatchingTarget, true);
  edge2.setTerminal(terminal, false);
  edges.push(edge2);
  // edge without source and target
  const edge3 = new Cell();
  edges.push(edge3);

  // edge with source matching terminal, but no target
  const edge4 = new Cell();
  edge4.setTerminal(terminal, true);
  edges.push(edge4);

  // edge with target matching terminal, but no target
  const edge5 = new Cell();
  edge5.setTerminal(terminal, false);
  edges.push(edge5);

  // edge with no match terminal
  const edge6 = new Cell();
  edge6.setTerminal(new Cell(), true);
  edge6.setTerminal(new Cell(), false);
  edges.push(edge6);

  test('include sources and targets', () => {
    expect(getOpposites(edges, terminal)).toStrictEqual([
      oppositeOfMatchingSource,
      oppositeOfMatchingTarget,
    ]);
  });

  test('include sources', () => {
    expect(getOpposites(edges, terminal, true, false)).toStrictEqual([
      oppositeOfMatchingTarget,
    ]);
  });

  test('include targets', () => {
    expect(getOpposites(edges, terminal, false, true)).toStrictEqual([
      oppositeOfMatchingSource,
    ]);
  });
});

describe('cloneCells', () => {
  test.each([true, false])(
    'cell without parent, without children and with terminals - including children: %s',
    (includeChildren) => {
      const cell = new Cell('main cell');
      const source = new Cell();
      expect(source.edges).toHaveLength(0); // untouched
      cell.setTerminal(source, true);
      const target = new Cell();
      cell.setTerminal(target, false);
      // @ts-ignore
      expect(cell[IDENTITY_FIELD_NAME]).toBeUndefined();

      const clones = cloneCells(includeChildren)([cell, source]);
      expect(clones).toHaveLength(2);

      expect(cell.getParent()).toBeNull(); // untouched
      expect(cell.getTerminal(true)).not.toBeNull(); // untouched
      expect(cell.getTerminal(false)).not.toBeNull(); // untouched
      cell.setTerminal(null, false); // not cloned, as not registered in test

      // @ts-ignore -- it has been added by cloneCells
      expect(cell[IDENTITY_FIELD_NAME]).toStrictEqual(expect.stringMatching('Cell#'));
      // @ts-ignore
      delete cell[IDENTITY_FIELD_NAME];
      // @ts-ignore -- it has been added by cloneCells
      expect(source[IDENTITY_FIELD_NAME]).toStrictEqual(expect.stringMatching('Cell#'));
      // @ts-ignore
      delete source[IDENTITY_FIELD_NAME];

      const clonedCell = clones[0];
      expect(clonedCell.source!.edges).toHaveLength(1); // it has been added by cloneCells
      clonedCell.source!.edges = [];
      expect(clonedCell).toStrictEqual(cell);

      const clonedSource = clones[1];
      expect(clonedSource).toStrictEqual(source);
    }
  );
});

describe('cloneCell', () => {
  // Tests are located here as they are similar to cloneCells test and cloneCell will be move out of GraphDataModel in the future
  const model = new GraphDataModel();

  test('null cell', () => {
    expect(model.cloneCell(null)).toBeNull();
  });

  describe('cell without children', () => {
    test.each([true, false])(
      'cell with parent and without terminal - including children: %s',
      (includeChildren) => {
        const cell = new Cell();
        cell.setParent(new Cell());
        // @ts-ignore
        expect(cell[IDENTITY_FIELD_NAME]).toBeUndefined();

        const clone = model.cloneCell(cell, includeChildren);
        expect(clone).not.toBe(cell); // this is not the same instance, but a new one

        expect(cell.getParent()).not.toBeNull(); // untouched
        cell.setParent(null); // not cloned, so remove for comparison
        // @ts-ignore -- it has been added by cloneCell
        expect(cell[IDENTITY_FIELD_NAME]).toStrictEqual(expect.stringMatching('Cell#'));
        // @ts-ignore
        delete cell[IDENTITY_FIELD_NAME];

        expect(clone).toStrictEqual(cell);
      }
    );

    test.each([true, false])(
      'cell without parent and with terminals - including children: %s',
      (includeChildren) => {
        const cell = new Cell();
        const source = new Cell();
        cell.setTerminal(source, true);
        const target = new Cell();
        cell.setTerminal(target, false);
        // @ts-ignore
        expect(cell[IDENTITY_FIELD_NAME]).toBeUndefined();

        const clone = model.cloneCell(cell, includeChildren);
        expect(clone).not.toBe(cell); // this is not the same instance, but a new one

        expect(cell.getParent()).toBeNull(); // untouched
        expect(cell.getTerminal(true)).not.toBeNull(); // untouched
        cell.setTerminal(null, true); // not cloned, as not registered in test
        expect(cell.getTerminal(false)).not.toBeNull(); // untouched
        cell.setTerminal(null, false); // not cloned, as not registered in test

        // @ts-ignore -- it has been added by cloneCell
        expect(cell[IDENTITY_FIELD_NAME]).toStrictEqual(expect.stringMatching('Cell#'));
        // @ts-ignore
        delete cell[IDENTITY_FIELD_NAME];

        expect(clone).toStrictEqual(cell);
      }
    );
  });
});
