/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2017, JGraph Ltd
Copyright (c) 2006-2017, Gaudenz Alder

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

import RectangleShape from '../shape/node/RectangleShape.js';
import ConnectorShape from '../shape/edge/ConnectorShape.js';
import ImageShape from '../shape/node/ImageShape.js';
import TextShape from '../shape/node/TextShape.js';
import {
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DEFAULT_FONTSTYLE,
  DEFAULT_TEXT_DIRECTION,
  NONE,
} from '../../util/Constants.js';
import { getRotatedPoint, mod, toRadians } from '../../util/mathUtils.js';
import { convertPoint } from '../../util/styleUtils.js';
import { equalEntries, equalPoints } from '../../util/arrayUtils.js';
import Rectangle from '../geometry/Rectangle.js';
import { ShapeRegistry } from '../shape/ShapeRegistry.js';
import { StencilShapeRegistry } from '../shape/stencil/StencilShapeRegistry.js';
import InternalEvent from '../event/InternalEvent.js';
import Client from '../../Client.js';
import InternalMouseEvent from '../event/InternalMouseEvent.js';
import EventObject from '../event/EventObject.js';
import Point from '../geometry/Point.js';
import Shape from '../shape/Shape.js';
import CellState from './CellState.js';
import Cell from './Cell.js';
import CellOverlay from './CellOverlay.js';
import { getClientX, getClientY, getSource } from '../../util/EventUtils.js';
import { isNode } from '../../util/domUtils.js';
import type { CellStateStyle, ShapeConstructor } from '../../types.js';
import type SelectionCellsHandler from '../plugins/SelectionCellsHandler.js';

const placeholderStyleValues = ['inherit', 'swimlane', 'indicated'];
const placeholderStyleProperties: (keyof CellStateStyle)[] = [
  'fillColor',
  'strokeColor',
  'gradientColor',
  'fontColor',
];

/**
 * Renders {@link Cell}s into a document object model.
 *
 * In general, the `CellRenderer` is in charge of creating, redrawing and destroying the shape and label associated with a cell state,
 * as well as some other graphical objects, namely controls and overlays.
 *
 * The shape hierarchy in the display (i.e. the hierarchy in which the DOM nodes appear in the document) does not reflect the cell hierarchy.
 * The shapes are a (flat) sequence of shapes and labels inside the draw pane of the {@link GraphView}, with some exceptions,
 * namely the HTML labels being placed directly inside the graph container for certain browsers.
 */
class CellRenderer {
  /**
   * Defines the default shape for edges.
   * @default {@link ConnectorShape}
   */
  defaultEdgeShape: ShapeConstructor = ConnectorShape;

  /**
   * Defines the default shape for vertices.
   * @default {@link RectangleShape}.
   */
  defaultVertexShape: ShapeConstructor = RectangleShape;

  /**
   * Defines the default shape for labels.
   * @default {@link TextShape}.
   */
  defaultTextShape: typeof TextShape = TextShape;

  /**
   * Specifies if the folding icon should ignore the horizontal orientation of a swimlane.
   * @default true.
   */
  legacyControlPosition = true;

  /**
   * Specifies if spacing and label position should be ignored if overflow is fill or width.
   * @default true for backwards compatibility.
   */
  legacySpacing = true;

  /**
   * Antialiasing option for new shapes.
   * @default true.
   */
  antiAlias = true;

  /**
   * Minimum stroke width for SVG output.
   */
  minSvgStrokeWidth = 1;

  /**
   * Specifies if the enabled state of the graph should be ignored in the control
   * click handler (to allow folding in disabled graphs).
   * @default false.
   */
  forceControlClickHandler = false;

  /**
   * Initializes the shape in the given state by calling its init method with
   * the correct container after configuring it using {@link configureShape}.
   *
   * @param state {@link CellState} for which the shape should be initialized.
   */
  initializeShape(state: CellState): void {
    if (state.shape) {
      state.shape.dialect = state.view.graph.dialect;
      this.configureShape(state);
      state.shape.init(state.view.getDrawPane());
    }
  }

  /**
   * Creates and returns the shape for the given cell state.
   *
   * @param state {@link CellState} for which the shape should be created.
   */
  createShape(state: CellState): Shape {
    // Checks if there is a stencil for the name and creates a shape instance for the stencil if one exists
    const stencil = StencilShapeRegistry.get(state.style.shape);
    if (stencil) {
      return new Shape(stencil);
    }
    const shapeConstructor = this.getShapeConstructor(state);
    return new shapeConstructor();
  }

  /**
   * Creates the indicator shape for the given cell state.
   *
   * @param state {@link CellState} for which the indicator shape should be created.
   */
  createIndicatorShape(state: CellState): void {
    if (state.shape) {
      state.shape.indicatorShape = this.getShape(state.getIndicatorShape());
    }
  }

  /**
   * Returns the shape for the given name from {@link ShapeRegistry}.
   */
  getShape(name?: string | null): ShapeConstructor | null {
    return ShapeRegistry.get(name);
  }

  /**
   * Returns the constructor to be used for creating the shape.
   */
  getShapeConstructor(state: CellState): ShapeConstructor {
    let ctor = this.getShape(state.style.shape);

    if (!ctor) {
      ctor = state.cell.isEdge() ? this.defaultEdgeShape : this.defaultVertexShape;
    }

    return ctor;
  }

