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
import { Cell, type CellStateStyle, Graph } from '../src';

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
 * Creates a new {@link Graph} without `container` (use the default value of the parameters).
 *
 * This is useful when tests don't check the view.
 */
export const createGraphWithoutContainer = (): Graph => new Graph();

/**
 * Creates a new {@link Graph} without any plugins (pass an empty array of plugins).
 */
export const createGraphWithoutPlugins = (): Graph => new Graph(undefined, undefined, []);

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
