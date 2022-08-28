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
  domUtils,
  RubberBandHandler,
  DragSource,
  gestureUtils,
  EdgeHandler,
  SelectionHandler,
  Guide,
  eventUtils,
  Cell,
  CellArray,
  Geometry,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'DnD_CopyPaste/DragSource',
  argTypes: {
    ...globalTypes,
    rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },
  },
};

const Template = ({ label, ...args }) => {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.cursor = 'default';

  class MyCustomGuide extends Guide {
    isEnabledForEvent(evt) {
      // Alt disables guides
      return !eventUtils.isAltDown(evt);
    }
  }

  class MyCustomGraphHandler extends SelectionHandler {
    // Enables guides
    guidesEnabled = true;

    createGuide() {
      return new MyCustomGuide(this.graph, this.getGuideStates());
    }
  }

  class MyCustomEdgeHandler extends EdgeHandler {
    // Enables snapping waypoints to terminals
    snapToTerminals = true;
  }

  class MyCustomGraph extends Graph {
    createGraphHandler() {
      return new MyCustomGraphHandler(this);
    }

    createEdgeHandler(state, edgeStyle) {
      return new MyCustomEdgeHandler(state, edgeStyle);
    }
  }

  const graphs = [];

  // Creates the graph inside the given container
  for (let i = 0; i < 2; i++) {
    const subContainer = document.createElement('div');
    subContainer.style.overflow = 'hidden';
    subContainer.style.position = 'relative';
    subContainer.style.width = '321px';
    subContainer.style.height = '241px';
    subContainer.style.background = "url('/images/grid.gif')";
    subContainer.style.cursor = 'default';
    container.appendChild(subContainer);

    const graph = new MyCustomGraph(subContainer);
    graph.gridSize = 30;

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
      const v1 = graph.insertVertex({
        parent,
        value: 'Hello,',
        position: [20, 20],
        size: [80, 30],
      });
      const v2 = graph.insertVertex({
        parent,
        value: 'World!',
        position: [200, 150],
        size: [80, 30],
      });
      const e1 = graph.insertEdge({
        parent,
        source: v1,
        target: v2,
      });
    });

    graphs.push(graph);
  }

  // Returns the graph under the mouse
  const graphF = (evt) => {
    const x = eventUtils.getClientX(evt);
    const y = eventUtils.getClientY(evt);
    const elt = document.elementFromPoint(x, y);

    for (const graph of graphs) {
      if (domUtils.isAncestorNode(graph.container, elt)) {
        return graph;
      }
    }
    return null;
  };

  // Inserts a cell at the given location
  const funct = (graph, evt, target, x, y) => {
    const cell = new Cell('Test', new Geometry(0, 0, 120, 40));
    cell.vertex = true;
    const cells = graph.importCells(new CellArray(cell), x, y, target);

    if (cells != null && cells.length > 0) {
      graph.scrollCellToVisible(cells[0]);
      graph.setSelectionCells(cells);
    }
  };

  // Creates a DOM node that acts as the drag source
  const img = domUtils.createImage('images/icons48/gear.png');
  img.style.width = '48px';
  img.style.height = '48px';
  container.appendChild(img);

  // Creates the element that is being for the actual preview.
  const dragElt = document.createElement('div');
  dragElt.style.border = 'dashed black 1px';
  dragElt.style.width = '120px';
  dragElt.style.height = '40px';

  // Drag source is configured to use dragElt for preview and as drag icon
  // if scalePreview (last) argument is true. Dx and dy are null to force
  // the use of the defaults. Note that dx and dy are only used for the
  // drag icon but not for the preview.
  const ds = gestureUtils.makeDraggable(img, graphF, funct, dragElt, null, null, graphs[0].autoscroll, true);

  // Redirects feature to global switch. Note that this feature should only be used
  // if the the x and y arguments are used in funct to insert the cell.
  ds.isGuidesEnabled = () => {
    return graphs[0].graphHandler.guidesEnabled;
  };

  // Restores original drag icon while outside of graph
  ds.createDragElement = DragSource.prototype.createDragElement;

  return container;
};

export const Default = Template.bind({});
