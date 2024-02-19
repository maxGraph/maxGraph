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

import { Graph, constants, RubberBandHandler, cloneUtils } from '@maxgraph/core';
import { globalValues, globalTypes } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Styles/HoverStyle',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const container = createGraphContainer(args);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  function updateStyle(state, hover) {
    if (hover) {
      state.style.fillColor = '#ff0000';
    }

    // Sets rounded style for both cases since the rounded style
    // is not set in the default style and is therefore inherited
    // once it is set, whereas the above overrides the default value
    state.style.rounded = hover ? '1' : '0';
    state.style.strokeWidth = hover ? '4' : '1';
    state.style.fontStyle = hover ? constants.FONT.BOLD : '0';
  }

  // Changes fill color to red on mouseover
  graph.addMouseListener({
    currentState: null,
    previousStyle: null,
    mouseDown(sender, me) {
      if (this.currentState != null) {
        this.dragLeave(me.getEvent(), this.currentState);
        this.currentState = null;
      }
    },
    mouseMove(sender, me) {
      if (this.currentState != null && me.getState() == this.currentState) {
        return;
      }

      let tmp = graph.view.getState(me.getCell());

      // Ignores everything but vertices
      if (graph.isMouseDown || (tmp != null && !tmp.cell.isVertex())) {
        tmp = null;
      }

      if (tmp != this.currentState) {
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
      if (state != null) {
        this.previousStyle = state.style;
        state.style = cloneUtils.clone(state.style);
        updateStyle(state, true);
        state.shape.apply(state);
        state.shape.redraw();

        if (state.text != null) {
          state.text.apply(state);
          state.text.redraw();
        }
      }
    },
    dragLeave(evt, state) {
      if (state != null) {
        state.style = this.previousStyle;
        updateStyle(state, false);
        state.shape.apply(state);
        state.shape.redraw();

        if (state.text != null) {
          state.text.apply(state);
          state.text.redraw();
        }
      }
    },
  });

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  return container;
};

export const Default = Template.bind({});
