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
  InternalEvent,
  RubberBandHandler,
  ImageBox,
  Rectangle,
  mathUtils,
  domUtils,
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
  title: 'Icon_Images/HoverIcons',
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
  configureImagesBasePath();
  const container = createGraphContainer(args);

  // Defines a new class for all icons
  class mxIconSet {
    constructor(state) {
      this.images = [];
      const { graph } = state.view;

      // Icon1
      let img = domUtils.createImage('images/copy.png');
      img.setAttribute('title', 'Duplicate');
      Object.assign(img.style, {
        cursor: 'pointer',
        width: '16px',
        height: '16px',
        position: 'absolute',
        left: `${state.x + state.width}px`,
        top: `${state.y + state.height}px`,
      });

      InternalEvent.addGestureListeners(img, (evt) => {
        const s = graph.gridSize;
        graph.setSelectionCells(graph.moveCells([state.cell], s, s, true));
        InternalEvent.consume(evt);
        this.destroy();
      });

      state.view.graph.container.appendChild(img);
      this.images.push(img);

      // Delete
      img = domUtils.createImage('images/delete2.png');
      img.setAttribute('title', 'Delete');
      Object.assign(img.style, {
        cursor: 'pointer',
        width: '16px',
        height: '16px',
        position: 'absolute',
        left: `${state.x + state.width}px`,
        top: `${state.y - 16}px`,
      });

      InternalEvent.addGestureListeners(img, (evt) => {
        // Disables dragging the image
        InternalEvent.consume(evt);
      });

      InternalEvent.addListener(img, 'click', (evt) => {
        graph.removeCells([state.cell]);
        InternalEvent.consume(evt);
        this.destroy();
      });

      state.view.graph.container.appendChild(img);
      this.images.push(img);
    }

    destroy() {
      if (this.images != null) {
        for (const img of this.images) {
          img.parentNode.removeChild(img);
        }
      }
      this.images = null;
    }
  }

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setConnectable(true);

  // Defines an icon for creating new connections in the connection handler.
  // This will automatically disable the highlighting of the source vertex.
  const connectionHandler = graph.getPlugin('ConnectionHandler');
  connectionHandler.connectImage = new ImageBox(
    `${Client.imageBasePath}/connector.gif`,
    16,
    16
  );

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Defines the tolerance before removing the icons
  const ICON_TOLERANCE = 20;

  // Shows icons if the mouse is over a cell
  graph.addMouseListener({
    currentState: null,
    currentIconSet: null,

    mouseDown(sender, me) {
      // Hides icons on mouse down
      if (this.currentState != null) {
        this.dragLeave(me.getEvent(), this.currentState);
        this.currentState = null;
      }
    },

    mouseMove(sender, me) {
      if (
        this.currentState != null &&
        (me.getState() === this.currentState || me.getState() == null)
      ) {
        const tol = ICON_TOLERANCE;
        const tmp = new Rectangle(
          me.getGraphX() - tol,
          me.getGraphY() - tol,
          2 * tol,
          2 * tol
        );
        if (mathUtils.intersects(tmp, this.currentState)) {
          return;
        }
      }

      let tmp = graph.view.getState(me.getCell());

      // Ignore everything but vertices
      if (graph.isMouseDown || (tmp != null && !tmp.cell.isVertex())) {
        tmp = null;
      }

      if (tmp !== this.currentState) {
        if (this.currentState != null) {
          this.dragLeave(me.getEvent(), this.currentState);
        }

        this.currentState = tmp;
        if (this.currentState != null) {
          this.dragEnter(me.getEvent(), this.currentState);
        }
      }
    },

    mouseUp(sender, me) {},

    dragEnter(evt, state) {
      if (this.currentIconSet == null) {
        this.currentIconSet = new mxIconSet(state);
      }
    },

    dragLeave(evt, state) {
      if (this.currentIconSet != null) {
        this.currentIconSet.destroy();
        this.currentIconSet = null;
      }
    },
  });

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

  return container;
};

export const Default = Template.bind({});
