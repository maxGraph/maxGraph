/*
Copyright 2026-present The maxGraph project Contributors

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

import { afterEach, describe, expect, test } from '@jest/globals';
import {
  Cell,
  EventObject,
  GlobalConfig,
  InternalEvent,
  resetGlobalConfig,
  SelectionChange,
  UndoableEdit,
} from '../../src';
import GraphSelectionModel from '../../src/view/GraphSelectionModel';
import type { AbstractGraph } from '../../src';

const createModel = (isCellSelectable: (cell: Cell | null) => boolean = () => true) => {
  const graph = {
    isCellSelectable: (cell: Cell | null) =>
      cell == null ? false : isCellSelectable(cell),
    getSelectionModel: () => model,
  } as unknown as AbstractGraph;
  const model = new GraphSelectionModel(graph);
  return { graph, model };
};

const captureSelectionEvents = (model: GraphSelectionModel) => {
  const undo: EventObject[] = [];
  const change: EventObject[] = [];
  model.addListener(InternalEvent.UNDO, (_sender: unknown, evt: EventObject) => {
    undo.push(evt);
  });
  model.addListener(InternalEvent.CHANGE, (_sender: unknown, evt: EventObject) => {
    change.push(evt);
  });
  return { undo, change };
};

const seedSelection = (model: GraphSelectionModel, ...cells: Cell[]) => {
  cells.forEach((cell) => model.cellAdded(cell));
};

describe('constructor', () => {
  test('initializes empty selection and default flags', () => {
    const { graph, model } = createModel();
    expect(model.cells).toEqual([]);
    expect(model.singleSelection).toBe(false);
    expect(model.graph).toBe(graph);
  });

  describe('resource keys depending on i18n', () => {
    afterEach(() => {
      resetGlobalConfig();
    });

    test('default to empty strings when i18n is disabled', () => {
      const { model } = createModel();
      expect(model.doneResource).toBe('');
      expect(model.updatingSelectionResource).toBe('');
    });

    test('use the documented keys when i18n is enabled', () => {
      GlobalConfig.i18n = {
        isEnabled: () => true,
        get: () => null,
        addResource: () => {},
      };
      const { model } = createModel();
      expect(model.doneResource).toBe('done');
      expect(model.updatingSelectionResource).toBe('updatingSelection');
    });
  });
});

describe('isSelected and isEmpty', () => {
  test('isEmpty is true after construction', () => {
    const { model } = createModel();
    expect(model.isEmpty()).toBe(true);
  });

  test('isSelected returns true when the cell is in the selection, false otherwise', () => {
    const { model } = createModel();
    const cell = new Cell();
    seedSelection(model, cell);
    expect(model.isSelected(cell)).toBe(true);
    expect(model.isSelected(new Cell())).toBe(false);
    expect(model.isEmpty()).toBe(false);
  });
});

describe('getFirstSelectableCell', () => {
  test('returns the first selectable cell', () => {
    const nonSelectable = new Cell();
    const firstSelectable = new Cell();
    const secondSelectable = new Cell();
    const { model } = createModel(
      (cell) => cell === firstSelectable || cell === secondSelectable
    );
    expect(
      model.getFirstSelectableCell([nonSelectable, firstSelectable, secondSelectable])
    ).toBe(firstSelectable);
  });

  test('returns null when no cell is selectable', () => {
    const { model } = createModel(() => false);
    expect(model.getFirstSelectableCell([new Cell(), new Cell()])).toBeNull();
  });

  test('returns null for an empty array', () => {
    const { model } = createModel();
    expect(model.getFirstSelectableCell([])).toBeNull();
  });
});

describe('cellAdded and cellRemoved', () => {
  test('cellAdded pushes a new cell', () => {
    const { model } = createModel();
    const cell = new Cell();
    model.cellAdded(cell);
    expect(model.cells).toEqual([cell]);
  });

  test('cellAdded does not duplicate an already-present cell', () => {
    const { model } = createModel();
    const cell = new Cell();
    model.cellAdded(cell);
    model.cellAdded(cell);
    expect(model.cells).toEqual([cell]);
  });

  test('cellRemoved removes a present cell', () => {
    const { model } = createModel();
    const cellToRemove = new Cell();
    const remainingCell = new Cell();
    seedSelection(model, cellToRemove, remainingCell);
    model.cellRemoved(cellToRemove);
    expect(model.cells).toEqual([remainingCell]);
  });

  test('cellRemoved is a no-op for an absent cell', () => {
    const { model } = createModel();
    const presentCell = new Cell();
    const absentCell = new Cell();
    seedSelection(model, presentCell);
    model.cellRemoved(absentCell);
    expect(model.cells).toEqual([presentCell]);
  });
});

describe('setCell', () => {
  test('selects a single cell when given a selectable cell', () => {
    const { model } = createModel();
    const cell = new Cell();
    model.setCell(cell);
    expect(model.cells).toEqual([cell]);
  });

  test('clears the selection when given a falsy cell', () => {
    const { model } = createModel();
    seedSelection(model, new Cell());
    model.setCell(null as unknown as Cell);
    expect(model.cells).toEqual([]);
  });
});

describe('setCells', () => {
  test('selects all selectable cells', () => {
    const firstCell = new Cell();
    const secondCell = new Cell();
    const { model } = createModel();
    model.setCells([firstCell, secondCell]);
    expect(model.cells).toEqual([firstCell, secondCell]);
  });

  test('filters out non-selectable cells', () => {
    const selectable = new Cell();
    const nonSelectable = new Cell();
    const { model } = createModel((cell) => cell === selectable);
    model.setCells([selectable, nonSelectable]);
    expect(model.cells).toEqual([selectable]);
  });

  test('results in an empty selection when no cell is selectable', () => {
    const { model } = createModel(() => false);
    model.setCells([new Cell(), new Cell()]);
    expect(model.cells).toEqual([]);
  });

  test('in single-selection mode keeps only the first selectable cell, skipping non-selectable ones', () => {
    const nonSelectable = new Cell();
    const firstSelectable = new Cell();
    const secondSelectable = new Cell();
    const { model } = createModel((cell) => cell !== nonSelectable);
    model.setSingleSelection(true);
    model.setCells([nonSelectable, firstSelectable, secondSelectable]);
    expect(model.cells).toEqual([firstSelectable]);
  });

  test('results in an empty selection in single-selection mode when no cell is selectable', () => {
    const { model } = createModel(() => false);
    model.setSingleSelection(true);
    model.setCells([new Cell(), new Cell()]);
    expect(model.cells).toEqual([]);
  });
});

describe('addCell and addCells', () => {
  test('addCell appends a new cell to the existing selection', () => {
    const existingCell = new Cell();
    const newCell = new Cell();
    const { model } = createModel();
    seedSelection(model, existingCell);
    model.addCell(newCell);
    expect(model.cells).toEqual([existingCell, newCell]);
  });

  test('addCells deduplicates against the current selection', () => {
    const alreadySelected = new Cell();
    const sharedCell = new Cell();
    const newCell = new Cell();
    const { model } = createModel();
    seedSelection(model, alreadySelected, sharedCell);
    model.addCells([sharedCell, newCell]);
    expect(model.cells).toEqual([alreadySelected, sharedCell, newCell]);
  });

  test('addCells filters non-selectable candidates', () => {
    const selectable = new Cell();
    const nonSelectable = new Cell();
    const { model } = createModel((cell) => cell !== nonSelectable);
    model.addCells([selectable, nonSelectable]);
    expect(model.cells).toEqual([selectable]);
  });

  test('single-selection mode replaces the existing selection with the first selectable candidate', () => {
    const existingCell = new Cell();
    const firstCandidate = new Cell();
    const secondCandidate = new Cell();
    const { model } = createModel();
    seedSelection(model, existingCell);
    model.setSingleSelection(true);
    model.addCells([firstCandidate, secondCandidate]);
    expect(model.cells).toEqual([firstCandidate]);
  });

  test('single-selection mode clears the selection when no candidate is selectable', () => {
    const existingCell = new Cell();
    const { model } = createModel((cell) => cell === existingCell);
    seedSelection(model, existingCell);
    model.setSingleSelection(true);
    model.addCells([new Cell(), new Cell()]);
    expect(model.cells).toEqual([]);
  });

  // BUG (PR #1055): in single-selection mode, addCells unexpectedly clears the selection when the first
  // selectable candidate is the cell that is already selected. The expected behavior is a no-op (cells
  // unchanged, no event). The assertions below capture the CURRENT buggy behavior so the suite stays green;
  // they are regression sentinels and must be flipped when the follow-up fix lands.
  // See https://github.com/maxGraph/maxGraph/pull/1055#pullrequestreview-4217110916
  test.each([
    [
      'the already-selected cell is the only candidate',
      (existing: Cell, _other: Cell) => [existing],
    ],
    [
      'the already-selected cell is the first of multiple candidates',
      (existing: Cell, other: Cell) => [existing, other],
    ],
  ])(
    'BUG (#1055): single-selection mode clears the selection when %s',
    (_desc, buildInput) => {
      const existingCell = new Cell();
      const otherSelectable = new Cell();
      const { model } = createModel();
      seedSelection(model, existingCell);
      model.setSingleSelection(true);
      const { undo, change } = captureSelectionEvents(model);
      model.addCells(buildInput(existingCell, otherSelectable));
      expect(model.cells).toEqual([]);
      expect(undo).toHaveLength(1);
      expect(change).toHaveLength(1);
    }
  );
});

describe('removeCell and removeCells', () => {
  test('removeCell removes a currently-selected cell', () => {
    const cellToRemove = new Cell();
    const remainingCell = new Cell();
    const { model } = createModel();
    seedSelection(model, cellToRemove, remainingCell);
    model.removeCell(cellToRemove);
    expect(model.cells).toEqual([remainingCell]);
  });

  test('removeCells ignores cells that are not in the selection', () => {
    const remainingCell = new Cell();
    const selectedToRemove = new Cell();
    const unselectedCell = new Cell();
    const { model } = createModel();
    seedSelection(model, remainingCell, selectedToRemove);
    model.removeCells([selectedToRemove, unselectedCell]);
    expect(model.cells).toEqual([remainingCell]);
  });
});

describe('clear', () => {
  test('does nothing and fires no event when the selection is already empty', () => {
    const { model } = createModel();
    const { undo, change } = captureSelectionEvents(model);
    model.clear();
    expect(model.cells).toEqual([]);
    expect(undo).toHaveLength(0);
    expect(change).toHaveLength(0);
  });

  test('empties the selection and fires UNDO + CHANGE when non-empty', () => {
    const { model } = createModel();
    seedSelection(model, new Cell(), new Cell());
    const { undo, change } = captureSelectionEvents(model);
    model.clear();
    expect(model.cells).toEqual([]);
    expect(undo).toHaveLength(1);
    expect(change).toHaveLength(1);
  });
});

describe('changeSelection', () => {
  test('is a no-op when both arguments are null', () => {
    const { model } = createModel();
    const { undo, change } = captureSelectionEvents(model);
    model.changeSelection(null, null);
    expect(model.cells).toEqual([]);
    expect(undo).toHaveLength(0);
    expect(change).toHaveLength(0);
  });

  test('is a no-op when called without arguments', () => {
    const { model } = createModel();
    const { undo, change } = captureSelectionEvents(model);
    model.changeSelection();
    expect(model.cells).toEqual([]);
    expect(undo).toHaveLength(0);
    expect(change).toHaveLength(0);
  });

  test('is a no-op when both arrays are empty', () => {
    const { model } = createModel();
    const { undo, change } = captureSelectionEvents(model);
    model.changeSelection([], []);
    expect(undo).toHaveLength(0);
    expect(change).toHaveLength(0);
  });

  test('is a no-op when arrays only contain null entries (callers that bypass typing)', () => {
    const { model } = createModel();
    const { undo, change } = captureSelectionEvents(model);
    model.changeSelection(
      [null as unknown as Cell, null as unknown as Cell],
      [null as unknown as Cell]
    );
    expect(model.cells).toEqual([]);
    expect(undo).toHaveLength(0);
    expect(change).toHaveLength(0);
  });

  test('drops null entries while applying the real cells', () => {
    const { model } = createModel();
    const realCell = new Cell();
    const { undo, change } = captureSelectionEvents(model);
    model.changeSelection([realCell, null as unknown as Cell], null);
    expect(model.cells).toEqual([realCell]);
    expect(undo).toHaveLength(1);
    expect(change).toHaveLength(1);
  });

  test('adds the given cells and fires UNDO + CHANGE', () => {
    const { model } = createModel();
    const addedCell = new Cell();
    const { undo, change } = captureSelectionEvents(model);
    model.changeSelection([addedCell], null);
    expect(model.cells).toEqual([addedCell]);
    expect(undo).toHaveLength(1);
    expect(change).toHaveLength(1);
  });

  test('removes the given cells and fires UNDO + CHANGE', () => {
    const { model } = createModel();
    const removedCell = new Cell();
    const remainingCell = new Cell();
    seedSelection(model, removedCell, remainingCell);
    const { undo, change } = captureSelectionEvents(model);
    model.changeSelection(null, [removedCell]);
    expect(model.cells).toEqual([remainingCell]);
    expect(undo).toHaveLength(1);
    expect(change).toHaveLength(1);
  });

  test('applies both add and remove with a single UNDO + CHANGE pair', () => {
    const { model } = createModel();
    const removedCell = new Cell();
    const addedCell = new Cell();
    seedSelection(model, removedCell);
    const { undo, change } = captureSelectionEvents(model);
    model.changeSelection([addedCell], [removedCell]);
    expect(model.cells).toEqual([addedCell]);
    expect(undo).toHaveLength(1);
    expect(change).toHaveLength(1);
  });

  test('UNDO event carries an UndoableEdit containing one SelectionChange', () => {
    const { model } = createModel();
    const addedCell = new Cell();
    const { undo } = captureSelectionEvents(model);
    model.changeSelection([addedCell], null);

    expect(undo).toHaveLength(1);
    const edit = undo[0].getProperty('edit') as UndoableEdit;
    expect(edit).toBeInstanceOf(UndoableEdit);
    expect(edit.changes).toHaveLength(1);
    expect(edit.changes[0]).toBeInstanceOf(SelectionChange);
  });
});
