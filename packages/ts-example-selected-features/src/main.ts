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
  CellRenderer,
  constants,
  EdgeMarker,
  EdgeStyle,
  EllipseShape,
  FitPlugin,
  InternalEvent,
  MarkerShape,
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
  protected override registerDefaults() {
    // Register shapes
    // RectangleShape is not registered here because it is always available. It is the fallback shape for vertices when no shape is returned by the registry
    CellRenderer.registerShape('ellipse', EllipseShape);

    // Register styles
    StyleRegistry.putValue('ellipsePerimeter', Perimeter.EllipsePerimeter);
    StyleRegistry.putValue('rectanglePerimeter', Perimeter.RectanglePerimeter); // declared in the default vertex style, so must be registered to be used
    StyleRegistry.putValue('orthogonalEdgeStyle', EdgeStyle.OrthConnector);

    const arrowFunction = EdgeMarker.createArrow(2);
    MarkerShape.addMarker('classic', arrowFunction);
    MarkerShape.addMarker('block', arrowFunction);
  }
}

const initializeGraph = (container: HTMLElement) => {
  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  const graph = new CustomGraph({
    container,
    plugins: [
      FitPlugin, // Enables the fitCenter method
      PanningHandler, // Enables panning with the mouse
      RubberBandHandler, // Enables rubber band selection
      SelectionCellsHandler, // Enables management of selected cells
      SelectionHandler, // Enables selection with the mouse
    ],
  });
  graph.setPanning(true); // Use mouse right button for panning

  // create a dedicated style for "ellipse" to share properties
  graph.getStylesheet().putCellStyle('myEllipse', {
    perimeter: 'ellipsePerimeter',
    shape: 'ellipse',
    verticalAlign: 'top',
    verticalLabelPosition: 'bottom',
  });

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
        fillColor: 'orange',
      },
    });
    graph.insertEdge({
      value: 'an orthogonal style edge',
      source: vertex01,
      target: vertex02,
      style: {
        edgeStyle: 'orthogonalEdgeStyle',
        rounded: true,
      },
    });

    const vertex11 = graph.insertVertex({
      value: 'a custom rectangle',
      position: [20, 200],
      size: [100, 100],
      style: {
        fillColor: 'Chartreuse',
        rounded: true,
        strokeColor: 'Black',
        strokeWidth: 3,
      },
    });
    const vertex12 = graph.insertVertex({
      value: 'a custom ellipse',
      x: 150,
      y: 350,
      width: 70,
      height: 70,
      style: {
        baseStyleNames: ['myEllipse'],
        fillColor: 'Yellow',
        strokeColor: 'Red',
        strokeWidth: 5,
      },
    });
    graph.insertEdge({
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
