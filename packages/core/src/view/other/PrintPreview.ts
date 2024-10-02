/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2019, JGraph Ltd
Copyright (c) 2006-2017, draw.io AG

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

import Point from '../geometry/Point';
import Rectangle from '../geometry/Rectangle';
import TemporaryCellStates from '../cell/TemporaryCellStates';
import InternalEvent from '../event/InternalEvent';
import Client from '../../Client';
import { intersects } from '../../util/mathUtils';
import { DIALECT } from '../../util/Constants';
import { addLinkToHead, write } from '../../util/domUtils';
import { Graph } from '../Graph';
import CellState from '../cell/CellState';
import Cell from '../cell/Cell';

/**
 * @class PrintPreview
 *
 * Implements printing of a diagram across multiple pages. The following opens
 * a print preview for an existing graph:
 *
 * ```javascript
 * var preview = new mxPrintPreview(graph);
 * preview.open();
 * ```
 *
 * Use {@link getScaleForPageCount} as follows in order to print the graph
 * across a given number of pages:
 *
 * ```javascript
 * var pageCount = mxUtils.prompt('Enter page count', '1');
 *
 * if (pageCount != null)
 * {
 *   var scale = mxUtils.getScaleForPageCount(pageCount, graph);
 *   var preview = new mxPrintPreview(graph, scale);
 *   preview.open();
 * }
 * ```
 *
 * ### Additional pages
 *
 * To add additional pages before and after the output, {@link getCoverPages} and
 * {@link getAppendices} can be used, respectively.
 *
 * ```javascript
 * var preview = new mxPrintPreview(graph, 1);
 *
 * preview.getCoverPages(w, h)
 * {
 *   return [this.renderPage(w, h, 0, 0, mxUtils.bind(this, function(div)
 *   {
 *     div.innerHTML = '<div style="position:relative;margin:4px;">Cover Page</p>'
 *   }))];
 * };
 *
 * preview.getAppendices(w, h)
 * {
 *   return [this.renderPage(w, h, 0, 0, mxUtils.bind(this, function(div)
 *   {
 *     div.innerHTML = '<div style="position:relative;margin:4px;">Appendix</p>'
 *   }))];
 * };
 *
 * preview.open();
 * ```
 *
 * ### CSS
 *
 * The CSS from the original page is not carried over to the print preview.
 * To add CSS to the page, use the css argument in the {@link open} function or
 * override {@link writeHead} to add the respective link tags as follows:
 *
 * ```javascript
 * var writeHead = preview.writeHead;
 * preview.writeHead(doc, css)
 * {
 *   writeHead.apply(this, arguments);
 *   doc.writeln('<link rel="stylesheet" type="text/css" href="style.css">');
 * };
 * ```
 *
 * ### Padding
 *
 * To add a padding to the page in the preview (but not the print output), use
 * the following code:
 *
 * ```javascript
 * preview.writeHead(doc)
 * {
 *   writeHead.apply(this, arguments);
 *
 *   doc.writeln('<style type="text/css">');
 *   doc.writeln('@media screen {');
 *   doc.writeln('  body > div { padding-top:30px;padding-left:40px;box-sizing:content-box; }');
 *   doc.writeln('}');
 *   doc.writeln('</style>');
 * };
 * ```
 *
 * ### Headers
 *
 * Apart from setting the title argument in the mxPrintPreview constructor you
 * can override {@link renderPage} as follows to add a header to any page:
 *
 * ```javascript
 * var oldRenderPage = renderPage;
 * renderPage(w, h, x, y, content, pageNumber)
 * {
 *   var div = oldRenderPage.apply(this, arguments);
 *
 *   var header = document.createElement('div');
 *   header.style.position = 'absolute';
 *   header.style.top = '0px';
 *   header.style.width = '100%';
 *   header.style.textAlign = 'right';
 *   mxUtils.write(header, 'Your header here');
 *   div.firstChild.appendChild(header);
 *
 *   return div;
 * };
 * ```
 *
 * The pageNumber argument contains the number of the current page, starting at
 * 1. To display a header on the first page only, check pageNumber and add a
 * vertical offset in the constructor call for the height of the header.
 *
 * ### Page Format
 *
 * For landscape printing, use {@link mxConstants.PAGE_FORMAT_A4_LANDSCAPE} as
 * the pageFormat in {@link getScaleForPageCount} and {@link PrintPreview}.
 * Keep in mind that one can not set the defaults for the print dialog
 * of the operating system from JavaScript so the user must manually choose
 * a page format that matches this setting.
 *
 * You can try passing the following CSS directive to {@link open} to set the
 * page format in the print dialog to landscape. However, this CSS
 * directive seems to be ignored in most major browsers, including IE.
 *
 * ```javascript
 * @page {
 *   size: landscape;
 * }
 * ```
 *
 * Note that the print preview behaves differently in IE when used from the
 * filesystem or via HTTP so printing should always be tested via HTTP.
 *
 * If you are using a DOCTYPE in the source page you can override {@link getDoctype}
 * and provide the same DOCTYPE for the print preview if required. Here is
 * an example for IE8 standards mode.
 *
 * ```javascript
 * var preview = new mxPrintPreview(graph);
 * preview.getDoctype()
 * {
 *   return '<!--[if IE]><meta http-equiv="X-UA-Compatible" content="IE=5,IE=8" ><![endif]-->';
 * };
 * preview.open();
 * ```
 */
