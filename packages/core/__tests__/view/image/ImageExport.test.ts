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

import { expect, test } from '@jest/globals';
import { ImageExport, Point, XmlCanvas2D } from '../../../src';
import { createXmlDocument, getPrettyXml } from '../../../src/util/xmlUtils';
import { createGraphWithoutContainer } from '../../utils';

test('export with XmlCanvas2D', () => {
  const graph = createGraphWithoutContainer();
  const parent = graph.getDefaultParent();

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      id: 'v1',
      value: 'vertex 1',
      position: [0, 0],
      size: [80, 30],
    });
    const v2 = graph.insertVertex({
      parent,
      id: 'v2',
      value: 'vertex 2',
      position: [100, 100],
      size: [80, 30],
    });

    graph.insertEdge(parent, null, '', v1, v2);
    const e1 = graph.insertEdge({
      parent,
      id: 'e1',
      value: 'edge 1',
      source: v1,
      target: v2,
    });
    e1.geometry!.points = [new Point(50, 50)];
  });

  const xmlDoc = createXmlDocument();
  const root = xmlDoc.createElement('data');
  xmlDoc.appendChild(root);

  const xmlCanvas = new XmlCanvas2D(root);
  const imgExport = new ImageExport();

  imgExport.drawState(graph.getView().getState(graph.model.root!)!, xmlCanvas);
  const xml = getPrettyXml(root);

  expect(xml).toBe(`<data>
  <fontfamily family="Arial,Helvetica" />
  <fontsize size="11" />
  <shadowcolor color="gray" />
  <shadowalpha alpha="1" />
  <shadowoffset dx="2" dy="3" />
</data>
`);
});
