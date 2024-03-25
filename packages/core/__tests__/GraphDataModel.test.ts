/*
Copyright 2022-present The maxGraph project Contributors

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
import { Cell, GraphDataModel } from '../src';

describe('isLayer', () => {
  const dm: GraphDataModel = new GraphDataModel();
  const root: Cell = new Cell();
  dm.setRoot(root);

  test('Child is null', () => {
    // @ts-ignore
    const child: Cell = null;
    expect(dm.isLayer(child)).toBe(false);
  });

  test('Child is not null and is not layer', () => {
    const child: Cell = new Cell();
    expect(dm.isLayer(child)).toBe(false);
  });

  test('Child is not null and is layer', () => {
    const child: Cell = new Cell();
    root.children.push(child);
    child.setParent(root);
    expect(dm.isLayer(child)).toBe(true);
  });
});
