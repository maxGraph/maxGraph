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
import { BaseGraph, SelectionCellsHandler } from '../../../src';
import { hasListener } from '../../utils';

describe('onDestroy', () => {
  test('removes refreshHandler from selectionModel', () => {
    const graph = new BaseGraph({ plugins: [SelectionCellsHandler] });
    const handler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
    const { refreshHandler } = handler;

    expect(hasListener(graph.getSelectionModel().eventListeners, refreshHandler)).toBe(
      true
    );

    handler.onDestroy();

    expect(hasListener(graph.getSelectionModel().eventListeners, refreshHandler)).toBe(
      false
    );
  });

  test('clears eventListeners', () => {
    const graph = new BaseGraph({ plugins: [SelectionCellsHandler] });
    const handler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
    handler.addListener('testEvent', () => {});
    expect(handler.eventListeners.length).toBeGreaterThan(0);

    handler.onDestroy();

    expect(handler.eventListeners).toHaveLength(0);
  });

  test('removes refreshHandler from dataModel', () => {
    const graph = new BaseGraph({ plugins: [SelectionCellsHandler] });
    const handler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
    const { refreshHandler } = handler;

    expect(hasListener(graph.getDataModel().eventListeners, refreshHandler)).toBe(true);

    handler.onDestroy();

    expect(hasListener(graph.getDataModel().eventListeners, refreshHandler)).toBe(false);
  });

  test('removes refreshHandler from view', () => {
    const graph = new BaseGraph({ plugins: [SelectionCellsHandler] });
    const handler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
    const { refreshHandler } = handler;

    expect(hasListener(graph.getView().eventListeners, refreshHandler)).toBe(true);

    handler.onDestroy();

    expect(hasListener(graph.getView().eventListeners, refreshHandler)).toBe(false);
  });
});
