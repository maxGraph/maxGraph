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

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import {
  BaseGraph,
  type Cell,
  Effects,
  EventObject,
  InternalEvent,
  type UndoableChange,
} from '../../../src';
import { createBaseGraph } from '../../utils';

let graph: BaseGraph;

beforeEach(() => {
  graph = createBaseGraph();
});

afterEach(() => {
  graph.destroy();
});

const insertVertexAt = (x: number): Cell =>
  graph.insertVertex({ position: [x, 0], size: [40, 40] });

describe('animateChanges', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('start every moved cell from its previous position', () => {
    const vertices = [insertVertexAt(0), insertVertexAt(100)];
    const model = graph.getDataModel();
    let changes: UndoableChange[] = [];
    model.addListener(InternalEvent.CHANGE, (_sender: unknown, evt: EventObject) => {
      changes = evt.getProperty('edit').changes;
    });
    model.batchUpdate(() => {
      for (const vertex of vertices) {
        const geometry = vertex.getGeometry()!.clone();
        geometry.y = 200;
        model.setGeometry(vertex, geometry);
      }
    });
    const done = jest.fn();

    Effects.animateChanges(graph, changes, done);

    expect(vertices.map((vertex) => graph.view.getState(vertex)!.y)).toEqual([0, 0]);
    jest.runAllTimers();
    expect(done).toHaveBeenCalledTimes(1);
  });
});

test('cascadeOpacity sets the opacity of every connected edge', () => {
  const source = insertVertexAt(0);
  const edges = [
    graph.insertEdge({ source, target: insertVertexAt(100) }),
    graph.insertEdge({ source, target: insertVertexAt(200) }),
  ];

  Effects.cascadeOpacity(graph, source, 50);

  expect(
    edges.map((edge) => graph.view.getState(edge)!.shape!.node.style.opacity)
  ).toEqual(['0.5', '0.5']);
});
