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
import type {
  EdgeStyleFunction,
  EdgeStyleHandlerKind,
  GraphPlugin,
  MouseListenerSet,
} from '../../types.js';
import EdgeHandler from '../handler/EdgeHandler.js';
import VertexHandler from '../handler/VertexHandler.js';
import InternalMouseEvent from '../event/InternalMouseEvent.js';
import ElbowEdgeHandler from '../handler/ElbowEdgeHandler';
import EdgeSegmentHandler from '../handler/EdgeSegmentHandler';
import { EdgeStyleRegistry } from '../style/edge/EdgeStyleRegistry';

// TODO export and move to types.ts and rename to CellHandler
type Handler = EdgeHandler | VertexHandler;

// TODO export and move to types.ts
// TODO review the name
type VertexHandlerFactoryFunction = (state: CellState) => VertexHandler;
type EdgeHandlerFactoryFunction = (state: CellState) => EdgeHandler;
// type EdgeHandlerFactoryFunction<T extends EdgeHandler> = (state: CellState) => T;

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

  private vertexHandlerFactory: VertexHandlerFactoryFunction = (state: CellState) => {
    return new VertexHandler(state);
  };

  private edgeHandlerFactories = new Map<
    EdgeStyleHandlerKind,
    EdgeHandlerFactoryFunction
  >([
    ['default', (state: CellState) => new EdgeHandler(state)],
    ['elbow', (state: CellState) => new ElbowEdgeHandler(state)],
    ['segment', (state: CellState) => new EdgeSegmentHandler(state)],
  ]);

  constructor(graph: AbstractGraph) {
    super();

    this.graph = graph;
    this.handlers = new Map();
    this.graph.addMouseListener(this);

    this.refreshHandler = () => {
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
   * Specifies if events are handled.
   * @default true
   */
  enabled = true;

  /**
   * Keeps a reference to an event listener for later removal.
   */
  refreshHandler: (sender: EventSource, evt: EventObject) => void;

  /**
   * Defines the maximum number of handlers to paint individually.
   * @default 100
   */
  maxHandlers = 100;

  /**
   * Maps from cells to handlers.
   */
  handlers: Map<Cell, Handler>;

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
          handler = this.createHandler(state);
          this.fireEvent(new EventObject(InternalEvent.ADD, { state }));
          this.handlers.set(tmp[i], handler);
        } else {
          handler.updateParentHighlight();
        }
      }
    }
  }

  /**
   * Hooks to create a new handler for the given cell state.
   *
   * This implementation returns a new {@link EdgeHandler} of the corresponding cell is an edge,
   * otherwise it returns an {@link VertexHandler}.
   *
   * @param state {@link CellState} whose handler should be created.
   */
  protected createHandler(state: CellState): Handler {
    if (state.cell.isEdge()) {
      const source = state.getVisibleTerminalState(true);
      const target = state.getVisibleTerminalState(false);
      const geo = state.cell.getGeometry();

      // TODO test parameters pass to the function
      const edgeStyle = this.graph.view.getEdgeStyle(
        state,
        // TODO check if this can be replaced by geo?.points
        geo ? geo.points || undefined : undefined,
        source,
        target
      );

      return this.createEdgeHandler(state, edgeStyle);
    }
    return this.vertexHandlerFactory(state);
  }

  /**
   * Hooks to create a new {@link EdgeHandler} for the given {@link CellState}.
   *
   * This method relies on the registered elements in {@link EdgeStyleRegistry} to know which {@link EdgeHandler} to create.
   * If the `EdgeStyle` is not registered, it will return a default {@link EdgeHandler}.
   *
   * @param state {@link CellState} to create the handler for.
   * @param edgeStyle the {@link EdgeStyleFunction} that let choose the actual edge handler.
   */
  protected createEdgeHandler(
    state: CellState,
    edgeStyle: EdgeStyleFunction | null
  ): EdgeHandler {
    const handlerKind = EdgeStyleRegistry.getHandlerKind(edgeStyle);
    return (
      this.edgeHandlerFactories.get(handlerKind)?.(state) ??
      // there is always an entry for 'default'
      this.edgeHandlerFactories.get('default')!(state)
    );
  }

  configureVertexHandler(factory: VertexHandlerFactoryFunction): void {
    this.vertexHandlerFactory = factory;
  }

  configureEdgeHandler(
    handlerKind: EdgeStyleHandlerKind,
    factory: EdgeHandlerFactoryFunction
  ): void {
    this.edgeHandlerFactories.set(handlerKind, factory);
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
      handler = this.createHandler(state);

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
