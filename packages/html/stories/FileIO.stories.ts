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
  Cell,
  CellTracker,
  cloneUtils,
  DomHelpers,
  EventObject,
  eventUtils,
  FastOrganicLayout,
  Graph,
  InternalEvent,
  requestUtils,
  ModelXmlSerializer,
  type PanningHandler,
  Perimeter,
} from '@maxgraph/core';

import { globalTypes, globalValues } from './shared/args.js';
import { createGraphContainer } from './shared/configure.js';

export default {
  title: 'Xml_Json/FileIO',
  argTypes: {
    ...globalTypes,
    modelSource: {
      type: 'text',
      description: 'Choose the type of source from which to load the model',
      options: ['text', 'xml'],
      control: { type: 'select' },
    },
  },
  args: {
    modelSource: 'text',
    ...globalValues,
  },
};

type CustomCell = Cell & {
  customId: string;
};

const Template = ({ label, ...args }: Record<string, string>) => {
  const div = document.createElement('div');
  const mainDivStyle = div.style;
  mainDivStyle.display = 'flex';
  mainDivStyle.flexDirection = 'column-reverse';

  const container = createGraphContainer(args);
  div.appendChild(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  graph.setEnabled(false);
  graph.setPanning(true);
  graph.setTooltips(true);
  graph.getPlugin<PanningHandler>('PanningHandler').useLeftButtonForPanning = true;

  // Adds a highlight on the cell under the mouse pointer
  new CellTracker(graph, undefined!);

  // Changes the default vertex style in-place
  let style = graph.getStylesheet().getDefaultVertexStyle();
  style.shape = 'rounded';
  style.perimeter = Perimeter.RectanglePerimeter;
  style.gradientColor = 'white';
  style.perimeterSpacing = 4;
  style.shadow = true;

  style = graph.getStylesheet().getDefaultEdgeStyle();
  style.labelBackgroundColor = 'white';

  style = cloneUtils.clone(style);
  style.startArrow = 'classic';
  graph.getStylesheet().putCellStyle('2way', style);

  graph.isHtmlLabel = (_cell: Cell) => true;

  // Larger grid size yields cleaner layout result
  graph.gridSize = 20;

  // Creates a layout algorithm to be used with the graph
  const layout = new FastOrganicLayout(graph);

  // Moves stuff wider apart than usual
  layout.forceConstant = 140;

  // Adds a button to execute the layout
  const button = DomHelpers.button('Arrange', () => {
    const parent = graph.getDefaultParent();
    layout.execute(parent);
  });
  button.style.marginBottom = '1rem';
  button.style.width = 'fit-content';
  div.appendChild(button);

  // Load cells and layouts the graph
  graph.batchUpdate(() => {
    args.modelSource === 'text'
      ? loadModelFromCustomTextFile(graph, 'fileio.txt')
      : loadModelFromXmlFile(graph, 'fileio.xml');

    // Gets the default parent for inserting new cells. This is normally the first child of the root (ie. layer 0).
    const parent = graph.getDefaultParent();

    // Executes the layout
    layout.execute(parent);
  });

  graph.dblClick = function (evt: MouseEvent, cell?: Cell | null) {
    const mxe = new EventObject(InternalEvent.DOUBLE_CLICK, { event: evt, cell });
    this.fireEvent(mxe);

    if (
      this.isEnabled() &&
      !eventUtils.isConsumed(evt) &&
      !mxe.isConsumed() &&
      cell != null
    ) {
      alert(`Show properties for cell ${(cell as CustomCell).customId || cell.getId()}`);
    }
  };

  return div;
};

// Loads the custom file format (TXT file)
// Custom parser for simple file format: assume that the root and default parent cell are available in the graph
function loadModelFromCustomTextFile(graph: Graph, filename: string) {
  // Gets the default parent for inserting new cells. This is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  const req = requestUtils.load(filename);
  const text = req.getText();

  const lines = text.split('\n');

  // Creates the lookup table for the vertices
  const vertices: { [p: string]: Cell } = {};

  // Parses all lines (vertices must be first in the file)
  graph.batchUpdate(() => {
    for (let i = 0; i < lines.length; i++) {
      // Ignores comments (starting with #)
      const colon = lines[i].indexOf(':');

      if (lines[i].substring(0, 1) != '#' || colon == -1) {
        const comma = lines[i].indexOf(',');
        const value = lines[i].substring(colon + 2, lines[i].length);

        if (comma == -1 || comma > colon) {
          const key = lines[i].substring(0, colon);

          if (key.length > 0) {
            vertices[key] = graph.insertVertex(parent, null, value, 0, 0, 80, 70);
          }
        } else if (comma < colon) {
          // Looks up the vertices in the lookup table
          const source = vertices[lines[i].substring(0, comma)];
          const target = vertices[lines[i].substring(comma + 1, colon)];

          if (source != null && target != null) {
            const e = graph.insertEdge(parent, null, value, source, target);

            // Uses the special 2-way style for 2-way labels
            if (value.indexOf('2-Way') >= 0) {
              e.style.baseStyleNames = ['2way'];
            }
          }
        }
      }
    }
  });
}

// Loads the Graph file format (standard maxGraph XML file)
// Parses the Graph XML file format
function loadModelFromXmlFile(graph: Graph, filename: string) {
  const req = requestUtils.load(filename);
  const xml = req.getText();
  new ModelXmlSerializer(graph.getDataModel()).import(xml);
}

export const Default = Template.bind({});
