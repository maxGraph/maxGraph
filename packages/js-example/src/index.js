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

import '@maxgraph/core/css/common.css';
import './style.css';
import {
  Client,
  Codec,
  DomHelpers,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  ModelXmlSerializer,
  registerCoreCodecs,
  RubberBandHandler,
  xmlUtils,
} from '@maxgraph/core';

const xmlWithVerticesAndEdges = `<GraphDataModel>
    <root>
      <Cell id="0">
        <Object as="style" />
      </Cell>
      <Cell id="1" parent="0">
        <Object as="style" />
      </Cell>
      <Cell id="v1" value="&lt;i&gt;Simple&lt;/i&gt; &lt;b&gt;Test&lt;/b&gt;, quite long, which requires &lt;b&gt;wrapping&lt;/b&gt;" vertex="1" parent="1">
        <Geometry _x="100" _y="100" _width="100" _height="80" as="geometry" />
        <Object fontColor="black" strokeWidth="4" whiteSpace="wrap" as="style" />
<!--        <Object fillColor="green" strokeWidth="4" as="style" />-->
      </Cell>
      <Cell id="v2" value="vertex 2" vertex="1" parent="1">
        <Geometry _x="0" _y="0" _width="100" _height="80" as="geometry" />
        <Object bendable="0" rounded="1" fontColor="yellow" as="style" />
      </Cell>
      <Cell id="e1" edge="1" parent="1" source="v1" target="v2">
        <Geometry as="geometry">
          <Array as="points">
            <Point _x="240" _y="100" />
            <Point _x="210" _y="80" />
            <Point _x="140" _y="80" />
          </Array>
        </Geometry>
        <Object as="style" />
      </Cell>
    </root>
  </GraphDataModel>
`;

const initializeGraph = (container) => {
  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  const graph = new Graph(container, undefined, [
    ...getDefaultPlugins(),
    RubberBandHandler, // Enables rubber band selection
  ]);
  graph.setPanning(true); // Use mouse right button for panning
  graph.setHtmlLabels(true); // Ensure that the Cell value is interpreted as HTML when rendering the label

  const modelXmlSerializer = new ModelXmlSerializer(graph.model);
  modelXmlSerializer.import(xmlWithVerticesAndEdges);

  return graph;
};

// display the maxGraph version in the footer
const footer = document.querySelector('footer');
footer.innerText = `Built with maxGraph ${Client.VERSION}`;

// Creates the graph inside the given container
const container = document.querySelector('#graph-container');
const graph = initializeGraph(container);

// EXTRA: check the result of encoding the graph view
console.info('Encoding Graph view...');
registerCoreCodecs();
const encodedNode = new Codec().encode(graph.view);
console.info('Graph view encoded:', xmlUtils.getPrettyXml(encodedNode));
// with htmlLabels
// <graph label="" html="true" x="0" y="0" width="250" height="183" scale="1">
//   <layer label="" html="true">
//     <vertex label="vertex 1" html="true" shape="rectangle" perimeter="rectanglePerimeter" verticalAlign="middle" align="center" fillColor="green" strokeColor="#6482B9" fontColor="#774400" strokeWidth="4" x="100" y="100" width="100" height="80" />
//     <vertex label="vertex 2" html="true" shape="rectangle" perimeter="rectanglePerimeter" verticalAlign="middle" align="center" fillColor="#C3D9FF" strokeColor="#6482B9" fontColor="yellow" bendable="0" rounded="1" x="0" y="0" width="100" height="80" />
//     <edge label="" html="true" shape="connector" endArrow="classic" verticalAlign="middle" align="center" strokeColor="#6482B9" fontColor="#446299" points="200,118 240,100 210,80 140,80 100,62" dx="150" dy="90" />
//   </layer>
// </graph>

// Implementation seen in from Graph editor examples (and probably the same in draw.io)
// In the current implementation (and default mxGraph) whiteSpace is documented as only been considered if Graph.isHtmlLabels is true
// "this" is an instance of Graph (or a class that extends it)
//   this.isHtmlLabel = function (cell) {
//     let style = this.getCurrentCellStyle(cell);
//
//     return style != null ? style.html == '1' || style.whiteSpace == 'wrap' : false;
//   };

// poor way to display the XML
const popup = (content) => {
  window.alert(content);
};

container.parentElement.appendChild(
  DomHelpers.button('View Original XML', () => {
    popup(xmlWithVerticesAndEdges);
  })
);
container.parentElement.appendChild(
  DomHelpers.button('Export XML', () => {
    const xml = new ModelXmlSerializer(graph.model).export();
    popup(xml);
  })
);
