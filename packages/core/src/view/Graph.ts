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

import type { GraphCollaboratorsOptions, GraphPluginConstructor } from '../types.js';
import { AbstractGraph } from './AbstractGraph.js';
import GraphView from './GraphView.js';
import CellRenderer from './cell/CellRenderer.js';
import GraphDataModel from './GraphDataModel.js';
import { Stylesheet } from './style/Stylesheet.js';
import GraphSelectionModel from './GraphSelectionModel.js';
import { registerDefaultShapes } from './shape/register-shapes.js';
import {
  registerDefaultEdgeMarkers,
  registerDefaultEdgeStyles,
  registerDefaultPerimeters,
} from './style/register.js';
import { getDefaultPlugins } from './plugins/index.js';

/**
 * An implementation of {@link AbstractGraph} that automatically loads some default built-ins (plugins, style elements).
 *
 * Good for evaluation and prototyping, but not recommended for production use. Use {@link BaseGraph} instead.
 *
 * @category Graph
 */
export class Graph extends AbstractGraph {
  /**
   * Creates a new {@link CellRenderer} to be used in this graph.
   */
  createCellRenderer(): CellRenderer {
    return new CellRenderer();
  }

  /**
   * Creates a new {@link GraphDataModel} to be used in this graph.
   */
  createGraphDataModel(): GraphDataModel {
    return new GraphDataModel();
  }

  /**
   * Creates a new {@link GraphView} to be used in this graph.
   */
  createGraphView(): GraphView {
    return new GraphView(this);
  }

  /**
   * Creates a new {@link GraphSelectionModel} to be used in this graph.
   */
  createSelectionModel() {
    return new GraphSelectionModel(this);
  }

  /**
   * Creates a new {@link Stylesheet} to be used in this graph.
   */
  createStylesheet(): Stylesheet {
    return new Stylesheet();
  }

  // Register all builtins provided by maxGraph
  protected override registerDefaults(): void {
    registerDefaultEdgeMarkers();
    registerDefaultEdgeStyles();
    registerDefaultPerimeters();
    registerDefaultShapes();
  }

  // Use the create factory methods of the class instead of the collaborators because they cannot be passed in the constructor
  protected override initializeCollaborators(options?: GraphCollaboratorsOptions): void {
    this.cellRenderer = this.createCellRenderer();
    this.model = options?.model ?? this.createGraphDataModel();
    this.setSelectionModel(this.createSelectionModel());
    this.setStylesheet(options?.stylesheet ?? this.createStylesheet());
    this.view = this.createGraphView();
  }

