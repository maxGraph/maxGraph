/*
Copyright 2024-present The maxGraph project Contributors

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

import { describe, expect, test } from '@jest/globals';
import { createCellWithStyle, createGraphWithoutPlugins } from '../../utils';
import {
  Cell,
  type CellStyle,
  type EventObject,
  type Graph,
  InternalEvent,
} from '../../../src';

describe('isCellEditable', () => {
  test('Using defaults', () => {
    expect(createGraphWithoutPlugins().isCellEditable(new Cell())).toBeTruthy();
  });

  test('Using Cell with the "editable" style property set to "true"', () => {
    expect(
      createGraphWithoutPlugins().isCellEditable(createCellWithStyle({ editable: true }))
    ).toBeTruthy();
  });

  test('Using Cell with the "editable" style property set to "false"', () => {
    expect(
      createGraphWithoutPlugins().isCellEditable(createCellWithStyle({ editable: false }))
    ).toBeFalsy();
  });

  test('Cells not editable in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsEditable(false);
    expect(graph.isCellEditable(new Cell())).toBeFalsy();
  });

  test('Cells locked in Graph', () => {
    const graph = createGraphWithoutPlugins();
    graph.setCellsLocked(true);
    expect(graph.isCellEditable(new Cell())).toBeFalsy();
  });
});

const captureEditingEvents = (graph: Graph) => {
  const startEditingCellIds: string[] = [];
  const editingStartedCellIds: string[] = [];
  graph.addListener(InternalEvent.START_EDITING, (_sender: unknown, evt: EventObject) => {
    startEditingCellIds.push(evt.getProperty('cell').getId());
  });
  graph.addListener(
    InternalEvent.EDITING_STARTED,
    (_sender: unknown, evt: EventObject) => {
      editingStartedCellIds.push(evt.getProperty('cell').getId());
    }
  );
  return { startEditingCellIds, editingStartedCellIds };
};

const createGraphWithSelectedVertex = (style: CellStyle = {}) => {
  const graph = createGraphWithoutPlugins();
  const vertex = graph.insertVertex({
    value: 'vertex',
    position: [10, 10],
    size: [80, 30],
    style,
  });
  graph.setSelectionCell(vertex);
  return { graph, vertex, events: captureEditingEvents(graph) };
};

describe('startEditingAtCell', () => {
  test('Start editing the given cell', () => {
    const { graph, events } = createGraphWithSelectedVertex();
    const otherVertex = graph.insertVertex({
      value: 'other',
      position: [200, 10],
      size: [80, 30],
    });

    graph.startEditingAtCell(otherVertex);

    expect(events.startEditingCellIds).toEqual([otherVertex.getId()]);
    expect(events.editingStartedCellIds).toEqual([otherVertex.getId()]);
  });

  test('Start editing the selection cell when no cell is given', () => {
    const { graph, vertex, events } = createGraphWithSelectedVertex();

    graph.startEditingAtCell(null);

    expect(events.startEditingCellIds).toEqual([vertex.getId()]);
    expect(events.editingStartedCellIds).toEqual([vertex.getId()]);
  });

  test.each([
    ['the selection is empty', (graph: Graph) => graph.clearSelection()],
    [
      'the selection cell is not editable',
      (graph: Graph) => graph.setCellsEditable(false),
    ],
    ['the selection cell is locked', (graph: Graph) => graph.setCellsLocked(true)],
  ])('Do not start editing when no cell is given and %s', (_description, configure) => {
    const { graph, events } = createGraphWithSelectedVertex();
    configure(graph);

    graph.startEditingAtCell(null);

    expect(events.startEditingCellIds).toEqual([]);
    expect(events.editingStartedCellIds).toEqual([]);
  });

  test('Do not start editing when no cell is given and the selection cell style is not editable', () => {
    const { graph, events } = createGraphWithSelectedVertex({ editable: false });

    graph.startEditingAtCell(null);

    expect(events.startEditingCellIds).toEqual([]);
    expect(events.editingStartedCellIds).toEqual([]);
  });
});

describe('startEditing', () => {
  test('Start editing the selection cell', () => {
    const { graph, vertex, events } = createGraphWithSelectedVertex();

    graph.startEditing(new MouseEvent('dblclick'));

    expect(events.startEditingCellIds).toEqual([vertex.getId()]);
    expect(events.editingStartedCellIds).toEqual([vertex.getId()]);
  });
});
