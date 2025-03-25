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

import { Graph } from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';

export default {
  title: 'Labels/Wrapping',
  argTypes: {
    ...globalTypes,
    useHtmlLabels: {
      type: 'boolean',
      defaultValue: true,
    },
  },
  args: {
    ...globalValues,
    useHtmlLabels: true,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(`
  This example demonstrates using HTML markup and word-wrapping in vertex and edge labels.
  <br>
  This requires to enable the support of <code>htmlLabels</code> on the <code>Graph</code>.
  <br>
  Use the storybook argument to enable or disable the support of <code>htmlLabels</code>. 
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enables HTML labels as wrapping is only available for those
  graph.setHtmlLabels(Boolean(args.useHtmlLabels));

  // Disables in-place editing for edges
  graph.isCellEditable = function (cell) {
    return !cell.isEdge();
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Cum Caesar vidisset, portum plenum esse, iuxta navigavit.',
      position: [20, 20],
      size: [100, 70],
      style: { whiteSpace: 'wrap' },
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'Cum Caesar vidisset, portum plenum esse, iuxta navigavit.',
      position: [220, 150],
      size: [80, 70],
      style: { whiteSpace: 'wrap' },
    });
    const e1 = graph.insertEdge({
      parent,
      value:
        'Cum Caesar vidisset, portum plenum esse, iuxta navigavit and <b>bold text</b>.',
      source: v1,
      target: v2,
      style: {
        fontColor: 'black',
        whiteSpace: 'wrap',
      },
    });
    e1.geometry!.width = 100;
  });

  return div;
};

export const Default = Template.bind({});
