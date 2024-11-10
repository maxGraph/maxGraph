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
  DomHelpers,
  EdgeStyle,
  getDefaultPlugins,
  Graph,
  ModelXmlSerializer,
  Point,
  popup,
  RubberBandHandler,
} from '@maxgraph/core';

import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';
import '@maxgraph/core/css/common.css'; // style required by RubberBand and popup

export default {
  title: 'Connections/HelloPort',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();

  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new Graph(container, undefined, plugins);
  graph.setConnectable(true);
  graph.setTooltips(true);

  // Sets the default edge style
  const style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edgeStyle = EdgeStyle.ElbowConnector;

  // Ports are not used as terminals for edges, they are
  // only used to compute the graphical connection point
  graph.isPort = function (cell) {
    const geo = cell?.getGeometry();
    return geo?.relative ?? false;
  };

  // Implements a tooltip that shows the actual source and target of an edge
  graph.getTooltipForCell = function (cell) {
    if (cell && cell.isEdge()) {
      const source = cell.getTerminal(true);
      const target = cell.getTerminal(false);
      if (source && target) {
        return `${this.convertValueToString(source)} => ${this.convertValueToString(
          target
        )}`;
      }
    }

    return Graph.prototype.getTooltipForCell.apply(this, [cell]);
  };

  // Removes the folding icon and disables any folding
  graph.isCellFoldable = (_cell) => false;

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello', 20, 80, 80, 30);
    v1.setConnectable(false);
    const v11 = graph.insertVertex(v1, null, '', 1, 1, 10, 10);
    if (v11.geometry) {
      v11.geometry.offset = new Point(-5, -5);
      v11.geometry.relative = true;
    }
    const v12 = graph.insertVertex(v1, null, '', 1, 0, 10, 10);
    if (v12.geometry) {
      v12.geometry.offset = new Point(-5, -5);
      v12.geometry.relative = true;
    }
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const v3 = graph.insertVertex(parent, null, 'World2', 200, 20, 80, 30);
    graph.insertEdge(parent, null, '', v11, v2);
    graph.insertEdge(parent, null, '', v12, v3);
  });

  const controller = document.createElement('div');
  div.appendChild(controller);

  const button = DomHelpers.button('View XML', function () {
    const xml = new ModelXmlSerializer(graph.getDataModel()).export();
    // TODO missing CSS for the popup
    popup(xml, true);
  });

  controller.appendChild(button);

  return div;
};

export const Default = Template.bind({});
