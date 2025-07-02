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

import Image from './image/ImageBox.js';
import EventObject from './event/EventObject.js';
import EventSource from './event/EventSource.js';
import InternalEvent from './event/InternalEvent.js';
import Rectangle from './geometry/Rectangle.js';
import Client from '../Client.js';
import type PanningHandler from './plugins/PanningHandler.js';
import GraphView from './GraphView.js';
import CellRenderer from './cell/CellRenderer.js';
import Point from './geometry/Point.js';
import { getCurrentStyle, hasScrollbars, parseCssNumber } from '../util/styleUtils.js';
import Cell from './cell/Cell.js';
import GraphDataModel from './GraphDataModel.js';
import { Stylesheet } from './style/Stylesheet.js';
import { PAGE_FORMAT_A4_PORTRAIT } from '../util/Constants.js';
import ChildChange from './undoable_changes/ChildChange.js';
import GeometryChange from './undoable_changes/GeometryChange.js';
import RootChange from './undoable_changes/RootChange.js';
import StyleChange from './undoable_changes/StyleChange.js';
import TerminalChange from './undoable_changes/TerminalChange.js';
import ValueChange from './undoable_changes/ValueChange.js';
import CellState from './cell/CellState.js';
import { isNode } from '../util/domUtils.js';
import { EdgeStyle } from './style/builtin-style-elements.js';
import { EdgeStyleRegistry } from './style/edge/EdgeStyleRegistry.js';
import EdgeHandler from './handler/EdgeHandler.js';
import VertexHandler from './handler/VertexHandler.js';
import EdgeSegmentHandler from './handler/EdgeSegmentHandler.js';
import ElbowEdgeHandler from './handler/ElbowEdgeHandler.js';
import type {
  DialectValue,
  EdgeStyleFunction,
  GraphCollaboratorsOptions,
  GraphFoldingOptions,
  GraphOptions,
  GraphPlugin,
  MouseListenerSet,
  PluginId,
} from '../types.js';
import Multiplicity from './other/Multiplicity.js';
import ImageBundle from './image/ImageBundle.js';
import { applyGraphMixins } from './mixins/_graph-mixins-apply.js';
import { isNullish } from '../internal/utils.js';
import { isI18nEnabled } from '../internal/i18n-utils.js';

/**
 * Extends {@link EventSource} to implement a graph component for the browser. This is the entry point class of the package.
 *
 * To activate panning and connections use {@link setPanning} and {@link setConnectable}.
 * For rubberband selection you must create a new instance of {@link rubberband}.
 *
 * The following listeners are added to {@link mouseListeners} by default:
 *
 * - tooltipHandler: {@link TooltipHandler} that displays tooltips
 * - panningHandler: {@link PanningHandler} for panning and popup menus
 * - connectionHandler: {@link ConnectionHandler} for creating connections
 * - selectionHandler: {@link SelectionHandler} for moving and cloning cells
 *
 * These listeners will be called in the above order if they are enabled.
 *
 * @category Graph
 */
export abstract class AbstractGraph extends EventSource {
  container: HTMLElement;

  destroyed = false;

  graphModelChangeListener: Function | null = null;
  paintBackground: Function | null = null;
  isConstrainedMoving = false;

  // ===================================================================================================================
  // Group: Variables (that maybe should be in the mixins, but need to be created for each new class instance)
  // ===================================================================================================================

  cells: Cell[] = [];

  imageBundles: ImageBundle[] = [];

  /**
   * Holds the mouse event listeners. See {@link fireMouseEvent}.
   */
  mouseListeners: MouseListenerSet[] = [];

  /**
   * An array of {@link Multiplicity} describing the allowed connections in a graph.
   */
  multiplicities: Multiplicity[] = [];

  /**
   * Holds the {@link GraphDataModel} that contains the cells to be displayed.
   */
  model!: GraphDataModel; // initialized in "initializeCollaborators"

  private plugins = new Map<string, GraphPlugin>();

  /**
   * Holds the {@link GraphView} that caches the {@link CellState}s for the cells.
   */
  view!: GraphView; // initialized in "initializeCollaborators"

  /**
   * Holds the {@link Stylesheet} that defines the appearance of the cells.
   *
   * Use the following code to read a stylesheet into an existing graph.
   *
   * @example
   * ```javascript
   * var req = mxUtils.load('stylesheet.xml');
   * var root = req.getDocumentElement();
   * var dec = new Codec(root.ownerDocument);
   * dec.decode(root, graph.stylesheet);
   * ```
   */
  stylesheet!: Stylesheet; // initialized in "initializeCollaborators"

  /**
   * Holds the {@link CellRenderer} for rendering the cells in the graph.
   */
  cellRenderer!: CellRenderer; // initialized in "initializeCollaborators"

  /**
   * RenderHint as it was passed to the constructor.
   */
  renderHint: string | null = null;

