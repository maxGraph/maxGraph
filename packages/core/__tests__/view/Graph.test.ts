/*
Copyright 2023-present The maxGraph project Contributors

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

import { describe, test, expect } from '@jest/globals';
import { Cell, Graph } from '../../src';
import { createGraphWithoutPlugins } from '../utils';

test('setTooltips - the "TooltipHandler" plugin is not available', () => {
  const graph = createGraphWithoutPlugins();
  // just validate there is no error in this case
  graph.setTooltips(true);
});

describe('Expect no global state for properties coming from mixins', () => {
  // Even though SelectionMixin declares `selectionModel: null` on the prototype,
  // the null value is harmless because Graph.initializeCollaborators calls
  // this.setSelectionModel(this.createSelectionModel()). The assignment creates
  // a per-instance property that shadows the prototype null, and GraphSelectionModel's
  // constructor allocates its own `cells = []` array.
  test('selectionModel', () => {
    const graph1 = new Graph();
    const graph2 = new Graph();

    expect(graph1.getSelectionModel()).not.toBe(graph2.getSelectionModel());

    graph1.getSelectionModel().cells.push(new Cell());
    expect(graph2.getSelectionModel().cells).toStrictEqual([]);
    expect(graph1.getSelectionModel().cells).not.toBe(graph2.getSelectionModel().cells);
  });
});