  constructor(
    container?: HTMLElement,
    model?: GraphDataModel,
    plugins: GraphPluginConstructor[] = getDefaultPlugins(),
    stylesheet?: Stylesheet | null
  ) {
    super({ container, model, plugins, stylesheet: stylesheet ?? undefined });
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
   * Scales the graph such that the complete diagram fits into <container> and
   * returns the current scale in the view. To fit an initial graph prior to
   * rendering, set {@link GraphView#rendering} to false prior to changing the model
   * and execute the following after changing the model.
   *
   * ```javascript
   * graph.fit();
   * graph.view.rendering = true;
   * graph.refresh();
   * ```
   *
   * To fit and center the graph, the following code can be used.
   *
   * ```javascript
   * let margin = 2;
   * let max = 3;
   *
   * let bounds = graph.getGraphBounds();
   * let cw = graph.container.clientWidth - margin;
   * let ch = graph.container.clientHeight - margin;
   * let w = bounds.width / graph.view.scale;
   * let h = bounds.height / graph.view.scale;
   * let s = Math.min(max, Math.min(cw / w, ch / h));
   *
   * graph.view.scaleAndTranslate(s,
   *   (margin + cw - w * s) / (2 * s) - bounds.x / graph.view.scale,
   *   (margin + ch - h * s) / (2 * s) - bounds.y / graph.view.scale);
   * ```
   *
   * @param border Optional number that specifies the border. Default is <border>.
   * @param keepOrigin Optional boolean that specifies if the translate should be
   * changed. Default is false.
   * @param margin Optional margin in pixels. Default is 0.
   * @param enabled Optional boolean that specifies if the scale should be set or
   * just returned. Default is true.
   * @param ignoreWidth Optional boolean that specifies if the width should be
   * ignored. Default is false.
   * @param ignoreHeight Optional boolean that specifies if the height should be
   * ignored. Default is false.
   * @param maxHeight Optional maximum height.
   */
  fit(
    border: number = this.getBorder(),
    keepOrigin = false,
    margin = 0,
    enabled = true,
    ignoreWidth = false,
    ignoreHeight = false,
    maxHeight: number | null = null
  ): number {
    if (this.container != null) {
      // Adds spacing and border from css
      const cssBorder = this.getBorderSizes();
      let w1: number = this.container.offsetWidth - cssBorder.x - cssBorder.width - 1;
      let h1: number =
        maxHeight != null
          ? maxHeight
          : this.container.offsetHeight - cssBorder.y - cssBorder.height - 1;
      let bounds = this.view.getGraphBounds();

      if (bounds.width > 0 && bounds.height > 0) {
        if (keepOrigin && bounds.x != null && bounds.y != null) {
          bounds = bounds.clone();
          bounds.width += bounds.x;
          bounds.height += bounds.y;
          bounds.x = 0;
          bounds.y = 0;
        }

        // LATER: Use unscaled bounding boxes to fix rounding errors
        const s = this.view.scale;
        let w2 = bounds.width / s;
        let h2 = bounds.height / s;

        // Fits to the size of the background image if required
        if (this.backgroundImage != null) {
          w2 = Math.max(w2, this.backgroundImage.width - bounds.x / s);
          h2 = Math.max(h2, this.backgroundImage.height - bounds.y / s);
        }

        const b: number = (keepOrigin ? border : 2 * border) + margin + 1;

        w1 -= b;
        h1 -= b;

        let s2 = ignoreWidth
          ? h1 / h2
          : ignoreHeight
            ? w1 / w2
            : Math.min(w1 / w2, h1 / h2);

        if (this.minFitScale != null) {
          s2 = Math.max(s2, this.minFitScale);
        }

        if (this.maxFitScale != null) {
          s2 = Math.min(s2, this.maxFitScale);
        }

        if (enabled) {
          if (!keepOrigin) {
            if (!hasScrollbars(this.container)) {
              const x0 =
                bounds.x != null
                  ? Math.floor(
                      this.view.translate.x - bounds.x / s + border / s2 + margin / 2
                    )
                  : border;
              const y0 =
                bounds.y != null
                  ? Math.floor(
                      this.view.translate.y - bounds.y / s + border / s2 + margin / 2
                    )
                  : border;

              this.view.scaleAndTranslate(s2, x0, y0);
            } else {
              this.view.setScale(s2);
              const b2 = this.getGraphBounds();

              if (b2.x != null) {
                this.container.scrollLeft = b2.x;
              }

              if (b2.y != null) {
                this.container.scrollTop = b2.y;
              }
            }
          } else if (this.view.scale != s2) {
            this.view.setScale(s2);
          }
        } else {
          return s2;
        }
      }
    }
    return this.view.scale;
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
   * @param state {@link CellState} to create the handler for.
   * @param edgeStyle the {@link EdgeStyleFunction} that let choose the actual edge handler.
   */
  createEdgeHandler(state: CellState, edgeStyle: EdgeStyleFunction | null): EdgeHandler {
    let result = null;
    if (
      edgeStyle == EdgeStyle.Loop ||
      edgeStyle == EdgeStyle.ElbowConnector ||
      edgeStyle == EdgeStyle.SideToSide ||
      edgeStyle == EdgeStyle.TopToBottom
    ) {
      result = this.createElbowEdgeHandler(state);
    } else if (
      edgeStyle == EdgeStyle.SegmentConnector ||
      edgeStyle == EdgeStyle.OrthConnector
    ) {
      result = this.createEdgeSegmentHandler(state);
    } else {
      result = this.createEdgeHandlerInstance(state);
    }

    return result;
  }

  /*****************************************************************************
   * Group: Drilldown
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
   * @param cell {@link mxCell} that represents the root.
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
   * @param cell {@link mxCell} whose offset should be returned.
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
   * @param cell {@link mxCell} which should be checked as a possible root.
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
   * Returns true if perimeter points should be computed such that the
   * resulting edge has only horizontal or vertical segments.
   *
   * @param edge {@link CellState} that represents the edge.
   */
  isOrthogonal(edge: CellState): boolean {
    /*
    'orthogonal' defines if the connection points on either end of the edge should
    be computed so that the edge is vertical or horizontal if possible
    and if the point is not at a fixed location. Default is false.
    This also returns true if the edgeStyle of the edge is an elbow or
    entity.
     */
    const orthogonal = edge.style.orthogonal;
    if (orthogonal != null) {
      return orthogonal;
    }

    const tmp = this.view.getEdgeStyle(edge);
    return (
      tmp === EdgeStyle.SegmentConnector ||
      tmp === EdgeStyle.ElbowConnector ||
      tmp === EdgeStyle.SideToSide ||
      tmp === EdgeStyle.TopToBottom ||
      tmp === EdgeStyle.EntityRelation ||
      tmp === EdgeStyle.OrthConnector
    );
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
   * @param cell {@link mxCell} for which the overlap ratio should be returned.
   */
  getOverlap(cell: Cell) {
    return this.isAllowOverlapParent(cell) ? this.defaultOverlap : 0;
  }

  /**
   * Returns true if the given cell is allowed to be placed outside of the
   * parents area.
   *
   * @param cell {@link mxCell} that represents the child to be checked.
   */
  isAllowOverlapParent(cell: Cell): boolean {
    return false;
  }

  /*****************************************************************************
   * Group: Cell retrieval
   *****************************************************************************/

  /**
   * Returns {@link defaultParent} or {@link GraphView.currentRoot} or the first child
   * child of {@link GraphDataModel.root} if both are null. The value returned by
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

  setTooltips(enabled: boolean) {
    const tooltipHandler = this.getPlugin<TooltipHandler>('TooltipHandler');
    tooltipHandler?.setEnabled(enabled);
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
applyGraphMixins();

export { Graph };
