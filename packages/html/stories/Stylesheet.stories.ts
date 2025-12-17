/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2020, JGraph Ltd

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

import {
  type CellStyle,
  Graph,
  Perimeter,
  Point,
  type TooltipHandler,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';

export default {
  title: 'Styles/Stylesheet',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(`
  This example demonstrates using a custom stylesheet and control points in edges, as well as overriding the <code>getLabel</code> and <code>getTooltip</code>
  functions to return dynamic information for edges.
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

  // Creates the graph inside the DOM node.
  const graph = new Graph(container);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Returns a special label for edges. Note: This does a super call to use the default implementation.
  const originalGraphGetLabel = graph.getLabel;
  graph.getLabel = function (cell) {
    const label = originalGraphGetLabel.call(this, cell);

    if (cell?.isEdge()) {
      return `Transfer ${label}`;
    }
    return label;
  };

  // Installs a custom global tooltip
  graph.setTooltips(true);
  const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler')!;
  tooltipHandler.getTooltip = function (state) {
    const { cell } = state;
    if (cell.isEdge()) {
      const source = this.graph.getLabel(cell.getTerminal(true));
      const target = this.graph.getLabel(cell.getTerminal(false));

      return `${source} -> ${target}`;
    }
    return this.graph.getLabel(cell);
  };

  // Creates the default style for vertices
  const defaultVertexStyle: CellStyle = {
    align: 'center',
    fillColor: '#EEEEEE',
    fontColor: '#774400',
    fontSize: 12,
    fontStyle: 1,
    gradientColor: 'white',
    perimeter: Perimeter.RectanglePerimeter,
    rounded: true,
    shape: 'rectangle',
    strokeColor: 'gray',
    verticalAlign: 'middle',
  };
  graph.getStylesheet().putDefaultVertexStyle(defaultVertexStyle);

  // Creates the default style for edges
  const defaultEdgeStyle: CellStyle = {
    align: 'center',
    edgeStyle: 'elbowEdgeStyle',
    endArrow: 'classic',
    fontSize: 10,
    shape: 'connector',
    strokeColor: '#6482B9',
    verticalAlign: 'middle',
  };
  graph.getStylesheet().putDefaultEdgeStyle(defaultEdgeStyle);

  // Additional styles
  const redColor = '#f10d0d';
  const edgeImportantStyle: CellStyle = {
    fontColor: redColor,
    fontSize: 14,
    fontStyle: 3,
    strokeColor: redColor,
  };
  graph.getStylesheet().putCellStyle('importantEdge', edgeImportantStyle);

  const shapeImportantStyle: CellStyle = { strokeColor: redColor };
  graph.getStylesheet().putCellStyle('importantShape', shapeImportantStyle);

  // Gets the default parent for inserting new cells. This is normally the first child of the root (i.e. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Interval 1',
      position: [20, 20],
      size: [180, 30],
      style: { baseStyleNames: ['importantShape'] },
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'Interval 2',
      position: [140, 80],
      size: [280, 30],
    });
    const v3 = graph.insertVertex({
      parent,
      value: 'Interval 3',
      position: [200, 140],
      size: [360, 30],
    });
    const v4 = graph.insertVertex({
      parent,
      value: 'Interval 4',
      position: [480, 200],
      size: [120, 30],
    });
    const v5 = graph.insertVertex({
      parent,
      value: 'Interval 5',
      position: [60, 260],
      size: [400, 30],
    });
    const v6 = graph.insertVertex({
      parent,
      value: 'Interval 6 (ignore default style)',
      position: [60, 360],
      size: [500, 30],
      style: {
        ignoreDefaultStyle: true,
        shape: 'rectangle',
        strokeColor: 'black',
      },
    });
    const e1 = graph.insertEdge({ parent, value: '1', source: v1, target: v2 });
    e1.getGeometry()!.points = [new Point(160, 60)];
    const e2 = graph.insertEdge({
      parent,
      value: '2',
      source: v1,
      target: v5,
      style: { baseStyleNames: ['importantEdge'] },
    });
    e2.getGeometry()!.points = [new Point(80, 60)];
    const e3 = graph.insertEdge({ parent, value: '3', source: v2, target: v3 });
    e3.getGeometry()!.points = [new Point(280, 120)];
    const e4 = graph.insertEdge({ parent, value: '4', source: v3, target: v4 });
    e4.getGeometry()!.points = [new Point(500, 180)];
    const e5 = graph.insertEdge({ parent, value: '5', source: v3, target: v5 });
    e5.getGeometry()!.points = [new Point(380, 180)];
    graph.insertEdge({ parent, value: '6', source: v5, target: v6 });
  });

  return div;
};

export const Default = Template.bind({});
