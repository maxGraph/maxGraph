/*
Copyright 2024-present The maxGraph project Contributors
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
  EdgeStyle,
  Graph,
  GraphDataModel,
  InternalEvent as mxEvent,
  InternalEvent,
  ModelXmlSerializer,
} from '@maxgraph/core';
import { globalTypes, globalValues } from './shared/args.js';

const xmlModel = `<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" vertex="1" parent="1" value="Interval 1">
      <mxGeometry x="380" y="20" width="140" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="3" vertex="1" parent="1" value="Interval 2">
      <mxGeometry x="200" y="80" width="380" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="4" vertex="1" parent="1" value="Interval 3">
      <mxGeometry x="40" y="140" width="260" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="5" vertex="1" parent="1" value="Interval 4">
      <mxGeometry x="120" y="200" width="240" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="6" vertex="1" parent="1" value="Interval 5">
      <mxGeometry x="420" y="260" width="80" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="7" edge="1" source="2" target="3" parent="1" value="Transfer1">
      <mxGeometry as="geometry">
        <Array as="points">
          <Object x="420" y="60"/>
        </Array>
      </mxGeometry>
    </mxCell>
    <mxCell id="8" edge="1" source="2" target="6" parent="1" value="Transfer2">
      <mxGeometry as="geometry" relative="1" y="0">
        <Array as="points">
          <Object x="600" y="60"/>
        </Array>
      </mxGeometry>
    </mxCell>
    <mxCell id="9" edge="1" source="3" target="4" parent="1" value="Transfer3">
      <mxGeometry as="geometry">
        <Array as="points">
          <Object x="260" y="120"/>
        </Array>
      </mxGeometry>
    </mxCell>
    <mxCell id="10" edge="1" source="4" target="5" parent="1" value="Transfer4">
      <mxGeometry as="geometry">
        <Array as="points">
          <Object x="200" y="180"/>
        </Array>
      </mxGeometry>
    </mxCell>
    <mxCell id="11" edge="1" source="4" target="6" parent="1" value="Transfer5">
      <mxGeometry as="geometry" relative="1" y="-10">
        <Array as="points">
          <Object x="460" y="155"/>
        </Array>
      </mxGeometry>
    </mxCell>
  </root>
</mxGraphModel>`;

export default {
  title: 'Misc/Codec_from_mxGraph',
  argTypes: {
    ...globalTypes,
  },
  args: {
    ...globalValues,
  },
};

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');

  // TODO add description
  // This example demonstrates dynamically creating a graph from XML and
  // encoding the model into XML, as well as changing the default style for
  // edges in-place. This graph is embedded in the page.

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'auto';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  // container.style.cursor = 'default';
  //   style="position:relative;background:#eeeeee;border:1px solid gray;overflow:auto;width:400px;height:200px;"
  div.appendChild(container);

  container.innerHTML = '';

  const graph = new Graph(container);
  graph.centerZoom = false;
  graph.setTooltips(false);
  graph.setEnabled(false);

  // Changes the default style for edges "in-place"
  const style = graph.getStylesheet().getDefaultEdgeStyle();
  style.edge = EdgeStyle.ElbowConnector;

  // Enables panning with left mouse button
  const panningHandler = graph.getPlugin('PanningHandler');
  panningHandler.useLeftButtonForPanning = true;
  panningHandler.ignoreCell = true;
  graph.container.style.cursor = 'move';
  graph.setPanning(true);

  // if (divs[i].style.width === '' && divs[i].style.height === '') {
  //   graph.resizeContainer = true;
  // } else {
  //   // Adds border for fixed size boxes
  //   graph.border = 20;
  // }

  new ModelXmlSerializer(graph.getDataModel()).import(xmlModel);
  graph.resizeContainer = false;

  // Adds zoom buttons in top, left corner
  const buttons = document.createElement('div');
  buttons.style.position = 'absolute';
  buttons.style.overflow = 'visible';

  const bs = graph.getBorderSizes();
  buttons.style.top = `${container.offsetTop + bs.y}px`;
  buttons.style.left = `${container.offsetLeft + bs.x}px`;

  let left = 0;
  const bw = 16;
  const bh = 16;

  function addButton(label, funct) {
    const btn = document.createElement('div');
    const labelNode = btn.ownerDocument.createTextNode(label);
    btn.appendChild(labelNode);

    btn.style.position = 'absolute';
    btn.style.backgroundColor = 'transparent';
    btn.style.border = '1px solid gray';
    btn.style.textAlign = 'center';
    btn.style.fontSize = '10px';
    btn.style.cursor = 'hand';
    btn.style.width = `${bw}px`;
    btn.style.height = `${bh}px`;
    btn.style.left = `${left}px`;
    btn.style.top = '0px';

    InternalEvent.addListener(btn, 'click', function (evt) {
      funct();
      mxEvent.consume(evt);
    });

    left += bw;

    buttons.appendChild(btn);
  }

  addButton('+', function () {
    graph.zoomIn();
  });

  addButton('-', function () {
    graph.zoomOut();
  });

  if (container.nextSibling != null) {
    container.parentNode.insertBefore(buttons, container.nextSibling);
  } else {
    container.appendChild(buttons);
  }

  return div;
};

export const Default = Template.bind({});
