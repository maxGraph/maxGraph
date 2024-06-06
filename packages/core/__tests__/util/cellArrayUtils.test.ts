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
import { getOpposites } from '../../src/util/cellArrayUtils';
import Cell from '../../src/view/cell/Cell';

describe('getOpposites', () => {
  const edges: Cell[] = [];
  const terminal = new Cell();

  // source == terminal
  const edge1 = new Cell();
  edge1.setTerminal(terminal, true);
  const oppositeOfMatchingSource = new Cell();
  edge1.setTerminal(oppositeOfMatchingSource, false);
  edges.push(edge1);
  // target == terminal
  const edge2 = new Cell();
  const oppositeOfMatchingTarget = new Cell();
  edge2.setTerminal(oppositeOfMatchingTarget, true);
  edge2.setTerminal(terminal, false);
  edges.push(edge2);
  // edge without source and target
  const edge3 = new Cell();
  edges.push(edge3);

  // edge with source matching terminal, but no target
  const edge4 = new Cell();
  edge4.setTerminal(terminal, true);
  edges.push(edge4);

  // edge with target matching terminal, but no target
  const edge5 = new Cell();
  edge5.setTerminal(terminal, false);
  edges.push(edge5);

  // edge with no match terminal
  const edge6 = new Cell();
  edge6.setTerminal(new Cell(), true);
  edge6.setTerminal(new Cell(), false);
  edges.push(edge6);

  test('include sources and targets', () => {
    expect(getOpposites(edges, terminal)).toStrictEqual([
      oppositeOfMatchingSource,
      oppositeOfMatchingTarget,
    ]);
  });

  test('include sources', () => {
    expect(getOpposites(edges, terminal, true, false)).toStrictEqual([
      oppositeOfMatchingTarget,
    ]);
  });

  test('include targets', () => {
    expect(getOpposites(edges, terminal, false, true)).toStrictEqual([
      oppositeOfMatchingSource,
    ]);
  });
});
