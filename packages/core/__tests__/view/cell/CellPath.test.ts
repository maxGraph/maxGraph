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
import { Cell } from '../../../src';
import CellPath from '../../../src/view/cell/CellPath';

const createCellWithChildren = (childCount: number): Cell => {
  const cell = new Cell();
  for (let index = 0; index < childCount; index++) {
    cell.insert(new Cell());
  }
  return cell;
};

test('resolve follows every index of the path', () => {
  const root = createCellWithChildren(2);
  const firstChild = root.getChildAt(0);
  firstChild.insert(new Cell());
  const grandChild = new Cell();
  firstChild.insert(grandChild);

  expect(CellPath.resolve(root, '0.1')).toBe(grandChild);
});
