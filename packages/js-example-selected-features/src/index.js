/*
Copyright 2025-present The maxGraph project Contributors

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

import '@maxgraph/core/css/common.css'; // required by RubberBandHandler
import './style.css';
import {
  BaseGraph,
  CellEditorHandler,
  constants,
  DomHelpers,
  EdgeMarker,
  InternalEvent,
  MarkerShape,
  ModelXmlSerializer,
  PanningHandler,
  Perimeter,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
  StyleRegistry,
} from '@maxgraph/core';

/**
 * Custom implementation of {@link BaseGraph} that only register the built-in styles required by the example.
 */
class CustomGraph extends BaseGraph {
  registerDefaults() {
    // Register styles
    StyleRegistry.putValue('rectanglePerimeter', Perimeter.RectanglePerimeter); // declared in the default vertex style, so must be registered to be used
    MarkerShape.addMarker('classic', EdgeMarker.createArrow(2));
  }
}

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

  const graph = new CustomGraph({
    container,
    plugins: [
      CellEditorHandler, // Enables in-place editing of cell labels
      PanningHandler, // Enables panning with the mouse
      RubberBandHandler, // Enables rubber band selection
      SelectionCellsHandler, // Enables management of selected cells
      SelectionHandler, // Enables selection with the mouse
    ],
  });
  graph.setPanning(true); // Use mouse right button for panning

  const modelXmlSerializer = new ModelXmlSerializer(graph.model);
  modelXmlSerializer.import(xmlWithVerticesAndEdges);

  return graph;
};

// display the maxGraph version in the footer
const footer = document.querySelector('footer');
footer.innerText = `Built with maxGraph ${constants.VERSION}`;

// Creates the graph inside the given container
const container = document.querySelector('#graph-container');
const graph = initializeGraph(container);

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
