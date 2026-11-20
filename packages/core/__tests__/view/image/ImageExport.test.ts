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

import { describe, expect, test } from '@jest/globals';
import {
  type Cell,
  CellOverlay,
  type Graph,
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

    graph.insertEdge({ parent, value: '', source: v1, target: v2 });
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
  <save />
  <scale scale="1" />
  <fillcolor color="#FFFFFF" />
  <strokecolor color="#000000" />
  <image x="132" y="92" w="16" h="16" src="http://localhost/warning.png" aspect="0" flipH="0" flipV="0" />
  <restore />
  <save />
  <scale scale="1" />
  <fillcolor color="#FFFFFF" />
  <strokecolor color="#000000" />
  <image x="172" y="122" w="16" h="16" src="http://localhost/element.png" aspect="0" flipH="0" flipV="0" />
  <restore />`;

    const expectedData = `<data>
  <fontfamily family="Arial,Helvetica,sans-serif" />
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
    <g fill="#774400" font-family="Arial,Helvetica,sans-serif" pointer-events="none" direction="" text-anchor="middle" font-size="11px">
      <rect fill="none" stroke="none" x="40" y="16" width="2" height="1" stroke-width="1" />
      <text x="40" y="19.5">
        vertex 1
      </text>
    </g>
    <rect x="100" y="100" width="80" height="30" fill="#c3d9ff" stroke="#6482b9" pointer-events="none" />
    <g fill="#774400" font-family="Arial,Helvetica,sans-serif" pointer-events="none" direction="" text-anchor="middle" font-size="11px">
      <rect fill="none" stroke="none" x="140" y="116" width="2" height="1" stroke-width="1" />
      <text x="140" y="119.5">
        vertex 2
      </text>
    </g>
    <path d="M 55 30 L 120.5 95.5" fill="none" stroke="#6482b9" stroke-miterlimit="10" pointer-events="none" />
    <path d="M 124.21 99.21 L 116.78 96.73 L 120.5 95.5 L 121.73 91.78 Z" fill="#6482b9" stroke="#6482b9" stroke-miterlimit="10" pointer-events="none" />
    <path d="M 44.29 30 L 50 50 L 114.07 96.27" fill="none" stroke="#6482b9" stroke-miterlimit="10" pointer-events="none" />
    <path d="M 118.32 99.35 L 110.6 98.08 L 114.07 96.27 L 114.7 92.41 Z" fill="#6482b9" stroke="#6482b9" stroke-miterlimit="10" pointer-events="none" />
    <g fill="#446299" font-family="Arial,Helvetica,sans-serif" pointer-events="none" direction="" text-anchor="middle" font-size="11px">
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

describe('export with SvgCanvas2D at the scale 1, whatever the view scale', () => {
  const exportWithSvgCanvas = (graph: Graph, viewScale: number): Element => {
    graph.view.setScale(viewScale);

    const svgDoc = createXmlDocument();
    const root = svgDoc.createElementNS(NS_SVG, 'svg');
    svgDoc.appendChild(root);
    const svgCanvas = new SvgCanvas2D(root, false);
    svgCanvas.scale(1 / viewScale);

    const imageExport = new ImageExport();
    imageExport.includeOverlays = true;
    imageExport.drawState(graph.view.getState(graph.model.root!)!, svgCanvas);
    return root;
  };

  const getBounds = (root: Element, selector: string): number[][] =>
    [...root.querySelectorAll(selector)].map((element) =>
      ['x', 'y', 'width', 'height'].map((name) => Number(element.getAttribute(name)))
    );

  test.each([1, 2, 0.5])('shapes and labels, view scale: %s', (viewScale) => {
    const graph = createGraphWithVerticesAndOverlays();
    graph.removeCellOverlays(graph.model.getCell('v2')!);

    const root = exportWithSvgCanvas(graph, viewScale);

    expect(getBounds(root, 'rect[stroke="#6482b9"]')).toEqual([
      [0, 0, 80, 30],
      [100, 100, 80, 30],
    ]);
    expect(
      [...root.querySelectorAll('path')].map((path) => path.getAttribute('d'))
    ).toEqual([
      'M 55 30 L 120.5 95.5',
      'M 124.21 99.21 L 116.78 96.73 L 120.5 95.5 L 121.73 91.78 Z',
      'M 44.29 30 L 50 50 L 114.07 96.27',
      'M 118.32 99.35 L 110.6 98.08 L 114.07 96.27 L 114.7 92.41 Z',
    ]);
    // The edge label is left out: the view rounds its position, so it moves a bit with the view scale
    const vertexLabels = [...root.querySelectorAll('text')].slice(0, 2);
    expect(
      vertexLabels.map((text) => [
        Number(text.getAttribute('x')),
        Number(text.getAttribute('y')),
      ])
    ).toEqual([
      [40, 19.5],
      [140, 119.5],
    ]);
  });

  test.each([1, 2, 0.5])('overlays of several vertices, view scale: %s', (viewScale) => {
    const graph = createGraphWithoutContainer();
    graph.batchUpdate(() => {
      for (const x of [20, 200, 380]) {
        const vertex = graph.insertVertex({ position: [x, 20], size: [80, 40] });
        graph.addCellOverlay(
          vertex,
          new CellOverlay(new ImageBox('overlay.png', 16, 16))
        );
      }
    });

    const root = exportWithSvgCanvas(graph, viewScale);

    // the overlays are at the bottom-right corner of each vertex
    expect(getBounds(root, 'image')).toEqual([
      [92, 52, 16, 16],
      [272, 52, 16, 16],
      [452, 52, 16, 16],
    ]);
  });

  test.each([1, 2, 0.5])(
    'several overlays of the same vertex, view scale: %s',
    (viewScale) => {
      const graph = createGraphWithoutContainer();
      graph.batchUpdate(() => {
        const vertex = graph.insertVertex({ position: [20, 20], size: [80, 40] });
        for (const offsetX of [-20, 0]) {
          graph.addCellOverlay(
            vertex,
            new CellOverlay(
              new ImageBox('overlay.png', 16, 16),
              null,
              'right',
              'bottom',
              new Point(offsetX, 0)
            )
          );
        }
      });

      const root = exportWithSvgCanvas(graph, viewScale);

      // the offset of each overlay shifts it from the bottom-right corner of the vertex
      expect(getBounds(root, 'image')).toEqual([
        [72, 52, 16, 16],
        [92, 52, 16, 16],
      ]);
    }
  );

  const createGraphWithEdges = (): { graph: Graph; edges: Cell[] } => {
    const graph = createGraphWithoutContainer();
    const edges: Cell[] = [];
    graph.batchUpdate(() => {
      const source = graph.insertVertex({ position: [20, 20], size: [80, 40] });
      for (const y of [20, 140]) {
        const target = graph.insertVertex({ position: [300, y], size: [80, 40] });
        edges.push(graph.insertEdge({ source, target }));
      }
    });
    return { graph, edges };
  };

  test.each([1, 2, 0.5])('overlays of several edges, view scale: %s', (viewScale) => {
    const { graph, edges } = createGraphWithEdges();
    for (const edge of edges) {
      graph.addCellOverlay(edge, new CellOverlay(new ImageBox('overlay.png', 16, 16)));
    }

    const root = exportWithSvgCanvas(graph, viewScale);

    // the overlays are centered on the middle of each edge
    expect(getBounds(root, 'image')).toEqual([
      [192, 32, 16, 16],
      [192, 92, 16, 16],
    ]);
  });

  test.each([1, 2, 0.5])(
    'several overlays of the same edge, view scale: %s',
    (viewScale) => {
      const { graph, edges } = createGraphWithEdges();
      for (const offsetX of [-20, 0, 20]) {
        graph.addCellOverlay(
          edges[0],
          new CellOverlay(
            new ImageBox('overlay.png', 16, 16),
            null,
            'right',
            'bottom',
            new Point(offsetX, 0)
          )
        );
      }

      const root = exportWithSvgCanvas(graph, viewScale);

      // the offset of each overlay shifts it from the middle of the edge
      expect(getBounds(root, 'image')).toEqual([
        [172, 32, 16, 16],
        [192, 32, 16, 16],
        [212, 32, 16, 16],
      ]);
    }
  );

  test.each([1, 2, 0.5])('overlay of a nested cell, view scale: %s', (viewScale) => {
    const graph = createGraphWithoutContainer();
    graph.batchUpdate(() => {
      const container = graph.insertVertex({ position: [20, 20], size: [200, 100] });
      const child = graph.insertVertex({
        parent: container,
        position: [10, 10],
        size: [80, 40],
      });
      graph.addCellOverlay(child, new CellOverlay(new ImageBox('overlay.png', 16, 16)));
    });

    const root = exportWithSvgCanvas(graph, viewScale);

    // the overlay is at the bottom-right corner of the child, positioned relatively to its container
    expect(getBounds(root, 'image')).toEqual([[102, 62, 16, 16]]);
  });
});
