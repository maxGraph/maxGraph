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
import { BaseGraph } from '../src';
import {
  createBaseGraph,
  createGraphWithoutContainer,
  createGraphWithoutPlugins,
  destroyCreatedGraphs,
  registerGraphForTeardown,
} from './utils';

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

  test('destroys every graph built since the previous call, and only once', () => {
    const graphs = [createGraphWithoutContainer(), createBaseGraph()];

    destroyCreatedGraphs();
    // A second call has nothing left to destroy, and must not throw on the already destroyed graphs
    destroyCreatedGraphs();

    expect(graphs.map((graph) => graph.destroyed)).toEqual([true, true]);
  });
});