  /**
   * Dialect to be used for drawing the graph.
   */
  dialect: DialectValue = 'svg';

  /**
   * Value returned by {@link getOverlap} if {@link isAllowOverlapParent} returns
   * `true` for the given cell. {@link getOverlap} is used in {@link constrainChild} if
   * {@link isConstrainChild} returns `true`. The value specifies the
   * portion of the child which is allowed to overlap the parent.
   */
  defaultOverlap = 0.5;

  /**
   * Specifies the default parent to be used to insert new cells.
   * This is used in {@link getDefaultParent}.
   * @default null
   */
  defaultParent: Cell | null = null;

  /**
   * Specifies the {@link Image} to be returned by {@link getBackgroundImage}.
   * @default null
   *
   * @example
   * ```javascript
   * var img = new mxImage('http://www.example.com/maps/examplemap.jpg', 1024, 768);
   * graph.setBackgroundImage(img);
   * graph.view.validate();
   * ```
   */
  backgroundImage: Image | null = null;

  /**
   * Specifies if the background page should be visible.
   * Not yet implemented.
   * @default false
   */
  pageVisible = false;

  /**
   * Specifies if a dashed line should be drawn between multiple pages.
   * If you change this value while a graph is being displayed then you
   * should call {@link sizeDidChange} to force an update of the display.
   * @default false
   */
  pageBreaksVisible = false;

  /**
   * Specifies the color for page breaks.
   * @default gray
   */
  pageBreakColor = 'gray';

  /**
   * Specifies the page breaks should be dashed.
   * @default true
   */
  pageBreakDashed = true;

  /**
   * Specifies the minimum distance in pixels for page breaks to be visible.
   * @default 20
   */
  minPageBreakDist = 20;

  /**
   * Specifies if the graph size should be rounded to the next page number in
   * {@link sizeDidChange}. This is only used if the graph container has scrollbars.
   * @default false
   */
  preferPageSize = false;

  /**
   * Specifies the page format for the background page.
   * This is used as the default in {@link PrintPreview} and for painting the background page
   * if {@link pageVisible} is `true` and the page breaks if {@link pageBreaksVisible} is `true`.
   * @default {@link PAGE_FORMAT_A4_PORTRAIT}
   */
  pageFormat = new Rectangle(...PAGE_FORMAT_A4_PORTRAIT);

  /**
   * Specifies the scale of the background page.
   * Not yet implemented.
   * @default 1.5
   */
  pageScale = 1.5;

  /**
   * Specifies the return value for {@link isEnabled}.
   * @default true
   */
  enabled = true;

  /**
   * Specifies the return value for {@link canExportCell}.
   * @default true
   */
  exportEnabled = true;

  /**
   * Specifies the return value for {@link canImportCell}.
   * @default true
   */
  importEnabled = true;

  /**
   * Specifies if the graph should automatically scroll regardless of the
   * scrollbars. This will scroll the container using positive values for
   * scroll positions (ie usually only rightwards and downwards). To avoid
   * possible conflicts with panning, set {@link translateToScrollPosition} to `true`.
   */
  ignoreScrollbars = false;

  /**
   * Specifies if the graph should automatically convert the current scroll
   * position to a translate in the graph view when a mouseUp event is received.
   * This can be used to avoid conflicts when using {@link autoScroll} and
   * {@link ignoreScrollbars} with no scrollbars in the container.
   */
  translateToScrollPosition = false;

  /**
   * {@link Rectangle} that specifies the area in which all cells in the diagram
   * should be placed. Uses in {@link getMaximumGraphBounds}. Use a width or height of
   * `0` if you only want to give a upper, left corner.
   */
  maximumGraphBounds: Rectangle | null = null;

  /**
   * {@link Rectangle} that specifies the minimum size of the graph. This is ignored
   * if the graph container has no scrollbars.
   * @default null
   */
  minimumGraphSize: Rectangle | null = null;

  /**
   * {@link Rectangle} that specifies the minimum size of the {@link container} if
   * {@link resizeContainer} is `true`.
   */
  minimumContainerSize: Rectangle | null = null;

  /**
   * {@link Rectangle} that specifies the maximum size of the container if
   * {@link resizeContainer} is `true`.
   */
  maximumContainerSize: Rectangle | null = null;

  /**
   * Specifies if the container should be resized to the graph size when
   * the graph size has changed.
   * @default false
   */
  resizeContainer = false;

  /**
   * Border to be added to the bottom and right side when the container is
   * being resized after the graph has been changed.
   * @default 0
   */
  border = 0;

  /**
   * Specifies if edges should appear in the foreground regardless of their order
   * in the model. If {@link keepEdgesInForeground} and {@link keepEdgesInBackground} are
   * both `true` then the normal order is applied.
   * @default false
   */
  keepEdgesInForeground = false;

