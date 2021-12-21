/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import EventSource from '../event/EventSource';
import Dictionary from '../../util/Dictionary';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import { sortCells } from '../../util/styleUtils';
import { Graph } from '../Graph';
import Cell from '../cell/Cell';
import CellState from '../cell/CellState';
import { GraphPlugin } from '../../types';
import EdgeHandler from './EdgeHandler';
import VertexHandler from './VertexHandler';
import InternalMouseEvent from '../event/InternalMouseEvent';

/**
 * An event handler that manages cell handlers and invokes their mouse event
 * processing functions.
 *
 * Group: Events
 *
 * Event: mxEvent.ADD
 *
 * Fires if a cell has been added to the selection. The <code>state</code>
 * property contains the <CellState> that has been added.
 *
 * Event: mxEvent.REMOVE
 *
 * Fires if a cell has been remove from the selection. The <code>state</code>
 * property contains the <CellState> that has been removed.
 *
 * @param graph Reference to the enclosing <mxGraph>.
 */
class SelectionCellsHandler extends EventSource implements GraphPlugin {
  static pluginId = 'SelectionCellsHandler';

  constructor(graph: Graph) {
    super();

    this.graph = graph;
    this.handlers = new Dictionary();
    this.graph.addMouseListener(this);

    this.refreshHandler = (sender: EventSource, evt: EventObject) => {
      if (this.isEnabled()) {
        this.refresh();
      }
    };

    this.graph.addListener(InternalEvent.CHANGE, this.refreshHandler);
    this.graph.getModel().addListener(InternalEvent.CHANGE, this.refreshHandler);
    this.graph.getView().addListener(InternalEvent.SCALE, this.refreshHandler);
    this.graph.getView().addListener(InternalEvent.TRANSLATE, this.refreshHandler);
    this.graph
      .getView()
      .addListener(InternalEvent.SCALE_AND_TRANSLATE, this.refreshHandler);
    this.graph.getView().addListener(InternalEvent.DOWN, this.refreshHandler);
    this.graph.getView().addListener(InternalEvent.UP, this.refreshHandler);
  }

  /**
   * Reference to the enclosing <mxGraph>.
   */
  graph: Graph;

  /**
   * Specifies if events are handled. Default is true.
   */
  enabled = true;

  /**
   * Keeps a reference to an event listener for later removal.
   */
  refreshHandler: (sender: EventSource, evt: EventObject) => void;

  /**
   * Defines the maximum number of handlers to paint individually. Default is 100.
   */
  maxHandlers = 100;

  /**
   * <mxDictionary> that maps from cells to handlers.
   */
  handlers: Dictionary<Cell, EdgeHandler | VertexHandler>;

  /**
   * Returns <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Sets <enabled>.
   */
  setEnabled(value: boolean) {
    this.enabled = value;
  }

  /**
   * Returns the handler for the given cell.
   */
  getHandler(cell: Cell) {
    return this.handlers.get(cell);
  }

  /**
   * Returns true if the given cell has a handler.
   */
  isHandled(cell: Cell) {
    return !!this.getHandler(cell);
  }

  /**
   * Resets all handlers.
   */
  reset() {
    this.handlers.visit((key, handler) => {
      handler.reset.apply(handler);
    });
  }

  /**
   * Reloads or updates all handlers.
   */
  getHandledSelectionCells() {
    return this.graph.getSelectionCells();
  }

  /**
   * Reloads or updates all handlers.
   */
  refresh() {
    // Removes all existing handlers
    const oldHandlers = this.handlers;
    this.handlers = new Dictionary();

    // Creates handles for all selection cells
    const tmp = sortCells(this.getHandledSelectionCells(), false);

    // Destroys or updates old handlers
    for (let i = 0; i < tmp.length; i += 1) {
      const state = this.graph.view.getState(tmp[i]);

      if (state) {
        let handler = oldHandlers.remove(tmp[i]);

        if (handler) {
          if (handler.state !== state) {
            handler.destroy();
            handler = null;
          } else if (!this.isHandlerActive(handler)) {
            // @ts-ignore refresh may exist
            if (handler.refresh) handler.refresh();

            handler.redraw();
          }
        }

        if (handler) {
          this.handlers.put(tmp[i], handler);
        }
      }
    }

    // Destroys unused handlers
    oldHandlers.visit((key, handler) => {
      this.fireEvent(new EventObject(InternalEvent.REMOVE, 'state', handler.state));
      handler.destroy();
    });

    // Creates new handlers and updates parent highlight on existing handlers
    for (let i = 0; i < tmp.length; i += 1) {
      const state = this.graph.view.getState(tmp[i]);

      if (state) {
        let handler = this.handlers.get(tmp[i]);

        if (!handler) {
          handler = this.graph.createHandler(state);
          this.fireEvent(new EventObject(InternalEvent.ADD, 'state', state));
          this.handlers.put(tmp[i], handler);
        } else {
          handler.updateParentHighlight();
        }
      }
    }
  }

  /**
   * Returns true if the given handler is active and should not be redrawn.
   */
  isHandlerActive(handler: EdgeHandler | VertexHandler) {
    return handler.index !== null;
  }

  /**
   * Updates the handler for the given shape if one exists.
   */
  updateHandler(state: CellState) {
    let handler = this.handlers.remove(state.cell);

    if (handler) {
      // Transfers the current state to the new handler
      const { index } = handler;
      const x = handler.startX;
      const y = handler.startY;

      handler.destroy();
      handler = this.graph.createHandler(state);

      if (handler) {
        this.handlers.put(state.cell, handler);

        if (index !== null) {
          handler.start(x, y, index);
        }
      }
    }
  }

  /**
   * Redirects the given event to the handlers.
   */
  mouseDown(sender: EventSource, me: InternalMouseEvent) {
    if (this.graph.isEnabled() && this.isEnabled()) {
      this.handlers.visit((key, handler) => {
        handler.mouseDown(sender, me);
      });
    }
  }

  /**
   * Redirects the given event to the handlers.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    if (this.graph.isEnabled() && this.isEnabled()) {
      this.handlers.visit((key, handler) => {
        handler.mouseMove(sender, me);
      });
    }
  }

  /**
   * Redirects the given event to the handlers.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    if (this.graph.isEnabled() && this.isEnabled()) {
      this.handlers.visit((key, handler) => {
        handler.mouseUp(sender, me);
      });
    }
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   */
  onDestroy() {
    this.graph.removeMouseListener(this);
    this.graph.removeListener(this.refreshHandler);
    this.graph.getModel().removeListener(this.refreshHandler);
    this.graph.getView().removeListener(this.refreshHandler);
  }
}

export default SelectionCellsHandler;