class PrintPreview {
  constructor(
    graph: Graph,
    scale: number | null = null,
    pageFormat: Rectangle | null = null,
    border: number | null = null,
    x0 = 0,
    y0 = 0,
    borderColor: string | null = null,
    title = 'Printer-friendly version',
    pageSelector: boolean | null = null
  ) {
    this.graph = graph;
    this.scale = scale != null ? scale : 1 / graph.pageScale;
    this.border = border != null ? border : 0;
    this.pageFormat = Rectangle.fromRectangle(
      pageFormat != null ? pageFormat : graph.pageFormat
    );
    this.title = title;
    this.x0 = x0;
    this.y0 = y0;
    this.borderColor = borderColor;
    this.pageSelector = pageSelector != null ? pageSelector : true;
  }

  /**
   * Reference to the {@link graph} that should be previewed.
   */
  graph: Graph;

  /**
   * Holds the {@link Rectangle} that defines the page format.
   */
  pageFormat: Rectangle;

  /**
   * Holds the scale of the print preview.
   */
  scale: number;

  /**
   * The border inset around each side of every page in the preview. This is set
   * to 0 if autoOrigin is false.
   * @default 0
   */
  border = 0;

  /**
   * The margin at the top of the page (number).
   * @default 0
   */
  marginTop = 0;

  /**
   * The margin at the bottom of the page (number).
   * @default 0
   */
  marginBottom = 0;

  /**
   * Holds the horizontal offset of the output.
   */
  x0 = 0;

  /**
   * Holds the vertical offset of the output.
   */
  y0 = 0;

  /**
   * Specifies if the origin should be automatically computed based on the top,
   * left corner of the actual diagram contents. The required offset will be added
   * to {@link x0} and {@link y0} in {@link open}.
   * @default true
   */
  autoOrigin = true;

  /**
   * Specifies if overlays should be printed.
   * @default false
   */
  printOverlays = false;

  /**
   * Specifies if controls (such as folding icons) should be printed. Default is
   * false.
   */
  printControls = false;

  /**
   * Specifies if the background image should be printed.
   * @default false
   */
  printBackgroundImage = false;

  /**
   * Holds the color value for the page background color.
   * @default '#ffffff'
   */
  backgroundColor = '#ffffff';

  /**
   * Holds the color value for the page border.
   */
  borderColor: string | null;

  /**
   * Holds the title of the preview window.
   */
  title: string;

  /**
   * Boolean that specifies if the page selector should be
   * displayed.
   * @default true
   */
  pageSelector: boolean;

  /**
   * Reference to the preview window.
   */
  wnd: Window | null = null;

  /**
   * Assign any window here to redirect the rendering in {@link open}.
   */
  targetWindow: Window | null = null;

  /**
   * Holds the actual number of pages in the preview.
   */
  pageCount = 0;

  /**
   * Specifies is clipping should be used to avoid creating too many cell states
   * in large diagrams. The bounding box of the cells in the original diagram is
   * used if this is enabled.
   * @default true
   */
  clipping = true;

  /**
   * Returns {@link wnd}.
   */
  getWindow(): Window | null {
    return this.wnd;
  }

