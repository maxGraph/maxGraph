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

import { describe, expect, jest, test } from '@jest/globals';
import { BaseGraph, GraphLayout, LayoutManager } from '../../../src';
import { createContainer } from '../../utils';

describe('destroy', () => {
  test('clears eventListeners', () => {
    const graph = new BaseGraph();
    const manager = new LayoutManager(graph);
    manager.addListener('testEvent', () => {});
    expect(manager.eventListeners.length).toBeGreaterThan(0);

    manager.destroy();

    expect(manager.eventListeners).toHaveLength(0);
  });
});

describe('cellsMoved', () => {
  test('lets the layout of the parent of every cell move it to the mouse location', () => {
    const graph = new BaseGraph({ container: createContainer({}) });
    const cells = [
      graph.insertVertex({ value: 'a' }),
      graph.insertVertex({ value: 'b' }),
      graph.insertVertex({ value: 'c' }),
    ];
    const layout = new GraphLayout(graph);
    const moveCellSpy = jest.spyOn(layout, 'moveCell');
    const manager = new LayoutManager(graph);
    manager.getLayout = () => layout;

    manager.cellsMoved(cells, new MouseEvent('mouseup', { clientX: 10, clientY: 20 }));

    expect(moveCellSpy.mock.calls).toEqual(cells.map((cell) => [cell, 10, 20]));
  });
});
