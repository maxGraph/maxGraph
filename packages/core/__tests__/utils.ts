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

import { expect } from '@jest/globals';
import {
  type AbstractGraph,
  BaseGraph,
  Cell,
  type CellStateStyle,
  Graph,
  type GraphOptions,
} from '../src';

const createdGraphs: AbstractGraph[] = [];

/**
 * Registers a graph so that {@link destroyCreatedGraphs} tears it down after the current test.
 *
 * Only needed for a graph that cannot be built with one of the `create*Graph*` helpers below, they register what they
 * return already.
 */
export const registerGraphForTeardown = <T extends AbstractGraph>(graph: T): T => {
  createdGraphs.push(graph);
  return graph;
};

/**
 * Destroys the graphs built by the helpers of this module since the last call, and detaches the containers that were
 * added to the document.
 *
 * Wired as a global `afterEach` by `__tests__/setup.ts`, so tests never call this themselves.
 *
 * A graph registers listeners on `document` and on `window` when it is constructed, through its view and through the
 * plugins, and only {@link AbstractGraph.destroy} removes them. Without this teardown, every graph a test file builds
 * stays alive and subscribed until the whole file is done.
 */
export const destroyCreatedGraphs = (): void => {
  for (const graph of createdGraphs.splice(0)) {
    const { container } = graph;
    graph.destroy();
    container?.remove();
  }
};

/**
 * Creates a new {@link Graph} without `container` (use the default value of the parameters).
 *
 * This is useful when tests don't check the view.
 */
export const createGraphWithoutContainer = (): Graph =>
  registerGraphForTeardown(new Graph());

/**
 * Creates a new {@link Graph} without any plugins (pass an empty array of plugins).
 */
export const createGraphWithoutPlugins = (): Graph =>
  registerGraphForTeardown(new Graph(undefined, undefined, []));

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