  /**
   * Returns the string that should go before the HTML tag in the print preview
   * page. This implementation returns an X-UA meta tag for IE5 in quirks mode,
   * IE8 in IE8 standards mode and edge in IE9 standards mode.
   */
  getDoctype(): string {
    const dt = '';
    return dt;
  }

  /**
   * Adds the given graph to the existing print preview.
   *
   * @param css Optional CSS string to be used in the head section.
   * @param targetWindow Optional window that should be used for rendering. If
   * this is specified then no HEAD tag, CSS and BODY tag will be written.
   */
  appendGraph(
    graph: Graph,
    scale: number,
    x0: number,
    y0: number,
    forcePageBreaks: boolean,
    keepOpen: boolean
  ) {
    this.graph = graph;
    this.scale = scale != null ? scale : 1 / graph.pageScale;
    this.x0 = x0;
    this.y0 = y0;
    this.open(null, null, forcePageBreaks, keepOpen);
  }

  /**
   * Shows the print preview window. The window is created here if it does
   * not exist.
   *
   * @param css Optional CSS string to be used in the head section.
   * @param targetWindow Optional window that should be used for rendering. If
   * this is specified then no HEAD tag, CSS and BODY tag will be written.
   */
  open(
    css: string | null = null,
    targetWindow: Window | null = null,
    forcePageBreaks = false,
    keepOpen = false
  ): Window | null {
    // Closing the window while the page is being rendered may cause an
    // exception in IE. This and any other exceptions are simply ignored.
    const previousInitializeOverlay = this.graph.cellRenderer.initializeOverlay;
    let div = null;

    try {
      // Temporarily overrides the method to redirect rendering of overlays
      // to the draw pane so that they are visible in the printout
      if (this.printOverlays) {
        this.graph.cellRenderer.initializeOverlay = (state, overlay) => {
          overlay.init(state.view.getDrawPane());
        };
      }

      if (this.printControls) {
        this.graph.cellRenderer.initControl = (
          state,
          control,
          handleEvents,
          clickHandler
        ) => {
          control.dialect = state.view.graph.dialect;
          control.init(state.view.getDrawPane());
          return null;
        };
      }

      this.wnd = targetWindow != null ? targetWindow : this.wnd;
      let isNewWindow = false;

      if (this.wnd == null) {
        isNewWindow = true;
        this.wnd = window.open();
      }

      if (!this.wnd) {
        throw new Error('Create new window not allowed');
      }
      const doc = this.wnd.document;

      if (isNewWindow) {
        const dt = this.getDoctype();

        if (dt != null && dt.length > 0) {
          doc.writeln(dt);
        }

        if (document.compatMode === 'CSS1Compat') {
          doc.writeln('<!DOCTYPE html>');
        }

        doc.writeln('<html>');

        doc.writeln('<head>');

        this.writeHead(doc, css);

        doc.writeln('</head>');
        doc.writeln('<body class="mxPage">');
      }

      // Computes the horizontal and vertical page count
      const bounds = this.graph.getGraphBounds().clone();
      const currentScale = this.graph.getView().getScale();
      const sc = currentScale / this.scale;
      const tr = this.graph.getView().getTranslate();

      // Uses the absolute origin with no offset for all printing
      if (!this.autoOrigin) {
        this.x0 -= tr.x * this.scale;
        this.y0 -= tr.y * this.scale;
        bounds.width += bounds.x;
        bounds.height += bounds.y;
        bounds.x = 0;
        bounds.y = 0;
        this.border = 0;
      }

      // Store the available page area
      const availableWidth = this.pageFormat.width - this.border * 2;
      const availableHeight = this.pageFormat.height - this.border * 2;

      // Adds margins to page format
      this.pageFormat.height += this.marginTop + this.marginBottom;

      // Compute the unscaled, untranslated bounds to find
      // the number of vertical and horizontal pages
      bounds.width /= sc;
      bounds.height /= sc;

      const hpages = Math.max(1, Math.ceil((bounds.width + this.x0) / availableWidth));
      const vpages = Math.max(1, Math.ceil((bounds.height + this.y0) / availableHeight));
      this.pageCount = hpages * vpages;

      const writePageSelector = () => {
        if (this.pageSelector && (vpages > 1 || hpages > 1)) {
          const table = this.createPageSelector(vpages, hpages);
          doc.body.appendChild(table);
        }
      };

      const addPage = (div: HTMLElement, addBreak: boolean) => {
        // Border of the DIV (aka page) inside the document
        if (this.borderColor != null) {
          div.style.borderColor = this.borderColor;
          div.style.borderStyle = 'solid';
          div.style.borderWidth = '1px';
        }

        // Needs to be assigned directly because IE doesn't support
        // child selectors, eg. body > div { background: white; }
        div.style.background = this.backgroundColor;

        if (forcePageBreaks || addBreak) {
          div.style.pageBreakAfter = 'always';
        }

        // NOTE: We are dealing with cross-window DOM here, which
        // is a problem in IE, so we copy the HTML markup instead.
        // The underlying problem is that the graph display markup
        // creation (in mxShape, mxGraphView) is hardwired to using
        // document.createElement and hence we must use this document
        // to create the complete page and then copy it over to the
        // new window.document. This can be fixed later by using the
        // ownerDocument of the container in mxShape and mxGraphView.
        if (isNewWindow && Client.IS_EDGE) {
          // For some obscure reason, removing the DIV from the
          // parent before fetching its outerHTML has missing
          // fillcolor properties and fill children, so the div
          // must be removed afterwards to keep the fillcolors.
          doc.writeln(div.outerHTML);
          (<Element>div.parentNode).removeChild(div);
        } else if (Client.IS_EDGE) {
          let clone = doc.createElement('div');
          clone.innerHTML = div.outerHTML;
          clone = clone.getElementsByTagName('div')[0];
          doc.body.appendChild(clone);
          (<Element>div.parentNode).removeChild(div);
        } else {
          (<Element>div.parentNode).removeChild(div);
          doc.body.appendChild(div);
        }

        if (forcePageBreaks || addBreak) {
          this.addPageBreak(doc);
        }
      };

      const cov = this.getCoverPages(this.pageFormat.width, this.pageFormat.height);

      if (cov != null) {
        for (let i = 0; i < cov.length; i += 1) {
          addPage(cov[i], true);
        }
      }

      const apx = this.getAppendices(this.pageFormat.width, this.pageFormat.height);

      // Appends each page to the page output for printing, making
      // sure there will be a page break after each page (ie. div)
      for (let i = 0; i < vpages; i += 1) {
        const dy =
          (i * availableHeight) / this.scale -
          this.y0 / this.scale +
          (bounds.y - tr.y * currentScale) / currentScale;

        for (let j = 0; j < hpages; j++) {
          if (this.wnd == null) {
            return null;
          }

          const dx =
            (j * availableWidth) / this.scale -
            this.x0 / this.scale +
            (bounds.x - tr.x * currentScale) / currentScale;
          const pageNum = i * hpages + j + 1;
          const clip = new Rectangle(dx, dy, availableWidth, availableHeight);
          div = this.renderPage(
            this.pageFormat.width,
            this.pageFormat.height,
            0,
            0,
            (div) => {
              this.addGraphFragment(-dx, -dy, this.scale, pageNum, div, clip);

              if (this.printBackgroundImage) {
                this.insertBackgroundImage(div, -dx, -dy);
              }
            },
            pageNum
          );

          // Gives the page a unique ID for later accessing the page
          div.setAttribute('id', `mxPage-${pageNum}`);

          addPage(div, apx != null || i < vpages - 1 || j < hpages - 1);
        }
      }

      if (apx != null) {
        for (let i = 0; i < apx.length; i += 1) {
          addPage(apx[i], i < apx.length - 1);
        }
      }

      if (isNewWindow && !keepOpen) {
        this.closeDocument();
        writePageSelector();
      }

      this.wnd.focus();
    } catch (e) {
      // Removes the DIV from the document in case of an error
      if (div != null && div.parentNode != null) {
        div.parentNode.removeChild(div);
      }
    } finally {
      this.graph.cellRenderer.initializeOverlay = previousInitializeOverlay;
    }

    return this.wnd;
  }

