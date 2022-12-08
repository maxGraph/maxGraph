/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import Client from '../Client';
import { PAGE_FORMAT_A4_PORTRAIT } from './Constants';
import Rectangle from '../view/geometry/Rectangle';
import { getOuterHtml } from './domUtils';
import { Graph } from '../view/Graph';
import { removeCursors } from './styleUtils';

/**
 * Returns the scale to be used for printing the graph with the given
 * bounds across the specifies number of pages with the given format. The
 * scale is always computed such that it given the given amount or fewer
 * pages in the print output. See {@link PrintPreview} for an example.
 *
 * @param pageCount Specifies the number of pages in the print output.
 * @param graph {@link Graph} that should be printed.
 * @param pageFormat Optional {@link Rectangle} that specifies the page format.
 * Default is <mxConstants.PAGE_FORMAT_A4_PORTRAIT>.
 * @param border The border along each side of every page.
 */
export const getScaleForPageCount = (
  pageCount: number,
  graph: Graph,
  pageFormat?: Rectangle,
  border = 0
) => {
  if (pageCount < 1) {
    // We can't work with less than 1 page, return no scale
    // change
    return 1;
  }

  pageFormat =
    pageFormat != null ? pageFormat : new Rectangle(...PAGE_FORMAT_A4_PORTRAIT);

  const availablePageWidth = pageFormat.width - border * 2;
  const availablePageHeight = pageFormat.height - border * 2;

  // Work out the number of pages required if the
  // graph is not scaled.
  const graphBounds = graph.getGraphBounds().clone();
  const sc = graph.getView().getScale();
  graphBounds.width /= sc;
  graphBounds.height /= sc;
  const graphWidth = graphBounds.width;
  const graphHeight = graphBounds.height;

  let scale = 1;

  // The ratio of the width/height for each printer page
  const pageFormatAspectRatio = availablePageWidth / availablePageHeight;
  // The ratio of the width/height for the graph to be printer
  const graphAspectRatio = graphWidth / graphHeight;

  // The ratio of horizontal pages / vertical pages for this
  // graph to maintain its aspect ratio on this page format
  const pagesAspectRatio = graphAspectRatio / pageFormatAspectRatio;

  // Factor the square root of the page count up and down
  // by the pages aspect ratio to obtain a horizontal and
  // vertical page count that adds up to the page count
  // and has the correct aspect ratio
  const pageRoot = Math.sqrt(pageCount);
  const pagesAspectRatioSqrt = Math.sqrt(pagesAspectRatio);
  let numRowPages = pageRoot * pagesAspectRatioSqrt;
  let numColumnPages = pageRoot / pagesAspectRatioSqrt;

  // These value are rarely more than 2 rounding downs away from
  // a total that meets the page count. In cases of one being less
  // than 1 page, the other value can be too high and take more iterations
  // In this case, just change that value to be the page count, since
  // we know the other value is 1
  if (numRowPages < 1 && numColumnPages > pageCount) {
    const scaleChange = numColumnPages / pageCount;
    numColumnPages = pageCount;
    numRowPages /= scaleChange;
  }

  if (numColumnPages < 1 && numRowPages > pageCount) {
    const scaleChange = numRowPages / pageCount;
    numRowPages = pageCount;
    numColumnPages /= scaleChange;
  }

  let currentTotalPages = Math.ceil(numRowPages) * Math.ceil(numColumnPages);

  let numLoops = 0;

  // Iterate through while the rounded up number of pages comes to
  // a total greater than the required number
  while (currentTotalPages > pageCount) {
    // Round down the page count (rows or columns) that is
    // closest to its next integer down in percentage terms.
    // i.e. Reduce the page total by reducing the total
    // page area by the least possible amount

    let roundRowDownProportion = Math.floor(numRowPages) / numRowPages;
    let roundColumnDownProportion = Math.floor(numColumnPages) / numColumnPages;

    // If the round down proportion is, work out the proportion to
    // round down to 1 page less
    if (roundRowDownProportion == 1) {
      roundRowDownProportion = Math.floor(numRowPages - 1) / numRowPages;
    }
    if (roundColumnDownProportion == 1) {
      roundColumnDownProportion = Math.floor(numColumnPages - 1) / numColumnPages;
    }

    // Check which rounding down is smaller, but in the case of very small roundings
    // try the other dimension instead
    let scaleChange = 1;

    // Use the higher of the two values
    if (roundRowDownProportion > roundColumnDownProportion) {
      scaleChange = roundRowDownProportion;
    } else {
      scaleChange = roundColumnDownProportion;
    }

    numRowPages *= scaleChange;
    numColumnPages *= scaleChange;
    currentTotalPages = Math.ceil(numRowPages) * Math.ceil(numColumnPages);

    numLoops++;

    if (numLoops > 10) {
      break;
    }
  }

  // Work out the scale from the number of row pages required
  // The column pages will give the same value
  const posterWidth = availablePageWidth * numRowPages;
  scale = posterWidth / graphWidth;

  // Allow for rounding errors
  return scale * 0.99999;
};

