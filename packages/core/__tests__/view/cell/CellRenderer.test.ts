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
