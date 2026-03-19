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
import { BaseGraph, CellTracker } from '../../../src';

describe('destroy', () => {
  test('sets destroyed flag', () => {
    const graph = new BaseGraph();
    const tracker = new CellTracker(graph, '#00FF00');

    expect(tracker.destroyed).toBe(false);

    tracker.destroy();

    expect(tracker.destroyed).toBe(true);
  });

  test('removes mouse listener from graph', () => {
    const graph = new BaseGraph();
    const tracker = new CellTracker(graph, '#00FF00');

    expect(graph.mouseListeners).toContain(tracker);

    tracker.destroy();

    expect(graph.mouseListeners).not.toContain(tracker);
  });

  test('clears eventListeners', () => {
    const graph = new BaseGraph();
    const tracker = new CellTracker(graph, '#00FF00');
    tracker.addListener('testEvent', () => {});
    expect(tracker.eventListeners.length).toBeGreaterThan(0);

    tracker.destroy();

    expect(tracker.eventListeners).toHaveLength(0);
  });

  test('is idempotent', () => {
    const graph = new BaseGraph();
    const tracker = new CellTracker(graph, '#00FF00');

    tracker.destroy();
    tracker.destroy();

    expect(tracker.destroyed).toBe(true);
    expect(graph.mouseListeners).not.toContain(tracker);
  });
});
