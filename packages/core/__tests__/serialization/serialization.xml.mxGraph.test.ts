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

import { describe, test } from '@jest/globals';
import { ModelChecker } from './utils';
import {
  CodecRegistry,
  Geometry,
  GraphDataModel,
  ModelXmlSerializer,
  Point,
} from '../../src';

function logRegistry(stage: string): void {
  console.info(
    `Codecs properties ${stage}:`,
    Object.getOwnPropertyNames(CodecRegistry.codecs)
  );
  console.info(`Codecs ${stage}:`, CodecRegistry.codecs);
  console.info(`Aliases ${stage}:`, CodecRegistry.aliases);
}

function logModelCells(model: GraphDataModel): void {
  console.info(
    '[logModelCells] cellIds in model:',
    Object.getOwnPropertyNames(model.cells)
  );
  console.info('[logModelCells] root cell:', model.root);
}

describe('import mxGraph model', () => {
  // TODO test geometry
  // TODO also test what happens when the style property is set --> dedicated model without geometry
  const mxGraphModelAsXml = `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" vertex="1" parent="1" value="Vertex #2">
      <mxGeometry x="380" y="20" width="140" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="3" vertex="1" parent="1" value="Vertex #3">
      <mxGeometry x="200" y="80" width="380" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="7" edge="1" source="2" target="3" parent="1" value="Edge #7">
      <mxGeometry as="geometry">
        <Array as="points">
          <Object x="420" y="60"/>
        </Array>
      </mxGeometry>
    </mxCell>
  </root>
</mxGraphModel>
  `;

  test('Model with geometry', () => {
    logRegistry('before');
    const model = new GraphDataModel();
    // logModelCells(model);
    new ModelXmlSerializer(model).import(mxGraphModelAsXml);
    // logModelCells(model);
    logRegistry('after');

    const modelChecker = new ModelChecker(model);

    modelChecker.checkRootCells();

    modelChecker.expectIsVertex(model.getCell('2'), 'Vertex #2', {
      geometry: new Geometry(380, 20, 140, 30),
    });

    modelChecker.expectIsVertex(model.getCell('3'), 'Vertex #3', {
      geometry: new Geometry(200, 80, 380, 30),
    });

    const edgeGeometry = new Geometry();
    // @ts-ignore TODO not correctly converted, should be new Point(420, 60)
    edgeGeometry.points = [{ x: 420, y: 60 }];
    modelChecker.expectIsEdge(model.getCell('7'), 'Edge #7', {
      geometry: edgeGeometry,
    });
  });

  // test('Model with style', () => {
  //   logRegistry('before');
  //   const model = new GraphDataModel();
  //   // logModelCells(model);
  //   new ModelXmlSerializer(model).import(mxGraphModelAsXml);
  //   // logModelCells(model);
  //   logRegistry('after');
  //
  //   const modelChecker = new ModelChecker(model);
  //
  //   modelChecker.checkRootCells();
  // });
});
