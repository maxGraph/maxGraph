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

import InternalMouseEvent from '../event/InternalMouseEvent';
import {
  NONE,
  OUTLINE_COLOR,
  OUTLINE_HANDLE_FILLCOLOR,
  OUTLINE_HANDLE_STROKECOLOR,
  OUTLINE_STROKEWIDTH,
} from '../../util/Constants';
import Point from '../geometry/Point';
import Rectangle from '../geometry/Rectangle';
import RectangleShape from '../geometry/node/RectangleShape';
import { Graph } from '../Graph';
import ImageShape from '../geometry/node/ImageShape';
import InternalEvent from '../event/InternalEvent';
import Image from '../image/ImageBox';
import EventObject from '../event/EventObject';
import { getSource, isMouseEvent } from '../../util/EventUtils';
import EventSource from '../event/EventSource';
import { hasScrollbars } from '../../util/styleUtils';
import type { Listenable, MouseListenerSet } from '../../types';
import { getDefaultPlugins } from '../plugins';

/**
 * Implements an outline (aka overview) for a graph. Set {@link updateOnPan} to true
 * to enable updates while the source graph is panning.
 *
 * ### Example
 *
 * ```javascript
 * var outline = new mxOutline(graph, div);
 * ```
 *
 * If an outline is used in an {@link MaxWindow} in IE8 standards mode, the following
 * code makes sure that the shadow filter is not inherited and that any
 * transparent elements in the graph do not show the page background, but the
 * background of the graph container.
 *
 * ```javascript
 * if (document.documentMode == 8)
 * {
 *   container.style.filter = 'progid:DXImageTransform.Microsoft.alpha(opacity=100)';
 * }
 * ```
 *
 * To move the graph to the top, left corner the following code can be used.
 *
 * ```javascript
 * var scale = graph.view.scale;
 * var bounds = graph.getGraphBounds();
 * graph.view.setTranslate(-bounds.x / scale, -bounds.y / scale);
 * ```
 *
 * To toggle the suspended mode, the following can be used.
 *
 * ```javascript
 * outline.suspended = !outln.suspended;
 * if (!outline.suspended)
 * {
 *   outline.update(true);
 * }
 * ```
 */
class Outline implements MouseListenerSet {
  constructor(source: Graph, container?: HTMLElement | null) {
    this.source = source;

    if (container) {
      this.init(container);
    }
  }