  /**
   * Specifies if edges should appear in the background regardless of their order
   * in the model. If {@link keepEdgesInForeground} and {@link keepEdgesInBackground} are
   * both `true` then the normal order is applied.
   * @default false
   */
  keepEdgesInBackground = false;

  /**
   * Specifies the return value for {@link isRecursiveResize}.
   * @default false (for backwards compatibility)
   */
  recursiveResize = false;

  /**
   * Specifies if the scale and translate should be reset if the root changes in
   * the model.
   * @default true
   */
  resetViewOnRootChange = true;

  /**
   * Specifies if loops (aka self-references) are allowed.
   * @default false
   */
  allowLoops = false;

  /**
   * {@link EdgeStyle} to be used for loops.
   *
   * This is a fallback for loops if the {@link CellStateStyle.loopStyle} is `undefined`.
   * @default {@link EdgeStyle.Loop}
   */
  defaultLoopStyle = EdgeStyle.Loop;

  /**
   * Specifies if multiple edges in the same direction between the same pair of
   * vertices are allowed.
   * @default true
   */
  multigraph = true;

  /**
   * Specifies the {@link Image} for the image to be used to display a warning
   * overlay. See {@link setCellWarning}. Default value is Client.imageBasePath +
   * '/warning'.  The extension for the image depends on the platform. It is
   * '.png' on the Mac and '.gif' on all other platforms.
   */
  warningImage: Image = new Image(
    `${Client.imageBasePath}/warning${Client.IS_MAC ? '.png' : '.gif'}`,
    16,
    16
  );

  /**
   * Specifies the resource key for the error message to be displayed in
   * non-multigraphs when two vertices are already connected. If the resource
   * for this key does not exist then the value is used as the error message.
   * @default 'alreadyConnected'
   */
  alreadyConnectedResource: string = isI18nEnabled() ? 'alreadyConnected' : '';

  /**
   * Specifies the resource key for the warning message to be displayed when
   * a collapsed cell contains validation errors. If the resource for this
   * key does not exist then the value is used as the warning message.
   * @default 'containsValidationErrors'
   */
  containsValidationErrorsResource: string = isI18nEnabled()
    ? 'containsValidationErrors'
    : '';

  /** Folding options. */
  options: GraphFoldingOptions = {
    foldingEnabled: true,
    collapsedImage: new Image(`${Client.imageBasePath}/collapsed.gif`, 9, 9),
    expandedImage: new Image(`${Client.imageBasePath}/expanded.gif`, 9, 9),
    collapseToPreferredSize: true,
  };

  // ===================================================================================================================
  // Group: "Create Class Instance" factory functions.
  // These can be overridden in subclasses to allow the Graph to instantiate user-defined implementations with custom behavior.
  // Notice that the methods will be moved as part of https://github.com/maxGraph/maxGraph/issues/762
  // ===================================================================================================================

  /**
   * Hooks to create a new {@link EdgeHandler} for the given {@link CellState}.
   *
   * @param state {@link CellState} to create the handler for.
   */
  createEdgeHandlerInstance(state: CellState): EdgeHandler {
    // Note this method not being called createEdgeHandler to keep compatibility
    // with older code which overrides/calls createEdgeHandler
    return new EdgeHandler(state);
  }

  /**
   * Hooks to create a new {@link EdgeSegmentHandler} for the given {@link CellState}.
   *
   * @param state {@link CellState} to create the handler for.
   */
  createEdgeSegmentHandler(state: CellState): EdgeSegmentHandler {
    return new EdgeSegmentHandler(state);
  }

  /**
   * Hooks to create a new {@link ElbowEdgeHandler} for the given {@link CellState}.
   *
   * @param state {@link CellState} to create the handler for.
   */
  createElbowEdgeHandler(state: CellState): ElbowEdgeHandler {
    return new ElbowEdgeHandler(state);
  }

  /**
   * Hooks to create a new {@link VertexHandler} for the given {@link CellState}.
   *
   * @param state {@link CellState} to create the handler for.
   */
  createVertexHandler(state: CellState): VertexHandler {
    return new VertexHandler(state);
  }

  // ===================================================================================================================
  // Group: Main graph constructor and functions
  // ===================================================================================================================

  /**
   * Convenient hook method that can be used to register global styles and shapes using the related global registries.
   *
   * While registration can also be done outside of this class (as it applies globally),
   * implementing it here makes the registration process transparent to the caller of this class.
   *
   * Subclasses can override this method to register custom defaults.
   */
  protected registerDefaults(): void {
    // do nothing, it's the purpose of this class not to load defaults.
  }

  protected abstract initializeCollaborators(options?: GraphCollaboratorsOptions): void;

