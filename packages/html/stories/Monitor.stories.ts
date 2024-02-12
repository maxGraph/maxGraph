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
  CellOverlay,
  Client,
  cloneUtils,
  DomHelpers,
  Graph,
  type ImageBox,
  InternalEvent,
  ModelXmlSerializer,
  Perimeter,
  xmlUtils,
} from '@maxgraph/core';
import { globalTypes } from './shared/args.js';

export default {
  title: 'Misc/Monitor',
  argTypes: {
    ...globalTypes,
  },
  args: {
    height: 450,
    width: 900,
  },
};

const Template = ({ label, ...args }: Record<string, any>) => {
  Client.setImageBasePath('/images');

  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.cursor = 'default';
  div.appendChild(container);

  // Should we allow overriding constants?
  // constants.SHADOWCOLOR = '#e0e0e0';

  // Creates the graph inside the given container
  const graph = createGraph(container);

  // Creates a process display using the activity names as IDs to refer to the elements
  const xml = `<GraphDataModel>
    <root>
        <Cell id="0"/>
        <Cell id="1" parent="0"/>
        <Cell id="2" value="Claim Handling Process" vertex="1" parent="1">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="swimlane" />
            </Array>
          </Object>
          <Geometry x="1" width="850" height="400" as="geometry"/>
        </Cell>
        <Cell id="3" value="Claim Manager" vertex="1" parent="2">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="swimlane" />
            </Array>
          </Object>
          <Geometry x="30" width="820" height="200" as="geometry"/>
        </Cell>
        <Cell id="5" value="" vertex="1" parent="3">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="start" />
            </Array>
          </Object>
          <Geometry x="40" y="85" width="30" height="30" as="geometry"/>
        </Cell>
        <Cell id="AuthorizeClaim" value="Authorize&#xa;Claim" vertex="1" parent="3">
          <Geometry x="90" y="80" width="100" height="40" as="geometry"/>
        </Cell>
        <Cell id="6" value="X" vertex="1" parent="3">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="step" />
            </Array>
          </Object>
          <Geometry x="210" y="85" width="30" height="30" as="geometry"/>
        </Cell>
        <Cell id="ApproveClaim" value="Approve&#xa;Claim" vertex="1" parent="3">
          <Geometry x="260" y="80" width="100" height="40" as="geometry"/>
        </Cell>
        <Cell id="7" value="X" vertex="1" parent="3">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="step" />
            </Array>
          </Object>
          <Geometry x="380" y="85" width="30" height="30" as="geometry"/>
        </Cell>
        <Cell id="8" value="" edge="1" parent="3" source="5" target="AuthorizeClaim">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="9" value="" edge="1" parent="3" source="AuthorizeClaim" target="6">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="10" value="" edge="1" parent="3" source="6" target="ApproveClaim">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="11" value="" edge="1" parent="3" source="ApproveClaim" target="7">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="12" value="" edge="1" parent="3" source="7" target="AuthorizeClaim">
          <Geometry relative="1" as="geometry">
            <Array as="points">
              <Point x="140" y="40"/>
            </Array>
          </Geometry>
        </Cell>
        <Cell id="ReviewClaim" value="Review&#xa;Claim" vertex="1" parent="3">
          <Geometry x="480" y="80" width="100" height="40" as="geometry"/>
        </Cell>
        <Cell id="22" value="X" vertex="1" parent="3">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="step" />
            </Array>
          </Object>
          <Geometry x="600" y="85" width="30" height="30" as="geometry"/>
        </Cell>
        <Cell id="23" value="" edge="1" parent="3" source="ReviewClaim" target="22">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="ApproveReviewedClaim" value="Approve Rev.&#xa;Claim" vertex="1" parent="3">
          <Geometry x="650" y="80" width="100" height="40" as="geometry"/>
        </Cell>
        <Cell id="26" value="" edge="1" parent="3" source="22" target="ApproveReviewedClaim">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="27" value="X" vertex="1" parent="3">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="step" />
            </Array>
          </Object>
          <Geometry x="770" y="85" width="30" height="30" as="geometry"/>
        </Cell>
        <Cell id="28" value="" edge="1" target="27" parent="3" source="ApproveReviewedClaim">
          <Geometry relative="1" as="geometry">
            <Point x="740" y="100" as="sourcePoint"/>
            <Point x="760" y="100" as="targetPoint"/>
          </Geometry>
        </Cell>
        <Cell id="32" value="" edge="1" parent="3" source="27" target="ReviewClaim">
          <Geometry relative="1" as="geometry">
            <Array as="points">
              <Point x="665" y="160"/>
            </Array>
          </Geometry>
        </Cell>
        <Cell id="4" value="Accountant" vertex="1" parent="2">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="swimlane" />
            </Array>
          </Object>
          <Geometry x="30" y="200" width="820" height="200" as="geometry"/>
        </Cell>
        <Cell id="EnterAccountingData" value="Enter&#xa;Data" vertex="1" parent="4">
          <Geometry x="430" y="80" width="100" height="40" as="geometry"/>
        </Cell>
        <Cell id="14" value="X" vertex="1" parent="4">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="step" />
            </Array>
          </Object>
          <Geometry x="550" y="85" width="30" height="30" as="geometry"/>
        </Cell>
        <Cell id="15" value="" edge="1" parent="4" source="EnterAccountingData" target="14">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="CheckAccountingData" value="Check&#xa;Data" vertex="1" parent="4">
          <Geometry x="600" y="80" width="100" height="40" as="geometry"/>
        </Cell>
        <Cell id="16" value="" edge="1" parent="4" source="14" target="CheckAccountingData">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="17" value="X" vertex="1" parent="4">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="step" />
            </Array>
          </Object>
          <Geometry x="720" y="85" width="30" height="30" as="geometry"/>
        </Cell>
        <Cell id="18" value="" edge="1" parent="4" source="CheckAccountingData" target="17">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="19" value="" vertex="1" parent="4">
          <Object as="style">
            <Array as="baseStyleNames">
              <add value="end" />
            </Array>
          </Object>
          <Geometry x="770" y="85" width="30" height="30" as="geometry"/>
        </Cell>
        <Cell id="20" value="" edge="1" parent="4" source="17" target="19">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="31" value="" edge="1" parent="4" source="17" target="EnterAccountingData">
          <Geometry relative="1" as="geometry">
            <Array as="points">
              <Point x="625" y="160"/>
            </Array>
          </Geometry>
        </Cell>
        <Cell id="13" value="" edge="1" parent="2" source="7" target="EnterAccountingData">
          <Geometry relative="1" as="geometry"/>
        </Cell>
        <Cell id="24" value="" edge="1" parent="2" source="14" target="ReviewClaim" style="edgeStyle=none">
          <Geometry relative="1" as="geometry">
            <Array as="points">
              <Point x="595" y="180"/>
              <Point x="480" y="180"/>
              <Point x="480" y="100"/>
            </Array>
          </Geometry>
        </Cell>
        <Cell id="29" value="" edge="1" parent="2" source="22" target="EnterAccountingData">
          <Geometry relative="1" as="geometry">
            <Array as="points">
              <Point x="469" y="40"/>
            </Array>
          </Geometry>
        </Cell>
        <Cell id="30" value="" edge="1" parent="2" source="27" target="EnterAccountingData">
            <Geometry relative="1" as="geometry">
              <Array as="points">
                <Point x="469" y="40"/>
              </Array>
            </Geometry>
        </Cell>
        <Cell id="33" value="" edge="1" parent="2" source="6" target="EnterAccountingData">
          <Geometry relative="1" as="geometry">
            <Array as="points">
              <Point x="255" y="200"/>
            </Array>
          </Geometry>
        </Cell>
    </root>
</GraphDataModel>`;

  const modelXmlSerializer = new ModelXmlSerializer(graph.getDataModel());
  modelXmlSerializer.import(xml);

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  // Creates a button to invoke the refresh function
  buttons.appendChild(
    DomHelpers.button('Update', () => {
      // XML is normally fetched from URL at server using utils.get - this is a client-side
      // string with randomized states to demonstrate the idea of the workflow monitor
      const xml = `<process>
        <update id="ApproveClaim" state="${getState()}"/>
        <update id="AuthorizeClaim" state="${getState()}"/>
        <update id="CheckAccountingData" state="${getState()}"/>
        <update id="ReviewClaim" state="${getState()}"/>
        <update id="ApproveReviewedClaim" state="${getState()}"/>
        <update id="EnterAccountingData" state="${getState()}"/>
      </process>`;
      update(graph, xml);
    })
  );

  /**
   * Updates the display of the given graph using the XML data
   */
  function update(graph: Graph, xml: string) {
    if (xml) {
      const doc = xmlUtils.parseXml(xml);

      if (doc?.documentElement) {
        // if (doc != null && doc.documentElement != null) {
        const model = graph.getDataModel();
        const nodes = doc.documentElement.getElementsByTagName('update');

        // if (nodes != null && nodes.length > 0) {
        if (nodes?.length > 0) {
          model.beginUpdate();

          try {
            for (let i = 0; i < nodes.length; i++) {
              // Processes the activity nodes inside the process node
              const id = nodes[i].getAttribute('id')!;
              const state = nodes[i].getAttribute('state');

              // Gets the cell for the given activity name from the model
              const cell = model.getCell(id);

              // Updates the cell color and adds some tooltip information
              if (cell) {
                // Resets the fill color and the overlay
                graph.setCellStyles('fillColor', 'white', [cell]);
                graph.removeCellOverlays(cell);

                // Changes the cell color for the known states
                if (state == 'Running') {
                  graph.setCellStyles('fillColor', '#f8cecc', [cell]);
                } else if (state == 'Waiting') {
                  graph.setCellStyles('fillColor', '#fff2cc', [cell]);
                } else if (state == 'Completed') {
                  graph.setCellStyles('fillColor', '#d4e1f5', [cell]);
                }

                // Adds tooltip information using an overlay icon
                if (state != 'Init') {
                  // Sets the overlay for the cell in the graph
                  graph.addCellOverlay(
                    cell,
                    createOverlay(graph.warningImage, `State: ${state}`)
                  );
                }
              }
            } // for
          } finally {
            model.endUpdate();
          }
        }
      }
    }
  }

  /**
   * Creates an overlay object using the given tooltip and text for the alert window
   * which is being displayed on click.
   */
  function createOverlay(image: ImageBox, tooltip: string) {
    const overlay = new CellOverlay(image, tooltip);

    // Installs a handler for clicks on the overlay
    overlay.addListener(InternalEvent.CLICK, () =>
      window.alert(`${tooltip}\nLast update: ${new Date()}`)
    );

    return overlay;
  }

  /**
   * Creates and returns an empty graph inside the given container.
   */
  function createGraph(container: HTMLElement) {
    const graph = new Graph(container);
    graph.setTooltips(true);
    graph.setEnabled(false);

    // Disables folding
    graph.isCellFoldable = () => false;

    // Creates the stylesheet for the process display
    let style = graph.getStylesheet().getDefaultVertexStyle();
    style.fontSize = 11;
    style.fontColor = 'black';
    style.strokeColor = '#808080';
    style.fillColor = 'white';
    style.gradientColor = 'white';
    style.gradientDirection = 'east';
    style.rounded = true;
    // style.shadow = true; // TMP disable until we cannot change the shadow color
    style.fontStyle = 1;

    style = graph.getStylesheet().getDefaultEdgeStyle();
    // TODO was working in mxGraph, currently edgeStyle must be a string, but passing the function works at runtime
    // style.edgeStyle = EdgeStyle.ElbowConnector;
    style.edgeStyle = 'elbowEdgeStyle';
    style.strokeColor = '#808080';
    style.rounded = true;
    // style.shadow = true; // TMP disable until we cannot change the shadow color

    style = {};
    style.shape = 'swimlane';
    style.strokeColor = '#a0a0a0';
    style.fontColor = '#606060';
    style.fillColor = '#E0E0DF';
    style.gradientColor = 'white';
    style.startSize = 30;
    style.rounded = false;
    style.fontSize = 12;
    style.fontStyle = 0;
    style.horizontal = false;
    // To improve text quality for vertical labels in some old IE versions...
    style.labelBackgroundColor = '#efefef';

    graph.getStylesheet().putCellStyle('swimlane', style);

    style = {};
    style.shape = 'rhombus';
    style.perimeter = Perimeter.RhombusPerimeter;
    style.strokeColor = '#91BCC0';
    style.fontColor = 'gray';
    style.fillColor = '#91BCC0';
    style.gradientColor = 'white';
    style.align = 'center';
    style.verticalAlign = 'middle';
    style.fontSize = 16;
    graph.getStylesheet().putCellStyle('step', style);

    style = {};
    style.shape = 'ellipse';
    style.perimeter = Perimeter.EllipsePerimeter;
    style.fontColor = 'gray';
    style.fillColor = '#A0C88F';
    style.gradientColor = 'white';
    style.strokeColor = '#A0C88F';
    style.align = 'center';
    style.verticalAlign = 'middle';
    style.fontSize = 16;
    graph.getStylesheet().putCellStyle('start', style);

    style = cloneUtils.clone(style);
    style.fillColor = '#DACCBC';
    style.strokeColor = '#AF7F73';
    graph.getStylesheet().putCellStyle('end', style);

    return graph;
  }

  /**
   * Returns a random state.
   */
  function getState() {
    let state = 'Init';
    const rnd = Math.random() * 4;

    if (rnd > 3) {
      state = 'Completed';
    } else if (rnd > 2) {
      state = 'Running';
    } else if (rnd > 1) {
      state = 'Waiting';
    }

    return state;
  }

  return div;
};

export const Default = Template.bind({});
