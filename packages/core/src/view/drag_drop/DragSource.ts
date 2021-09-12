/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Rectangle from '../geometry/Rectangle';
import CellHighlight from '../selection/CellHighlight';
import {
  getDocumentScrollOrigin,
  getOffset,
  getScrollOrigin,
  setOpacity,
} from '../../util/Utils';
import InternalEvent from '../event/InternalEvent';
import mxClient from '../../mxClient';
import mxGuide from '../../util/Guide';
import { DROP_TARGET_COLOR } from '../../util/Constants';
import Point from '../geometry/Point';
import {
  getClientX,
  getClientY,
  getSource,
  isConsumed,
  isMouseEvent,
  isPenEvent,
  isTouchEvent,
} from '../../util/EventUtils';
import EventSource from '../event/EventSource';
import EventObject from '../event/EventObject';
import { Graph } from '../Graph';
import Guide from '../../util/Guide';
import Cell from '../cell/datatypes/Cell';
import GraphHandler from '../GraphHandler';

type DropHandler = (
  graph: Graph,
  evt: MouseEvent,
  cell: Cell | null,
  x?: number,
  y?: number
) => void;

/**
 * @class DragSource
 *
 * Wrapper to create a drag source from a DOM element so that the element can
 * be dragged over a graph and dropped into the graph as a new cell.
 *
 * Problem is that in the dropHandler the current preview location is not
 * available, so the preview and the dropHandler must match.
 *
 */
class DragSource {
  constructor(element: EventTarget, dropHandler: DropHandler) {
    this.element = element;
    this.dropHandler = dropHandler;

    // Handles a drag gesture on the element
    InternalEvent.addGestureListeners(element, (evt) => {
      this.mouseDown(evt);
    });

    // Prevents native drag and drop
    InternalEvent.addListener(element, 'dragstart', (evt: MouseEvent) => {
      InternalEvent.consume(evt);
    });

    this.eventConsumer = (sender: EventSource, evt: EventObject) => {
      const evtName = evt.getProperty('eventName');
      const me = evt.getProperty('event');

      if (evtName !== InternalEvent.MOUSE_DOWN) {
        me.consume();
      }
    };
  }

  /**
   * Reference to the DOM node which was made draggable.
   */
  element: EventTarget;

  /**
   * Holds the DOM node that is used to represent the drag preview. If this is
   * null then the source element will be cloned and used for the drag preview.
   */
  dropHandler: DropHandler;

  eventConsumer: (sender: EventSource, evt: EventObject) => void;

  /**
   * {@link Point} that specifies the offset of the {@link dragElement}. Default is null.
   */
  dragOffset: Point | null = null;

  /**
   * Holds the DOM node that is used to represent the drag preview. If this is
   * null then the source element will be cloned and used for the drag preview.
   */
  dragElement: HTMLElement | null = null;

  /**
   * TODO - wrong description
   * Optional {@link Rectangle} that specifies the unscaled size of the preview.
   */
  previewElement: HTMLElement | null = null;

  /**
   * Variable: previewOffset
   *
   * Optional <mxPoint> that specifies the offset of the preview in pixels.
   */
  previewOffset: Point | null = null;

  /**
   * Specifies if this drag source is enabled. Default is true.
   */
  enabled = true;

  /**
   * Reference to the {@link mxGraph} that is the current drop target.
   */
  currentGraph: Graph | null = null;

  /**
   * Holds the current drop target under the mouse.
   */
  currentDropTarget: Cell | null = null;

  /**
   * Holds the current drop location.
   */
  currentPoint: Point | null = null;

  /**
   * Holds an {@link mxGuide} for the {@link currentGraph} if {@link dragPreview} is not null.
   */
  currentGuide: Guide | null = null;

  /**
   * Holds an {@link mxGuide} for the {@link currentGraph} if {@link dragPreview} is not null.
   * @note wrong doc
   */
  currentHighlight: CellHighlight | null = null;

  /**
   * Specifies if the graph should scroll automatically. Default is true.
   */
  autoscroll = true;

  /**
   * Specifies if {@link mxGuide} should be enabled. Default is true.
   */
  guidesEnabled = true;

  /**
   * Specifies if the grid should be allowed. Default is true.
   */
  gridEnabled = true;

  /**
   * Specifies if drop targets should be highlighted. Default is true.
   */
  highlightDropTargets = true;

  /**
   * ZIndex for the drag element. Default is 100.
   */
  dragElementZIndex = 100;

  /**
   * Opacity of the drag element in %. Default is 70.
   */
  dragElementOpacity = 70;

