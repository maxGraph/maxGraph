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

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import {
  type Cell,
  type EventObject,
  InternalEvent,
  type UndoableChange,
} from '../../../src';

test('getSelectionCellsForChanges returns the cell of every change', () => {
  const graph = createGraphWithoutPlugins();
  const model = graph.getDataModel();
  let changes: UndoableChange[] = [];
  model.addListener(InternalEvent.CHANGE, (_sender: unknown, evt: EventObject) => {
    changes = evt.getProperty('edit').changes;
  });
  const cells: Cell[] = [];
  model.batchUpdate(() => {
    cells.push(
      graph.insertVertex({ value: 'first' }),
      graph.insertVertex({ value: 'last' })
    );
  });

  expect(graph.getSelectionCellsForChanges(changes)).toEqual(cells);
});
