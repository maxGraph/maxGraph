/**
 * Copyright (c) 2006-2017, JGraph Ltd
 * Copyright (c) 2006-2017, Gaudenz Alder
 */

import RectangleShape from '../geometry/shape/node/RectangleShape';
import EllipseShape from '../geometry/shape/node/EllipseShape';
import RhombusShape from '../geometry/shape/node/RhombusShape';
import CylinderShape from '../geometry/shape/node/CylinderShape';
import ConnectorShape from '../geometry/shape/edge/ConnectorShape';
import ActorShape from '../geometry/shape/ActorShape';
import TriangleShape from '../geometry/shape/node/TriangleShape';
import HexagonShape from '../geometry/shape/node/HexagonShape';
import CloudShape from '../geometry/shape/node/CloudShape';
import LineShape from '../geometry/shape/edge/LineShape';
import ArrowShape from '../geometry/shape/edge/ArrowShape';
import ArrowConnectorShape from '../geometry/shape/edge/ArrowConnectorShape';
import DoubleEllipseShape from '../geometry/shape/node/DoubleEllipseShape';
import SwimlaneShape from '../geometry/shape/node/SwimlaneShape';
import ImageShape from '../geometry/shape/node/ImageShape';
import LabelShape from '../geometry/shape/node/LabelShape';
import TextShape from '../geometry/shape/node/TextShape';
import {
  ALIGN_CENTER,
  ALIGN_MIDDLE,
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  DEFAULT_FONTSTYLE,
  DEFAULT_TEXT_DIRECTION,
  DIALECT_PREFERHTML,
  DIALECT_STRICTHTML,
  DIALECT_SVG,
  SHAPE_ACTOR,
  SHAPE_ARROW,
  SHAPE_ARROW_CONNECTOR,
  SHAPE_CLOUD,
  SHAPE_CONNECTOR,
  SHAPE_CYLINDER,
  SHAPE_DOUBLE_ELLIPSE,
  SHAPE_ELLIPSE,
  SHAPE_HEXAGON,
  SHAPE_IMAGE,
  SHAPE_LABEL,
  SHAPE_LINE,
  SHAPE_RECTANGLE,
  SHAPE_RHOMBUS,
  SHAPE_SWIMLANE,
  SHAPE_TRIANGLE,
} from '../../util/Constants';
import {
  convertPoint,
  equalEntries,
  equalPoints,
  getRotatedPoint,
  mod,
  toRadians,
} from '../../util/Utils';
import Rectangle from '../geometry/Rectangle';
import StencilShapeRegistry from '../geometry/shape/node/StencilShapeRegistry';
import InternalEvent from '../event/InternalEvent';
import mxClient from '../../mxClient';
import InternalMouseEvent from '../event/InternalMouseEvent';
import Dictionary from '../../util/Dictionary';
import EventObject from '../event/EventObject';
import Point from '../geometry/Point';
import Shape from '../geometry/shape/Shape';
import CellState from './datatypes/CellState';
import Cell from './datatypes/Cell';
import CellOverlay from './CellOverlay';
import { getClientX, getClientY, getSource } from '../../util/EventUtils';
import { isNode } from '../../util/DomUtils';
import { CellStateStyles } from '../../types';
import CellArray from './datatypes/CellArray';
import SelectionCellsHandler from '../selection/SelectionCellsHandler';

/**
 * Class: mxCellRenderer
 *
 * Renders cells into a document object model. The <defaultShapes> is a global
 * map of shapename, constructor pairs that is used in all instances. You can
 * get a list of all available shape names using the following code.
 *
 * In general the cell renderer is in charge of creating, redrawing and
 * destroying the shape and label associated with a cell state, as well as
 * some other graphical objects, namely controls and overlays. The shape
 * hieararchy in the display (ie. the hierarchy in which the DOM nodes
 * appear in the document) does not reflect the cell hierarchy. The shapes
 * are a (flat) sequence of shapes and labels inside the draw pane of the
 * graph view, with some exceptions, namely the HTML labels being placed
 * directly inside the graph container for certain browsers.
 *
 * (code)
 * mxLog.show();
 * for (var i in mxCellRenderer.defaultShapes)
 * {
 *   mxLog.debug(i);
 * }
 * (end)
 *
 * Constructor: mxCellRenderer
 *
 * Constructs a new cell renderer with the following built-in shapes:
 * arrow, rectangle, ellipse, rhombus, image, line, label, cylinder,
 * swimlane, connector, actor and cloud.
 */
