/**
 * Copyright (c) 2006-2013, JGraph Ltd
 */

import React from 'react';
import mxEvent from '../mxgraph/util/mxEvent';
import mxGraph from '../mxgraph/view/mxGraph';
import Codec from '../mxgraph/io/Codec';
import mxUtils from '../mxgraph/util/mxUtils';
import mxConstants from '../mxgraph/util/mxConstants';
import mxEdgeStyle from '../mxgraph/view/mxEdgeStyle';

class Codec extends React.Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    // Contains a graph description which will be converted
    return (
      <>
        <h1>Codec</h1>
        This example demonstrates dynamically creating a graph from XML and
        encoding the model into XML, as well as changing the default style for
        edges in-place. This graph is embedded in the page.
        <div className="mxgraph" style="position:relative;overflow:auto;">
          &lt;mxGraphModel&gt;&lt;root&gt;&lt;mxCell id="0"/&gt;&lt;mxCell
          id="1" parent="0"/&gt;&lt;mxCell id="2" vertex="1" parent="1"
          value="Interval 1"&gt;&lt;mxGeometry x="380" y="0" width="140"
          height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="3"
          vertex="1" parent="1" value="Interval 2"&gt;&lt;mxGeometry x="200"
          y="80" width="380" height="30"
          as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="4" vertex="1"
          parent="1" value="Interval 3"&gt;&lt;mxGeometry x="40" y="140"
          width="260" height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell
          id="5" vertex="1" parent="1" value="Interval 4"&gt;&lt;mxGeometry
          x="120" y="200" width="240" height="30"
          as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="6" vertex="1"
          parent="1" value="Interval 5"&gt;&lt;mxGeometry x="420" y="260"
          width="80" height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell
          id="7" edge="1" source="2" target="3" parent="1"
          value="Transfer1"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="420"
          y="60"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="8" edge="1" source="2" target="6" parent="1"
          value=""&gt;&lt;mxGeometry as="geometry" relative="1"
          y="-30"&gt;&lt;Array as="points"&gt;&lt;Object x="600"
          y="60"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="9" edge="1" source="3" target="4" parent="1"
          value="Transfer3"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="260"
          y="120"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="10" edge="1" source="4" target="5" parent="1"
          value="Transfer4"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="200"
          y="180"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="11" edge="1" source="4" target="6" parent="1"
          value="Transfer5"&gt;&lt;mxGeometry as="geometry" relative="1"
          y="-10"&gt;&lt;Array as="points"&gt;&lt;Object x="460"
          y="155"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;
        </div>
        This graph is embedded in the page.
        <div
          className="mxgraph"
          style="position:relative;background:#eeeeee;border:1px solid gray;overflow:auto;width:400px;height:200px;"
        >
          &lt;mxGraphModel&gt;&lt;root&gt;&lt;mxCell id="0"/&gt;&lt;mxCell
          id="1" parent="0"/&gt;&lt;mxCell id="2" vertex="1" parent="1"
          value="Interval 1"&gt;&lt;mxGeometry x="380" y="0" width="140"
          height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="3"
          vertex="1" parent="1" value="Interval 2"&gt;&lt;mxGeometry x="200"
          y="80" width="380" height="30"
          as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="4" vertex="1"
          parent="1" value="Interval 3"&gt;&lt;mxGeometry x="40" y="140"
          width="260" height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell
          id="5" vertex="1" parent="1" value="Interval 4"&gt;&lt;mxGeometry
          x="120" y="200" width="240" height="30"
          as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="6" vertex="1"
          parent="1" value="Interval 5"&gt;&lt;mxGeometry x="420" y="260"
          width="80" height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell
          id="7" edge="1" source="2" target="3" parent="1"
          value="Transfer1"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="420"
          y="60"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="8" edge="1" source="2" target="6" parent="1"
          value=""&gt;&lt;mxGeometry as="geometry" relative="1"
          y="-30"&gt;&lt;Array as="points"&gt;&lt;Object x="600"
          y="60"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="9" edge="1" source="3" target="4" parent="1"
          value="Transfer3"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="260"
          y="120"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="10" edge="1" source="4" target="5" parent="1"
          value="Transfer4"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="200"
          y="180"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="11" edge="1" source="4" target="6" parent="1"
          value="Transfer5"&gt;&lt;mxGeometry as="geometry" relative="1"
          y="-10"&gt;&lt;Array as="points"&gt;&lt;Object x="460"
          y="155"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;
        </div>
        This graph is embedded in the page.
        <div
          className="mxgraph"
          style="position:relative;background:#eeeeee;border:6px solid gray;overflow:auto;width:400px;height:200px;"
        >
          &lt;mxGraphModel&gt;&lt;root&gt;&lt;mxCell id="0"/&gt;&lt;mxCell
          id="1" parent="0"/&gt;&lt;mxCell id="2" vertex="1" parent="1"
          value="Interval 1"&gt;&lt;mxGeometry x="380" y="20" width="140"
          height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="3"
          vertex="1" parent="1" value="Interval 2"&gt;&lt;mxGeometry x="200"
          y="80" width="380" height="30"
          as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="4" vertex="1"
          parent="1" value="Interval 3"&gt;&lt;mxGeometry x="40" y="140"
          width="260" height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell
          id="5" vertex="1" parent="1" value="Interval 4"&gt;&lt;mxGeometry
          x="120" y="200" width="240" height="30"
          as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="6" vertex="1"
          parent="1" value="Interval 5"&gt;&lt;mxGeometry x="420" y="260"
          width="80" height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell
          id="7" edge="1" source="2" target="3" parent="1"
          value="Transfer1"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="420"
          y="60"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="8" edge="1" source="2" target="6" parent="1"
          value="Transfer2"&gt;&lt;mxGeometry as="geometry" relative="1"
          y="0"&gt;&lt;Array as="points"&gt;&lt;Object x="600"
          y="60"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="9" edge="1" source="3" target="4" parent="1"
          value="Transfer3"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="260"
          y="120"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="10" edge="1" source="4" target="5" parent="1"
          value="Transfer4"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="200"
          y="180"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="11" edge="1" source="4" target="6" parent="1"
          value="Transfer5"&gt;&lt;mxGeometry as="geometry" relative="1"
          y="-10"&gt;&lt;Array as="points"&gt;&lt;Object x="460"
          y="155"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;
        </div>
        This graph is embedded in the page.
        <div
          className="mxgraph"
          style="position:relative;overflow:hidden;border:6px solid gray;"
        >
          &lt;mxGraphModel&gt;&lt;root&gt;&lt;mxCell id="0"/&gt;&lt;mxCell
          id="1" parent="0"/&gt;&lt;mxCell id="2" vertex="1" parent="1"
          value="Interval 1"&gt;&lt;mxGeometry x="380" y="20" width="140"
          height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="3"
          vertex="1" parent="1" value="Interval 2"&gt;&lt;mxGeometry x="200"
          y="80" width="380" height="30"
          as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="4" vertex="1"
          parent="1" value="Interval 3"&gt;&lt;mxGeometry x="40" y="140"
          width="260" height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell
          id="5" vertex="1" parent="1" value="Interval 4"&gt;&lt;mxGeometry
          x="120" y="200" width="240" height="30"
          as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell id="6" vertex="1"
          parent="1" value="Interval 5"&gt;&lt;mxGeometry x="420" y="260"
          width="80" height="30" as="geometry"/&gt;&lt;/mxCell&gt;&lt;mxCell
          id="7" edge="1" source="2" target="3" parent="1"
          value="Transfer1"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="420"
          y="60"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="8" edge="1" source="2" target="6" parent="1"
          value="Transfer2"&gt;&lt;mxGeometry as="geometry" relative="1"
          y="0"&gt;&lt;Array as="points"&gt;&lt;Object x="600"
          y="60"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="9" edge="1" source="3" target="4" parent="1"
          value="Transfer3"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="260"
          y="120"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="10" edge="1" source="4" target="5" parent="1"
          value="Transfer4"&gt;&lt;mxGeometry as="geometry"&gt;&lt;Array
          as="points"&gt;&lt;Object x="200"
          y="180"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;mxCell
          id="11" edge="1" source="4" target="6" parent="1"
          value="Transfer5"&gt;&lt;mxGeometry as="geometry" relative="1"
          y="-10"&gt;&lt;Array as="points"&gt;&lt;Object x="460"
          y="155"/&gt;&lt;/Array&gt;&lt;/mxGeometry&gt;&lt;/mxCell&gt;&lt;/root&gt;&lt;/mxGraphModel&gt;
        </div>
        This graph is embedded in the page.
      </>
    );
  };

  componentDidMount = () => {
    const divs = document.getElementsByTagName('*');

    for (let i = 0; i < divs.length; i += 1) {
      if (divs[i].className.toString().indexOf('mxgraph') >= 0) {
        (function(container) {
          const xml = mxUtils.getTextContent(container);
          const xmlDocument = mxUtils.parseXml(xml);

          if (
            xmlDocument.documentElement != null &&
            xmlDocument.documentElement.nodeName === 'mxGraphModel'
          ) {
            const decoder = new Codec(xmlDocument);
            const node = xmlDocument.documentElement;

            container.innerHTML = '';

            const graph = new mxGraph(container);
            graph.centerZoom = false;
            graph.setTooltips(false);
            graph.setEnabled(false);

            // Changes the default style for edges "in-place"
            const style = graph.getStylesheet().getDefaultEdgeStyle();
            style.edge = mxEdgeStyle.ElbowConnector;

            // Enables panning with left mouse button
            graph.getPlugin('PanningHandler').useLeftButtonForPanning = true;
            graph.getPlugin('PanningHandler').ignoreCell = true;
            graph.container.style.cursor = 'move';
            graph.setPanning(true);

            if (divs[i].style.width === '' && divs[i].style.height === '') {
              graph.resizeContainer = true;
            } else {
              // Adds border for fixed size boxes
              graph.border = 20;
            }

            decoder.decode(node, graph.getDataModel());
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
              mxUtils.write(btn, label);
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

              mxEvent.addListener(btn, 'click', function(evt) {
                funct();
                mxEvent.consume(evt);
              });

              left += bw;

              buttons.appendChild(btn);
            }

            addButton('+', function() {
              graph.zoomIn();
            });

            addButton('-', function() {
              graph.zoomOut();
            });

            if (container.nextSibling != null) {
              container.parentNode.insertBefore(buttons, container.nextSibling);
            } else {
              container.appendChild(buttons);
            }
          }
        })(divs[i]);
      }
    }
  };
}

export default Codec;
