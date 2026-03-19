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
import MaxWindow from '../../src/gui/MaxWindow';

describe('destroy', () => {
  test('clears eventListeners', () => {
    const content = document.createElement('div');
    document.body.appendChild(content);
    const win = new MaxWindow('Test', content, 0, 0, 100, 100);
    win.addListener('testEvent', () => {});
    expect(win.eventListeners.length).toBeGreaterThan(0);

    win.destroy();

    expect(win.eventListeners).toHaveLength(0);
  });
});
