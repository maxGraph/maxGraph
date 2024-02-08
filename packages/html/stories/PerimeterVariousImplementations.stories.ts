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

import { Graph, InternalEvent, RubberBandHandler } from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Styles/PerimeterVariousImplementations',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, any>) => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph: Graph = new Graph(container);
  // graph.setVertexLabelsMovable(true);
  // graph.setConnectable(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This is normally the first child of the root (i.e. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const rectangle1 = graph.insertVertex({
      parent,
      value: 'Rectangle 1',
      position: [20, 20],
      size: [80, 30],
    });
    const rectangle2 = graph.insertVertex({
      parent,
      value: 'Rectangle 2',
      position: [100, 100],
      size: [80, 30],
    });
    graph.insertEdge({ parent, source: rectangle1, target: rectangle2 });
    const rectangle3 = graph.insertVertex({
      parent,
      value: 'Rectangle 3\nnone perimeter',
      position: [250, 20],
      size: [80, 60],
      style: {
        perimeter: 'none',
      },
    });
    graph.insertEdge({ parent, source: rectangle2, target: rectangle3 });

    const triangle1 = graph.insertVertex({
      parent,
      value: 'Triangle 1',
      position: [150, 190],
      size: [80, 60],
      style: {
        fillColor: 'pink',
        perimeter: 'trianglePerimeter',
        shape: 'triangle',
      },
    });
    graph.insertEdge({ parent, source: rectangle2, target: triangle1 });
    const triangle2 = graph.insertVertex({
      parent,
      value: 'Triangle 2',
      position: [20, 250],
      size: [80, 60],
      style: {
        fillColor: 'pink',
        perimeter: 'trianglePerimeter',
        shape: 'triangle',
      },
    });
    graph.insertEdge({ parent, source: triangle1, target: triangle2 });
    const triangle3 = graph.insertVertex({
      parent,
      value: 'Triangle 3\nnone perimeter',
      position: [20, 120],
      size: [80, 60],
      style: {
        fillColor: 'pink',
        perimeter: 'none',
        shape: 'triangle',
      },
    });
    graph.insertEdge({ parent, source: triangle1, target: triangle3 });

    const rhombus1 = graph.insertVertex({
      parent,
      value: 'Rhombus 1',
      position: [420, 80],
      size: [50, 50],
      style: {
        fillColor: 'chartreuse',
        labelPosition: 'right',
        perimeter: 'rhombusPerimeter',
        shape: 'rhombus',
      },
    });
    graph.insertEdge({ parent, source: triangle1, target: rhombus1 });
    graph.insertEdge({ parent, source: rectangle2, target: rhombus1 });
    const rhombus2 = graph.insertVertex({
      parent,
      value: 'Rhombus 2',
      position: [500, 15],
      size: [50, 50],
      style: {
        fillColor: 'chartreuse',
        labelPosition: 'left',
        perimeter: 'rhombusPerimeter',
        shape: 'rhombus',
      },
    });
    graph.insertEdge({ parent, source: rhombus1, target: rhombus2 });
    const rhombus3 = graph.insertVertex({
      parent,
      value: 'Rhombus 3\nnone perimeter',
      position: [580, 100],
      size: [50, 50],
      style: {
        fillColor: 'chartreuse',
        verticalLabelPosition: 'top',
        perimeter: 'none',
        shape: 'rhombus',
      },
    });
    graph.insertEdge({ parent, source: rhombus2, target: rhombus3 });

    const hexagon1 = graph.insertVertex({
      parent,
      value: 'Hexagon 1',
      position: [280, 250],
      size: [80, 80],
      style: {
        fillColor: 'lightblue',
        perimeter: 'hexagonPerimeter',
        shape: 'hexagon',
      },
    });
    graph.insertEdge({ parent, source: triangle1, target: hexagon1 });
    graph.insertEdge({ parent, source: rhombus1, target: hexagon1 });
    const hexagon2 = graph.insertVertex({
      parent,
      value: 'Hexagon 2',
      position: [450, 200],
      size: [60, 60],
      style: {
        fillColor: 'lightblue',
        perimeter: 'hexagonPerimeter',
        shape: 'hexagon',
      },
    });
    graph.insertEdge({ parent, source: hexagon1, target: hexagon2 });
    graph.insertEdge({ parent, source: rhombus1, target: hexagon2 });
    const hexagon3 = graph.insertVertex({
      parent,
      value: 'Hexagon 3\nnone perimeter',
      position: [600, 180],
      size: [60, 60],
      style: {
        fillColor: 'lightblue',
        labelPosition: 'right',
        perimeter: 'none',
        shape: 'hexagon',
      },
    });
    graph.insertEdge({ parent, source: hexagon3, target: hexagon2 });
    graph.insertEdge({ parent, source: rhombus3, target: hexagon3 });

    const ellipse1 = graph.insertVertex({
      parent,
      value: 'Ellipse 1',
      position: [400, 400],
      size: [60, 60],
      style: {
        fillColor: 'orange',
        perimeter: 'ellipsePerimeter',
        shape: 'ellipse',
      },
    });
    graph.insertEdge({ parent, source: hexagon1, target: ellipse1 });
    graph.insertEdge({ parent, source: hexagon2, target: ellipse1 });
    graph.insertEdge({ parent, source: triangle2, target: ellipse1 });
    const ellipse2 = graph.insertVertex({
      parent,
      value: 'Ellipse 2',
      position: [600, 320],
      size: [60, 60],
      style: {
        fillColor: 'orange',
        perimeter: 'ellipsePerimeter',
        shape: 'ellipse',
      },
    });
    graph.insertEdge({ parent, source: ellipse1, target: ellipse2 });
    graph.insertEdge({ parent, source: hexagon2, target: ellipse2 });
    const ellipse3 = graph.insertVertex({
      parent,
      value: 'Ellipse 3\nnone perimeter',
      position: [550, 470],
      size: [60, 60],
      style: {
        fillColor: 'orange',
        labelPosition: 'right',
        perimeter: 'none',
        shape: 'ellipse',
      },
    });
    graph.insertEdge({ parent, source: ellipse1, target: ellipse3 });
    graph.insertEdge({ parent, source: ellipse2, target: ellipse3 });
  });

  return container;
};

export const Default = Template.bind({});
