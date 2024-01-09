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

import { describe, expect, test } from '@jest/globals';
import { createGraphWithoutContainer } from '../utils';
import {
  Cell,
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

// TODO use ModelChecker used in other serialization tests
// also check style, geometry --> use a single parameter to check everything
class ModelChecker {
  constructor(private model: GraphDataModel) {}

  checkRootCells() {
    // TODO check cell 0 has no parent
    expect(this.model.getCell('0')).toBeDefined();
    // TODO check cell 0 is parent
    expect(this.model.getCell('1')).toBeDefined();
  }

  checkVertexBaseProperties(cell: Cell | null, value: string) {
    expect(cell).toBeDefined();
    // TODO do type infer as cell is defined at this point
    expect(cell?.value).toEqual(value);
    expect(cell?.edge).toEqual(false);
    expect(cell?.isEdge()).toBeFalsy();
    expect(cell?.vertex).toEqual(1); // FIX should be set to true
    expect(cell?.isVertex()).toBeTruthy();
    expect(cell?.getParent()?.id).toEqual('1');
  }

  checkEdgeBaseProperties(cell: Cell | null, value: string) {
    expect(cell).toBeDefined();
    // TODO do type infer as cell is defined at this point
    expect(cell?.value).toEqual(value);
    expect(cell?.edge).toEqual(1); // FIX should be set to true
    expect(cell?.isEdge()).toBeTruthy();
    expect(cell?.vertex).toEqual(false);
    expect(cell?.isVertex()).toBeFalsy();
    expect(cell?.getParent()?.id).toEqual('1');
  }
}

describe('import mxGraph model', () => {
  // TODO also test what happens when the style property is set
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

  test('Basic model', () => {
    const model = new GraphDataModel();
    logModelCells(model);
    new ModelXmlSerializer(model).import(mxGraphModelAsXml);
    logModelCells(model);

    const modelChecker = new ModelChecker(model);

    modelChecker.checkRootCells();

    const cell2 = model.getCell('2');
    modelChecker.checkVertexBaseProperties(cell2, 'Vertex #2');
    // expect(cell2?.geometry).toEqual(new Geometry(380, 20, 140, 30));  // TODO mxCell, same problem as with maxGraph model, <Element>(<unknown>cell?.geometry)

    const cell3 = model.getCell('3');
    modelChecker.checkVertexBaseProperties(cell3, 'Vertex #3');
    // expect(cell3?.geometry).toEqual(new Geometry(200, 80, 380, 30));  // TODO mxCell, same problem as with maxGraph model, <Element>(<unknown>cell?.geometry)

    const cell7 = model.getCell('7');
    modelChecker.checkEdgeBaseProperties(cell7, 'Edge #7');
    // expect(cell7?.geometry).toEqual(new Geometry(380, 20, 140, 30)); // TODO mxCell, same problem as with maxGraph model, <Element>(<unknown>cell?.geometry)
  });
});
