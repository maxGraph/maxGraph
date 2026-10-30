/*
Copyright 2023-present The maxGraph project Contributors

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

import { expect, jest } from '@jest/globals';
import {
  type AbstractGraph,
  BaseGraph,
  Cell,
  type CellHandle,
  type CellStateStyle,
  Graph,
  type GraphDataModel,
  type GraphOptions,
  type GraphPluginConstructor,
  type Stylesheet,
} from '../src';

/**
 * Creates a `div` to be used as the container of a {@link Graph}, with the given dimensions faked.
 *
 * jsdom computes no layout, so the dimensions a `Graph` reads from its container are always zero unless they are
 * defined as own properties of the element. Dimensions set to `0` are left out, as that is the value jsdom returns
 * anyway.
 *
 * The element is not attached to the document. Append it when the test needs the container to be in the DOM.
 */
export const createContainer = (dimensions: {
  offsetWidth?: number;
  offsetHeight?: number;
  clientWidth?: number;
  clientHeight?: number;
}): HTMLDivElement => {
  const container = document.createElement('div');
  for (const [name, value] of Object.entries(dimensions)) {
    value && Object.defineProperty(container, name, { value, configurable: true });
  }
  return container;
};

/**
 * A registered graph, with the container it had when it was registered.
 *
 * The container is captured at registration because {@link AbstractGraph.destroy} sets `graph.container` to `null`.
 * Reading it at teardown time would therefore give `null` for a graph a test destroyed itself, and its container would
 * stay attached to the document for the rest of the file.
 */
interface RegisteredGraph {
  graph: AbstractGraph;
  container: HTMLElement | null;
}

const createdGraphs: RegisteredGraph[] = [];

/**
 * Registers a graph so that {@link destroyCreatedGraphs} tears it down after the current test.
 *
 * Only needed for a graph that cannot be built with one of the `create*Graph*` helpers below, they register what they
 * return already.
 */
export const registerGraphForTeardown = <T extends AbstractGraph>(graph: T): T => {
  createdGraphs.push({ graph, container: graph.container });
  return graph;
};

/**
 * Destroys the graphs built by the helpers of this module since the last call, and detaches the containers that were
 * added to the document.
 *
 * Wired as a global `afterEach` by `__tests__/setup.ts`, so tests never call this themselves.
 *
 * A graph registers listeners on `document` when it is constructed, through its view and through the plugins, and only
 * {@link AbstractGraph.destroy} removes them. Without this teardown, every graph a test file builds stays alive and
 * subscribed until the whole file is done. A `window` listener exists too, the `resize` of `CellEditorHandler`, but it
 * is installed on the first call to `startEditing`, not at construction.
 *
 * Every graph is destroyed even if one of them throws, and the first error is rethrown once the loop is over. Letting
 * the exception out of the loop would leave the graphs registered after the failing one alive and subscribed, since
 * the registry is drained before the loop starts.
 */
export const destroyCreatedGraphs = (): void => {
  let firstError: unknown = null;

  for (const { graph, container } of createdGraphs.splice(0)) {
    try {
      graph.destroy();
    } catch (error) {
      firstError ??= error;
    }
    container?.remove();
  }

  if (firstError !== null) {
    throw firstError;
  }
};

/**
 * Creates a new {@link Graph}, registered for teardown.
 *
 * Prefer this over `new Graph(...)` in tests, so that the graph is destroyed after the test that built it. It takes
 * the parameters of the {@link Graph} constructor, so the two specializations below cover the common cases.
 */
export const createGraph = (
  container?: HTMLElement,
  model?: GraphDataModel,
  plugins?: GraphPluginConstructor[],
  stylesheet?: Stylesheet | null
): Graph => registerGraphForTeardown(new Graph(container, model, plugins, stylesheet));

/**
 * Creates a new {@link Graph} without `container` (use the default value of the parameters).
 *
 * This is useful when tests don't check the view.
 */
export const createGraphWithoutContainer = (): Graph => createGraph();

/**
 * Creates a new {@link Graph} without any plugins (pass an empty array of plugins).
 */
export const createGraphWithoutPlugins = (): Graph =>
  createGraph(undefined, undefined, []);

/**
 * Creates a new {@link BaseGraph}, registered for teardown.
 *
 * Prefer this over `new BaseGraph(...)` in tests, so that the graph is destroyed after the test that built it.
 */
export const createBaseGraph = (options?: GraphOptions): BaseGraph =>
  registerGraphForTeardown(new BaseGraph(options));

export const hasListener = (eventListeners: { funct: Function }[], listener: Function) =>
  eventListeners.some((l) => l.funct === listener);

export const createCellWithStyle = (style: CellStateStyle): Cell => {
  const cell = new Cell();
  cell.style = style;
  return cell;
};

/**
 * Checks the bounds of the {@link Geometry} of the given {@link Cell}.
 *
 * Compare all bounds at once, so that a failure reports the whole geometry instead of the first
 * property that differs.
 */
export const expectGeometryBounds = (
  cell: Cell,
  expected: { x: number; y: number; width: number; height: number }
): void => {
  const geometry = cell.getGeometry();
  expect({
    x: geometry?.x,
    y: geometry?.y,
    width: geometry?.width,
    height: geometry?.height,
  }).toStrictEqual(expected);
};

/**
 * Creates a {@link CellHandle} whose methods are mocks, with a shape whose style can be read, to check what a handler
 * does to each of its custom handles.
 */
export const createCellHandleStub = (active = false): CellHandle =>
  ({
    active,
    shape: { node: { style: { display: '', visibility: '' } } },
    setVisible: jest.fn(),
    reset: jest.fn(),
    redraw: jest.fn(),
    destroy: jest.fn(),
  }) as unknown as CellHandle;