  /**
   * Initializes the outline inside the given container.
   */
  init(container: HTMLElement): void {
    this.outline = this.createGraph(container);

    // Do not repaint when suspended
    const outlineGraphModelChanged = this.outline.graphModelChanged;
    this.outline.graphModelChanged = (changes: any) => {
      if (!this.suspended && this.outline != null) {
        outlineGraphModelChanged.apply(this.outline, [changes]);
      }
    };

    // Enable faster painting in SVG
    //const node = <SVGElement>this.outline.getView().getCanvas().parentNode;
    //node.setAttribute('shape-rendering', 'optimizeSpeed');
    //node.setAttribute('image-rendering', 'optimizeSpeed');

    // Hides cursors and labels
    this.outline.labelsVisible = this.labelsVisible;
    this.outline.setEnabled(false);

    this.updateHandler = (sender: any, evt: EventObject) => {
      if (!this.suspended && !this.active) {
        this.update();
      }
    };

    // Updates the scale of the outline after a change of the main graph
    this.source.getDataModel().addListener(InternalEvent.CHANGE, this.updateHandler);
    this.outline.addMouseListener(this);

    // Adds listeners to keep the outline in sync with the source graph
    const view = this.source.getView();
    view.addListener(InternalEvent.SCALE, this.updateHandler);
    view.addListener(InternalEvent.TRANSLATE, this.updateHandler);
    view.addListener(InternalEvent.SCALE_AND_TRANSLATE, this.updateHandler);
    view.addListener(InternalEvent.DOWN, this.updateHandler);
    view.addListener(InternalEvent.UP, this.updateHandler);

    // Updates blue rectangle on scroll
    // @ts-ignore because sender and evt don't seem used
    InternalEvent.addListener(this.source.container, 'scroll', this.updateHandler);

    this.panHandler = (sender: any, evt: EventObject) => {
      if (this.updateOnPan) {
        (<Function>this.updateHandler)(sender, evt);
      }
    };
    this.source.addListener(InternalEvent.PAN, this.panHandler);

    // Refreshes the graph in the outline after a refresh of the main graph
    this.refreshHandler = (sender: any) => {
      const outline = this.outline;
      outline?.setStylesheet(this.source.getStylesheet());
      outline?.refresh();
    };
    this.source.addListener(InternalEvent.REFRESH, this.refreshHandler);

    // Creates the blue rectangle for the viewport
    this.bounds = new Rectangle(0, 0, 0, 0);
    this.selectionBorder = new RectangleShape(
      this.bounds,
      NONE,
      OUTLINE_COLOR,
      OUTLINE_STROKEWIDTH
    );
    this.selectionBorder.dialect = this.outline.dialect;
    this.selectionBorder.init(this.outline.getView().getOverlayPane());
    const selectionBorderNode = <SVGGElement>this.selectionBorder.node;

    // Handles event by catching the initial pointer start and then listening to the
    // complete gesture on the event target. This is needed because all the events
    // are routed via the initial element even if that element is removed from the
    // DOM, which happens when we repaint the selection border and zoom handles.
    const handler = (evt: MouseEvent) => {
      const t = getSource(evt);

      const redirect = (evt: MouseEvent) => {
        const outline = this.outline;
        outline?.fireMouseEvent(InternalEvent.MOUSE_MOVE, new InternalMouseEvent(evt));
      };

      const redirect2 = (evt: MouseEvent) => {
        const outline = this.outline;
        InternalEvent.removeGestureListeners(<Listenable>t, null, redirect, redirect2);
        outline?.fireMouseEvent(InternalEvent.MOUSE_UP, new InternalMouseEvent(evt));
      };

      const outline = this.outline;
      InternalEvent.addGestureListeners(<Listenable>t, null, redirect, redirect2);
      outline?.fireMouseEvent(InternalEvent.MOUSE_DOWN, new InternalMouseEvent(evt));
    };

    InternalEvent.addGestureListeners(this.selectionBorder.node, handler);

    // Creates a small blue rectangle for sizing (sizer handle)
    const sizer = (this.sizer = this.createSizer());
    const sizerNode = <SVGGElement>sizer.node;

    sizer.init(this.outline.getView().getOverlayPane());

    if (this.enabled) {
      sizerNode.style.cursor = 'nwse-resize';
    }

    InternalEvent.addGestureListeners(this.sizer.node, handler);

    selectionBorderNode.style.display = this.showViewport ? '' : 'none';
    sizerNode.style.display = selectionBorderNode.style.display;
    selectionBorderNode.style.cursor = 'move';

    this.update(false);
  }

  // TODO: Document me!!
  sizer: RectangleShape | null = null;

  selectionBorder: RectangleShape | null = null;

  updateHandler: ((sender: any, evt: EventObject) => void) | null = null;

  refreshHandler: ((sender: any, evt: EventObject) => void) | null = null;

  panHandler: ((sender: any, evt: EventObject) => void) | null = null;

  active: boolean | null = null;

  bounds: Rectangle | null = null;

  zoom = false;

  startX: number | null = null;

  startY: number | null = null;

  dx0: number | null = null;

  dy0: number | null = null;

  index: number | null = null;

  /**
   * Reference to the source {@link graph}.
   */
  source: Graph;

  /**
   * Reference to the {@link graph} that renders the outline.
   */
  outline: Graph | null = null;

  /**
   * Renderhint to be used for the outline graph.
   * @default faster
   */
  graphRenderHint = 'exact';

  /**
   * Specifies if events are handled.
   * @default true
   */
  enabled = true;

  /**
   * Specifies a viewport rectangle should be shown.
   * @default true
   */
  showViewport = true;

  /**
   * Border to be added at the bottom and right.
   * @default 10
   */
  border = 10;

  /**
   * Specifies the size of the sizer handler.
   * @default 8
   */
  sizerSize = 8;

  /**
   * Specifies if labels should be visible in the outline.
   * @default false
   */
  labelsVisible = false;

  /**
   * Specifies if {@link update} should be called for {@link InternalEvent.PAN} in the source
   * graph.
   * @default false
   */
  updateOnPan = false;

  /**
   * Optional {@link Image} to be used for the sizer.
   * @default null
   */
  sizerImage: Image | null = null;

  /**
   * Minimum scale to be used.
   * @default 0.0001
   */
  minScale = 0.0001;

  /**
   * Optional boolean flag to suspend updates. This flag will
   * also suspend repaints of the outline. To toggle this switch, use the
   * following code.
   *
   * @default false
   *
   * @example
   * ```javascript
   * nav.suspended = !nav.suspended;
   *
   * if (!nav.suspended)
   * {
   *   nav.update(true);
   * }
   * ```
   */
  suspended = false;

