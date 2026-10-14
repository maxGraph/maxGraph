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

import { expect, jest, test } from '@jest/globals';
import UndoManager from '../../../src/view/undoable-change/UndoManager';
import type UndoableEdit from '../../../src/view/undoable-change/UndoableEdit';

const createEdit = (): UndoableEdit => ({ die: jest.fn() }) as unknown as UndoableEdit;

test('trim makes every removed edit die', () => {
  const undoManager = new UndoManager();
  const keptEdit = createEdit();
  const removedEdits = [createEdit(), createEdit()];
  undoManager.history = [keptEdit, ...removedEdits];
  undoManager.indexOfNextAdd = 1;

  undoManager.trim();

  expect(undoManager.history).toEqual([keptEdit]);
  expect(keptEdit.die).not.toHaveBeenCalled();
  for (const removedEdit of removedEdits) {
    expect(removedEdit.die).toHaveBeenCalledTimes(1);
  }
});