  constructor(options?: GraphOptions) {
    super();
    this.registerDefaults();

    this.container = options?.container ?? document.createElement('div');

    // collaborators
    this.initializeCollaborators(options);

    // Adds a graph model listener to update the view
    this.graphModelChangeListener = (_sender: any, evt: EventObject) => {
      this.graphModelChanged(evt.getProperty('edit').changes);
    };
    this.getDataModel().addListener(InternalEvent.CHANGE, this.graphModelChangeListener);

    // Initializes the container using the view
    this.view.init();

    // Updates the size of the container for the current graph
    this.sizeDidChange();

    // Initializes plugins
    options?.plugins?.forEach((p) => this.plugins.set(p.pluginId, new p(this)));

    this.view.revalidate();
  }

  getContainer = () => this.container;
  getPlugin = <T extends GraphPlugin>(id: PluginId): T | undefined =>
    this.plugins.get(id) as T;
  getCellRenderer = () => this.cellRenderer;
  getDialect = () => this.dialect;
  isPageVisible = () => this.pageVisible;
  isPageBreaksVisible = () => this.pageBreaksVisible;
  getPageBreakColor = () => this.pageBreakColor;
  isPageBreakDashed = () => this.pageBreakDashed;
  getMinPageBreakDist = () => this.minPageBreakDist;
  isPreferPageSize = () => this.preferPageSize;
  getPageFormat = () => this.pageFormat;
  getPageScale = () => this.pageScale;
  isExportEnabled = () => this.exportEnabled;
  isImportEnabled = () => this.importEnabled;
  isIgnoreScrollbars = () => this.ignoreScrollbars;
  isTranslateToScrollPosition = () => this.translateToScrollPosition;

  getMinimumGraphSize = () => this.minimumGraphSize;
  setMinimumGraphSize = (size: Rectangle | null) => (this.minimumGraphSize = size);

  getMinimumContainerSize = () => this.minimumContainerSize;
  setMinimumContainerSize = (size: Rectangle | null) =>
    (this.minimumContainerSize = size);

  getWarningImage() {
    return this.warningImage;
  }

  getAlreadyConnectedResource = () => this.alreadyConnectedResource;

  getContainsValidationErrorsResource = () => this.containsValidationErrorsResource;

  /**
   * Updates the model in a transaction.
   *
   * @param fn the update to be performed in the transaction.
   *
   * @see {@link GraphDataModel.batchUpdate}
   */
  batchUpdate(fn: () => void) {
    this.getDataModel().batchUpdate(fn);
  }

  /**
   * Returns the {@link GraphDataModel} that contains the cells.
   */
  getDataModel() {
    return this.model;
  }

  /**
   * Returns the {@link GraphView} that contains the {@link mxCellStates}.
   */
  getView() {
    return this.view;
  }

  /**
   * Returns the {@link Stylesheet} that defines the style.
   */
  getStylesheet() {
    return this.stylesheet;
  }

  /**
   * Sets the {@link Stylesheet} that defines the style.
   */
  setStylesheet(stylesheet: Stylesheet) {
    this.stylesheet = stylesheet;
  }

  /**
   * Called when the graph model changes. Invokes {@link processChange} on each
   * item of the given array to update the view accordingly.
   *
   * @param changes Array that contains the individual changes.
   */
  graphModelChanged(changes: any[]) {
    for (const change of changes) {
      this.processChange(change);
    }

    this.updateSelection();
    this.view.validate();
    this.sizeDidChange();
  }

  /**
   * Processes the given change and invalidates the respective cached data
   * in {@link GraphView}. This fires a {@link root} event if the root has changed in the
   * model.
   *
   * @param {(RootChange|ChildChange|TerminalChange|GeometryChange|ValueChange|StyleChange)} change - Object that represents the change on the model.
   */
  processChange(change: any): void {
    // Resets the view settings, removes all cells and clears
    // the selection if the root changes.
    if (change instanceof RootChange) {
      this.clearSelection();
      this.setDefaultParent(null);

      if (change.previous) this.removeStateForCell(change.previous);

      if (this.resetViewOnRootChange) {
        this.view.scale = 1;
        this.view.translate.x = 0;
        this.view.translate.y = 0;
      }

      this.fireEvent(new EventObject(InternalEvent.ROOT));
    }

    // Adds or removes a child to the view by online invaliding
    // the minimal required portions of the cache, namely, the
    // old and new parent and the child.
    else if (change instanceof ChildChange) {
      const newParent = change.child.getParent();
      this.view.invalidate(change.child, true, true);

      if (
        !newParent ||
        !this.getDataModel().contains(newParent) ||
        newParent.isCollapsed()
      ) {
        this.view.invalidate(change.child, true, true);
        this.removeStateForCell(change.child);

        // Handles special case of current root of view being removed
        if (this.view.currentRoot == change.child) {
          this.home();
        }
      }

      if (newParent != change.previous) {
        // Refreshes the collapse/expand icons on the parents
        if (newParent != null) {
          this.view.invalidate(newParent, false, false);
        }

        if (change.previous != null) {
          this.view.invalidate(change.previous, false, false);
        }
      }
    }

    // Handles two special cases where the shape does not need to be
    // recreated from scratch, it only needs to be invalidated.
    else if (change instanceof TerminalChange || change instanceof GeometryChange) {
      // Checks if the geometry has changed to avoid unnessecary revalidation
      if (
        change instanceof TerminalChange ||
        (change.previous == null && change.geometry != null) ||
        (change.previous != null && !change.previous.equals(change.geometry))
      ) {
        this.view.invalidate(change.cell);
      }
    }

    // Handles two special cases where only the shape, but no
    // descendants need to be recreated
    else if (change instanceof ValueChange) {
      this.view.invalidate(change.cell, false, false);
    }

    // Requires a new mxShape in JavaScript
    else if (change instanceof StyleChange) {
      this.view.invalidate(change.cell, true, true);
      const state = this.view.getState(change.cell);

      if (state != null) {
        state.invalidStyle = true;
      }
    }

    // Removes the state from the cache by default
    else if (change.cell != null && change.cell instanceof Cell) {
      this.removeStateForCell(change.cell);
    }
  }

