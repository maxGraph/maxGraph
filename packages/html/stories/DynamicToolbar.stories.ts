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
  type CellStyle,
  Graph,
  type HTMLImageElementWithProps,
  RubberBandHandler,
  type ConnectionHandler,
  ImageBox,
  MaxToolbar,
  GraphDataModel,
  Cell,
  Geometry,
  InternalEvent,
  styleUtils,
  gestureUtils,
  Client,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';
import '@maxgraph/core/css/common.css'; // style required by RubberBand

export default {
  title: 'Toolbars/DynamicToolbar',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

type InternalHTMLImageElementWithProps = HTMLImageElementWithProps & {
  enabled?: boolean;
};

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();
  const div = document.createElement('div');
  div.style.display = 'flex';

  // Creates the div for the toolbar
  const tbContainer = document.createElement('div');
  tbContainer.style.display = 'flex';
  tbContainer.style.flexDirection = 'column';
  tbContainer.style.marginRight = '.5rem';
  div.appendChild(tbContainer);

  // Creates new toolbar without event processing
  const toolbar = new MaxToolbar(tbContainer);
  toolbar.enabled = false;

  // Creates the div for the graph
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Creates the model and the graph inside the container
  // using the fastest rendering available on the browser
  const model = new GraphDataModel();
  const graph = new Graph(container, model);

  // Defines an icon for creating new connections in the connection handler.
  // This will automatically disable the highlighting of the source vertex.
  const connectionHandler = graph.getPlugin('ConnectionHandler') as ConnectionHandler;
  connectionHandler.connectImage = new ImageBox(
    `${Client.imageBasePath}/connector.gif`,
    16,
    16
  );

  // Enables new connections in the graph
  graph.setConnectable(true);
  graph.setMultigraph(false);

  // Stops editing on enter or escape keypress (TODO not working, do we want to keep this here?)
  // const keyHandler = new KeyHandler(graph);

  if (args.rubberBand) new RubberBandHandler(graph);

  addVertex('images/rectangle.gif', 100, 40, {});
  addVertex('images/rounded.gif', 100, 40, { rounded: true });
  addVertex('images/ellipse.gif', 40, 40, {
    shape: 'ellipse',
    perimeter: 'ellipsePerimeter',
  });
  addVertex('images/rhombus.gif', 40, 40, {
    shape: 'rhombus',
    perimeter: 'rhombusPerimeter',
  });
  addVertex('images/triangle.gif', 40, 40, {
    shape: 'triangle',
    perimeter: 'trianglePerimeter',
  });
  addVertex('images/cylinder.gif', 40, 40, { shape: 'cylinder' });
  addVertex('images/actor.gif', 30, 40, { shape: 'actor' });

  function addVertex(icon: string, w: number, h: number, style: CellStyle) {
    const vertex = new Cell(null, new Geometry(0, 0, w, h), style);
    vertex.setVertex(true);

    const img: InternalHTMLImageElementWithProps = addToolbarItem(
      graph,
      toolbar,
      vertex,
      icon
    );
    img.enabled = true;

    graph.getSelectionModel().addListener(InternalEvent.CHANGE, () => {
      const tmp = graph.isSelectionEmpty();
      styleUtils.setOpacity(img, tmp ? 100 : 20);
      img.enabled = tmp;
    });
  }

  function addToolbarItem(
    graph: Graph,
    toolbar: MaxToolbar,
    prototype: Cell,
    image: string
  ) {
    // Function that is executed when the image is dropped on the graph.
    // The cell argument points to the cell under the mouse pointer if there is one.
    const dropHandler = (
      graph: Graph,
      _evt: MouseEvent,
      _cell: Cell | null,
      x?: number,
      y?: number
    ) => {
      graph.stopEditing(false);

      const vertex = graph.getDataModel().cloneCell(prototype)!;
      if (vertex?.geometry) {
        x !== undefined && (vertex.geometry.x = x);
        y !== undefined && (vertex.geometry.y = y);
      }

      graph.addCell(vertex, null);
      graph.setSelectionCell(vertex);
    };

    // Creates the image which is used as the drag icon (preview)
    const img: InternalHTMLImageElementWithProps = toolbar.addMode(
      null,
      image,
      (evt: MouseEvent, cell: Cell) => {
        const pt = graph.getPointForEvent(evt);
        dropHandler(graph, evt, cell, pt.x, pt.y);
      },
      ''
    );

    InternalEvent.addListener(img, 'mousedown', (evt: MouseEvent) => {
      if (img.enabled == false) {
        InternalEvent.consume(evt);
      }
    });

    gestureUtils.makeDraggable(img, graph, dropHandler);
    return img;
  }

  return div;
};

export const Default = Template.bind({});
