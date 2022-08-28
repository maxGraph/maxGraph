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

import { Graph, Perimeter, constants, EdgeStyle } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Styles/Stylesheet',
  argTypes: {
    ...globalTypes,
  },
};

const Template = ({ label, ...args }) => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Creates the graph inside the DOM node.
  const graph = new Graph(container);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Returns a special label for edges. Note: This does
  // a supercall to use the default implementation.
  graph.getLabel = function (cell) {
    const label = Graph.prototype.getLabel.apply(this, arguments);

    if (cell.isEdge()) {
      return `Transfer ${label}`;
    }
    return label;
  };

  // Installs a custom global tooltip
  graph.setTooltips(true);
  graph.getTooltip = function (state) {
    const { cell } = state;
    const model = this.getDataModel();

    if (modcellel.isEdge()) {
      const source = this.getLabel(cell.getTerminal(true));
      const target = this.getLabel(cell.getTerminal(false));

      return `${source} -> ${target}`;
    }
    return this.getLabel(cell);
  };

  // Creates the default style for vertices
  let style = [];
  style.shape = constants.SHAPE.RECTANGLE;
  style.perimiter = Perimeter.RectanglePerimeter;
  style.strokeColor = 'gray';
  style.rounded = true;
  style.fillColor = '#EEEEEE';
  style.gradientColor = 'white';
  style.fontColor = '#774400';
  style.align = constants.ALIGN.CENTER;
  style.verticalAlign = constants.ALIGN.MIDDLE;
  style.fontSize = '12';
  style.fontStyle = 1;
  graph.getStylesheet().putDefaultVertexStyle(style);

  // Creates the default style for edges
  style = [];
  style.shape = constants.SHAPE.CONNECTOR;
  style.strokeColor = '#6482B9';
  style.align = constants.ALIGN.CENTER;
  style.verticalAlign = constants.ALIGN.MIDDLE;
  style.edge = EdgeStyle.ElbowConnector;
  style.endArrow = constants.ARROW.CLASSIC;
  style.fontSize = '10';
  graph.getStylesheet().putDefaultEdgeStyle(style);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Interval 1', 20, 20, 180, 30);
    const v2 = graph.insertVertex(parent, null, 'Interval 2', 140, 80, 280, 30);
    const v3 = graph.insertVertex(parent, null, 'Interval 3', 200, 140, 360, 30);
    const v4 = graph.insertVertex(parent, null, 'Interval 4', 480, 200, 120, 30);
    const v5 = graph.insertVertex(parent, null, 'Interval 5', 60, 260, 400, 30);
    const e1 = graph.insertEdge(parent, null, '1', v1, v2);
    e1.getGeometry().points = [{ x: 160, y: 60 }];
    const e2 = graph.insertEdge(parent, null, '2', v1, v5);
    e2.getGeometry().points = [{ x: 80, y: 60 }];
    const e3 = graph.insertEdge(parent, null, '3', v2, v3);
    e3.getGeometry().points = [{ x: 280, y: 120 }];
    const e4 = graph.insertEdge(parent, null, '4', v3, v4);
    e4.getGeometry().points = [{ x: 500, y: 180 }];
    const e5 = graph.insertEdge(parent, null, '5', v3, v5);
    e5.getGeometry().points = [{ x: 380, y: 180 }];
  });

  return container;
};

export const Default = Template.bind({});
