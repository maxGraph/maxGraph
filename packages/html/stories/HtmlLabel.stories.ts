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

import {
  type Cell,
  DomHelpers,
  domUtils,
  type EventObject,
  Graph,
  GraphDataModel,
  getDefaultPlugins,
  InternalEvent,
  RubberBandHandler,
  UndoManager,
  xmlUtils,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer, createMainDiv } from './shared/configure.js';
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

const isUserObject = (value: unknown): value is Element =>
  domUtils.isNode(value) && value.nodeName.toLowerCase() === 'userobject';

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = createMainDiv(
    `This example demonstrates using HTML labels that are connected to the state of the user object.<br>
The value of the vertex is an XML object holding a text and a checked state, and its label is rendered as HTML from them.<br>
Clicking the checkbox stores its state in the value of the vertex, and double-clicking the vertex edits its text.<br>
Both changes go through the undo/redo manager (<code>UndoManager</code>): use the Undo and Redo buttons to revert and replay them, the checkbox following the restored state.`
  );
  const container = createGraphContainer(args);
  div.appendChild(container);

  // Disables the built-in context menu
  InternalEvent.disableContextMenu(container);

  // Creates a user object that stores the state
  const doc = xmlUtils.createXmlDocument();
  const userObject = doc.createElement('UserObject');
  userObject.setAttribute('label', 'Hello, World!');
  userObject.setAttribute('checked', 'false');

  // Caches the DOM of the HTML labels outside the cells, so the cache is never serialized with them
  const cachedLabels = new WeakMap<Cell, HTMLElement>();

  // Invalidates cached labels, also when the value is restored by undo/redo
  class CacheInvalidatingGraphDataModel extends GraphDataModel {
    override valueForCellChanged(cell: Cell, value: any): any {
      cachedLabels.delete(cell);
      return super.valueForCellChanged(cell, value);
    }
  }

  class HtmlLabelGraph extends Graph {
    override createGraphDataModel(): GraphDataModel {
      return new CacheInvalidatingGraphDataModel();
    }

    // Overrides method to provide a cell label in the display.
    // The rendering accepts a DOM node as label value, although the signature declares a string.
    override convertValueToString(cell: Cell): string {
      const cachedLabel = cachedLabels.get(cell);
      if (cachedLabel) {
        return cachedLabel as unknown as string;
      }
      if (!isUserObject(cell.value)) {
        return '';
      }

      const labelDiv = document.createElement('div');
      labelDiv.innerHTML = cell.getAttribute('label');
      domUtils.br(labelDiv);

      const checkbox = document.createElement('input');
      checkbox.setAttribute('type', 'checkbox');
      if (cell.getAttribute('checked') == 'true') {
        checkbox.setAttribute('checked', 'checked');
        checkbox.defaultChecked = true;
      }

      // Writes back to cell if checkbox is clicked
      InternalEvent.addListener(checkbox, 'change', () => {
        const updatedValue = cell.value.cloneNode(true) as Element;
        updatedValue.setAttribute('checked', checkbox.checked ? 'true' : 'false');
        this.getDataModel().setValue(cell, updatedValue);
      });
      labelDiv.appendChild(checkbox);

      cachedLabels.set(cell, labelDiv);
      return labelDiv as unknown as string;
    }

    // The mixin members are declared as properties holding a function, so they are overridden as properties.
    // See https://maxgraph.github.io/maxGraph/docs/guides/extend-maxgraph#a-graph-class

    // Overrides method to store a cell label in the model
    override cellLabelChanged = (cell: Cell, newValue: any, autoSize: boolean): void => {
      if (isUserObject(cell.value)) {
        // Clones the value for correct undo/redo
        const updatedValue = cell.value.cloneNode(true) as Element;
        updatedValue.setAttribute('label', newValue);
        newValue = updatedValue;
      }
      super.cellLabelChanged(cell, newValue, autoSize);
    };

    // Overrides method to create the editing value
    override getEditingValue = (cell: Cell, evt: MouseEvent | null): string =>
      isUserObject(cell.value)
        ? cell.getAttribute('label')
        : super.getEditingValue(cell, evt);
  }

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new HtmlLabelGraph(container, undefined, plugins);

  // Enables HTML labels
  graph.setHtmlLabels(true);

  graph.insertVertex({ value: userObject, position: [20, 20], size: [80, 60] });

  // Undo/redo
  const undoManager = new UndoManager();
  const listener = function (_sender: any, evt: EventObject) {
    undoManager.undoableEditHappened(evt.getProperty('edit'));
  };
  graph.getDataModel().addListener(InternalEvent.UNDO, listener);
  graph.getView().addListener(InternalEvent.UNDO, listener);

  const buttons = document.createElement('div');
  buttons.style.marginTop = '.75rem';
  div.appendChild(buttons);
  const buttonUndo = DomHelpers.button('Undo', function () {
    undoManager.undo();
  });
  buttonUndo.style.marginRight = '0.5rem';
  buttons.appendChild(buttonUndo);
  buttons.appendChild(
    DomHelpers.button('Redo', function () {
      undoManager.redo();
    })
  );

  return div;
};

export const Default = Template.bind({});