class CellRenderer {
  constructor() {}

  /**
   * Variable: defaultShapes
   *
   * Static array that contains the globally registered shapes which are
   * known to all instances of this class. For adding new shapes you should
   * use the static <mxCellRenderer.registerShape> function.
   */
  static defaultShapes: { [key: string]: typeof Shape } = {};

  /**
   * Variable: defaultEdgeShape
   *
   * Defines the default shape for edges. Default is <mxConnector>.
   */
  // @ts-expect-error The constructors for Shape and Connector are different.
  defaultEdgeShape: typeof Shape = ConnectorShape;

  /**
   * Variable: defaultVertexShape
   *
   * Defines the default shape for vertices. Default is <mxRectangleShape>.
   */
  defaultVertexShape: typeof RectangleShape = RectangleShape;

  /**
   * Variable: defaultTextShape
   *
   * Defines the default shape for labels. Default is <mxText>.
   */
  defaultTextShape: typeof TextShape = TextShape;

  /**
   * Variable: legacyControlPosition
   *
   * Specifies if the folding icon should ignore the horizontal
   * orientation of a swimlane. Default is true.
   */
  legacyControlPosition = true;

  /**
   * Variable: legacySpacing
   *
   * Specifies if spacing and label position should be ignored if overflow is
   * fill or width. Default is true for backwards compatiblity.
   */
  legacySpacing = true;

  /**
   * Variable: antiAlias
   *
   * Anti-aliasing option for new shapes. Default is true.
   */
  antiAlias = true;

  /**
   * Variable: minSvgStrokeWidth
   *
   * Minimum stroke width for SVG output.
   */
  minSvgStrokeWidth = 1;

  /**
   * Variable: forceControlClickHandler
   *
   * Specifies if the enabled state of the graph should be ignored in the control
   * click handler (to allow folding in disabled graphs). Default is false.
   */
  forceControlClickHandler = false;

  /**
   * Registers the given constructor under the specified key in this instance of the renderer.
   * @example
   * ```
   * mxCellRenderer.registerShape(mxConstants.SHAPE_RECTANGLE, mxRectangleShape);
   * ```
   *
   * @param key the shape name.
   * @param shape constructor of the {@link Shape} subclass.
   */
  static registerShape(key: string, shape: typeof Shape) {
    CellRenderer.defaultShapes[key] = shape;
  }

  /**
   * Function: initializeShape
   *
   * Initializes the shape in the given state by calling its init method with
   * the correct container after configuring it using <configureShape>.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shape should be initialized.
   */
  initializeShape(state: CellState) {
    if (state.shape) {
      state.shape.dialect = state.view.graph.dialect;
      this.configureShape(state);
      state.shape.init(state.view.getDrawPane());
    }
  }

  /**
   * Function: createShape
   *
   * Creates and returns the shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shape should be created.
   */
  createShape(state: CellState) {
    let shape = null;

    // Checks if there is a stencil for the name and creates
    // a shape instance for the stencil if one exists
    const stencil = StencilShapeRegistry.getStencil(state.style.shape);

    if (stencil) {
      shape = new Shape(stencil);
    } else {
      const ctor = this.getShapeConstructor(state);
      shape = new ctor();
    }

    return shape;
  }

