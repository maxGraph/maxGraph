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

import { Graph, styleUtils } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Connections/EdgeTolerance',
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

  class MyCustomGraph extends Graph {
    fireMouseEvent(evtName, me, sender) {
      // Overrides the mouse event dispatching mechanism to update the
      // cell which is associated with the event in case the native hit
      // detection did not return anything.

      // Checks if native hit detection did not return anything
      if (me.getState() == null) {
        // Updates the graph coordinates in the event since we need
        // them here. Storing them in the event means the overridden
        // method doesn't have to do this again.
        if (me.graphX == null || me.graphY == null) {
          const pt = styleUtils.convertPoint(container, me.getX(), me.getY());

          me.graphX = pt.x;
          me.graphY = pt.y;
        }

        const cell = this.getCellAt(me.graphX, me.graphY);

        if (cell?.isEdge()) {
          me.state = this.view.getState(cell);

          if (me.state != null && me.state.shape != null) {
            this.container.style.cursor = me.state.shape.node.style.cursor;
          }
        }
      }

      if (me.state == null) {
        this.container.style.cursor = 'default';
      }

      super.fireMouseEvent(evtName, me, sender);
    }

    dblClick(evt, cell) {
      // Overrides double click handling to use the tolerance
      if (cell == null) {
        const pt = styleUtils.convertPoint(
          el,
          eventUtils.getClientX(evt),
          eventUtils.getClientY(evt)
        );
        cell = this.getCellAt(pt.x, pt.y);
      }
      super.dblClick(evt, cell);
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  graph.setEventTolerance(20);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [120, 120],
      size: [80, 30],
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [400, 250],
      size: [80, 30],
    });
    const e1 = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
      style: {
        edgeStyle: 'orthogonalEdgeStyle',
      },
    });
    const e2 = graph.insertEdge({
      parent,
      source: v2,
      target: v1,
      style: {
        edgeStyle: 'orthogonalEdgeStyle',
      },
    });
  });

  return container;
};

export const Default = Template.bind({});
