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
import { Cell, Geometry, GraphDataModel, ModelXmlSerializer, Point } from '../../src';

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
const xmlFromIssue178 = `<GraphDataModel>
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

describe('import before the export (reproduce https://github.com/maxGraph/maxGraph/issues/178)', () => {
  test('only use GraphDataModel', () => {
    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(xmlFromIssue178);

    const cell = model.getCell('B_#0');
    expect(cell).not.toBeNull();
    expect(cell?.value).toEqual('rootNode');
    expect(cell?.vertex).toEqual(1); // FIX should be set to true
    expect(cell?.isVertex()).toBeTruthy();
    expect(cell?.getParent()?.id).toEqual('1');
    const geometry = <Element>(<unknown>cell?.geometry); // FIX should be new Geometry(100, 100, 100, 80)
    expect(geometry.getAttribute('_x')).toEqual('100');
    expect(geometry.getAttribute('_y')).toEqual('100');
    expect(geometry.getAttribute('_height')).toEqual('80');
    expect(geometry.getAttribute('_width')).toEqual('100');

    const style = <Element>(<unknown>cell?.style); // FIX should be { fillColor: 'green', shape: 'triangle', strokeWidth: 4, }
    expect(style.getAttribute('fillColor')).toEqual('green');
    expect(style.getAttribute('shape')).toEqual('triangle');
    expect(style.getAttribute('strokeWidth')).toEqual('4');
  });

  test('use Graph - reproduced what is described in issue 178', () => {
    const graph = createGraphWithoutContainer();
    expect(() =>
      new ModelXmlSerializer(graph.getDataModel()).import(xmlFromIssue178)
    ).toThrow(new Error('Invalid x supplied.'));
  });
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
      `<GraphDataModel><root><Cell id="0"><Object as="style" /></Cell><Cell id="1" parent="0"><Object as="style" /></Cell></root></GraphDataModel>`
    );
  });

  test('model with 2 vertices linked with an edge', () => {
    const model = new GraphDataModel();
    const parent = getParent(model);

    const v1 = newVertex('v1', 'vertex 1');
    model.add(parent, v1);
    v1.setStyle({ fillColor: 'green', strokeWidth: 4 });
    v1.geometry = new Geometry(100, 100, 100, 80);
    const v2 = newVertex('v2', 'vertex 2');
    v2.style = { bendable: false, rounded: true, fontColor: 'yellow' };
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
      <Geometry _x="100" _y="100" _width="100" _height="80" as="geometry" />
      <Object fillColor="green" strokeWidth="4" as="style" />
    </Cell>
    <Cell id="v2" value="vertex 2" vertex="1" parent="1">
      <Object bendable="0" rounded="1" fontColor="yellow" as="style" />
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
});

describe('import', () => {
  test('XML from issue 178', () => {
    const model = new GraphDataModel();
    new ModelXmlSerializer(model).import(xmlFromIssue178);

    const cell = model.getCell('B_#0');
    expect(cell).toBeDefined();
    expect(cell?.value).toEqual('rootNode');
    expect(cell?.vertex).toEqual(1); // FIX should be set to true
    expect(cell?.isVertex()).toBeTruthy();
    expect(cell?.getParent()?.id).toEqual('1');
    expect(cell?.geometry).toEqual(new Geometry(100, 100, 100, 80));
    expect(cell?.style).toEqual({
      fillColor: 'green',
      shape: 'triangle',
      strokeWidth: 4,
    });
  });
});