/**
 * Copies the styles and the markup from the graph's container into the
 * given document and removes all cursor styles. The document is returned.
 *
 * This function should be called from within the document with the graph.
 * If you experience problems with missing stylesheets in IE then try adding
 * the domain to the trusted sites.
 *
 * @param graph {@link Graph} to be copied.
 * @param doc Document where the new graph is created.
 * @param x0 X-coordinate of the graph view origin. Default is 0.
 * @param y0 Y-coordinate of the graph view origin. Default is 0.
 * @param w Optional width of the graph view.
 * @param h Optional height of the graph view.
 */
export const show = (
  graph: Graph,
  doc: Document | null = null,
  x0 = 0,
  y0 = 0,
  w: number | null = null,
  h: number | null = null
) => {
  x0 = x0 != null ? x0 : 0;
  y0 = y0 != null ? y0 : 0;

  if (doc == null) {
    const wnd = window.open() as Window;
    doc = wnd.document;
  } else {
    doc.open();
  }

  const bounds = graph.getGraphBounds();
  const dx = Math.ceil(x0 - bounds.x);
  const dy = Math.ceil(y0 - bounds.y);

  if (w == null) {
    w = Math.ceil(bounds.width + x0) + Math.ceil(Math.ceil(bounds.x) - bounds.x);
  }

  if (h == null) {
    h = Math.ceil(bounds.height + y0) + Math.ceil(Math.ceil(bounds.y) - bounds.y);
  }

  doc.writeln('<html><head>');

  const base = document.getElementsByTagName('base');

  for (let i = 0; i < base.length; i += 1) {
    doc.writeln(getOuterHtml(base[i]));
  }

  const links = document.getElementsByTagName('link');

  for (let i = 0; i < links.length; i += 1) {
    doc.writeln(getOuterHtml(links[i]));
  }

  const styles = document.getElementsByTagName('style');

  for (let i = 0; i < styles.length; i += 1) {
    doc.writeln(getOuterHtml(styles[i]));
  }

  doc.writeln('</head><body style="margin:0px;"></body></html>');
  doc.close();

  const outer = doc.createElement('div');
  outer.style.position = 'absolute';
  outer.style.overflow = 'hidden';
  outer.style.width = `${w}px`;
  outer.style.height = `${h}px`;

  // Required for HTML labels if foreignObjects are disabled
  const div = doc.createElement('div');
  div.style.position = 'absolute';
  div.style.left = `${dx}px`;
  div.style.top = `${dy}px`;

  if (graph.container && graph.view.drawPane) {
    let node = graph.container.firstChild;
    let svg: SVGElement | null = null;

    while (node != null) {
      const clone = node.cloneNode(true);

      if (node == (<SVGElement>graph.view.drawPane).ownerSVGElement) {
        outer.appendChild(clone);
        svg = clone as SVGElement;
      } else {
        div.appendChild(clone);
      }

      node = node.nextSibling;
    }

    doc.body.appendChild(outer);

    if (div.firstChild != null) {
      doc.body.appendChild(div);
    }

    if (svg != null) {
      svg.style.minWidth = '';
      svg.style.minHeight = '';

      if (svg.firstChild)
        (svg.firstChild as HTMLElement).setAttribute(
          'transform',
          `translate(${dx},${dy})`
        );
    }

    removeCursors(doc.body);
  }
  return doc;
};

/**
 * Prints the specified graph using a new window and the built-in print
 * dialog.
 *
 * This function should be called from within the document with the graph.
 *
 * @param graph {@link Graph} to be printed.
 */
export const printScreen = (graph: Graph) => {
  const wnd = window.open();

  if (!wnd) return;

  const bounds = graph.getGraphBounds();
  show(graph, wnd.document);

  const print = () => {
    wnd.focus();
    wnd.print();
    wnd.close();
  };

  // Workaround for Google Chrome which needs a bit of a
  // delay in order to render the SVG contents
  if (Client.IS_GC) {
    wnd.setTimeout(print, 500);
  } else {
    print();
  }
};
