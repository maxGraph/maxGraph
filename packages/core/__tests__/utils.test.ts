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
import { BaseGraph } from '../src';
import {
  createBaseGraph,
  createGraph,
  createGraphWithoutContainer,
  createGraphWithoutPlugins,
  destroyCreatedGraphs,
  registerGraphForTeardown,
} from './utils';

/** Builds a container attached to the document, as a test needing a view would. */
const createAttachedContainer = (): HTMLElement => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
};

describe('destroyCreatedGraphs', () => {
  test.each([
    ['createGraphWithoutContainer', createGraphWithoutContainer],
    ['createGraphWithoutPlugins', createGraphWithoutPlugins],
    ['createBaseGraph', createBaseGraph],
  ])('destroys the graph built by %s', (_description, createGraph) => {
    const graph = createGraph();
    expect(graph.destroyed).toBe(false);

    destroyCreatedGraphs();

    expect(graph.destroyed).toBe(true);
  });

  test('destroys a graph registered by hand and detaches its container', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const graph = registerGraphForTeardown(new BaseGraph({ container }));

    destroyCreatedGraphs();

    expect(graph.destroyed).toBe(true);
    expect(container.parentNode).toBeNull();
  });

  test('destroys the graph built by createGraph and detaches its container', () => {
    const container = createAttachedContainer();
    const graph = createGraph(container);

    destroyCreatedGraphs();

    expect(graph.destroyed).toBe(true);
    expect(container.parentNode).toBeNull();
  });

  test('detaches the container of a graph the test destroyed itself', () => {
    // `destroy()` sets `graph.container` to null, so the container has to be captured at registration time. Reading it
    // at teardown time would give null here, and leave the container attached for the rest of the file.
    const container = createAttachedContainer();
    const graph = createGraph(container);
    graph.destroy();

    destroyCreatedGraphs();

    expect(container.parentNode).toBeNull();
  });

  test('destroys every graph built since the previous call, and only once', () => {
    const graphs = [createGraphWithoutContainer(), createBaseGraph()];
    const destroySpies = graphs.map((graph) => jest.spyOn(graph, 'destroy'));

    destroyCreatedGraphs();
    // A second call has nothing left to destroy, and must not throw on the already destroyed graphs
    destroyCreatedGraphs();

    expect(graphs.map((graph) => graph.destroyed)).toEqual([true, true]);
    // `destroy()` guards on its own flag, so asserting `destroyed` alone would pass even if it ran twice
    expect(destroySpies.map((spy) => spy.mock.calls.length)).toEqual([1, 1]);
  });

  test('destroys the other graphs when one of them throws, and rethrows', () => {
    // The registry is drained before the loop, so an exception escaping it would leave the graphs registered after the
    // failing one alive and subscribed, which is exactly what the teardown exists to prevent.
    const failure = new Error('destroy failed');
    const failing = createBaseGraph();
    jest.spyOn(failing, 'destroy').mockImplementation(() => {
      throw failure;
    });
    const next = createBaseGraph();

    expect(() => destroyCreatedGraphs()).toThrow(failure);

    expect(next.destroyed).toBe(true);
  });

  test('removes from the document every listener the graph registered on it', () => {
    // This is what the teardown is for. Asserting `destroyed` only shows that `destroy()` was called, not what it
    // undid, so compare the (type, listener) pairs added while the graph is built with those removed while it is torn
    // down. The warm-up matters: jsdom's selector engine (nwsapi) subscribes to `mouseover` and `mouseout` on the
    // document on its first query and never unsubscribes, so triggering it here keeps that noise out of the spies.
    document.querySelector('div');

    const added: [string, unknown][] = [];
    const removed: [string, unknown][] = [];
    jest.spyOn(document, 'addEventListener').mockImplementation(((
      type: string,
      listener: unknown
    ) => {
      added.push([type, listener]);
    }) as never);
    jest.spyOn(document, 'removeEventListener').mockImplementation(((
      type: string,
      listener: unknown
    ) => {
      removed.push([type, listener]);
    }) as never);

    createGraph(createAttachedContainer());
    expect(added.length).toBeGreaterThan(0);

    destroyCreatedGraphs();

    const stillRegistered = added.filter(
      ([type, listener]) =>
        !removed.some(
          ([removedType, removedListener]) =>
            type === removedType && listener === removedListener
        )
    );
    expect(stillRegistered.map(([type]) => type)).toEqual([]);
  });
});

describe('the global afterEach of setup.ts', () => {
  // These two tests check the wiring itself. Without `setupFilesAfterEnv` pointing at `__tests__/setup.ts`, nothing
  // else in the suite would fail, since every other test either calls `destroyCreatedGraphs()` itself or does not
  // care. They have to stay adjacent and in this order, Jest runs the tests of a file sequentially.
  let graphLeftBehind: BaseGraph;

  test('builds a graph and leaves it to the teardown', () => {
    graphLeftBehind = createBaseGraph();

    expect(graphLeftBehind.destroyed).toBe(false);
  });

  test('destroyed the graph the previous test left behind', () => {
    expect(graphLeftBehind.destroyed).toBe(true);
  });
});
