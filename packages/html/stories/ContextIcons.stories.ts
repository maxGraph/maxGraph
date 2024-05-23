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
  Client,
  Graph,
  InternalEvent,
  RubberBandHandler,
  eventUtils,
  styleUtils,
  domUtils,
  VertexHandler,
  type CellState,
  type ConnectionHandler,
  type SelectionHandler,
} from '@maxgraph/core';

import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Icon_Images/ContextIcons',
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
  configureImagesBasePath();
  const container = createGraphContainer(args);

  // convenient function to create an image element available when the demo is not deployed in the root context
  const createImage = (fileName: string) => {
    return domUtils.createImage(`${Client.imageBasePath}/${fileName}`);
  };

  // Defines a subclass for VertexHandler that adds a set of clickable icons to every selected vertex.
  class CustomVertexToolHandler extends VertexHandler {
    private domNode: HTMLDivElement = null!;

    constructor(state: CellState) {
      super(state);
      this.init();
    }

    init() {
      // In this example we force the use of DIVs for images in IE. This
      // handles transparency in PNG images properly in IE and fixes the
      // problem that IE routes all mouse events for a gesture via the
      // initial IMG node, which means the target vertices
      this.domNode = document.createElement('div');
      this.domNode.style.position = 'absolute';
      this.domNode.style.whiteSpace = 'nowrap';

      // Delete
      let img = createImage('delete2.png');
      img.setAttribute('title', 'Delete');
      img.style.cursor = 'pointer';
      img.style.width = '16px';
      img.style.height = '16px';
      InternalEvent.addGestureListeners(img, (evt) => {
        // Disables dragging the image
        InternalEvent.consume(evt);
      });
      InternalEvent.addListener(img, 'click', (evt: Event) => {
        this.graph.removeCells([this.state.cell]);
        InternalEvent.consume(evt);
      });
      this.domNode.appendChild(img);

      // Size
      img = createImage('fit_to_size.png');
      img.setAttribute('title', 'Resize');
      img.style.cursor = 'se-resize';
      img.style.width = '16px';
      img.style.height = '16px';

      InternalEvent.addGestureListeners(img, (evt) => {
        this.start(eventUtils.getClientX(evt), eventUtils.getClientY(evt), 7);
        this.graph.isMouseDown = true;
        this.graph.isMouseTrigger = eventUtils.isMouseEvent(evt);
        InternalEvent.consume(evt);
      });
      this.domNode.appendChild(img);

      // Move
      img = createImage('plus.png');
      img.setAttribute('title', 'Move');
      img.style.cursor = 'move';
      img.style.width = '16px';
      img.style.height = '16px';

      const graphHandler = graph.getPlugin('SelectionHandler') as SelectionHandler;
      const connectionHandler = graph.getPlugin('ConnectionHandler') as ConnectionHandler;

      InternalEvent.addGestureListeners(img, (evt) => {
        graphHandler.start(
          this.state.cell,
          eventUtils.getClientX(evt),
          eventUtils.getClientY(evt)
        );
        graphHandler.cellWasClicked = true;
        this.graph.isMouseDown = true;
        this.graph.isMouseTrigger = eventUtils.isMouseEvent(evt);
        InternalEvent.consume(evt);
      });
      this.domNode.appendChild(img);

      // Connect
      img = createImage('check.png');
      img.setAttribute('title', 'Connect');
      img.style.cursor = 'pointer';
      img.style.width = '16px';
      img.style.height = '16px';

      InternalEvent.addGestureListeners(img, (evt) => {
        const pt = styleUtils.convertPoint(
          this.graph.container,
          eventUtils.getClientX(evt),
          eventUtils.getClientY(evt)
        );
        connectionHandler.start(this.state, pt.x, pt.y);
        this.graph.isMouseDown = true;
        this.graph.isMouseTrigger = eventUtils.isMouseEvent(evt);
        InternalEvent.consume(evt);
      });
      this.domNode.appendChild(img);

      this.graph.container.appendChild(this.domNode);
      this.redrawTools();
    }

    redraw() {
      super.redraw();
      this.redrawTools();
    }

    redrawTools() {
      if (this.state != null && this.domNode != null) {
        const dy = 4;
        this.domNode.style.left = `${this.state.x + this.state.width - 56}px`;
        this.domNode.style.top = `${this.state.y + this.state.height + dy}px`;
      }
    }

    onDestroy() {
      super.onDestroy();

      if (this.domNode) {
        this.domNode.parentNode?.removeChild(this.domNode);
        this.domNode = null!;
      }
    }
  }

  class MyCustomGraph extends Graph {
    createHandler(state: CellState) {
      if (state != null && state.cell.isVertex()) {
        return new CustomVertexToolHandler(state);
      }
      return super.createHandler(state);
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  graph.setConnectable(true);

  const connectionHandler = graph.getPlugin('ConnectionHandler') as ConnectionHandler;
  connectionHandler.createTarget = true;

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
    graph.insertEdge({
      parent,
      source: v1,
      target: v2,
    });
  });

  return container;
};

export const Default = Template.bind({});
