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

import { describe, expect, test } from '@jest/globals';
import { Editor, Geometry } from '../../src';
import { ModelChecker } from '../serialization/utils';
import { parseXml } from '../../src/util/xmlUtils';

describe('writeGraphModel', () => {
  test('empty model', () => {
    const editor = new Editor(null!);

    const xml = editor.writeGraphModel();
    expect(xml).toBe(
      '<GraphDataModel><root><Cell id="0"><Object as="style"/></Cell><Cell id="1" parent="0"><Object as="style"/></Cell></root></GraphDataModel>'
    );
  });

  test('non empty model, write with default linefeed', () => {
    const editor = new Editor(null!);
    editor.graph.insertVertex({
      id: 'v1',
      value: 'vertex 1\nwith linefeed',
      position: [10, 20],
      size: [30, 30],
    });

    const xml = editor.writeGraphModel();
    expect(xml).toBe(
      '<GraphDataModel><root><Cell id="0"><Object as="style"/></Cell><Cell id="1" parent="0"><Object as="style"/></Cell><Cell id="v1" value="vertex 1&#xA;with linefeed" vertex="1" parent="1"><Geometry _x="10" _y="20" _width="30" _height="30" as="geometry"/><Object as="style"/></Cell></root></GraphDataModel>'
    );
  });

  test('non empty model, write with custom linefeed', () => {
    const editor = new Editor(null!);
    editor.graph.insertVertex({
      id: 'v1',
      value: 'vertex 1\nwith linefeed\nand others\nagain',
      position: [0, 0],
      size: [20, 30],
    });

    // The linefeed parameter should be removed from the method signature
    // In maxGraph, the getXml function ignores the linefeed as it always uses XmlSerializer
    // In mxGraph, it was only taken into account in Internet Explorer which used a custom serialization code
    // The test here has been written prior switching the writeGraphModel implementation from direct Codec usage to ModelXmlSerializer
    const xml = editor.writeGraphModel('LF');
    expect(xml).toBe(
      '<GraphDataModel><root><Cell id="0"><Object as="style"/></Cell><Cell id="1" parent="0"><Object as="style"/></Cell><Cell id="v1" value="vertex 1&#xA;with linefeed&#xA;and others&#xA;again" vertex="1" parent="1"><Geometry _width="20" _height="30" as="geometry"/><Object as="style"/></Cell></root></GraphDataModel>'
    );
  });
});

test('readGraphModel', () => {
  const editor = new Editor(null!);

  const xmlDocument = parseXml(
    `<GraphDataModel>
  <root>
    <Cell id="0">
      <Object as="style" />
    </Cell>
    <Cell id="1" parent="0">
      <Object as="style" />
    </Cell>
    <Cell id="v1" value="vertex 1" vertex="1" parent="1">
      <Geometry _x="100" _y="100" _width="100" _height="80" as="geometry" />
      <Object fillColor="green" strokeWidth="4" as="style" />
    </Cell>
  </root>
</GraphDataModel>`
  );

  editor.readGraphModel(xmlDocument.documentElement);
  const model = editor.graph.model;

  const modelChecker = new ModelChecker(model);
  modelChecker.checkRootCells();

  modelChecker.expectIsVertex(model.getCell('v1'), 'vertex 1', {
    geometry: new Geometry(100, 100, 100, 80),
    style: {
      fillColor: 'green',
      strokeWidth: 4,
    },
  });
});