  /**
   * Whether the event source should be checked in {@link graphContainerEvent}. Default
   * is true.
   */
  checkEventSource = true;

  mouseMoveHandler: ((evt: MouseEvent) => void) | null = null;
  mouseUpHandler: ((evt: MouseEvent) => void) | null = null;

  eventSource: EventTarget | null = null;

  /**
   * Returns {@link enabled}.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Sets {@link enabled}.
   */
  setEnabled(value: boolean) {
    this.enabled = value;
  }

  /**
   * Returns {@link guidesEnabled}.
   */
  isGuidesEnabled() {
    return this.guidesEnabled;
  }

  /**
   * Sets {@link guidesEnabled}.
   */
  setGuidesEnabled(value: boolean) {
    this.guidesEnabled = value;
  }

  /**
   * Returns {@link gridEnabled}.
   */
  isGridEnabled() {
    return this.gridEnabled;
  }

  /**
   * Sets {@link gridEnabled}.
   */
  setGridEnabled(value: boolean) {
    this.gridEnabled = value;
  }

  /**
   * Returns the graph for the given mouse event. This implementation returns
   * null.
   */
  getGraphForEvent(evt: MouseEvent) {
    return null;
  }

  /**
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses {@link mxGraph.getCellAt}.
   */
  getDropTarget(graph: Graph, x: number, y: number, evt: MouseEvent) {
    return graph.getCellAt(x, y);
  }

  /**
   * Creates and returns a clone of the {@link dragElementPrototype} or the {@link element}
   * if the former is not defined.
   */
  createDragElement(evt: MouseEvent) {
    return (this.element as HTMLElement).cloneNode(true) as HTMLElement;
  }

  /**
   * Creates and returns an element which can be used as a preview in the given
   * graph.
   */
  createPreviewElement(graph: Graph): HTMLElement | null {
    return null;
  }

  /**
   * Returns true if this drag source is active.
   */
  isActive() {
    return !!this.mouseMoveHandler;
  }

  /**
   * Stops and removes everything and restores the state of the object.
   */
  reset() {
    if (this.currentGraph) {
      this.dragExit(this.currentGraph);
      this.currentGraph = null;
    }

    this.removeDragElement();
    this.removeListeners();
    this.stopDrag();
  }

  /**
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses {@link mxGraph.getCellAt}.
   *
   * To ignore popup menu events for a drag source, this function can be
   * overridden as follows.
   *
   * @example
   * ```javascript
   * var mouseDown = dragSource.mouseDown;
   *
   * dragSource.mouseDown(evt)
   * {
   *   if (!mxEvent.isPopupTrigger(evt))
   *   {
   *     mouseDown.apply(this, arguments);
   *   }
   * };
   * ```
   */
  mouseDown(evt: MouseEvent) {
    if (this.enabled && !isConsumed(evt) && this.mouseMoveHandler == null) {
      this.startDrag(evt);
      this.mouseMoveHandler = this.mouseMove.bind(this);
      this.mouseUpHandler = this.mouseUp.bind(this);
      InternalEvent.addGestureListeners(
        document,
        null,
        this.mouseMoveHandler,
        this.mouseUpHandler
      );

      if (mxClient.IS_TOUCH && !isMouseEvent(evt)) {
        this.eventSource = getSource(evt);

        if (this.eventSource) {
          InternalEvent.addGestureListeners(
            this.eventSource,
            null,
            this.mouseMoveHandler,
            this.mouseUpHandler
          );
        }
      }
    }
  }

  /**
   * Creates the {@link dragElement} using {@link createDragElement}.
   */
  startDrag(evt: MouseEvent) {
    this.dragElement = this.createDragElement(evt);
    this.dragElement.style.position = 'absolute';
    this.dragElement.style.zIndex = String(this.dragElementZIndex);
    setOpacity(this.dragElement, this.dragElementOpacity);

    if (this.checkEventSource && mxClient.IS_SVG) {
      this.dragElement.style.pointerEvents = 'none';
    }
  }

  /**
   * Invokes {@link removeDragElement}.
   */
  stopDrag() {
    // LATER: This used to have a mouse event. If that is still needed we need to add another
    // final call to the DnD protocol to add a cleanup step in the case of escape press, which
    // is not associated with a mouse event and which currently calles this method.
    this.removeDragElement();
  }

  /**
   * Removes and destroys the {@link dragElement}.
   */
  removeDragElement() {
    if (this.dragElement) {
      if (this.dragElement.parentNode) {
        this.dragElement.parentNode.removeChild(this.dragElement);
      }

      this.dragElement = null;
    }
  }

