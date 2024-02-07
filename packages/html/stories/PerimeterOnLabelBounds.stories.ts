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
  type CellState,
  Graph,
  GraphView,
  InternalEvent,
  mathUtils,
  type Point,
  RubberBandHandler,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Labels/PerimeterOnLabelBounds',
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

  class MyCustomGraphView extends GraphView {
    constructor(graph: Graph) {
      super(graph);
    }

    // Redirects the perimeter to the label bounds if intersection between edge and label is found
    getPerimeterPoint(
      terminal: CellState,
      next: Point,
      orthogonal: boolean,
      border: number
    ): Point {
      let point = super.getPerimeterPoint(terminal, next, orthogonal, border);

      if (point) {
        const perimeter = super.getPerimeterFunction(terminal);
        if (terminal?.text?.boundingBox) {
          // Adds a small border to the label bounds
          const b = terminal.text.boundingBox.clone();
          b.grow(3);

          if (perimeter && mathUtils.rectangleIntersectsSegment(b, point, next)) {
            point = perimeter(b, terminal, next, orthogonal);
          }
        }
      }

      return point;
    }
  }

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement) {
      super(container);
    }

    createGraphView(): GraphView {
      return new MyCustomGraphView(this);
    }
  }

  // Creates the graph inside the given container
  const graph: Graph = new MyCustomGraph(container);
  graph.setVertexLabelsMovable(true);
  graph.setConnectable(true);

  // Uncomment the following if you want the container to fit the size of the graph
  // graph.setResizeContainer(true);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This is normally the first child of the root (i.e. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Label 1', 20, 20, 80, 30, {
      verticalLabelPosition: 'bottom',
    });
    const v2 = graph.insertVertex(parent, null, 'Label 2', 250, 20, 80, 30, {
      labelPosition: 'left',
      verticalLabelPosition: 'middle',
    });
    const v3 = graph.insertVertex(parent, null, 'Label 3', 20, 200, 80, 30, {
      verticalLabelPosition: 'top',
    });
    graph.insertEdge(parent, null, '', v1, v2);
    graph.insertEdge(parent, null, '', v1, v3);
  });

  return container;
};

export const Default = Template.bind({});
