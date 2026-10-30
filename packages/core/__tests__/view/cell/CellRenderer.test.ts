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
import { CellRenderer, CellState, CellStateStyle } from '../../../src';
import { createGraphWithoutContainer } from '../../utils';

describe('checkPlaceholderStyles', () => {
  test('CellState with unset style', () => {
    expect(new CellRenderer().checkPlaceholderStyles(new CellState())).toBeFalsy();
  });

  test('no matching element in style', () => {
    const cellState = new CellState();
    cellState.style = { shape: 'rectangle' };
    expect(new CellRenderer().checkPlaceholderStyles(cellState)).toBeFalsy();
  });

  describe.each(['fillColor', 'strokeColor'] as Array<keyof CellStateStyle>)(
    'with one matching element in style - property=%s',
    (property: string) => {
      test.each(['inherit', 'swimlane'])('placeholder=%s', (placeholder: string) => {
        const cellState = new CellState();
        cellState.style = { arcSize: 10, rounded: true };
        // @ts-ignore
        cellState.style[property] = placeholder;
        expect(new CellRenderer().checkPlaceholderStyles(cellState)).toBeTruthy();
      });
    }
  );
});

test('insertStateAfter moves every shape of the state after the given node', () => {
  const graph = createGraphWithoutContainer();
  const group = graph.insertVertex({
    value: 'group',
    position: [0, 0],
    size: [100, 100],
  });
  graph.insertVertex({
    parent: group,
    value: 'child',
    position: [10, 10],
    size: [20, 20],
  });
  const anchor = graph.insertVertex({
    value: 'anchor',
    position: [300, 0],
    size: [40, 40],
  });
  const state = graph.view.getState(group)!;
  const anchorNode = graph.view.getState(anchor)!.shape!.node;
  // the shape, the label and the folding icon of the group
  const stateNodes = [state.shape!.node, state.text!.node, state.control!.node];

  const result = graph.cellRenderer.insertStateAfter(state, anchorNode, null);

  const drawPaneNodes = Array.from(graph.view.getDrawPane().childNodes);
  const anchorIndex = drawPaneNodes.indexOf(anchorNode);
  expect(stateNodes.map((node) => drawPaneNodes.indexOf(node))).toEqual([
    anchorIndex + 1,
    anchorIndex + 2,
    anchorIndex + 3,
  ]);
  expect(result).toEqual([state.control!.node, null]);
});
