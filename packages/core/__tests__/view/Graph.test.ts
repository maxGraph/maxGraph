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

import { describe, test, expect } from '@jest/globals';
import { type AbstractGraph, Cell, Graph, Multiplicity } from '../../src';
import { createGraphWithoutPlugins } from '../utils';

test('setTooltips - the "TooltipHandler" plugin is not available', () => {
  const graph = createGraphWithoutPlugins();
  // just validate there is no error in this case
  graph.setTooltips(true);
});

describe('Expect no global state for properties coming from mixins', () => {
  // Even though SelectionMixin declares `selectionModel: null` on the prototype,
  // the null value is harmless because Graph.initializeCollaborators calls
  // this.setSelectionModel(this.createSelectionModel()). The assignment creates
  // a per-instance property that shadows the prototype null, and GraphSelectionModel's
  // constructor allocates its own `cells = []` array.
  test('selectionModel', () => {
    const graph1 = new Graph();
    const graph2 = new Graph();

    expect(graph1.getSelectionModel()).not.toBe(graph2.getSelectionModel());

    graph1.getSelectionModel().cells.push(new Cell());
    expect(graph2.getSelectionModel().cells).toStrictEqual([]);
    expect(graph1.getSelectionModel().cells).not.toBe(graph2.getSelectionModel().cells);
  });

  // `mixInto` installs mixin members on the AbstractGraph prototype, so a mutable default (object or
  // array) declared in a mixin would be shared by every Graph instance: mutating it on one graph would
  // mutate it for all of them, with no compile error to signal it.
  //
  // The properties below are declared directly in AbstractGraph, in the "Variables that should be in the
  // mixins but requiring per-instance initialization" group, precisely to avoid that. These tests pin that
  // guarantee down, so moving one of them into a mixin fails here instead of silently corrupting state.
  //
  // When adding a property to that group, add a case here too.
  type PerInstanceProperty = {
    name: string;
    /** Reads the property under test on a graph. */
    read: (graph: AbstractGraph) => object;
    /** Alters the value in place, the way user code would. */
    mutate: (value: never) => void;
    /** Extracts what the mutation is expected to change, to compare two graphs without deep equality. */
    signature: (value: never) => unknown;
  };

  const perInstanceProperties: PerInstanceProperty[] = [
    {
      name: 'alternateEdgeStyle',
      read: (graph) => graph.alternateEdgeStyle,
      mutate: (value: { fillColor?: string }) => (value.fillColor = 'red'),
      signature: (value: { fillColor?: string }) => value.fillColor,
    },
    {
      name: 'cells',
      read: (graph) => graph.cells,
      mutate: (value: Cell[]) => value.push(new Cell()),
      signature: (value: Cell[]) => value.length,
    },
    {
      name: 'mouseListeners',
      read: (graph) => graph.mouseListeners,
      mutate: (value: object[]) =>
        value.push({ mouseDown: () => {}, mouseMove: () => {}, mouseUp: () => {} }),
      signature: (value: object[]) => value.length,
    },
    {
      name: 'multiplicities',
      read: (graph) => graph.multiplicities,
      mutate: (value: Multiplicity[]) =>
        value.push(new Multiplicity(true, 'type', null, null, 0, 1, null, null, null)),
      signature: (value: Multiplicity[]) => value.length,
    },
    {
      name: 'options',
      read: (graph) => graph.options,
      mutate: (value: { foldingEnabled: boolean }) => (value.foldingEnabled = false),
      signature: (value: { foldingEnabled: boolean }) => value.foldingEnabled,
    },
    {
      name: 'pageFormat',
      read: (graph) => graph.pageFormat,
      mutate: (value: { width: number }) => (value.width = 42),
      signature: (value: { width: number }) => value.width,
    },
    {
      name: 'warningImage',
      read: (graph) => graph.warningImage,
      mutate: (value: { src: string }) => (value.src = 'mutated.png'),
      signature: (value: { src: string }) => value.src,
    },
  ];

  test.each(perInstanceProperties)('$name', ({ read, mutate, signature }) => {
    const graph1 = new Graph();
    const graph2 = new Graph();

    const value1 = read(graph1) as never;
    const value2 = read(graph2) as never;

    expect(value1).not.toBe(value2);
    expect(signature(value1)).toStrictEqual(signature(value2));

    const graph2SignatureBeforeMutation = signature(value2);
    mutate(value1);

    // the mutation is effective, so the assertion below cannot pass by accident
    expect(signature(value1)).not.toStrictEqual(graph2SignatureBeforeMutation);
    // and it did not leak to the other graph
    expect(signature(value2)).toStrictEqual(graph2SignatureBeforeMutation);
  });
});