  /**
   * Scrolls the graph to the given point, extending the graph container if
   * specified.
   */
  scrollPointToVisible(x: number, y: number, extend = false, border = 20) {
    const panningHandler = this.getPlugin<PanningHandler>('PanningHandler');

    if (
      !this.isTimerAutoScroll() &&
      (this.ignoreScrollbars || hasScrollbars(this.container))
    ) {
      const c = <HTMLElement>this.container;

      if (
        x >= c.scrollLeft &&
        y >= c.scrollTop &&
        x <= c.scrollLeft + c.clientWidth &&
        y <= c.scrollTop + c.clientHeight
      ) {
        let dx = c.scrollLeft + c.clientWidth - x;

        if (dx < border) {
          const old = c.scrollLeft;
          c.scrollLeft += border - dx;

          // Automatically extends the canvas size to the bottom, right
          // if the event is outside of the canvas and the edge of the
          // canvas has been reached. Notes: Needs fix for IE.
          if (extend && old === c.scrollLeft) {
            // @ts-ignore
            const root = this.view.getDrawPane().ownerSVGElement;
            const width = c.scrollWidth + border - dx;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            // @ts-ignore
            root.style.width = `${width}px`;

            c.scrollLeft += border - dx;
          }
        } else {
          dx = x - c.scrollLeft;

          if (dx < border) {
            c.scrollLeft -= border - dx;
          }
        }

        let dy = c.scrollTop + c.clientHeight - y;

        if (dy < border) {
          const old = c.scrollTop;
          c.scrollTop += border - dy;

          if (old == c.scrollTop && extend) {
            // @ts-ignore
            const root = this.view.getDrawPane().ownerSVGElement;
            const height = c.scrollHeight + border - dy;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            // @ts-ignore
            root.style.height = `${height}px`;

            c.scrollTop += border - dy;
          }
        } else {
          dy = y - c.scrollTop;

          if (dy < border) {
            c.scrollTop -= border - dy;
          }
        }
      }
    } else if (
      this.isAllowAutoPanning() &&
      panningHandler &&
      !panningHandler.isActive()
    ) {
      panningHandler.getPanningManager().panTo(x + this.getPanDx(), y + this.getPanDy());
    }
  }

  /**
   * Returns the size of the border and padding on all four sides of the
   * container. The left, top, right and bottom borders are stored in the x, y,
   * width and height of the returned {@link Rectangle}, respectively.
   */
  getBorderSizes(): Rectangle {
    const css = <CSSStyleDeclaration>getCurrentStyle(this.container);

    return new Rectangle(
      parseCssNumber(css.paddingLeft) +
        (css.borderLeftStyle != 'none' ? parseCssNumber(css.borderLeftWidth) : 0),
      parseCssNumber(css.paddingTop) +
        (css.borderTopStyle != 'none' ? parseCssNumber(css.borderTopWidth) : 0),
      parseCssNumber(css.paddingRight) +
        (css.borderRightStyle != 'none' ? parseCssNumber(css.borderRightWidth) : 0),
      parseCssNumber(css.paddingBottom) +
        (css.borderBottomStyle != 'none' ? parseCssNumber(css.borderBottomWidth) : 0)
    );
  }

