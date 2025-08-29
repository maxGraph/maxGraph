/*
Copyright 2025-present The maxGraph project Contributors

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

import { beforeEach, describe, expect, test } from '@jest/globals';

import Cell from '../../../src/view/cell/Cell';
import CellState from '../../../src/view/cell/CellState';
import SelectionHandler from '../../../src/view/plugins/SelectionHandler';
import { type AbstractGraph, BaseGraph } from '../../../src';

describe('addStates', () => {
  let graph: AbstractGraph;
  let plugin: SelectionHandler;

  beforeEach(() => {
    graph = new BaseGraph({ plugins: [SelectionHandler] });
    plugin = graph.getPlugin<SelectionHandler>('SelectionHandler')!;
  });

  test('add state for a single cell', () => {
    const cell = new Cell();
    const state = new CellState(graph.view, cell, {});
    graph.view.getState = () => state;

    const dict = new Map<Cell, CellState>();
    const count = plugin.addStates(cell, dict);

    expect(count).toBe(1);
    expect(dict.get(cell)).toBe(state);
  });

  test('do not add state if already present', () => {
    const cell = new Cell();
    const state = new CellState(graph.view, cell, {});
    graph.view.getState = () => state;

    const dict = new Map<Cell, CellState>();
    dict.set(cell, state);
    const count = plugin.addStates(cell, dict);

    expect(count).toBe(0);
  });

  test('recursively add states for child cells', () => {
    const parent = new Cell();
    const child = new Cell();
    parent.children = [child];

    const parentState = new CellState(graph.view, parent, {});
    const childState = new CellState(graph.view, child, {});
    graph.view.getState = (c) => (c === parent ? parentState : childState);

    const dict = new Map<Cell, CellState>();
    const count = plugin.addStates(parent, dict);

    expect(count).toBe(2);
    expect(dict.get(parent)).toBe(parentState);
    expect(dict.get(child)).toBe(childState);
  });

  test('return 0 if getState returns null', () => {
    const cell = new Cell();
    graph.view.getState = graph.view.getState = () => null;

    const dict = new Map<Cell, CellState>();
    const count = plugin.addStates(cell, dict);

    expect(count).toBe(0);
    expect(dict.size).toBe(0);
  });
});
