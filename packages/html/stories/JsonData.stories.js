import {
  Graph,
  ObjectCodec,
  DomHelpers,
  CodecRegistry,
  InternalEvent,
  Client,
  Codec,
  domUtils,
  utils,
  MaxWindow,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Xml_Json/JsonData',
  argTypes: {
    ...globalTypes,
  },
};

const Template = ({ label, ...args }) => {
  Client.setImageBasePath('/images');

  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  // Register a new codec
  function CustomData(value) {
    this.value = value;
  }
  const codec = new ObjectCodec(new CustomData());
  codec.encode = function (enc, obj) {
    const node = enc.document.createElement('CustomData');
    domUtils.setTextContent(node, JSON.stringify(obj));
    return node;
  };
  codec.decode = function (dec, node, into) {
    const obj = JSON.parse(domUtils.getTextContent(node));
    obj.constructor = CustomData;

    return obj;
  };
  CodecRegistry.register(codec);

  // Disables the built-in context menu
  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);

  // Enables rubberband selection
  if (args.rubberBand) new RubberBand(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.getModel().beginUpdate();
  try {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
    v1.data = new CustomData('v1');
    const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
    v2.data = new CustomData('v2');
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('Show JSON', function () {
      const encoder = new Codec();
      const node = encoder.encode(graph.getModel());
      MaxWindow.popup(utils.getXml(node), true);
    })
  );

  return div;
};

export const Default = Template.bind({});
