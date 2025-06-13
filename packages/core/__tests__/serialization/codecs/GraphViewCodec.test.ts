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

import { expect, test } from '@jest/globals';
import {
  BaseGraph,
  GraphView,
  registerCoreCodecs,
  unregisterAllCodecs,
} from '../../../src';
import Codec from '../../../src/serialization/Codec';
import { getPrettyXml, parseXml } from '../../../src/util/xmlUtils';

// TODO kind of duplication with all-graph-classes.test.ts, but this is a test for the GraphViewCodec
function exportGraphView(view: GraphView): string {
  const encodedNode = new Codec().encode(view);
  return getPrettyXml(encodedNode);
}

function importGraphView(view: GraphView, input: string): void {
  const doc = parseXml(input);
  new Codec(doc).decode(doc.documentElement, view);
}

function createGraphView(): GraphView {
  const graph = new BaseGraph();
  return new GraphView(graph);
}

// Prevents side effects between tests
beforeAll(() => {
  unregisterAllCodecs();
});
beforeEach(() => {
  registerCoreCodecs();
});
afterEach(() => {
  unregisterAllCodecs();
});

test('import', () => {
  const view = createGraphView();
  importGraphView(view, '<GraphView><Array as="cells" /></GraphView>');
});

test('export', () => {
  // TODO without registering the codec, we reproduce the "RangeError: Maximum call stack size exceeded" problem
  const view = createGraphView();
  const xml = exportGraphView(view);
  // TODO add cells to the model
  expect(xml).toEqual('yolo');
});
