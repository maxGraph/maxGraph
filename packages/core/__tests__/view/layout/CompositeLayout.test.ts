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
import { CompositeLayout, GraphLayout } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';

describe('execute', () => {
  test('executes every layout on the parent', () => {
    const graph = createGraphWithoutContainer();
    const layouts = [
      new GraphLayout(graph),
      new GraphLayout(graph),
      new GraphLayout(graph),
    ];
    const executeSpies = layouts.map((layout) => jest.spyOn(layout, 'execute'));
    const parent = graph.getDefaultParent();

    new CompositeLayout(graph, layouts).execute(parent);

    for (const executeSpy of executeSpies) {
      expect(executeSpy.mock.calls).toEqual([[parent]]);
    }
  });
});
