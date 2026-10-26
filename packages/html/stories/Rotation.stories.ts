/*
Copyright 2026-present The maxGraph project Contributors

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
  type Cell,
  DomHelpers,
  Graph,
  InternalEvent,
  VertexHandlerConfig,
} from '@maxgraph/core';

import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';

export default {
  title: 'Editing/Rotation',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(`
    This example demonstrates rotating vertices with the rotation handle.
    <br>
    Select a vertex, then drag the handle above it. Rotating the group also rotates its children, which keep their
    position relative to the centre of the group.
    <br>
    The angle applied is the one the handle is dragged to, whatever the zoom level.
    <br>
    The vertices on the right are grouped as in
    <a href="https://github.com/maxGraph/maxGraph/issues/927" target="_blank">issue #927</a>, with
    <code>groupCells</code> and a group without fill nor stroke: select the group by clicking between them, then rotate
    it. "Group selection" groups the selected vertices the same way (Ctrl+click selects several vertices).
  `);

  const container = createGraphContainer(args);
  div.appendChild(container);

  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  // Shows the rotation handle on every selected vertex
  VertexHandlerConfig.rotationEnabled = true;

  const graph = new Graph(container);
  graph.setPanning(true);
  graph.centerZoom = false;
  // Lets the children of the group keep the position they are rotated to
  graph.constrainChildren = false;
  graph.extendParents = false;

  // Groups the cells as the code of issue #927 does: an invisible group, fitted to the cells
  const groupCells = (cells: Cell[]): Cell | null => {
    const cellsToGroup = graph.getCellsForGroup(cells);
    if (cellsToGroup.length < 2) {
      return null;
    }

    const group = graph.createGroupCell(cellsToGroup);
    graph.batchUpdate(() => {
      graph.groupCells(group, 0, cellsToGroup);
      graph.setCellStyle(
        {
          ...group.style,
          shape: 'rectangle',
          fillColor: 'none',
          strokeColor: 'none',
          rotatable: true,
          resizable: true,
        },
        [group]
      );
    });
    return group;
  };

  graph.batchUpdate(() => {
    graph.insertVertex({
      value: 'Standalone',
      position: [40, 200],
      size: [120, 60],
      style: { rotation: 20 },
    });

    const group = graph.insertVertex({
      value: 'Group',
      position: [240, 120],
      size: [220, 220],
      style: { verticalAlign: 'top', fillColor: '#f5f5f5' },
    });
    graph.insertVertex({
      parent: group,
      value: 'Child 1',
      position: [20, 60],
      size: [80, 40],
    });
    graph.insertVertex({
      parent: group,
      value: 'Child 2',
      position: [120, 140],
      size: [80, 40],
      style: { rotation: 45 },
    });

    groupCells([
      graph.insertVertex({ value: 'Grouped 1', position: [520, 140], size: [80, 40] }),
      graph.insertVertex({ value: 'Grouped 2', position: [620, 240], size: [80, 40] }),
    ]);
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);
  buttons.appendChild(DomHelpers.button('+', () => graph.zoomIn()));
  buttons.appendChild(DomHelpers.button('-', () => graph.zoomOut()));
  buttons.appendChild(
    DomHelpers.button('Group selection', () => {
      const group = groupCells(graph.getSelectionCells());
      if (group) {
        graph.setSelectionCell(group);
      }
    })
  );

  return div;
};

export const Default = Template.bind({});
