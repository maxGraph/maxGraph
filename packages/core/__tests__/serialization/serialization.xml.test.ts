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
import { ModelChecker } from './utils';
import { createGraphWithoutContainer } from '../utils';
import {
  Cell,
  EdgeStyle,
  Geometry,
  GraphDataModel,
  ModelXmlSerializer,
  Point,
} from '../../src';

// inspired by VertexMixin.createVertex
const newVertex = (id: string, value: string) => {
  const vertex = new Cell(value);
  vertex.setId(id);
  vertex.setVertex(true);
  return vertex;
};

// inspired by EdgeMixin.createEdge
const newEdge = (id: string, value: string) => {
  const edge = new Cell(value, new Geometry());
  edge.setId(id);
  edge.setEdge(true);
  return edge;
};

const getParent = (model: GraphDataModel) => {
  // As done in the Graph object
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- here we know that model is not null
  return model.getRoot()!.getChildAt(0);
};

// Adapted from https://github.com/maxGraph/maxGraph/issues/178
const xmlWithSingleVertex = `<GraphDataModel>
    <root>
        <Cell id="0">
            <Object as="style"/>
        </Cell>
        <Cell id="1" parent="0">
            <Object as="style"/>
        </Cell>
        <Cell id="B_#0" value="rootNode" vertex="1" parent="1">
            <Geometry _x="100" _y="100" _width="100" _height="80" as="geometry"/>
            <!-- not in the xml of issue 178, same issue as with Geometry -->
            <Object fillColor="green" strokeWidth="4" shape="triangle" as="style" />
        </Cell>
    </root>
</GraphDataModel>`;

const xmlWithVerticesAndEdges = `<GraphDataModel>
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
    <Cell id="v2" value="vertex 2" vertex="1" parent="1">
      <Geometry _x="200" _y="50" _width="30" _height="100" as="geometry">
        <Point _x="30" _y="40" as="offset" />
      </Geometry>
      <Object bendable="0" rounded="1" fontColor="yellow" as="style" />
    </Cell>
    <Cell id="e1" edge="1" parent="1" source="v1" target="v2">
      <Geometry as="geometry">
        <Array as="points">
          <Point _y="10" />
          <Point _y="40" />
          <Point _x="40" _y="40" />
        </Array>
      </Geometry>
      <Object as="style" />
    </Cell>
  </root>
</GraphDataModel>
`;

test('Check the content of an empty GraphDataModel', () => {
  const modelChecker = new ModelChecker(new GraphDataModel());
  // Ensure that we have the same content as after an import
  modelChecker.checkRootCells();
});

describe('import before the export (reproduce https://github.com/maxGraph/maxGraph/issues/178)', () => {
  test('only use GraphDataModel', () => {
    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(xmlWithVerticesAndEdges);

    const modelChecker = new ModelChecker(model);
    modelChecker.checkRootCells();

    modelChecker.expectIsVertex(model.getCell('v1'), 'vertex 1', {
      geometry: new Geometry(100, 100, 100, 80),
      style: {
        fillColor: 'green',
        strokeWidth: 4,
      },
    });

    const vertexGeometry = new Geometry(200, 50, 30, 100);
    vertexGeometry.offset = new Point(30, 40);
    modelChecker.expectIsVertex(model.getCell('v2'), 'vertex 2', {
      style: {
        // @ts-ignore FIX should be false
        bendable: 0,
        fontColor: 'yellow',
        // @ts-ignore FIX should be true
        rounded: 1,
      },
      geometry: vertexGeometry,
    });

    const edgeGeometry = new Geometry();
    edgeGeometry.points = [new Point(0, 10), new Point(0, 40), new Point(40, 40)];
    modelChecker.expectIsEdge(model.getCell('e1'), null, {
      geometry: edgeGeometry,
    });
  });

  test('use Graph - was failing in issue 178', () => {
    const graph = createGraphWithoutContainer();
    const model = graph.getDataModel();
    new ModelXmlSerializer(model).import(xmlWithSingleVertex);

    const modelChecker = new ModelChecker(model);
    modelChecker.checkRootCells();
    modelChecker.checkCellsCount(3);

    modelChecker.expectIsVertex(model.getCell('B_#0'), 'rootNode', {
      geometry: new Geometry(100, 100, 100, 80),
      style: { fillColor: 'green', shape: 'triangle', strokeWidth: 4 },
    });
  });
});

test('Import then export - expect the same xml content', () => {
  const model = new GraphDataModel();
  const serializer = new ModelXmlSerializer(model);
  serializer.import(xmlWithVerticesAndEdges);
  const exportedXml = serializer.export();
  expect(exportedXml).toEqual(xmlWithVerticesAndEdges);
});

