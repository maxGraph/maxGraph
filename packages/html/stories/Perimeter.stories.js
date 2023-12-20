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

import { Graph, RubberBandHandler, GraphView, mathUtils } from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Labels/Perimeter',
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
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Redirects the perimeter to the label bounds if intersection
  // between edge and label is found
  const mxGraphViewGetPerimeterPoint = GraphView.prototype.getPerimeterPoint;
  GraphView.prototype.getPerimeterPoint = function (terminal, next, orthogonal, border) {
    let point = mxGraphViewGetPerimeterPoint.apply(this, arguments);

    if (point != null) {
      const perimeter = this.getPerimeterFunction(terminal);

      if (terminal.text != null && terminal.text.boundingBox != null) {
        // Adds a small border to the label bounds
        const b = terminal.text.boundingBox.clone();
        b.grow(3);

        if (mathUtils.rectangleIntersectsSegment(b, point, next)) {
          point = perimeter(b, terminal, next, orthogonal);
        }
      }
    }

    return point;
  };

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setVertexLabelsMovable(true);
  graph.setConnectable(true);

  // Uncomment the following if you want the container
  // to fit the size of the graph
  // graph.setResizeContainer(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Label', 20, 20, 80, 30, {
      verticalLabelPosition: 'bottom',
    });
    const v2 = graph.insertVertex(parent, null, 'Label', 200, 20, 80, 30, {
      verticalLabelPosition: 'bottom',
    });
    const v3 = graph.insertVertex(parent, null, 'Label', 20, 150, 80, 30, {
      verticalLabelPosition: 'bottom',
    });
    var e1 = graph.insertEdge(parent, null, '', v1, v2);
    var e1 = graph.insertEdge(parent, null, '', v1, v3);
  });

  return container;
};

export const Default = Template.bind({});
