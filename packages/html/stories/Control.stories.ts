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
  CellRenderer,
  type CellState,
  DomHelpers,
  getDefaultPlugins,
  Graph,
  type GraphPluginConstructor,
  ImageBox,
  ImageShape,
  InternalEvent,
  Rectangle,
  RubberBandHandler,
  Shape,
} from '@maxgraph/core';
import {
  contextMenuTypes,
  contextMenuValues,
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Icon_Images/Control',
  argTypes: {
    ...contextMenuTypes,
    ...globalTypes,
    ...rubberBandTypes,
    resizeContainer: {
      type: 'boolean',
      defaultValue: false,
    },
  },
  args: {
    ...globalValues,
    resizeContainer: false,
    ...contextMenuValues,
    ...rubberBandValues,
  },
};

type CustomCellState = CellState & { deleteControl: Shape | null };

const Template = ({ label, ...args }: Record<string, any>) => {
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Specifies the URL and size of the new control
  const deleteImage = new ImageBox('images/overlays/forbidden.png', 16, 16);

  class MyCustomCellRenderer extends CellRenderer {
    override createControl(state: CustomCellState) {
      super.createControl(state);

      const { graph } = state.view;

      if (state.cell.isVertex()) {
        if (!state.deleteControl) {
          const b = new Rectangle(0, 0, deleteImage.width, deleteImage.height);
          state.deleteControl = new ImageShape(b, deleteImage.src);
          state.deleteControl.dialect = graph.dialect;
          state.deleteControl.preserveImageAspect = false;

          this.initControl(state, state.deleteControl, false, function (evt) {
            if (graph.isEnabled()) {
              graph.removeCells([state.cell]);
              InternalEvent.consume(evt);
            }
          });
        }
      } else if (state.deleteControl) {
        state.deleteControl.destroy();
        state.deleteControl = null;
      }
    }

    // Helper function to compute the bounds of the control
    private getDeleteControlBounds(state: CustomCellState) {
      if (state.deleteControl) {
        const oldScale = state.deleteControl.scale;
        const w = state.deleteControl.bounds!.width / oldScale;
        const h = state.deleteControl.bounds!.height / oldScale;
        const s = state.view.scale;

        return state.cell.isEdge()
          ? new Rectangle(
              state.x + state.width / 2 - (w / 2) * s,
              state.y + state.height / 2 - (h / 2) * s,
              w * s,
              h * s
            )
          : new Rectangle(state.x + state.width - w * s, state.y, w * s, h * s);
      }
      return null;
    }

    // Overridden to update the scale and bounds of the control
    override redrawControl(state: CustomCellState) {
      super.redrawControl(state);

      if (state.deleteControl) {
        const bounds = this.getDeleteControlBounds(state);
        const s = state.view.scale;

        if (
          state.deleteControl.scale !== s ||
          !state.deleteControl.bounds!.equals(bounds)
        ) {
          state.deleteControl.bounds = bounds;
          state.deleteControl.scale = s;
          state.deleteControl.redraw();
        }
      }
    }

    // Overridden to remove the control if the state is destroyed
    override destroy(state: CustomCellState) {
      super.destroy(state);

      if (state.deleteControl) {
        state.deleteControl.destroy();
        state.deleteControl = null;
      }
    }
  }

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement, plugins: GraphPluginConstructor[]) {
      super(container, undefined, plugins);
    }

    override createCellRenderer() {
      return new MyCustomCellRenderer();
    }
  }

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container, plugins);
  graph.setPanning(true);

  if (args.resizeContainer) {
    graph.setResizeContainer(true);
  }

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
    const v3 = graph.insertVertex({
      value: 'People',
      position: [400, 50],
      size: [80, 30],
    });
    graph.insertEdge({
      source: v2,
      target: v3,
      style: {
        edgeStyle: 'elbowEdgeStyle',
        endArrow: 'openThin',
        endFill: false,
      },
    });
    const v4 = graph.insertVertex({
      value: 'Earth',
      position: [90, 270],
      size: [80, 30],
    });
    graph.insertEdge({
      source: v2,
      target: v4,
      style: {
        edgeStyle: 'orthogonalEdgeStyle',
        endArrow: 'blockThin',
        endFill: false,
      },
    });
  });

  graph.centerZoom = false;

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('Zoom In', () => {
      graph.zoomIn();
    })
  );
  buttons.appendChild(
    DomHelpers.button('Zoom Out', () => {
      graph.zoomOut();
    })
  );
  buttons.appendChild(
    DomHelpers.button('Reset Zoom', () => {
      graph.zoomActual();
    })
  );

  return div;
};

export const Default = Template.bind({});