  /**
   * Returns the preferred size of the background page if {@link preferPageSize} is true.
   */
  getPreferredPageSize(bounds: Rectangle, width: number, height: number) {
    const tr = this.view.translate;
    const fmt = this.pageFormat;
    const ps = this.pageScale;
    const page = new Rectangle(
      0,
      0,
      Math.ceil(fmt.width * ps),
      Math.ceil(fmt.height * ps)
    );

    const hCount = this.pageBreaksVisible ? Math.ceil(width / page.width) : 1;
    const vCount = this.pageBreaksVisible ? Math.ceil(height / page.height) : 1;

    return new Rectangle(
      0,
      0,
      hCount * page.width + 2 + tr.x,
      vCount * page.height + 2 + tr.y
    );
  }

  /**
   * Resizes the container for the given graph width and height.
   */
  doResizeContainer(width: number, height: number): void {
    if (this.maximumContainerSize != null) {
      width = Math.min(this.maximumContainerSize.width, width);
      height = Math.min(this.maximumContainerSize.height, height);
    }
    const container = <HTMLElement>this.container;
    container.style.width = `${Math.ceil(width)}px`;
    container.style.height = `${Math.ceil(height)}px`;
  }

  /*****************************************************************************
   * Group: UNCLASSIFIED
   *****************************************************************************/

  /**
   * Creates a new handler for the given cell state. This implementation
   * returns a new {@link EdgeHandler} of the corresponding cell is an edge,
   * otherwise it returns an {@link VertexHandler}.
   *
   * @param state {@link CellState} whose handler should be created.
   */
  createHandler(state: CellState) {
    let result: EdgeHandler | VertexHandler | null = null;

    if (state.cell.isEdge()) {
      const source = state.getVisibleTerminalState(true);
      const target = state.getVisibleTerminalState(false);
      const geo = state.cell.getGeometry();

      const edgeStyle = this.getView().getEdgeStyle(
        state,
        geo ? geo.points || undefined : undefined,
        source,
        target
      );
      result = this.createEdgeHandler(state, edgeStyle);
    } else {
      result = this.createVertexHandler(state);
    }
    return result;
  }

  /**
   * Hooks to create a new {@link EdgeHandler} for the given {@link CellState}.
   *
   * This method relies on the registered elements in {@link EdgeStyleRegistry} to know which {@link EdgeHandler} to create.
   * If the {@link EdgeStyle} is not registered, it will return a default {@link EdgeHandler}.
   *
   * @param state {@link CellState} to create the handler for.
   * @param edgeStyle the {@link EdgeStyleFunction} that let choose the actual edge handler.
   */
  createEdgeHandler(state: CellState, edgeStyle: EdgeStyleFunction | null): EdgeHandler {
    const handlerKind = EdgeStyleRegistry.getHandlerKind(edgeStyle);
    switch (handlerKind) {
      case 'elbow':
        return this.createElbowEdgeHandler(state);
      case 'segment':
        return this.createEdgeSegmentHandler(state);
    }
    return this.createEdgeHandlerInstance(state);
  }

  /*****************************************************************************
   * Group: Drill down
   *****************************************************************************/

  /**
   * Returns the current root of the displayed cell hierarchy. This is a
   * shortcut to {@link GraphView.currentRoot} in {@link GraphView}.
   */
  getCurrentRoot() {
    return this.view.currentRoot;
  }

  /**
   * Returns the translation to be used if the given cell is the root cell as
   * an {@link Point}. This implementation returns null.
   *
   * To keep the children at their absolute position while stepping into groups,
   * this function can be overridden as follows.
   *
   * @example
   * ```javascript
   * var offset = new mxPoint(0, 0);
   *
   * while (cell != null)
   * {
   *   var geo = this.model.getGeometry(cell);
   *
   *   if (geo != null)
   *   {
   *     offset.x -= geo.x;
   *     offset.y -= geo.y;
   *   }
   *
   *   cell = this.model.getParent(cell);
   * }
   *
   * return offset;
   * ```
   *
   * @param cell {@link Cell} that represents the root.
   */
  getTranslateForRoot(cell: Cell | null): Point | null {
    return null;
  }

  /**
   * Returns the offset to be used for the cells inside the given cell. The
   * root and layer cells may be identified using {@link GraphDataModel.isRoot} and
   * {@link GraphDataModel.isLayer}. For all other current roots, the
   * {@link GraphView.currentRoot} field points to the respective cell, so that
   * the following holds: cell == this.view.currentRoot. This implementation
   * returns null.
   *
   * @param cell {@link Cell} whose offset should be returned.
   */
  getChildOffsetForCell(cell: Cell): Point | null {
    return null;
  }

  /**
   * Uses the root of the model as the root of the displayed cell hierarchy
   * and selects the previous root.
   */
  home() {
    const current = this.getCurrentRoot();

    if (current != null) {
      this.view.setCurrentRoot(null);
      const state = this.view.getState(current);

      if (state != null) {
        this.setSelectionCell(current);
      }
    }
  }

  /**
   * Returns true if the given cell is a valid root for the cell display
   * hierarchy. This implementation returns true for all non-null values.
   *
   * @param cell {@link Cell} which should be checked as a possible root.
   */
  isValidRoot(cell: Cell) {
    return !!cell;
  }

