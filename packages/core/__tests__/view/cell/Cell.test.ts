/*
Copyright 2025-present The maxGraph project Contributors

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
import Cell from '../../../src/view/cell/Cell';
import { UserObject } from '../../../src/internal/types';

describe('Cell.hasAttribute', () => {
  test('Cell value is a string', () => {
    const cell = new Cell('label');
    expect(cell.hasAttribute('foo')).toBeFalsy();
  });

  test('Cell value is a random object without Element/UserObject methods', () => {
    const cell = new Cell({ value: 'label' });
    expect(cell.hasAttribute('foo')).toBeFalsy();
  });

  test('Cell value is an Element with a matching attribute name', () => {
    const element = document.createElement('div');
    element.setAttribute('attribute', 'value');
    const cell = new Cell(element);
    expect(cell.hasAttribute('attribute')).toBeTruthy();
  });

  test('Cell value is an Element with no matching attribute name', () => {
    const element = document.createElement('div');
    element.setAttribute('another_attribute', 'value');
    const cell = new Cell(element);
    expect(cell.hasAttribute('attribute')).toBeFalsy();
  });

  test('Cell value is an userObject with hasAttribute returning true', () => {
    const userObject: UserObject = {
      nodeType: 1, // Element node type
      hasAttribute: (_: string) => true,
    };

    const cell = new Cell(userObject);
    expect(cell.hasAttribute('whatever_attribute')).toBeTruthy();
  });

  test('Cell value is an userObject with getAttribute returning non nullish value', () => {
    const userObject: UserObject = {
      nodeType: 1, // Element node type
      getAttribute: (_: string) => 'a value',
    };

    const cell = new Cell(userObject);
    expect(cell.hasAttribute('whatever_attribute')).toBeTruthy();
  });

  test('Cell value is an userObject with getAttribute returning nullish value', () => {
    const userObject: UserObject = {
      nodeType: 1, // Element node type
      getAttribute: (_: string) => null,
    };

    const cell = new Cell(userObject);
    expect(cell.hasAttribute('whatever_attribute')).toBeFalsy();
  });
});
