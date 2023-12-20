/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2013, JGraph Ltd

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

/*
HTML label

This example demonstrates using HTML labels that are connected to the state of the user object.
*/

import {
  xmlUtils,
  domUtils,
  InternalEvent,
  RubberBandHandler,
  UndoManager,
  CodecRegistry,
  Graph,
  Cell,
  DomHelpers,
  GraphDataModel,
  CellEditorHandler,
  TooltipHandler,
  SelectionCellsHandler,
  PopupMenuHandler,
  ConnectionHandler,
  SelectionHandler,
  PanningHandler,
} from '@maxgraph/core';

import { globalTypes, globalValues } from './shared/args.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Labels/HtmlLabel',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
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

  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  // Creates a user object that stores the state
  let doc = xmlUtils.createXmlDocument();
  let obj = doc.createElement('UserObject');
  obj.setAttribute('label', 'Hello, World!');
  obj.setAttribute('checked', 'false');

  // Adds optional caching for the HTML label
  let cached = true;
  let MyCustomGraphDataModel;

  if (cached) {
    // Ignores cached label in codec
    CodecRegistry.getCodec(Cell).exclude.push('div');

    // Invalidates cached labels
    MyCustomGraphDataModel = class extends GraphDataModel {
      setValue(cell, value) {
        cell.div = null;
        super.setValue.apply(this, arguments);
      }
    };
  } else {
    MyCustomGraphDataModel = GraphDataModel;
  }

  class MyCustomGraph extends Graph {
    createGraphDataModel() {
      return new MyCustomGraphDataModel();
    }

    // Overrides method to provide a cell label in the display
    convertValueToString(cell) {
      if (cached && cell.div != null) {
        // Uses cached label
        return cell.div;
      } else if (
        domUtils.isNode(cell.value) &&
        cell.value.nodeName.toLowerCase() === 'userobject'
      ) {
        // Returns a DOM for the label
        let div = document.createElement('div');
        div.innerHTML = cell.getAttribute('label');
        domUtils.br(div);

        let checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');

        if (cell.getAttribute('checked') == 'true') {
          checkbox.setAttribute('checked', 'checked');
          checkbox.defaultChecked = true;
        }

        // Writes back to cell if checkbox is clicked
        InternalEvent.addListener(checkbox, 'change', function (evt) {
          let elt = cell.value.cloneNode(true);
          elt.setAttribute('checked', checkbox.checked ? 'true' : 'false');

          graph.model.setValue(cell, elt);
        });

        div.appendChild(checkbox);

        if (cached) {
          // Caches label
          cell.div = div;
        }
        return div;
      }
      return '';
    }

    // Overrides method to store a cell label in the model
    cellLabelChanged(cell, newValue, autoSize) {
      if (
        domUtils.isNode(cell.value) &&
        cell.value.nodeName.toLowerCase() === 'userobject'
      ) {
        // Clones the value for correct undo/redo
        let elt = cell.value.cloneNode(true);
        elt.setAttribute('label', newValue);
        newValue = elt;
      }

      super.cellLabelChanged.apply(this, arguments);
    }

    // Overrides method to create the editing value
    getEditingValue(cell) {
      if (
        domUtils.isNode(cell.value) &&
        cell.value.nodeName.toLowerCase() === 'userobject'
      ) {
        return cell.getAttribute('label');
      }
    }
  }

  // Creates the graph inside the given container
  let graph = new MyCustomGraph(container, null, [
    CellEditorHandler,
    TooltipHandler,
    SelectionCellsHandler,
    PopupMenuHandler,
    ConnectionHandler,
    SelectionHandler,
    PanningHandler,
  ]);

  // Enables HTML labels
  graph.setHtmlLabels(true);

  // Enables rubberband selection
  new RubberBandHandler(graph);

  let parent = graph.getDefaultParent();
  graph.insertVertex(parent, null, obj, 20, 20, 80, 60);

  // Undo/redo
  let undoManager = new UndoManager();
  let listener = function (sender, evt) {
    undoManager.undoableEditHappened(evt.getProperty('edit'));
  };
  graph.getDataModel().addListener(InternalEvent.UNDO, listener);
  graph.getView().addListener(InternalEvent.UNDO, listener);

  document.body.appendChild(
    DomHelpers.button('Undo', function () {
      undoManager.undo();
    })
  );

  document.body.appendChild(
    DomHelpers.button('Redo', function () {
      undoManager.redo();
    })
  );

  return container;
};

export const Default = Template.bind({});
