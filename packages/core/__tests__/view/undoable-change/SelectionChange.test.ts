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

import { describe, expect, test } from '@jest/globals';
import { Cell, EventObject, InternalEvent, SelectionChange } from '../../../src';
import type { AbstractGraph } from '../../../src';

type CallLog = { kind: 'added' | 'removed'; cell: Cell };

const createGraphStub = () => {
  const calls: CallLog[] = [];
  const events: EventObject[] = [];
  const fakeModel = {
    cellAdded(cell: Cell) {
      calls.push({ kind: 'added', cell });
    },
    cellRemoved(cell: Cell) {
      calls.push({ kind: 'removed', cell });
    },
    fireEvent(evt: EventObject) {
      events.push(evt);
    },
  };
  const graph = {
    getSelectionModel: () => fakeModel,
  } as unknown as AbstractGraph;
  return { graph, calls, events };
};

describe('constructor', () => {
  test('defaults added and removed to empty arrays', () => {
    const { graph } = createGraphStub();
    const change = new SelectionChange(graph);
    expect(change.added).toEqual([]);
    expect(change.removed).toEqual([]);
    expect(change.graph).toBe(graph);
  });

  test('clones the input arrays so external mutation does not affect the change', () => {
    const { graph } = createGraphStub();
    const addedCell = new Cell();
    const removedCell = new Cell();
    const inputAdded = [addedCell];
    const inputRemoved = [removedCell];
    const change = new SelectionChange(graph, inputAdded, inputRemoved);

    inputAdded.push(new Cell());
    inputRemoved.push(new Cell());

    expect(change.added).toEqual([addedCell]);
    expect(change.removed).toEqual([removedCell]);
  });
});

describe('execute', () => {
  test('calls cellRemoved for each removed cell, then cellAdded for each added cell', () => {
    const { graph, calls } = createGraphStub();
    const firstAdded = new Cell();
    const secondAdded = new Cell();
    const removedCell = new Cell();
    const change = new SelectionChange(graph, [firstAdded, secondAdded], [removedCell]);

    change.execute();

    expect(calls).toEqual([
      { kind: 'removed', cell: removedCell },
      { kind: 'added', cell: firstAdded },
      { kind: 'added', cell: secondAdded },
    ]);
  });

  test('swaps added and removed after applying so the next execute reverses the change', () => {
    const { graph } = createGraphStub();
    const addedCell = new Cell();
    const removedCell = new Cell();
    const change = new SelectionChange(graph, [addedCell], [removedCell]);

    change.execute();

    expect(change.added).toEqual([removedCell]);
    expect(change.removed).toEqual([addedCell]);
  });

  test('two executes round-trip the change back to its original state', () => {
    const { graph, calls } = createGraphStub();
    const addedCell = new Cell();
    const removedCell = new Cell();
    const change = new SelectionChange(graph, [addedCell], [removedCell]);

    change.execute();
    change.execute();

    expect(change.added).toEqual([addedCell]);
    expect(change.removed).toEqual([removedCell]);
    expect(calls).toEqual([
      { kind: 'removed', cell: removedCell },
      { kind: 'added', cell: addedCell },
      { kind: 'removed', cell: addedCell },
      { kind: 'added', cell: removedCell },
    ]);
  });

  test('fires a CHANGE event whose payload uses the post-swap added and removed arrays', () => {
    const { graph, events } = createGraphStub();
    const addedCell = new Cell();
    const removedCell = new Cell();
    const change = new SelectionChange(graph, [addedCell], [removedCell]);

    change.execute();

    expect(events).toHaveLength(1);
    const evt = events[0];
    expect(evt.getName()).toBe(InternalEvent.CHANGE);
    expect(evt.getProperty('added')).toEqual([removedCell]);
    expect(evt.getProperty('removed')).toEqual([addedCell]);
  });

  test('fires a CHANGE event when constructed without added or removed cells', () => {
    const { graph, calls, events } = createGraphStub();
    const change = new SelectionChange(graph);

    change.execute();

    expect(calls).toEqual([]);
    expect(events).toHaveLength(1);
    expect(events[0].getName()).toBe(InternalEvent.CHANGE);
    expect(events[0].getProperty('added')).toEqual([]);
    expect(events[0].getProperty('removed')).toEqual([]);
  });
});
