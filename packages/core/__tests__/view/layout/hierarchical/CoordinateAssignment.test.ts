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

import { expect, test } from '@jest/globals';
import {
  Cell,
  CoordinateAssignment,
  GraphHierarchyEdge,
  GraphHierarchyNode,
  HierarchicalLayout,
} from '../../../../src';
import { createGraphWithoutContainer } from '../../../utils';

test.each([
  ['a vertex', () => new GraphHierarchyNode(new Cell()), 1 + 2 + 2],
  ['an edge', () => new GraphHierarchyEdge([]), 2 + 8 + 8],
])(
  'calculatedWeightedValue of %s sums the weight of every connected cell',
  (_kind, createCell, expectedWeight) => {
    const coordinateAssignment = new CoordinateAssignment(
      new HierarchicalLayout(createGraphWithoutContainer()),
      30,
      100,
      'north',
      0
    );
    const connectedCells = [
      new GraphHierarchyNode(new Cell()),
      new GraphHierarchyEdge([]),
      new GraphHierarchyEdge([]),
    ];

    const weight = coordinateAssignment.calculatedWeightedValue(
      createCell(),
      connectedCells
    );

    expect(weight).toBe(expectedWeight);
  }
);
