/*
Copyright 2022-present The maxGraph project Contributors

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
  constants,
  type FitPlugin,
  getDefaultPlugins,
  Graph,
  InternalEvent,
  Perimeter,
  RubberBandHandler,
} from '@maxgraph/core';
import { registerCustomShapes } from './custom-shapes';

const initializeGraph = (container: HTMLElement) => {
  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  const graph = new Graph(container, undefined, [
    ...getDefaultPlugins(),
    RubberBandHandler, // Enables rubber band selection
  ]);
  graph.setPanning(true); // Use mouse right button for panning

  // shapes and styles
  registerCustomShapes();
  // create a dedicated style for "ellipse" to share properties
  graph.getStylesheet().putCellStyle('myEllipse', {
    perimeter: Perimeter.EllipsePerimeter,
    shape: 'ellipse',
    verticalAlign: 'top',
    verticalLabelPosition: 'bottom',
  });

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    // use the legacy insertVertex method
    const vertex01 = graph.insertVertex(
      parent,
      null,
      'a regular rectangle',
      10,
      10,
      100,
      100
    );
    const vertex02 = graph.insertVertex(
      parent,
      null,
      'a regular ellipse',
      350,
      90,
      50,
      50,
      {
        baseStyleNames: ['myEllipse'],
        fillColor: 'orange',
      }
    );
    // use the legacy insertEdge method
    graph.insertEdge(parent, null, 'an orthogonal style edge', vertex01, vertex02, {
      edgeStyle: 'orthogonalEdgeStyle',
      rounded: true,
    });

    // insert vertex using custom shapes using the new insertVertex method
    const vertex11 = graph.insertVertex({
      parent,
      value: 'a custom rectangle',
      position: [20, 200],
      size: [100, 100],
      style: { shape: 'customRectangle' },
    });
    // use the new insertVertex method using position and size parameters
    const vertex12 = graph.insertVertex({
      parent,
      value: 'a custom ellipse',
      x: 150,
      y: 350,
      width: 70,
      height: 70,
      style: {
        baseStyleNames: ['myEllipse'],
        shape: 'customEllipse',
      },
    });
    // use the new insertEdge method
    graph.insertEdge({
      parent,
      value: 'another edge',
      source: vertex11,
      target: vertex12,
      style: { endArrow: 'block' },
    });
  });

  return graph;
};

// display the maxGraph version in the footer
const footer = document.querySelector('footer')!;
footer.innerText = `Built with maxGraph ${constants.VERSION}`;

// Creates the graph inside the given container
const graph = initializeGraph(document.querySelector('#graph-container')!);

// Control buttons
document.getElementById('reset-zoom')!.addEventListener('click', () => {
  graph.zoomActual();
});
document.getElementById('fit-center')!.addEventListener('click', () => {
  graph.getPlugin<FitPlugin>('fit')?.fitCenter({ margin: 20 });
});