  /**
   * Creates the {@link graph} used in the outline.
   */
  createGraph(container: HTMLElement): Graph {
    const graph = new Graph(
      container,
      this.source.getDataModel(),
      // TODO review the list of plugins for the Graph of an Outline
      // we could pass an empty array or a selection of plugins
      // it may be necessary to make the plugins array configurable to allow custom plugins and improve tree-shaking
      getDefaultPlugins(),
      this.source.getStylesheet()
    );
    graph.options.foldingEnabled = false;
    graph.autoScroll = false;
    return graph;
  }

  /**
   * Returns true if events are handled. This implementation
   * returns {@link enabled}.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enables or disables event handling. This implementation
   * updates {@link enabled}.
   *
   * @param value Boolean that specifies the new enabled state.
   */
  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  /**
   * Enables or disables the zoom handling by showing or hiding the respective
   * handle.
   *
   * @param value Boolean that specifies the new enabled state.
   */
  setZoomEnabled(value: boolean): void {
    // @ts-ignore
    this.sizer.node.style.visibility = value ? 'visible' : 'hidden';
  }

  /**
   * Invokes {@link update} and revalidate the outline. This method is deprecated.
   */
  refresh(): void {
    this.update(true);
  }

  /**
   * Creates the shape used as the sizer.
   */
  // createSizer(): mxShape;
  createSizer(): RectangleShape {
    const outline = this.outline;
    if (this.sizerImage != null) {
      const sizer = new ImageShape(
        new Rectangle(0, 0, this.sizerImage.width, this.sizerImage.height),
        this.sizerImage.src
      );
      outline && (sizer.dialect = outline.dialect);
      return sizer;
    }

    const sizer = new RectangleShape(
      new Rectangle(0, 0, this.sizerSize, this.sizerSize),
      OUTLINE_HANDLE_FILLCOLOR,
      OUTLINE_HANDLE_STROKECOLOR
    );
    outline && (sizer.dialect = outline.dialect);
    return sizer;
  }

  /**
   * Returns the size of the source container.
   */
  getSourceContainerSize(): Rectangle {
    return new Rectangle(
      0,
      0,
      (<HTMLElement>this.source.container).scrollWidth,
      (<HTMLElement>this.source.container).scrollHeight
    );
  }

  /**
   * Returns the offset for drawing the outline graph.
   */
  getOutlineOffset(scale?: number): Point | null {
    // TODO: Should number -> mxPoint?
    return null;
  }

  /**
   * Returns the offset for drawing the outline graph.
   */
  getSourceGraphBounds(): Rectangle {
    return this.source.getGraphBounds();
  }