  /**
   * Returns the topmost element under the given event.
   */
  getElementForEvent(evt: MouseEvent) {
    return isTouchEvent(evt) || isPenEvent(evt)
      ? document.elementFromPoint(getClientX(evt), getClientY(evt))
      : getSource(evt);
  }

  /**
   * Returns true if the given graph contains the given event.
   */
  graphContainsEvent(graph: Graph, evt: MouseEvent) {
    const x = getClientX(evt);
    const y = getClientY(evt);
    const offset = getOffset(graph.container);
    const origin = getScrollOrigin();
    let elt = this.getElementForEvent(evt);

    if (this.checkEventSource) {
      while (elt && elt !== graph.container) {
        // @ts-ignore parentNode may exist
        elt = elt.parentNode;
      }
    }

    // Checks if event is inside the bounds of the graph container
    return (
      !!elt &&
      x >= offset.x - origin.x &&
      y >= offset.y - origin.y &&
      x <= offset.x - origin.x + graph.container.offsetWidth &&
      y <= offset.y - origin.y + graph.container.offsetHeight
    );
  }

  /**
   * Gets the graph for the given event using {@link getGraphForEvent}, updates the
   * {@link currentGraph}, calling {@link dragEnter} and {@link dragExit} on the new and old graph,
   * respectively, and invokes {@link dragOver} if {@link currentGraph} is not null.
   */
  mouseMove(evt: MouseEvent) {
    let graph = this.getGraphForEvent(evt);

    // Checks if event is inside the bounds of the graph container
    if (graph && !this.graphContainsEvent(graph, evt)) {
      graph = null;
    }

    if (graph !== this.currentGraph) {
      if (this.currentGraph) {
        this.dragExit(this.currentGraph, evt);
      }

      this.currentGraph = graph;

      if (this.currentGraph) {
        this.dragEnter(this.currentGraph, evt);
      }
    }

    if (this.currentGraph) {
      this.dragOver(this.currentGraph, evt);
    }

    if (
      this.dragElement &&
      (!this.previewElement || this.previewElement.style.visibility !== 'visible')
    ) {
      let x = getClientX(evt);
      let y = getClientY(evt);

      if (this.dragElement.parentNode == null) {
        document.body.appendChild(this.dragElement);
      }

      this.dragElement.style.visibility = 'visible';

      if (this.dragOffset) {
        x += this.dragOffset.x;
        y += this.dragOffset.y;
      }

      const offset = getDocumentScrollOrigin(document);

      this.dragElement.style.left = `${x + offset.x}px`;
      this.dragElement.style.top = `${y + offset.y}px`;
    } else if (this.dragElement) {
      this.dragElement.style.visibility = 'hidden';
    }

    InternalEvent.consume(evt);
  }

  /**
   * Processes the mouse up event and invokes {@link drop}, {@link dragExit} and {@link stopDrag}
   * as required.
   */
  mouseUp(evt: MouseEvent) {
    if (this.currentGraph) {
      if (
        this.currentPoint &&
        (!this.previewElement || this.previewElement.style.visibility !== 'hidden')
      ) {
        const { scale } = this.currentGraph.view;
        const tr = this.currentGraph.view.translate;
        const x = this.currentPoint.x / scale - tr.x;
        const y = this.currentPoint.y / scale - tr.y;

        this.drop(this.currentGraph, evt, this.currentDropTarget, x, y);
      }

      this.dragExit(this.currentGraph);
      this.currentGraph = null;
    }

    this.stopDrag();
    this.removeListeners();

    InternalEvent.consume(evt);
  }

  /**
   * Actives the given graph as a drop target.
   */
  // removeListeners(): void;
  removeListeners() {
    if (this.eventSource) {
      InternalEvent.removeGestureListeners(
        this.eventSource,
        null,
        this.mouseMoveHandler,
        this.mouseUpHandler
      );
      this.eventSource = null;
    }

    InternalEvent.removeGestureListeners(
      document,
      null,
      this.mouseMoveHandler,
      this.mouseUpHandler
    );
    this.mouseMoveHandler = null;
    this.mouseUpHandler = null;
  }

