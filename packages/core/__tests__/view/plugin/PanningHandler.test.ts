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
import { BaseGraph, PanningHandler } from '../../../src';

describe('onDestroy', () => {
  test('PanningManager.destroy() is called when PanningHandler is destroyed', () => {
    const graph = new BaseGraph({ plugins: [PanningHandler] });
    const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
    const destroyMock = jest.fn(panningHandler.panningManager.destroy);
    panningHandler.panningManager.destroy = destroyMock;

    panningHandler.onDestroy();

    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  test('clears eventListeners', () => {
    const graph = new BaseGraph({ plugins: [PanningHandler] });
    const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
    panningHandler.addListener('testEvent', () => {});
    expect(panningHandler.eventListeners.length).toBeGreaterThan(0);

    panningHandler.onDestroy();

    expect(panningHandler.eventListeners).toHaveLength(0);
  });

  test('PanningManager.stop() is called during destroy to clear interval timer', () => {
    const graph = new BaseGraph({ plugins: [PanningHandler] });
    const panningHandler = graph.getPlugin<PanningHandler>('PanningHandler')!;
    const stopMock = jest.fn(panningHandler.panningManager.stop);
    panningHandler.panningManager.stop = stopMock;

    panningHandler.onDestroy();

    expect(stopMock).toHaveBeenCalledTimes(1);
  });
});
