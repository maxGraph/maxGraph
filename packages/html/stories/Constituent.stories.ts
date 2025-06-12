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
  type Cell,
  CellEditorHandler,
  type CellStateStyle,
  ConnectionHandler,
  FitPlugin,
  Graph,
  InternalEvent,
  InternalMouseEvent,
  PanningHandler,
  PopupMenuHandler,
  RubberBandHandler,
  SelectionCellsHandler,
  SelectionHandler,
  TooltipHandler,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';

export default {
  title: 'Layouts/Constituent',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const isNullish = (v: any): v is null | undefined => v === null || v === undefined;

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(
    `This example demonstrates using cells as parts of other cells.`
  );

  const container = createGraphContainer(args);
  div.appendChild(container);

  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  class MyCustomSelectionHandler extends SelectionHandler {
    /**
     * Redirects start drag to parent.
     */
    override getInitialCellForEvent(me: InternalMouseEvent) {
      let cell = super.getInitialCellForEvent(me);
      if ((this.graph as MyCustomGraph).isPart(cell)) {
        cell = cell?.getParent() ?? null;
      }
      return cell;
    }
  }

  type CustomCellStateStyle = CellStateStyle & {
    constituent: boolean;
  };

  class MyCustomGraph extends Graph {
    constructor(container: HTMLElement) {
      super(container, undefined, [
        // same as getDefaultPlugins, but with custom SelectionHandler
        CellEditorHandler,
        TooltipHandler,
        SelectionCellsHandler,
        PopupMenuHandler,
        ConnectionHandler,
        MyCustomSelectionHandler, // replaces SelectionHandler
        PanningHandler,
        FitPlugin,
        // additional plugin for rubber band selection
        RubberBandHandler,
      ]);
      this.options.foldingEnabled = false;
      this.recursiveResize = true;
    }

    // Helper method to mark parts with constituent in the Cell style
    isPart(cell: Cell | null): boolean {
      return (
        !isNullish(cell) &&
        (this.getCurrentCellStyle(cell) as CustomCellStateStyle).constituent
      );
    }

    // Redirects selection to parent
    override selectCellForEvent = (cell: Cell, evt: MouseEvent) => {
      if (this.isPart(cell)) {
        const parent = cell.getParent();
        !isNullish(parent) && (cell = parent);
      }
      super.selectCellForEvent(cell, evt);
    };
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent: graph.getDefaultParent(),
      position: [20, 20],
      size: [120, 70],
    });
    graph.insertVertex({
      parent: v1,
      value: 'Constituent',
      position: [20, 20],
      size: [80, 30],
      style: {
        constituent: true,
      } as CustomCellStateStyle,
    });
  });

  return div;
};

export const Default = Template.bind({});