  /**
   * Function: createIndicatorShape
   *
   * Creates the indicator shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the indicator shape should be created.
   */
  createIndicatorShape(state: CellState) {
    if (state.shape) {
      state.shape.indicatorShape = this.getShape(state.getIndicatorShape());
    }
  }

  /**
   * Function: getShape
   *
   * Returns the shape for the given name from <defaultShapes>.
   */
  getShape(name: string | null) {
    return name ? CellRenderer.defaultShapes[name] : null;
  }

  /**
   * Function: getShapeConstructor
   *
   * Returns the constructor to be used for creating the shape.
   */
  getShapeConstructor(state: CellState) {
    let ctor = this.getShape(state.style.shape);

    if (!ctor) {
      // @ts-expect-error The various Shape constructors are not compatible.
      ctor = state.cell.isEdge() ? this.defaultEdgeShape : this.defaultVertexShape;
    }

    return ctor as typeof Shape;
  }

  /**
   * Function: configureShape
   *
   * Configures the shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shape should be configured.
   */
  configureShape(state: CellState) {
    const shape = state.shape;

    if (shape) {
      shape.apply(state);
      shape.imageSrc = state.getImageSrc();
      shape.indicatorColor = state.getIndicatorColor();
      shape.indicatorStrokeColor = state.style.indicatorStrokeColor;
      shape.indicatorGradientColor = state.getIndicatorGradientColor();
      shape.indicatorDirection = state.style.indicatorDirection;
      shape.indicatorImageSrc = state.getIndicatorImageSrc();
      this.postConfigureShape(state);
    }
  }

  /**
   * Function: postConfigureShape
   *
   * Replaces any reserved words used for attributes, eg. inherit,
   * indicated or swimlane for colors in the shape for the given state.
   * This implementation resolves these keywords on the fill, stroke
   * and gradient color keys.
   */
  postConfigureShape(state: CellState) {
    if (state.shape) {
      this.resolveColor(state, 'indicatorGradientColor', 'gradientColor');
      this.resolveColor(state, 'indicatorColor', 'fillColor');
      this.resolveColor(state, 'gradient', 'gradientColor');
      this.resolveColor(state, 'stroke', 'strokeColor');
      this.resolveColor(state, 'fill', 'fillColor');
    }
  }

