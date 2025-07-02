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

import EventSource from '../event/EventSource.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
import { sortCells } from '../../util/styleUtils.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import Cell from '../cell/Cell.js';
import CellState from '../cell/CellState.js';
import type { GraphPlugin, MouseListenerSet } from '../../types.js';
import type EdgeHandler from '../handler/EdgeHandler.js';
import type VertexHandler from '../handler/VertexHandler.js';
import InternalMouseEvent from '../event/InternalMouseEvent.js';

type Handler = EdgeHandler | VertexHandler;

/**
 * An event handler that manages cell handlers and invokes their mouse event processing functions.
 *
 * ### Events
 *
 * #### InternalEvent.ADD
 *
 * Fires if a cell has been added to the selection.
 * The `state` property contains the {@link CellState} that has been added.
 *
 * #### InternalEvent.REMOVE
 *
 * Fires if a cell has been remove from the selection.
 * The `state` property contains the {@link CellState} that has been removed.
 *
 * @category Plugin
 */
class SelectionCellsHandler extends EventSource implements GraphPlugin, MouseListenerSet {
  static readonly pluginId = 'SelectionCellsHandler';

  constructor(graph: AbstractGraph) {
    super();

    this.graph = graph;
    this.handlers = new Map();
    this.graph.addMouseListener(this);

    this.refreshHandler = (sender: EventSource, evt: EventObject) => {
      if (this.isEnabled()) {
        this.refresh();
      }
    };

    this.graph.getSelectionModel().addListener(InternalEvent.CHANGE, this.refreshHandler);
    this.graph.getDataModel().addListener(InternalEvent.CHANGE, this.refreshHandler);
    this.graph.getView().addListener(InternalEvent.SCALE, this.refreshHandler);
    this.graph.getView().addListener(InternalEvent.TRANSLATE, this.refreshHandler);
    this.graph
      .getView()
      .addListener(InternalEvent.SCALE_AND_TRANSLATE, this.refreshHandler);
    this.graph.getView().addListener(InternalEvent.DOWN, this.refreshHandler);
    this.graph.getView().addListener(InternalEvent.UP, this.refreshHandler);
  }

  /**
   * Reference to the enclosing {@link AbstractGraph}.
   */
  graph: AbstractGraph;

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
   * {@link Dictionary} that maps from cells to handlers.
   */
  handlers: Map<Cell, Handler>;

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
    this.handlers.forEach((handler) => {
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
    this.handlers = new Map();

    // Creates handles for all selection cells
    const tmp = sortCells(this.getHandledSelectionCells(), false);

    // Destroys or updates old handlers
    for (let i = 0; i < tmp.length; i += 1) {
      const state = this.graph.view.getState(tmp[i]);

      if (state) {
        let handler = oldHandlers.get(tmp[i]) ?? null;
        oldHandlers.delete(tmp[i]);

        if (handler) {
          if (handler.state !== state) {
            handler.onDestroy();
            handler = null;
          } else if (!this.isHandlerActive(handler)) {
            // @ts-ignore refresh may exist
            if (handler.refresh) handler.refresh();

            handler.redraw();
          }
        }

        if (handler) {
          this.handlers.set(tmp[i], handler);
        }
      }
    }

    // Destroys unused handlers
    oldHandlers.forEach((handler) => {
      this.fireEvent(new EventObject(InternalEvent.REMOVE, { state: handler.state }));
      handler.onDestroy();
    });

    // Creates new handlers and updates parent highlight on existing handlers
    for (let i = 0; i < tmp.length; i += 1) {
      const state = this.graph.view.getState(tmp[i]);

      if (state) {
        let handler = this.handlers.get(tmp[i]);

        if (!handler) {
          handler = this.graph.createHandler(state);
          this.fireEvent(new EventObject(InternalEvent.ADD, { state }));
          this.handlers.set(tmp[i], handler);
        } else {
          handler.updateParentHighlight();
        }
      }
    }
  }

  /**
   * Returns true if the given handler is active and should not be redrawn.
   */
  isHandlerActive(handler: Handler) {
    return handler.index !== null;
  }

  /**
   * Updates the handler for the given shape if one exists.
   */
  updateHandler(state: CellState) {
    let handler = this.handlers.get(state.cell);
    this.handlers.delete(state.cell);

    if (handler) {
      // Transfers the current state to the new handler
      const { index } = handler;
      const x = handler.startX;
      const y = handler.startY;

      handler.onDestroy();
      handler = this.graph.createHandler(state);

      if (handler) {
        this.handlers.set(state.cell, handler);

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
      this.handlers.forEach((handler) => {
        handler.mouseDown(sender, me);
      });
    }
  }

  /**
   * Redirects the given event to the handlers.
   */
  mouseMove(sender: EventSource, me: InternalMouseEvent) {
    if (this.graph.isEnabled() && this.isEnabled()) {
      this.handlers.forEach((handler) => {
        handler.mouseMove(sender, me);
      });
    }
  }

  /**
   * Redirects the given event to the handlers.
   */
  mouseUp(sender: EventSource, me: InternalMouseEvent) {
    if (this.graph.isEnabled() && this.isEnabled()) {
      this.handlers.forEach((handler) => {
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
    this.graph.getDataModel().removeListener(this.refreshHandler);
    this.graph.getView().removeListener(this.refreshHandler);
  }
}

export default SelectionCellsHandler;
