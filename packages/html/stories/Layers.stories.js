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

import { Graph, DomHelpers, Cell, GraphDataModel, Point } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/Layers',
  argTypes: {
    ...globalTypes,
  },
};

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  // Creates the graph inside the given container using a model
  // with a custom root and two layers. Layers can also be added
  // dynamically using let layer = model.add(root, new Cell()).
  const root = new Cell();
  const layer0 = root.insert(new Cell());
  const layer1 = root.insert(new Cell());
  const model = new GraphDataModel(root);

  const graph = new Graph(container, model);

  // Disables basic selection and cell handling
  graph.setEnabled(false);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  model.beginUpdate();
  try {
    const v1 = graph.insertVertex(layer1, null, 'Hello,', 20, 20, 80, 30, {
      fillColor: '#C0C0C0',
    });
    const v2 = graph.insertVertex(layer1, null, 'Hello,', 200, 20, 80, 30, {
      fillColor: '#C0C0C0',
    });
    const v3 = graph.insertVertex(layer0, null, 'World!', 110, 150, 80, 30);
    const e1 = graph.insertEdge(layer1, null, '', v1, v3, { strokeColor: '#0C0C0C' });
    e1.geometry.points = [new Point(60, 165)];
    const e2 = graph.insertEdge(layer0, null, '', v2, v3);
    e2.geometry.points = [new Point(240, 165)];
    const e3 = graph.insertEdge(layer0, null, '', v1, v2, {
      edgeStyle: 'topToBottomEdgeStyle',
    });
    e3.geometry.points = [new Point(150, 30)];
    const e4 = graph.insertEdge(layer1, null, '', v2, v1, {
      strokeColor: '#0C0C0C',
      edgeStyle: 'topToBottomEdgeStyle',
    });
    e4.geometry.points = [new Point(150, 40)];
  } finally {
    // Updates the display
    model.endUpdate();
  }

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('Layer 0', function () {
      model.setVisible(layer0, !layer0.isVisible());
    })
  );

  buttons.appendChild(
    DomHelpers.button('Layer 1', function () {
      model.setVisible(layer1, !layer1.isVisible());
    })
  );

  return div;
};

export const Default = Template.bind({});
