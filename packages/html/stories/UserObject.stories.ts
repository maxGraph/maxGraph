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
  Rectangle,
  DomHelpers,
  KeyHandler,
  eventUtils,
  InternalEvent,
  xmlUtils,
  EdgeStyle,
  domUtils,
  MaxForm,
  CellAttributeChange,
  RubberBandHandler,
  ModelXmlSerializer,
  guiUtils,
  type Cell,
  getDefaultPlugins,
  type TooltipHandler,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
import { configureImagesBasePath, createGraphContainer } from './shared/configure.js';
import '@maxgraph/core/css/common.css'; // style required by popup

export default {
  title: 'Xml_Json/UserObject',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
  },
};

const Template = ({ label, ...args }: Record<string, string>) => {
  configureImagesBasePath();
  const mainDiv = document.createElement('div');

  const div = document.createElement('div');
  mainDiv.appendChild(div);
  div.style.display = 'flex';
  div.style.gap = '2rem';

  const container = createGraphContainer(args);
  container.style.background = 'none'; // no grid
  container.style.border = 'solid 1px black';
  div.appendChild(container);

  const divProperties = document.createElement('div');
  divProperties.id = 'properties';
  divProperties.style.border = 'solid 1px black';
  divProperties.style.padding = '1rem';
  div.appendChild(divProperties);

  // Note that these XML nodes will be enclosing the Cell nodes for the model cells in the output
  const doc = xmlUtils.createXmlDocument();

  const person1 = doc.createElement('Person');
  person1.setAttribute('firstName', 'Daffy');
  person1.setAttribute('lastName', 'Duck');

  const person2 = doc.createElement('Person');
  person2.setAttribute('firstName', 'Bugs');
  person2.setAttribute('lastName', 'Bunny');

  const relation = doc.createElement('Knows');
  relation.setAttribute('since', '1985');

  // Enables rubberband selection
  const plugins = getDefaultPlugins();
  if (args.rubberBand) plugins.push(RubberBandHandler);

  // Creates the graph inside the given container
  const graph = new Graph(container, undefined, plugins);

  // Optional disabling of sizing
  graph.setCellsResizable(false);

  // Configures the graph contains to resize and add a border at the bottom, right
  graph.setResizeContainer(true);
  graph.minimumContainerSize = new Rectangle(0, 0, 500, 380);
  graph.setBorder(60);

  // Stops editing on enter key, handles escape
  new KeyHandler(graph);

  // Overrides method to disallow edge label editing
  graph.isCellEditable = function (cell) {
    return !cell.isEdge();
  };

  // Overrides method to provide a cell label in the display
  graph.convertValueToString = function (cell) {
    if (domUtils.isNode(cell.value)) {
      if (cell.value.nodeName.toLowerCase() == 'person') {
        const firstName = cell.getAttribute('firstName', '');
        const lastName = cell.getAttribute('lastName', '');

        if (lastName != null && lastName.length > 0) {
          return `${lastName}, ${firstName}`;
        }

        return firstName;
      }
      if (cell.value.nodeName.toLowerCase() == 'knows') {
        return `${cell.value.nodeName} (Since ${cell.getAttribute('since', '')})`;
      }
    }
    return '';
  };

  // Overrides method to store a cell label in the model
  const { cellLabelChanged } = graph;
  graph.cellLabelChanged = function (cell, newValue, autoSize) {
    if (domUtils.isNode(cell.value) && cell.value.nodeName.toLowerCase() == 'person') {
      const pos = newValue.indexOf(' ');

      const firstName = pos > 0 ? newValue.substring(0, pos) : newValue;
      const lastName = pos > 0 ? newValue.substring(pos + 1, newValue.length) : '';

      // Clones the value for correct undo/redo
      const elt = cell.value.cloneNode(true);

      elt.setAttribute('firstName', firstName);
      elt.setAttribute('lastName', lastName);

      newValue = elt;
      autoSize = true;
    }

    cellLabelChanged.apply(this, [cell, newValue, autoSize]);
  };

  // Overrides method to create the editing value
  graph.getEditingValue = function (cell: Cell, _evt: MouseEvent | null): string {
    if (domUtils.isNode(cell.value) && cell.value.nodeName.toLowerCase() == 'person') {
      const firstName = cell.getAttribute('firstName', '');
      const lastName = cell.getAttribute('lastName', '');
      return `${firstName} ${lastName}`;
    }
    return '';
  };

  // Adds a special tooltip for edges
  graph.setTooltips(true);

  const tooltipHandler = graph.getPlugin<TooltipHandler>('TooltipHandler')!;
  const { getTooltipForCell } = tooltipHandler;
  tooltipHandler.getTooltipForCell = function (cell) {
    // Adds some relation details for edges
    if (cell.isEdge()) {
      const src = this.graph.getLabel(cell.getTerminal(true)!);
      const trg = this.graph.getLabel(cell.getTerminal(false)!);
      return `${src} ${cell.value.nodeName} ${trg}`;
    }
    return getTooltipForCell.apply(this, [cell]);
  };

  const buttons = document.createElement('div');
  mainDiv.appendChild(buttons);

  // Adds an option to view the XML of the graph
  const button = DomHelpers.button('View XML', function () {
    const xml = new ModelXmlSerializer(graph.getDataModel()).export();
    guiUtils.popup(xml, true);
  });
  button.style.marginTop = '1rem';
  buttons.appendChild(button);

  // Changes the style for match the markup
  // Creates the default style for vertices
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.strokeColor = 'gray';
  style.rounded = true;
  style.shadow = true;
  style.fillColor = '#DFDFDF';
  style.gradientColor = 'white';
  style.fontColor = 'black';
  style.fontSize = 12;
  style.spacing = 4;

  // Creates the default style for edges
  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.strokeColor = '#0C0C0C';
  style.labelBackgroundColor = 'white';
  style.edgeStyle = EdgeStyle.ElbowConnector;
  style.rounded = true;
  style.fontColor = 'black';
  style.fontSize = 10;

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, person1, 40, 40, 80, 30);
    const v2 = graph.insertVertex(parent, null, person2, 200, 150, 80, 30);
    graph.insertEdge(parent, null, relation, v1, v2);
  });

  // Implements a properties panel that uses CellAttributeChange to change properties
  graph.getSelectionModel().addListener(InternalEvent.CHANGE, () => {
    selectionChanged(graph);
  });
  selectionChanged(graph);

  /**
   * Updates the properties panel
   */
  function selectionChanged(graph: Graph) {
    const div = divProperties;

    // Forces focusout in IE
    graph.container.focus();

    // Clears the DIV the non-DOM way
    div.innerHTML = '';

    // Gets the selection cell
    const cell = graph.getSelectionCell();

    if (cell == null) {
      domUtils.writeln(div, 'Nothing selected.');
    } else {
      // Writes the title
      const center = document.createElement('center');
      domUtils.writeln(center, `${cell.value.nodeName} (${cell.id})`);
      div.appendChild(center);
      domUtils.br(div);

      // Creates the form from the attributes of the user object
      const form = new MaxForm('');
      const attrs = cell.value.attributes;

      for (let i = 0; i < attrs.length; i++) {
        createTextField(graph, form, cell, attrs[i]);
      }

      div.appendChild(form.getTable());
      domUtils.br(div);
    }
  }

  type CellValueAttribute = {
    nodeName: string;
    nodeValue: string;
  };

  /**
   * Creates the textfield for the given property.
   */
  function createTextField(
    graph: Graph,
    form: MaxForm,
    cell: Cell,
    attribute: CellValueAttribute
  ) {
    const input = form.addText(`${attribute.nodeName}:`, attribute.nodeValue);

    const applyHandler = function () {
      const newValue = input.value || '';
      const oldValue = cell.getAttribute(attribute.nodeName, '');

      if (newValue != oldValue) {
        graph.batchUpdate(() => {
          const edit = new CellAttributeChange(cell, attribute.nodeName, newValue);
          graph.getDataModel().execute(edit);
          graph.updateCellSize(cell);
        });
      }
    };

    InternalEvent.addListener(
      input,
      'keypress',
      function (evt: MouseEvent | KeyboardEvent) {
        // Needs to take shift into account for textareas
        // TODO should probably use code instead of keyCode, see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
        if (
          'keyCode' in evt &&
          evt.keyCode == /* enter */ 13 &&
          !eventUtils.isShiftDown(evt)
        ) {
          input.blur();
        }
      }
    );

    // Note: Known problem is the blurring of fields in
    // Firefox by changing the selection, in which case
    // no event is fired in FF and the change is lost.
    // As a workaround you should use a local variable
    // that stores the focused field and invoke blur
    // explicitely where we do the graph.focus above.
    InternalEvent.addListener(input, 'blur', applyHandler);
  }
  return mainDiv;
};

export const Default = Template.bind({});