  /*****************************************************************************
   * Group: Graph display
   *****************************************************************************/

  /**
   * Returns the bounds of the visible graph. Shortcut to
   * {@link GraphView.getGraphBounds}. See also: {@link getBoundingBoxFromGeometry}.
   */
  getGraphBounds(): Rectangle {
    return this.view.getGraphBounds();
  }

  /**
   * Returns the bounds inside which the diagram should be kept as an
   * {@link Rectangle}.
   */
  getMaximumGraphBounds(): Rectangle | null {
    return this.maximumGraphBounds;
  }

  /**
   * Clears all cell states or the states for the hierarchy starting at the
   * given cell and validates the graph. This fires a refresh event as the
   * last step.
   *
   * @param cell Optional {@link Cell} for which the cell states should be cleared.
   */
  refresh(cell: Cell | null = null): void {
    if (cell) {
      this.view.clear(cell, false);
    } else {
      this.view.clear(undefined, true);
    }
    this.view.validate();
    this.sizeDidChange();
    this.fireEvent(new EventObject(InternalEvent.REFRESH));
  }

  /**
   * Centers the graph in the container.
   *
   * @param horizontal Optional boolean that specifies if the graph should be centered
   * horizontally. Default is `true`.
   * @param vertical Optional boolean that specifies if the graph should be centered
   * vertically. Default is `true`.
   * @param cx Optional float that specifies the horizontal center. Default is `0.5`.
   * @param cy Optional float that specifies the vertical center. Default is `0.5`.
   */
  center(horizontal = true, vertical = true, cx = 0.5, cy = 0.5): void {
    const container = <HTMLElement>this.container;
    const _hasScrollbars = hasScrollbars(this.container);
    const padding = 2 * this.getBorder();
    const cw = container.clientWidth - padding;
    const ch = container.clientHeight - padding;
    const bounds = this.getGraphBounds();

    const t = this.view.translate;
    const s = this.view.scale;

    let dx = horizontal ? cw - bounds.width : 0;
    let dy = vertical ? ch - bounds.height : 0;

    if (!_hasScrollbars) {
      this.view.setTranslate(
        horizontal ? Math.floor(t.x - bounds.x / s + (dx * cx) / s) : t.x,
        vertical ? Math.floor(t.y - bounds.y / s + (dy * cy) / s) : t.y
      );
    } else {
      bounds.x -= t.x;
      bounds.y -= t.y;

      const sw = container.scrollWidth;
      const sh = container.scrollHeight;

      if (sw > cw) {
        dx = 0;
      }

      if (sh > ch) {
        dy = 0;
      }

      this.view.setTranslate(
        Math.floor(dx / 2 - bounds.x),
        Math.floor(dy / 2 - bounds.y)
      );
      container.scrollLeft = (sw - cw) / 2;
      container.scrollTop = (sh - ch) / 2;
    }
  }

  /**
   * Returns `true` if perimeter points should be computed such that the resulting edge has only horizontal or vertical segments.
   *
   * This method relies on the registered elements in {@link EdgeStyleRegistry} to know if the {@link CellStateStyle.edgeStyle} of the {@link CellState} is orthogonal.
   * If the {@link EdgeStyle} is not registered, it is considered as NOT orthogonal.
   *
   * @param edge {@link CellState} that represents the edge.
   */
  isOrthogonal(edge: CellState): boolean {
    const orthogonal = edge.style.orthogonal;
    if (!isNullish(orthogonal)) {
      return orthogonal;
    }

    // fallback when the orthogonal style is not defined
    const edgeStyle = this.view.getEdgeStyle(edge);
    return EdgeStyleRegistry.isOrthogonal(edgeStyle);
  }

  /*****************************************************************************
   * Group: Graph appearance
   *****************************************************************************/

  /**
   * Returns the {@link backgroundImage} as an {@link Image}.
   */
  getBackgroundImage(): Image | null {
    return this.backgroundImage;
  }

  /**
   * Sets the new {@link backgroundImage}.
   *
   * @param image New {@link Image} to be used for the background.
   */
  setBackgroundImage(image: Image | null): void {
    this.backgroundImage = image;
  }

  /**
   * Returns the textual representation for the given cell.
   *
   * This implementation returns the node name or string-representation of the user object.
   *
   *
   * The following returns the label attribute from the cells user object if it is an XML node.
   *
   * @example
   * ```javascript
   * graph.convertValueToString = function(cell)
   * {
   * 	return cell.getAttribute('label');
   * }
   * ```
   *
   * See also: {@link cellLabelChanged}.
   *
   * @param cell {@link Cell} whose textual representation should be returned.
   */
  convertValueToString(cell: Cell): string {
    const value = cell.getValue();

    if (value != null) {
      if (isNode(value)) {
        return value.nodeName;
      }
      if (typeof value.toString === 'function') {
        return value.toString();
      }
    }
    return '';
  }