  /**
   * Configures the shape for the given cell state.
   *
   * @param state {@link CellState} for which the shape should be configured.
   */
  configureShape(state: CellState): void {
    const shape = state.shape;

    if (shape) {
      shape.apply(state);
      shape.imageSrc = state.getImageSrc() || null;
      shape.indicatorColor = state.getIndicatorColor() || NONE;
      shape.indicatorStrokeColor = state.style.indicatorStrokeColor || NONE;
      shape.indicatorGradientColor = state.getIndicatorGradientColor() || NONE;
      if (state.style.indicatorDirection) {
        shape.indicatorDirection = state.style.indicatorDirection;
      }
      shape.indicatorImageSrc = state.getIndicatorImageSrc() || null;
      this.postConfigureShape(state);
    }
  }

  /**
   * Replaces any reserved words used for attributes, eg. inherit,
   * indicated or swimlane for colors in the shape for the given state.
   * This implementation resolves these keywords on the fill, stroke
   * and gradient color keys.
   */
  postConfigureShape(state: CellState): void {
    if (state.shape) {
      this.resolveColor(state, 'indicatorGradientColor', 'gradientColor');
      this.resolveColor(state, 'indicatorColor', 'fillColor');
      this.resolveColor(state, 'gradient', 'gradientColor');
      this.resolveColor(state, 'stroke', 'strokeColor');
      this.resolveColor(state, 'fill', 'fillColor');
    }
  }

