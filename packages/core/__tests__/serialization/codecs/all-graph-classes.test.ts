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

import { afterEach, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { createGraphWithoutContainer } from '../../utils';
import {
  type AbstractGraph,
  BaseGraph,
  getDefaultPlugins,
  ImageBox,
  Multiplicity,
  Rectangle,
  registerCoreCodecs,
  unregisterAllCodecs,
} from '../../../src';
import { exportObject, importToObject } from './shared';

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

function buildXml(name: string): string {
  const xmlTemplate = `<@NAME@>
  <Object as="alternateEdgeStyle" />
  <Array as="cells" />
  <Array as="imageBundles" />
  <Array as="mouseListeners">
    <Object />
    <Object />
  </Array>
  <Array as="multiplicities">
    <Multiplicity type="rectangle" source="1" max="2" countError="Only 2 targets allowed" typeError="Only circle targets allowed">
      <Array as="validNeighbors">
        <add value="circle" />
      </Array>
    </Multiplicity>
  </Array>
  <Object foldingEnabled="1" collapseToPreferredSize="1" as="options">
    <ImageBox src="./collapsed-new.gif" width="10" height="10" as="collapsedImage" />
    <ImageBox src="./expanded.gif" width="9" height="9" as="expandedImage" />
  </Object>
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
  <Stylesheet as="stylesheet">
    <add as="defaultVertex">
      <add value="rectangle" as="shape" />
      <add value="rectanglePerimeter" as="perimeter" />
      <add value="middle" as="verticalAlign" />
      <add value="center" as="align" />
      <add value="#C3D9FF" as="fillColor" />
      <add value="#6482B9" as="strokeColor" />
      <add value="#774400" as="fontColor" />
    </add>
    <add as="defaultEdge">
      <add value="connector" as="shape" />
      <add value="classic" as="endArrow" />
      <add value="middle" as="verticalAlign" />
      <add value="center" as="align" />
      <add value="#6482B9" as="strokeColor" />
      <add value="#446299" as="fontColor" />
    </add>
  </Stylesheet>
  <Rectangle _x="123" _y="453" _width="60" _height="60" as="pageFormat" />
  <ImageBox src="./warning.gif" width="16" height="16" as="warningImage" />
</@NAME@>
`;

  return xmlTemplate.replace(/@NAME@/g, name);
}

describe.each([
  [
    'Graph',
    () => createGraphWithoutContainer(), // This graph uses default plugins
  ],
  ['BaseGraph', () => new BaseGraph({ plugins: getDefaultPlugins() })],
])('%s', (name, graphFactory: () => AbstractGraph) => {
  test('Export', () => {
    const graph = graphFactory();

    graph.multiplicities.push(
      new Multiplicity(
        true,
        'rectangle',
        null,
        null,
        0,
        2,
        ['circle'],
        'Only 2 targets allowed',
        'Only circle targets allowed'
      )
    );

    // override defaults to ensure it is taken into account
    graph.pageFormat = new Rectangle(123, 453, 60, 60);
    graph.options.collapsedImage = new ImageBox('./collapsed-new.gif', 10, 10);

    expect(exportObject(graph)).toBe(buildXml(name));
  });

  test('Import', () => {
    const graph = graphFactory();
    // check default values that will be overridden by the import
    expect(graph.pageFormat).toEqual(new Rectangle(0, 0, 827, 1169));
    expect(graph.options.collapsedImage).toEqual(new ImageBox('./collapsed.gif', 9, 9));

    importToObject(graph, buildXml(name));

    // new values due to import
    expect(graph.pageFormat).toEqual(new Rectangle(123, 453, 60, 60));
    expect(graph.options.collapsedImage).toEqual(
      new ImageBox('./collapsed-new.gif', 10, 10)
    );
  });
});