  /**
   * Adds a page break to the given document.
   */
  addPageBreak(doc: Document): void {
    const hr = doc.createElement('hr');
    hr.className = 'mxPageBreak';
    doc.body.appendChild(hr);
  }

  /**
   * Writes the closing tags for body and page after calling {@link writePostfix}.
   */
  closeDocument(): void {
    try {
      if (this.wnd != null && this.wnd.document != null) {
        const doc = this.wnd.document;

        this.writePostfix(doc);
        doc.writeln('</body>');
        doc.writeln('</html>');
        doc.close();

        // Removes all event handlers in the print output
        InternalEvent.release(doc.body);
      }
    } catch (e) {
      // ignore any errors resulting from wnd no longer being available
    }
  }

  /**
   * Writes the HEAD section into the given document, without the opening
   * and closing HEAD tags.
   */
  writeHead(doc: Document, css: string | null): void {
    if (this.title != null) {
      doc.writeln(`<title>${this.title}</title>`);
    }

    // Adds all required stylesheets
    addLinkToHead('stylesheet', `${Client.basePath}/css/common.css`, doc);

    // Removes horizontal rules and page selector from print output
    doc.writeln('<style type="text/css">');
    doc.writeln('@media print {');
    doc.writeln('  * { -webkit-print-color-adjust: exact; }');
    doc.writeln('  table.mxPageSelector { display: none; }');
    doc.writeln('  hr.mxPageBreak { display: none; }');
    doc.writeln('}');
    doc.writeln('@media screen {');

    // NOTE: position: fixed is not supported in IE, so the page selector
    // position (absolute) needs to be updated in IE (see below)
    doc.writeln(
      '  table.mxPageSelector { position: fixed; right: 10px; top: 10px;' +
      'font-family: Arial; font-size:10pt; border: solid 1px darkgray;' +
      'background: white; border-collapse:collapse; }'
    );
    doc.writeln('  table.mxPageSelector td { border: solid 1px gray; padding:4px; }');
    doc.writeln('  body.mxPage { background: gray; }');
    doc.writeln('}');

    if (css != null) {
      doc.writeln(css);
    }

    doc.writeln('</style>');
  }

