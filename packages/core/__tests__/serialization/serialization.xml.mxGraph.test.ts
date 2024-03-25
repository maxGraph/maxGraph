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

describe('import mxGraph model', () => {
  test('Model with geometry', () => {
    const mxGraphModelAsXml = `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" vertex="1" parent="1" value="Vertex #2">
      <mxGeometry x="380" y="20" width="140" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="3" vertex="1" parent="1" value="Vertex #3">
      <mxGeometry x="200" y="80" width="380" height="30" as="geometry">
        <mxPoint x="1" y="1" as="offset"/>
      </mxGeometry>
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

    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(mxGraphModelAsXml);

    const modelChecker = new ModelChecker(model);

    modelChecker.checkRootCells();
    modelChecker.checkCellsCount(5);

    modelChecker.expectIsVertex(model.getCell('2'), 'Vertex #2', {
      geometry: new Geometry(380, 20, 140, 30),
    });

    const vertex3Geometry = new Geometry(200, 80, 380, 30);
    vertex3Geometry.offset = new Point(1, 1);
    modelChecker.expectIsVertex(model.getCell('3'), 'Vertex #3', {
      geometry: vertex3Geometry,
    });

    const edgeGeometry = new Geometry();
    edgeGeometry.points = [new Point(420, 60)];
    modelChecker.expectIsEdge(model.getCell('7'), 'Edge #7', {
      geometry: edgeGeometry,
    });
  });

  test('Model with style', () => {
    const xmlWithStyleAttribute = `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" vertex="1" parent="1" value="Vertex with style" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#E6E6E6;dashed=1;">
    </mxCell>
  </root>
</mxGraphModel>`;

    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(xmlWithStyleAttribute);

    const modelChecker = new ModelChecker(model);

    modelChecker.checkRootCells();
    modelChecker.checkCellsCount(3);
    modelChecker.expectIsVertex(model.getCell('2'), 'Vertex with style', {
      style: {
        // @ts-ignore FIX should be true
        dashed: 1,
        fillColor: '#E6E6E6',
        html: 1,
        // @ts-ignore FIX should be false
        rounded: 0,
        whiteSpace: 'wrap',
      },
    });
  });
});

describe('import model from draw.io', () => {
  test('from https://github.com/maxGraph/maxGraph/issues/221', () => {
    const model = new GraphDataModel();
    new ModelXmlSerializer(model)
      .import(`<mxGraphModel dx="1502" dy="926" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1"
              pageScale="1" pageWidth="1920" pageHeight="1200" math="0" shadow="0">
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2Ija7sB8CSz23ppRtK8d-5" value="PostgreSQL"
            style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontStyle=1;fontSize=27;"
            parent="1" vertex="1">
      <mxGeometry x="650" y="430" width="210" height="80" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`);

    const modelChecker = new ModelChecker(model);
    modelChecker.checkRootCells();
    modelChecker.checkCellsCount(3);
    modelChecker.expectIsVertex(model.getCell('2Ija7sB8CSz23ppRtK8d-5'), 'PostgreSQL', {
      geometry: new Geometry(650, 430, 210, 80),
      style: {
        fillColor: '#dae8fc',
        fontSize: 27,
        fontStyle: 1,
        html: 1,
        // @ts-ignore FIX should be false
        rounded: 0,
        strokeColor: '#6c8ebf',
        whiteSpace: 'wrap',
      },
    });
  });
});
