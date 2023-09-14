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
  RubberBandHandler,
  xmlUtils,
  Multiplicity,
  KeyHandler,
  InternalEvent,
} from '@maxgraph/core';
import {
  globalTypes,
  globalValues,
  rubberBandTypes,
  rubberBandValues,
} from './shared/args.js';
// style required by RubberBand
import '@maxgraph/core/css/common.css';

export default {
  title: 'Misc/Validation',
  argTypes: {
    ...globalTypes,
    ...rubberBandTypes,
  },
  args: {
    ...globalValues,
    ...rubberBandValues,
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

  const xmlDocument = xmlUtils.createXmlDocument();
  const sourceNode = xmlDocument.createElement('Source');
  const targetNode = xmlDocument.createElement('Target');
  const subtargetNode = xmlDocument.createElement('Subtarget');

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.setConnectable(true);
  graph.setTooltips(true);
  graph.setAllowDanglingEdges(false);
  graph.setMultigraph(false);

  // Source nodes needs 1..2 connected Targets
  graph.multiplicities.push(
    new Multiplicity(
      true,
      'Source',
      null,
      null,
      1,
      2,
      ['Target'],
      'Source Must Have 1 or 2 Targets',
      'Source Must Connect to Target'
    )
  );

  // Source node does not want any incoming connections
  graph.multiplicities.push(
    new Multiplicity(
      false,
      'Source',
      null,
      null,
      0,
      0,
      null,
      'Source Must Have No Incoming Edge',
      null
    )
  ); // Type does not matter

  // Target needs exactly one incoming connection from Source
  graph.multiplicities.push(
    new Multiplicity(
      false,
      'Target',
      null,
      null,
      1,
      1,
      ['Source'],
      'Target Must Have 1 Source',
      'Target Must Connect From Source'
    )
  );

  // Enables rubberband selection
  new RubberBandHandler(graph);

  // Removes cells when [DELETE] is pressed
  const keyHandler = new KeyHandler(graph);
  keyHandler.bindKey(46, function (evt) {
    if (graph.isEnabled()) {
      graph.removeCells();
    }
  });

  // Installs automatic validation (use editor.validation = true
  // if you are using an Editor instance)
  const listener = function (sender, evt) {
    graph.validateGraph();
  };

  graph.getDataModel().addListener(InternalEvent.CHANGE, listener);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, sourceNode, 20, 20, 80, 30);
    const v2 = graph.insertVertex(parent, null, targetNode, 200, 20, 80, 30);
    const v3 = graph.insertVertex({
      parent,
      value: targetNode.cloneNode(true),
      position: [200, 80],
      size: [80, 30],
    });
    const v4 = graph.insertVertex(
      parent,
      null,
      targetNode.cloneNode(true),
      200,
      140,
      80,
      30
    );
    const v5 = graph.insertVertex(parent, null, subtargetNode, 200, 200, 80, 30);
    const v6 = graph.insertVertex(
      parent,
      null,
      sourceNode.cloneNode(true),
      20,
      140,
      80,
      30
    );
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
    const e2 = graph.insertEdge(parent, null, '', v1, v3);
    const e3 = graph.insertEdge(parent, null, '', v6, v4);
    // var e4 = graph.insertEdge(parent, null, '', v1, v4);
  });

  return container;
};

export const Default = Template.bind({});
