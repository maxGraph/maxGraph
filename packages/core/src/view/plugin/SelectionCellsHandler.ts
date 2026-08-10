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
  CellHandler,
  EdgeHandlerFactory,
  EdgeStyleFunction,
  EdgeStyleHandlerKind,
  GraphPlugin,
  MouseListenerSet,
  VertexHandlerFactory,
} from '../../types.js';
import EdgeHandler from '../handler/EdgeHandler.js';
import VertexHandler from '../handler/VertexHandler.js';
import InternalMouseEvent from '../event/InternalMouseEvent.js';
import ElbowEdgeHandler from '../handler/ElbowEdgeHandler.js';
import EdgeSegmentHandler from '../handler/EdgeSegmentHandler.js';
import { EdgeStyleRegistry } from '../style/edge/EdgeStyleRegistry.js';
import { isNullish } from '../../internal/utils.js';

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

  private vertexHandlerFactory: VertexHandlerFactory = (state) => {
    return new VertexHandler(state);
  };

  private readonly edgeHandlerFactories = new Map<
    EdgeStyleHandlerKind,
    EdgeHandlerFactory
  >([
    ['default', (state) => new EdgeHandler(state)],
    ['elbow', (state) => new ElbowEdgeHandler(state)],
    ['segment', (state) => new EdgeSegmentHandler(state)],
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
  handlers: Map<Cell, CellHandler>;

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
   * This implementation returns a new {@link EdgeHandler} if the corresponding cell is an edge,
   * otherwise it returns an {@link VertexHandler}.
   *
   * @param state {@link CellState} whose handler should be created.
   * @since 0.25.0
   */
  createHandler(state: CellState): CellHandler {
    if (state.cell.isEdge()) {
      const source = state.getVisibleTerminalState(true);
      const target = state.getVisibleTerminalState(false);
      const geo = state.cell.getGeometry();

      const edgeStyle = this.graph.view.getEdgeStyle(
        state,
        geo?.points ?? undefined,
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
   * If the `EdgeStyle` is not registered, it will return the {@link EdgeHandler} registered under the 'default' handler kind.
   *
   * @param state {@link CellState} to create the handler for.
   * @param edgeStyle the {@link EdgeStyleFunction} that let choose the actual edge handler.
   * @since 0.25.0
   */
  createEdgeHandler(state: CellState, edgeStyle: EdgeStyleFunction | null): EdgeHandler {
    const handlerKind = EdgeStyleRegistry.getHandlerKind(edgeStyle);
    return (
      this.edgeHandlerFactories.get(handlerKind)?.(state) ??
      // there is always an entry for 'default'
      this.edgeHandlerFactories.get('default')!(state)
    );
  }

  /**
   * Sets the factory used by {@link createHandler} to instantiate the handler of a selected vertex.
   *
   * Use it to have maxGraph create a custom {@link VertexHandler} subclass, instead of subclassing this plugin:
   * ```typescript
   * const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
   * selectionCellsHandler.setVertexHandlerFactory((state) => new MyVertexHandler(state));
   * ```
   *
   * It only affects handlers created after this call, so set it before the first selection occurs.
   *
   * @param factory creates the {@link VertexHandler} for the {@link CellState} it receives.
   * @since 0.25.0
   */
  setVertexHandlerFactory(factory: VertexHandlerFactory): void {
    this.vertexHandlerFactory = factory;
  }

  /**
   * Sets the factory used by {@link createEdgeHandler} to instantiate the handler of a selected edge whose
   * `EdgeStyle` is registered under the given {@link EdgeStyleHandlerKind} in {@link EdgeStyleRegistry}.
   *
   * Use it to have maxGraph create a custom {@link EdgeHandler} subclass, instead of subclassing this plugin:
   * ```typescript
   * const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
   * selectionCellsHandler.setEdgeHandlerFactory('elbow', (state) => new MyElbowEdgeHandler(state));
   * ```
   *
   * The three built-in kinds are `'default'`, `'elbow'` and `'segment'`. Custom kinds are supported: register the
   * `EdgeStyle` with `EdgeStyleRegistry.add(name, edgeStyle, { handlerKind: 'my-kind' })`, then declare the matching
   * factory here. Edge styles whose kind has no factory fall back to the `'default'` one.
   *
   * The factory only affects handlers created after this call.
   *
   * @param handlerKind the {@link EdgeStyleHandlerKind} the factory applies to.
   * @param factory creates the {@link EdgeHandler} for the {@link CellState} it receives.
   * @since 0.25.0
   */
  setEdgeHandlerFactory(
    handlerKind: EdgeStyleHandlerKind,
    factory: EdgeHandlerFactory
  ): void {
    this.edgeHandlerFactories.set(handlerKind, factory);
  }

  /**
   * Sets a single factory used by {@link createEdgeHandler} for **every** {@link EdgeStyleHandlerKind}, whatever the
   * `EdgeStyle` of the selected edge.
   *
   * Use it when the same {@link EdgeHandler} implementation fits all edges, instead of repeating
   * {@link setEdgeHandlerFactory} for each kind:
   * ```typescript
   * const selectionCellsHandler = graph.getPlugin<SelectionCellsHandler>('SelectionCellsHandler')!;
   * selectionCellsHandler.setEdgeHandlerFactoryForAllKinds((state) => new MyEdgeHandler(state));
   * ```
   *
   * This also covers the kinds registered in {@link EdgeStyleRegistry} *after* this call, as any kind without a
   * dedicated factory falls back to the `'default'` one.
   *
   * @param factory creates the {@link EdgeHandler} for the {@link CellState} it receives.
   * @since 0.25.0
   *
   * @remarks
   * This **discards all factories previously set with {@link setEdgeHandlerFactory}**, including those declared for
   * custom kinds. Call it before declaring any per-kind factory, not after.
   */
  setEdgeHandlerFactoryForAllKinds(factory: EdgeHandlerFactory): void {
    this.edgeHandlerFactories.clear();
    // 'default' is the fallback of createEdgeHandler, so it now serves every kind
    this.edgeHandlerFactories.set('default', factory);
  }

  /**
   * Returns true if the given handler is active and should not be redrawn.
   */
  isHandlerActive(handler: CellHandler): boolean {
    return !isNullish(handler.index);
  }

  /**
   * Updates the handler for the given shape if one exists.
   */
  updateHandler(state: CellState): void {
    const handler = this.handlers.get(state.cell);
    this.handlers.delete(state.cell);

    if (isNullish(handler)) {
      return;
    }

    // Keeps the state of the gesture in progress, if any, to transfer it to the new handler
    const { index, startX, startY } = handler;
    handler.onDestroy();

    const newHandler = this.createHandler(state);
    this.handlers.set(state.cell, newHandler);

    if (!isNullish(index)) {
      newHandler.start(startX, startY, index);
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
    this.graph.getSelectionModel().removeListener(this.refreshHandler);
    this.graph.getDataModel().removeListener(this.refreshHandler);
    this.graph.getView().removeListener(this.refreshHandler);

    super.destroy();
  }
}

export default SelectionCellsHandler;