  /**
   * Updates the outline.
   */
  update(revalidate = false): void {
    if (
      this.source != null &&
      this.source.container != null &&
      this.outline != null &&
      this.outline.container != null
    ) {
      const sourceScale = this.source.view.scale;
      const scaledGraphBounds = this.getSourceGraphBounds();
      const unscaledGraphBounds = new Rectangle(
        scaledGraphBounds.x / sourceScale + this.source.panDx,
        scaledGraphBounds.y / sourceScale + this.source.panDy,
        scaledGraphBounds.width / sourceScale,
        scaledGraphBounds.height / sourceScale
      );

      const unscaledFinderBounds = new Rectangle(
        0,
        0,
        this.source.container.clientWidth / sourceScale,
        this.source.container.clientHeight / sourceScale
      );

      const union = unscaledGraphBounds.clone();
      union.add(unscaledFinderBounds);

      // Zooms to the scrollable area if that is bigger than the graph
      const size = this.getSourceContainerSize();
      const completeWidth = Math.max(size.width / sourceScale, union.width);
      const completeHeight = Math.max(size.height / sourceScale, union.height);

      const availableWidth = Math.max(
        0,
        this.outline.container.clientWidth - this.border
      );
      const availableHeight = Math.max(
        0,
        this.outline.container.clientHeight - this.border
      );

      const outlineScale = Math.min(
        availableWidth / completeWidth,
        availableHeight / completeHeight
      );
      let scale = Number.isNaN(outlineScale)
        ? this.minScale
        : Math.max(this.minScale, outlineScale);

      if (scale > 0) {
        if (this.outline.getView().scale !== scale) {
          this.outline.getView().scale = scale;
          revalidate = true;
        }

        const navView = this.outline.getView();

        if (navView.currentRoot !== this.source.getView().currentRoot) {
          navView.setCurrentRoot(this.source.getView().currentRoot);
        }

        const t = this.source.view.translate;
        let tx = t.x + this.source.panDx;
        let ty = t.y + this.source.panDy;

        const off = this.getOutlineOffset(scale);

        if (off != null) {
          tx += off.x;
          ty += off.y;
        }

        if (unscaledGraphBounds.x < 0) {
          tx -= unscaledGraphBounds.x;
        }
        if (unscaledGraphBounds.y < 0) {
          ty -= unscaledGraphBounds.y;
        }

        if (navView.translate.x !== tx || navView.translate.y !== ty) {
          navView.translate.x = tx;
          navView.translate.y = ty;
          revalidate = true;
        }

        // Prepares local variables for computations
        const t2 = navView.translate;
        scale = this.source.getView().scale;
        const scale2 = scale / navView.scale;
        const scale3 = 1.0 / navView.scale;
        const { container } = this.source;

        // Updates the bounds of the viewrect in the navigation
        this.bounds = new Rectangle(
          (t2.x - t.x - this.source.panDx) / scale3,
          (t2.y - t.y - this.source.panDy) / scale3,
          container.clientWidth / scale2,
          container.clientHeight / scale2
        );

        // Adds the scrollbar offset to the finder
        this.bounds.x += (this.source.container.scrollLeft * navView.scale) / scale;
        this.bounds.y += (this.source.container.scrollTop * navView.scale) / scale;

        const selectionBorder = <RectangleShape>this.selectionBorder;
        let b = <Rectangle>selectionBorder.bounds;

        if (
          b.x !== this.bounds.x ||
          b.y !== this.bounds.y ||
          b.width !== this.bounds.width ||
          b.height !== this.bounds.height
        ) {
          selectionBorder.bounds = this.bounds;
          selectionBorder.redraw();
        }

        // Updates the bounds of the zoom handle at the bottom right
        const sizer = <RectangleShape>this.sizer;
        b = <Rectangle>sizer.bounds;
        const b2 = new Rectangle(
          this.bounds.x + this.bounds.width - b.width / 2,
          this.bounds.y + this.bounds.height - b.height / 2,
          b.width,
          b.height
        );

        if (
          b.x !== b2.x ||
          b.y !== b2.y ||
          b.width !== b2.width ||
          b.height !== b2.height
        ) {
          sizer.bounds = b2;

          // Avoids update of visibility in redraw for VML
          if ((<SVGGElement>sizer.node).style.visibility !== 'hidden') {
            sizer.redraw();
          }
        }

        if (revalidate) {
          this.outline.view.revalidate();
        }
      }
    }
  }

  /**
   * Handles the event by starting a translation or zoom.
   */
  mouseDown(_sender: EventSource, me: InternalMouseEvent): void {
    if (this.enabled && this.showViewport) {
      const tol = !isMouseEvent(me.getEvent()) ? this.source.tolerance : 0;
      const hit =
        tol > 0
          ? new Rectangle(me.getGraphX() - tol, me.getGraphY() - tol, 2 * tol, 2 * tol)
          : null;
      this.zoom =
        me.isSource(this.sizer) ||
        // @ts-ignore
        (hit != null && intersects(this.sizer.bounds, hit));
      this.startX = me.getX();
      this.startY = me.getY();
      this.active = true;
      const sourceContainer = <HTMLElement>this.source.container;

      if (this.source.useScrollbarsForPanning && hasScrollbars(this.source.container)) {
        this.dx0 = sourceContainer.scrollLeft;
        this.dy0 = sourceContainer.scrollTop;
      } else {
        this.dx0 = 0;
        this.dy0 = 0;
      }
    }

    me.consume();
  }

