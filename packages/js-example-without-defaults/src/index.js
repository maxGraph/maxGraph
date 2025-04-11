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

import './style.css';
import {
  constants,
  Graph,
  InternalEvent,
  unregisterAllEdgeMarkers,
  unregisterAllEdgeStylesAndPerimeters,
  unregisterAllShapes,
} from '@maxgraph/core';

const initializeGraph = (container) => {
  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  const graph = new Graph(
    container,
    undefined,
    [] // override default plugins, use none
  );

  // create a dedicated style for "ellipse" to share properties
  graph.getStylesheet().putCellStyle('myEllipse', {
    perimeter: 'ellipsePerimeter',
    shape: 'ellipse',
    verticalAlign: 'top',
    verticalLabelPosition: 'bottom',
  });

  // Unregister maxGraph builtin style defaults
  // This is because Graph registers them. In the future, we expect to have an implementation of Graph that does not do it.
  unregisterAllEdgeMarkers();
  unregisterAllEdgeStylesAndPerimeters();
  unregisterAllShapes();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const vertex01 = graph.insertVertex({
      value: 'a regular rectangle',
      position: [10, 10],
      size: [100, 100],
    });
    const vertex02 = graph.insertVertex({
      value: 'a regular ellipse',
      position: [350, 90],
      size: [50, 50],
      style: {
        baseStyleNames: ['myEllipse'],
      },
    });
    graph.insertEdge({
      value: 'an orthogonal style edge',
      source: vertex01,
      target: vertex02,
      style: {
        edgeStyle: constants.EDGESTYLE.ORTHOGONAL,
        rounded: true,
      },
    });

    const vertex11 = graph.insertVertex({
      value: 'another rectangle',
      position: [20, 200],
      size: [100, 100],
      style: {
        fillColor: 'red',
        fillOpacity: 20,
      },
    });
    const vertex12 = graph.insertVertex({
      value: 'another ellipse',
      x: 150,
      y: 350,
      width: 70,
      height: 70,
      style: {
        baseStyleNames: ['myEllipse'],
        fillColor: 'orange',
      },
    });
    graph.insertEdge({
      value: 'another edge',
      source: vertex11,
      target: vertex12,
      style: { endArrow: 'block' },
    });
  });
};

// display the maxGraph version in the footer
const footer = document.querySelector('footer');
footer.innerText = `Built with maxGraph ${constants.VERSION}`;

// Creates the graph inside the given container
initializeGraph(document.querySelector('#graph-container'));
