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
import { Cell, GraphHierarchyEdge, ObjectIdentity } from '../../../../src';

test('stores the identity of every edge it represents', () => {
  const edges = [new Cell(), new Cell(), new Cell()];

  const hierarchyEdge = new GraphHierarchyEdge(edges);

  expect(hierarchyEdge.ids).toEqual(edges.map((edge) => ObjectIdentity.get(edge)));
});