  /**
   * Function: checkPlaceholderStyles
   *
   * Resolves special keywords 'inherit', 'indicated' and 'swimlane' and sets
   * the respective color on the shape.
   */
  checkPlaceholderStyles(state: CellState) {
    // LATER: Check if the color has actually changed
    if (state.style) {
      const values = ['inherit', 'swimlane', 'indicated'];
      const styles: (keyof CellStateStyles)[] = [
        'fillColor',
        'strokeColor',
        'gradientColor',
        'fontColor',
      ];

      for (let i = 0; i < styles.length; i += 1) {
        if (values.indexOf(state.style[styles[i]] as string) >= 0) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Function: resolveColor
   *
   * Resolves special keywords 'inherit', 'indicated' and 'swimlane' and sets
   * the respective color on the shape.
   */
  resolveColor(state: CellState, field: string, key: string) {
    const shape: Shape | null = key === 'fontColor' ? state.text : state.shape;

    if (shape) {
      const { graph } = state.view;

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

        referenced = graph.getSwimlane(<Cell>referenced);
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
   * Function: getLabelValue
   *
   * Returns the value to be used for the label.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the label should be created.
   */
  getLabelValue(state: CellState) {
    return state.view.graph.getLabel(state.cell);
  }

  /**
   * Function: createLabel
   *
   * Creates the label for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the label should be created.
   */
  createLabel(state: CellState, value: string) {
    const { graph } = state.view;

    if (state.style.fontSize > 0 || state.style.fontSize == null) {
      // Avoids using DOM node for empty labels
      const isForceHtml = graph.isHtmlLabel(state.cell) || isNode(value);

      state.text = new this.defaultTextShape(
        value,
        new Rectangle(),
        state.style.align ?? ALIGN_CENTER,
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
      state.text.dialect = isForceHtml ? DIALECT_STRICTHTML : state.view.graph.dialect;
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

        if (mxClient.IS_TOUCH || forceGetCell) {
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
              graph.dialect !== DIALECT_SVG && source.nodeName === 'IMG';
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
   * Function: initializeLabel
   *
   * Initiailzes the label with a suitable container.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be initialized.
   */
  initializeLabel(state: CellState, shape: Shape): void {
    if (mxClient.IS_SVG && mxClient.NO_FO && shape.dialect !== DIALECT_SVG) {
      shape.init(state.view.graph.container);
    } else {
      shape.init(state.view.getDrawPane());
    }
  }

  /**
   * Function: createCellOverlays
   *
   * Creates the actual shape for showing the overlay for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the overlay should be created.
   */
  createCellOverlays(state: CellState) {
    const { graph } = state.view;
    const overlays = graph.getCellOverlays(state.cell);
    const dict = new Dictionary<CellOverlay, Shape>();

    for (let i = 0; i < overlays.length; i += 1) {
      const shape = state.overlays.remove(overlays[i]);

      if (!shape) {
        const tmp = new ImageShape(new Rectangle(), overlays[i].image.src);
        tmp.dialect = state.view.graph.dialect;
        tmp.preserveImageAspect = false;
        tmp.overlay = overlays[i];
        this.initializeOverlay(state, tmp);
        this.installCellOverlayListeners(state, overlays[i], tmp);

        if (overlays[i].cursor) {
          tmp.node.style.cursor = overlays[i].cursor;
        }

        dict.put(overlays[i], tmp);
      } else {
        dict.put(overlays[i], shape);
      }
    }

    // Removes unused
    state.overlays.visit((id: any, shape: { destroy: () => void }) => {
      shape.destroy();
    });

    state.overlays = dict;
  }

  /**
   * Function: initializeOverlay
   *
   * Initializes the given overlay.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the overlay should be created.
   * overlay - <mxImageShape> that represents the overlay.
   */
  initializeOverlay(state: CellState, overlay: ImageShape) {
    overlay.init(state.view.getOverlayPane());
  }

  /**
   * Function: installOverlayListeners
   *
   * Installs the listeners for the given <mxCellState>, <mxCellOverlay> and
   * <mxShape> that represents the overlay.
   */
  installCellOverlayListeners(state: CellState, overlay: CellOverlay, shape: Shape) {
    const { graph } = state.view;

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

    if (mxClient.IS_TOUCH) {
      InternalEvent.addListener(shape.node, 'touchend', (evt: Event) => {
        overlay.fireEvent(
          new EventObject(InternalEvent.CLICK, { event: evt, cell: state.cell })
        );
      });
    }
  }

  /**
   * Function: createControl
   *
   * Creates the control for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the control should be created.
   */
  createControl(state: CellState) {
    const { graph } = state.view;
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
   * Function: createControlClickHandler
   *
   * Hook for creating the click handler for the folding icon.
   *
   * Parameters:
   *
   * state - <mxCellState> whose control click handler should be returned.
   */
  createControlClickHandler(state: CellState) {
    const { graph } = state.view;

    return (evt: Event) => {
      if (this.forceControlClickHandler || graph.isEnabled()) {
        const collapse = !state.cell.isCollapsed();
        graph.foldCells(collapse, false, new CellArray(state.cell), false, evt);
        InternalEvent.consume(evt);
      }
    };
  }

  /**
   * Function: initControl
   *
   * Initializes the given control and returns the corresponding DOM node.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the control should be initialized.
   * control - <mxShape> to be initialized.
   * handleEvents - Boolean indicating if mousedown and mousemove should fire events via the graph.
   * clickHandler - Optional function to implement clicks on the control.
   */
  initControl(
    state: CellState,
    control: Shape,
    handleEvents: boolean,
    clickHandler: EventListener
  ): Element {
    const { graph } = state.view;

    // In the special case where the label is in HTML and the display is SVG the image
    // should go into the graph container directly in order to be clickable. Otherwise
    // it is obscured by the HTML label that overlaps the cell.
    const isForceHtml =
      graph.isHtmlLabel(state.cell) && mxClient.NO_FO && graph.dialect === DIALECT_SVG;

    if (isForceHtml) {
      control.dialect = DIALECT_PREFERHTML;
      control.init(graph.container);
      control.node.style.zIndex = String(1);
    } else {
      control.init(state.view.getOverlayPane());
    }

    const node = control.node;

    // Workaround for missing click event on iOS is to check tolerance below
    if (clickHandler && !mxClient.IS_IOS) {
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
      if (clickHandler && mxClient.IS_IOS) {
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
   * Function: isShapeEvent
   *
   * Returns true if the event is for the shape of the given state. This
   * implementation always returns true.
   *
   * Parameters:
   *
   * state - <mxCellState> whose shape fired the event.
   * evt - Mouse event which was fired.
   */
  isShapeEvent(state: CellState, evt: MouseEvent) {
    return true;
  }

  /**
   * Function: isLabelEvent
   *
   * Returns true if the event is for the label of the given state. This
   * implementation always returns true.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label fired the event.
   * evt - Mouse event which was fired.
   */
  isLabelEvent(state: CellState, evt: MouseEvent) {
    return true;
  }

  /**
   * Function: installListeners
   *
   * Installs the event listeners for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the event listeners should be isntalled.
   */
  installListeners(state: CellState) {
    const { graph } = state.view;

    // Workaround for touch devices routing all events for a mouse
    // gesture (down, move, up) via the initial DOM node. Same for
    // HTML images in all IE versions (VML images are working).
    const getState = (evt: MouseEvent) => {
      let result: CellState | null = state;
      const source = getSource(evt);

      if (
        (source &&
          graph.dialect !== DIALECT_SVG &&
          // @ts-ignore nodeName should exist
          source.nodeName === 'IMG') ||
        mxClient.IS_TOUCH
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
   * Function: redrawLabel
   *
   * Redraws the label for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be redrawn.
   */
  redrawLabel(state: CellState, forced: boolean) {
    const { graph } = state.view;
    const value = this.getLabelValue(state);
    const wrapping = graph.isWrapping(state.cell);
    const clipping = graph.isLabelClipped(state.cell);
    const isForceHtml =
      state.view.graph.isHtmlLabel(state.cell) || (value && isNode(value));
    const dialect = isForceHtml ? DIALECT_STRICTHTML : state.view.graph.dialect;
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
   * Function: isTextShapeInvalid
   *
   * Returns true if the style for the text shape has changed.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be checked.
   * shape - <mxText> shape to be checked.
   */
  isTextShapeInvalid(state: CellState, shape: TextShape): boolean {
    function check(property: string, stylename: string, defaultValue: any) {
      let result = false;

      // Workaround for spacing added to directional spacing
      if (
        stylename === 'spacingTop' ||
        stylename === 'spacingRight' ||
        stylename === 'spacingBottom' ||
        stylename === 'spacingLeft'
      ) {
        result =
          // @ts-ignore
          parseFloat(String(shape[property])) - parseFloat(String(shape.spacing)) !==
          (state.style[stylename] || defaultValue);
      } else {
        // @ts-ignore
        result = shape[property] !== (state.style[stylename] || defaultValue);
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
   * Function: redrawLabelShape
   *
   * Called to invoked redraw on the given text shape.
   *
   * Parameters:
   *
   * shape - <mxText> shape to be redrawn.
   */
  redrawLabelShape(shape: TextShape): void {
    shape.redraw();
  }

  /**
   * Function: getTextScale
   *
   * Returns the scaling used for the label of the given state
   *
   * Parameters:
   *
   * state - <mxCellState> whose label scale should be returned.
   */
  getTextScale(state: CellState): number {
    return state.view.scale;
  }

  /**
   * Function: getLabelBounds
   *
   * Returns the bounds to be used to draw the label of the given state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label bounds should be returned.
   */
  getLabelBounds(state: CellState): Rectangle {
    const { graph } = state.view;
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
      const hpos = state.style.labelPosition ?? ALIGN_CENTER;
      const vpos = state.style.verticalLabelPosition ?? ALIGN_MIDDLE;

      if (hpos === ALIGN_CENTER && vpos === ALIGN_MIDDLE) {
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
   * Function: rotateLabelBounds
   *
   * Adds the shape rotation to the given label bounds and
   * applies the alignment and offsets.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label bounds should be rotated.
   * bounds - <mxRectangle> the rectangle to be rotated.
   */
  rotateLabelBounds(state: CellState, bounds: Rectangle): void {
    bounds.y -= state.text!.margin!.y * bounds.height;
    bounds.x -= state.text!.margin!.x * bounds.width;

    if (
      !this.legacySpacing ||
      (state.style.overflow !== 'fill' && state.style.overflow !== 'width')
    ) {
      const s = state.view.scale;
      const spacing = state.text!.getSpacing();
      bounds.x += spacing.x * s;
      bounds.y += spacing.y * s;

      const hpos = state.style.labelPosition ?? ALIGN_CENTER;
      const vpos = state.style.verticalLabelPosition ?? ALIGN_MIDDLE;
      const lw = state.style.labelWidth ?? null;

      bounds.width = Math.max(
        0,
        bounds.width -
          (hpos === ALIGN_CENTER && lw == null
            ? // @ts-ignore
              state.text.spacingLeft * s + state.text.spacingRight * s
            : 0)
      );
      bounds.height = Math.max(
        0,
        bounds.height -
          (vpos === ALIGN_MIDDLE
            ? // @ts-ignore
              state.text.spacingTop * s + state.text.spacingBottom * s
            : 0)
      );
    }

    // @ts-ignore
    const theta = state.text.getTextRotation();

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
   * Function: redrawCellOverlays
   *
   * Redraws the overlays for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose overlays should be redrawn.
   */
  redrawCellOverlays(state: CellState, forced: boolean = false): void {
    this.createCellOverlays(state);

    if (state.overlays != null) {
      const rot = mod(state.style.rotation ?? 0, 90);
      const rad = toRadians(rot);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      state.overlays.visit((id: string, shape: Shape) => {
        // @ts-ignore
        const bounds = shape.overlay.getBounds(state);

        if (!state.cell.isEdge()) {
          if (state.shape != null && rot !== 0) {
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
   * Function: redrawControl
   *
   * Redraws the control for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose control should be redrawn.
   */
  redrawControl(state: CellState, forced: boolean = false): void {
    const image = state.view.graph.getFoldingImage(state);

    if (state.control != null && image != null) {
      const bounds = this.getControlBounds(state, image.width, image.height);

      const r = this.legacyControlPosition
        ? state.style.rotation ?? 0
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
   * Function: getControlBounds
   *
   * Returns the bounds to be used to draw the control (folding icon) of the
   * given state.
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
   * Function: insertStateAfter
   *
   * Inserts the given array of <mxShapes> after the given nodes in the DOM.
   *
   * Parameters:
   *
   * shapes - Array of <mxShapes> to be inserted.
   * node - Node in <drawPane> after which the shapes should be inserted.
   * htmlNode - Node in the graph container after which the shapes should be inserted that
   * will not go into the <drawPane> (eg. HTML labels without foreignObjects).
   */
  insertStateAfter(
    state: CellState,
    node: HTMLElement | SVGElement | null,
    htmlNode: HTMLElement | SVGElement | null
  ) {
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

          if (shapeNode.parentNode === state.view.graph.container) {
            let { canvas } = state.view;

            while (canvas != null && canvas.parentNode !== state.view.graph.container) {
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
   * Function: getShapesForState
   *
   * Returns the <mxShapes> for the given cell state in the order in which they should
   * appear in the DOM.
   *
   * Parameters:
   *
   * state - <mxCellState> whose shapes should be returned.
   */
  getShapesForState(state: CellState): [Shape | null, TextShape | null, Shape | null] {
    return [state.shape, state.text, state.control];
  }

  /**
   * Function: redraw
   *
   * Updates the bounds or points and scale of the shapes for the given cell
   * state. This is called in mxGraphView.validatePoints as the last step of
   * updating all cells.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shapes should be updated.
   * force - Optional boolean that specifies if the cell should be reconfiured
   * and redrawn without any additional checks.
   * rendering - Optional boolean that specifies if the cell should actually
   * be drawn into the DOM. If this is false then redraw and/or reconfigure
   * will not be called on the shape.
   */
  redraw(state: CellState, force: boolean = false, rendering: boolean = true): void {
    const shapeChanged = this.redrawShape(state, force, rendering);

    if (state.shape != null && rendering) {
      this.redrawLabel(state, shapeChanged);
      this.redrawCellOverlays(state, shapeChanged);
      this.redrawControl(state, shapeChanged);
    }
  }

  /**
   * Function: redrawShape
   *
   * Redraws the shape for the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> whose label should be redrawn.
   */
  redrawShape(
    state: CellState,
    force: boolean = false,
    rendering: boolean = true
  ): boolean {
    let shapeChanged = false;

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

    if (
      state.shape == null &&
      state.view.graph.container != null &&
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
        const selectionCellsHandler = state.view.graph.getPlugin(
          'SelectionCellsHandler'
        ) as SelectionCellsHandler;
        selectionCellsHandler.updateHandler(state);
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
      const selectionCellsHandler = state.view.graph.getPlugin(
        'SelectionCellsHandler'
      ) as SelectionCellsHandler;
      selectionCellsHandler.updateHandler(state);
      force = true;
    }

    // Updates indicator shape
    if (
      state.shape != null &&
      state.shape.indicatorShape != this.getShape(state.getIndicatorShape())
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
   * Function: doRedrawShape
   *
   * Invokes redraw on the shape of the given state.
   */
  doRedrawShape(state: CellState): void {
    state.shape?.redraw();
  }

  /**
   * Function: isShapeInvalid
   *
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
   * Function: destroy
   *
   * Destroys the shapes associated with the given cell state.
   *
   * Parameters:
   *
   * state - <mxCellState> for which the shapes should be destroyed.
   */
  destroy(state: CellState) {
    if (state.shape) {
      if (state.text) {
        state.text.destroy();
        state.text = null;
      }

      state.overlays.visit((id: string, shape: Shape) => {
        shape.destroy();
      });

      state.overlays = new Dictionary();

      if (state.control) {
        state.control.destroy();
        state.control = null;
      }

      state.shape.destroy();
      state.shape = null;
    }
  }
}

// Adds default shapes into the default shapes array
// @ts-ignore
CellRenderer.registerShape(SHAPE_RECTANGLE, RectangleShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_ELLIPSE, EllipseShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_RHOMBUS, RhombusShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_CYLINDER, CylinderShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_CONNECTOR, ConnectorShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_ACTOR, ActorShape);
CellRenderer.registerShape(SHAPE_TRIANGLE, TriangleShape);
CellRenderer.registerShape(SHAPE_HEXAGON, HexagonShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_CLOUD, CloudShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_LINE, LineShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_ARROW, ArrowShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_ARROW_CONNECTOR, ArrowConnectorShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_DOUBLE_ELLIPSE, DoubleEllipseShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_SWIMLANE, SwimlaneShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_IMAGE, ImageShape);
// @ts-ignore
CellRenderer.registerShape(SHAPE_LABEL, LabelShape);

export default CellRenderer;
