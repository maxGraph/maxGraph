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

import {
  constants,
  getDefaultPlugins,
  Graph,
  Perimeter,
  Point,
  RubberBandHandler,
} from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import {
  configureImagesBasePath,
  createGraphContainer,
  createMainDiv,
} from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Styles/EdgeCurvedAndRounded',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
    style: {
      type: 'text',
      options: ['curved', 'rounded', 'default'],
      control: { type: 'select' },
    },
    arcSize: {
      type: 'text',
      options: ['default', '10', '30', '50'],
      control: { type: 'select' },
    },
  },
  args: {
    style: 'curved',
    arcSize: 'default',
    ...globalValues,
    ...contextMenuValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();

  const div = createMainDiv(`Show usage of curved and rounded edges.
  <br>
  Use the Storybook controls to change the style of the edges.
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

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

  // Makes all edge labels gray with a white background
  style = graph.stylesheet.getDefaultEdgeStyle();
  style.fontColor = 'gray';
  style.fontStyle = constants.FONT.BOLD;
  style.fontColor = 'black';
  style.strokeWidth = 2;
  if (args.style === 'curved') style.curved = true;
  if (args.style === 'rounded') style.rounded = true;
  if (args.arcSize !== 'default') style.arcSize = Number(args.arcSize);

  // Adds cells to the target model in a single step using custom ids for the vertices and edges
  const width = 40;
  const height = 40;

  graph.batchUpdate(() => {
    const a = graph.insertVertex({
      id: 'a',
      value: 'A',
      position: [20, 20],
      size: [width, height],
      style: {
        fillColor: 'blue',
      },
    });
    const b = graph.insertVertex({
      id: 'b',
      value: 'B',
      position: [20, 400],
      size: [width, height],
      style: {
        fillColor: 'blue',
      },
    });
    const c = graph.insertVertex({
      id: 'c',
      value: 'C',
      position: [200, 20],
      size: [width, height],
      style: {
        fillColor: 'red',
      },
    });
    const d = graph.insertVertex({
      id: 'd',
      value: 'D',
      position: [200, 200],
      size: [width, height],
      style: {
        fillColor: 'red',
      },
    });

    const e = graph.insertVertex({
      id: 'e',
      value: 'E',
      position: [400, 20],
      size: [width, height],
      style: {
        fillColor: 'green',
      },
    });

    const f = graph.insertVertex({
      id: 'f',
      value: 'F',
      position: [400, 350],
      size: [width, height],
      style: {
        fillColor: 'green',
      },
    });

    const edge_ac = graph.insertEdge({
      id: 'ac',
      value: 'ac',
      source: a,
      target: c,
      style: {
        strokeColor: 'blue',
        verticalAlign: 'bottom',
      },
    });
    edge_ac.geometry!.points = [new Point(100, 10)];

    const edge_ad = graph.insertEdge({
      id: 'ad',
      value: 'ad',
      source: a,
      target: d,
      style: {
        strokeColor: 'blue',
        align: 'left',
        verticalAlign: 'bottom',
      },
    });
    edge_ad.geometry!.points = [new Point(0, 100)];

    const edge_da = graph.insertEdge({
      id: 'da',
      value: 'da',
      source: d,
      target: a,
      style: {
        strokeColor: 'blue',
        align: 'left',
        verticalAlign: 'bottom',
      },
    });
    edge_da.geometry!.points = [new Point(180, 100)];

    const edge_dc = graph.insertEdge({
      id: 'dc',
      value: 'dc',
      source: d,
      target: c,
      style: {
        strokeColor: 'red',
        align: 'left',
        verticalAlign: 'bottom',
      },
    });
    edge_dc.geometry!.points = [new Point(250, 140)];

    const edge_bd = graph.insertEdge({
      id: 'bd',
      value: 'bd',
      source: b,
      target: d,
      style: {
        strokeColor: 'blue',
        verticalAlign: 'bottom',
      },
    });
    edge_bd.geometry!.points = [new Point(80, 290)];

    const edge_ce = graph.insertEdge({
      id: 'ce',
      value: 'ce',
      source: c,
      target: e,
      style: {
        strokeColor: 'green',
        verticalAlign: 'middle',
      },
    });
    edge_ce.geometry!.points = [new Point(300, 70)];

    const edge_ed = graph.insertEdge({
      id: 'ed',
      value: 'ed',
      source: e,
      target: d,
      style: {
        strokeColor: 'green',
        align: 'right',
        verticalAlign: 'bottom',
      },
    });
    edge_ed.geometry!.points = [new Point(380, 150)];

    const edge_fd = graph.insertEdge({
      id: 'fd',
      value: 'fd',
      source: f,
      target: d,
      style: {
        strokeColor: 'green',
        verticalAlign: 'bottom',
      },
    });
    edge_fd.geometry!.points = [new Point(380, 250)];
  });

  return div;
};

export const Default = Template.bind({});
