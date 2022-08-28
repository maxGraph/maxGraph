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
  Rectangle,
  RubberBandHandler,
  DomHelpers,
  InternalEvent,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Printing/PageBreaks',
  argTypes: {
    ...globalTypes,
    contextMenu: {
      type: 'boolean',
      defaultValue: false,
    },
    rubberBand: {
      type: 'boolean',
      defaultValue: true,
    },
  },
};

const Template = ({ label, ...args }) => {
  const div = document.createElement('div');

  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.background = 'url(/images/grid.gif)';
  container.style.cursor = 'default';
  div.appendChild(container);

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  // Creates the graph inside the given container
  const graph = new Graph(container);
  graph.view.setScale(0.15);
  graph.pageBreaksVisible = true;
  graph.pageBreakDashed = true;
  graph.preferPageSize = true;
  graph.centerZoom = false;
  graph.setPanning(true);

  // Account for the header and footer size in the page format
  const headerSize = 100;
  const footerSize = 100;

  // Removes header and footer from page height
  graph.pageFormat.height -= headerSize + footerSize;

  const graphHandler = graph.getPlugin('SelectionHandler');

  // Takes zoom into account for moving cells
  graphHandler.scaleGrid = true;

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex(parent, null, 'Hello,', 10, 10, 280, 330);
    const v2 = graph.insertVertex(
      parent,
      null,
      'World!',
      graph.pageFormat.width * graph.pageScale - 280 - 10,
      graph.pageFormat.height * graph.pageScale - 330 - 10,
      280,
      330
    );
    const e1 = graph.insertEdge(parent, null, '', v1, v2);
  });

  const buttons = document.createElement('div');
  div.appendChild(buttons);

  buttons.appendChild(
    DomHelpers.button('Toggle Page Breaks', function (evt) {
      graph.pageBreaksVisible = !graph.pageBreaksVisible;
      graph.sizeDidChange();
    })
  );

  buttons.appendChild(
    DomHelpers.button('Zoom In', function (evt) {
      graph.zoomIn();
    })
  );

  buttons.appendChild(
    DomHelpers.button('Zoom Out', function (evt) {
      graph.zoomOut();
    })
  );

  buttons.appendChild(
    DomHelpers.button('Print', function (evt) {
      // Matches actual printer paper size and avoids blank pages
      const scale = 0.5;

      // Applies scale to page
      const pf = Rectangle.fromRectangle(
        graph.pageFormat || constants.PAGE_FORMAT_A4_PORTRAIT
      );
      pf.width = Math.round(pf.width * scale * graph.pageScale);
      pf.height = Math.round(pf.height * scale * graph.pageScale);

      // Finds top left corner of top left page
      const bounds = Rectangle.fromRectangle(graph.getGraphBounds());
      bounds.x -= graph.view.translate.x * graph.view.scale;
      bounds.y -= graph.view.translate.y * graph.view.scale;

      const x0 = Math.floor(bounds.x / pf.width) * pf.width;
      const y0 = Math.floor(bounds.y / pf.height) * pf.height;

      const preview = new PrintPreview(graph, scale, pf, 0, -x0, -y0);
      preview.marginTop = headerSize * scale * graph.pageScale;
      preview.marginBottom = footerSize * scale * graph.pageScale;
      preview.autoOrigin = false;

      const oldRenderPage = preview.renderPage;
      preview.renderPage = function (w, h, x, y, content, pageNumber) {
        const div = oldRenderPage.apply(this, arguments);

        const header = document.createElement('div');
        header.style.position = 'absolute';
        header.style.boxSizing = 'border-box';
        header.style.fontFamily = 'Arial,Helvetica';
        header.style.height = `${this.marginTop - 10}px`;
        header.style.textAlign = 'center';
        header.style.verticalAlign = 'middle';
        header.style.marginTop = 'auto';
        header.style.fontSize = '12px';
        header.style.width = '100%';

        // Vertical centering for text in header/footer
        header.style.lineHeight = `${this.marginTop - 10}px`;

        const footer = header.cloneNode(true);

        write(header, `Page ${pageNumber} - Header`);
        header.style.borderBottom = '1px solid gray';
        header.style.top = '0px';

        write(footer, `Page ${pageNumber} - Footer`);
        footer.style.borderTop = '1px solid gray';
        footer.style.bottom = '0px';

        div.firstChild.appendChild(footer);
        div.firstChild.appendChild(header);

        return div;
      };

      preview.open();
    })
  );

  buttons.appendChild(
    DomHelpers.button('Reset View', function (evt) {
      graph.view.scaleAndTranslate(0.15, 0, 0);
    })
  );

  return div;
};

export const Default = Template.bind({});