  /**
   * Called before closing the body of the page. This implementation is empty.
   */
  writePostfix(doc: Document): any {
    // empty
  }

  /**
   * Creates the page selector table.
   */
  createPageSelector(vpages: number, hpages: number): HTMLTableElement {
    if (!this.wnd) {
      throw new Error('Popup window not created');
    }
    const doc = this.wnd.document;
    const table = doc.createElement('table');
    table.className = 'mxPageSelector';
    table.setAttribute('border', '0');

    const tbody = doc.createElement('tbody');

    for (let i = 0; i < vpages; i += 1) {
      const row = doc.createElement('tr');

      for (let j = 0; j < hpages; j++) {
        const pageNum = i * hpages + j + 1;
        const cell = doc.createElement('td');
        const a = doc.createElement('a');
        a.setAttribute('href', `#mxPage-${pageNum}`);

        // Workaround for FF where the anchor is appended to the URL of the original document
        if (Client.IS_NS && !Client.IS_SF && !Client.IS_GC) {
          const js = `let page = document.getElementById('mxPage-${pageNum}');page.scrollIntoView(true);event.preventDefault();`;
          a.setAttribute('onclick', js);
        }

        write(a, String(pageNum));
        cell.appendChild(a);
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    return table;
  }

  /**
   * Creates a DIV that prints a single page of the given
   * graph using the given scale and returns the DIV that
   * represents the page.
   *
   * @param w Width of the page in pixels.
   * @param h Height of the page in pixels.
   * @param dx Optional horizontal page offset in pixels (used internally).
   * @param dy Optional vertical page offset in pixels (used internally).
   * @param content Callback that adds the HTML content to the inner div of a page.
   * Takes the inner div as the argument.
   * @param pageNumber Integer representing the page number.
   */
  renderPage(
    w: number,
    h: number,
    dx: number,
    dy: number,
    content: (div: HTMLDivElement) => void,
    pageNumber?: number
  ): HTMLDivElement {
    let div: HTMLDivElement | null = document.createElement('div');
    let arg = null;

    try {
      // Workaround for ignored clipping in IE 9 standards
      // when printing with page breaks and HTML labels.
      if (dx !== 0 || dy !== 0) {
        div.style.position = 'relative';
        div.style.width = `${w}px`;
        div.style.height = `${h}px`;
        div.style.pageBreakInside = 'avoid';

        const innerDiv = document.createElement('div');
        innerDiv.style.position = 'relative';
        innerDiv.style.top = `${this.border}px`;
        innerDiv.style.left = `${this.border}px`;
        innerDiv.style.width = `${w - 2 * this.border}px`;
        innerDiv.style.height = `${h - 2 * this.border}px`;
        innerDiv.style.overflow = 'hidden';

        const viewport = document.createElement('div');
        viewport.style.position = 'relative';
        viewport.style.marginLeft = `${dx}px`;
        viewport.style.marginTop = `${dy}px`;

        innerDiv.appendChild(viewport);
        div.appendChild(innerDiv);
        document.body.appendChild(div);
        arg = viewport;
      }
      // FIXME: IE10/11 too many pages
      else {
        div.style.width = `${w}px`;
        div.style.height = `${h}px`;
        div.style.overflow = 'hidden';
        div.style.pageBreakInside = 'avoid';

        const innerDiv = document.createElement('div');
        innerDiv.style.width = `${w - 2 * this.border}px`;
        innerDiv.style.height = `${h - 2 * this.border}px`;
        innerDiv.style.overflow = 'hidden';

        innerDiv.style.top = `${this.border}px`;
        innerDiv.style.left = `${this.border}px`;

        div.appendChild(innerDiv);
        document.body.appendChild(div);
        arg = innerDiv;
      }
    } catch (e) {
      if (div && div.parentNode) {
        div.parentNode.removeChild(div);
      }
      div = null;
      throw e;
    }

    content(arg);
    return div;
  }

  /**
   * Returns the root cell for painting the graph.
   */
  getRoot(): Cell | null {
    let root = this.graph.view.currentRoot;
    if (root == null) {
      root = this.graph.getDataModel().getRoot();
    }
    return root;
  }

  /**
   * Returns true if CSS transforms should be used for scaling content.
   * This returns true if foreignObject is supported and we're not in Safari
   * as it has clipping bugs for transformed CSS content with foreignObjects.
   */
  useCssTransforms() {
    return !Client.NO_FO && !Client.IS_SF;
  }

  /**
   * Adds a graph fragment to the given div.
   *
   * @param dx Horizontal translation for the diagram.
   * @param dy Vertical translation for the diagram.
   * @param scale Scale for the diagram.
   * @param pageNumber Number of the page to be rendered.
   * @param div Div that contains the output.
   * @param clip Contains the clipping rectangle as an {@link Rectangle}.
   */
  addGraphFragment(
    dx: number,
    dy: number,
    scale: number,
    pageNumber: number,
    div: HTMLDivElement,
    clip: Rectangle
  ) {
    const view = this.graph.getView();
    const previousContainer = this.graph.container;
    this.graph.container = div;

    const canvas = view.getCanvas();
    const backgroundPane = view.getBackgroundPane();
    const drawPane = view.getDrawPane();
    const overlayPane = view.getOverlayPane();
    const realScale = scale;

    if (this.graph.dialect === DIALECT.SVG) {
      view.createSvg();

      // Uses CSS transform for scaling
      if (this.useCssTransforms()) {
        const g = <Element>view.getDrawPane().parentNode;
        const prev = g.getAttribute('transform');
        g.setAttribute('transformOrigin', '0 0');
        g.setAttribute(
          'transform',
          `scale(${scale},${scale})` + `translate(${dx},${dy})`
        );

        scale = 1;
        dx = 0;
        dy = 0;
      }
    } else {
      view.createHtml();
    }

    // Disables events on the view
    const eventsEnabled = view.isEventsEnabled();
    view.setEventsEnabled(false);

    // Disables the graph to avoid cursors
    const graphEnabled = this.graph.isEnabled();
    this.graph.setEnabled(false);

    // Resets the translation
    const translate = view.getTranslate();
    view.translate = new Point(dx, dy);

    // Redraws only states that intersect the clip
    const { redraw } = this.graph.cellRenderer;
    const { states } = view;
    const s = view.scale;

    // Gets the transformed clip for intersection check below
    if (this.clipping) {
      const tempClip = new Rectangle(
        (clip.x + translate.x) * s,
        (clip.y + translate.y) * s,
        (clip.width * s) / realScale,
        (clip.height * s) / realScale
      );

      // Checks clipping rectangle for speedup
      // Must create terminal states for edge clipping even if terminal outside of clip
      this.graph.cellRenderer.redraw = (state, force, rendering) => {
        if (state != null) {
          // Gets original state from graph to find bounding box
          const orig = states.get(state.cell);

          if (orig != null) {
            const bbox = view.getBoundingBox(orig, false);

            // Stops rendering if outside clip for speedup but ignores
            // edge labels where width and height is set to 0
            if (
              bbox != null &&
              bbox.width > 0 &&
              bbox.height > 0 &&
              !intersects(tempClip, bbox)
            ) {
              return;
            }
          }
        }

        redraw.apply(this, [state, force, rendering]); // CHECK ME!!!
      };
    }

    let temp = null;

    try {
      // Creates the temporary cell states in the view and
      // draws them onto the temporary DOM nodes in the view
      const cells = [<Cell>this.getRoot()];
      temp = new TemporaryCellStates(view, scale, cells, null, (state: CellState) => {
        return this.getLinkForCellState(state);
      });
    } finally {
      // Removes everything but the SVG node
      let tmp = <HTMLElement>div.firstChild;

      while (tmp != null) {
        const next = <HTMLElement>tmp.nextSibling;
        const name = tmp.nodeName.toLowerCase();

        // Note: Width and height are required in FF 11
        if (name === 'svg') {
          tmp.style.overflow = 'hidden';
          tmp.style.position = 'relative';
          tmp.style.top = `${this.marginTop}px`;
          tmp.setAttribute('width', String(clip.width));
          tmp.setAttribute('height', String(clip.height));
          tmp.style.width = '';
          tmp.style.height = '';
        }
        // Tries to fetch all text labels and only text labels
        else if (tmp.style.cursor !== 'default' && name !== 'div') {
          (<Element>tmp.parentNode).removeChild(tmp);
        }

        tmp = next;
      }

      // Puts background image behind SVG output
      if (this.printBackgroundImage) {
        const svgs = div.getElementsByTagName('svg');

        if (svgs.length > 0) {
          svgs[0].style.position = 'absolute';
        }
      }

      // Completely removes the overlay pane to remove more handles
      (<Element>view.overlayPane.parentNode).removeChild(view.overlayPane);

      // Restores the state of the view
      this.graph.setEnabled(graphEnabled);
      this.graph.container = previousContainer;
      this.graph.cellRenderer.redraw = redraw;
      view.canvas = canvas;
      view.backgroundPane = backgroundPane;
      view.drawPane = drawPane;
      view.overlayPane = overlayPane;
      view.translate = translate;
      if (temp) {
        temp.destroy();
      }
      view.setEventsEnabled(eventsEnabled);
    }
  }

  /**
   * Returns the link for the given cell state. This returns null.
   */
  getLinkForCellState(state: CellState): string | null {
    return this.graph.getLinkForCell(state.cell);
  }

  /**
   * Inserts the background image into the given div.
   */
  insertBackgroundImage(div: HTMLDivElement, dx: number, dy: number): void {
    const bg = this.graph.backgroundImage;

    if (bg != null) {
      const img = document.createElement('img');
      img.style.position = 'absolute';
      img.style.marginLeft = `${Math.round(dx * this.scale)}px`;
      img.style.marginTop = `${Math.round(dy * this.scale)}px`;
      img.setAttribute('width', String(Math.round(this.scale * bg.width)));
      img.setAttribute('height', String(Math.round(this.scale * bg.height)));
      img.src = bg.src;

      div.insertBefore(img, div.firstChild);
    }
  }

  /**
   * Returns the pages to be added before the print output. This returns null.
   */
  getCoverPages(width: number, height: number): any {
    return null;
  }

  /**
   * Returns the pages to be added after the print output. This returns null.
   */
  getAppendices(width: number, height: number): any {
    return null;
  }

  /**
   * Opens the print preview and shows the print dialog.
   *
   * @param css Optional CSS string to be used in the head section.
   */
  print(css?: string): void {
    const wnd = this.open(css);

    if (wnd != null) {
      wnd.print();
    }
  }

  /**
   * Closes the print preview window.
   */
  close(): void {
    if (this.wnd != null) {
      this.wnd.close();
      this.wnd = null;
    }
  }
}

export default PrintPreview;
