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

import { Graph, RubberBandHandler, SelectionHandler, PopupMenuHandler } from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Layouts/Groups',
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
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';

  // Overrides check for valid roots
  Graph.prototype.isValidRoot = function () {
    return false;
  };

  // Don't clear selection if multiple cells selected
  const graphHandlerMouseDown = SelectionHandler.prototype.mouseDown;
  SelectionHandler.prototype.mouseDown = function (sender, me) {
    graphHandlerMouseDown.apply(this, arguments);

    if (this.graph.isCellSelected(me.getCell()) && this.graph.getSelectionCount() > 1) {
      this.delayedSelection = false;
    }
  };

  // Selects descendants before children selection mode
  const graphHandlerGetInitialCellForEvent =
    SelectionHandler.prototype.getInitialCellForEvent;
  SelectionHandler.prototype.getInitialCellForEvent = function (me) {
    const model = this.graph.getDataModel();
    const psel = this.graph.getSelectionCell().getParent();
    let cell = graphHandlerGetInitialCellForEvent.apply(this, arguments);
    let parent = cell.getParent();

    if (psel == null || (psel != cell && psel != parent)) {
      while (
        !this.graph.isCellSelected(cell) &&
        !this.graph.isCellSelected(parent) &&
        parent.isVertex() &&
        !this.graph.isValidRoot(parent)
      ) {
        cell = parent;
        parent = cell.getParent();
      }
    }

    return cell;
  };

  // Selection is delayed to mouseup if child selected
  const graphHandlerIsDelayedSelection = SelectionHandler.prototype.isDelayedSelection;
  SelectionHandler.prototype.isDelayedSelection = function (cell) {
    let result = graphHandlerIsDelayedSelection.apply(this, arguments);
    const model = this.graph.getDataModel();
    const psel = this.graph.getSelectionCell().getParent();
    const parent = cell.getParent();

    if (psel == null || (psel != cell && psel != parent)) {
      if (
        !this.graph.isCellSelected(cell) &&
        parent.isVertex() &&
        !this.graph.isValidRoot(parent)
      ) {
        result = true;
      }
    }

    return result;
  };

  // Delayed selection of parent group
  SelectionHandler.prototype.selectDelayed = function (me) {
    let cell = me.getCell();

    if (cell == null) {
      cell = this.cell;
    }

    const model = this.graph.getDataModel();
    let parent = cell.getParent();

    while (
      this.graph.isCellSelected(cell) &&
      parent.isVertex() &&
      !this.graph.isValidRoot(parent)
    ) {
      cell = parent;
      parent = cell.getParent();
    }

    this.graph.selectCellForEvent(cell, me.getEvent());
  };

  // Returns last selected ancestor
  PopupMenuHandler.prototype.getCellForPopupEvent = function (me) {
    let cell = me.getCell();
    const model = this.graph.getDataModel();
    let parent = cell.getParent();

    while (parent.isVertex() && !this.graph.isValidRoot(parent)) {
      if (this.graph.isCellSelected(parent)) {
        cell = parent;
      }

      parent = parent.getParent();
    }

    return cell;
  };

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.constrainChildren = false;
  graph.extendParents = false;
  graph.extendParentsOnAdd = false;

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
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 120, 60);
    const v2 = graph.insertVertex(v1, null, 'World!', 90, 20, 60, 20);
  });

  return container;
};

export const Default = Template.bind({});