  /**
   * Actives the given graph as a drop target.
   */
  dragEnter(graph: Graph, evt: MouseEvent) {
    graph.isMouseDown = true;
    graph.isMouseTrigger = isMouseEvent(evt);
    this.previewElement = this.createPreviewElement(graph);

    if (this.previewElement && this.checkEventSource && mxClient.IS_SVG) {
      this.previewElement.style.pointerEvents = 'none';
    }

    // Guide is only needed if preview element is used
    if (this.isGuidesEnabled() && this.previewElement) {
      const graphHandler = graph.getPlugin('GraphHandler') as GraphHandler;
      this.currentGuide = new mxGuide(graph, graphHandler.getGuideStates());
    }

    if (this.highlightDropTargets) {
      this.currentHighlight = new CellHighlight(graph, DROP_TARGET_COLOR);
    }

    // Consumes all events in the current graph before they are fired
    graph.addListener(InternalEvent.FIRE_MOUSE_EVENT, this.eventConsumer);
  }

  /**
   * Deactivates the given graph as a drop target.
   */
  dragExit(graph: Graph, evt?: MouseEvent) {
    this.currentDropTarget = null;
    this.currentPoint = null;
    graph.isMouseDown = false;

    // Consumes all events in the current graph before they are fired
    graph.removeListener(this.eventConsumer);

    if (this.previewElement) {
      if (this.previewElement.parentNode) {
        this.previewElement.parentNode.removeChild(this.previewElement);
      }

      this.previewElement = null;
    }

    if (this.currentGuide) {
      this.currentGuide.destroy();
      this.currentGuide = null;
    }

    if (this.currentHighlight) {
      this.currentHighlight.destroy();
      this.currentHighlight = null;
    }
  }

  /**
   * Implements autoscroll, updates the {@link currentPoint}, highlights any drop
   * targets and updates the preview.
   */
  dragOver(graph: Graph, evt: MouseEvent) {
    const offset = getOffset(graph.container);
    const origin = getScrollOrigin(graph.container);
    let x = getClientX(evt) - offset.x + origin.x - graph.getPanDx();
    let y = getClientY(evt) - offset.y + origin.y - graph.getPanDy();

    if (graph.isAutoScroll() && (!this.autoscroll || this.autoscroll)) {
      graph.scrollPointToVisible(x, y, graph.isAutoExtend());
    }

    // Highlights the drop target under the mouse
    if (this.currentHighlight && graph.isDropEnabled()) {
      this.currentDropTarget = this.getDropTarget(graph, x, y, evt);

      if (this.currentDropTarget) {
        const state = graph.getView().getState(this.currentDropTarget);
        this.currentHighlight.highlight(state);
      }
    }

    // Updates the location of the preview
    if (this.previewElement) {
      if (!this.previewElement.parentNode) {
        graph.container.appendChild(this.previewElement);

        this.previewElement.style.zIndex = '3';
        this.previewElement.style.position = 'absolute';
      }

      const gridEnabled = this.isGridEnabled() && graph.isGridEnabledEvent(evt);
      let hideGuide = true;

      // Grid and guides
      if (this.currentGuide && this.currentGuide.isEnabledForEvent(evt)) {
        // LATER: HTML preview appears smaller than SVG preview
        const w = parseInt(this.previewElement.style.width);
        const h = parseInt(this.previewElement.style.height);
        const bounds = new Rectangle(0, 0, w, h);
        let delta = new Point(x, y);
        delta = this.currentGuide.move(bounds, delta, gridEnabled, true);
        hideGuide = false;
        x = delta.x;
        y = delta.y;
      } else if (gridEnabled) {
        const { scale } = graph.view;
        const tr = graph.view.translate;
        const off = graph.getGridSize() / 2;
        x = (graph.snap(x / scale - tr.x - off) + tr.x) * scale;
        y = (graph.snap(y / scale - tr.y - off) + tr.y) * scale;
      }

      if (this.currentGuide && hideGuide) {
        this.currentGuide.hide();
      }

      if (this.previewOffset) {
        x += this.previewOffset.x;
        y += this.previewOffset.y;
      }

      this.previewElement.style.left = `${Math.round(x)}px`;
      this.previewElement.style.top = `${Math.round(y)}px`;
      this.previewElement.style.visibility = 'visible';
    }

    this.currentPoint = new Point(x, y);
  }

  /**
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses {@link mxGraph.getCellAt}.
   */
  drop(
    graph: Graph,
    evt: MouseEvent,
    dropTarget: Cell | null = null,
    x: number,
    y: number
  ) {
    this.dropHandler(graph, evt, dropTarget, x, y);

    // Had to move this to after the insert because it will
    // affect the scrollbars of the window in IE to try and
    // make the complete container visible.
    // LATER: Should be made optional.
    if (graph.container.style.visibility !== 'hidden') {
      graph.container.focus();
    }
  }
}

export default DragSource;
