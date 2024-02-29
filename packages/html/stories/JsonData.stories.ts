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
  ObjectCodec,
  DomHelpers,
  CodecRegistry,
  InternalEvent,
  domUtils,
  popup,
  RubberBandHandler,
  ModelXmlSerializer,
  type Cell,
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
  title: 'Xml_Json/JsonData',
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
  const div = document.createElement('div');
  const container = createGraphContainer(args);
  div.appendChild(container);

  class CustomData {
    constructor(public value?: string) {}
  }

  type CustomCell = Cell & {
    data?: CustomData;
  };

  const codec = new ObjectCodec(new CustomData());
  codec.encode = function (enc, obj) {
    const node = enc.document.createElement('CustomData');
    domUtils.setTextContent(node, JSON.stringify(obj));
    return node;
  };
  codec.decode = function (_dec, node) {
    const obj = JSON.parse(domUtils.getTextContent(node as unknown as Text));
    obj.constructor = CustomData;

    return obj;
  };
  CodecRegistry.register(codec);

  // Disables the built-in context menu
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30) as CustomCell;
    v1.data = new CustomData('v1');
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30) as CustomCell;
    v2.data = new CustomData('v2');
    graph.insertEdge(parent, null, '', v1, v2);
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('Show JSON', function () {
      const xml = new ModelXmlSerializer(graph.getDataModel()).export();
      popup(xml, true);
    })
  );

  return div;
};

export const Default = Template.bind({});