  /**
   * Check if style properties supporting placeholders requires resolution.
   */
  checkPlaceholderStyles(state: CellState): boolean {
    // LATER: Check if the color has actually changed
    for (const property of placeholderStyleProperties) {
      if (placeholderStyleValues.includes(state.style[property] as string)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Resolves special keywords 'inherit', 'indicated' and 'swimlane' and sets
   * the respective color on the shape.
   */
  resolveColor(state: CellState, field: string, key: string): void {
    const shape: Shape | null = key === 'fontColor' ? state.text : state.shape;

    if (shape) {
      const graph = state.view.graph;

      // @ts-ignore
      const value = shape[field];
      let referenced = null;

      if (value === 'inherit') {
        referenced = state.cell.getParent();
      } else if (value === 'swimlane') {
        // @ts-ignore
        shape[field] =
          key === 'strokeColor' || key === 'fontColor' ? '#000000' : '#ffffff';

        if (state.cell.getTerminal(false)) {
          referenced = state.cell.getTerminal(false);
        } else {
          referenced = state.cell;
        }

        referenced = graph.getSwimlane(referenced);
        key = graph.swimlaneIndicatorColorAttribute;
      } else if (value === 'indicated' && state.shape) {
        // @ts-ignore
        shape[field] = state.shape.indicatorColor;
      } else if (key !== 'fillColor' && value === 'fillColor' && state.shape) {
        // @ts-ignore
        shape[field] = state.style.fillColor;
      } else if (key !== 'strokeColor' && value === 'strokeColor' && state.shape) {
        // @ts-ignore
        shape[field] = state.style.strokeColor;
      }

      if (referenced) {
        const rstate = graph.getView().getState(referenced);
        // @ts-ignore
        shape[field] = null;

        if (rstate) {
          const rshape = key === 'fontColor' ? rstate.text : rstate.shape;

          if (rshape && field !== 'indicatorColor') {
            // @ts-ignore
            shape[field] = rshape[field];
          } else {
            // @ts-ignore
            shape[field] = rstate.style[key];
          }
        }
      }
    }
  }

  /**
   * Returns the value to be used for the label.
   *
   * @param state {@link CellState} for which the label should be created.
   */
  getLabelValue(state: CellState): string | null {
    const graph = state.view.graph;
    return graph.getLabel(state.cell);
  }

  /**
   * Creates the label for the given cell state.
   *
   * @param state {@link CellState} for which the label should be created.
   * @param value the label value.
   */
  createLabel(state: CellState, value: string): void {
    const graph = state.view.graph;

    if ((state.style.fontSize || 0) > 0 || state.style.fontSize == null) {
      // Avoids using DOM node for empty labels
      const isForceHtml = graph.isHtmlLabel(state.cell) || isNode(value);

      state.text = new this.defaultTextShape(
        value,
        new Rectangle(),
        state.style.align ?? 'center',
        state.getVerticalAlign(),
        state.style.fontColor,
        state.style.fontFamily,
        state.style.fontSize,
        state.style.fontStyle,
        state.style.spacing,
        state.style.spacingTop,
        state.style.spacingRight,
        state.style.spacingBottom,
        state.style.spacingLeft,
        state.style.horizontal,
        state.style.labelBackgroundColor,
        state.style.labelBorderColor,
        graph.isWrapping(state.cell) && graph.isHtmlLabel(state.cell),
        graph.isLabelClipped(state.cell),
        state.style.overflow,
        state.style.labelPadding,
        state.style.textDirection ?? DEFAULT_TEXT_DIRECTION
      );
      state.text.opacity = state.style.textOpacity ?? 100;
      state.text.dialect = isForceHtml ? 'strictHtml' : graph.dialect;
      state.text.style = state.style;
      state.text.state = state;
      this.initializeLabel(state, state.text);

      // Workaround for touch devices routing all events for a mouse gesture
      // (down, move, up) via the initial DOM node. IE additionally redirects
      // the event via the initial DOM node but the event source is the node
      // under the mouse, so we need to check if this is the case and force
      // getCellAt for the subsequent mouseMoves and the final mouseUp.
      let forceGetCell = false;

      const getState = (evt: MouseEvent) => {
        let result: CellState | null = state;

        if (Client.IS_TOUCH || forceGetCell) {
          const x = getClientX(evt);
          const y = getClientY(evt);

          // Dispatches the drop event to the graph which
          // consumes and executes the source function
          const pt = convertPoint(graph.container, x, y);
          result = graph.view.getState(graph.getCellAt(pt.x, pt.y) as Cell);
        }
        return result;
      };

      // TODO: Add handling for special touch device gestures
      InternalEvent.addGestureListeners(
        state.text.node,
        (evt: MouseEvent) => {
          if (this.isLabelEvent(state, evt)) {
            graph.fireMouseEvent(
              InternalEvent.MOUSE_DOWN,
              new InternalMouseEvent(evt, state)
            );

            const source = getSource(evt);

            forceGetCell =
              // @ts-ignore nodeName should exist.
              graph.dialect !== 'svg' && source.nodeName === 'IMG';
          }
        },
        (evt: MouseEvent) => {
          if (this.isLabelEvent(state, evt)) {
            graph.fireMouseEvent(
              InternalEvent.MOUSE_MOVE,
              new InternalMouseEvent(evt, getState(evt))
            );
          }
        },
        (evt: MouseEvent) => {
          if (this.isLabelEvent(state, evt)) {
            graph.fireMouseEvent(
              InternalEvent.MOUSE_UP,
              new InternalMouseEvent(evt, getState(evt))
            );
            forceGetCell = false;
          }
        }
      );

      // Uses double click timeout in mxGraph for quirks mode
      if (graph.isNativeDblClickEnabled()) {
        InternalEvent.addListener(state.text.node, 'dblclick', (evt: MouseEvent) => {
          if (this.isLabelEvent(state, evt)) {
            graph.dblClick(evt, state.cell);
            InternalEvent.consume(evt);
          }
        });
      }
    }
  }

  /**
   * Initializes the label with a suitable container.
   *
   * @param state {@link CellState} whose label should be initialized.
   * @param shape {@link Shape} that represents the label.
   */
  initializeLabel(state: CellState, shape: Shape): void {
    if (Client.IS_SVG && Client.NO_FO && shape.dialect !== 'svg') {
      const graph = state.view.graph;
      shape.init(graph.container);
    } else {
      shape.init(state.view.getDrawPane());
    }
  }

  /**
   * Creates the actual shape for showing the overlay for the given cell state.
   *
   * @param state {@link CellState} for which the overlay should be created.
   */
  createCellOverlays(state: CellState): void {
    const graph = state.view.graph;
    const cellOverlays = graph.getCellOverlays(state.cell);
    const createdOverlays = new Map<CellOverlay, Shape>();

    for (const cellOverlay of cellOverlays) {
      const shape = state.overlays.get(cellOverlay);
      state.overlays.delete(cellOverlay);
      if (shape) {
        createdOverlays.set(cellOverlay, shape);
        continue;
      }

      const overlayShape = this.createOverlayShape(state, cellOverlay);
      overlayShape.dialect = graph.dialect;
      overlayShape.overlay = cellOverlay;
      this.initializeOverlay(state, overlayShape);
      this.installCellOverlayListeners(state, cellOverlay, overlayShape);
      this.configureOverlayShape(state, cellOverlay, overlayShape);

      createdOverlays.set(cellOverlay, overlayShape);
    }

    // Removes unused
    state.overlays.forEach((shape: Shape) => {
      shape.destroy();
    });

    state.overlays = createdOverlays;
  }

  /**
   * Create the Shape of the overlay.
   *
   * @param _state {@link CellState} for which the overlay shape should be created.
   * @param cellOverlay {@link CellOverlay} used to create the Shape of the overlay.
   * @since 0.16.0
   */
  protected createOverlayShape(_state: CellState, cellOverlay: CellOverlay): Shape {
    const overlayShape = new ImageShape(new Rectangle(), cellOverlay.image.src);
    overlayShape.preserveImageAspect = false;
    return overlayShape;
  }

  /**
   * Initializes the given overlay.
   *
   * @param state {@link CellState}  for which the overlay should be created.
   * @param overlay {@link Shape} that represents the overlay.
   */
  initializeOverlay(state: CellState, overlay: Shape): void {
    overlay.init(state.view.getOverlayPane());
  }

  /**
   * Installs the listeners for the given {@link CellState} , {@link CellOverlay} and {@link Shape} that represents the overlay.
   */
  installCellOverlayListeners(
    state: CellState,
    overlay: CellOverlay,
    shape: Shape
  ): void {
    const graph = state.view.graph;

    InternalEvent.addListener(shape.node, 'click', (evt: Event) => {
      if (graph.isEditing()) {
        graph.stopEditing(!graph.isInvokesStopCellEditing());
      }

      overlay.fireEvent(
        new EventObject(InternalEvent.CLICK, { event: evt, cell: state.cell })
      );
    });

    InternalEvent.addGestureListeners(
      shape.node,
      (evt: Event) => {
        InternalEvent.consume(evt);
      },
      (evt: Event) => {
        graph.fireMouseEvent(
          InternalEvent.MOUSE_MOVE,
          new InternalMouseEvent(evt as MouseEvent, state)
        );
      }
    );

    if (Client.IS_TOUCH) {
      InternalEvent.addListener(shape.node, 'touchend', (evt: Event) => {
        overlay.fireEvent(
          new EventObject(InternalEvent.CLICK, { event: evt, cell: state.cell })
        );
      });
    }
  }

  /**
   * Configure the Shape of the overlay. Generally, it is used to configure the DOM node of the Shape
   *
   * The default implementation set the cursor in the DOM node of the Shape based on the {@link CellOverlay.cursor}.
   *
   * @param _state {@link CellState} for which the overlay shape should be created.
   * @param cellOverlay {@link CellOverlay} used to create the Shape of the overlay.
   * @param overlayShape the {@link Shape} of the overlay.
   * @since 0.16.0
   */
  protected configureOverlayShape(
    _state: CellState,
    cellOverlay: CellOverlay,
    overlayShape: Shape
  ): void {
    if (cellOverlay.cursor) {
      overlayShape.node.style.cursor = cellOverlay.cursor;
    }
  }

  /**
   * Creates the control for the given cell state.
   *
   * @param state {@link CellState}  for which the control should be created.
   */
  createControl(state: CellState): void {
    const graph = state.view.graph;
    const image = graph.getFoldingImage(state);

    if (graph.isFoldingEnabled() && image) {
      if (!state.control) {
        const b = new Rectangle(0, 0, image.width, image.height);
        state.control = new ImageShape(b, image.src);
        state.control.preserveImageAspect = false;
        state.control.dialect = graph.dialect;

        this.initControl(
          state,
          state.control,
          true,
          this.createControlClickHandler(state)
        );
      }
    } else if (state.control) {
      state.control.destroy();
      state.control = null;
    }
  }

  /**
   * Hook for creating the click handler for the folding icon.
   *
   * @param state {@link CellState}  whose control click handler should be returned.
   */
  createControlClickHandler(state: CellState): (evt: Event) => void {
    const graph = state.view.graph;

    return (evt: Event) => {
      if (this.forceControlClickHandler || graph.isEnabled()) {
        const collapse = !state.cell.isCollapsed();
        graph.foldCells(collapse, false, [state.cell], false, evt);
        InternalEvent.consume(evt);
      }
    };
  }

  /**
   * Initializes the given control and returns the corresponding DOM node.
   *
   * @param state {@link CellState} for which the control should be initialized.
   * @param control {@link Shape} to be initialized.
   * @param handleEvents Boolean indicating if mousedown and mousemove should fire events via the graph.
   * @param clickHandler Optional function to implement clicks on the control.
   */
  initControl(
    state: CellState,
    control: Shape,
    handleEvents: boolean,
    clickHandler: EventListener
  ): Element | null {
    const graph = state.view.graph;

    // In the special case where the label is in HTML and the display is SVG the image
    // should go into the graph container directly in order to be clickable. Otherwise
    // it is obscured by the HTML label that overlaps the cell.
    const isForceHtml =
      graph.isHtmlLabel(state.cell) && Client.NO_FO && graph.dialect === 'svg';

    if (isForceHtml) {
      control.dialect = 'preferHtml';
      control.init(graph.container);
      control.node.style.zIndex = String(1);
    } else {
      control.init(state.view.getOverlayPane());
    }

    const node = control.node;

    // Workaround for missing click event on iOS is to check tolerance below
    if (clickHandler && !Client.IS_IOS) {
      if (graph.isEnabled()) {
        node.style.cursor = 'pointer';
      }

      InternalEvent.addListener(node, 'click', clickHandler);
    }

    if (handleEvents) {
      let first: Point | null = null;

      InternalEvent.addGestureListeners(
        node,
        (evt: MouseEvent) => {
          first = new Point(getClientX(evt), getClientY(evt));
          graph.fireMouseEvent(
            InternalEvent.MOUSE_DOWN,
            new InternalMouseEvent(evt, state)
          );
          InternalEvent.consume(evt);
        },
        (evt: MouseEvent) => {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_MOVE,
            new InternalMouseEvent(evt, state)
          );
        },
        (evt: MouseEvent) => {
          graph.fireMouseEvent(
            InternalEvent.MOUSE_UP,
            new InternalMouseEvent(evt, state)
          );
          InternalEvent.consume(evt);
        }
      );

      // Uses capture phase for event interception to stop bubble phase
      if (clickHandler && Client.IS_IOS) {
        node.addEventListener(
          'touchend',
          (evt: Event) => {
            if (first) {
              const tol = graph.getEventTolerance();

              if (
                Math.abs(first.x - getClientX(evt as MouseEvent)) < tol &&
                Math.abs(first.y - getClientY(evt as MouseEvent)) < tol
              ) {
                clickHandler.call(clickHandler, evt);
                InternalEvent.consume(evt);
              }
            }
          },
          true
        );
      }
    }

    return node;
  }

  /**
   * Returns `true` if the event is for the shape of the given state.
   *
   * This implementation always returns `true`.
   *
   * @param state {@link CellState}  whose shape fired the event.
   * @param evt Mouse event which was fired.
   */
  isShapeEvent(state: CellState, evt: MouseEvent): boolean {
    return true;
  }

  /**
   * Returns `true` if the event is for the label of the given state.
   *
   * This implementation always returns `true`.
   *
   * @param state {@link CellState}  whose label fired the event.
   * @param evt Mouse event which was fired.
   */
  isLabelEvent(state: CellState, evt: MouseEvent): boolean {
    return true;
  }

  /**
   * Installs the event listeners for the given cell state.
   *
   * @param state {@link CellState}  for which the event listeners should be isntalled.
   */
  installListeners(state: CellState): void {
    const graph = state.view.graph;

    // Workaround for touch devices routing all events for a mouse
    // gesture (down, move, up) via the initial DOM node. Same for
    // HTML images in all IE versions (VML images are working).
    const getState = (evt: MouseEvent) => {
      let result: CellState | null = state;
      const source = getSource(evt);

      if (
        (source &&
          graph.dialect !== 'svg' &&
          // @ts-ignore nodeName should exist
          source.nodeName === 'IMG') ||
        Client.IS_TOUCH
      ) {
        const x = getClientX(evt);
        const y = getClientY(evt);

        // Dispatches the drop event to the graph which
        // consumes and executes the source function
        const pt = convertPoint(graph.container, x, y);
        const cell = graph.getCellAt(pt.x, pt.y);

        result = cell ? graph.view.getState(cell) : null;
      }

      return result;
    };

    if (state.shape) {
      InternalEvent.addGestureListeners(
        state.shape.node,
        (evt: MouseEvent) => {
          if (this.isShapeEvent(state, evt)) {
            graph.fireMouseEvent(
              InternalEvent.MOUSE_DOWN,
              new InternalMouseEvent(evt, state)
            );
          }
        },
        (evt: MouseEvent) => {
          if (this.isShapeEvent(state, evt)) {
            graph.fireMouseEvent(
              InternalEvent.MOUSE_MOVE,
              new InternalMouseEvent(evt, getState(evt))
            );
          }
        },
        (evt: MouseEvent) => {
          if (this.isShapeEvent(state, evt)) {
            graph.fireMouseEvent(
              InternalEvent.MOUSE_UP,
              new InternalMouseEvent(evt, getState(evt))
            );
          }
        }
      );

      // Uses double click timeout in mxGraph for quirks mode
      if (graph.isNativeDblClickEnabled()) {
        InternalEvent.addListener(state.shape.node, 'dblclick', (evt: MouseEvent) => {
          if (this.isShapeEvent(state, evt)) {
            graph.dblClick(evt, state.cell);
            InternalEvent.consume(evt);
          }
        });
      }
    }
  }

  /**
   * Redraws the label for the given cell state.
   *
   * @param state {@link CellState}  whose label should be redrawn.
   */
  redrawLabel(state: CellState, forced: boolean): void {
    const graph = state.view.graph;
    const value = this.getLabelValue(state);
    const wrapping = graph.isWrapping(state.cell);
    const clipping = graph.isLabelClipped(state.cell);
    const isForceHtml = graph.isHtmlLabel(state.cell) || (value && isNode(value));
    const dialect = isForceHtml ? 'strictHtml' : graph.dialect;
    const overflow = state.style.overflow ?? 'visible';

    if (
      state.text &&
      (state.text.wrap !== wrapping ||
        state.text.clipped !== clipping ||
        state.text.overflow !== overflow ||
        state.text.dialect !== dialect)
    ) {
      state.text.destroy();
      state.text = null;
    }

    if (state.text == null && value != null && (isNode(value) || value.length > 0)) {
      this.createLabel(state, value);
    } else if (state.text != null && (value == null || value.length == 0)) {
      state.text.destroy();
      state.text = null;
    }

    if (state.text != null) {
      // Forced is true if the style has changed, so to get the updated
      // result in getLabelBounds we apply the new style to the shape
      if (forced) {
        // Checks if a full repaint is needed
        if (state.text.lastValue != null && this.isTextShapeInvalid(state, state.text)) {
          // Forces a full repaint
          state.text.lastValue = null;
        }

        state.text.resetStyles();
        state.text.apply(state);

        // Special case where value is obtained via hook in graph
        state.text.valign = state.getVerticalAlign();
      }

      const bounds = this.getLabelBounds(state);
      const nextScale = this.getTextScale(state);
      this.resolveColor(state, 'color', 'fontColor');

      if (
        forced ||
        state.text.value !== value ||
        state.text.wrap !== wrapping ||
        state.text.overflow !== overflow ||
        state.text.clipped !== clipping ||
        state.text.scale !== nextScale ||
        state.text.dialect !== dialect ||
        state.text.bounds == null ||
        !state.text.bounds.equals(bounds)
      ) {
        state.text.dialect = dialect;
        state.text.value = value as string;
        state.text.bounds = bounds;
        state.text.scale = nextScale;
        state.text.wrap = wrapping;
        state.text.clipped = clipping;
        state.text.overflow = overflow;

        // Preserves visible state
        // @ts-ignore
        const vis = state.text.node.style.visibility;
        this.redrawLabelShape(state.text);
        // @ts-ignore
        state.text.node.style.visibility = vis;
      }
    }
  }

  /**
   * Returns true if the style for the text shape has changed.
   *
   * @param state {@link CellState}  whose label should be checked.
   * @param shape {@link Text} shape to be checked.
   */
  isTextShapeInvalid(state: CellState, shape: TextShape): boolean {
    function check(property: string, styleName: string, defaultValue: any) {
      let result = false;

      // Workaround for spacing added to directional spacing
      if (
        styleName === 'spacingTop' ||
        styleName === 'spacingRight' ||
        styleName === 'spacingBottom' ||
        styleName === 'spacingLeft'
      ) {
        result =
          // @ts-ignore
          parseFloat(String(shape[property])) - parseFloat(String(shape.spacing)) !==
          (state.style[styleName] || defaultValue);
      } else {
        // @ts-ignore
        result = shape[property] !== (state.style[styleName] || defaultValue);
      }

      return result;
    }

    return (
      check('fontStyle', 'fontStyle', DEFAULT_FONTSTYLE) ||
      check('family', 'fontFamily', DEFAULT_FONTFAMILY) ||
      check('size', 'fontSize', DEFAULT_FONTSIZE) ||
      check('color', 'fontColor', 'black') ||
      check('align', 'align', '') ||
      check('valign', 'verticalAlign', '') ||
      check('spacing', 'spacing', 2) ||
      check('spacingTop', 'spacingTop', 0) ||
      check('spacingRight', 'spacingRight', 0) ||
      check('spacingBottom', 'spacingBottom', 0) ||
      check('spacingLeft', 'spacingLeft', 0) ||
      check('horizontal', 'horizontal', true) ||
      check('background', 'labelBackgroundColor', null) ||
      check('border', 'labelBorderColor', null) ||
      check('opacity', 'textOpacity', 100) ||
      check('textDirection', 'textDirection', DEFAULT_TEXT_DIRECTION)
    );
  }

  /**
   * Called to invoked redraw on the given text shape.
   *
   * @param shape {@link Text} shape to be redrawn.
   */
  redrawLabelShape(shape: TextShape): void {
    shape.redraw();
  }

  /**
   * Returns the scaling used for the label of the given state
   *
   * @param state {@link CellState}  whose label scale should be returned.
   */
  getTextScale(state: CellState): number {
    return state.view.scale;
  }

  /**
   * Returns the bounds to be used to draw the label of the given state.
   *
   * @param state {@link CellState}  whose label bounds should be returned.
   */
  getLabelBounds(state: CellState): Rectangle {
    const { scale } = state.view;
    const isEdge = state.cell.isEdge();
    let bounds = new Rectangle(state.absoluteOffset.x, state.absoluteOffset.y);

    if (isEdge) {
      // @ts-ignore
      const spacing = state.text.getSpacing();
      bounds.x += spacing.x * scale;
      bounds.y += spacing.y * scale;

      const geo = state.cell.getGeometry();

      if (geo != null) {
        bounds.width = Math.max(0, geo.width * scale);
        bounds.height = Math.max(0, geo.height * scale);
      }
    } else {
      // Inverts label position
      // @ts-ignore
      if (state.text.isPaintBoundsInverted()) {
        const tmp = bounds.x;
        bounds.x = bounds.y;
        bounds.y = tmp;
      }

      bounds.x += state.x;
      bounds.y += state.y;

      // Minimum of 1 fixes alignment bug in HTML labels
      bounds.width = Math.max(1, state.width);
      bounds.height = Math.max(1, state.height);
    }

    // @ts-ignore
    if (state.text.isPaintBoundsInverted()) {
      // Rotates around center of state
      const t = (state.width - state.height) / 2;
      bounds.x += t;
      bounds.y -= t;
      const tmp = bounds.width;
      bounds.width = bounds.height;
      bounds.height = tmp;
    }

    // Shape can modify its label bounds
    if (state.shape != null) {
      const hpos = state.style.labelPosition ?? 'center';
      const vpos = state.style.verticalLabelPosition ?? 'middle';

      if (hpos === 'center' && vpos === 'middle') {
        bounds = state.shape.getLabelBounds(bounds);
      }
    }

    // Label width style overrides actual label width
    const lw = state.style.labelWidth ?? null;

    if (lw != null) {
      bounds.width = lw * scale;
    }
    if (!isEdge) {
      this.rotateLabelBounds(state, bounds);
    }

    return bounds;
  }

  /**
   * Adds the shape rotation to the given label bounds and
   * applies the alignment and offsets.
   *
   * @param state {@link CellState}  whose label bounds should be rotated.
   * @param bounds {@link Rectangle} the rectangle to be rotated.
   */
  rotateLabelBounds(state: CellState, bounds: Rectangle): void {
    const textShape = state.text!;
    bounds.y -= textShape.margin!.y * bounds.height;
    bounds.x -= textShape.margin!.x * bounds.width;

    if (
      !this.legacySpacing ||
      (state.style.overflow !== 'fill' && state.style.overflow !== 'width')
    ) {
      const s = state.view.scale;
      const spacing = textShape.getSpacing();
      bounds.x += spacing.x * s;
      bounds.y += spacing.y * s;

      const hpos = state.style.labelPosition ?? 'center';
      const vpos = state.style.verticalLabelPosition ?? 'middle';
      const lw = state.style.labelWidth ?? null;

      bounds.width = Math.max(
        0,
        bounds.width -
          (hpos === 'center' && lw == null
            ? textShape.spacingLeft * s + textShape.spacingRight * s
            : 0)
      );
      bounds.height = Math.max(
        0,
        bounds.height -
          (vpos === 'middle' ? textShape.spacingTop * s + textShape.spacingBottom * s : 0)
      );
    }

    // @ts-ignore
    const theta = textShape.getTextRotation();

    // Only needed if rotated around another center
    if (
      theta !== 0 &&
      state != null &&
      // @ts-ignore
      state.cell.isVertex()
    ) {
      const cx = state.getCenterX();
      const cy = state.getCenterY();

      if (bounds.x !== cx || bounds.y !== cy) {
        const rad = theta * (Math.PI / 180);
        const pt = getRotatedPoint(
          new Point(bounds.x, bounds.y),
          Math.cos(rad),
          Math.sin(rad),
          new Point(cx, cy)
        );

        bounds.x = pt.x;
        bounds.y = pt.y;
      }
    }
  }

  /**
   * Redraws the overlays for the given cell state.
   *
   * @param state {@link CellState}  whose overlays should be redrawn.
   */
  redrawCellOverlays(state: CellState, forced = false): void {
    this.createCellOverlays(state);

    if (state.overlays) {
      const rot = mod(state.style.rotation ?? 0, 90);
      const rad = toRadians(rot);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      state.overlays.forEach((shape: Shape) => {
        const bounds = shape.overlay?.getBounds(state) ?? null;

        if (bounds && !state.cell.isEdge() && state.shape && rot !== 0) {
          let cx = bounds.getCenterX();
          let cy = bounds.getCenterY();

          const point = getRotatedPoint(
            new Point(cx, cy),
            cos,
            sin,
            new Point(state.getCenterX(), state.getCenterY())
          );

          cx = point.x;
          cy = point.y;
          bounds.x = Math.round(cx - bounds.width / 2);
          bounds.y = Math.round(cy - bounds.height / 2);
        }

        if (
          forced ||
          shape.bounds == null ||
          shape.scale !== state.view.scale ||
          !shape.bounds.equals(bounds)
        ) {
          shape.bounds = bounds;
          shape.scale = state.view.scale;
          shape.redraw();
        }
      });
    }
  }

  /**
   * Redraws the control for the given cell state.
   *
   * @param state {@link CellState}  whose control should be redrawn.
   */
  redrawControl(state: CellState, forced = false): void {
    const image = state.view.graph.getFoldingImage(state);

    if (state.control != null && image != null) {
      const bounds = this.getControlBounds(state, image.width, image.height);

      const r = this.legacyControlPosition
        ? (state.style.rotation ?? 0)
        : state.shape!.getTextRotation();
      const s = state.view.scale;

      if (
        forced ||
        state.control.scale !== s ||
        !state.control.bounds!.equals(bounds) ||
        state.control.rotation !== r
      ) {
        state.control.rotation = r;
        state.control.bounds = bounds;
        state.control.scale = s;

        state.control.redraw();
      }
    }
  }

  /**
   * Returns the bounds to be used to draw the control (folding icon) of the given state.
   */
  getControlBounds(state: CellState, w: number, h: number): Rectangle | null {
    if (state.control != null) {
      const s = state.view.scale;
      let cx = state.getCenterX();
      let cy = state.getCenterY();

      if (!state.cell.isEdge()) {
        cx = state.x + w * s;
        cy = state.y + h * s;

        if (state.shape != null) {
          // TODO: Factor out common code
          let rot = state.shape.getShapeRotation();

          if (this.legacyControlPosition) {
            rot = state.style.rotation ?? 0;
          } else if (state.shape.isPaintBoundsInverted()) {
            const t = (state.width - state.height) / 2;
            cx += t;
            cy -= t;
          }

          if (rot !== 0) {
            const rad = toRadians(rot);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const point = getRotatedPoint(
              new Point(cx, cy),
              cos,
              sin,
              new Point(state.getCenterX(), state.getCenterY())
            );
            cx = point.x;
            cy = point.y;
          }
        }
      }

      return state.cell.isEdge()
        ? new Rectangle(
            Math.round(cx - (w / 2) * s),
            Math.round(cy - (h / 2) * s),
            Math.round(w * s),
            Math.round(h * s)
          )
        : new Rectangle(
            Math.round(cx - (w / 2) * s),
            Math.round(cy - (h / 2) * s),
            Math.round(w * s),
            Math.round(h * s)
          );
    }

    return null;
  }

  /**
   * Inserts the given {@link CellState} after the given nodes in the DOM.
   *
   * @param state {@link CellState} to be inserted.
   * @param node Node in {@link GraphView.drawPane} after which the shapes should be inserted.
   * @param htmlNode Node in the graph container after which the shapes should be inserted that
   * will not go into the {@link GraphView.drawPane} (e.g. HTML labels without foreignObjects).
   */
  insertStateAfter(
    state: CellState,
    node: HTMLElement | SVGElement | null,
    htmlNode: HTMLElement | SVGElement | null
  ): (HTMLElement | SVGElement | null)[] {
    const graph = state.view.graph;
    const shapes = this.getShapesForState(state);

    for (let i = 0; i < shapes.length; i += 1) {
      // @ts-ignore
      if (shapes[i] != null && shapes[i].node != null) {
        const html =
          // @ts-ignore
          shapes[i].node.parentNode !== state.view.getDrawPane() &&
          // @ts-ignore
          shapes[i].node.parentNode !== state.view.getOverlayPane();
        const temp = html ? htmlNode : node;

        // @ts-ignore
        if (temp != null && temp.nextSibling !== shapes[i].node) {
          if (temp.nextSibling == null) {
            // @ts-ignore
            temp.parentNode.appendChild(shapes[i].node);
          } else {
            // @ts-ignore
            temp.parentNode.insertBefore(shapes[i].node, temp.nextSibling);
          }
        } else if (temp == null) {
          // Special case: First HTML node should be first sibling after canvas
          // @ts-ignore
          const shapeNode: HTMLElement = <HTMLElement>shapes[i].node;

          if (shapeNode.parentNode === graph.container) {
            let { canvas } = state.view;

            while (canvas != null && canvas.parentNode !== graph.container) {
              // @ts-ignore
              canvas = canvas.parentNode;
            }

            if (canvas != null && canvas.nextSibling != null) {
              if (canvas.nextSibling !== shapeNode) {
                // @ts-ignore
                shapeNode.parentNode.insertBefore(shapeNode, canvas.nextSibling);
              }
            } else {
              // @ts-ignore
              shapeNode.parentNode.appendChild(shapeNode);
            }
          } else if (
            shapeNode.parentNode != null &&
            shapeNode.parentNode.firstChild != null &&
            shapeNode.parentNode.firstChild != shapeNode
          ) {
            // Inserts the node as the first child of the parent to implement the order
            shapeNode.parentNode.insertBefore(shapeNode, shapeNode.parentNode.firstChild);
          }
        }

        if (html) {
          // @ts-ignore
          htmlNode = shapes[i].node;
        } else {
          // @ts-ignore
          node = shapes[i].node;
        }
      }
    }

    return [node, htmlNode];
  }

  /**
   * Returns the {@link Shape}s for the given cell state in the order in which they should appear in the DOM.
   *
   * @param state {@link CellState}  whose shapes should be returned.
   */
  getShapesForState(state: CellState): [Shape | null, TextShape | null, Shape | null] {
    return [state.shape, state.text, state.control];
  }

  /**
   * Updates the bounds or points and scale of the shapes for the given cell
   * state. This is called in mxGraphView.validatePoints as the last step of
   * updating all cells.
   *
   * @param state {@link CellState}  for which the shapes should be updated.
   * @param force Optional boolean that specifies if the cell should be reconfiured
   * and redrawn without any additional checks.
   * @param rendering Optional boolean that specifies if the cell should actually
   * be drawn into the DOM. If this is false then redraw and/or reconfigure
   * will not be called on the shape.
   */
  redraw(state: CellState, force = false, rendering = true): void {
    const shapeChanged = this.redrawShape(state, force, rendering);

    if (state.shape != null && rendering) {
      this.redrawLabel(state, shapeChanged);
      this.redrawCellOverlays(state, shapeChanged);
      this.redrawControl(state, shapeChanged);
    }
  }

  /**
   * Redraws the shape for the given cell state.
   *
   * @param state {@link CellState}  whose label should be redrawn.
   */
  redrawShape(state: CellState, force = false, rendering = true): boolean {
    let shapeChanged = false;
    const graph = state.view.graph;

    // Forces creation of new shape if shape style has changed
    if (
      state.shape != null &&
      state.shape.style != null &&
      state.style != null &&
      state.shape.style.shape !== state.style.shape
    ) {
      state.shape.destroy();
      state.shape = null;
    }

    const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>(
      'SelectionCellsHandler'
    );
    if (
      state.shape == null &&
      graph.container != null &&
      state.cell !== state.view.currentRoot &&
      (state.cell.isVertex() || state.cell.isEdge())
    ) {
      state.shape = this.createShape(state);

      if (state.shape != null) {
        state.shape.minSvgStrokeWidth = this.minSvgStrokeWidth;
        state.shape.antiAlias = this.antiAlias;

        this.createIndicatorShape(state);
        this.initializeShape(state);
        this.createCellOverlays(state);
        this.installListeners(state);

        // Forces a refresh of the handler if one exists
        selectionCellsHandler?.updateHandler(state);
      }
    } else if (
      !force &&
      state.shape != null &&
      (!equalEntries(state.shape.style, state.style) ||
        this.checkPlaceholderStyles(state))
    ) {
      state.shape.resetStyles();
      this.configureShape(state);
      // LATER: Ignore update for realtime to fix reset of current gesture
      selectionCellsHandler?.updateHandler(state);
      force = true;
    }

    // Updates indicator shape
    if (
      state.shape != null &&
      state.shape.indicatorShape != this.getShape(<string>state.getIndicatorShape())
    ) {
      if (state.shape.indicator != null) {
        state.shape.indicator.destroy();
        state.shape.indicator = null;
      }

      this.createIndicatorShape(state);

      if (state.shape.indicatorShape != null) {
        state.shape.indicator = new state.shape.indicatorShape();
        state.shape.indicator.dialect = state.shape.dialect;
        state.shape.indicator.init(state.node as HTMLElement);
        force = true;
      }
    }

    if (state.shape) {
      // Handles changes of the collapse icon
      this.createControl(state);

      // Redraws the cell if required, ignores changes to bounds if points are
      // defined as the bounds are updated for the given points inside the shape
      if (force || this.isShapeInvalid(state, state.shape)) {
        if (state.absolutePoints.length > 0) {
          state.shape.points = state.absolutePoints.slice();
          state.shape.bounds = null;
        } else {
          state.shape.points = [];
          state.shape.bounds = new Rectangle(state.x, state.y, state.width, state.height);
        }

        state.shape.scale = state.view.scale;

        if (rendering == null || rendering) {
          this.doRedrawShape(state);
        } else {
          state.shape.updateBoundingBox();
        }

        shapeChanged = true;
      }
    }

    return shapeChanged;
  }

  /**
   * Invokes redraw on the shape of the given state.
   */
  doRedrawShape(state: CellState): void {
    state.shape?.redraw();
  }

  /**
   * Returns true if the given shape must be repainted.
   */
  isShapeInvalid(state: CellState, shape: Shape): boolean {
    return (
      shape.bounds == null ||
      shape.scale !== state.view.scale ||
      (state.absolutePoints.length === 0 && !shape.bounds.equals(state)) ||
      (state.absolutePoints.length > 0 &&
        !equalPoints(shape.points, state.absolutePoints))
    );
  }

  /**
   * Destroys the shapes associated with the given cell state.
   *
   * @param state {@link CellState}  for which the shapes should be destroyed.
   */
  destroy(state: CellState): void {
    if (state.shape) {
      if (state.text) {
        state.text.destroy();
        state.text = null;
      }

      state.overlays.forEach((shape: Shape) => {
        shape.destroy();
      });

      state.overlays = new Map();

      if (state.control) {
        state.control.destroy();
        state.control = null;
      }

      state.shape.destroy();
      state.shape = null;
    }
  }
}

export default CellRenderer;
