/*
Copyright 2024-present The maxGraph project Contributors

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

import { expect, test } from '@jest/globals';
import {
  CellOverlay,
  ImageBox,
  ImageExport,
  Point,
  SvgCanvas2D,
  XmlCanvas2D,
} from '../../../src';
import { createXmlDocument, getPrettyXml } from '../../../src/util/xmlUtils';
import { NS_SVG } from '../../../src/util/Constants';
import { createGraphWithoutContainer } from '../../utils';

const createGraphWithVerticesAndOverlays = () => {
  const graph = createGraphWithoutContainer();
  const parent = graph.getDefaultParent();

  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      id: 'v1',
      value: 'vertex 1',
      position: [0, 0],
      size: [80, 30],
    });
    const v2 = graph.insertVertex({
      parent,
      id: 'v2',
      value: 'vertex 2',
      position: [100, 100],
      size: [80, 30],
    });
    graph.addCellOverlay(
      v2,
      new CellOverlay(new ImageBox('warning.png', 16, 16), 'Warning', 'center', 'top')
    );
    graph.addCellOverlay(
      v2,
      new CellOverlay(new ImageBox('element.png', 16, 16), 'Information')
    );

    graph.insertEdge(parent, null, '', v1, v2);
    const e1 = graph.insertEdge({
      parent,
      id: 'e1',
      value: 'edge 1',
      source: v1,
      target: v2,
    });
    e1.geometry!.points = [new Point(50, 50)];
  });

  return graph;
};

test.each([false, true])(
  'export with XmlCanvas2D, include overlays: %s',
  (includeOverlays) => {
    const graph = createGraphWithVerticesAndOverlays();

    const xmlDoc = createXmlDocument();
    const root = xmlDoc.createElement('data');
    xmlDoc.appendChild(root);

    const xmlCanvas = new XmlCanvas2D(root);
    const imageExport = new ImageExport();
    imageExport.includeOverlays = includeOverlays;

    imageExport.drawState(graph.getView().getState(graph.model.root!)!, xmlCanvas);
    const xml = getPrettyXml(root);

    const templateData: string = !includeOverlays
      ? ''
      : `
  <scale scale="1" />
  <fillcolor color="#FFFFFF" />
  <strokecolor color="#000000" />
  <image x="132" y="92" w="16" h="16" src="http://localhost/warning.png" aspect="0" flipH="0" flipV="0" />
  <scale scale="1" />
  <image x="172" y="122" w="16" h="16" src="http://localhost/element.png" aspect="0" flipH="0" flipV="0" />`;

    const expectedData = `<data>
  <fontfamily family="Arial,Helvetica" />
  <fontsize size="11" />
  <shadowcolor color="gray" />
  <shadowalpha alpha="1" />
  <shadowoffset dx="2" dy="3" />
  <save />
  <scale scale="1" />
  <fillcolor color="#C3D9FF" />
  <strokecolor color="#6482B9" />
  <rect x="0" y="0" w="80" h="30" />
  <fillstroke />
  <restore />
  <save />
  <scale scale="1" />
  <fillcolor color="#C3D9FF" />
  <strokecolor color="#6482B9" />
  <fontcolor color="#774400" />
  <fontbackgroundcolor color="none" />
  <fontbordercolor color="none" />
  <text x="40" y="15" w="76" h="26" str="vertex 1" align="center" valign="middle" wrap="0" format="" overflow="visible" clip="0" rotation="0" dir="" />
  <restore />
  <save />
  <scale scale="1" />
  <fillcolor color="#C3D9FF" />
  <strokecolor color="#6482B9" />
  <rect x="100" y="100" w="80" h="30" />
  <fillstroke />
  <restore />
  <save />
  <scale scale="1" />
  <fillcolor color="#C3D9FF" />
  <strokecolor color="#6482B9" />
  <fontcolor color="#774400" />
  <fontbackgroundcolor color="none" />
  <fontbordercolor color="none" />
  <text x="140" y="115" w="76" h="26" str="vertex 2" align="center" valign="middle" wrap="0" format="" overflow="visible" clip="0" rotation="0" dir="" />
  <restore />
  <save />
  <scale scale="1" />
  <fillcolor color="none" />
  <strokecolor color="#6482B9" />
  <begin />
  <move x="55" y="30" />
  <line x="120.5" y="95.5" />
  <stroke />
  <fillcolor color="#6482B9" />
  <begin />
  <move x="124.21" y="99.21" />
  <line x="116.78" y="96.73" />
  <line x="120.5" y="95.5" />
  <line x="121.73" y="91.78" />
  <close />
  <fillstroke />
  <restore />
  <save />
  <scale scale="1" />
  <fillcolor color="none" />
  <strokecolor color="#6482B9" />
  <begin />
  <move x="44.29" y="30" />
  <line x="50" y="50" />
  <line x="114.07" y="96.27" />
  <stroke />
  <fillcolor color="#6482B9" />
  <begin />
  <move x="118.32" y="99.35" />
  <line x="110.6" y="98.08" />
  <line x="114.07" y="96.27" />
  <line x="114.7" y="92.41" />
  <close />
  <fillstroke />
  <restore />
  <save />
  <scale scale="1" />
  <fillcolor color="none" />
  <strokecolor color="#6482B9" />
  <fontcolor color="#446299" />
  <fontbackgroundcolor color="none" />
  <fontbordercolor color="none" />
  <text x="76.1" y="68.85" w="0" h="0" str="edge 1" align="center" valign="middle" wrap="0" format="" overflow="visible" clip="0" rotation="0" dir="" />
  <restore />${templateData}
</data>
`;

    expect(xml).toBe(expectedData);
  }
);

test.each([false, true])(
  'export with SvgCanvas2D, include overlays: %s',
  (includeOverlays) => {
    const graph = createGraphWithVerticesAndOverlays();

    // Partially inspired by the draw.io implementation of the SVG export
    // Prepares SVG document that holds the output
    const svgDoc = createXmlDocument();
    const root = svgDoc.createElementNS(NS_SVG, 'svg');
    svgDoc.appendChild(root);

    const group = svgDoc.createElementNS(NS_SVG, 'g');
    root.appendChild(group);

    const svgCanvas = new SvgCanvas2D(group, false);

    // const xmlDoc = createXmlDocument();
    // const root = xmlDoc.createElement('data');
    // xmlDoc.appendChild(root);
    // const xmlCanvas = new XmlCanvas2D(root);
    const imageExport = new ImageExport();
    imageExport.includeOverlays = includeOverlays;

    imageExport.drawState(graph.getView().getState(graph.model.root!)!, svgCanvas);
    const xml = getPrettyXml(root);

    const templateData: string = !includeOverlays
      ? ''
      : // should be probably put in a dedicated group, as done in the HTML page (GraphView.overlayPane)
        `
    <image x="132" y="92" width="16" height="16" xlink:href="http://localhost/warning.png" preserveAspectRatio="none" pointer-events="none" />
    <image x="172" y="122" width="16" height="16" xlink:href="http://localhost/element.png" preserveAspectRatio="none" pointer-events="none" />`;

    const expectedData = `<svg xmlns="http://www.w3.org/2000/svg">
  <defs />
  <g>
    <rect x="0" y="0" width="80" height="30" fill="#c3d9ff" stroke="#6482b9" pointer-events="none" />
    <g fill="#774400" font-family="Arial,Helvetica" pointer-events="none" direction="" text-anchor="middle" font-size="11px">
      <rect fill="none" stroke="none" x="40" y="16" width="2" height="1" stroke-width="1" />
      <text x="40" y="19.5">
        vertex 1
      </text>
    </g>
    <rect x="100" y="100" width="80" height="30" fill="#c3d9ff" stroke="#6482b9" pointer-events="none" />
    <g fill="#774400" font-family="Arial,Helvetica" pointer-events="none" direction="" text-anchor="middle" font-size="11px">
      <rect fill="none" stroke="none" x="140" y="116" width="2" height="1" stroke-width="1" />
      <text x="140" y="119.5">
        vertex 2
      </text>
    </g>
    <path d="M 55 30 L 120.5 95.5" fill="none" stroke="#6482b9" stroke-miterlimit="10" pointer-events="none" />
    <path d="M 124.21 99.21 L 116.78 96.73 L 120.5 95.5 L 121.73 91.78 Z" fill="#6482b9" stroke="#6482b9" stroke-miterlimit="10" pointer-events="none" />
    <path d="M 44.29 30 L 50 50 L 114.07 96.27" fill="none" stroke="#6482b9" stroke-miterlimit="10" pointer-events="none" />
    <path d="M 118.32 99.35 L 110.6 98.08 L 114.07 96.27 L 114.7 92.41 Z" fill="#6482b9" stroke="#6482b9" stroke-miterlimit="10" pointer-events="none" />
    <g fill="#446299" font-family="Arial,Helvetica" pointer-events="none" direction="" text-anchor="middle" font-size="11px">
      <rect fill="none" stroke="none" x="76" y="69" width="2" height="1" stroke-width="1" />
      <text x="76.1" y="73.35">
        edge 1
      </text>
    </g>${templateData}
  </g>
</svg>
`;

    expect(xml).toBe(expectedData);
  }
);