describe('export', () => {
  test('empty model exported as pretty XML', () => {
    expect(new ModelXmlSerializer(new GraphDataModel()).export()).toEqual(
      `<GraphDataModel>
  <root>
    <Cell id="0">
      <Object as="style" />
    </Cell>
    <Cell id="1" parent="0">
      <Object as="style" />
    </Cell>
  </root>
</GraphDataModel>
`
    );
  });

  test('empty model exported as non pretty XML', () => {
    expect(
      new ModelXmlSerializer(new GraphDataModel()).export({ pretty: false })
    ).toEqual(
      `<GraphDataModel><root><Cell id="0"><Object as="style"/></Cell><Cell id="1" parent="0"><Object as="style"/></Cell></root></GraphDataModel>`
    );
  });

  test('model with 2 vertices linked with an edge', () => {
    const model = new GraphDataModel();
    const parent = getParent(model);

    const v1 = newVertex('v1', 'vertex 1');
    model.add(parent, v1);
    v1.setStyle({ fillColor: 'green', strokeWidth: 4 });
    v1.geometry = new Geometry(100, 100, 100, 80);
    v1.geometry.offset = new Point(10, 12);
    const v2 = newVertex('v2', 'vertex 2');
    v2.style = {
      bendable: false,
      rounded: true,
      fontColor: 'yellow',
      baseStyleNames: ['style1', 'style2'],
    };
    model.add(parent, v2);

    const edge = newEdge('e1', 'edge');
    model.add(parent, edge);
    model.setTerminal(edge, v1, true);
    model.setTerminal(edge, v2, false);
    (<Geometry>edge.geometry).points = [
      new Point(0, 10),
      new Point(0, 40),
      new Point(40, 40),
    ];

    // FIX boolean values should be set to true/false instead of 1/0
    expect(new ModelXmlSerializer(model).export()).toEqual(
      `<GraphDataModel>
  <root>
    <Cell id="0">
      <Object as="style" />
    </Cell>
    <Cell id="1" parent="0">
      <Object as="style" />
    </Cell>
    <Cell id="v1" value="vertex 1" vertex="1" parent="1">
      <Geometry _x="100" _y="100" _width="100" _height="80" as="geometry">
        <Point _x="10" _y="12" as="offset" />
      </Geometry>
      <Object fillColor="green" strokeWidth="4" as="style" />
    </Cell>
    <Cell id="v2" value="vertex 2" vertex="1" parent="1">
      <Object bendable="0" rounded="1" fontColor="yellow" as="style">
        <Array as="baseStyleNames">
          <add value="style1" />
          <add value="style2" />
        </Array>
      </Object>
    </Cell>
    <Cell id="e1" value="edge" edge="1" parent="1" source="v1" target="v2">
      <Geometry as="geometry">
        <Array as="points">
          <Point _y="10" />
          <Point _y="40" />
          <Point _x="40" _y="40" />
        </Array>
      </Geometry>
      <Object as="style" />
    </Cell>
  </root>
</GraphDataModel>
`
    );
  });

  test('model with edges using style.edgeStyle', () => {
    const model = new GraphDataModel();
    const parent = getParent(model);

    const vertex1 = newVertex('v1', 'vertex 1');
    model.add(parent, vertex1);
    const vertex2 = newVertex('v2', 'vertex 2');
    model.add(parent, vertex2);

    const edge1 = newEdge('e1', 'edge 1');
    // when passing a function for the edgeStyle, it is not serialized
    edge1.setStyle({ edgeStyle: EdgeStyle.ElbowConnector, strokeColor: 'green' });
    model.add(parent, edge1);
    model.setTerminal(edge1, vertex1, true);
    model.setTerminal(edge1, vertex2, false);

    const edge2 = newEdge('e2', 'edge 2');
    edge2.setStyle({ edgeStyle: 'manhattanEdgeStyle', strokeColor: 'orange' });
    model.add(parent, edge2);
    model.setTerminal(edge2, vertex1, false);
    model.setTerminal(edge2, vertex2, true);

    // FIX boolean values should be set to true/false instead of 1/0
    expect(new ModelXmlSerializer(model).export()).toEqual(
      `<GraphDataModel>
  <root>
    <Cell id="0">
      <Object as="style" />
    </Cell>
    <Cell id="1" parent="0">
      <Object as="style" />
    </Cell>
    <Cell id="v1" value="vertex 1" vertex="1" parent="1">
      <Object as="style" />
    </Cell>
    <Cell id="v2" value="vertex 2" vertex="1" parent="1">
      <Object as="style" />
    </Cell>
    <Cell id="e1" value="edge 1" edge="1" parent="1" source="v1" target="v2">
      <Geometry as="geometry" />
      <Object strokeColor="green" as="style" />
    </Cell>
    <Cell id="e2" value="edge 2" edge="1" parent="1" source="v2" target="v1">
      <Geometry as="geometry" />
      <Object edgeStyle="manhattanEdgeStyle" strokeColor="orange" as="style" />
    </Cell>
  </root>
</GraphDataModel>
`
    );
  });
});

describe('import after export', () => {
  test('only use GraphDataModel with xml containing a single vertex', () => {
    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(xmlWithSingleVertex);

    const modelChecker = new ModelChecker(model);
    modelChecker.checkRootCells();
    modelChecker.checkCellsCount(3);

    modelChecker.expectIsVertex(model.getCell('B_#0'), 'rootNode', {
      geometry: new Geometry(100, 100, 100, 80),
      style: { fillColor: 'green', shape: 'triangle', strokeWidth: 4 },
    });
  });

  test('Cell with baseStyleNames style attribute', () => {
    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(
      `<GraphDataModel>
      <root>
          <Cell id="0">
              <Object as="style"/>
          </Cell>
          <Cell id="1" parent="0">
              <Object as="style"/>
          </Cell>
          <Cell id="cell-1" vertex="1" parent="1">
              <Object entryPerimeter="1" shadow="1" as="style">
                <Array as="baseStyleNames">
                  <add value="style1" />
                </Array>
              </Object>
          </Cell>
      </root>
  </GraphDataModel>`
    );

    const modelChecker = new ModelChecker(model);
    modelChecker.checkRootCells();
    modelChecker.checkCellsCount(3);

    modelChecker.expectIsVertex(model.getCell('cell-1'), null, {
      style: {
        baseStyleNames: ['style1'],
        // @ts-ignore FIX should be true
        entryPerimeter: 1,
        // @ts-ignore FIX should be true
        shadow: 1,
      },
    });
  });
});