  /**
   * Returns the string to be used as the link for the given cell.
   *
   * This implementation returns null.
   *
   * @param cell {@link Cell} whose link should be returned.
   */
  getLinkForCell(cell: Cell): string | null {
    return null;
  }

  /**
   * Returns the value of {@link border}.
   */
  getBorder(): number {
    return this.border;
  }

  /**
   * Sets the value of {@link border}.
   *
   * @param value Positive integer that represents the border to be used.
   */
  setBorder(value: number): void {
    this.border = value;
  }

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Returns {@link resizeContainer}.
   */
  isResizeContainer() {
    return this.resizeContainer;
  }

  /**
   * Sets {@link resizeContainer}.
   *
   * @param value Boolean indicating if the container should be resized.
   */
  setResizeContainer(value: boolean) {
    this.resizeContainer = value;
  }

  /**
   * Returns true if the graph is {@link enabled}.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Specifies if the graph should allow any interactions. This
   * implementation updates {@link enabled}.
   *
   * @param value Boolean indicating if the graph should be enabled.
   */
  setEnabled(value: boolean) {
    this.enabled = value;
  }

  /**
   * Returns {@link multigraph} as a boolean.
   */
  isMultigraph() {
    return this.multigraph;
  }

  /**
   * Specifies if the graph should allow multiple connections between the
   * same pair of vertices.
   *
   * @param value Boolean indicating if the graph allows multiple connections
   * between the same pair of vertices.
   */
  setMultigraph(value: boolean) {
    this.multigraph = value;
  }

  /**
   * Returns {@link allowLoops} as a boolean.
   */
  isAllowLoops() {
    return this.allowLoops;
  }

  /**
   * Specifies if loops are allowed.
   *
   * @param value Boolean indicating if loops are allowed.
   */
  setAllowLoops(value: boolean) {
    this.allowLoops = value;
  }

  /**
   * Returns {@link recursiveResize}.
   *
   * @param state {@link CellState} that is being resized.
   */
  isRecursiveResize(state: CellState | null = null) {
    return this.recursiveResize;
  }

  /**
   * Sets {@link recursiveResize}.
   *
   * @param value New boolean value for {@link recursiveResize}.
   */
  setRecursiveResize(value: boolean) {
    this.recursiveResize = value;
  }

  /**
   * Returns a decimal number representing the amount of the width and height
   * of the given cell that is allowed to overlap its parent. A value of 0
   * means all children must stay inside the parent, 1 means the child is
   * allowed to be placed outside of the parent such that it touches one of
   * the parents sides. If {@link isAllowOverlapParent} returns false for the given
   * cell, then this method returns 0.
   *
   * @param cell {@link Cell} for which the overlap ratio should be returned.
   */
  getOverlap(cell: Cell) {
    return this.isAllowOverlapParent(cell) ? this.defaultOverlap : 0;
  }

  /**
   * Returns true if the given cell is allowed to be placed outside the
   * parents area.
   *
   * @param cell {@link Cell} that represents the child to be checked.
   */
  isAllowOverlapParent(cell: Cell): boolean {
    return false;
  }

  /*****************************************************************************
   * Group: Cell retrieval
   *****************************************************************************/

  /**
   * Returns {@link defaultParent} or {@link GraphView.currentRoot} or the first child
   * of {@link GraphDataModel.root} if both are null. The value returned by
   * this function should be used as the parent for new cells (aka default
   * layer).
   */
  getDefaultParent() {
    let parent = this.getCurrentRoot();

    if (!parent) {
      parent = this.defaultParent;

      if (!parent) {
        const root = <Cell>this.getDataModel().getRoot();
        parent = root.getChildAt(0);
      }
    }

    return <Cell>parent;
  }

  /**
   * Sets the {@link defaultParent} to the given cell. Set this to null to return
   * the first child of the root in getDefaultParent.
   */
  setDefaultParent(cell: Cell | null) {
    this.defaultParent = cell;
  }

  /**
   * Destroys the graph and all its resources.
   */
  destroy() {
    if (!this.destroyed) {
      this.destroyed = true;

      Object.values(this.plugins).forEach((p) => p.onDestroy());

      this.view.destroy();

      if (this.model && this.graphModelChangeListener) {
        this.getDataModel().removeListener(this.graphModelChangeListener);
        this.graphModelChangeListener = null;
      }
    }
  }
}

// This introduces a side effect, but it is necessary to ensure the Graph is enriched with all properties and methods defined in mixins.
// It is only called when Graph is imported, so the Graph definition is always consistent.
// And this doesn't impact the tree-shaking.
applyGraphMixins(AbstractGraph);
