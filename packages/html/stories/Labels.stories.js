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
  Graph,
  RubberBandHandler,
  KeyHandler,
  constants,
  Rectangle,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Labels/Labels',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setTooltips(true);
  graph.htmlLabels = true;
  graph.vertexLabelsMovable = true;

  if (args.rubberBand) new RubberBandHandler(graph);

  new KeyHandler(graph);

  const selectionHandler = graph.getPlugin('SelectionHandler');

  // Do not allow removing labels from parents
  selectionHandler.removeCellsFromParent = false;

  // Allow auto-size labels on insert
  graph.autoSizeCellsOnAdd = true;

  // Allows moving of relative cells
  graph.isCellLocked = function (cell) {
    return this.isCellsLocked();
  };

  graph.isCellResizable = function (cell) {
    const geo = cell.getGeometry();

    return geo == null || !geo.relative;
  };

  // Truncates the label to the size of the vertex
  graph.getLabel = function (cell) {
    const label = this.labelsVisible ? this.convertValueToString(cell) : '';
    const geometry = cell.getGeometry();

    if (
      !cell.isCollapsed() &&
      geometry != null &&
      (geometry.offset == null || (geometry.offset.x == 0 && geometry.offset.y == 0)) &&
      cell.isVertex() &&
      geometry.width >= 2
    ) {
      const style = this.getCellStyle(cell);
      const fontSize = style.fontSize || constants.DEFAULT_FONTSIZE;
      const max = geometry.width / (fontSize * 0.625);

      if (max < label.length) {
        return `${label.substring(0, max)}...`;
      }
    }

    return label;
  };

  // Enables wrapping for vertex labels
  graph.isWrapping = function (cell) {
    return cell.isCollapsed();
  };

  // Enables clipping of vertex labels if no offset is defined
  graph.isLabelClipped = function (cell) {
    const geometry = cell.getGeometry();

    return (
      geometry != null &&
      !geometry.relative &&
      (geometry.offset == null || (geometry.offset.x == 0 && geometry.offset.y == 0))
    );
  };

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'vertexLabelsMovable', 20, 20, 80, 30);

    // Places sublabels inside the vertex
    const label11 = graph.insertVertex(
      v1,
      null,
      'Label1',
      0.5,
      1,
      0,
      0,
      { baseStyleNames: [] },
      true
    );
    const label12 = graph.insertVertex(
      v1,
      null,
      'Label2',
      0.5,
      0,
      0,
      0,
      { baseStyleNames: [] },
      true
    );

    const v2 = graph.insertVertex(
      parent,
      null,
      'Wrapping and clipping is enabled only if the cell is collapsed, otherwise the label is truncated if there is no manual offset.',
      200,
      150,
      80,
      30
    );
    v2.geometry.alternateBounds = new Rectangle(0, 0, 80, 30);
    const e1 = graph.insertEdge(parent, null, 'edgeLabelsMovable', v1, v2);

    // Places sublabels inside the vertex
    const label21 = graph.insertVertex(
      v2,
      null,
      'Label1',
      0.5,
      1,
      0,
      0,
      { baseStyleNames: [] },
      true
    );
    const label22 = graph.insertVertex(
      v2,
      null,
      'Label2',
      0.5,
      0,
      0,
      0,
      { baseStyleNames: [] },
      true
    );
  });

  return container;
};

export const Default = Template.bind({});
