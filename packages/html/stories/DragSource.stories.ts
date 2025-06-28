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
  type CellState,
  domUtils,
  RubberBandHandler,
  DragSource,
  gestureUtils,
  SelectionHandler,
  Guide,
  eventUtils,
  Cell,
  Geometry,
  CellEditorHandler,
  SelectionCellsHandler,
  ConnectionHandler,
  type EdgeStyleFunction,
  type DropHandler,
  InternalEvent,
  PanningHandler,
  type GraphPluginConstructor,
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
  title: 'DnD_CopyPaste/DragSource',
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
  const container =
    createMainDiv(`Drag and drop the "gear" icon at the bottom of the page to one of the Graph to create a new vertex.
  <br>
    Panning is enabled in all Graphs.
  `);
  InternalEvent.disableContextMenu(container);

  class MyCustomGuide extends Guide {
    override isEnabledForEvent(evt: MouseEvent) {
      // Alt disables guides
      return !eventUtils.isAltDown(evt);
    }
  }

  class MyCustomSelectionHandler extends SelectionHandler {
    // Enables guides
    override guidesEnabled = true;

    override createGuide() {
      return new MyCustomGuide(this.graph, this.getGuideStates());
    }
  }

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement) {
      const plugins: GraphPluginConstructor[] = [
        // part of getDefaultPlugins
        CellEditorHandler,
        ConnectionHandler,
        SelectionCellsHandler,
        MyCustomSelectionHandler, // replaces SelectionHandler
        PanningHandler,
      ];
      // Enables rubberband selection
      args.rubberBand && plugins.push(RubberBandHandler);

      super(container, undefined, plugins);
      this.options.foldingEnabled = false;
      this.recursiveResize = true;
    }

    override createEdgeHandler(state: CellState, edgeStyle: EdgeStyleFunction | null) {
      const edgeHandler = super.createEdgeHandler(state, edgeStyle);
      edgeHandler.snapToTerminals = true; // Enables snapping waypoints to terminals
      return edgeHandler;
    }
  }

  const graphs: Graph[] = [];

  // Creates the graph inside the given container
  const numberOfGraphs = 2;
  for (let i = 0; i < numberOfGraphs; i++) {
    const subContainer = createGraphContainer({ width: '321', height: '241' });
    container.appendChild(subContainer);

    const graph = new MyCustomGraph(subContainer);
    graph.gridSize = 30;

    // Enables panning
    graph.setPanning(true);

    // Adds cells to the model in a single step
    graph.batchUpdate(() => {
      const v1 = graph.insertVertex({
        value: 'Hello,',
        position: [20, 20],
        size: [80, 30],
      });
      const v2 = graph.insertVertex({
        value: 'World!',
        position: [200, 150],
        size: [80, 30],
      });
      graph.insertEdge({
        source: v1,
        target: v2,
      });
    });

    graphs.push(graph);
  }

  // Returns the graph under the mouse
  const graphF = (evt: MouseEvent) => {
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
  const dropHandlerFunction: DropHandler = (graph, _evt, target, x, y) => {
    const cell = new Cell('Test', new Geometry(0, 0, 120, 40));
    cell.vertex = true;
    const cells = graph.importCells([cell], x, y, target);

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

  // Drag source is configured to use dragElt for preview and as drag icon if scalePreview (last) argument is true.
  // Dx and dy are null to force the use of the defaults.
  // Note that dx and dy are only used for the drag icon but not for the preview.
  const dragSource = gestureUtils.makeDraggable(
    img,
    graphF,
    dropHandlerFunction,
    dragElt,
    null,
    null,
    graphs[0].autoScroll,
    true
  );

  // Redirects feature to global switch.
  // Note that this feature should only be used if the x and y arguments are used in dropHandlerFunction to insert the cell.
  dragSource.isGuidesEnabled = () => {
    return (
      graphs[0].getPlugin<SelectionHandler>('SelectionHandler')?.guidesEnabled ?? false
    );
  };

  // Restores original drag icon while outside of graph
  dragSource.createDragElement = DragSource.prototype.createDragElement;

  return container;
};

export const Default = Template.bind({});
