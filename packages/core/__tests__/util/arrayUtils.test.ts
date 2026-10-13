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

import { describe, expect, test } from '@jest/globals';
import { removeDuplicates } from '../../src/util/arrayUtils';

describe('removeDuplicates', () => {
  test('keep the first occurrence of each value, in the original order', () => {
    expect(removeDuplicates([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
  });

  test('compare objects by reference', () => {
    const object1 = { id: 1 };
    const object2 = { id: 1 };

    expect(removeDuplicates([object1, object2, object1])).toEqual([object1, object2]);
  });

  test('return an empty array for an empty array', () => {
    expect(removeDuplicates([])).toEqual([]);
  });
});
