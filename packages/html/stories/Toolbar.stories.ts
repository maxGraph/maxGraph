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
  type AbstractGraph,
  Cell,
  type CellStyle,
  Client,
  type ConnectionHandler,
  DomHelpers,
  DragSource,
  Geometry,
  gestureUtils,
  Graph,
  GraphDataModel,
  ImageBox,
  MaxToolbar,
  Point,
  RubberBandHandler,
  cellArrayUtils,
  getDefaultPlugins,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import {
  configureExpandedAndCollapsedImages,
  configureImagesBasePath,
  createGraphContainer,
} from './shared/configure.js';
import '@maxgraph/core/css/common.css'; // style required by RubberBand

export default {
  title: 'Toolbars/Toolbar',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: { [p: string]: any }) => {
  configureImagesBasePath();
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = 'column-reverse';

  const toolbarAndGraphParentContainer = document.createElement('div');
  toolbarAndGraphParentContainer.style.display = 'flex';
  div.appendChild(toolbarAndGraphParentContainer);

  // Creates the div for the toolbar
  const tbContainer = document.createElement('div');
  tbContainer.style.display = 'flex';
  tbContainer.style.flexDirection = 'column';
  tbContainer.style.marginRight = '.5rem';

  toolbarAndGraphParentContainer.appendChild(tbContainer);

  // Creates new toolbar without event processing
  const toolbar = new MaxToolbar(tbContainer);
  toolbar.enabled = false;

  // Creates the model and the graph inside the container
  // using the fastest rendering available on the browser
  const container = createGraphContainer(args);
  toolbarAndGraphParentContainer.appendChild(container);

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const model = new GraphDataModel();
  const graph = new Graph(container, model, plugins);
  configureExpandedAndCollapsedImages(graph);
  graph.dropEnabled = true;

  // Defines an icon for creating new connections in the connection handler.
  // This will automatically disable the highlighting of the source vertex.
  const connectionHandler = graph.getPlugin<ConnectionHandler>('ConnectionHandler');
  connectionHandler.connectImage = new ImageBox(
    `${Client.imageBasePath}/connector.gif`,
    16,
    16
  );

  // Matches DnD inside the graph
  DragSource.prototype.getDropTarget = function (
    graph: Graph,
    x: number,
    y: number,
    _evt: MouseEvent
  ) {
    let cell = graph.getCellAt(x, y);
    if (cell && !graph.isValidDropTarget(cell)) {
      cell = null;
    }
    return cell;
  };

  // Enables new connections in the graph
  graph.setConnectable(true);
  graph.setMultigraph(false);

  // Stops editing on enter or escape keypress (TODO not working, do we want to keep this here?)
  // const keyHandler = new KeyHandler(graph);

  function addCell(
    isVertex: boolean,
    icon: string,
    w: number,
    h: number,
    style: CellStyle
  ) {
    const cell = new Cell(null, new Geometry(0, 0, w, h), style);
    cell.setVertex(isVertex);
    cell.setEdge(!isVertex);

    addToolbarItem(graph, toolbar, cell, icon, !isVertex ? 'Edge' : undefined);
  }

  function addVertex(icon: string, w: number, h: number, style: CellStyle) {
    addCell(true, icon, w, h, style);
  }

  // the line is not correctly display when calling toolbar.addLine() when the toolbar is in a flex container
  function addToolbarLine() {
    const hr = document.createElement('hr');
    hr.style.maxHeight = '0';
    hr.style.minWidth = '100%';
    hr.setAttribute('size', '1');
    tbContainer.appendChild(hr);
  }

  addVertex('images/swimlane.gif', 120, 160, { shape: 'swimlane', startSize: 20 });
  addVertex('images/rectangle.gif', 100, 40, {});
  addVertex('images/rounded.gif', 100, 40, { rounded: true });
  addVertex('images/ellipse.gif', 40, 40, { shape: 'ellipse' });
  addVertex('images/rhombus.gif', 40, 40, { shape: 'rhombus' });
  addVertex('images/triangle.gif', 40, 40, { shape: 'triangle' });
  addVertex('images/cylinder.gif', 40, 40, { shape: 'cylinder' });
  addVertex('images/actor.gif', 30, 40, { shape: 'actor' });
  addToolbarLine();

  function addEdge(icon: string, w: number, h: number, style: CellStyle) {
    addCell(false, icon, w, h, style);
  }
  addEdge('images/entity.gif', 50, 50, {});
  addToolbarLine();

  const button = DomHelpers.button('Create toolbar entry from selection', (evt) => {
    if (!graph.isSelectionEmpty()) {
      // Creates a copy of the selection array to preserve its state
      const cells = graph.getSelectionCells();
      const bounds = graph.getView().getBounds(cells);

      // Function that is executed when the image is dropped on
      // the graph. The cell argument points to the cell under
      // the mousepointer if there is one.
      const funct = (graph: AbstractGraph, _evt: MouseEvent, cell: Cell | null) => {
        graph.stopEditing(false);

        const pt = graph.getPointForEvent(evt);
        const dx = pt.x - (bounds?.x ?? 0);
        const dy = pt.y - (bounds?.y ?? 0);

        graph.setSelectionCells(graph.importCells(cells, dx, dy, cell));
      };

      // Creates the image which is used as the drag icon (preview)
      const img = toolbar.addMode(null, 'images/outline.gif', funct, '');
      gestureUtils.makeDraggable(img, graph, funct);
    }
  });

  button.style.marginBottom = '1rem';
  button.style.alignSelf = 'flex-start';
  div.appendChild(button);

  function addToolbarItem(
    graph: Graph,
    toolbar: MaxToolbar,
    prototype: Cell,
    image: string,
    title?: string
  ) {
    // Function that is executed when the image is dropped on
    // the graph. The cell argument points to the cell under
    // the mousepointer if there is one.
    const funct = (graph: AbstractGraph, evt: MouseEvent, cell: Cell | null) => {
      graph.stopEditing(false);

      const pt = graph.getPointForEvent(evt);
      const cellToImport = cellArrayUtils.cloneCell(prototype);
      if (!cellToImport) return;

      if (cellToImport.geometry) {
        cellToImport.geometry.x = pt.x;
        cellToImport.geometry.y = pt.y;

        if (cellToImport.isEdge()) {
          cellToImport.geometry.sourcePoint = new Point(pt.x, pt.y);
          cellToImport.geometry.targetPoint = new Point(
            pt.x + cellToImport.geometry.width,
            pt.y + cellToImport.geometry.height
          );
        }
      }

      graph.setSelectionCells(graph.importCells([cellToImport], 0, 0, cell));
    };

    // Creates the image which is used as the drag icon (preview)
    const img = toolbar.addMode(title, image, funct, '');
    gestureUtils.makeDraggable(img, graph, funct);
  }

  return div;
};

export const Default = Template.bind({});
