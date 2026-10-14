/*
Copyright 2026-present The maxGraph project Contributors

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

import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import {
  BaseGraph,
  ConnectionConstraint,
  ConstraintHandler,
  type ImageShape,
  InternalMouseEvent,
  Point,
} from '../../../src';

let graph: BaseGraph;
let constraintHandler: ConstraintHandler;

beforeEach(() => {
  graph = new BaseGraph();
  constraintHandler = new ConstraintHandler(graph);
});

afterEach(() => {
  graph.destroy();
});

const createIconStubs = (): ImageShape[] =>
  [{ destroy: jest.fn() }, { destroy: jest.fn() }] as unknown as ImageShape[];

test.each(['reset', 'destroyIcons'] as const)(
  '%s destroys every focus icon',
  (method) => {
    const icons = createIconStubs();
    constraintHandler.focusIcons = icons;

    constraintHandler[method]();

    for (const icon of icons) {
      expect(icon.destroy).toHaveBeenCalledTimes(1);
    }
  }
);

test('setFocus replaces the focus icons by one icon for every constraint', () => {
  const previousIcons = createIconStubs();
  constraintHandler.focusIcons = previousIcons;
  const cell = graph.insertVertex({ position: [0, 0], size: [40, 20] });
  graph.getAllConnectionConstraints = () => [
    new ConnectionConstraint(new Point(0, 0.5), false),
    new ConnectionConstraint(new Point(1, 0.5), false),
  ];

  constraintHandler.setFocus(
    new InternalMouseEvent(new MouseEvent('mousemove')),
    graph.view.getState(cell)!,
    true
  );

  for (const icon of previousIcons) {
    expect(icon.destroy).toHaveBeenCalledTimes(1);
  }
  expect(constraintHandler.focusPoints).toEqual([new Point(0, 10), new Point(40, 10)]);
  expect(constraintHandler.focusIcons).toHaveLength(2);
});
