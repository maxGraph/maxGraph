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
  constants,
  getDefaultPlugins,
  Graph,
  Perimeter,
  RubberBandHandler,
  StyleDefaultsConfig,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Misc/Merge',
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
  const div = createMainDiv(
    `This example illustrates the use of the <code>GraphDataModel.mergeChildren</code> function to merge two graphs.`
  );

  const container = createGraphContainer(args);
  div.appendChild(container);

  StyleDefaultsConfig.shadowColor = '#c0c0c0';

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new Graph(container, undefined, plugins);

  // No size handles, please...
  graph.setCellsResizable(false);

  // Makes all cells round with a white, bold label
  let style = graph.stylesheet.getDefaultVertexStyle();
  style.shape = 'ellipse';
  style.perimeter = Perimeter.EllipsePerimeter;
  style.fontColor = 'white';
  style.gradientColor = 'white';
  style.fontStyle = constants.FONT.BOLD;
  style.fontSize = 14;
  style.shadow = true;

  // Makes all edge labels gray with a white background
  style = graph.stylesheet.getDefaultEdgeStyle();
  style.fontColor = 'gray';
  style.fontStyle = constants.FONT.BOLD;
  style.fontColor = 'black';
  style.strokeWidth = 2;

  // Gets the default parent for inserting new cells. This is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the target model in a single step using custom ids for the vertices and edges
  const w = 40;
  const h = 40;

  graph.batchUpdate(() => {
    const a = graph.insertVertex(parent, 'a', 'A', 20, 20, w, h, { fillColor: 'blue' });
    const b = graph.insertVertex(parent, 'b', 'B', 20, 200, w, h, { fillColor: 'blue' });
    const c = graph.insertVertex(parent, 'c', 'C', 200, 20, w, h, { fillColor: 'red' });
    const d = graph.insertVertex(parent, 'd', 'D', 200, 200, w, h, { fillColor: 'red' });
    graph.insertEdge(parent, 'ac', 'ac', a, c, {
      strokeColor: 'blue',
      verticalAlign: 'bottom',
    });
    graph.insertEdge(parent, 'ad', 'ad', a, d, {
      strokeColor: 'blue',
      align: 'left',
      verticalAlign: 'bottom',
    });
    graph.insertEdge(parent, 'bd', 'bd', b, d, {
      strokeColor: 'blue',
      verticalAlign: 'bottom',
    });
  });

  // Creates the second graph model (without a container)
  const graph2 = new Graph(null!);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent2 = graph2.getDefaultParent();

  // Adds cells to the target model in a single step
  // using custom ids for the vertices
  graph2.batchUpdate(() => {
    const c = graph2.insertVertex(parent2, 'c', 'C', 200, 20, w, h, {
      fillColor: 'green',
    });
    const d = graph2.insertVertex(parent2, 'd', 'D', 200, 200, w, h, {
      fillColor: 'green',
    });
    const e = graph2.insertVertex(parent2, 'e', 'E', 400, 20, w, h, {
      fillColor: 'green',
    });
    const f = graph2.insertVertex(parent2, 'f', 'F', 400, 200, w, h, {
      fillColor: 'green',
    });
    graph2.insertEdge(parent2, 'ce', 'ce', c, e, {
      strokeColor: 'green',
      verticalAlign: 'bottom',
    });
    graph2.insertEdge(parent2, 'ed', 'ed', e, d, {
      strokeColor: 'green',
      align: 'right',
      verticalAlign: 'bottom',
    });
    graph2.insertEdge(parent2, 'fd', 'fd', f, d, {
      strokeColor: 'green',
      verticalAlign: 'bottom',
    });
  });

  // Merges the model from the second graph into the model of
  // the first graph. Note: If you add a false to the parameter
  // list then _not_ all edges will be cloned, that is, the
  // edges are assumed to have an identity, and hence the edge
  // "bd" will be changed to point from f to d, as specified in
  // the edge for the same id in the second graph.
  graph.getDataModel().mergeChildren(parent2, parent /* , false */);

  return div;
};

export const Default = Template.bind({});
