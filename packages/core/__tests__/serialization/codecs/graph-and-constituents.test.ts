/*
Copyright 2024-present The maxGraph project Contributors

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

import { afterEach, beforeAll, beforeEach, expect, test } from '@jest/globals';
import { createGraphWithoutContainer } from '../../utils';
import Codec from '../../../src/serialization/Codec';
import { getPrettyXml, parseXml } from '../../../src/util/xmlUtils';
import {
  type AbstractGraph,
  ImageBox,
  Rectangle,
  registerCoreCodecs,
  unregisterAllCodecs,
} from '../../../src';

function exportGraph(graph: AbstractGraph): string {
  const encodedNode = new Codec().encode(graph);
  return getPrettyXml(encodedNode);
}

function importGraph(graph: AbstractGraph, input: string): void {
  const doc = parseXml(input);
  new Codec(doc).decode(doc.documentElement, graph);
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

const graphAsXml = `<Graph>
  <Array as="cells" />
  <Array as="imageBundles" />
  <Array as="mouseListeners">
    <Object />
    <Object />
  </Array>
  <Array as="multiplicities" />
  <GraphDataModel as="model">
    <root>
      <Cell id="0">
        <Object as="style" />
      </Cell>
      <Cell id="1" parent="0">
        <Object as="style" />
      </Cell>
    </root>
  </GraphDataModel>
  <Stylesheet as="stylesheet" />
  <Rectangle _x="123" _y="453" _width="60" _height="60" as="pageFormat" />
  <ImageBox src="./warning.gif" width="16" height="16" as="warningImage" />
  <Object foldingEnabled="1" collapseToPreferredSize="1" as="options">
    <ImageBox src="./collapsed-new.gif" width="10" height="10" as="collapsedImage" />
    <ImageBox src="./expanded.gif" width="9" height="9" as="expandedImage" />
  </Object>
</Graph>
`;

test('Export Graph with default plugins', () => {
  // This graph uses default plugins
  const graph = createGraphWithoutContainer();
  // override defaults to ensure it is taken into account
  graph.pageFormat = new Rectangle(123, 453, 60, 60);
  graph.options.collapsedImage = new ImageBox('./collapsed-new.gif', 10, 10);

  expect(exportGraph(graph)).toBe(graphAsXml);
});

test('Import Graph', () => {
  // This graph uses default plugins
  const graph = createGraphWithoutContainer();
  // check default values that will be overridden by the import
  expect(graph.pageFormat).toEqual(new Rectangle(0, 0, 827, 1169));
  expect(graph.options.collapsedImage).toEqual(new ImageBox('./collapsed.gif', 9, 9));

  importGraph(graph, graphAsXml);

  // new values due to import
  expect(graph.pageFormat).toEqual(new Rectangle(123, 453, 60, 60));
  expect(graph.options.collapsedImage).toEqual(
    new ImageBox('./collapsed-new.gif', 10, 10)
  );
});
