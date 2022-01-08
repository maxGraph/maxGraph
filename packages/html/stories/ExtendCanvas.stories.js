import {
  Graph,
  InternalEvent,
  RubberBandHandler,
  Rectangle,
  Point,
  styleUtils,
} from '@maxgraph/core';

import { globalTypes } from '../.storybook/preview';

export default {
  title: 'Backgrounds/ExtendCanvas',
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
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.overflow = 'auto';
  container.style.width = `${args.width}px`;
  container.style.height = `${args.height}px`;
  container.style.cursor = 'default';
  container.style.background = 'url(/images/grid.gif)';

  if (!args.contextMenu) InternalEvent.disableContextMenu(container);

  /**
   * Specifies the size of the size for "tiles" to be used for a graph with
   * scrollbars but no visible background page. A good value is large
   * enough to reduce the number of repaints that is caused for auto-
   * translation, which depends on this value, and small enough to give
   * a small empty buffer around the graph. Default is 400x400.
   */
  const scrollTileSize = new Rectangle(0, 0, 400, 400);

  class MyCustomGraph extends Graph {
    /**
     * Returns the padding for pages in page view with scrollbars.
     */
    getPagePadding() {
      return new Point(
        Math.max(0, Math.round(this.container.offsetWidth - 34)),
        Math.max(0, Math.round(this.container.offsetHeight - 34))
      );
    }

    /**
     * Returns the size of the page format scaled with the page size.
     */
    getPageSize() {
      return this.pageVisible
        ? new Rectangle(
            0,
            0,
            this.pageFormat.width * this.pageScale,
            this.pageFormat.height * this.pageScale
          )
        : scrollTileSize;
    }

    /**
     * Returns a rectangle describing the position and count of the
     * background pages, where x and y are the position of the top,
     * left page and width and height are the vertical and horizontal
     * page count.
     */
    getPageLayout() {
      const size = this.pageVisible ? this.getPageSize() : scrollTileSize;
      const bounds = this.getGraphBounds();

      if (bounds.width === 0 || bounds.height === 0) {
        return new Rectangle(0, 0, 1, 1);
      }

      // Computes untransformed graph bounds
      const x = Math.ceil(bounds.x / this.view.scale - this.view.translate.x);
      const y = Math.ceil(bounds.y / this.view.scale - this.view.translate.y);
      const w = Math.floor(bounds.width / this.view.scale);
      const h = Math.floor(bounds.height / this.view.scale);

      const x0 = Math.floor(x / size.width);
      const y0 = Math.floor(y / size.height);
      const w0 = Math.ceil((x + w) / size.width) - x0;
      const h0 = Math.ceil((y + h) / size.height) - y0;

      return new Rectangle(x0, y0, w0, h0);
    }

    getPreferredPageSize(bounds, width, height) {
      const pages = this.getPageLayout();
      const size = this.getPageSize();

      return new Rectangle(0, 0, pages.width * size.width, pages.height * size.height);
    }

    sizeDidChange() {
      if (this.container != null && styleUtils.hasScrollbars(this.container)) {
        const pages = this.getPageLayout();
        const pad = this.getPagePadding();
        const size = this.getPageSize();

        // Updates the minimum graph size
        const minw = Math.ceil((2 * pad.x) / this.view.scale + pages.width * size.width);
        const minh = Math.ceil(
          (2 * pad.y) / this.view.scale + pages.height * size.height
        );

        const min = this.minimumGraphSize;

        // LATER: Fix flicker of scrollbar size in IE quirks mode
        // after delayed call in window.resize event handler
        if (min == null || min.width !== minw || min.height !== minh) {
          this.minimumGraphSize = new Rectangle(0, 0, minw, minh);
        }

        // Updates auto-translate to include padding and graph size
        const dx = pad.x / this.view.scale - pages.x * size.width;
        const dy = pad.y / this.view.scale - pages.y * size.height;

        if (
          !this.autoTranslate &&
          (this.view.translate.x !== dx || this.view.translate.y !== dy)
        ) {
          this.autoTranslate = true;
          this.view.x0 = pages.x;
          this.view.y0 = pages.y;

          // NOTE: THIS INVOKES THIS METHOD AGAIN. UNFORTUNATELY THERE IS NO WAY AROUND THIS SINCE THE
          // BOUNDS ARE KNOWN AFTER THE VALIDATION AND SETTING THE TRANSLATE TRIGGERS A REVALIDATION.
          // SHOULD MOVE TRANSLATE/SCALE TO VIEW.
          const tx = this.view.translate.x;
          const ty = this.view.translate.y;

          this.view.setTranslate(dx, dy);
          this.container.scrollLeft += (dx - tx) * this.view.scale;
          this.container.scrollTop += (dy - ty) * this.view.scale;

          this.autoTranslate = false;
          return;
        }
        super.sizeDidChange();
      }
    }
  }

  // Creates the graph inside the given container
  const graph = new MyCustomGraph(container);
  const panningHandler = graph.getPlugin('PanningHandler');
  panningHandler.ignoreCell = true;
  graph.setPanning(true);

  // Fits the number of background pages to the graph
  graph.view.getBackgroundPageBounds = function () {
    const layout = this.graph.getPageLayout();
    const page = this.graph.getPageSize();

    return new Rectangle(
      this.scale * (this.translate.x + layout.x * page.width),
      this.scale * (this.translate.y + layout.y * page.height),
      this.scale * layout.width * page.width,
      this.scale * layout.height * page.height
    );
  };

  /**
   * Guesses autoTranslate to avoid another repaint (see below).
   * Works if only the scale of the graph changes or if pages
   * are visible and the visible pages do not change.
   */
  const graphViewValidate = graph.view.validate;
  graph.view.validate = function () {
    if (this.graph.container != null && styleUtils.hasScrollbars(this.graph.container)) {
      const pad = this.graph.getPagePadding();
      const size = this.graph.getPageSize();

      // Updating scrollbars here causes flickering in quirks and is not needed
      // if zoom method is always used to set the current scale on the graph.
      const tx = this.translate.x;
      const ty = this.translate.y;
      this.translate.x = pad.x / this.scale - (this.x0 || 0) * size.width;
      this.translate.y = pad.y / this.scale - (this.y0 || 0) * size.height;
    }

    graphViewValidate.apply(this, arguments);
  };

  // Enables rubberband selection
  if (args.rubberBand) new RubberBandHandler(graph);

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = graph.getDefaultParent();

  // Adds cells to the model in a single step
  graph.batchUpdate(() => {
    const v1 = graph.insertVertex({
      parent,
      value: 'Hello,',
      position: [20, 20],
      size: [80, 30],
    });
    const v2 = graph.insertVertex({
      parent,
      value: 'World!',
      position: [200, 150],
      size: [80, 30],
    });
    const e1 = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
    });
  });

  // Sets initial scrollbar positions
  window.setTimeout(() => {
    const bounds = graph.getGraphBounds();
    const width = Math.max(bounds.width, scrollTileSize.width * graph.view.scale);
    const height = Math.max(bounds.height, scrollTileSize.height * graph.view.scale);
    graph.container.scrollTop = Math.floor(
      Math.max(0, bounds.y - Math.max(20, (graph.container.clientHeight - height) / 4))
    );
    graph.container.scrollLeft = Math.floor(
      Math.max(0, bounds.x - Math.max(0, (graph.container.clientWidth - width) / 2))
    );
  }, 0);

  return container;
};

export const Default = Template.bind({});