  /**
   * Handles the event by previewing the viewrect in {@link graph} and updating the
   * rectangle that represents the viewrect in the outline.
   */
  mouseMove(_sender: EventSource, me: InternalMouseEvent): void {
    if (this.active) {
      const myBounds = <Rectangle>this.bounds;
      const sizer = <RectangleShape>this.sizer;
      const sizerNode = <SVGGElement>sizer.node;
      const selectionBorder = <RectangleShape>this.selectionBorder;
      const selectionBorderNode = <SVGGElement>selectionBorder.node;
      const source = this.source;
      const outline = this.outline;

      selectionBorderNode.style.display = this.showViewport ? '' : 'none';
      sizerNode.style.display = selectionBorderNode.style.display;

      const delta = this.getTranslateForEvent(me);
      let dx = delta.x;
      let dy = delta.y;
      let bounds = null;

      if (outline && !this.zoom) {
        // Previews the panning on the source graph
        const { scale } = outline.getView();
        bounds = new Rectangle(
          myBounds.x + dx,
          myBounds.y + dy,
          myBounds.width,
          myBounds.height
        );
        selectionBorder.bounds = bounds;
        selectionBorder.redraw();
        dx /= scale;
        dx *= source.getView().scale;
        dy /= scale;
        dy *= source.getView().scale;
        source.panGraph(-dx - <number>this.dx0, -dy - <number>this.dy0);
      } else {
        // Does *not* preview zooming on the source graph
        const { container } = this.source;
        // @ts-ignore
        const viewRatio = container.clientWidth / container.clientHeight;
        dy = dx / viewRatio;
        bounds = new Rectangle(
          myBounds.x,
          myBounds.y,
          Math.max(1, myBounds.width + dx),
          Math.max(1, myBounds.height + dy)
        );
        selectionBorder.bounds = bounds;
        selectionBorder.redraw();
      }

      // Updates the zoom handle
      const b = <Rectangle>sizer.bounds;
      sizer.bounds = new Rectangle(
        bounds.x + bounds.width - b.width / 2,
        bounds.y + bounds.height - b.height / 2,
        b.width,
        b.height
      );

      // Avoids update of visibility in redraw for VML
      if (sizerNode.style.visibility !== 'hidden') {
        sizer.redraw();
      }
      me.consume();
    }
  }

  /**
   * Gets the translate for the given mouse event. Here is an example to limit
   * the outline to stay within positive coordinates:
   *
   * @example
   * ```javascript
   * outline.getTranslateForEvent(me)
   * {
   *   var pt = new mxPoint(me.getX() - this.startX, me.getY() - this.startY);
   *
   *   if (!this.zoom)
   *   {
   *     var tr = this.source.view.translate;
   *     pt.x = Math.max(tr.x * this.outline.view.scale, pt.x);
   *     pt.y = Math.max(tr.y * this.outline.view.scale, pt.y);
   *   }
   *
   *   return pt;
   * };
   * ```
   */
  getTranslateForEvent(me: InternalMouseEvent): Point {
    return new Point(me.getX() - <number>this.startX, me.getY() - <number>this.startY);
  }

  /**
   * Handles the event by applying the translation or zoom to {@link graph}.
   */
  mouseUp(_sender: EventSource, me: InternalMouseEvent): void {
    if (this.active) {
      const delta = this.getTranslateForEvent(me);
      let dx = delta.x;
      let dy = delta.y;
      const source = this.source;
      const outline = this.outline;
      const selectionBorder = <RectangleShape>this.selectionBorder;

      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        if (!this.zoom) {
          // Applies the new translation if the source
          // has no scrollbars
          if (
            outline &&
            (!source.useScrollbarsForPanning || !hasScrollbars(source.container))
          ) {
            source.panGraph(0, 0);
            dx /= outline.getView().scale;
            dy /= outline.getView().scale;
            const t = source.getView().translate;
            source.getView().setTranslate(t.x - dx, t.y - dy);
          }
        } else {
          // Applies the new zoom
          const w = (<Rectangle>selectionBorder.bounds).width;
          const { scale } = source.getView();
          source.zoomTo(Math.max(this.minScale, scale - (dx * scale) / w), false);
        }

        this.update();
        me.consume();
      }

      // Resets the state of the handler
      this.index = null;
      this.active = false;
    }
  }

  /**
   * Destroy this outline and removes all listeners from {@link source}.
   */
  destroy(): void {
    if (this.source != null) {
      // @ts-ignore
      this.source.removeListener(this.panHandler);
      // @ts-ignore
      this.source.removeListener(this.refreshHandler);
      // @ts-ignore
      this.source.getDataModel().removeListener(this.updateHandler);
      // @ts-ignore
      this.source.getView().removeListener(this.updateHandler);
      // @ts-ignore
      InternalEvent.removeListener(this.source.container, 'scroll', this.updateHandler);
      // @ts-ignore
      this.source = null;
    }

    if (this.outline != null) {
      this.outline.removeMouseListener(this);
      this.outline.destroy();
      this.outline = null;
    }

    if (this.selectionBorder != null) {
      this.selectionBorder.destroy();
      this.selectionBorder = null;
    }

    if (this.sizer != null) {
      this.sizer.destroy();
      this.sizer = null;
    }
  }
}

export default Outline;
