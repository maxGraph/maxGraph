/*
Copyright 2025-present The maxGraph project Contributors

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

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import Cell from '../../../src/view/cell/Cell';
import CellState from '../../../src/view/cell/CellState';
import SelectionHandler from '../../../src/view/plugin/SelectionHandler';
import { type AbstractGraph, BaseGraph, Point } from '../../../src';
import { createBaseGraph } from '../../utils';

let graph: AbstractGraph;
let plugin: SelectionHandler;

beforeEach(() => {
  graph = createBaseGraph({ plugins: [SelectionHandler] });
  plugin = graph.getPlugin<SelectionHandler>('SelectionHandler')!;
});

afterEach(() => {
  graph.destroy();
});

describe('addStates', () => {
  test('add state for a single cell', () => {
    const cell = new Cell();
    const state = new CellState(graph.view, cell, {});
    graph.view.getState = () => state;

    const cellStates = new Map<Cell, CellState>();
    const count = plugin.addStates(cell, cellStates);

    expect(count).toBe(1);
    expect(cellStates.get(cell)).toBe(state);
  });

  test('do not add state if already present', () => {
    const cell = new Cell();
    const state = new CellState(graph.view, cell, {});
    graph.view.getState = () => state;

    const cellStates = new Map<Cell, CellState>();
    cellStates.set(cell, state);
    const count = plugin.addStates(cell, cellStates);

    expect(count).toBe(0);
  });

  test('recursively add states for child cells', () => {
    const parent = new Cell();
    const child = new Cell();
    parent.children = [child];

    const parentState = new CellState(graph.view, parent, {});
    const childState = new CellState(graph.view, child, {});
    graph.view.getState = (c) => (c === parent ? parentState : childState);

    const cellStates = new Map<Cell, CellState>();
    const count = plugin.addStates(parent, cellStates);

    expect(count).toBe(2);
    expect(cellStates.get(parent)).toBe(parentState);
    expect(cellStates.get(child)).toBe(childState);
  });

  test('use getChildCount and getChildAt to let subclasses filter the child cells', () => {
    class CellWithHiddenChildren extends Cell {
      override getChildCount(): number {
        return this.getVisibleChildren().length;
      }

      override getChildAt(index: number): Cell {
        return this.getVisibleChildren()[index];
      }

      private getVisibleChildren(): Cell[] {
        return this.children.filter((child) => child.isVisible());
      }
    }
    const parent = new CellWithHiddenChildren();
    const visibleChild = new Cell();
    const hiddenChild = new Cell();
    hiddenChild.setVisible(false);
    parent.children = [hiddenChild, visibleChild];
    graph.view.getState = (cell) => new CellState(graph.view, cell, {});

    const cellStates = new Map<Cell, CellState>();
    const count = plugin.addStates(parent, cellStates);

    expect(count).toBe(2);
    expect([...cellStates.keys()]).toEqual([parent, visibleChild]);
  });

  test('return 0 if getState returns null', () => {
    const cell = new Cell();
    graph.view.getState = () => null;

    const cellStates = new Map<Cell, CellState>();
    const count = plugin.addStates(cell, cellStates);

    expect(count).toBe(0);
    expect(cellStates.size).toBe(0);
  });
});

describe('moveCells', () => {
  const transparentStyle = { fillColor: 'none', strokeColor: 'none' };

  const insertParentWithChildren = (style: object, childCount: number): Cell[] => {
    const parent = graph.insertVertex({ position: [0, 0], size: [100, 100], style });
    const children = Array.from({ length: childCount }, () =>
      graph.insertVertex({ parent, position: [10, 10], size: [20, 20] })
    );
    return [parent, ...children];
  };

  test('remove the parents left empty and transparent after moving their children', () => {
    plugin.removeEmptyParents = true;
    plugin.scrollOnMove = false;
    const [emptiedParent, childOfEmptiedParent] = insertParentWithChildren(
      transparentStyle,
      1
    );
    const [parentWithChildLeft, movedChild] = insertParentWithChildren(
      transparentStyle,
      2
    );
    const [opaqueParent, childOfOpaqueParent] = insertParentWithChildren(
      { fillColor: 'red' },
      1
    );
    const cellsToMove = [childOfEmptiedParent, movedChild, childOfOpaqueParent];
    plugin.cell = childOfEmptiedParent;

    plugin.moveCells(
      cellsToMove,
      5,
      5,
      false,
      graph.getDefaultParent(),
      new MouseEvent('mouseup')
    );

    expect(graph.getDefaultParent().children).toEqual([
      parentWithChildLeft,
      opaqueParent,
      ...cellsToMove,
    ]);
    expect(emptiedParent.getParent()).toBeNull();
  });
});

describe('updateLivePreview', () => {
  const computePreviewPoints = (geometryPoints: (Point | null)[] | null): Point[] => {
    const source = graph.insertVertex({ position: [0, 0], size: [20, 20] });
    const target = graph.insertVertex({ position: [200, 0], size: [20, 20] });
    const edge = graph.insertEdge({ source, target });
    edge.getGeometry()!.points = geometryPoints as Point[];
    const edgeState = graph.view.getState(edge)!;
    plugin.addStates(edge, plugin.allCells);
    const updatePoints = jest.spyOn(graph.view, 'updatePoints');

    plugin.updateLivePreview(10, 20);

    const firstCallForEdge = updatePoints.mock.calls.find(
      ([state]) => state === edgeState
    )!;
    return firstCallForEdge[1];
  };

  test('translate the geometry points according to the scale and skip the missing ones', () => {
    graph.view.setScale(2);

    const points = computePreviewPoints([new Point(10, 10), null, new Point(30, 40)]);

    expect(points).toEqual([new Point(15, 20), new Point(35, 50)]);
  });

  test('use no point when the geometry has none', () => {
    expect(computePreviewPoints(null)).toEqual([]);
  });
});
