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
import { BaseRegistry } from '../../src/internal/BaseRegistry';

test('registration', () => {
  const baseRegistry = new BaseRegistry();
  const object = { property: 'value' };
  baseRegistry.add('name', object);

  expect(baseRegistry.get('name')).toBe(object);
  expect(baseRegistry.get('unknown')).toBeNull();
  expect(baseRegistry.get(null)).toBeNull();
  expect(baseRegistry.get(undefined)).toBeNull();
});

test('clear', () => {
  const baseRegistry = new BaseRegistry();
  baseRegistry.add('name', { property: 'value' });
  expect(baseRegistry.get('name')).toBeDefined();

  baseRegistry.clear();

  expect(baseRegistry.get('name')).toBeNull();
});

describe('getName', () => {
  test('no element registered', () => {
    const baseRegistry = new BaseRegistry();
    expect(baseRegistry.getName({ prop1: 'value1' })).toBeNull();
    expect(baseRegistry.getName(null)).toBeNull();
  });

  test('elements registered', () => {
    const baseRegistry = new BaseRegistry();
    baseRegistry.add('element1', { prop: 'value1' });
    baseRegistry.add('element2', { prop: 'value2' });
    const targetObject = { prop: 'match' };
    baseRegistry.add('match', targetObject);
    baseRegistry.add('element3', { prop: 'value3' });

    expect(baseRegistry.getName(targetObject)).toBe('match');
    expect(baseRegistry.getName(null)).toBeNull();
  });
});
