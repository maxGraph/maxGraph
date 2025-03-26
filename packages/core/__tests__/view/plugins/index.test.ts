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
import { getDefaultPlugins } from '../../../src';

describe('getDefaultPlugins', () => {
  test('returns a new array each time it is called', () => {
    const plugins1 = getDefaultPlugins();
    const plugins2 = getDefaultPlugins();
    expect(plugins1).not.toBe(plugins2);
    expect(plugins1).toEqual(plugins2);
  });

  test('returns an array with the correct length', () => {
    const plugins = getDefaultPlugins();
    // detect any changes in default plugins, order does not matter
    expect(plugins).toHaveLength(8);
  });

  test('returns an array containing only functions', () => {
    const plugins = getDefaultPlugins();
    plugins.forEach((plugin) => {
      expect(typeof plugin).toBe('function');
    });
  });
});
