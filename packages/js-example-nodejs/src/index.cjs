/*
Copyright 2025-present The maxGraph project Contributors

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

require('jsdom-global')(); // This is needed to create a DOM environment for Node.js
const fs = require('node:fs');
const { constants, Graph, ModelXmlSerializer, Rectangle } = require('@maxgraph/core');

console.info('maxGraph example with Node.js using CommonJS');

const graph = new Graph();
// Adds cells to the model in a single step
graph.batchUpdate(() => {
  const vertex01 = graph.insertVertex({
    position: [10, 10],
    size: [100, 100],
    value: 'rectangle',
  });
  const vertex02 = graph.insertVertex({
    position: [350, 90],
    size: [50, 50],
    style: {
      fillColor: 'orange',
      shape: 'ellipse',
      verticalAlign: 'top',
      verticalLabelPosition: 'bottom',
    },
    value: 'ellipse',
  });
  graph.insertEdge({
    source: vertex01,
    target: vertex02,
    value: 'edge',
    style: {
      edgeStyle: 'orthogonalEdgeStyle',
      rounded: true,
    },
  });
});

const generationDate =
  new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' UTC';

const xmlFileHeader = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generated with maxGraph ${constants.VERSION} by js-example-nodejs using CommonJS on ${generationDate} -->`;

console.info('Exporting maxGraph model...');
const modelAsXml = new ModelXmlSerializer(graph.getDataModel()).export();
const xml = `${xmlFileHeader}
${modelAsXml}`;

// create the build directory if it doesn't exist
const outputDirectory = 'build/cjs';
if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
}
fs.writeFileSync(`${outputDirectory}/graph.xml`, xml, 'utf8');

console.info('Export done.');

/**
 * This exporter only works when not using `htmlLabels` i.e. the labels are rendered as HTML markup.
 * `htmlLabels` are rendered with foreignObject elements in the SVG including HTML that correctly display the labels when the SVG is included in the HTML page.
 *
 * See {@link Graph.htmlLabels}.
 */
class SimpleSvgExporter {
  constructor(graph) {
    this.graph = graph;
  }

  export(options) {
    const margin = options?.margin ?? 10;
    const graphBounds = this.graph.getGraphBounds();
    const bounds = new Rectangle(
      graphBounds.x - margin,
      graphBounds.y - margin,
      graphBounds.width + 2 * margin,
      graphBounds.height + 2 * margin
    );

    const svgNode = graph.container.querySelector('svg');
    return `${xmlFileHeader}
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}">
${svgNode.innerHTML}
</svg>`;
  }
}

console.info('Exporting SVG...');
const svg = new SimpleSvgExporter(graph).export();
fs.writeFileSync(`${outputDirectory}/graph.svg`, svg, 'utf8');
console.info('Export done.');
